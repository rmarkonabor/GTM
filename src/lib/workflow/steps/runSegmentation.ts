import { generateObject } from "ai";
import { z } from "zod";
import { WorkflowContext, SegmentationOutput } from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
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
    })
  ),
});

export async function runSegmentation(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string }
): Promise<SegmentationOutput> {
  const context = buildStepContext(ctx);
  const prompt = buildSegmentationPrompt(context);
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "segmentation");

  const { object } = await generateObject({ model, schema, prompt });
  return object as SegmentationOutput;
}
