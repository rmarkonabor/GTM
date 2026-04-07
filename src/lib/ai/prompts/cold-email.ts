export function buildColdEmailPrompt(
  context: string,
  targetMarketName: string,
): string {
  return `You are an elite B2B cold email copywriter. Using the GTM strategy data below, write a 3-step cold email sequence targeting the "${targetMarketName}" market.

=== GTM STRATEGY CONTEXT ===
${context}

=== INSTRUCTIONS ===

PRIMARY MARKET: "${targetMarketName}" — this is the buyer you are writing to. Use ALL strategy data (ICP firmographics, pain points, buyer personas, competitive positioning, messaging pillars, manifesto) to make every line hyper-relevant.

COLD EMAIL BEST PRACTICES:
- Subject line: ≤9 words, no clickbait, triggers curiosity or pain recognition
- Opener: personalised, reference a specific pain point or trigger event, no "Hope this email finds you well"
- Body: 3–5 lines max, one idea, outcome-focused not feature-focused
- CTA: one specific ask (15-min call, reply, quick question), not "let me know if interested"
- No generic buzzwords: "synergy", "leverage", "circle back", "reach out"
- Plain text tone — no HTML formatting in body

SPINTAX RULES:
- Use {OptionA|OptionB|OptionC} in subject, opener, and CTA for A/B variation
- Provide 2–3 realistic alternatives per spintax block
- Make each variant meaningfully different (not just synonyms)

SEQUENCE CADENCE (AI-decided — pick what makes sense for this market):
- Step 1: Day 0 — First touch
- Step 2: Day 3–7 — Follow-up, different angle or social proof
- Step 3: Day 10–14 — Break-up email or final nudge

ANNOTATIONS:
For each email, annotate the key parts showing how each element affects metrics:
- subject → open_rate
- opener → reply_rate
- body → engagement
- cta → reply_rate

The "impact" field should be a short, specific insight (e.g. "Pain-point subjects get 32% higher open rates than feature-benefit subjects").

Output JSON only — no extra prose.`;
}
