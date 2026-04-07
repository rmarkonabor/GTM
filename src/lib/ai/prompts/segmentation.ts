export function buildSegmentationPrompt(context: string, targetMarkets: object[]): string {
  return `You are a senior GTM strategist. Based on the company profile, target markets, ICPs, and competitive landscape below, define actionable market segments — each with a specific positioning strategy.

${context}

TARGET MARKETS (PRIMARY INPUT — segments must be derived from these):
${JSON.stringify(targetMarkets, null, 2)}

IMPORTANT: Segments must be grounded in the target markets above. Each segment should represent a specific slice of one or more target markets — combining size, geography, and industry dimensions. The segment's pain points, messaging, and positioning must directly address the urgent and important problems identified in the corresponding target market(s).

Create 3-6 segments. For each segment, define exactly how to position and message to them based on their specific pain points from the target market analysis.

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
      "rationale": "Why this segment is highest priority — reference the target market's urgency and trends",
      "positioning": {
        "keyPainPoints": ["specific pain from target market's urgent problems", "specific pain 2"],
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
- Each segment must trace back to one or more target markets
- Pain points must come from the target market's urgent/important problems — not generic
- messagingHook should be a complete sentence they would respond to
- proofPoints should be concrete (numbers, outcomes, comparisons)
- ctaApproach should match the segment's buying behavior (enterprise = consultation, SMB = trial, etc.)
- Return ONLY JSON, no markdown.`;
}
