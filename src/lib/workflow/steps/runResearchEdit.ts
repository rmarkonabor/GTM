import { generateObject } from "ai";
import { z } from "zod";
import { getLanguageModel } from "@/lib/ai/providers";
import { getModelForTask } from "@/lib/ai/router";
import { calculateCost } from "@/lib/ai/pricing";
import { WorkflowContext, WorkflowStepResult, ResearchOutput } from "@/types/gtm";

const companyProfileSchema = z.object({
  name: z.string(),
  website: z.string(),
  description: z.string(),
  businessType: z.enum(["b2b_saas", "agency", "services", "other"]),
  primaryProduct: z.string(),
  targetAudience: z.string(),
  geographicFocus: z.string(),
  keyDifferentiators: z.array(z.string()),
  currentCustomerExamples: z.array(z.string()),
  techStack: z.array(z.string()),
  foundedYear: z.number().nullable().optional(),
  teamSize: z.string().optional(),
  fundingStage: z.string().optional(),
});

export async function runResearchEdit(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string }
): Promise<WorkflowStepResult<ResearchOutput>> {
  const existing = ctx.steps?.RESEARCH ?? ctx.companyProfile;
  const existingProfile =
    existing && typeof existing === "object" && "companyProfile" in existing
      ? (existing as { companyProfile: unknown }).companyProfile
      : existing;

  // Preserve questionsNeeded from the existing research output if available
  const existingQuestionsNeeded =
    existing && typeof existing === "object" && "questionsNeeded" in existing
      ? (existing as { questionsNeeded: unknown[] }).questionsNeeded
      : [];

  const modelId = getModelForTask(llm.provider as "openai" | "anthropic" | "google", "research-enrichment");
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "research-enrichment");

  const prompt = `You are a senior GTM strategist. Below is an existing company profile that was automatically extracted from a website. The user wants to refine it.

Existing company profile (JSON):
${JSON.stringify(existingProfile, null, 2)}

User's refinement request: ${ctx.editPrompt}

Return the updated company profile as a JSON object with the same structure as the existing profile. Only modify what the user asked to change. Keep all other fields the same.`;

  const { object, usage } = await generateObject({ model, schema: companyProfileSchema, prompt });

  return {
    output: {
      companyProfile: object,
      questionsNeeded: existingQuestionsNeeded,
    } as ResearchOutput,
    usage: {
      promptTokens: usage.inputTokens ?? 0,
      completionTokens: usage.outputTokens ?? 0,
      totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
      estimatedCostUSD: calculateCost(modelId, usage.inputTokens ?? 0, usage.outputTokens ?? 0),
      model: modelId,
    },
  };
}
