export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";
import { safeDecrypt } from "@/lib/crypto";
import { createCampaign, addSequenceStep, StepVariant, SmartleadAuthError } from "@/lib/integrations/smartlead";

/** POST — push (or re-sync) campaign to Smartlead. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; campaignId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }
    const { projectId, campaignId } = await params;

    // Load campaign + user in parallel
    const [campaign, user] = await Promise.all([
      prisma.campaign.findFirst({
        where: {
          id: campaignId,
          projectId,
          project: { userId: session.user.id },
        },
        include: { steps: { orderBy: { seq: "asc" } } },
      }),
      prisma.user.findUnique({ where: { id: session.user.id } }),
    ]);

    if (!campaign) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Campaign not found." } }, { status: 404 });
    }

    if (campaign.steps.length === 0) {
      return NextResponse.json({ error: { code: "VALIDATION", message: "Campaign has no steps." } }, { status: 400 });
    }

    // Get Smartlead API key
    const slRaw = safeDecrypt(user?.smartleadPreference ?? null);
    if (!slRaw) {
      return NextResponse.json({ error: { code: "MISSING_KEY", message: "Smartlead API key not configured. Add it in Settings." } }, { status: 400 });
    }
    const apiKey = (JSON.parse(slRaw) as { apiKey: string }).apiKey;
    if (!apiKey) {
      return NextResponse.json({ error: { code: "MISSING_KEY", message: "Smartlead API key not configured. Add it in Settings." } }, { status: 400 });
    }

    // Determine Smartlead campaign ID (create new or reuse existing)
    let slCampaignId = campaign.smartleadId;
    if (!slCampaignId) {
      const created = await createCampaign(apiKey, campaign.name);
      slCampaignId = created.id;
    }

    // Push all steps to Smartlead (upserts by seq_number)
    for (const step of campaign.steps) {
      const variants = (step.variants as unknown as StepVariant[]) ?? [];
      if (variants.length === 0) continue;
      await addSequenceStep(apiKey, slCampaignId, { type: (step as Record<string, unknown>).type as string | undefined, waitDays: step.waitDays, variants }, step.seq);
    }

    // Persist smartleadId + pushedAt
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        smartleadId: slCampaignId,
        pushedAt: new Date(),
      },
    });

    return NextResponse.json({ smartleadId: updated.smartleadId, pushedAt: updated.pushedAt });
  } catch (err) {
    if (err instanceof SmartleadAuthError) {
      return NextResponse.json({ error: { code: "SMARTLEAD_AUTH", message: err.message } }, { status: 401 });
    }
    return errorResponse(err);
  }
}
