export function buildTargetMarketsPrompt(context: string): string {
  return `You are a senior GTM strategist. Based on the company profile, priority industries, and ICP definitions below, identify the best target markets (maximum 5).

${context}

For each market, evaluate:
1. Does this company solve an URGENT problem (must-have, causes pain today)?
2. Does this company solve an IMPORTANT problem (significant value, strategic priority)?
3. What macro trends are driving this problem?
4. Why is this the RIGHT market for this company right now?

Each market must also include market-specific firmographics and buyer personas.
These should be refinements of the ICP for the specific context of this market —
for example, a "Mid-Market Healthcare" market may have different company sizes or
geographies than a "Startup Fintech" market, even if the base ICP is similar.

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
      "priorityScore": 9,
      "firmographics": {
        "companySize": ["51,200", "201,500"],
        "revenue": ["$5M-$50M"],
        "geographies": ["United States"],
        "industries": ["Computer Software"],
        "technologies": ["Workday", "BambooHR"],
        "businessModels": ["B2B", "SaaS"]
      },
      "buyerPersonas": [
        {
          "title": "VP of Human Resources",
          "seniorities": ["vp", "director"],
          "departments": ["human resources"],
          "goals": ["reduce employee turnover", "automate onboarding"],
          "challenges": ["manual processes", "scattered employee data"],
          "triggerEvents": ["company headcount doubled", "new CHRO hired"]
        }
      ]
    }
  ]
}

Rules:
- Maximum 5 markets, ranked by priorityScore (10 = best fit)
- priorityScore considers: company ability to win, market size, urgency, competition level
- Market names should be specific enough to use in outreach (not just "SaaS companies")
- companySize must use Apollo ranges: "1,10" | "11,20" | "21,50" | "51,100" | "101,200" | "201,500" | "501,1000" | "1001,2000" | "2001,5000" | "5001,10000" | "10001,"
- Apollo seniority values: "owner", "founder", "c_suite", "partner", "vp", "head", "director", "manager", "senior", "entry"
- industries in firmographics must use LinkedIn/Apollo standard names
- Return ONLY JSON, no markdown.`;
}
