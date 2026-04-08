import { generateObject } from "ai";
import { z } from "zod";
import { WorkflowContext, ICPOutput, WorkflowStepResult } from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
import { getModelForTask } from "@/lib/ai/router";
import { calculateCost } from "@/lib/ai/pricing";
import { buildStepContext } from "../context-builder";
import { buildICPPrompt } from "@/lib/ai/prompts/icp";

const firmographicsSchema = z.object({
  companySize: z.array(z.string()),
  revenue: z.array(z.string()),
  geographies: z.array(z.string()),
  industries: z.array(z.string()),
  technologies: z.array(z.string()),
  businessModels: z.array(z.string()),
  apolloKeywordTags: z.array(z.string()).default([]),
});

const schema = z.object({
  icps: z.array(
    z.object({
      standardIndustry: z.string(),
      niche: z.string(),
      keywords: z.array(z.string()),
      engagementModel: z.enum(["champion", "champion-committee", "consensus", "executive-top-down"]).optional(),
      decisionCriteria: z.array(z.string()).optional(),
      lossReasons: z.array(z.string()).optional(),
      firmographics: firmographicsSchema,
      buyerPersonas: z.array(
        z.object({
          title: z.string(),
          seniorities: z.array(z.string()),
          departments: z.array(z.string()),
          goals: z.array(z.string()),
          challenges: z.array(z.string()),
          triggerEvents: z.array(z.string()),
        })
      ),
    })
  ),
});

export async function runICP(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string }
): Promise<WorkflowStepResult<ICPOutput>> {
  const context = buildStepContext(ctx);
  const industries = ctx.steps.INDUSTRY_PRIORITY?.industries ?? [];
  const targetMarkets = ctx.steps.TARGET_MARKETS?.markets ?? [];
  let prompt = buildICPPrompt(context, industries, targetMarkets);
  if (ctx.editPrompt) {
    prompt += `\n\nREFINEMENT REQUEST FROM USER: ${ctx.editPrompt}\nPlease adjust your output based on this feedback while keeping the same JSON structure.`;
  }
  const modelId = getModelForTask(llm.provider as "openai" | "anthropic" | "google", "icp-creation");
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "icp-creation");

  const { object, usage } = await generateObject({ model, schema, prompt });
  return {
    output: object as ICPOutput,
    usage: {
      promptTokens: usage.inputTokens ?? 0,
      completionTokens: usage.outputTokens ?? 0,
      totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
      estimatedCostUSD: calculateCost(modelId, usage.inputTokens ?? 0, usage.outputTokens ?? 0),
      model: modelId,
    },
  };
}
