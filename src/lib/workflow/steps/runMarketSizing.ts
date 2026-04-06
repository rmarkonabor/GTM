import { WorkflowContext, MarketSizingOutput, MarketSizeResult, WorkflowStepResult } from "@/types/gtm";
import { getMarketSize } from "@/lib/integrations/apollo";

export async function runMarketSizing(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string },
  dbPrefs: { apollo?: { apiKey: string }; clay?: { apiKey: string } }
): Promise<WorkflowStepResult<MarketSizingOutput>> {
  const segments = ctx.steps.SEGMENTATION?.segments ?? [];
  const icps = ctx.steps.ICP?.icps ?? [];

  if (!dbPrefs.apollo?.apiKey) {
    throw new Error("Apollo API key is required for market sizing. Add your Apollo key in Settings → Database Connections.");
  }

  // ─── Apollo (real data) ───────────────────────────────────────────────────
  {
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
}
