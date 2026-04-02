export function buildICPPrompt(context: string, industries: object[]): string {
  return `You are a senior GTM strategist. Based on the company profile and industry definitions below, create detailed ICPs (Ideal Customer Profiles) for each industry.

${context}

Industries to create ICPs for:
${JSON.stringify(industries, null, 2)}

For each industry, define:
1. Firmographics (company-level filters that can be used in Apollo/ZoomInfo)
2. Buyer Personas (person-level targeting)

Return JSON:
{
  "icps": [
    {
      "industryName": "Industry Name",
      "firmographics": {
        "companySize": ["11-50", "51-200"],
        "revenue": ["$1M-$10M", "$10M-$50M"],
        "geographies": ["United States", "Canada"],
        "industries": ["SaaS", "Software"],
        "technologies": ["Salesforce", "HubSpot"],
        "businessModels": ["B2B", "SaaS"]
      },
      "buyerPersonas": [
        {
          "title": "VP of Sales",
          "seniorities": ["vp", "director"],
          "departments": ["sales", "revenue"],
          "goals": ["increase revenue", "improve team efficiency"],
          "challenges": ["long sales cycles", "poor data quality"],
          "triggerEvents": ["company raised funding", "new CRO hired"]
        }
      ]
    }
  ]
}

Rules:
- Use Apollo-compatible filter values for seniorities: "owner", "founder", "c_suite", "partner", "vp", "head", "director", "manager", "senior", "entry"
- companySize values should be Apollo-compatible ranges: "1,10", "11,20", "21,50", "51,100", "101,200", "201,500", "501,1000", "1001,2000", "2001,5000", "5001,10000", "10001,"
- Be specific and actionable — these filters will be tested against real databases
- Return ONLY JSON, no markdown.`;
}
