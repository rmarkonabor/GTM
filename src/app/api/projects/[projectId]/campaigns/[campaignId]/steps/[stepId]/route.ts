export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { Prisma } from "@prisma/client";
import { errorResponse } from "@/lib/errors/handlers";

type RouteParams = { params: Promise<{ projectId: string; campaignId: string; stepId: string }> };

/** PATCH — update a step's waitDays or variants. */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }
    const { projectId, campaignId, stepId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    const step = await prisma.campaignStep.findFirst({
      where: { id: stepId, campaignId, campaign: { projectId } },
    });
    if (!step) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Step not found." } }, { status: 404 });
    }

    const body = await req.json();
    const data: { waitDays?: number; variants?: Prisma.InputJsonValue } = {};
    if (body.waitDays !== undefined) data.waitDays = Number(body.waitDays);
    if (body.variants !== undefined) data.variants = body.variants;

    const updated = await prisma.campaignStep.update({
      where: { id: stepId },
      data,
    });

    return NextResponse.json({ step: updated });
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE — remove a step and re-sequence the remaining ones. */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }
    const { projectId, campaignId, stepId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    const step = await prisma.campaignStep.findFirst({
      where: { id: stepId, campaignId, campaign: { projectId } },
    });
    if (!step) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Step not found." } }, { status: 404 });
    }

    // Delete and re-sequence in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.campaignStep.delete({ where: { id: stepId } });
      // Decrement seq for all steps that came after
      const later = await tx.campaignStep.findMany({
        where: { campaignId, seq: { gt: step.seq } },
        orderBy: { seq: "asc" },
      });
      for (const s of later) {
        await tx.campaignStep.update({
          where: { id: s.id },
          data: { seq: s.seq - 1 },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
