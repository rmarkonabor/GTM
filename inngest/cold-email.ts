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
  impact: z.string().describe("Specific, data-backed insight on why this choice improves the metric"),
});

const EmailStepSchema = z.object({
  subject: z.string().describe("Subject line with 2-3 spintax blocks using {A|B|C} format"),
  body: z.string().describe("Full email body as plain text with 4-6 spintax blocks strategically placed. Include opener, 2-3 body sentences, CTA, and closing on separate lines."),
  waitDays: z.number().int().min(0),
  spintaxCount: z.number().int().min(8).max(12).describe("Total number of {A|B|C} spintax blocks in this email (subject + body combined). Must be 8-12."),
  annotations: z.array(EmailAnnotationSchema).min(4).max(6),
});

const ColdEmailOutputSchema = z.object({
  steps: z.array(EmailStepSchema).length(3),
});

export const coldEmailGenerator = inngest.createFunction(
  {
    id: "cold-email-generator",
    retries: 1,
    triggers: [{ event: "gtm/cold-email.generate" }],
    onFailure: async ({ event, error }: { event: { data: { projectId: string; targetMarketName: string } }; error: Error }) => {
      const { projectId, targetMarketName } = event.data;
      await prisma.project.update({
        where: { id: projectId },
        data: {
          coldEmailDraft: {
            status: "ERROR",
            targetMarketName,
            steps: [],
            error: error?.message ?? "Generation failed. Please try again.",
            startedAt: new Date().toISOString(),
          },
        },
      }).catch(() => {}); // best-effort — don't throw in failure handler
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: any) => {
    const { projectId, targetMarketName } = event.data as {
      projectId: string;
      targetMarketName: string;
    };

    // Mark as RUNNING
    await step.run("mark-running", async () => {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          coldEmailDraft: {
            status: "RUNNING",
            targetMarketName,
            steps: [],
            startedAt: new Date().toISOString(),
          },
        },
      });
    });

    // Generate
    const result = await step.run("generate-emails", async () => {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { user: true },
      });

      if (!project) throw new Error("Project not found");

      const llmRaw = safeDecrypt(project.user?.llmPreference ?? null);
      if (!llmRaw) throw new Error("LLM not configured. Please add your API key in Settings.");
      const llmPreference = JSON.parse(llmRaw) as LLMPreference;

      const ctx = await buildContextFromDB(projectId);
      if (!ctx) throw new Error("Project context not found");

      const context = buildStepContext(ctx);
      const prompt = buildColdEmailPrompt(context, targetMarketName);
      const model = getLanguageModel(llmPreference.provider, llmPreference.apiKey, "cold-email");
      const { object } = await generateObject({ model, schema: ColdEmailOutputSchema, prompt });

      return object.steps;
    });

    // Save result
    await step.run("save-result", async () => {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          coldEmailDraft: {
            status: "COMPLETE",
            targetMarketName,
            steps: result,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          },
        },
      });
    });

    return { ok: true };
  }
);
