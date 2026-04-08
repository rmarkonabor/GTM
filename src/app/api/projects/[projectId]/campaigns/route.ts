export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";
import { safeDecrypt } from "@/lib/crypto";
import { getCampaignStats } from "@/lib/integrations/smartlead";

/** GET — list all campaigns for a project, with Smartlead stats for pushed ones. */
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

    const [project, user] = await Promise.all([
      prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id },
        select: { id: true },
      }),
      prisma.user.findUnique({ where: { id: session.user.id } }),
    ]);
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    const campaigns = await prisma.campaign.findMany({
      where: { projectId },
      include: { steps: { orderBy: { seq: "asc" } } },
      orderBy: { createdAt: "asc" },
    });

    if (campaigns.length === 0) {
      return NextResponse.json({ campaigns: [] });
    }

    // Fetch Smartlead stats for pushed campaigns
    const slRaw = safeDecrypt(user?.smartleadPreference ?? null);
    const apiKey = slRaw ? (JSON.parse(slRaw) as { apiKey: string }).apiKey : null;

    const withStats = await Promise.all(
      campaigns.map(async (c) => {
        if (!c.smartleadId || !apiKey) {
          return { ...c, stats: null };
        }
        try {
          const stats = await getCampaignStats(apiKey, c.smartleadId);
          return { ...c, stats };
        } catch {
          return { ...c, stats: null };
        }
      })
    );

    return NextResponse.json({ campaigns: withStats });
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST — create a new empty campaign with one default step. */
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
    const body = await req.json().catch(() => ({}));
    const name: string = body.name?.trim() || "Untitled Campaign";

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        projectId,
        name,
        steps: {
          create: {
            seq: 1,
            waitDays: 0,
            variants: [{ id: "a", subject: "", body: "" }],
          },
        },
      },
      include: { steps: { orderBy: { seq: "asc" } } },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
