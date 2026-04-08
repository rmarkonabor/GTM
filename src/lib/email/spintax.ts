/**
 * Spintax utilities — handles {VariantA|VariantB|VariantC} blocks.
 */

/** Resolve all spintax blocks to a single plain-text string. */
export function resolveSpintax(text: string, pick: "first" | "random" = "first"): string {
  return text.replace(/\{([^{}]+)\}/g, (_, inner: string) => {
    const parts = inner.split("|");
    if (parts.length < 2) return `{${inner}}`; // not a valid spintax block — leave as-is
    if (pick === "random") return parts[Math.floor(Math.random() * parts.length)];
    return parts[0];
  });
}

/** Count the number of valid spintax blocks (must have at least 2 variants). */
export function countSpintaxBlocks(text: string): number {
  return (text.match(/\{[^{}]+\|[^{}]+\}/g) ?? []).length;
}

/** Return true if there are unclosed or mismatched braces. */
export function hasUnclosedBlocks(text: string): boolean {
  let depth = 0;
  for (const ch of text) {
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    if (depth < 0) return true;
  }
  return depth !== 0;
}
