import { generateObject } from "ai";
import { z } from "zod";
import { WorkflowContext, PositioningOutput } from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
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
): Promise<PositioningOutput> {
  const context = buildStepContext(ctx, ["ICP", "COMPETITIVE", "SEGMENTATION"]);
  let prompt = buildPositioningPrompt(context);
  if (ctx.editPrompt) {
    prompt += `\n\nREFINEMENT REQUEST FROM USER: ${ctx.editPrompt}\nPlease adjust your output based on this feedback while keeping the same JSON structure.`;
  }
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "positioning");

  const { object } = await generateObject({ model, schema, prompt });
  return object as PositioningOutput;
}
