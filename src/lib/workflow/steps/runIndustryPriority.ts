import { generateObject } from "ai";
import { z } from "zod";
import { WorkflowContext, IndustryPriorityOutput } from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
import { buildStepContext } from "../context-builder";
import { buildIndustryPriorityPrompt } from "@/lib/ai/prompts/industry-priority";

const schema = z.object({
  industries: z.array(
    z.object({
      industryName: z.string(),
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
): Promise<IndustryPriorityOutput> {
  // Runs first — only uses company profile and clarifying answers
  const context = buildStepContext(ctx, []);
  let prompt = buildIndustryPriorityPrompt(context);
  if (ctx.editPrompt) {
    prompt += `\n\nREFINEMENT REQUEST FROM USER: ${ctx.editPrompt}\nPlease adjust your output based on this feedback while keeping the same JSON structure.`;
  }
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "industry-priority");

  const { object } = await generateObject({ model, schema, prompt });
  return object as IndustryPriorityOutput;
}
