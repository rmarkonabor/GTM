import { generateObject } from "ai";
import { z } from "zod";
import { WorkflowContext, TargetMarketsOutput, WorkflowStepResult } from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
import { getModelForTask } from "@/lib/ai/router";
import { calculateCost } from "@/lib/ai/pricing";
import { buildStepContext } from "../context-builder";
import { buildTargetMarketsPrompt } from "@/lib/ai/prompts/target-markets";

const firmographicsSchema = z.object({
  companySize: z.array(z.string()),
  revenue: z.array(z.string()),
  geographies: z.array(z.string()),
  industries: z.array(z.string()),
  technologies: z.array(z.string()),
  businessModels: z.array(z.string()),
});

const buyerPersonaSchema = z.object({
  title: z.string(),
  seniorities: z.array(z.string()),
  departments: z.array(z.string()),
  goals: z.array(z.string()),
  challenges: z.array(z.string()),
  triggerEvents: z.array(z.string()),
});

const schema = z.object({
  markets: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      urgentProblems: z.array(z.string()),
      importantProblems: z.array(z.string()),
      macroTrends: z.array(z.string()),
      whyRightMarket: z.string(),
      priorityScore: z.number(),
      firmographics: firmographicsSchema,
      buyerPersonas: z.array(buyerPersonaSchema),
    })
  ).max(5),
});

export async function runTargetMarkets(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string }
): Promise<WorkflowStepResult<TargetMarketsOutput>> {
  // TARGET_MARKETS runs after INDUSTRY_PRIORITY and ICP
  const context = buildStepContext(ctx);
  let prompt = buildTargetMarketsPrompt(context);
  if (ctx.editPrompt) {
    prompt += `\n\nREFINEMENT REQUEST FROM USER: ${ctx.editPrompt}\nPlease adjust your output based on this feedback while keeping the same JSON structure.`;
  }
  const modelId = getModelForTask(llm.provider as "openai" | "anthropic" | "google", "target-markets");
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "target-markets");

  const { object, usage } = await generateObject({ model, schema, prompt });
  return {
    output: object as TargetMarketsOutput,
    usage: {
      promptTokens: usage.inputTokens ?? 0,
      completionTokens: usage.outputTokens ?? 0,
      totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
      estimatedCostUSD: calculateCost(modelId, usage.inputTokens ?? 0, usage.outputTokens ?? 0),
      model: modelId,
    },
  };
}
