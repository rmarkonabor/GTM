export function buildCompetitivePrompt(context: string, businessType: string): string {
  return `You are a senior competitive intelligence analyst. Identify and analyze the key competitors for each of the company's chosen target markets.

${context}

Business Type: ${businessType}

IMPORTANT: The company has already selected specific target markets (shown above). Your job is to identify the main competitors operating in THOSE markets — not a generic list. Each competitor's targetSegment should map to one of the company's actual target markets by name.

For each competitor, provide a detailed comparison vs. the client, focusing on how they compete within the relevant target market.

Return JSON:
{
  "competitors": [
    {
      "name": "Competitor Name",
      "domain": "competitor.com",
      "location": "City, Country",
      "valueProp": "their core value proposition in 1-2 sentences",
      "keyOfferings": ["offering 1", "offering 2"],
      "whereTheyWin": ["their strength vs. the client"],
      "whereClientWins": ["client advantage vs. them — be specific to this client's strengths"],
      "targetSegment": "name of the target market they compete in (must match one of the target markets above)",
      "pricingModel": "subscription / project-based / freemium / etc."
    }
  ],
  "isIndustrySpecific": false
}

Rules:
- Include 5-15 competitors total, covering each target market
- At least one competitor per target market where competition exists
- domain must be the actual website domain (e.g. "hubspot.com")
- location must be real HQ city and country
- whereClientWins must be specific to THIS client's strengths, not generic
- Return ONLY JSON, no markdown.`;
}
