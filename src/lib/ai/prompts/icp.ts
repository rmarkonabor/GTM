export function buildICPPrompt(context: string, industries: object[]): string {
  return `You are a senior GTM strategist. Based on the company profile, priority industries, AND target markets defined below, create detailed Ideal Customer Profiles (ICPs).

The ICPs must be grounded in the target markets — each ICP should represent the ideal company within the context of those specific markets, not just a generic industry profile.

${context}

Priority industries (for reference):
${JSON.stringify(industries, null, 2)}

Create one ICP per priority industry, shaped by the target markets above.

CRITICAL — Use the same 3-way industry separation as Industry Priority:

1. standardIndustry: The EXACT industry name used in LinkedIn and Apollo.io databases.
   Examples: "Computer Software", "Information Technology and Services", "Financial Services",
   "Banking", "Insurance", "Hospital & Health Care", "Legal Services", "Human Resources",
   "Staffing and Recruiting", "Marketing and Advertising", "Management Consulting", "Retail",
   "Manufacturing", "Construction", "Education Management", "Non-Profit Organization Management"
   (Must be a real LinkedIn/Apollo-compatible value — never a made-up category or niche label)

2. niche: The specific sub-segment within that standard industry.
   Examples: "HR Tech", "Legal Tech", "Fintech for SMBs", "Healthcare SaaS", "Construction Tech"
   (This is how you describe the space in outreach copy)

3. keywords: 3–6 specific terms, tools, or processes that buyers in this niche use.
   Examples: ["HRIS", "payroll", "workforce management"] or ["contract management", "e-discovery"]
   (Used for keyword targeting and personalization)

For each ICP also define:
- Firmographics: Apollo.io/ZoomInfo-compatible company-level filters shaped by the target markets
- Buyer Personas: Person-level targeting for decision makers in those markets

Return JSON:
{
  "icps": [
    {
      "standardIndustry": "Computer Software",
      "niche": "HR Tech",
      "keywords": ["HRIS", "payroll", "workforce management", "employee onboarding"],
      "firmographics": {
        "companySize": ["51,100", "101,200", "201,500"],
        "revenue": ["$5M-$50M"],
        "geographies": ["United States", "Canada"],
        "industries": ["Computer Software"],
        "technologies": ["Workday", "BambooHR"],
        "businessModels": ["B2B", "SaaS"],
        "apolloKeywordTags": ["human resources software", "hr technology", "payroll software", "workforce management", "saas"]
      },
      "buyerPersonas": [
        {
          "title": "VP of Human Resources",
          "seniorities": ["vp", "director"],
          "departments": ["human resources"],
          "goals": ["reduce employee turnover", "automate onboarding"],
          "challenges": ["manual HR processes", "scattered employee data"],
          "triggerEvents": ["company headcount doubled", "new CHRO hired"]
        }
      ]
    }
  ]
}

Rules:
- standardIndustry must be a real LinkedIn/Apollo database value — never a niche label like "HR Tech"
- industries in firmographics must also use standardIndustry values only
- Apollo seniority values: "owner", "founder", "c_suite", "partner", "vp", "head", "director", "manager", "senior", "entry"
- companySize must use Apollo ranges: "1,10" | "11,20" | "21,50" | "51,100" | "101,200" | "201,500" | "501,1000" | "1001,2000" | "2001,5000" | "5001,10000" | "10001,"
- apolloKeywordTags: 3–6 lowercase keywords that Apollo indexes as company tags for this industry/niche.
  These power Apollo's q_organization_keyword_tags[] filter. Use terms that describe what companies in this
  space DO or SELL, not company names. Examples by vertical:
    HR Tech → ["human resources software", "hr technology", "payroll software", "workforce management"]
    Legal Tech → ["legal software", "contract management", "e-discovery", "legal technology"]
    Fintech → ["financial technology", "payments", "banking software", "fintech"]
    Healthcare → ["health technology", "electronic health records", "healthcare software", "medical software"]
    Construction → ["construction software", "project management", "construction technology"]
  Use the niche + standardIndustry as anchors but express them as lowercase searchable tags.
- Be specific and actionable — these filters will be tested against real Apollo databases
- Return ONLY JSON, no markdown.`;
}
