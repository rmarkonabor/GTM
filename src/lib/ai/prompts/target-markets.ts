export function buildTargetMarketsPrompt(context: string): string {
  return `You are a senior GTM strategist. Based on the company profile and priority industries below, identify the best target markets (maximum 5).

${context}

For each market, evaluate:
1. Does this company solve an URGENT problem (must-have, causes pain today)?
2. Does this company solve an IMPORTANT problem (significant value, strategic priority)?
3. What macro trends are driving this problem?
4. Why is this the RIGHT market for this company right now?
5. WHY NOW — what specific moment, trigger, regulatory shift, or technology change makes this market ready to buy today, not in 6 months?
6. WHY US — what about our specific offering, positioning, or timing gives us a defensible edge in this market that alternatives cannot easily match?

Return JSON:
{
  "markets": [
    {
      "id": "market_1",
      "name": "Market Name (specific, e.g. Mid-Market HR Tech Companies in North America)",
      "urgentProblems": ["problem 1", "problem 2"],
      "importantProblems": ["problem 1"],
      "macroTrends": ["trend driving this problem"],
      "whyRightMarket": "clear explanation of why this market fits the company overall",
      "whyNow": "What specific moment, event, regulatory pressure, competitive shift, or operational breaking point makes this market ready to act TODAY. Be concrete — reference actual triggers, not general trends.",
      "whyUs": "What about our specific product, proof, positioning, or timing gives us an edge that generic alternatives don't have. Reference our actual differentiators.",
      "priorityScore": 9
    }
  ]
}

Rules:
- Maximum 5 markets, ranked by priorityScore (10 = best fit)
- priorityScore considers: company ability to win, market size, urgency, competition level
- Market names should be specific enough to use in outreach (not just "SaaS companies")
- whyNow must be specific — avoid vague statements like "the market is growing". Name the trigger.
- whyUs must reference this company's actual strengths — avoid generic claims like "we are better"
- Return ONLY JSON, no markdown.`;
}
