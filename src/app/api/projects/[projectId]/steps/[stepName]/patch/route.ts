import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; stepName: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }

    const { projectId, stepName } = await params;
    const { output } = await req.json();

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    const step = await prisma.projectStep.findUnique({
      where: { projectId_stepName: { projectId, stepName: stepName as never } },
    });
    if (!step) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Step not found." } }, { status: 404 });
    }

    const isAwaiting = step.status === "AWAITING_APPROVAL";
    await prisma.projectStep.update({
      where: { projectId_stepName: { projectId, stepName: step.stepName } },
      data: isAwaiting ? { draftOutput: output as object } : { output: output as object },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
