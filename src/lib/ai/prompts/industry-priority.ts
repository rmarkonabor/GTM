export function buildIndustryPriorityPrompt(context: string, market: object): string {
  return `You are a senior GTM strategist. For the target market below, identify the top industries to prioritize and define each one in detail.

${context}

Target Market:
${JSON.stringify(market, null, 2)}

For each industry, define:
1. Pain points specific to this industry
2. Exactly what the client can offer to solve those pain points
3. How the client and potential buyers can work together (engagement model)

Return JSON:
{
  "targetMarketId": "market_id",
  "industries": [
    {
      "industryName": "Industry Name",
      "priorityRank": 1,
      "painPoints": ["pain point 1", "pain point 2"],
      "whatClientOffers": ["specific offering 1", "specific offering 2"],
      "howTheyWorkTogether": "description of the working relationship and engagement model",
      "estimatedMarketFit": "high" | "medium" | "low"
    }
  ]
}

Rules:
- 3-7 industries per market, ranked by priority
- Be specific — generic answers like "they need better tools" are not acceptable
- Return ONLY JSON, no markdown.`;
}
