import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";

export const dynamic = "force-dynamic";

// ─── Type helpers ────────────────────────────────────────────────────────────

const str = (v: unknown): string =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : JSON.stringify(v);

const arr = (v: unknown): unknown[] =>
  Array.isArray(v) ? v : [];

function buildStepMap(steps: { stepName: string; status: string; output: unknown; draftOutput: unknown }[]) {
  const map: Record<string, unknown> = {};
  for (const s of steps) {
    const data = s.status === "AWAITING_APPROVAL" ? (s.draftOutput ?? s.output) : s.output;
    if (data && (s.status === "COMPLETE" || s.status === "AWAITING_APPROVAL")) {
      map[s.stepName] = data;
    }
  }
  return map;
}

// ─── Markdown builder ─────────────────────────────────────────────────────────

function buildMarkdown(project: {
  websiteUrl: string;
  companyProfile: unknown;
  steps: { stepName: string; status: string; output: unknown; draftOutput: unknown }[];
}): string {
  const lines: string[] = [];
  const push = (...args: string[]) => lines.push(...args);

  const stepMap = buildStepMap(project.steps);

  const profile = project.companyProfile as Record<string, unknown> | null;
  const industries = (stepMap.INDUSTRY_PRIORITY as { industries: unknown[] } | undefined)?.industries ?? [];
  const markets = (stepMap.TARGET_MARKETS as { markets: unknown[] } | undefined)?.markets ?? [];
  const icps = (stepMap.ICP as { icps: unknown[] } | undefined)?.icps ?? [];
  const competitors = (stepMap.COMPETITIVE as { competitors: unknown[] } | undefined)?.competitors ?? [];
  const segments = (stepMap.SEGMENTATION as { segments: unknown[] } | undefined)?.segments ?? [];
  const manifesto = stepMap.MANIFESTO as Record<string, unknown> | undefined;

  // ── Title ──
  const companyName = str(profile?.name ?? "Company");
  push(`# ${companyName} — GTM Strategy`, "");

  if (manifesto?.tagline) {
    push(`> ${str(manifesto.tagline)}`, "");
  }

  push(`**Website:** ${project.websiteUrl}  `);
  push(`**Generated:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, "", "---", "");

  // ── Company Profile ──
  if (profile) {
    push("## Company Profile", "");
    if (profile.description) push(str(profile.description), "");
    if (profile.primaryProduct) push(`**Primary Product:** ${str(profile.primaryProduct)}  `);
    if (profile.targetAudience) push(`**Target Audience:** ${str(profile.targetAudience)}  `);
    if (profile.businessType) push(`**Business Type:** ${str(profile.businessType)}  `);
    if (profile.geographicFocus) push(`**Geographic Focus:** ${str(profile.geographicFocus)}  `);

    const diffs = arr(profile.keyDifferentiators);
    if (diffs.length) {
      push("", "**Key Differentiators:**");
      for (const d of diffs) push(`- ${str(d)}`);
    }

    const examples = arr(profile.currentCustomerExamples);
    if (examples.length) {
      push("", "**Current Customer Examples:**");
      for (const e of examples) push(`- ${str(e)}`);
    }
    push("", "---", "");
  }

  // ── Manifesto ──
  if (manifesto) {
    push("## Messaging & Positioning", "");
    if (manifesto.elevatorPitch) push(str(manifesto.elevatorPitch), "");
    if (manifesto.who) push(`**Who we serve:** ${str(manifesto.who)}  `);
    if (manifesto.whyChooseThem) push(`**Why choose us:** ${str(manifesto.whyChooseThem)}  `);

    const pillars = arr(manifesto.messagingPillars);
    if (pillars.length) {
      push("", "### Messaging Pillars", "");
      for (const p of pillars) {
        const pillar = p as Record<string, unknown>;
        push(`#### ${str(pillar.pillar)}`, "");
        push(str(pillar.headline), "");
        const pts = arr(pillar.supportingPoints);
        if (pts.length) {
          for (const pt of pts) push(`- ${str(pt)}`);
          push("");
        }
      }
    }
    push("---", "");
  }

  // ── Target Markets ──
  if (markets.length) {
    push("## Target Markets", "");
    for (const m of markets) {
      const market = m as Record<string, unknown>;
      push(`### ${str(market.name)}`, "");
      if (market.whyNow) push(`**Why now:** ${str(market.whyNow)}  `);
      if (market.whyUs) push(`**Why us:** ${str(market.whyUs)}  `);
      if (market.whyRightMarket) push(`**Why this market:** ${str(market.whyRightMarket)}  `);
      if (market.priorityScore) push(`**Priority score:** ${str(market.priorityScore)}/10  `);

      const urgent = arr(market.urgentProblems);
      if (urgent.length) {
        push("", "**Urgent Problems:**");
        for (const p of urgent) push(`- ${str(p)}`);
      }

      const important = arr(market.importantProblems);
      if (important.length) {
        push("", "**Important Problems:**");
        for (const p of important) push(`- ${str(p)}`);
      }

      const trends = arr(market.macroTrends);
      if (trends.length) {
        push("", "**Macro Trends:**");
        for (const t of trends) push(`- ${str(t)}`);
      }
      push("");
    }
    push("---", "");
  }

  // ── ICP ──
  if (icps.length) {
    push("## Ideal Customer Profiles", "");
    for (const icp of icps) {
      const i = icp as Record<string, unknown>;
      push(`### ${str(i.niche)} (${str(i.standardIndustry)})`, "");

      if (i.engagementModel) push(`**Buying motion:** ${str(i.engagementModel)}  `);

      const firmographics = i.firmographics as Record<string, unknown> | undefined;
      if (firmographics) {
        const sizes = arr(firmographics.companySize);
        if (sizes.length) push(`**Company size:** ${sizes.map(str).join(", ")}  `);
        const geos = arr(firmographics.geographies);
        if (geos.length) push(`**Geographies:** ${geos.map(str).join(", ")}  `);
        const revs = arr(firmographics.revenue);
        if (revs.length) push(`**Revenue:** ${revs.map(str).join(", ")}  `);
      }

      const decisionCriteria = arr(i.decisionCriteria);
      if (decisionCriteria.length) {
        push("", "**Decision Criteria:**");
        for (const c of decisionCriteria) push(`- ${str(c)}`);
      }

      const lossReasons = arr(i.lossReasons);
      if (lossReasons.length) {
        push("", "**Common Objections to Pre-empt:**");
        for (const r of lossReasons) push(`- ${str(r)}`);
      }

      const keywords = arr(i.keywords);
      if (keywords.length) push("", `**Keywords:** ${keywords.map(str).join(", ")}`);

      const personas = arr(i.buyerPersonas);
      if (personas.length) {
        push("", "**Buyer Personas:**");
        for (const persona of personas) {
          const bp = persona as Record<string, unknown>;
          push(``, `**${str(bp.title)}**`);
          const goals = arr(bp.goals);
          if (goals.length) push(`*Goals:* ${goals.map(str).join(" · ")}`);
          const challenges = arr(bp.challenges);
          if (challenges.length) push(`*Challenges:* ${challenges.map(str).join(" · ")}`);
          const triggers = arr(bp.triggerEvents);
          if (triggers.length) push(`*Trigger events:* ${triggers.map(str).join(" · ")}`);
        }
      }
      push("");
    }
    push("---", "");
  }

  // ── Market Segments ──
  if (segments.length) {
    push("## Market Segments & Positioning", "");
    for (const seg of segments) {
      const s = seg as Record<string, unknown>;
      const priority = str(s.estimatedPriority ?? "");
      const tierLabel = priority === "tier-1" ? "🥇 Tier 1" : priority === "tier-2" ? "🥈 Tier 2" : "🥉 Tier 3";
      push(`### ${str(s.name)} — ${tierLabel}`, "");
      push(`**Size:** ${str(s.sizeCategory)}  `);
      const geos = arr(s.geographies);
      if (geos.length) push(`**Geographies:** ${geos.map(str).join(", ")}  `);
      const inds = arr(s.industries);
      if (inds.length) push(`**Industries:** ${inds.map(str).join(", ")}  `);
      if (s.buyingMotion) push(`**Buying motion:** ${str(s.buyingMotion)}  `);
      if (s.painMultiplier) push(`**Pain multiplier:** ${str(s.painMultiplier)}  `);
      if (s.rationale) push("", str(s.rationale));

      const pos = s.positioning as Record<string, unknown> | undefined;
      if (pos) {
        if (pos.messagingHook) push("", `**Messaging Hook:** *"${str(pos.messagingHook)}"*`);
        if (pos.ourAngle) push("", `**Our angle:** ${str(pos.ourAngle)}`);

        const painPoints = arr(pos.keyPainPoints);
        if (painPoints.length) {
          push("", "**Key Pain Points:**");
          for (const p of painPoints) push(`- ${str(p)}`);
        }

        const proofPoints = arr(pos.proofPoints);
        if (proofPoints.length) {
          push("", "**Proof Points:**");
          for (const p of proofPoints) push(`- ${str(p)}`);
        }

        if (pos.ctaApproach) push("", `**CTA:** ${str(pos.ctaApproach)}`);
      }
      push("");
    }
    push("---", "");
  }

  // ── Industry Priorities ──
  if (industries.length) {
    push("## Industry Priorities", "");
    for (const ind of industries) {
      const industry = ind as Record<string, unknown>;
      const fit = str(industry.estimatedMarketFit ?? "");
      push(`### ${str(industry.niche)} (${str(industry.standardIndustry)}) — Fit: ${fit}`, "");
      if (industry.howTheyWorkTogether) push(str(industry.howTheyWorkTogether), "");

      const painPoints = arr(industry.painPoints);
      if (painPoints.length) {
        push("**Pain Points:**");
        for (const p of painPoints) push(`- ${str(p)}`);
        push("");
      }
    }
    push("---", "");
  }

  // ── Competitive Analysis ──
  if (competitors.length) {
    push("## Competitive Landscape", "");
    for (const comp of competitors) {
      const c = comp as Record<string, unknown>;
      const threat = str(c.threatLevel ?? "");
      const trend = str(c.edgeTrend ?? "");
      const threatLabel = threat === "high" ? "⚠️ High" : threat === "medium" ? "⚡ Medium" : threat === "low" ? "✓ Low" : "";
      const trendLabel = trend === "gaining" ? "↑ Gaining" : trend === "holding" ? "→ Holding" : trend === "losing" ? "↓ Losing" : "";

      push(`### ${str(c.name)}${c.domain ? ` (${str(c.domain)})` : ""}`, "");
      if (threatLabel || trendLabel) push(`**Threat:** ${threatLabel}  **Trend:** ${trendLabel}  `);
      if (c.valueProp) push(`**Value Prop:** ${str(c.valueProp)}  `);
      if (c.targetSegment) push(`**Targets:** ${str(c.targetSegment)}  `);
      if (c.pricingModel) push(`**Pricing:** ${str(c.pricingModel)}  `);

      const theyWin = arr(c.whereTheyWin);
      if (theyWin.length) {
        push("", "**Where they win:**");
        for (const w of theyWin) push(`- ${str(w)}`);
      }

      const weWin = arr(c.whereClientWins);
      if (weWin.length) {
        push("", "**Where we win:**");
        for (const w of weWin) push(`- ${str(w)}`);
      }
      push("");
    }
    push("---", "");
  }

  push(`*Exported from GTM Planning Tool*`);

  return lines.join("\n");
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      include: { steps: true },
    });

    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    const markdown = buildMarkdown({
      websiteUrl: project.websiteUrl,
      companyProfile: project.companyProfile,
      steps: project.steps.map((s) => ({
        stepName: s.stepName,
        status: s.status,
        output: s.output,
        draftOutput: s.draftOutput,
      })),
    });

    const companyName = (project.companyProfile as Record<string, unknown> | null)?.name;
    const filename = `${typeof companyName === "string" ? companyName.replace(/[^a-z0-9]/gi, "-").toLowerCase() : "gtm"}-strategy.md`;

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
