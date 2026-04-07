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
  text: z.string().describe("The exact spintax block or sentence being annotated"),
  metric: z.enum(["open_rate", "reply_rate", "engagement", "click_rate"]),
  impact: z.string().describe("Specific insight on why this choice improves the metric"),
});

const SubjectLineSchema = z.object({
  text: z.string().describe("Subject line ≤9 words, relevant to prospect's world, not clickbait"),
  rationale: z.string().describe("Why this angle was chosen for this subject line"),
});

const ColdEmailSchema = z.object({
  subject: z.string().describe("Subject line with 2-3 spintax blocks"),
  body: z.string().describe("Email body as plain text with spintax. Must follow all writing standards."),
  waitDays: z.number().int().min(0),
  angle: z.string().describe("The core angle/hook — what new reason to reply does this email give"),
  annotations: z.array(EmailAnnotationSchema).min(1).max(6),
});

const QualityCheckSchema = z.object({
  word_count_email_1: z.number().int().describe("Word count of email_1 body only (target: 50-100 words)"),
  feels_human: z.boolean(),
  no_buzzwords: z.boolean(),
  prospect_focused: z.boolean(),
  cta_easy_to_reply: z.boolean(),
  notes: z.string().optional().describe("Any notes on quality, tradeoffs, or what was constrained"),
});

const ColdEmailOutputSchema = z.object({
  strategy_summary: z.string().describe("2-3 sentences on the strategic angle chosen for this market"),
  campaign_brief: z.string().describe("What this sequence achieves and why these angles were selected"),
  subject_lines: z.array(SubjectLineSchema).min(1).max(3).describe("3 subject line options for email_1 only"),
  email_1: ColdEmailSchema.describe("Cold first touch: 50-100 words, 3-4 sentences, pain-focused, no pitch"),
  follow_up_1: ColdEmailSchema.describe("Follow-up adding a new reason to reply — different angle from email_1"),
  follow_up_2: ColdEmailSchema.describe("Second follow-up with yet another distinct angle"),
  break_up_email: ColdEmailSchema.describe("Short close-the-loop email, 2-3 sentences max"),
  quality_check: QualityCheckSchema,
  missing_inputs: z.array(z.string()).describe("Data points that would improve copy relevance if known"),
});

/** Wrap a promise with a manual timeout that's universally reliable across all environments. */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}

async function markDraft(
  projectId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
): Promise<void> {
  await prisma.project.update({
    where: { id: projectId },
    data: { coldEmailDraft: payload },
  }).catch(() => {});
}

export const coldEmailGenerator = inngest.createFunction(
  {
    id: "cold-email-generator",
    retries: 1,
    triggers: [{ event: "gtm/cold-email.generate" }],
    // onFailure: last-resort safety net. Catches cases where the step itself
    // couldn't update the DB (e.g. DB unreachable during error handling).
    // In Inngest v4, original event data is at event.data.event.data.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onFailure: async ({ event, error }: any) => {
      const original = (event?.data?.event?.data ?? {}) as { projectId?: string; targetMarketName?: string };
      const { projectId, targetMarketName } = original;
      if (!projectId) return;
      await markDraft(projectId, {
        status: "ERROR",
        targetMarketName: targetMarketName ?? "",
        error: error?.message ?? "Generation failed. Please try again.",
        startedAt: new Date().toISOString(),
      });
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: any) => {
    const { projectId, targetMarketName } = event.data as {
      projectId: string;
      targetMarketName: string;
    };

    await step.run("generate-cold-email", async () => {
      // Mark RUNNING at the start of the step
      await markDraft(projectId, {
        status: "RUNNING",
        targetMarketName,
        startedAt: new Date().toISOString(),
      });

      try {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: { user: true },
        });

        if (!project) throw new Error("Project not found");

        const llmRaw = safeDecrypt(project.user?.llmPreference ?? null);
        if (!llmRaw) throw new Error("No LLM API key configured. Add it in Settings.");
        const llmPreference = JSON.parse(llmRaw) as LLMPreference;

        const ctx = await buildContextFromDB(projectId);
        if (!ctx) throw new Error("Project context not found");

        const context = buildStepContext(ctx);
        const prompt = buildColdEmailPrompt(context, targetMarketName);
        const model = getLanguageModel(llmPreference.provider, llmPreference.apiKey, "cold-email");

        const { object } = await withTimeout(
          generateObject({ model, schema: ColdEmailOutputSchema, prompt }),
          85_000,
          "LLM response timed out after 85 seconds. Please try again."
        );

        // Persist COMPLETE immediately — don't rely on a separate step
        await prisma.project.update({
          where: { id: projectId },
          data: {
            coldEmailDraft: {
              status: "COMPLETE",
              targetMarketName,
              startedAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
              ...object,
            },
          },
        });
      } catch (err) {
        // Write ERROR to DB directly — don't rely solely on onFailure
        await markDraft(projectId, {
          status: "ERROR",
          targetMarketName,
          error: err instanceof Error ? err.message : "Generation failed. Please try again.",
          startedAt: new Date().toISOString(),
        });
        throw err; // let Inngest know the step failed (triggers retry/onFailure)
      }
    });

    return { ok: true };
  }
);
