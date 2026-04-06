// Pricing per 1M tokens (input / output) — updated April 2026
const PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  "gpt-4o": { input: 2.50, output: 10.00 },
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
  // Anthropic
  "claude-opus-4-6": { input: 15.00, output: 75.00 },
  "claude-sonnet-4-6": { input: 3.00, output: 15.00 },
  "claude-haiku-4-5-20251001": { input: 0.80, output: 4.00 },
  // Google
  "gemini-2.0-pro-exp": { input: 1.25, output: 5.00 },
  "gemini-2.0-flash": { input: 0.075, output: 0.30 },
  "gemini-2.0-flash-lite": { input: 0.075, output: 0.30 },
};

export function calculateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number {
  const p = PRICING[modelId];
  if (!p) return 0;
  return (promptTokens * p.input + completionTokens * p.output) / 1_000_000;
}

export function formatCost(usd: number): string {
  if (usd === 0) return "$0.00";
  if (usd < 0.001) return `$${(usd * 1000).toFixed(3)}m`; // show in milli-dollars
  return `$${usd.toFixed(4)}`;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
