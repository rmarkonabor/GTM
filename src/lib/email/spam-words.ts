// Common spam trigger words categorised by type.
// Source: industry spam filter lists (SpamAssassin, MailChimp, SendGrid guidelines).

const SPAM_WORDS: { word: string; category: string }[] = [
  // Urgency / pressure
  { word: "act now", category: "urgency" },
  { word: "act immediately", category: "urgency" },
  { word: "limited time", category: "urgency" },
  { word: "urgent", category: "urgency" },
  { word: "expires", category: "urgency" },
  { word: "hurry", category: "urgency" },
  { word: "last chance", category: "urgency" },
  { word: "final notice", category: "urgency" },
  { word: "respond now", category: "urgency" },
  { word: "time sensitive", category: "urgency" },
  { word: "while supplies last", category: "urgency" },
  { word: "don't delete", category: "urgency" },
  { word: "don't hesitate", category: "urgency" },
  { word: "order now", category: "urgency" },
  { word: "buy now", category: "urgency" },
  { word: "call now", category: "urgency" },
  { word: "apply now", category: "urgency" },
  { word: "click here", category: "urgency" },
  { word: "click below", category: "urgency" },
  { word: "subscribe now", category: "urgency" },
  // Financial / money
  { word: "free", category: "financial" },
  { word: "free gift", category: "financial" },
  { word: "free trial", category: "financial" },
  { word: "free offer", category: "financial" },
  { word: "free access", category: "financial" },
  { word: "100% free", category: "financial" },
  { word: "no cost", category: "financial" },
  { word: "no fees", category: "financial" },
  { word: "no obligation", category: "financial" },
  { word: "no hidden fees", category: "financial" },
  { word: "no risk", category: "financial" },
  { word: "risk free", category: "financial" },
  { word: "money back", category: "financial" },
  { word: "money-back guarantee", category: "financial" },
  { word: "guaranteed", category: "financial" },
  { word: "100% guaranteed", category: "financial" },
  { word: "make money", category: "financial" },
  { word: "earn money", category: "financial" },
  { word: "extra income", category: "financial" },
  { word: "income from home", category: "financial" },
  { word: "earn extra cash", category: "financial" },
  { word: "fast cash", category: "financial" },
  { word: "cash bonus", category: "financial" },
  { word: "double your income", category: "financial" },
  { word: "wealth", category: "financial" },
  { word: "profit", category: "financial" },
  { word: "million dollars", category: "financial" },
  { word: "billion", category: "financial" },
  { word: "cash", category: "financial" },
  { word: "$$$", category: "financial" },
  { word: "!!!!", category: "financial" },
  // Clickbait / hype
  { word: "amazing", category: "clickbait" },
  { word: "incredible", category: "clickbait" },
  { word: "unbelievable", category: "clickbait" },
  { word: "you won't believe", category: "clickbait" },
  { word: "shocking", category: "clickbait" },
  { word: "mind-blowing", category: "clickbait" },
  { word: "revolutionary", category: "clickbait" },
  { word: "game changer", category: "clickbait" },
  { word: "game-changer", category: "clickbait" },
  { word: "once in a lifetime", category: "clickbait" },
  { word: "exclusive deal", category: "clickbait" },
  { word: "secret", category: "clickbait" },
  { word: "hidden", category: "clickbait" },
  { word: "miracle", category: "clickbait" },
  { word: "spectacular", category: "clickbait" },
  { word: "sensational", category: "clickbait" },
  { word: "outstanding offer", category: "clickbait" },
  { word: "special promotion", category: "clickbait" },
  { word: "special offer", category: "clickbait" },
  { word: "winner", category: "clickbait" },
  { word: "you have been selected", category: "clickbait" },
  { word: "you are a winner", category: "clickbait" },
  { word: "congratulations", category: "clickbait" },
  // Compliance / legal risk
  { word: "as seen on", category: "compliance" },
  { word: "not spam", category: "compliance" },
  { word: "this is not spam", category: "compliance" },
  { word: "removal instructions", category: "compliance" },
  { word: "unsubscribe", category: "compliance" },
  { word: "opt in", category: "compliance" },
  { word: "opt out", category: "compliance" },
  { word: "bulk email", category: "compliance" },
  { word: "mass email", category: "compliance" },
  { word: "email marketing", category: "compliance" },
  { word: "spam", category: "compliance" },
  // Dubious claims
  { word: "lowest price", category: "claims" },
  { word: "best price", category: "claims" },
  { word: "satisfaction guaranteed", category: "claims" },
  { word: "winner", category: "claims" },
  { word: "no catch", category: "claims" },
  { word: "no questions asked", category: "claims" },
  { word: "instant access", category: "claims" },
  { word: "instant results", category: "claims" },
  { word: "overnight", category: "claims" },
  { word: "results guaranteed", category: "claims" },
  { word: "promise", category: "claims" },
  { word: "we hate spam", category: "claims" },
];

/**
 * Checks a string for spam trigger words.
 * Returns all matches with their categories (de-duplicated by word).
 */
export function checkSpam(text: string): { word: string; category: string }[] {
  const lower = text.toLowerCase();
  const seen = new Set<string>();
  const results: { word: string; category: string }[] = [];

  for (const entry of SPAM_WORDS) {
    if (!seen.has(entry.word) && lower.includes(entry.word)) {
      seen.add(entry.word);
      results.push(entry);
    }
  }

  return results;
}
