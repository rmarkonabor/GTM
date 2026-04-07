export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";
import { inngest } from "@/../inngest/client";

/** POST — kick off background generation */
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
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "targetMarketName is required." } }, { status: 400 });
    }

    const project = await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } });
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    // Mark as pending immediately so UI can start polling
    await prisma.project.update({
      where: { id: projectId },
      data: {
        coldEmailDraft: {
          status: "PENDING",
          targetMarketName,
          startedAt: new Date().toISOString(),
        },
      },
    });

    // Trigger background Inngest job
    await inngest.send({
      name: "gtm/cold-email.generate",
      data: { projectId, targetMarketName },
    });

    return NextResponse.json({ status: "PENDING" });
  } catch (err) {
    return errorResponse(err);
  }
}

/** PATCH — approve current step and continue generation */
export async function PATCH(
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
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    // Send approval event — Inngest resumes the waiting step
    await inngest.send({
      name: "cold-email/step.approved",
      data: { projectId },
    });

    return NextResponse.json({ status: "approved" });
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE — cancel an in-progress generation */
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

    const existing = project.coldEmailDraft as Record<string, unknown> | null;
    await prisma.project.update({
      where: { id: projectId },
      data: {
        coldEmailDraft: {
          ...(existing ?? {}),
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

/** GET — poll current draft status */
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
