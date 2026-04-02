export function buildCompetitivePrompt(context: string, businessType: string): string {
  const industrySpecific = businessType === "agency" || businessType === "services";
  return `You are a senior competitive intelligence analyst. Identify and analyze competitors for the company below.

${context}

Business Type: ${businessType}
${industrySpecific ? "IMPORTANT: This is an agency/services business. Identify competitors per industry/niche — different industries often have different competitors." : "This is a B2B SaaS company. Identify the main product competitors across all segments."}

For each competitor provide a detailed comparison vs. the client.

Return JSON:
{
  "competitors": [
    {
      "name": "Competitor Name",
      "domain": "competitor.com",
      "location": "City, Country",
      "valueProp": "their core value proposition",
      "keyOfferings": ["offering 1", "offering 2"],
      "whereTheyWin": ["their strength 1", "their strength 2"],
      "whereClientWins": ["client advantage vs them"],
      "targetSegment": "which segment/industry they compete in",
      "pricingModel": "subscription / project-based / etc."
    }
  ],
  "isIndustrySpecific": ${industrySpecific},
  ${industrySpecific ? '"byIndustry": { "IndustryName": [/* competitors specific to this industry */] }' : '"byIndustry": null'}
}

Rules:
- Include 5-15 competitors total
- domain must be the actual website domain (e.g. "hubspot.com")
- location must be real HQ city and country
- whereClientWins must be specific to THIS client's strengths
- Return ONLY JSON, no markdown.`;
}
