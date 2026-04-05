export function buildIndustryPriorityPrompt(context: string): string {
  return `You are a senior GTM strategist. Based on the company profile and clarifying answers below, identify and rank the industries this company should prioritize targeting.

${context}

This is the FIRST strategic step — before identifying specific target markets. You are answering: which vertical industries are the best fit for this company's product or service?

For each industry:
1. Why is this industry a strong fit for this company? (be specific to what they actually offer)
2. What urgent pain points exist in this industry that the company directly addresses?
3. What does the company specifically offer to solve those pain points?
4. How would the company and buyers in this industry work together? (engagement model, sales motion)
5. What is your honest assessment of estimated market fit?

Return JSON:
{
  "industries": [
    {
      "industryName": "Industry Name (e.g. FinTech, Healthcare IT, E-commerce Brands)",
      "priorityRank": 1,
      "painPoints": ["specific pain point 1", "specific pain point 2"],
      "whatClientOffers": ["specific offering mapped to this industry's pain", "another specific offering"],
      "howTheyWorkTogether": "description of the engagement model and how sales/delivery works with buyers in this industry",
      "estimatedMarketFit": "high"
    }
  ]
}

Rules:
- Identify 5-8 industries, ranked by fit (rank 1 = best fit)
- Base industries on the company's ACTUAL product and differentiation, not generic advice
- "high" fit: company has a clear, differentiated solution for a real urgent problem in this industry
- "medium" fit: company can serve this industry but faces more competition or lower urgency
- "low" fit: possible but not the best use of GTM resources right now
- Be SPECIFIC — "they need better data tools" is not acceptable; name the exact pain
- Return ONLY JSON, no markdown.`;
}
