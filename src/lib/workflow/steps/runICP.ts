import { generateObject } from "ai";
import { z } from "zod";
import { WorkflowContext, ICPOutput } from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
import { buildStepContext } from "../context-builder";
import { buildICPPrompt } from "@/lib/ai/prompts/icp";

const firmographicsSchema = z.object({
  companySize: z.array(z.string()),
  revenue: z.array(z.string()),
  geographies: z.array(z.string()),
  industries: z.array(z.string()),
  technologies: z.array(z.string()),
  businessModels: z.array(z.string()),
});

const schema = z.object({
  icps: z.array(
    z.object({
      industryName: z.string(),
      firmographics: firmographicsSchema,
      buyerPersonas: z.array(
        z.object({
          title: z.string(),
          seniorities: z.array(z.string()),
          departments: z.array(z.string()),
          goals: z.array(z.string()),
          challenges: z.array(z.string()),
          triggerEvents: z.array(z.string()),
        })
      ),
    })
  ),
});

export async function runICP(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string }
): Promise<ICPOutput> {
  const context = buildStepContext(ctx);
  const industries = ctx.steps.INDUSTRY_PRIORITY?.flatMap((ip) => ip.industries) ?? [];
  const prompt = buildICPPrompt(context, industries);
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "icp-creation");

  const { object } = await generateObject({ model, schema, prompt });
  return object as ICPOutput;
}
