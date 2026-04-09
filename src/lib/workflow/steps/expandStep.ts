import { generateObject } from "ai";
import { z } from "zod";
import {
  WorkflowContext,
  IndustryDefinition,
  TargetMarket,
  LLMPreference,
} from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
import { buildStepContext } from "../context-builder";

// ─── Expand Industry Priority ─────────────────────────────────────────────────

const industrySchema = z.object({
  standardIndustry: z.string(),
  niche: z.string(),
  keywords: z.array(z.string()),
  priorityRank: z.number(),
  painPoints: z.array(z.string()),
  whatClientOffers: z.array(z.string()),
  howTheyWorkTogether: z.string(),
  estimatedMarketFit: z.enum(["high", "medium", "low"]),
});

const expandIndustriesSchema = z.object({
  industries: z.array(industrySchema),
});

export async function expandIndustries(
  ctx: WorkflowContext,
  newNiches: string[],
  existingIndustries: IndustryDefinition[],
  llm: LLMPreference
): Promise<IndustryDefinition[]> {
  const context = buildStepContext(ctx);
  const nextRank = existingIndustries.length + 1;

  const prompt = `You are a senior GTM strategist. We already have the following priority industries defined for this company:

${context}

Existing industries (for context/consistency):
${JSON.stringify(existingIndustries.map((i) => ({ standardIndustry: i.standardIndustry, niche: i.niche })), null, 2)}

Now generate full IndustryDefinition objects for each of these NEW industries/niches the user wants to add:
${JSON.stringify(newNiches, null, 2)}

For each new industry, follow the same quality and format as the existing ones.

CRITICAL — Separate these three things:
- standardIndustry: Exact LinkedIn/Apollo database name (e.g. "Computer Software", "Financial Services")
- niche: Sub-segment description (e.g. "HR Tech", "Legal Tech")
- keywords: 3–6 specific targeting terms

Also include: painPoints, whatClientOffers, howTheyWorkTogether, estimatedMarketFit.
Start priorityRank from ${nextRank}.

Return JSON:
{ "industries": [ { "standardIndustry": "...", "niche": "...", "keywords": [...], "priorityRank": ${nextRank}, "painPoints": [...], "whatClientOffers": [...], "howTheyWorkTogether": "...", "estimatedMarketFit": "high" | "medium" | "low" } ] }

Return ONLY JSON, no markdown.`;

  const model = getLanguageModel(llm.provider, llm.apiKey, "expand-step");
  const { object } = await generateObject({ model, schema: expandIndustriesSchema, prompt });
  return object.industries as IndustryDefinition[];
}

// ─── Expand Target Markets ────────────────────────────────────────────────────

const expandMarketsSchema = z.object({
  markets: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      urgentProblems: z.array(z.string()),
      importantProblems: z.array(z.string()),
      macroTrends: z.array(z.string()),
      whyRightMarket: z.string(),
      whyNow: z.string().optional().default(""),
      whyUs: z.string().optional().default(""),
      priorityScore: z.number(),
    })
  ).max(5),
});

export async function expandMarkets(
  ctx: WorkflowContext,
  newMarketNames: string[],
  existingMarkets: TargetMarket[],
  llm: LLMPreference
): Promise<TargetMarket[]> {
  const context = buildStepContext(ctx);
  const nextIndex = existingMarkets.length + 1;

  const prompt = `You are a senior GTM strategist. We already have the following target markets defined for this company:

${context}

Existing markets (for context/consistency):
${JSON.stringify(existingMarkets.map((m) => ({ id: m.id, name: m.name, priorityScore: m.priorityScore })), null, 2)}

Now generate full TargetMarket objects for each of these NEW markets the user wants to add:
${JSON.stringify(newMarketNames, null, 2)}

For each new market, follow the same quality and format as the existing ones.

IDs should follow the pattern "market_${nextIndex}", "market_${nextIndex + 1}", etc.

Return JSON:
{
  "markets": [
    {
      "id": "market_${nextIndex}",
      "name": "specific market name",
      "urgentProblems": [...],
      "importantProblems": [...],
      "macroTrends": [...],
      "whyRightMarket": "...",
      "whyNow": "What specific moment, event, regulatory pressure, or operational breaking point makes this market ready to act today. Be concrete.",
      "whyUs": "What about our specific product, proof, positioning, or timing gives us an edge that alternatives do not have.",
      "priorityScore": 7
    }
  ]
}

Rules:
- Market names should be specific enough to use in outreach (not just "SaaS companies")
- whyNow must be specific — avoid vague statements like "the market is growing". Name the trigger.
- whyUs must reference this company's actual strengths — avoid generic claims.
- Return ONLY JSON, no markdown.`;

  const model = getLanguageModel(llm.provider, llm.apiKey, "expand-step");
  const { object } = await generateObject({ model, schema: expandMarketsSchema, prompt });
  return object.markets as TargetMarket[];
}
