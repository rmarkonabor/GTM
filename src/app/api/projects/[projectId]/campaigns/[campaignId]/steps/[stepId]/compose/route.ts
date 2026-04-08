export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";
import { safeDecrypt } from "@/lib/crypto";
import { LLMPreference } from "@/types/gtm";
import { getLanguageModel } from "@/lib/ai/providers";
import { generateObject } from "ai";
import { z } from "zod";

type RouteParams = {
  params: Promise<{ projectId: string; campaignId: string; stepId: string }>;
};

const bodySchema = z.object({
  industryIdx: z.number().nullable().optional(),
  marketId: z.string().nullable().optional(),
  segmentId: z.string().nullable().optional(),
  prompt: z.string().default(""),
  seq: z.number().int().min(1),
  totalSteps: z.number().int().min(1),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Please sign in." } },
        { status: 401 }
      );
    }
    const { projectId, campaignId, stepId } = await params;

    // Parse and validate body
    const rawBody = await req.json();
    const parsed = bodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid request body." } },
        { status: 400 }
      );
    }
    const { industryIdx, marketId, segmentId, prompt, seq, totalSteps } = parsed.data;

    // Verify ownership + load project and user in parallel
    const [project, user] = await Promise.all([
      prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id },
        include: {
          steps: {
            where: { stepName: { in: ["INDUSTRY_PRIORITY", "TARGET_MARKETS", "SEGMENTATION"] } },
            select: { stepName: true, output: true },
          },
        },
      }),
      prisma.user.findUnique({ where: { id: session.user.id } }),
    ]);
    if (!project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found." } },
        { status: 404 }
      );
    }

    // Verify the step exists and belongs to this campaign/project
    const step = await prisma.campaignStep.findFirst({
      where: { id: stepId, campaignId, campaign: { projectId } },
      select: { id: true },
    });
    if (!step) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Step not found." } },
        { status: 404 }
      );
    }

    // Resolve LLM preference
    const llmRaw = safeDecrypt(user?.llmPreference ?? null);
    if (!llmRaw) {
      return NextResponse.json(
        {
          error: {
            code: "LLM_NOT_CONFIGURED",
            message: "Please configure your AI provider in Settings.",
          },
        },
        { status: 400 }
      );
    }
    const llmPreference = JSON.parse(llmRaw) as LLMPreference;
    const model = getLanguageModel(llmPreference.provider, llmPreference.apiKey, "cold-email-compose");

    // Extract strategy data from step outputs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stepOutputs: Record<string, any> = {};
    for (const s of project.steps) {
      stepOutputs[s.stepName] = s.output;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ip: any = stepOutputs["INDUSTRY_PRIORITY"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tm: any = stepOutputs["TARGET_MARKETS"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sg: any = stepOutputs["SEGMENTATION"];

    const selectedIndustry =
      industryIdx != null ? ip?.industries?.[industryIdx] ?? null : null;
    const selectedMarket =
      marketId ? tm?.markets?.find((m: { id: string }) => m.id === marketId) ?? null : null;
    const selectedSegment =
      segmentId ? sg?.segments?.find((s: { id: string }) => s.id === segmentId) ?? null : null;

    // Resolve company profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const companyProfile = (project as any).companyProfile as Record<string, string> | null ?? null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const websiteUrl = (project as any).websiteUrl as string | null ?? null;

    // Build prompt
    const parts: string[] = [];
    parts.push("You are an expert B2B cold email copywriter.\n");

    if (websiteUrl || companyProfile) {
      parts.push("COMPANY:");
      if (websiteUrl) parts.push(`Website: ${websiteUrl}`);
      if (companyProfile) {
        if (companyProfile.name) parts.push(`Name: ${companyProfile.name}`);
        if (companyProfile.description) parts.push(`Description: ${companyProfile.description}`);
        if (companyProfile.primaryProduct) parts.push(`Product: ${companyProfile.primaryProduct}`);
        if (companyProfile.targetAudience) parts.push(`Audience: ${companyProfile.targetAudience}`);
      }
      parts.push("");
    }

    if (selectedIndustry) {
      parts.push("TARGET INDUSTRY:");
      if (selectedIndustry.niche) parts.push(`Niche: ${selectedIndustry.niche}`);
      if (selectedIndustry.standardIndustry) parts.push(`Industry: ${selectedIndustry.standardIndustry}`);
      if (selectedIndustry.painPoints) parts.push(`Pain points: ${selectedIndustry.painPoints}`);
      if (selectedIndustry.whatClientOffers) parts.push(`What we offer: ${selectedIndustry.whatClientOffers}`);
      if (selectedIndustry.howTheyWorkTogether) parts.push(`Engagement: ${selectedIndustry.howTheyWorkTogether}`);
      parts.push("");
    }

    if (selectedMarket) {
      parts.push("TARGET MARKET:");
      if (selectedMarket.name) parts.push(`Name: ${selectedMarket.name}`);
      if (selectedMarket.priorityScore != null) parts.push(`Priority score: ${selectedMarket.priorityScore}/10`);
      if (selectedMarket.urgentProblems) parts.push(`Urgent problems: ${selectedMarket.urgentProblems}`);
      if (selectedMarket.macroTrends) parts.push(`Macro trends: ${selectedMarket.macroTrends}`);
      parts.push("");
    }

    if (selectedSegment) {
      parts.push("SEGMENT:");
      if (selectedSegment.name) parts.push(`Name: ${selectedSegment.name}`);
      if (selectedSegment.estimatedPriority) parts.push(`Priority: ${selectedSegment.estimatedPriority}`);
      if (selectedSegment.sizeCategory) parts.push(`Size: ${selectedSegment.sizeCategory}`);
      const pos = selectedSegment.positioning;
      if (pos) {
        if (pos.messagingHook) parts.push(`Messaging hook: ${pos.messagingHook}`);
        if (pos.keyPainPoints) parts.push(`Key pain points: ${pos.keyPainPoints}`);
        if (pos.ourAngle) parts.push(`Our angle: ${pos.ourAngle}`);
        if (pos.proofPoints) parts.push(`Proof points: ${pos.proofPoints}`);
        if (pos.ctaApproach) parts.push(`CTA: ${pos.ctaApproach}`);
      }
      parts.push("");
    }

    parts.push(`SEQUENCE CONTEXT: This is step ${seq} of ${totalSteps}.`);
    if (seq > 1) {
      parts.push("This is a follow-up email. Reference prior outreach briefly and naturally.");
    }
    parts.push("");

    if (prompt.trim()) {
      parts.push(`INSTRUCTIONS: ${prompt.trim()}\n`);
    }

    parts.push(
      'Write a personalized cold email. Use {{FirstName}} and {{CompanyName}} as merge tag placeholders.',
      "Subject line: punchy, under 10 words, specific to their pain or goal.",
      "Body: under 150 words, focus on their problem not our features, single clear CTA.",
      "Do not use generic filler phrases like 'I hope this finds you well'.",
      "Return ONLY the subject and body — no preamble."
    );

    const systemPrompt = parts.join("\n");

    const { object } = await generateObject({
      model,
      schema: z.object({
        subject: z.string().describe("The email subject line"),
        body: z.string().describe("The email body text"),
      }),
      prompt: systemPrompt,
    });

    return NextResponse.json({ subject: object.subject, body: object.body });
  } catch (err) {
    return errorResponse(err);
  }
}
