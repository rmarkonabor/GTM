import { generateObject } from "ai";
import { z } from "zod";
import { WorkflowContext, CompetitiveAnalysisOutput, WorkflowStepResult } from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
import { getModelForTask } from "@/lib/ai/router";
import { calculateCost } from "@/lib/ai/pricing";
import { buildStepContext } from "../context-builder";
import { buildCompetitivePrompt } from "@/lib/ai/prompts/competitive";

const competitorSchema = z.object({
  name: z.string(),
  domain: z.string(),
  location: z.string(),
  valueProp: z.string(),
  keyOfferings: z.array(z.string()),
  whereTheyWin: z.array(z.string()),
  whereClientWins: z.array(z.string()),
  targetSegment: z.string(),
  pricingModel: z.string().optional(),
});

const schema = z.object({
  competitors: z.array(competitorSchema),
  isIndustrySpecific: z.boolean(),
  // Use array instead of record — z.record() generates propertyNames in JSON schema
  // which Anthropic's API does not support
  byIndustry: z.array(
    z.object({ industry: z.string(), competitors: z.array(competitorSchema) })
  ).nullable().optional(),
});

export async function runCompetitive(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string }
): Promise<WorkflowStepResult<CompetitiveAnalysisOutput>> {
  const context = buildStepContext(ctx);
  const targetMarkets = ctx.steps.TARGET_MARKETS?.markets ?? [];
  let prompt = buildCompetitivePrompt(context, ctx.businessType, targetMarkets);
  if (ctx.editPrompt) {
    prompt += `\n\nREFINEMENT REQUEST FROM USER: ${ctx.editPrompt}\nPlease adjust your output based on this feedback while keeping the same JSON structure.`;
  }
  const modelId = getModelForTask(llm.provider as "openai" | "anthropic" | "google", "competitive-analysis");
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "competitive-analysis");

  const { object, usage } = await generateObject({ model, schema, prompt });
  return {
    output: object as CompetitiveAnalysisOutput,
    usage: {
      promptTokens: usage.inputTokens ?? 0,
      completionTokens: usage.outputTokens ?? 0,
      totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
      estimatedCostUSD: calculateCost(modelId, usage.inputTokens ?? 0, usage.outputTokens ?? 0),
      model: modelId,
    },
  };
}
