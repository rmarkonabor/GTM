import { inngest } from "@/../inngest/client";
import { prisma } from "@/lib/db/client";
import { safeDecrypt } from "@/lib/crypto";
import { LLMPreference } from "@/types/gtm";
import { buildContextFromDB, buildStepContext } from "@/lib/workflow/context-builder";
import { getLanguageModel } from "@/lib/ai/providers";
import { buildStrategyPrompt, buildEmailPrompt } from "@/lib/ai/prompts/cold-email";
import { generateObject } from "ai";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────

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

export type ColdEmailStep = "strategy" | "email_1" | "follow_up_1" | "follow_up_2" | "break_up_email";

export const NEXT_STEP: Record<ColdEmailStep, ColdEmailStep | null> = {
  strategy:       "email_1",
  email_1:        "follow_up_1",
  follow_up_1:    "follow_up_2",
  follow_up_2:    "break_up_email",
  break_up_email: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateWithTimeout(params: { model: any; schema: any; prompt: string }, ms: number, label: string): Promise<any> {
  const controller = new AbortController();

  // Promise.race guarantees we don't hang if the LLM SDK ignores AbortSignal.
  // AbortController still attempts to cancel the underlying HTTP request.
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => {
      controller.abort();
      reject(new Error(`Timed out after ${ms / 1000}s (${label})`));
    }, ms)
  );

  try {
    return await Promise.race([
      generateObject({
        model: params.model,
        schema: params.schema,
        prompt: params.prompt,
        maxRetries: 0,
        abortSignal: controller.signal,
      }).then((r) => r.object),
      timeoutPromise,
    ]);
  } catch (err) {
    controller.abort(); // clean up if LLM threw before timeout
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
  return {
    context: buildStepContext(ctx),
    model: getLanguageModel(llmPreference.provider, llmPreference.apiKey, "cold-email"),
  };
}

async function loadDraft(projectId: string): Promise<Record<string, unknown>> {
  const row = await prisma.project.findUnique({ where: { id: projectId }, select: { coldEmailDraft: true } });
  return (row?.coldEmailDraft ?? {}) as Record<string, unknown>;
}

// ─── Function ─────────────────────────────────────────────────────────────────
//
// Architecture: one small function per step, triggered by separate events.
// No waitForEvent — no replay complexity, no timing races.
//
// POST /api/.../cold-email    → sends gtm/cold-email.run-step { step: "strategy" }
// PATCH /api/.../cold-email   → sends gtm/cold-email.run-step { step: "email_1" | ... }

export const coldEmailGenerator = inngest.createFunction(
  {
    id: "cold-email-generator",
    retries: 0,
    triggers: [{ event: "gtm/cold-email.run-step" }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onFailure: async ({ event, error }: any) => {
      const original = (event?.data?.event?.data ?? {}) as { projectId?: string };
      const { projectId } = original;
      console.error("[cold-email] onFailure", { projectId, error: error?.message });
      if (!projectId) return;
      await mergeDraft(projectId, {
        status: "ERROR",
        error: error?.message ?? "Generation failed. Please try again.",
      }).catch((e) => console.error("[cold-email] onFailure DB write failed", e));
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event }: any) => {
    const { projectId, targetMarketName, step } = event.data as {
      projectId: string;
      targetMarketName: string;
      step: ColdEmailStep;
    };
    console.log("[cold-email] running step", { projectId, step });

    const PROGRESS_FOR_STEP: Record<ColdEmailStep, string> = {
      strategy:       "strategy",
      email_1:        "email_1",
      follow_up_1:    "follow_up_1",
      follow_up_2:    "follow_up_2",
      break_up_email: "break_up_email",
    };

    await mergeDraft(projectId, {
      status: "RUNNING",
      targetMarketName,
      progress: PROGRESS_FOR_STEP[step],
      awaitingApprovalFor: null,
    });

    try {
      const { model, context } = await loadModelAndContext(projectId);

      if (step === "strategy") {
        const prompt = buildStrategyPrompt(context, targetMarketName);
        const object = await generateWithTimeout({ model, schema: StrategySchema, prompt }, 90_000, "strategy");
        await mergeDraft(projectId, {
          ...object,
          status: "AWAITING_APPROVAL",
          awaitingApprovalFor: "strategy",
          progress: null,
        });
        console.log("[cold-email] strategy done");
        return;
      }

      // All email steps need the existing draft for context
      const draft = await loadDraft(projectId);
      const strategySummary = (draft.strategy_summary as string | undefined) ?? "";

      if (step === "email_1") {
        const prompt = buildEmailPrompt(context, targetMarketName, "email_1", strategySummary);
        const object = await generateWithTimeout({ model, schema: EmailSchema, prompt }, 90_000, "email_1");
        await mergeDraft(projectId, {
          email_1: object,
          status: "AWAITING_APPROVAL",
          awaitingApprovalFor: "email_1",
          progress: null,
        });
        console.log("[cold-email] email_1 done");
        return;
      }

      if (step === "follow_up_1") {
        const email1Body = ((draft.email_1 as { body?: string } | undefined)?.body) ?? "";
        const prompt = buildEmailPrompt(context, targetMarketName, "follow_up_1", strategySummary,
          [{ type: "email_1", body: email1Body }]
        );
        const object = await generateWithTimeout({ model, schema: EmailSchema, prompt }, 90_000, "follow_up_1");
        await mergeDraft(projectId, {
          follow_up_1: object,
          status: "AWAITING_APPROVAL",
          awaitingApprovalFor: "follow_up_1",
          progress: null,
        });
        console.log("[cold-email] follow_up_1 done");
        return;
      }

      if (step === "follow_up_2") {
        const email1Body = ((draft.email_1 as { body?: string } | undefined)?.body) ?? "";
        const fu1Body   = ((draft.follow_up_1 as { body?: string } | undefined)?.body) ?? "";
        const prompt = buildEmailPrompt(context, targetMarketName, "follow_up_2", strategySummary,
          [{ type: "email_1", body: email1Body }, { type: "follow_up_1", body: fu1Body }]
        );
        const object = await generateWithTimeout({ model, schema: EmailSchema, prompt }, 90_000, "follow_up_2");
        await mergeDraft(projectId, {
          follow_up_2: object,
          status: "AWAITING_APPROVAL",
          awaitingApprovalFor: "follow_up_2",
          progress: null,
        });
        console.log("[cold-email] follow_up_2 done");
        return;
      }

      if (step === "break_up_email") {
        const email1Body = ((draft.email_1     as { body?: string } | undefined)?.body) ?? "";
        const fu1Body    = ((draft.follow_up_1 as { body?: string } | undefined)?.body) ?? "";
        const fu2Body    = ((draft.follow_up_2 as { body?: string } | undefined)?.body) ?? "";
        const prompt = buildEmailPrompt(context, targetMarketName, "break_up_email", strategySummary,
          [
            { type: "email_1",     body: email1Body },
            { type: "follow_up_1", body: fu1Body },
            { type: "follow_up_2", body: fu2Body },
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
        console.log("[cold-email] break_up_email done — COMPLETE");
        return;
      }

      throw new Error(`Unknown step: ${step}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Step ${step} failed`;
      console.error(`[cold-email] ${step} error:`, msg);
      await mergeDraft(projectId, { status: "ERROR", error: msg }).catch(() => {});
      throw err;
    }
  }
);
