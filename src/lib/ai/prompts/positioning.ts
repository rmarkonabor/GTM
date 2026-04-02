export function buildPositioningPrompt(context: string): string {
  return `You are a senior GTM strategist. Based on the competitive analysis and company profile below, define the positioning strategy.

${context}

Create a clear positioning that:
1. States the unique value proposition
2. Identifies key differentiation points
3. Crafts a positioning statement (Geoffrey Moore format: For [target], who [need], our [product] is a [category] that [benefit], unlike [alternative] we [differentiator])
4. Provides segment-specific differentiation angles

Return JSON:
{
  "uniqueValueProp": "one sentence UVP",
  "differentiationPoints": ["point 1", "point 2", "point 3"],
  "positioningStatement": "Geoffrey Moore format positioning statement",
  "bySegment": [
    {
      "segmentName": "Segment Name",
      "keyPlayers": ["Competitor A", "Competitor B"],
      "differentiationAngle": "how to position vs competitors in this specific segment"
    }
  ]
}

Return ONLY JSON, no markdown.`;
}
