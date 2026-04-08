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
      "pricingModel": "subscription / project-based / freemium / etc.",
      "threatLevel": "high",
      "edgeTrend": "gaining"
    }
  ],
  "isIndustrySpecific": false
}

threatLevel values:
- "high": Well-resourced, strong brand, actively competing for the same accounts, frequently appears in deals
- "medium": Real competitor but weaker positioning, narrower focus, or inconsistent presence in deals
- "low": Technically overlaps but rarely appears in deals or has limited scope in this market

edgeTrend values:
- "gaining": Growing market share, increasing product velocity, recent funding, expanding into new segments
- "holding": Stable position, no clear growth or decline signals
- "losing": Losing ground — declining product investment, customers churning, pricing pressure, shrinking focus

Rules:
- Include 1–3 competitors per target market, prioritising direct competitors first then indirect
- Maximum 15 competitors total across all markets
- targetSegment must EXACTLY match one of the target market names listed above
- domain must be the actual website domain (e.g. "hubspot.com")
- location: city and country only (e.g. "San Francisco, US")
- keyOfferings: max 3 items, keep each under 6 words
- whereTheyWin: max 3 items, keep each under 10 words
- whereClientWins: max 3 items, keep each under 10 words — must be specific to THIS client's strengths
- valueProp: 1 sentence max, under 20 words
- threatLevel and edgeTrend must be based on observable signals, not guesses
- Return ONLY JSON, no markdown.`;
}
