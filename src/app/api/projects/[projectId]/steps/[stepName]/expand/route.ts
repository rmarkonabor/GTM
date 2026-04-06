export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { safeDecrypt } from "@/lib/crypto";
import { buildContextFromDB } from "@/lib/workflow/context-builder";
import { expandIndustries, expandMarkets } from "@/lib/workflow/steps/expandStep";
import { LLMPreference, IndustryPriorityOutput, TargetMarketsOutput } from "@/types/gtm";
import { errorResponse } from "@/lib/errors/handlers";
import { z } from "zod";

const bodySchema = z.object({
  items: z.array(z.string().min(1)).min(1).max(10),
});

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

    if (stepName !== "INDUSTRY_PRIORITY" && stepName !== "TARGET_MARKETS") {
      return NextResponse.json(
        { error: { code: "INVALID_STEP", message: "Expand is only supported for INDUSTRY_PRIORITY and TARGET_MARKETS." } },
        { status: 400 }
      );
    }

    const body = bodySchema.parse(await req.json());

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    // Get current step (must be COMPLETE)
    const projectStep = await prisma.projectStep.findUnique({
      where: { projectId_stepName: { projectId, stepName: stepName as never } },
    });
    if (!projectStep || projectStep.status !== "COMPLETE" || !projectStep.output) {
      return NextResponse.json(
        { error: { code: "STEP_NOT_COMPLETE", message: "Step must be approved before expanding." } },
        { status: 400 }
      );
    }

    // Load LLM preference
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    const llmRaw = safeDecrypt(user?.llmPreference ?? null);
    if (!llmRaw) {
      return NextResponse.json(
        { error: { code: "LLM_NOT_CONFIGURED", message: "LLM not configured — please set your API key in Settings." } },
        { status: 400 }
      );
    }
    const llm = JSON.parse(llmRaw) as LLMPreference;

    // Build workflow context
    const ctx = await buildContextFromDB(projectId);
    if (!ctx) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project context not found." } }, { status: 404 });
    }

    let updatedOutput: IndustryPriorityOutput | TargetMarketsOutput;

    if (stepName === "INDUSTRY_PRIORITY") {
      const existing = projectStep.output as unknown as IndustryPriorityOutput;
      const newIndustries = await expandIndustries(ctx, body.items, existing.industries, llm);
      updatedOutput = {
        industries: [...existing.industries, ...newIndustries],
      };
    } else {
      const existing = projectStep.output as unknown as TargetMarketsOutput;
      const newMarkets = await expandMarkets(ctx, body.items, existing.markets, llm);
      updatedOutput = {
        markets: [...existing.markets, ...newMarkets],
      };
    }

    // Save a new version snapshot
    const count = await prisma.projectStepVersion.count({
      where: { projectId, stepName: stepName as never },
    });
    await prisma.projectStepVersion.create({
      data: {
        id: `${projectId}-${stepName}-${count + 1}-${Date.now()}`,
        projectId,
        stepName: stepName as never,
        versionNum: count + 1,
        output: updatedOutput as object,
      },
    });

    // Update the step output (stays COMPLETE)
    await prisma.projectStep.update({
      where: { projectId_stepName: { projectId, stepName: stepName as never } },
      data: { output: updatedOutput as object },
    });

    return NextResponse.json({ success: true, output: updatedOutput });
  } catch (err) {
    return errorResponse(err);
  }
}
