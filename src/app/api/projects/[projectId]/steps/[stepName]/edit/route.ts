export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";
import { safeDecrypt } from "@/lib/crypto";
import { LLMPreference, DBPreferences } from "@/types/gtm";
import { buildContextFromDB } from "@/lib/workflow/context-builder";
import { runTargetMarkets } from "@/lib/workflow/steps/runTargetMarkets";
import { runIndustryPriority } from "@/lib/workflow/steps/runIndustryPriority";
import { runICP } from "@/lib/workflow/steps/runICP";
import { runSegmentation } from "@/lib/workflow/steps/runSegmentation";
import { runMarketSizing } from "@/lib/workflow/steps/runMarketSizing";
import { runCompetitive } from "@/lib/workflow/steps/runCompetitive";
import { runPositioning } from "@/lib/workflow/steps/runPositioning";
import { runManifesto } from "@/lib/workflow/steps/runManifesto";
import { runResearchEdit } from "@/lib/workflow/steps/runResearchEdit";
import { z } from "zod";

export const maxDuration = 120;

const schema = z.object({ prompt: z.string().min(1) });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STEP_FN: Record<string, (ctx: any, llm: any, db?: any) => Promise<any>> = {
  RESEARCH: runResearchEdit,
  TARGET_MARKETS: runTargetMarkets,
  INDUSTRY_PRIORITY: runIndustryPriority,
  ICP: runICP,
  SEGMENTATION: runSegmentation,
  MARKET_SIZING: (ctx, llm, db) => runMarketSizing(ctx, llm, db ?? {}),
  COMPETITIVE: runCompetitive,
  POSITIONING: runPositioning,
  MANIFESTO: runManifesto,
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; stepName: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }
    const { projectId, stepName } = await params;
    const body = await req.json();
    const { prompt } = schema.parse(body);

    const [project, user] = await Promise.all([
      prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } }),
      prisma.user.findUnique({ where: { id: session.user.id } }),
    ]);
    if (!project) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });

    const llmRaw = safeDecrypt(user?.llmPreference ?? null);
    if (!llmRaw) return NextResponse.json({ error: { code: "LLM_NOT_CONFIGURED", message: "Please configure your LLM in Settings." } }, { status: 400 });
    const llmPreference = JSON.parse(llmRaw) as LLMPreference;

    const dbRaw = safeDecrypt(user?.dbPreferences ?? null);
    const dbPreferences: DBPreferences = dbRaw ? JSON.parse(dbRaw) : {};

    const stepFn = STEP_FN[stepName];
    if (!stepFn) return NextResponse.json({ error: { code: "INVALID_STEP", message: "Unknown step." } }, { status: 400 });

    // Build context from DB
    const ctx = await buildContextFromDB(projectId);
    if (!ctx) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project context not found." } }, { status: 404 });
    ctx.editPrompt = prompt;

    // Mark step as running
    await prisma.projectStep.update({
      where: { projectId_stepName: { projectId, stepName: stepName as never } },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    let output: unknown;
    try {
      output = await stepFn(ctx, llmPreference, dbPreferences);
    } catch (err) {
      await prisma.projectStep.update({
        where: { projectId_stepName: { projectId, stepName: stepName as never } },
        data: { status: "AWAITING_APPROVAL" },
      });
      throw err;
    }

    // Save new version
    const versionCount = await prisma.projectStepVersion.count({ where: { projectId, stepName: stepName as never } });
    await prisma.projectStepVersion.create({
      data: {
        id: `${projectId}-${stepName}-${versionCount + 1}-${Date.now()}`,
        projectId,
        stepName: stepName as never,
        versionNum: versionCount + 1,
        output: output as object,
        prompt,
      },
    });

    // Update draftOutput, keep AWAITING_APPROVAL
    await prisma.projectStep.update({
      where: { projectId_stepName: { projectId, stepName: stepName as never } },
      data: { status: "AWAITING_APPROVAL", draftOutput: output as object },
    });

    return NextResponse.json({ success: true, output });
  } catch (err) {
    return errorResponse(err);
  }
}
