export function buildIndustryPriorityPrompt(context: string): string {
  return `You are a senior GTM strategist. Analyze the company profile below and identify the 5–8 priority industries this company should target, ranked by fit.

${context}

CRITICAL — You must separate three distinct things for each industry:

1. standardIndustry: The EXACT industry name used in LinkedIn and Apollo.io databases. Use these standard names only:
   Examples: "Computer Software", "Information Technology and Services", "Financial Services",
   "Banking", "Insurance", "Hospital & Health Care", "Medical Practice", "Legal Services",
   "Law Practice", "Human Resources", "Staffing and Recruiting", "Marketing and Advertising",
   "Management Consulting", "Accounting", "Real Estate", "Construction", "Manufacturing",
   "Retail", "Wholesale", "Transportation/Trucking/Railroad", "Logistics and Supply Chain",
   "Oil & Energy", "Utilities", "Education Management", "E-Learning", "Non-Profit Organization Management"
   (Use the exact LinkedIn/Apollo spelling — this value will be used as a database filter)

2. niche: The specific sub-segment or vertical within that standard industry.
   Examples: "HR Tech", "Legal Tech", "Fintech for SMBs", "Healthcare SaaS", "Construction Tech"
   (This is how you would describe the space in a pitch or outreach message)

3. keywords: 3–6 specific terms, technologies, or processes that buyers in this niche use.
   Examples: ["HRIS", "payroll", "workforce management"] or ["contract management", "e-discovery", "legal billing"]
   (These are for keyword-based targeting and outreach personalization)

For each industry also define:
- Why this industry is a priority (pain points specific to this niche)
- Exactly what the company offers to solve those pain points
- How the company and buyers would work together (engagement model)
- Estimated market fit: "high" | "medium" | "low"

Return JSON only:
{
  "industries": [
    {
      "standardIndustry": "Computer Software",
      "niche": "HR Tech",
      "keywords": ["HRIS", "payroll", "workforce management", "employee onboarding"],
      "priorityRank": 1,
      "painPoints": ["specific pain point 1", "specific pain point 2"],
      "whatClientOffers": ["specific offering 1", "specific offering 2"],
      "howTheyWorkTogether": "description of engagement model",
      "estimatedMarketFit": "high"
    }
  ]
}

Rules:
- 5–8 industries ranked by priority (1 = highest)
- standardIndustry must be a real LinkedIn/Apollo database value — never a made-up category
- niche should be a recognizable market term, not a generic description
- Be specific — "they need better tools" is not an acceptable pain point
- Return ONLY JSON, no markdown.`;
}
