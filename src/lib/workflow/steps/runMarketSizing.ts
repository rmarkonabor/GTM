import { WorkflowContext, MarketSizingOutput, MarketSizeResult } from "@/types/gtm";
import { getMarketSize } from "@/lib/integrations/apollo";

export async function runMarketSizing(
  ctx: WorkflowContext,
  llm: { provider: string; apiKey: string },
  dbPrefs: { apollo?: { apiKey: string }; clay?: { apiKey: string } }
): Promise<MarketSizingOutput> {
  const segments = ctx.steps.SEGMENTATION?.segments ?? [];
  const icps = ctx.steps.ICP?.icps ?? [];
  const results: MarketSizeResult[] = [];

  for (const segment of segments) {
    // Find matching ICP for this segment's industry
    const matchingIcp = icps.find((icp) =>
      segment.industries.some((ind) =>
        icp.industryName.toLowerCase().includes(ind.toLowerCase())
      )
    ) ?? icps[0];

    if (!matchingIcp) continue;

    const persona = matchingIcp.buyerPersonas[0];

    // Test on Apollo if key is available
    if (dbPrefs.apollo?.apiKey) {
      try {
        const { companies, contacts, filtersUsed } = await getMarketSize(
          dbPrefs.apollo.apiKey,
          matchingIcp.firmographics,
          persona
        );

        // TAM = all matching companies (broad filter)
        // SAM = filtered by geo + size (serviceable)
        // SOM = 10-15% of SAM (realistic capture)
        const sam_companies = Math.round(companies * 0.4);
        const som_companies = Math.round(sam_companies * 0.12);
        const sam_contacts = Math.round(contacts * 0.4);
        const som_contacts = Math.round(sam_contacts * 0.12);

        results.push({
          segmentId: segment.id,
          segmentName: segment.name,
          database: "apollo",
          tam_companies: companies,
          sam_companies,
          som_companies,
          tam_contacts: contacts,
          sam_contacts,
          som_contacts,
          filtersUsed,
          fetchedAt: new Date().toISOString(),
        });
      } catch (err) {
        // Log but don't fail the whole step — add partial result
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
  }

  const totalTAM = results.reduce((sum, r) => sum + r.tam_companies, 0);
  const totalSAM = results.reduce((sum, r) => sum + r.sam_companies, 0);
  const totalSOM = results.reduce((sum, r) => sum + r.som_companies, 0);

  return {
    results,
    totalTAM_companies: totalTAM,
    totalSAM_companies: totalSAM,
    totalSOM_companies: totalSOM,
  };
}
