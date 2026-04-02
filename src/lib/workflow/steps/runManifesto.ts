import { generateObject } from "ai";
import { z } from "zod";
import { WorkflowContext, ManifestoOutput } from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
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
): Promise<ManifestoOutput> {
  const context = buildStepContext(ctx);
  const prompt = buildManifestoPrompt(context);
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "manifesto");

  const { object } = await generateObject({ model, schema, prompt });
  return object as ManifestoOutput;
}
