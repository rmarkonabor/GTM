import { generateObject } from "ai";
import { z } from "zod";
import { WorkflowContext, ManifestoOutput, WorkflowStepResult } from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
import { getModelForTask } from "@/lib/ai/router";
import { calculateCost } from "@/lib/ai/pricing";
import { buildStepContext } from "../context-builder";
import { buildManifestoPrompt } from "@/lib/ai/prompts/manifesto";

const schema = z.object({
  who: z.string(),
  whyExist: z.string(),
  whatTheyDo: z.string(),
  whyChooseThem: z.string(),
  tagline: z.string(),
  elevatorPitch: z.string(),
  messagingPillars: z.array(
    z.object({
      pillar: z.string(),
      headline: z.string(),
      supportingPoints: z.array(z.string()),
    })
  ).min(3).max(4),
});

export async function runManifesto(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string }
): Promise<WorkflowStepResult<ManifestoOutput>> {
  const context = buildStepContext(ctx);
  let prompt = buildManifestoPrompt(context);
  if (ctx.editPrompt) {
    prompt += `\n\nREFINEMENT REQUEST FROM USER: ${ctx.editPrompt}\nPlease adjust your output based on this feedback while keeping the same JSON structure.`;
  }
  const modelId = getModelForTask(llm.provider as "openai" | "anthropic" | "google", "manifesto");
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "manifesto");

  const { object, usage } = await generateObject({ model, schema, prompt });
  return {
    output: object as ManifestoOutput,
    usage: {
      promptTokens: usage.inputTokens ?? 0,
      completionTokens: usage.outputTokens ?? 0,
      totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
      estimatedCostUSD: calculateCost(modelId, usage.inputTokens ?? 0, usage.outputTokens ?? 0),
      model: modelId,
    },
  };
}
