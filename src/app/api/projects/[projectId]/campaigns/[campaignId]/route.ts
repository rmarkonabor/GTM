export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";

type RouteParams = { params: Promise<{ projectId: string; campaignId: string }> };

async function getCampaign(projectId: string, campaignId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) return null;
  return prisma.campaign.findFirst({
    where: { id: campaignId, projectId },
    include: { steps: { orderBy: { seq: "asc" } } },
  });
}

/** GET — fetch a single campaign with its steps. */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }
    const { projectId, campaignId } = await params;
    const campaign = await getCampaign(projectId, campaignId, session.user.id);
    if (!campaign) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Campaign not found." } }, { status: 404 });
    }
    return NextResponse.json({ campaign });
  } catch (err) {
    return errorResponse(err);
  }
}

/** PATCH — rename the campaign. */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }
    const { projectId, campaignId } = await params;
    const campaign = await getCampaign(projectId, campaignId, session.user.id);
    if (!campaign) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Campaign not found." } }, { status: 404 });
    }
    const body = await req.json();
    const name: string = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "name is required." } }, { status: 400 });
    }
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: { name },
    });
    return NextResponse.json({ campaign: updated });
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE — remove the campaign and all its steps (cascade). */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }
    const { projectId, campaignId } = await params;
    const campaign = await getCampaign(projectId, campaignId, session.user.id);
    if (!campaign) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Campaign not found." } }, { status: 404 });
    }
    await prisma.campaign.delete({ where: { id: campaignId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
