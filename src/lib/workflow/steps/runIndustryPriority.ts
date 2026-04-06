import { generateObject } from "ai";
import { z } from "zod";
import { WorkflowContext, IndustryPriorityOutput, WorkflowStepResult } from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
import { getModelForTask } from "@/lib/ai/router";
import { calculateCost } from "@/lib/ai/pricing";
import { buildStepContext } from "../context-builder";
import { buildIndustryPriorityPrompt } from "@/lib/ai/prompts/industry-priority";

const schema = z.object({
  industries: z.array(
    z.object({
      standardIndustry: z.string(),
      niche: z.string(),
      keywords: z.array(z.string()),
      priorityRank: z.number(),
      painPoints: z.array(z.string()),
      whatClientOffers: z.array(z.string()),
      howTheyWorkTogether: z.string(),
      estimatedMarketFit: z.enum(["high", "medium", "low"]),
    })
  ),
});

export async function runIndustryPriority(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string }
): Promise<WorkflowStepResult<IndustryPriorityOutput>> {
  const context = buildStepContext(ctx);
  let prompt = buildIndustryPriorityPrompt(context);
  if (ctx.editPrompt) {
    prompt += `\n\nREFINEMENT REQUEST FROM USER: ${ctx.editPrompt}\nPlease adjust your output based on this feedback while keeping the same JSON structure.`;
  }
  const modelId = getModelForTask(llm.provider as "openai" | "anthropic" | "google", "industry-priority");
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "industry-priority");

  const { object, usage } = await generateObject({ model, schema, prompt });
  return {
    output: object as IndustryPriorityOutput,
    usage: {
      promptTokens: usage.inputTokens ?? 0,
      completionTokens: usage.outputTokens ?? 0,
      totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
      estimatedCostUSD: calculateCost(modelId, usage.inputTokens ?? 0, usage.outputTokens ?? 0),
      model: modelId,
    },
  };
}
