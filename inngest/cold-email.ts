import { inngest } from "@/../inngest/client";
import { prisma } from "@/lib/db/client";
import { safeDecrypt } from "@/lib/crypto";
import { LLMPreference } from "@/types/gtm";
import { buildContextFromDB, buildStepContext } from "@/lib/workflow/context-builder";
import { getLanguageModel } from "@/lib/ai/providers";
import { buildColdEmailPrompt } from "@/lib/ai/prompts/cold-email";
import { generateObject } from "ai";
import { z } from "zod";

const EmailAnnotationSchema = z.object({
  part: z.enum(["subject", "opener", "body", "cta", "closing"]),
  text: z.string(),
  metric: z.enum(["open_rate", "reply_rate", "engagement", "click_rate"]),
  impact: z.string(),
});

const SubjectLineSchema = z.object({
  text: z.string(),
  rationale: z.string(),
});

const ColdEmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
  waitDays: z.number().int().min(0),
  angle: z.string(),
  annotations: z.array(EmailAnnotationSchema).min(1).max(6),
});

const QualityCheckSchema = z.object({
  word_count_email_1: z.number().int(),
  feels_human: z.boolean(),
  no_buzzwords: z.boolean(),
  prospect_focused: z.boolean(),
  cta_easy_to_reply: z.boolean(),
  notes: z.string().optional(),
});

const ColdEmailOutputSchema = z.object({
  strategy_summary: z.string(),
  campaign_brief: z.string(),
  subject_lines: z.array(SubjectLineSchema).min(1).max(3),
  email_1: ColdEmailSchema,
  follow_up_1: ColdEmailSchema,
  follow_up_2: ColdEmailSchema,
  break_up_email: ColdEmailSchema,
  quality_check: QualityCheckSchema,
  missing_inputs: z.array(z.string()),
});

/** Race a promise against a hard timeout using setTimeout — works in all environments. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`[cold-email] Timed out after ${ms / 1000}s (${label})`)), ms)
    ),
  ]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveDraft(projectId: string, payload: any): Promise<void> {
  await prisma.project.update({
    where: { id: projectId },
    data: { coldEmailDraft: payload },
  });
}

export const coldEmailGenerator = inngest.createFunction(
  {
    id: "cold-email-generator",
    retries: 0, // no Inngest retries — we handle errors ourselves and report immediately
    triggers: [{ event: "gtm/cold-email.generate" }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onFailure: async ({ event, error }: any) => {
      // Inngest v4: original event is at event.data.event.data, not event.data
      const original = (event?.data?.event?.data ?? {}) as { projectId?: string; targetMarketName?: string };
      const { projectId, targetMarketName } = original;
      console.error("[cold-email] onFailure fired", { projectId, error: error?.message });
      if (!projectId) return;
      await saveDraft(projectId, {
        status: "ERROR",
        targetMarketName: targetMarketName ?? "",
        error: error?.message ?? "Generation failed. Please try again.",
        startedAt: new Date().toISOString(),
      }).catch((e) => console.error("[cold-email] onFailure DB write failed", e));
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: any) => {
    const { projectId, targetMarketName } = event.data as {
      projectId: string;
      targetMarketName: string;
    };

    console.log("[cold-email] starting generation", { projectId, targetMarketName });

    await step.run("generate-cold-email", async () => {
      // Step 1: mark RUNNING
      await saveDraft(projectId, {
        status: "RUNNING",
        targetMarketName,
        startedAt: new Date().toISOString(),
      });
      console.log("[cold-email] marked RUNNING", { projectId });

      try {
        // Step 2: load project + user config
        const project = await withTimeout(
          prisma.project.findUnique({ where: { id: projectId }, include: { user: true } }),
          10_000,
          "DB load"
        );
        if (!project) throw new Error("Project not found");

        const llmRaw = safeDecrypt(project.user?.llmPreference ?? null);
        if (!llmRaw) throw new Error("No LLM API key configured — add it in Settings.");
        const llmPreference = JSON.parse(llmRaw) as LLMPreference;
        console.log("[cold-email] loaded config, provider:", llmPreference.provider);

        // Step 3: build context
        const ctx = await withTimeout(buildContextFromDB(projectId), 10_000, "context build");
        if (!ctx) throw new Error("Project context not found");
        const context = buildStepContext(ctx);
        console.log("[cold-email] context built, chars:", context.length);

        // Step 4: generate
        const model = getLanguageModel(llmPreference.provider, llmPreference.apiKey, "cold-email");
        const prompt = buildColdEmailPrompt(context, targetMarketName);
        console.log("[cold-email] calling LLM, prompt chars:", prompt.length);

        const { object } = await withTimeout(
          generateObject({
            model,
            schema: ColdEmailOutputSchema,
            prompt,
            maxRetries: 0, // no silent AI SDK retries — fail fast, show the real error
          }),
          80_000,
          "LLM generateObject"
        );
        console.log("[cold-email] LLM returned, saving COMPLETE");

        // Step 5: save result
        await saveDraft(projectId, {
          status: "COMPLETE",
          targetMarketName,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          ...object,
        });
        console.log("[cold-email] saved COMPLETE", { projectId });

      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed. Please try again.";
        console.error("[cold-email] generation error:", message, err);

        // Write ERROR to DB — this is the primary error path, don't rely on onFailure
        await saveDraft(projectId, {
          status: "ERROR",
          targetMarketName,
          error: message,
          startedAt: new Date().toISOString(),
        }).catch((dbErr) => {
          console.error("[cold-email] CRITICAL: failed to write ERROR status to DB:", dbErr);
        });

        throw err; // let Inngest know the step failed
      }
    });

    return { ok: true };
  }
);
