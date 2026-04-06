export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { inngest } from "@/../inngest/client";
import { errorResponse } from "@/lib/errors/handlers";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; stepName: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }
    const { projectId, stepName } = await params;

    // Verify project ownership
    const project = await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } });
    if (!project) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });

    const step = await prisma.projectStep.findUnique({
      where: { projectId_stepName: { projectId, stepName: stepName as never } },
    });
    if (!step) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Step not found." } }, { status: 404 });
    if (!step.draftOutput) return NextResponse.json({ error: { code: "NO_DRAFT", message: "No draft to approve." } }, { status: 400 });

    // Copy draft to approved output
    await prisma.projectStep.update({
      where: { projectId_stepName: { projectId, stepName: stepName as never } },
      data: {
        status: "COMPLETE",
        output: step.draftOutput as object,
        completedAt: new Date(),
      },
    });

    // Trigger workflow to run the next step
    await inngest.send({
      name: "gtm/workflow.start",
      data: { projectId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
