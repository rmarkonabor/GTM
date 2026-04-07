/**
 * Single-shot cold email sequence prompt.
 *
 * Generates the complete 4-step sequence (strategy + 4 emails) in one LLM call
 * to avoid the complexity of chaining separate invocations.
 */
export function buildColdEmailPrompt(context: string, targetMarketName: string): string {
  return `You are a B2B cold email strategist and copywriter. Using the GTM context below, write a complete 4-step cold email sequence for the "${targetMarketName}" market.

=== GTM CONTEXT ===
${context}

=== YOUR TASK ===
Produce a full campaign in ONE response:

1. strategy_summary (2-3 sentences) — what angle you're taking and why for this market
2. campaign_brief (1-2 sentences) — what this sequence should achieve
3. subject_lines — exactly 3 options for Email 1, each ≤9 words, each using a DIFFERENT angle (pain / curiosity / trigger / specificity). Include rationale for each.
4. emails — exactly 4 emails in this order, each with subject, body, waitDays, angle, and annotations:

   a) email_1 — COLD FIRST TOUCH
      - waitDays: 0
      - Body 50–100 words, 3–4 short sentences
      - Do NOT lead with a pitch. Open relevant to the prospect's world.
      - CTA: one specific low-friction ask

   b) follow_up_1 — NEW REASON TO REPLY
      - waitDays: 4–6
      - Different angle from email_1 (social proof / insight / benchmark / case study)
      - Reference the first email only if it adds value

   c) follow_up_2 — THIRD DISTINCT ANGLE
      - waitDays: 9–12
      - Must feel like new information — different pain point, benchmark, outcome, or trigger
      - Not a reminder

   d) break_up_email — CLOSE THE LOOP
      - waitDays: 14–18
      - 2–3 sentences maximum
      - Honest, easy to reply to, not passive-aggressive

5. missing_inputs — data points that would improve relevance if known

=== WRITING STANDARDS (non-negotiable) ===
- Clear, simple language. Sound human, direct, commercially aware.
- Focus on the prospect's world — not the product.
- No buzzwords or empty claims ("cutting-edge", "game-changing").
- No over-explaining. No leading with a pitch.
- CTAs feel easy to reply to ("Worth a quick chat?", "Does this resonate?").

=== SPINTAX FORMAT ===
Use {VariantA|VariantB|VariantC} blocks within subject and body:
- 8–12 spintax blocks per email total
- Distribute across subject (2-3), opener (2-3), body (3-5), CTA (1-2), closing (1-2)
- Every variant must be grammatically correct standalone
- Variants must be meaningfully different, not synonyms
- Never spin core value propositions or the company name

=== OTHER RULES ===
- PERSONALIZATION: Use only when it improves relevance. Avoid shallow or creepy.
- PROOF: Only use metrics present in the GTM context. Never fabricate.
- annotations: 1–4 entries per email explaining the metric impact of key choices.
- "angle" field: 1 sentence — what new reason to reply does this email give?

Output JSON only.`;
}
