import { generateText } from "ai";
import { getLanguageModel } from "@/lib/ai/providers";
import { WorkflowContext } from "@/types/gtm";

export async function runResearchEdit(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string }
): Promise<unknown> {
  const existing = ctx.steps?.RESEARCH ?? ctx.companyProfile;
  const model = getLanguageModel(llm.provider as "openai" | "anthropic" | "google", llm.apiKey, "research-enrichment");

  const prompt = `You are a senior GTM strategist. Below is an existing company profile that was automatically extracted from a website. The user wants to refine it.

Existing company profile (JSON):
${JSON.stringify(existing, null, 2)}

User's refinement request: ${ctx.editPrompt}

Return the updated company profile as a JSON object with the same structure as the existing profile. Only modify what the user asked to change. Keep all other fields the same. Return only the JSON object, no markdown, no explanation.`;

  const { text } = await generateText({ model, prompt, maxOutputTokens: 2000 });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in LLM response");
  const updated = JSON.parse(jsonMatch[0]);

  // The research step output format is { companyProfile, questionsNeeded }
  // If the existing output already has that structure, preserve it
  if (existing && typeof existing === "object" && "companyProfile" in existing) {
    return { ...(existing as object), companyProfile: updated };
  }
  return { companyProfile: updated, questionsNeeded: [] };
}
