import { WorkflowContext } from "@/types/gtm";
import { prisma } from "@/lib/db/client";

export function buildStepContext(ctx: WorkflowContext): string {
  const parts: string[] = [];

  parts.push("=== COMPANY PROFILE ===");
  parts.push(JSON.stringify(ctx.companyProfile, null, 2));

  if (Object.keys(ctx.clarifyingAnswers).length > 0) {
    parts.push("\n=== CLARIFYING ANSWERS FROM TEAM ===");
    Object.entries(ctx.clarifyingAnswers).forEach(([q, a]) => {
      parts.push(`Q: ${q}\nA: ${a}`);
    });
  }

  // Sections emitted in workflow execution order so AI reads prior steps before later ones
  // Order: INDUSTRY_PRIORITY → TARGET_MARKETS → ICP → COMPETITIVE → SEGMENTATION → MANIFESTO
  if (ctx.steps.INDUSTRY_PRIORITY) {
    parts.push("\n=== INDUSTRY PRIORITIES ===");
    parts.push(JSON.stringify(ctx.steps.INDUSTRY_PRIORITY, null, 2));
  }

  if (ctx.steps.TARGET_MARKETS) {
    parts.push("\n=== TARGET MARKETS ===");
    parts.push(JSON.stringify(ctx.steps.TARGET_MARKETS, null, 2));
  }

  if (ctx.steps.ICP) {
    parts.push("\n=== ICP DEFINITIONS ===");
    parts.push(JSON.stringify(ctx.steps.ICP, null, 2));
  }

  if (ctx.steps.COMPETITIVE) {
    parts.push("\n=== COMPETITIVE ANALYSIS ===");
    parts.push(JSON.stringify(ctx.steps.COMPETITIVE, null, 2));
  }

  if (ctx.steps.SEGMENTATION) {
    parts.push("\n=== SEGMENTS ===");
    parts.push(JSON.stringify(ctx.steps.SEGMENTATION, null, 2));
  }

  if (ctx.steps.MANIFESTO) {
    parts.push("\n=== MESSAGING & MANIFESTO ===");
    parts.push(JSON.stringify(ctx.steps.MANIFESTO, null, 2));
  }

  return parts.join("\n");
}

export async function buildContextFromDB(projectId: string): Promise<WorkflowContext | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { steps: true },
  });
  if (!project) return null;

  const steps: Partial<WorkflowContext["steps"]> = {};
  for (const s of project.steps) {
    if (s.status === "COMPLETE" && s.output) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (steps as any)[s.stepName] = s.output;
    }
  }

  // Map answers from { [q.id]: answer } → { [question text]: answer } so the LLM
  // prompt shows readable questions rather than opaque IDs.
  const clarifyingQsRaw = project.clarifyingQs as {
    questions?: Array<{ id: string; question: string }>;
    answers?: Record<string, string>;
  } | null;
  const answersById = clarifyingQsRaw?.answers ?? {};
  const clarifyingAnswers: Record<string, string> = {};
  for (const q of (clarifyingQsRaw?.questions ?? [])) {
    if (answersById[q.id]) clarifyingAnswers[q.question] = answersById[q.id];
  }

  return {
    projectId,
    websiteUrl: project.websiteUrl,
    companyProfile: project.companyProfile as unknown as WorkflowContext["companyProfile"],
    clarifyingAnswers,
    businessType: project.businessType ?? "other",
    steps,
  };
}
