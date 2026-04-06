import { generateObject } from "ai";
import { z } from "zod";
import { WorkflowContext, PositioningOutput, WorkflowStepResult } from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
import { getModelForTask } from "@/lib/ai/router";
import { calculateCost } from "@/lib/ai/pricing";
import { buildStepContext } from "../context-builder";
import { buildPositioningPrompt } from "@/lib/ai/prompts/positioning";

const schema = z.object({
  uniqueValueProp: z.string(),
  differentiationPoints: z.array(z.string()),
  positioningStatement: z.string(),
  bySegment: z.array(
    z.object({
      segmentName: z.string(),
      keyPlayers: z.array(z.string()),
      differentiationAngle: z.string(),
    })
  ),
});

export async function runPositioning(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string }
): Promise<WorkflowStepResult<PositioningOutput>> {
  const context = buildStepContext(ctx);
  let prompt = buildPositioningPrompt(context);
  if (ctx.editPrompt) {
    prompt += `\n\nREFINEMENT REQUEST FROM USER: ${ctx.editPrompt}\nPlease adjust your output based on this feedback while keeping the same JSON structure.`;
  }
  const modelId = getModelForTask(llm.provider as "openai" | "anthropic" | "google", "positioning");
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "positioning");

  const { object, usage } = await generateObject({ model, schema, prompt });
  return {
    output: object as PositioningOutput,
    usage: {
      promptTokens: usage.inputTokens ?? 0,
      completionTokens: usage.outputTokens ?? 0,
      totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
      estimatedCostUSD: calculateCost(modelId, usage.inputTokens ?? 0, usage.outputTokens ?? 0),
      model: modelId,
    },
  };
}
