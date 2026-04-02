export function buildResearchPrompt(websiteUrl: string, scrapedContent: string): string {
  return `You are a senior GTM strategist. Analyze the following company website content and extract a structured company profile.

Website URL: ${websiteUrl}

Website Content:
${scrapedContent}

Extract and return a JSON object with this exact structure:
{
  "companyProfile": {
    "name": "company name",
    "website": "${websiteUrl}",
    "description": "1-2 sentence company description",
    "businessType": "b2b_saas" | "agency" | "services" | "other",
    "primaryProduct": "main product/service offering",
    "targetAudience": "who they serve",
    "geographicFocus": "geographic market focus",
    "keyDifferentiators": ["differentiator 1", "differentiator 2"],
    "currentCustomerExamples": ["customer 1 if mentioned"],
    "techStack": ["technologies used or integrated with"],
    "foundedYear": null or number,
    "teamSize": "size range if mentioned",
    "fundingStage": "stage if mentioned"
  },
  "questionsNeeded": [
    {
      "id": "q1",
      "question": "the question",
      "purpose": "why this matters for GTM",
      "optional": false
    }
  ]
}

IMPORTANT:
- questionsNeeded should have 0-5 questions. Only ask what is GENUINELY unclear from the website.
- If businessType, target audience, and geography are obvious, ask 0-1 questions.
- Priority topics to ask about (only if ambiguous): primary target customer, geographic focus, current traction, main differentiator, biggest GTM challenge.
- Return ONLY the JSON, no markdown, no explanation.`;
}
