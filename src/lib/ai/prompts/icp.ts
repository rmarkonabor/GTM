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

3. keywords: 5–10 industry-standard terms that define WHAT THIS NICHE DOES — the tools, platforms, methodologies, and product categories they work with or buy.
   These are used as Apollo/LinkedIn search filters and company tags to FIND companies in this space.

   KEYWORD RULES (strictly follow):
   - These are PRODUCT CATEGORY and TOOL TERMS — names of software, platforms, methodologies, or processes buyers in this niche use, manage, or purchase
   - They describe what companies in this niche DO or USE, not what problems they have
   - Do NOT include: marketing terms (lead generation, growth hacking, ROI), problem descriptions (inefficiency, bottleneck, manual process), or GTM/sales buzzwords
   - Do NOT include: the company's own product name, generic words like "software", "technology", "platform", "solution", "SaaS", "enterprise"
   - Think: "What specific tools, systems, or methodologies do these companies run on?" and "What product category would a sales rep use to filter for this niche in Apollo?"

   Examples by vertical:
     HR Tech → ["HRIS", "payroll", "ATS", "workforce management", "employee onboarding", "talent acquisition", "people analytics", "HR compliance", "performance management"]
     Legal Tech → ["contract management", "e-discovery", "CLM", "legal billing", "matter management", "regulatory compliance", "document automation", "legal operations"]
     Fintech → ["payment processing", "KYC", "AML", "open banking", "embedded finance", "digital lending", "card issuing", "reconciliation", "PCI compliance"]
     Construction → ["BIM", "project scheduling", "field service management", "construction ERP", "safety compliance", "RFI management", "subcontractor management"]
     Marketing Agency → ["SEO", "PPC", "paid media", "media buying", "programmatic advertising", "content marketing", "creative production", "analytics dashboard"]

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
- keywords must be 5–10 PRODUCT CATEGORY / TOOL / METHODOLOGY terms for the niche — NOT marketing terms, problem descriptions, or generic words like "technology", "software", "platform", "SaaS", "growth", "automation" (unless it's a specific named category like "payroll automation" or "test automation")
- apolloKeywordTags: 5–8 lowercase terms describing what companies in this space DO or SELL
- Apollo seniority values: "owner", "founder", "c_suite", "partner", "vp", "head", "director", "manager", "senior", "entry"
- companySize must use Apollo ranges: "1,10" | "11,20" | "21,50" | "51,100" | "101,200" | "201,500" | "501,1000" | "1001,2000" | "2001,5000" | "5001,10000" | "10001,"
- Buyer persona goals/challenges MUST reference the target market's urgent and important problems
- Return ONLY JSON, no markdown.`;
}
