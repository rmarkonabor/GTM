import { inngest } from "@/../inngest/client";
import { prisma } from "@/lib/db/client";
import { safeDecrypt } from "@/lib/crypto";
import { LLMPreference } from "@/types/gtm";
import { buildContextFromDB, buildStepContext } from "@/lib/workflow/context-builder";
import { getLanguageModel } from "@/lib/ai/providers";
import { buildStrategyPrompt, buildEmailPrompt } from "@/lib/ai/prompts/cold-email";
import { generateObject } from "ai";
import { z } from "zod";

// ─── Schemas (small and focused — one per call) ───────────────────────────────

const StrategySchema = z.object({
  strategy_summary: z.string(),
  campaign_brief: z.string(),
  subject_lines: z.array(z.object({ text: z.string(), rationale: z.string() })).min(1).max(3),
  missing_inputs: z.array(z.string()),
});

const EmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
  waitDays: z.number().int().min(0),
  angle: z.string(),
  annotations: z.array(z.object({
    part: z.enum(["subject", "opener", "body", "cta", "closing"]),
    metric: z.enum(["open_rate", "reply_rate", "engagement", "click_rate"]),
    impact: z.string(),
  })).min(1).max(4),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms / 1000}s (${label})`)), ms)
    ),
  ]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function mergeDraft(projectId: string, update: any): Promise<void> {
  const row = await prisma.project.findUnique({ where: { id: projectId }, select: { coldEmailDraft: true } });
  const current = (row?.coldEmailDraft ?? {}) as Record<string, unknown>;
  await prisma.project.update({
    where: { id: projectId },
    data: { coldEmailDraft: { ...current, ...update } },
  });
}

async function loadModelAndContext(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { user: true } });
  if (!project) throw new Error("Project not found");
  const llmRaw = safeDecrypt(project.user?.llmPreference ?? null);
  if (!llmRaw) throw new Error("No LLM API key configured — add it in Settings.");
  const llmPreference = JSON.parse(llmRaw) as LLMPreference;
  const ctx = await buildContextFromDB(projectId);
  if (!ctx) throw new Error("Project context not found");
  const context = buildStepContext(ctx);
  const model = getLanguageModel(llmPreference.provider, llmPreference.apiKey, "cold-email");
  return { model, context };
}

// ─── Function ─────────────────────────────────────────────────────────────────

export const coldEmailGenerator = inngest.createFunction(
  {
    id: "cold-email-generator",
    retries: 0,
    triggers: [{ event: "gtm/cold-email.generate" }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onFailure: async ({ event, error }: any) => {
      const original = (event?.data?.event?.data ?? {}) as { projectId?: string; targetMarketName?: string };
      const { projectId, targetMarketName } = original;
      console.error("[cold-email] onFailure", { projectId, error: error?.message });
      if (!projectId) return;
      await mergeDraft(projectId, {
        status: "ERROR",
        targetMarketName: targetMarketName ?? "",
        error: error?.message ?? "Generation failed. Please try again.",
      }).catch((e) => console.error("[cold-email] onFailure DB write failed", e));
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: any) => {
    const { projectId, targetMarketName } = event.data as { projectId: string; targetMarketName: string };
    console.log("[cold-email] starting", { projectId, targetMarketName });

    // Mark RUNNING immediately
    await mergeDraft(projectId, {
      status: "RUNNING",
      targetMarketName,
      progress: "strategy",
      startedAt: new Date().toISOString(),
    });

    // ── Step 1: Strategy + subject lines ──────────────────────────────────────
    const strategy = await step.run("gen-strategy", async () => {
      console.log("[cold-email] gen-strategy start");
      try {
        const { model, context } = await loadModelAndContext(projectId);
        const prompt = buildStrategyPrompt(context, targetMarketName);
        const { object } = await withTimeout(
          generateObject({ model, schema: StrategySchema, prompt, maxRetries: 0 }),
          60_000, "strategy"
        );
        await mergeDraft(projectId, { ...object, progress: "email_1" });
        console.log("[cold-email] gen-strategy done");
        return object;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Strategy generation failed";
        console.error("[cold-email] gen-strategy error:", msg);
        await mergeDraft(projectId, { status: "ERROR", error: msg }).catch(() => {});
        throw err;
      }
    });

    // ── Step 2: Email 1 ───────────────────────────────────────────────────────
    const email1 = await step.run("gen-email-1", async () => {
      console.log("[cold-email] gen-email-1 start");
      try {
        const { model, context } = await loadModelAndContext(projectId);
        const prompt = buildEmailPrompt(context, targetMarketName, "email_1", strategy.strategy_summary);
        const { object } = await withTimeout(
          generateObject({ model, schema: EmailSchema, prompt, maxRetries: 0 }),
          60_000, "email_1"
        );
        await mergeDraft(projectId, { email_1: object, progress: "follow_up_1" });
        console.log("[cold-email] gen-email-1 done");
        return object;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Email 1 generation failed";
        console.error("[cold-email] gen-email-1 error:", msg);
        await mergeDraft(projectId, { status: "ERROR", error: msg }).catch(() => {});
        throw err;
      }
    });

    // ── Step 3: Follow-up 1 ───────────────────────────────────────────────────
    const followUp1 = await step.run("gen-follow-up-1", async () => {
      console.log("[cold-email] gen-follow-up-1 start");
      try {
        const { model, context } = await loadModelAndContext(projectId);
        const prompt = buildEmailPrompt(
          context, targetMarketName, "follow_up_1", strategy.strategy_summary,
          [{ type: "email_1", body: email1.body }]
        );
        const { object } = await withTimeout(
          generateObject({ model, schema: EmailSchema, prompt, maxRetries: 0 }),
          60_000, "follow_up_1"
        );
        await mergeDraft(projectId, { follow_up_1: object, progress: "follow_up_2" });
        console.log("[cold-email] gen-follow-up-1 done");
        return object;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Follow-up 1 generation failed";
        console.error("[cold-email] gen-follow-up-1 error:", msg);
        await mergeDraft(projectId, { status: "ERROR", error: msg }).catch(() => {});
        throw err;
      }
    });

    // ── Step 4: Follow-up 2 ───────────────────────────────────────────────────
    const followUp2 = await step.run("gen-follow-up-2", async () => {
      console.log("[cold-email] gen-follow-up-2 start");
      try {
        const { model, context } = await loadModelAndContext(projectId);
        const prompt = buildEmailPrompt(
          context, targetMarketName, "follow_up_2", strategy.strategy_summary,
          [{ type: "email_1", body: email1.body }, { type: "follow_up_1", body: followUp1.body }]
        );
        const { object } = await withTimeout(
          generateObject({ model, schema: EmailSchema, prompt, maxRetries: 0 }),
          60_000, "follow_up_2"
        );
        await mergeDraft(projectId, { follow_up_2: object, progress: "break_up_email" });
        console.log("[cold-email] gen-follow-up-2 done");
        return object;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Follow-up 2 generation failed";
        console.error("[cold-email] gen-follow-up-2 error:", msg);
        await mergeDraft(projectId, { status: "ERROR", error: msg }).catch(() => {});
        throw err;
      }
    });

    // ── Step 5: Break-up email ────────────────────────────────────────────────
    await step.run("gen-break-up", async () => {
      console.log("[cold-email] gen-break-up start");
      try {
        const { model, context } = await loadModelAndContext(projectId);
        const prompt = buildEmailPrompt(
          context, targetMarketName, "break_up_email", strategy.strategy_summary,
          [
            { type: "email_1", body: email1.body },
            { type: "follow_up_1", body: followUp1.body },
            { type: "follow_up_2", body: followUp2.body },
          ]
        );
        const { object } = await withTimeout(
          generateObject({ model, schema: EmailSchema, prompt, maxRetries: 0 }),
          60_000, "break_up_email"
        );
        await mergeDraft(projectId, {
          break_up_email: object,
          status: "COMPLETE",
          completedAt: new Date().toISOString(),
          progress: undefined,
        });
        console.log("[cold-email] gen-break-up done — COMPLETE");
        return object;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Break-up email generation failed";
        console.error("[cold-email] gen-break-up error:", msg);
        await mergeDraft(projectId, { status: "ERROR", error: msg }).catch(() => {});
        throw err;
      }
    });

    return { ok: true };
  }
);
