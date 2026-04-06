import { generateObject } from "ai";
import { z } from "zod";
import { WorkflowContext, MarketSizingOutput, MarketSizeResult, WorkflowStepResult } from "@/types/gtm";
import { getMarketSize } from "@/lib/integrations/apollo";
import { getLanguageModel } from "@/lib/ai/providers";
import { getModelForTask } from "@/lib/ai/router";
import { calculateCost } from "@/lib/ai/pricing";
import { buildStepContext } from "../context-builder";

const estimationSchema = z.object({
  results: z.array(
    z.object({
      segmentId: z.string(),
      segmentName: z.string(),
      tam_companies: z.number(),
      sam_companies: z.number(),
      som_companies: z.number(),
      tam_contacts: z.number(),
      sam_contacts: z.number(),
      som_contacts: z.number(),
    })
  ),
});

export async function runMarketSizing(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string },
  dbPrefs: { apollo?: { apiKey: string }; clay?: { apiKey: string } }
): Promise<WorkflowStepResult<MarketSizingOutput>> {
  const segments = ctx.steps.SEGMENTATION?.segments ?? [];
  const icps = ctx.steps.ICP?.icps ?? [];

  // ─── Apollo (real data) ───────────────────────────────────────────────────
  if (dbPrefs.apollo?.apiKey) {
    const results: MarketSizeResult[] = [];

    for (const segment of segments) {
      const matchingIcp =
        icps.find((icp) =>
          segment.industries.some(
            (ind) =>
              icp.standardIndustry.toLowerCase().includes(ind.toLowerCase()) ||
              icp.niche.toLowerCase().includes(ind.toLowerCase())
          )
        ) ?? icps[0];

      if (!matchingIcp) continue;

      try {
        const persona = matchingIcp.buyerPersonas[0];
        const { companies, contacts, filtersUsed } = await getMarketSize(
          dbPrefs.apollo.apiKey,
          matchingIcp.firmographics,
          persona
        );

        results.push({
          segmentId: segment.id,
          segmentName: segment.name,
          database: "apollo",
          tam_companies: companies,
          sam_companies: Math.round(companies * 0.4),
          som_companies: Math.round(companies * 0.4 * 0.12),
          tam_contacts: contacts,
          sam_contacts: Math.round(contacts * 0.4),
          som_contacts: Math.round(contacts * 0.4 * 0.12),
          filtersUsed,
          fetchedAt: new Date().toISOString(),
        });
      } catch {
        results.push({
          segmentId: segment.id,
          segmentName: segment.name,
          database: "apollo",
          tam_companies: 0,
          sam_companies: 0,
          som_companies: 0,
          tam_contacts: 0,
          sam_contacts: 0,
          som_contacts: 0,
          filtersUsed: {},
          fetchedAt: new Date().toISOString(),
        });
      }
    }

    const totalTAM = results.reduce((sum, r) => sum + r.tam_companies, 0);
    const totalSAM = results.reduce((sum, r) => sum + r.sam_companies, 0);
    const totalSOM = results.reduce((sum, r) => sum + r.som_companies, 0);

    return {
      output: { results, totalTAM_companies: totalTAM, totalSAM_companies: totalSAM, totalSOM_companies: totalSOM },
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUSD: 0, model: "apollo-api" },
    };
  }

  // ─── AI Estimation (fallback when no Apollo key) ─────────────────────────
  const modelId = getModelForTask(
    llm.provider as "openai" | "anthropic" | "google",
    "market-sizing-analysis"
  );
  const model = getLanguageModel(
    llm.provider as "openai" | "anthropic" | "google",
    llm.apiKey,
    "market-sizing-analysis"
  );
  const context = buildStepContext(ctx);

  const prompt = `You are a market sizing expert. Based on the company profile, ICP, and segments below, estimate TAM/SAM/SOM for each segment.

${context}

Estimate realistic company counts (organizations that could buy this product) and contact counts (decision makers):
- TAM = all companies in the addressable market fitting the ICP criteria
- SAM = geographically and technically reachable companies (~35-45% of TAM)
- SOM = realistically winnable in the next 1-2 years (~10-15% of SAM)

Use your knowledge of actual industry sizes for these markets. Be realistic, not optimistic.

Return JSON:
{
  "results": [
    {
      "segmentId": "the segment id from context",
      "segmentName": "the segment name from context",
      "tam_companies": 15000,
      "sam_companies": 6000,
      "som_companies": 720,
      "tam_contacts": 45000,
      "sam_contacts": 18000,
      "som_contacts": 2160
    }
  ]
}

Rules:
- Include ALL segments from the context
- segmentId and segmentName must exactly match the segments in the context
- Return ONLY JSON, no markdown.`;

  const { object, usage } = await generateObject({ model, schema: estimationSchema, prompt });

  const results: MarketSizeResult[] = object.results.map((r) => ({
    ...r,
    database: "ai-estimated" as const,
    filtersUsed: {},
    fetchedAt: new Date().toISOString(),
  }));

  const totalTAM = results.reduce((sum, r) => sum + r.tam_companies, 0);
  const totalSAM = results.reduce((sum, r) => sum + r.sam_companies, 0);
  const totalSOM = results.reduce((sum, r) => sum + r.som_companies, 0);

  return {
    output: { results, totalTAM_companies: totalTAM, totalSAM_companies: totalSAM, totalSOM_companies: totalSOM },
    usage: {
      promptTokens: usage.inputTokens ?? 0,
      completionTokens: usage.outputTokens ?? 0,
      totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
      estimatedCostUSD: calculateCost(modelId, usage.inputTokens ?? 0, usage.outputTokens ?? 0),
      model: modelId,
    },
  };
}
