import { generateObject } from "ai";
import { z } from "zod";
import { getLanguageModel } from "@/lib/ai/providers";
import { WorkflowContext } from "@/types/gtm";

const companyProfileSchema = z.object({
  name: z.string(),
  website: z.string(),
  description: z.string(),
  businessType: z.enum(["b2b_saas", "agency", "services", "other"]),
  primaryProduct: z.string(),
  targetAudience: z.string(),
  geographicFocus: z.string(),
  keyDifferentiators: z.array(z.string()),
  currentCustomerExamples: z.array(z.string()),
  techStack: z.array(z.string()),
  foundedYear: z.number().nullable().optional(),
  teamSize: z.string().optional(),
  fundingStage: z.string().optional(),
});

export async function runResearchEdit(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string }
): Promise<unknown> {
  const existing = ctx.steps?.RESEARCH ?? ctx.companyProfile;
  const existingProfile =
    existing && typeof existing === "object" && "companyProfile" in existing
      ? (existing as { companyProfile: unknown }).companyProfile
      : existing;

  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "research-enrichment");

  const prompt = `You are a senior GTM strategist. Below is an existing company profile that was automatically extracted from a website. The user wants to refine it.

Existing company profile (JSON):
${JSON.stringify(existingProfile, null, 2)}

User's refinement request: ${ctx.editPrompt}

Return the updated company profile as a JSON object with the same structure as the existing profile. Only modify what the user asked to change. Keep all other fields the same.`;

  const { object } = await generateObject({ model, schema: companyProfileSchema, prompt });

  // Preserve the full ResearchOutput structure (companyProfile + questionsNeeded)
  if (existing && typeof existing === "object" && "companyProfile" in existing) {
    return { ...(existing as object), companyProfile: object };
  }
  return { companyProfile: object, questionsNeeded: [] };
}
