export function buildManifestoPrompt(context: string): string {
  return `You are a senior brand strategist and copywriter. Based on the complete GTM strategy below, craft the company's messaging manifesto.

${context}

Create compelling messaging that:
1. Clearly identifies WHO the target audience is
2. Explains WHY the company exists and why they're different
3. States WHAT they do (clearly and concisely)
4. Convinces buyers WHY they should choose this company

Return JSON:
{
  "who": "clear description of the target audience",
  "whyExist": "the company's reason for being — the change they want to make",
  "whatTheyDo": "clear, jargon-free explanation of what they do",
  "whyChooseThem": "compelling reason to choose them over alternatives",
  "tagline": "5-8 word memorable tagline",
  "elevatorPitch": "2-3 sentence pitch covering who, what, why",
  "messagingPillars": [
    {
      "pillar": "Pillar Name (e.g. Speed, Trust, ROI)",
      "headline": "short punchy headline for this pillar",
      "supportingPoints": ["proof point 1", "proof point 2"]
    }
  ]
}

Rules:
- messagingPillars should have 3-4 pillars
- tagline must be memorable and differentiated — avoid generic phrases like "grow your business"
- elevatorPitch must name the target customer, the problem, and the unique solution
- Return ONLY JSON, no markdown.`;
}
