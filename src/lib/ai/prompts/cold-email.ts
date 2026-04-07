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
- Opener: personalised, reference a specific pain point or trigger event — NEVER "Hope this email finds you well"
- Body: 3–5 lines max, one idea per email, outcome-focused not feature-focused
- CTA: one specific ask (15-min call, reply, quick question) — NEVER "let me know if interested"
- No generic buzzwords: "synergy", "leverage", "circle back", "reach out"
- Plain text tone — no HTML, no bullet lists in body, no bold or italic markers

SPINTAX FORMAT:
Use the format {VariantA|VariantB|VariantC} anywhere you want variation.

SMARTLEAD SPINTAX RULES — follow these exactly:

1. STRATEGIC PLACEMENT ONLY — 8 to 12 spintax blocks per email, spread across these zones:
   - Subject line: 2–3 blocks
   - Opening line: 2–3 blocks
   - Body paragraphs: 4–6 blocks total (spread across sentences, not every word)
   - CTA line: 1–2 blocks
   - Closing/sign-off: 1–2 blocks

2. NEVER spin key value propositions — the core benefit, the specific outcome, the company name stay fixed.
   BAD:  {We help|Our platform helps|You can use us to help} teams {cut|reduce|lower} {churn|customer attrition|turnover}.
   GOOD: We help {revenue|customer success|growth} teams cut churn by 30%+ in the first quarter.

3. NEVER create grammatically broken combinations. Every variant must work as a standalone sentence.
   BAD:  {Quick question|Hope you don't mind me asking|I wanted to ask} — are you currently {using|utilising|working with} a {tool|solution|platform}?
   (The first two openers don't connect to "— are you currently…" grammatically for all combos.)
   GOOD: {Quick question|One thing I'm curious about|I had to ask} — are you currently relying on spreadsheets for this?

4. EACH VARIANT must be meaningfully different — not synonyms, different angles, tones, or specifics.
   BAD:  {reduce|cut|lower|decrease} (same meaning, different word)
   GOOD: {reduce manual work by 40%|free up 8 hours a week|stop doing this manually}

5. BALANCE ACROSS ALL 3 EMAILS — each email in the sequence should have a different tone/angle:
   - Email 1: Pain-focused, cold first touch
   - Email 2: Social proof or insight angle, follow-up
   - Email 3: Break-up email, direct and short

SPINTAX EXAMPLES (these are patterns to follow, not copy):

Subject spintax:
  {Still managing [X] manually?|The [X] problem most [role]s ignore|How [Company] fixed [X] in 90 days}

Opening spintax:
  {I came across [Company] and noticed|Saw that [Company] recently|Was looking at [Company]'s [signal]} — {looks like you're scaling fast|impressive growth lately|you're in an interesting space}.

Body spintax:
  Most {[role]s|teams like yours|companies at your stage} {struggle with|run into|hit a wall with} [pain point] {when they hit [milestone]|as they scale|without the right system}.
  {We've helped [similar companies]|Teams like [reference] use us to|[Company] helped [reference] to} [specific outcome].

CTA spintax:
  {Worth a 15-min call this week?|Open to a quick chat to see if this fits?|Would it make sense to connect briefly?}

Closing spintax:
  {Either way, happy to share more if useful.|No pressure — just thought it was relevant.|Let me know either way.}

SEQUENCE CADENCE (you decide the exact days based on what makes sense for this market):
- Step 1: Day 0 — Cold first touch, pain-focused
- Step 2: Day 3–7 — Follow-up, different angle (social proof, insight, or case study)
- Step 3: Day 10–14 — Short break-up email, final nudge

ANNOTATIONS:
For each email, annotate the key spintax choices to explain their metric impact:
- subject → open_rate: why this subject line variation increases opens
- opener → reply_rate: why this opener increases replies
- body → engagement: why this body structure drives engagement
- cta → reply_rate: why this CTA drives replies

The "impact" field must be a specific, data-backed insight (e.g. "Subject lines referencing a specific pain point average 47% higher open rates vs generic subject lines in B2B outreach").

Output JSON only — no extra prose.`;
}
