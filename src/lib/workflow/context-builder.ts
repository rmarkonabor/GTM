import {
  WorkflowContext,
  ManifestoOutput,
  SegmentationOutput,
  CompetitiveAnalysisOutput,
  ICPOutput,
  TargetMarketsOutput,
} from "@/types/gtm";
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

  // Sections emitted in workflow order so AI reads prior steps before later ones
  if (ctx.steps.INDUSTRY_PRIORITY) {
    parts.push("\n=== INDUSTRY PRIORITIES ===");
    parts.push(JSON.stringify(ctx.steps.INDUSTRY_PRIORITY, null, 2));
  }

  if (ctx.steps.ICP) {
    parts.push("\n=== ICP DEFINITIONS ===");
    parts.push(JSON.stringify(ctx.steps.ICP, null, 2));
  }

  if (ctx.steps.TARGET_MARKETS) {
    parts.push("\n=== TARGET MARKETS ===");
    parts.push(JSON.stringify(ctx.steps.TARGET_MARKETS, null, 2));
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

/**
 * Builds a focused, compact context string specifically for cold email generation.
 * Unlike buildStepContext (which dumps all steps as full JSON), this extracts only
 * the fields that are actually useful for writing emails — keeping prompts small and fast.
 */
export function buildColdEmailContext(ctx: WorkflowContext, targetMarketName: string): string {
  const lines: string[] = [];

  // 1. Company overview
  const cp = ctx.companyProfile;
  lines.push(`COMPANY: ${cp.name}`);
  lines.push(`Description: ${cp.description}`);
  lines.push(`Product: ${cp.primaryProduct}`);
  lines.push(`Target audience: ${cp.targetAudience}`);
  if (cp.keyDifferentiators?.length) {
    lines.push(`Key differentiators: ${cp.keyDifferentiators.join(", ")}`);
  }
  if (cp.currentCustomerExamples?.length) {
    lines.push(`Customer examples: ${cp.currentCustomerExamples.join(", ")}`);
  }
  if (cp.geographicFocus) lines.push(`Geography: ${cp.geographicFocus}`);

  // 2. Clarifying answers — often contain proof points and specific details
  const answers = ctx.clarifyingAnswers ?? {};
  if (Object.keys(answers).length > 0) {
    lines.push("\nCOMPANY CONTEXT (from team):");
    for (const [q, a] of Object.entries(answers)) {
      lines.push(`${q}: ${a}`);
    }
  }

  // 3. Target market — only the market we're writing for
  const tmOutput = ctx.steps.TARGET_MARKETS as TargetMarketsOutput | undefined;
  if (tmOutput?.markets) {
    const market =
      tmOutput.markets.find((m) => m.name === targetMarketName) ??
      tmOutput.markets[0];
    if (market) {
      lines.push(`\nTARGET MARKET: ${market.name}`);
      lines.push(`Why this market: ${market.whyRightMarket}`);
      if (market.urgentProblems?.length) {
        lines.push(`Urgent problems: ${market.urgentProblems.join("; ")}`);
      }
      if (market.importantProblems?.length) {
        lines.push(`Important problems: ${market.importantProblems.join("; ")}`);
      }
      if (market.macroTrends?.length) {
        lines.push(`Macro trends: ${market.macroTrends.join("; ")}`);
      }
    }
  }

  // 4. Buyer personas — who we're writing to
  const icpOutput = ctx.steps.ICP as ICPOutput | undefined;
  if (icpOutput?.icps?.length) {
    lines.push("\nBUYER PERSONAS:");
    const personas = icpOutput.icps.flatMap((icp) => icp.buyerPersonas ?? []).slice(0, 4);
    for (const p of personas) {
      const parts = [`• ${p.title}`];
      if (p.goals?.length) parts.push(`Goals: ${p.goals.slice(0, 2).join(", ")}`);
      if (p.challenges?.length) parts.push(`Challenges: ${p.challenges.slice(0, 2).join(", ")}`);
      if (p.triggerEvents?.length) parts.push(`Trigger events: ${p.triggerEvents.slice(0, 2).join(", ")}`);
      lines.push(parts.join(" | "));
    }
  }

  // 5. Messaging framework — elevator pitch, pillars, why choose us
  const manifesto = ctx.steps.MANIFESTO as ManifestoOutput | undefined;
  if (manifesto) {
    lines.push("\nMESSAGING:");
    if (manifesto.elevatorPitch) lines.push(`Elevator pitch: ${manifesto.elevatorPitch}`);
    if (manifesto.whyChooseThem) lines.push(`Why choose us: ${manifesto.whyChooseThem}`);
    if (manifesto.messagingPillars?.length) {
      lines.push("Messaging pillars:");
      for (const p of manifesto.messagingPillars.slice(0, 3)) {
        const support = p.supportingPoints?.slice(0, 2).join("; ") ?? "";
        lines.push(`  ${p.pillar}: ${p.headline}${support ? ` — ${support}` : ""}`);
      }
    }
  }

  // 6. Segmentation — messaging angles for the relevant segment
  const segOutput = ctx.steps.SEGMENTATION as SegmentationOutput | undefined;
  if (segOutput?.segments?.length) {
    const seg =
      segOutput.segments.find(
        (s) =>
          s.name.toLowerCase().includes(targetMarketName.toLowerCase()) ||
          targetMarketName.toLowerCase().includes(s.name.toLowerCase())
      ) ?? segOutput.segments[0];
    if (seg?.positioning) {
      lines.push(`\nSEGMENT POSITIONING (${seg.name}):`);
      if (seg.positioning.ourAngle) lines.push(`Our angle: ${seg.positioning.ourAngle}`);
      if (seg.positioning.messagingHook) lines.push(`Hook: ${seg.positioning.messagingHook}`);
      if (seg.positioning.proofPoints?.length) {
        lines.push(`Proof points: ${seg.positioning.proofPoints.slice(0, 3).join("; ")}`);
      }
      if (seg.positioning.ctaApproach) lines.push(`CTA approach: ${seg.positioning.ctaApproach}`);
    }
  }

  // 7. Competitive wins — where we beat alternatives (useful for contrast/positioning)
  const compOutput = ctx.steps.COMPETITIVE as CompetitiveAnalysisOutput | undefined;
  if (compOutput?.competitors?.length) {
    const wins = compOutput.competitors
      .flatMap((c) => c.whereClientWins ?? [])
      .slice(0, 5);
    if (wins.length) {
      lines.push(`\nWHERE WE WIN VS ALTERNATIVES: ${wins.join("; ")}`);
    }
  }

  return lines.join("\n");
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

  return {
    projectId,
    websiteUrl: project.websiteUrl,
    companyProfile: project.companyProfile as unknown as WorkflowContext["companyProfile"],
    clarifyingAnswers: (project.clarifyingQs as { answers?: Record<string, string> })?.answers ?? {},
    businessType: project.businessType ?? "other",
    steps,
  };
}
