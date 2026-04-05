import { generateObject } from "ai";
import { z } from "zod";
import { WorkflowContext, CompetitiveAnalysisOutput } from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
import { buildStepContext } from "../context-builder";
import { buildCompetitivePrompt } from "@/lib/ai/prompts/competitive";

const competitorSchema = z.object({
  name: z.string(),
  domain: z.string(),
  location: z.string(),
  valueProp: z.string(),
  keyOfferings: z.array(z.string()),
  whereTheyWin: z.array(z.string()),
  whereClientWins: z.array(z.string()),
  targetSegment: z.string(),
  pricingModel: z.string().optional(),
});

const schema = z.object({
  competitors: z.array(competitorSchema),
  isIndustrySpecific: z.boolean(),
  byIndustry: z.record(z.string(), z.array(competitorSchema)).nullable().optional(),
});

export async function runCompetitive(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string }
): Promise<CompetitiveAnalysisOutput> {
  const context = buildStepContext(ctx, ["TARGET_MARKETS", "ICP"]);
  let prompt = buildCompetitivePrompt(context, ctx.businessType);
  if (ctx.editPrompt) {
    prompt += `\n\nREFINEMENT REQUEST FROM USER: ${ctx.editPrompt}\nPlease adjust your output based on this feedback while keeping the same JSON structure.`;
  }
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "competitive-analysis");

  const { object } = await generateObject({ model, schema, prompt });
  return object as CompetitiveAnalysisOutput;
}
