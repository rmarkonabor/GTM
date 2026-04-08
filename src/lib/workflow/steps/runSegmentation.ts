import { generateObject } from "ai";
import { z } from "zod";
import { WorkflowContext, SegmentationOutput, WorkflowStepResult } from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
import { getModelForTask } from "@/lib/ai/router";
import { calculateCost } from "@/lib/ai/pricing";
import { buildStepContext } from "../context-builder";
import { buildSegmentationPrompt } from "@/lib/ai/prompts/segmentation";

const schema = z.object({
  segments: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      sizeCategory: z.enum(["enterprise", "mid-market", "smb", "startup"]),
      geographies: z.array(z.string()),
      industries: z.array(z.string()),
      estimatedPriority: z.enum(["tier-1", "tier-2", "tier-3"]),
      rationale: z.string(),
      buyingMotion: z.enum(["bottom-up", "top-down", "rfp-driven", "land-expand"]),
      painMultiplier: z.string(),
      positioning: z.object({
        keyPainPoints: z.array(z.string()),
        ourAngle: z.string(),
        messagingHook: z.string(),
        proofPoints: z.array(z.string()),
        ctaApproach: z.string(),
      }),
    })
  ),
});

export async function runSegmentation(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string }
): Promise<WorkflowStepResult<SegmentationOutput>> {
  const context = buildStepContext(ctx);
  const targetMarkets = ctx.steps.TARGET_MARKETS?.markets ?? [];
  let prompt = buildSegmentationPrompt(context, targetMarkets);
  if (ctx.editPrompt) {
    prompt += `\n\nREFINEMENT REQUEST FROM USER: ${ctx.editPrompt}\nPlease adjust your output based on this feedback while keeping the same JSON structure.`;
  }
  const modelId = getModelForTask(llm.provider as "openai" | "anthropic" | "google", "segmentation");
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "segmentation");

  const { object, usage } = await generateObject({ model, schema, prompt });
  return {
    output: object as SegmentationOutput,
    usage: {
      promptTokens: usage.inputTokens ?? 0,
      completionTokens: usage.outputTokens ?? 0,
      totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
      estimatedCostUSD: calculateCost(modelId, usage.inputTokens ?? 0, usage.outputTokens ?? 0),
      model: modelId,
    },
  };
}
