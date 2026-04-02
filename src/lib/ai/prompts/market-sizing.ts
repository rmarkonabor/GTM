export function buildMarketSizingAnalysisPrompt(
  context: string,
  dbResults: object[]
): string {
  return `You are a senior GTM strategist. Analyze the real market sizing data from Apollo/Clay databases and provide strategic insights.

${context}

Database Results:
${JSON.stringify(dbResults, null, 2)}

Analyze these numbers and provide:
1. Which segments represent the biggest opportunity (TAM)
2. Which segments are realistically serviceable (SAM — reachable with current GTM motion)
3. Which segments should be the initial focus (SOM — winnable in next 12-18 months)
4. Strategic recommendations based on the data

Return JSON:
{
  "results": [/* include all passed results unchanged */],
  "totalTAM_companies": 0,
  "totalSAM_companies": 0,
  "totalSOM_companies": 0,
  "strategicInsights": "paragraph of strategic analysis",
  "recommendedFocusSegments": ["segment names to prioritize"]
}

Return ONLY JSON, no markdown.`;
}
