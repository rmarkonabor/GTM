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

3. keywords: 5–10 industry keywords and product category names that describe WHAT THIS NICHE IS — the market categories, product types, and industry segments that define this space.
   These are used as Apollo/LinkedIn search filters to FIND companies in this space.

   KEYWORD RULES (strictly follow):
   - Use PRODUCT CATEGORY NAMES and INDUSTRY SEGMENT TERMS only
   - Good examples: "payroll software", "contract management", "digital lending", "field service management", "HR software"
   - Do NOT include: specific tool/vendor names (Workday, Salesforce, SAP), methodologies (agile, scrum, lean), compliance acronyms (KYC, AML, PCI), or process names (onboarding, reconciliation)
   - Do NOT include: marketing terms, problem descriptions, or buzzwords
   - Do NOT include: generic words like "software", "technology", "platform", "SaaS", "enterprise" on their own
   - Think: "What product category or industry segment label would appear in a company's LinkedIn description or Apollo tag?"

   Examples by vertical:
     HR Tech → ["HR software", "payroll software", "applicant tracking", "workforce management", "talent management", "employee engagement", "performance management"]
     Legal Tech → ["contract management software", "legal software", "document management", "legal billing", "case management software"]
     Fintech → ["payment processing", "digital banking", "lending software", "financial services software", "banking software", "embedded finance"]
     Construction → ["construction software", "project management software", "field service management", "construction technology", "building information modeling"]
     Marketing Agency → ["digital marketing", "SEO services", "paid media", "content marketing", "marketing services", "creative agency"]

4. engagementModel: How the buying decision is typically made in this ICP.
   - "champion": One person champions and decides — outreach should activate and arm this individual
   - "champion-committee": Champion drives but needs committee sign-off — help the champion build internal consensus
   - "consensus": Multiple stakeholders must agree with no clear champion — multi-threaded outreach needed
   - "executive-top-down": C-suite or VP initiates and deploys — go directly to the decision maker

5. decisionCriteria: 3–5 things the buying org optimises for when evaluating a solution.
   Examples: "speed of implementation", "proven ROI before committing", "ease of use for non-technical users",
   "security and compliance", "integration with existing tools", "vendor reliability", "price sensitivity"

6. lossReasons: 3–5 reasons prospects in this ICP choose a competitor or do nothing.
   Examples: "incumbent vendor with multi-year contract", "internal build preference", "no dedicated budget owner",
   "decision deferred due to competing priorities", "unclear ROI for the budget owner"

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
      "keywords": ["HR software", "payroll software", "workforce management", "talent management", "employee engagement", "performance management", "HR technology"],
      "engagementModel": "champion-committee",
      "decisionCriteria": ["speed of implementation", "proven ROI", "integration with existing HRIS", "ease of adoption for HR admins"],
      "lossReasons": ["incumbent HRIS vendor with long contract", "no dedicated budget for point solutions", "competing IT priorities", "internal preference to configure existing tools"],
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
- keywords must be 5–10 PRODUCT CATEGORY NAMES and INDUSTRY SEGMENT TERMS — NOT specific tool names, vendor names, methodologies, compliance acronyms, or generic standalone words like "software", "technology", "platform", "SaaS"
- apolloKeywordTags: 5–8 lowercase terms describing what companies in this space DO or SELL
- Apollo seniority values: "owner", "founder", "c_suite", "partner", "vp", "head", "director", "manager", "senior", "entry"
- companySize must use Apollo ranges: "1,10" | "11,20" | "21,50" | "51,100" | "101,200" | "201,500" | "501,1000" | "1001,2000" | "2001,5000" | "5001,10000" | "10001,"
- Buyer persona goals/challenges MUST reference the target market's urgent and important problems
- decisionCriteria and lossReasons must be specific to this ICP — not generic sales platitudes
- Return ONLY JSON, no markdown.`;
}
