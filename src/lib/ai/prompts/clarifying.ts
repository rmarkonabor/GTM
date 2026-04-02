export function buildClarifyingContext(
  companyProfile: object,
  answers: Record<string, string>
): string {
  return `Company Profile: ${JSON.stringify(companyProfile, null, 2)}

Clarifying Answers from founder/team:
${Object.entries(answers).map(([q, a]) => `Q: ${q}\nA: ${a}`).join("\n\n")}`;
}
