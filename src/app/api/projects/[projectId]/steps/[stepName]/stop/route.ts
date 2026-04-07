import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; stepName: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Please sign in." } },
        { status: 401 }
      );
    }

    const { projectId, stepName } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });
    if (!project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found." } },
        { status: 404 }
      );
    }

    const step = await prisma.projectStep.findUnique({
      where: { projectId_stepName: { projectId, stepName: stepName as never } },
    });

    if (!step) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Step not found." } },
        { status: 404 }
      );
    }

    // Only allow stopping RUNNING or PENDING steps
    if (step.status !== "RUNNING" && step.status !== "PENDING") {
      return NextResponse.json(
        { error: { code: "INVALID_STATE", message: `Step is ${step.status}, not running.` } },
        { status: 400 }
      );
    }

    // If the step had a previous completed output, restore to AWAITING_APPROVAL with that output
    // Otherwise reset to ERROR with a user-cancelled message
    if (step.output) {
      await prisma.projectStep.update({
        where: { projectId_stepName: { projectId, stepName: stepName as never } },
        data: {
          status: "AWAITING_APPROVAL",
          draftOutput: step.output,
          errorCode: null,
          errorMsg: null,
        },
      });
    } else {
      await prisma.projectStep.update({
        where: { projectId_stepName: { projectId, stepName: stepName as never } },
        data: {
          status: "ERROR",
          errorCode: "USER_CANCELLED",
          errorMsg: "Step was stopped by user. You can re-run it when ready.",
        },
      });
    }

    return NextResponse.json({ success: true, status: step.output ? "AWAITING_APPROVAL" : "ERROR" });
  } catch (err) {
    return errorResponse(err);
  }
}
