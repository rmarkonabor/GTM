export function buildICPPrompt(context: string, industries: object[]): string {
  return `You are a senior GTM strategist. Based on the company profile and priority industry definitions below, create detailed ICPs (Ideal Customer Profiles) for each industry.

${context}

Industries to create ICPs for:
${JSON.stringify(industries, null, 2)}

For each industry, define:
1. Firmographics — company-level filters that can be used directly in Apollo.io or ZoomInfo
2. Buyer Personas — person-level targeting with Apollo-compatible seniority values

Return JSON:
{
  "icps": [
    {
      "industryName": "niche name (e.g. HR Tech)",
      "firmographics": {
        "companySize": ["11,50", "51,200"],
        "revenue": ["$1M-$10M", "$10M-$50M"],
        "geographies": ["United States", "Canada"],
        "industries": ["Computer Software"],
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
- Apollo seniority values: "owner", "founder", "c_suite", "partner", "vp", "head", "director", "manager", "senior", "entry"
- companySize must use Apollo ranges: "1,10" | "11,20" | "21,50" | "51,100" | "101,200" | "201,500" | "501,1000" | "1001,2000" | "2001,5000" | "5001,10000" | "10001,"
- industries in firmographics should use standardIndustry values (LinkedIn/Apollo-compatible)
- Be specific and actionable — these filters will be tested against real databases
- industryName should reference the niche (e.g. "HR Tech") not the standard industry label
- Return ONLY JSON, no markdown.`;
}
