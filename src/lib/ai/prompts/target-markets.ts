export function buildTargetMarketsPrompt(context: string): string {
  return `You are a senior GTM strategist. Based on the company profile, priority industries, and ICP definitions below, identify the best target markets (maximum 5).

${context}

For each market, evaluate:
1. Does this company solve an URGENT problem (must-have, causes pain today)?
2. Does this company solve an IMPORTANT problem (significant value, strategic priority)?
3. What macro trends are driving this problem?
4. Why is this the RIGHT market for this company right now?

Return JSON:
{
  "markets": [
    {
      "id": "market_1",
      "name": "Market Name (specific, e.g. Mid-Market HR Tech Companies in North America)",
      "urgentProblems": ["problem 1", "problem 2"],
      "importantProblems": ["problem 1"],
      "macroTrends": ["trend driving this problem"],
      "whyRightMarket": "clear explanation of why this market fits",
      "priorityScore": 9
    }
  ]
}

Rules:
- Maximum 5 markets, ranked by priorityScore (10 = best fit)
- priorityScore considers: company ability to win, market size, urgency, competition level
- Market names should be specific enough to use in outreach (not just "SaaS companies")
- Return ONLY JSON, no markdown.`;
}
