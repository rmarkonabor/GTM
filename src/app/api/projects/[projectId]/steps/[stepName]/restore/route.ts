export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";
import { z } from "zod";

const STEP_ORDER = [
  "RESEARCH", "INDUSTRY_PRIORITY", "TARGET_MARKETS", "ICP",
  "COMPETITIVE", "SEGMENTATION", "MANIFESTO"
] as const;

const schema = z.object({ versionNum: z.number().int().positive() });

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
    const { versionNum } = schema.parse(await req.json());

    const project = await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } });
    if (!project) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });

    const version = await prisma.projectStepVersion.findFirst({
      where: { projectId, stepName: stepName as never, versionNum },
    });
    if (!version) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Version not found." } }, { status: 404 });

    // Restore this version to draftOutput
    await prisma.projectStep.update({
      where: { projectId_stepName: { projectId, stepName: stepName as never } },
      data: { status: "AWAITING_APPROVAL", draftOutput: version.output as object },
    });

    // Find and reset downstream steps
    const currentIndex = STEP_ORDER.indexOf(stepName as typeof STEP_ORDER[number]);
    const downstreamSteps = currentIndex >= 0 ? STEP_ORDER.slice(currentIndex + 1) : [];

    if (downstreamSteps.length > 0) {
      await prisma.projectStep.updateMany({
        where: {
          projectId,
          stepName: { in: downstreamSteps as never[] },
        },
        data: {
          status: "PENDING",
          output: Prisma.DbNull,
          draftOutput: Prisma.DbNull,
          errorCode: null,
          errorMsg: null,
          completedAt: null,
        },
      });
    }

    // Reset project status if it was COMPLETE
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "IN_PROGRESS" },
    });

    return NextResponse.json({ success: true, downstreamReset: downstreamSteps });
  } catch (err) {
    return errorResponse(err);
  }
}
