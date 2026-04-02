export function buildSegmentationPrompt(context: string): string {
  return `You are a senior GTM strategist. Based on the company profile, target markets, and ICPs below, define clear market segments.

${context}

Create segments that combine size, geography, and industry dimensions. Each segment should be actionable and distinct.

Return JSON:
{
  "segments": [
    {
      "id": "seg_1",
      "name": "US Mid-Market SaaS Companies",
      "sizeCategory": "mid-market",
      "geographies": ["United States"],
      "industries": ["SaaS", "Software"],
      "estimatedPriority": "tier-1",
      "rationale": "why this segment is a priority"
    }
  ]
}

sizeCategory options: "enterprise" (1000+ employees), "mid-market" (201-1000), "smb" (51-200), "startup" (1-50)
estimatedPriority: "tier-1" (highest), "tier-2", "tier-3"

Rules:
- 3-8 segments total
- Each segment must be distinct and targetable
- Return ONLY JSON, no markdown.`;
}
