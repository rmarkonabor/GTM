export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";
import { safeDecrypt } from "@/lib/crypto";
import { createCampaign, addSequenceStep } from "@/lib/integrations/smartlead";
import { z } from "zod";

const EmailStepSchema = z.object({
  subject: z.string(),
  body: z.string(),
  waitDays: z.number().int().min(0),
});

const schema = z.object({
  campaignName: z.string().min(1),
  targetMarketName: z.string().min(1),
  steps: z.array(EmailStepSchema).min(1).max(4),
});

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

    const [project, user] = await Promise.all([
      prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } }),
      prisma.user.findUnique({ where: { id: session.user.id } }),
    ]);
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    const slRaw = safeDecrypt(user?.smartleadPreference ?? null);
    if (!slRaw) {
      return NextResponse.json({ error: { code: "SMARTLEAD_NOT_CONFIGURED", message: "Add your Smartlead API key in Settings." } }, { status: 400 });
    }
    const { apiKey } = JSON.parse(slRaw) as { apiKey: string };

    const body = await req.json();
    const { campaignName, targetMarketName, steps } = schema.parse(body);

    // Create campaign + add sequence
    const campaign = await createCampaign(apiKey, campaignName);
    for (let i = 0; i < steps.length; i++) {
      await addSequenceStep(apiKey, campaign.id, steps[i], i + 1);
    }

    // Record this campaign on the project
    const existing = (project.smartleadCampaigns as { campaignId: number; name: string; targetMarketName: string; pushedAt: string }[] | null) ?? [];
    await prisma.project.update({
      where: { id: projectId },
      data: {
        smartleadCampaigns: [
          ...existing,
          { campaignId: campaign.id, name: campaignName, targetMarketName, pushedAt: new Date().toISOString() },
        ],
      },
    });

    return NextResponse.json({ campaignId: campaign.id });
  } catch (err) {
    return errorResponse(err);
  }
}
