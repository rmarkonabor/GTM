export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";
import { inngest } from "@/../inngest/client";
import { NEXT_STEP, type ColdEmailStep } from "@/../inngest/cold-email";

/** POST — start strategy generation */
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

    // Reset draft to PENDING — wipes any stale email data from previous runs
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

    // Trigger the strategy step
    await inngest.send({
      name: "gtm/cold-email.run-step",
      data: { projectId, targetMarketName, step: "strategy" satisfies ColdEmailStep },
    });

    return NextResponse.json({ status: "PENDING" });
  } catch (err) {
    return errorResponse(err);
  }
}

/** PATCH — approve current step and trigger the next one */
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
      select: { id: true, coldEmailDraft: true },
    });
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    const existing = (project.coldEmailDraft ?? {}) as Record<string, unknown>;
    const awaitingFor = existing.awaitingApprovalFor as ColdEmailStep | undefined;

    if (!awaitingFor) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Nothing awaiting approval." } }, { status: 400 });
    }

    const nextStep = NEXT_STEP[awaitingFor];
    if (!nextStep) {
      // Should not happen — break_up_email goes straight to COMPLETE
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "No next step." } }, { status: 400 });
    }

    const targetMarketName = (existing.targetMarketName as string | undefined) ?? "";

    // Immediately flip to RUNNING in DB so polling doesn't show the approval
    // banner again before the Inngest function picks up the event.
    await prisma.project.update({
      where: { id: projectId },
      data: {
        coldEmailDraft: {
          ...existing,
          status: "RUNNING",
          awaitingApprovalFor: null,
        },
      },
    });

    // Trigger the next step as a fresh Inngest invocation — no waitForEvent,
    // no replay complexity.
    await inngest.send({
      name: "gtm/cold-email.run-step",
      data: { projectId, targetMarketName, step: nextStep },
    });

    return NextResponse.json({ status: "running", nextStep });
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
