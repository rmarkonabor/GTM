export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";

type RouteParams = { params: Promise<{ projectId: string; campaignId: string }> };

/** POST — add a new step to the end of the campaign. */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }
    const { projectId, campaignId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, projectId },
      include: { steps: { select: { seq: true }, orderBy: { seq: "desc" }, take: 1 } },
    });
    if (!campaign) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Campaign not found." } }, { status: 404 });
    }

    const nextSeq = (campaign.steps[0]?.seq ?? 0) + 1;
    const step = await prisma.campaignStep.create({
      data: {
        campaignId,
        seq: nextSeq,
        waitDays: 3,
        variants: [{ id: "a", subject: "", body: "" }],
      },
    });

    return NextResponse.json({ step }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
