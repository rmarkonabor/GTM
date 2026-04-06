export function buildSegmentationPrompt(context: string): string {
  return `You are a senior GTM strategist. Based on the company profile, target markets, ICPs, competitive landscape, and market sizing data below, define actionable market segments — each with a specific positioning strategy.

${context}

Create 3-6 segments that combine size, geography, and industry. For each segment, define exactly how to position and message to them based on their specific pain points.

Return JSON:
{
  "segments": [
    {
      "id": "seg_1",
      "name": "US Mid-Market HR Tech Companies",
      "sizeCategory": "mid-market",
      "geographies": ["United States"],
      "industries": ["Human Resources", "Computer Software"],
      "estimatedPriority": "tier-1",
      "rationale": "Why this segment is highest priority",
      "positioning": {
        "keyPainPoints": ["specific pain 1 for this segment", "specific pain 2"],
        "ourAngle": "How we uniquely solve their specific problem vs alternatives",
        "messagingHook": "The single most compelling message for this segment",
        "proofPoints": ["ROI stat or proof point 1", "proof point 2"],
        "ctaApproach": "Book a 30-min demo to see how we cut onboarding time by 40%"
      }
    }
  ]
}

sizeCategory: "enterprise" (1000+ employees), "mid-market" (201-1000), "smb" (51-200), "startup" (1-50)
estimatedPriority: "tier-1" (highest), "tier-2", "tier-3"

Rules:
- Pain points must be SPECIFIC to this segment — not generic
- messagingHook should be a complete sentence they would respond to
- proofPoints should be concrete (numbers, outcomes, comparisons)
- ctaApproach should match the segment's buying behavior (enterprise = consultation, SMB = trial, etc.)
- Return ONLY JSON, no markdown.`;
}
