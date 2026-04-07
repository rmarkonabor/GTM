const WRITING_STANDARDS = `
WRITING STANDARDS (non-negotiable):
- Use clear, simple language. Sound human, direct, commercially aware.
- Focus on the prospect's world — not the product.
- No buzzwords, fluff, or empty claims ("cutting-edge", "game-changing").
- No over-explaining. No leading with a pitch.
- CTA must feel easy to reply to (e.g. "Worth a quick chat?", "Does this sound familiar?").

SPINTAX FORMAT — {VariantA|VariantB|VariantC}:
- 8–12 spintax blocks per email across: subject (2-3), opener (2-3), body (3-5), CTA (1-2), closing (1-2)
- Every variant must be grammatically correct as a standalone sentence
- Variants must be meaningfully different — not synonyms
- Never spin core value propositions or the company name

PERSONALIZATION: Use only when it improves relevance — company initiative, role responsibility, market pressure, trigger event. Avoid shallow or creepy personalization.

PROOF: Only use metrics present in the GTM context. Never fabricate or exaggerate.

Output JSON only.`.trim();

export function buildStrategyPrompt(context: string, targetMarketName: string): string {
  return `You are a B2B cold email strategist. Using the GTM strategy below, define the campaign approach for the "${targetMarketName}" market.

=== GTM STRATEGY CONTEXT ===
${context}

=== YOUR TASK ===
1. Write a strategy_summary (2-3 sentences): what angle are we taking and why for this market?
2. Write a campaign_brief (1-2 sentences): what should this sequence achieve?
3. Write exactly 3 subject line options for the cold first touch email.
   - Each ≤9 words, relevant to the prospect's world, not clickbait
   - Each uses a DIFFERENT angle (pain / curiosity / trigger / specificity)
   - Include rationale for each
4. List missing_inputs: data points that would improve copy relevance if known.

Output JSON only.`;
}

export function buildEmailPrompt(
  context: string,
  targetMarketName: string,
  emailType: "email_1" | "follow_up_1" | "follow_up_2" | "break_up_email",
  strategySummary: string,
  prevEmails?: { type: string; body: string }[],
): string {
  const emailInstructions: Record<typeof emailType, string> = {
    email_1: `Write the COLD FIRST TOUCH email.
- Total body: 50–100 words, 3–4 short sentences ONLY
- Do NOT lead with a pitch or product description
- Open with something relevant to the prospect's world
- Do NOT ask for a meeting in the first line
- CTA: one specific low-friction ask`,

    follow_up_1: `Write FOLLOW-UP 1. It must add a NEW reason to reply — do not repeat email_1.
- Use a different angle: social proof, a specific insight, benchmark, or case study
- Reference what was in the first email only if it adds value
- Still keep it concise`,

    follow_up_2: `Write FOLLOW-UP 2. Must be a THIRD distinct angle — different from both previous emails.
- Could be: specific pain point, useful benchmark, short outcome story, different buyer trigger
- Should feel like new information, not a reminder`,

    break_up_email: `Write a SHORT BREAK-UP EMAIL — close the loop.
- 2–3 sentences maximum
- Simple, honest, easy to respond to
- Not passive-aggressive — just a genuine final reach-out`,
  };

  const prevEmailContext = prevEmails?.length
    ? `\n=== PREVIOUS EMAILS IN THIS SEQUENCE ===\n${prevEmails.map(e => `[${e.type}]\n${e.body}`).join("\n\n")}\n`
    : "";

  return `You are a B2B cold email copywriter. Write ONE email for a sequence targeting the "${targetMarketName}" market.

=== CAMPAIGN STRATEGY ===
${strategySummary}
${prevEmailContext}
=== GTM STRATEGY CONTEXT ===
${context}

=== THIS EMAIL: ${emailType.replace(/_/g, " ").toUpperCase()} ===
${emailInstructions[emailType]}

${WRITING_STANDARDS}

For waitDays: email_1=0, follow_up_1=4-6 days, follow_up_2=9-12 days, break_up_email=14-18 days.
The "angle" field should be 1 sentence: what new reason to reply does this email give?
Annotations: 1-4 entries explaining the metric impact of key choices.

Output JSON only.`;
}
