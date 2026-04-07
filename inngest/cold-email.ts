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
  part: z.enum(["subject", "opener", "body", "cta"]),
  text: z.string(),
  metric: z.enum(["open_rate", "reply_rate", "engagement", "click_rate"]),
  impact: z.string(),
});

const EmailStepSchema = z.object({
  subject: z.string(),
  body: z.string(),
  waitDays: z.number().int().min(0),
  annotations: z.array(EmailAnnotationSchema),
});

const ColdEmailOutputSchema = z.object({
  steps: z.array(EmailStepSchema).length(3),
});

export const coldEmailGenerator = inngest.createFunction(
  {
    id: "cold-email-generator",
    retries: 1,
    triggers: [{ event: "gtm/cold-email.generate" }],
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
      const [project, user] = await Promise.all([
        prisma.project.findUnique({ where: { id: projectId } }),
        prisma.project.findUnique({
          where: { id: projectId },
          include: { user: true },
        }),
      ]);

      if (!project || !user) throw new Error("Project not found");

      const llmRaw = safeDecrypt(user.user?.llmPreference ?? null);
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
