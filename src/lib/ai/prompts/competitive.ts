export function buildCompetitivePrompt(context: string, businessType: string, targetMarkets: object[]): string {
  return `You are a senior competitive intelligence analyst. Identify and analyze the key competitors for each of the company's target markets.

${context}

Business Type: ${businessType}

TARGET MARKETS (PRIMARY INPUT — competitors must map to these):
${JSON.stringify(targetMarkets, null, 2)}

IMPORTANT: The company has already defined specific target markets (shown above) with their urgent problems, important problems, and macro trends. Your job is to identify competitors operating in THOSE specific markets.

Each competitor's targetSegment MUST match one of the target market names above. Use the market's problems and trends to determine which competitors are most relevant — focus on companies that solve the same urgent problems in the same market.

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
- At least 2 competitors per target market where competition exists
- targetSegment must EXACTLY match one of the target market names listed above
- domain must be the actual website domain (e.g. "hubspot.com")
- location must be real HQ city and country
- whereTheyWin and whereClientWins must reference the specific problems and trends from that target market
- whereClientWins must be specific to THIS client's strengths, not generic
- Return ONLY JSON, no markdown.`;
}
