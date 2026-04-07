export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";
import { safeDecrypt } from "@/lib/crypto";
import { getCampaignStats } from "@/lib/integrations/smartlead";

interface StoredCampaign {
  campaignId: number;
  name: string;
  targetMarketName: string;
  pushedAt: string;
}

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
        select: { smartleadCampaigns: true },
      }),
      prisma.user.findUnique({ where: { id: session.user.id } }),
    ]);
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    const stored = (project.smartleadCampaigns as StoredCampaign[] | null) ?? [];
    if (stored.length === 0) {
      return NextResponse.json({ campaigns: [] });
    }

    const slRaw = safeDecrypt(user?.smartleadPreference ?? null);
    if (!slRaw) {
      // Return campaigns without metrics if no API key
      return NextResponse.json({ campaigns: stored.map((c) => ({ ...c, stats: null })) });
    }
    const { apiKey } = JSON.parse(slRaw) as { apiKey: string };

    // Fetch stats for all campaigns in parallel
    const campaigns = await Promise.all(
      stored.map(async (c) => {
        try {
          const stats = await getCampaignStats(apiKey, c.campaignId);
          return { ...c, stats };
        } catch {
          return { ...c, stats: null };
        }
      })
    );

    return NextResponse.json({ campaigns });
  } catch (err) {
    return errorResponse(err);
  }
}
