export function buildTargetMarketsPrompt(context: string): string {
  return `You are a senior GTM strategist. Based on the company profile, clarifying answers, and priority industries identified below, define the specific target markets to pursue.

${context}

A "target market" is a specific segment of buyers — defined by their shared problem, industry context, company characteristics, and buying behavior. Use the priority industries above to ground your markets in the industries that are the best fit for this company.

For each market, evaluate:
1. What URGENT problem do these buyers have (must-fix today, causing real pain)?
2. What IMPORTANT problem do they have (high value, strategic priority)?
3. What macro trends are driving urgency in this market?
4. Why is this the RIGHT market for this company to pursue right now?

Return JSON:
{
  "markets": [
    {
      "id": "market_1",
      "name": "Market Name (specific, e.g. 'Mid-market FinTech SaaS companies scaling their sales teams')",
      "urgentProblems": ["specific urgent problem 1", "specific urgent problem 2"],
      "importantProblems": ["important but less urgent problem"],
      "macroTrends": ["trend driving urgency in this market"],
      "whyRightMarket": "clear explanation of why this market fits this company specifically",
      "priorityScore": 9
    }
  ]
}

Rules:
- 3-5 markets, ranked by priorityScore (10 = best fit)
- Markets must be grounded in the priority industries — do not invent markets outside those industries
- priorityScore considers: company's ability to win, market urgency, competition, and alignment with priority industries
- Market names should be specific enough to identify real buyers, not broad categories
- Return ONLY JSON, no markdown.`;
}
