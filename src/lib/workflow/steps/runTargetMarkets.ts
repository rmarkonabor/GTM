import { generateObject } from "ai";
import { z } from "zod";
import { WorkflowContext, TargetMarketsOutput } from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
import { buildStepContext } from "../context-builder";
import { buildTargetMarketsPrompt } from "@/lib/ai/prompts/target-markets";

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
    })
  ),
});

export async function runTargetMarkets(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string }
): Promise<TargetMarketsOutput> {
  const context = buildStepContext(ctx, []);
  let prompt = buildTargetMarketsPrompt(context);
  if (ctx.editPrompt) {
    prompt += `\n\nREFINEMENT REQUEST FROM USER: ${ctx.editPrompt}\nPlease adjust your output based on this feedback while keeping the same JSON structure.`;
  }
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "target-markets");

  const { object } = await generateObject({ model, schema, prompt });
  return object as TargetMarketsOutput;
}
