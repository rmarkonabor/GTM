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

/**
 * Generates an object with a hard timeout that properly aborts the
 * underlying HTTP request — not just a Promise.race that wins but leaves
 * the fetch open (which prevents the serverless function from terminating).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateWithTimeout(
  params: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema: any;
    prompt: string;
  },
  ms: number,
  label: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(new Error(`Timed out after ${ms / 1000}s (${label})`)),
    ms
  );
  try {
    const { object } = await generateObject({
      model: params.model,
      schema: params.schema,
      prompt: params.prompt,
      maxRetries: 0,
      abortSignal: controller.signal,
    });
    clearTimeout(timeoutId);
    return object;
  } catch (err) {
    clearTimeout(timeoutId);
    // If we aborted due to timeout, surface a clearer error
    if (controller.signal.aborted) {
      throw new Error(`Timed out after ${ms / 1000}s (${label})`);
    }
    throw err;
  }
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
    // Cancel any existing run for the same project when a new one is triggered
    cancelOn: [
      {
        event: "gtm/cold-email.generate",
        match: "data.projectId",
      },
    ],
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

    // Mark RUNNING on the very first invocation only (when status is PENDING).
    // On replays after waitForEvent, the PATCH handler already set status=RUNNING
    // so we skip this to avoid overwriting `progress` with "strategy" when we're
    // actually mid-sequence (e.g., about to run email_1).
    const existing = await prisma.project.findUnique({
      where: { id: projectId },
      select: { coldEmailDraft: true },
    });
    const currentStatus = (existing?.coldEmailDraft as Record<string, unknown> | null)?.status;
    if (currentStatus === "PENDING" || currentStatus === "RUNNING") {
      await mergeDraft(projectId, {
        status: "RUNNING",
        targetMarketName,
        progress: "strategy",
        startedAt: new Date().toISOString(),
      });
    }

    // ── Step 1: Strategy + subject lines ──────────────────────────────────────
    const strategy = await step.run("gen-strategy", async () => {
      console.log("[cold-email] gen-strategy start");
      try {
        const { model, context } = await loadModelAndContext(projectId);
        const prompt = buildStrategyPrompt(context, targetMarketName);
        const object = await generateWithTimeout({ model, schema: StrategySchema, prompt }, 90_000, "strategy");
        await mergeDraft(projectId, {
          ...object,
          status: "AWAITING_APPROVAL",
          awaitingApprovalFor: "strategy",
          progress: null,
        });
        console.log("[cold-email] gen-strategy done — awaiting approval");
        return object;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Strategy generation failed";
        console.error("[cold-email] gen-strategy error:", msg);
        await mergeDraft(projectId, { status: "ERROR", error: msg }).catch(() => {});
        throw err;
      }
    });

    // Wait for user approval
    await step.waitForEvent("wait-for-strategy-approval", {
      event: "cold-email/step.approved",
      match: "data.projectId",
      timeout: "48h",
    });

    // ── Step 2: Email 1 ───────────────────────────────────────────────────────
    const email1 = await step.run("gen-email-1", async () => {
      console.log("[cold-email] gen-email-1 start");
      try {
        await mergeDraft(projectId, { status: "RUNNING", awaitingApprovalFor: null, progress: "email_1" });
        const { model, context } = await loadModelAndContext(projectId);
        const prompt = buildEmailPrompt(context, targetMarketName, "email_1", strategy.strategy_summary);
        const object = await generateWithTimeout({ model, schema: EmailSchema, prompt }, 90_000, "email_1");
        await mergeDraft(projectId, {
          email_1: object,
          status: "AWAITING_APPROVAL",
          awaitingApprovalFor: "email_1",
          progress: null,
        });
        console.log("[cold-email] gen-email-1 done — awaiting approval");
        return object;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Email 1 generation failed";
        console.error("[cold-email] gen-email-1 error:", msg);
        await mergeDraft(projectId, { status: "ERROR", error: msg }).catch(() => {});
        throw err;
      }
    });

    await step.waitForEvent("wait-for-email1-approval", {
      event: "cold-email/step.approved",
      match: "data.projectId",
      timeout: "48h",
    });

    // ── Step 3: Follow-up 1 ───────────────────────────────────────────────────
    const followUp1 = await step.run("gen-follow-up-1", async () => {
      console.log("[cold-email] gen-follow-up-1 start");
      try {
        await mergeDraft(projectId, { status: "RUNNING", awaitingApprovalFor: null, progress: "follow_up_1" });
        const { model, context } = await loadModelAndContext(projectId);
        const prompt = buildEmailPrompt(
          context, targetMarketName, "follow_up_1", strategy.strategy_summary,
          [{ type: "email_1", body: email1.body }]
        );
        const object = await generateWithTimeout({ model, schema: EmailSchema, prompt }, 90_000, "follow_up_1");
        await mergeDraft(projectId, {
          follow_up_1: object,
          status: "AWAITING_APPROVAL",
          awaitingApprovalFor: "follow_up_1",
          progress: null,
        });
        console.log("[cold-email] gen-follow-up-1 done — awaiting approval");
        return object;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Follow-up 1 generation failed";
        console.error("[cold-email] gen-follow-up-1 error:", msg);
        await mergeDraft(projectId, { status: "ERROR", error: msg }).catch(() => {});
        throw err;
      }
    });

    await step.waitForEvent("wait-for-followup1-approval", {
      event: "cold-email/step.approved",
      match: "data.projectId",
      timeout: "48h",
    });

    // ── Step 4: Follow-up 2 ───────────────────────────────────────────────────
    const followUp2 = await step.run("gen-follow-up-2", async () => {
      console.log("[cold-email] gen-follow-up-2 start");
      try {
        await mergeDraft(projectId, { status: "RUNNING", awaitingApprovalFor: null, progress: "follow_up_2" });
        const { model, context } = await loadModelAndContext(projectId);
        const prompt = buildEmailPrompt(
          context, targetMarketName, "follow_up_2", strategy.strategy_summary,
          [{ type: "email_1", body: email1.body }, { type: "follow_up_1", body: followUp1.body }]
        );
        const object = await generateWithTimeout({ model, schema: EmailSchema, prompt }, 90_000, "follow_up_2");
        await mergeDraft(projectId, {
          follow_up_2: object,
          status: "AWAITING_APPROVAL",
          awaitingApprovalFor: "follow_up_2",
          progress: null,
        });
        console.log("[cold-email] gen-follow-up-2 done — awaiting approval");
        return object;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Follow-up 2 generation failed";
        console.error("[cold-email] gen-follow-up-2 error:", msg);
        await mergeDraft(projectId, { status: "ERROR", error: msg }).catch(() => {});
        throw err;
      }
    });

    await step.waitForEvent("wait-for-followup2-approval", {
      event: "cold-email/step.approved",
      match: "data.projectId",
      timeout: "48h",
    });

    // ── Step 5: Break-up email (no approval — completes the sequence) ─────────
    await step.run("gen-break-up", async () => {
      console.log("[cold-email] gen-break-up start");
      try {
        await mergeDraft(projectId, { status: "RUNNING", awaitingApprovalFor: null, progress: "break_up_email" });
        const { model, context } = await loadModelAndContext(projectId);
        const prompt = buildEmailPrompt(
          context, targetMarketName, "break_up_email", strategy.strategy_summary,
          [
            { type: "email_1", body: email1.body },
            { type: "follow_up_1", body: followUp1.body },
            { type: "follow_up_2", body: followUp2.body },
          ]
        );
        const object = await generateWithTimeout({ model, schema: EmailSchema, prompt }, 90_000, "break_up_email");
        await mergeDraft(projectId, {
          break_up_email: object,
          status: "COMPLETE",
          completedAt: new Date().toISOString(),
          awaitingApprovalFor: null,
          progress: null,
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
