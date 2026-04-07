export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";
import { inngest } from "@/../inngest/client";

/**
 * POST — start generating the full 4-step sequence in one shot.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }
    const { projectId } = await params;
    const body = await req.json();
    const targetMarketName: string = body.targetMarketName ?? "";

    if (!targetMarketName.trim()) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "targetMarketName is required." } },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    // Reset draft to RUNNING — wipe any stale data from previous attempts
    await prisma.project.update({
      where: { id: projectId },
      data: {
        coldEmailDraft: {
          status: "RUNNING",
          targetMarketName,
          startedAt: new Date().toISOString(),
        },
      },
    });

    // Cancel any in-flight generation for this project, then fire a fresh one
    await inngest.send([
      {
        name: "gtm/cold-email.cancel",
        data: { projectId },
      },
      {
        name: "gtm/cold-email.generate",
        data: { projectId, targetMarketName },
      },
    ]);

    return NextResponse.json({ status: "RUNNING" });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * GET — poll the current draft state.
 */
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
      select: { coldEmailDraft: true },
    });
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    return NextResponse.json({ draft: project.coldEmailDraft ?? null });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * DELETE — cancel an in-progress generation.
 */
export async function DELETE(
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
      select: { id: true, coldEmailDraft: true },
    });
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    // Signal the running Inngest function to cancel
    await inngest.send({ name: "gtm/cold-email.cancel", data: { projectId } });

    // Mark draft as cancelled
    const existing = (project.coldEmailDraft ?? {}) as Record<string, unknown>;
    await prisma.project.update({
      where: { id: projectId },
      data: {
        coldEmailDraft: {
          ...existing,
          status: "CANCELLED",
          error: "Stopped by user.",
        },
      },
    });

    return NextResponse.json({ status: "CANCELLED" });
  } catch (err) {
    return errorResponse(err);
  }
}
