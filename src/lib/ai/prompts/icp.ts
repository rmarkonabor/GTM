export function buildICPPrompt(context: string, industries: object[], targetMarkets: object[]): string {
  return `You are a senior GTM strategist. Based on the company profile, target markets, and priority industries below, create detailed Ideal Customer Profiles (ICPs).

IMPORTANT: The ICPs must be grounded in the TARGET MARKETS data. Each ICP should represent the ideal company within the context of those specific target markets — their urgent problems, macro trends, and market dynamics. Do NOT create generic industry profiles that ignore the target market analysis.

${context}

Priority industries (for reference):
${JSON.stringify(industries, null, 2)}

Target markets (PRIMARY INPUT — each ICP must align to these):
${JSON.stringify(targetMarkets, null, 2)}

Create one ICP per target market. Each ICP should directly address the urgent and important problems identified in that market.

CRITICAL — Each ICP must include:

1. standardIndustry: The EXACT industry name used in LinkedIn and Apollo.io databases.
   Examples: "Computer Software", "Information Technology and Services", "Financial Services",
   "Banking", "Insurance", "Hospital & Health Care", "Legal Services", "Human Resources",
   "Staffing and Recruiting", "Marketing and Advertising", "Management Consulting", "Retail",
   "Manufacturing", "Construction", "Education Management", "Non-Profit Organization Management"
   (Must be a real LinkedIn/Apollo-compatible value — never a made-up category or niche label)

2. niche: The specific sub-segment within that standard industry.
   Examples: "HR Tech", "Legal Tech", "Fintech for SMBs", "Healthcare SaaS", "Construction Tech"
   (This is how you describe the space in outreach copy)

3. keywords: 5–10 HIGHLY SPECIFIC keywords that buyers in this niche actually search for, use daily, or identify with.
   These are critical for targeting — they power search filters, ad targeting, and outreach personalization.

   KEYWORD RULES:
   - Mix of broad category terms AND specific tool/process names
   - Include terms from the target market's urgent problems and macro trends
   - Include technology terms, compliance terms, methodology terms relevant to the niche
   - Think: "What would someone in this niche type into Google or LinkedIn search?"

   Examples by vertical:
     HR Tech → ["HRIS", "payroll automation", "workforce management", "employee onboarding", "talent acquisition", "ATS", "people analytics", "HR compliance"]
     Legal Tech → ["contract management", "e-discovery", "legal operations", "CLM", "legal billing", "matter management", "regulatory compliance"]
     Fintech → ["payment processing", "KYC", "AML compliance", "neobanking", "embedded finance", "open banking API", "digital lending"]
     Construction → ["BIM", "project management", "field service management", "construction ERP", "safety compliance", "punch list"]

For each ICP also define:
- Firmographics: Apollo.io/ZoomInfo-compatible company-level filters shaped by the target markets
- apolloKeywordTags: 5–8 lowercase tags that Apollo indexes as company tags for this niche (what companies DO or SELL, not company names)
- Buyer Personas: Person-level targeting for decision makers — their goals and challenges should directly reference the target market's urgent/important problems

Return JSON:
{
  "icps": [
    {
      "standardIndustry": "Computer Software",
      "niche": "HR Tech",
      "keywords": ["HRIS", "payroll automation", "workforce management", "employee onboarding", "talent acquisition", "ATS", "people analytics", "HR compliance"],
      "firmographics": {
        "companySize": ["51,100", "101,200", "201,500"],
        "revenue": ["$5M-$50M"],
        "geographies": ["United States", "Canada"],
        "industries": ["Computer Software"],
        "technologies": ["Workday", "BambooHR"],
        "businessModels": ["B2B", "SaaS"],
        "apolloKeywordTags": ["human resources software", "hr technology", "payroll software", "workforce management", "talent management"]
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
- Create ONE ICP per target market — each grounded in that market's problems and trends
- standardIndustry must be a real LinkedIn/Apollo database value — never a niche label like "HR Tech"
- industries in firmographics must also use standardIndustry values only
- keywords must be 5–10 specific, actionable terms — NOT generic words like "technology" or "software"
- apolloKeywordTags: 5–8 lowercase terms describing what companies in this space DO or SELL
- Apollo seniority values: "owner", "founder", "c_suite", "partner", "vp", "head", "director", "manager", "senior", "entry"
- companySize must use Apollo ranges: "1,10" | "11,20" | "21,50" | "51,100" | "101,200" | "201,500" | "501,1000" | "1001,2000" | "2001,5000" | "5001,10000" | "10001,"
- Buyer persona goals/challenges MUST reference the target market's urgent and important problems
- Return ONLY JSON, no markdown.`;
}
