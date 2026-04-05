import { generateObject } from "ai";
import { z } from "zod";
import { WorkflowContext, IndustryPriorityOutput } from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
import { buildStepContext } from "../context-builder";
import { buildIndustryPriorityPrompt } from "@/lib/ai/prompts/industry-priority";

const schema = z.object({
  targetMarketId: z.string(),
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
): Promise<IndustryPriorityOutput[]> {
  const context = buildStepContext(ctx, ["TARGET_MARKETS"]);
  const markets = ctx.steps.TARGET_MARKETS?.markets ?? [];
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "industry-priority");

  const results = await Promise.all(
    markets.map(async (market) => {
      let prompt = buildIndustryPriorityPrompt(context, market);
      if (ctx.editPrompt) {
        prompt += `\n\nREFINEMENT REQUEST FROM USER: ${ctx.editPrompt}\nPlease adjust your output based on this feedback while keeping the same JSON structure.`;
      }
      const { object } = await generateObject({ model, schema, prompt });
      return object as IndustryPriorityOutput;
    })
  );
  return results;
}
