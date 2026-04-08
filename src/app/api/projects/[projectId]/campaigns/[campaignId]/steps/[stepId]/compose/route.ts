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
import { getModelForTask } from "@/lib/ai/router";
import { calculateCost } from "@/lib/ai/pricing";
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
  includeProof: z.boolean().default(true),
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
    const { industryIdx, marketId, segmentId, prompt, includeProof, seq, totalSteps } = parsed.data;

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
    let llmPreference: LLMPreference;
    try {
      llmPreference = JSON.parse(llmRaw) as LLMPreference;
    } catch {
      return NextResponse.json(
        { error: { code: "LLM_NOT_CONFIGURED", message: "Please configure your AI provider in Settings." } },
        { status: 400 }
      );
    }
    const modelId = getModelForTask(llmPreference.provider, "cold-email-compose");
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
      if (selectedIndustry.painPoints?.length) parts.push(`Pain points: ${selectedIndustry.painPoints.join(", ")}`);
      if (selectedIndustry.whatClientOffers?.length) parts.push(`What we offer: ${selectedIndustry.whatClientOffers.join(", ")}`);
      if (selectedIndustry.howTheyWorkTogether) parts.push(`Engagement: ${selectedIndustry.howTheyWorkTogether}`);
      parts.push("");
    }

    if (selectedMarket) {
      parts.push("TARGET MARKET:");
      if (selectedMarket.name) parts.push(`Name: ${selectedMarket.name}`);
      if (selectedMarket.priorityScore != null) parts.push(`Priority score: ${selectedMarket.priorityScore}/10`);
      if (selectedMarket.urgentProblems?.length) parts.push(`Urgent problems: ${selectedMarket.urgentProblems.join(", ")}`);
      if (selectedMarket.macroTrends?.length) parts.push(`Macro trends: ${selectedMarket.macroTrends.join(", ")}`);
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
        if (pos.keyPainPoints?.length) parts.push(`Key pain points: ${pos.keyPainPoints.join(", ")}`);
        if (pos.ourAngle) parts.push(`Our angle: ${pos.ourAngle}`);
        if (pos.proofPoints?.length) parts.push(`Proof points: ${pos.proofPoints.join(", ")}`);
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
      `Write a personalized cold email for true cold outreach using {{FirstName}} and {{CompanyName}} as merge tag placeholders.

The recipient does not know us. Write like this is a first touch from a stranger, so the email should feel light, respectful, and easy to reply to.

Use this structure:

1. Hook
Start with a simple and relevant question tied to their buyers, growth goal, hiring challenge, or pipeline problem.
Do not make strong assumptions.
Do not sound confrontational.
The first line should create interest, not pressure.

2. Relevance
Briefly explain why you reached out.
Tie it to a likely challenge or priority for their role or company, but use soft language like "seems", "may", "might", or "thought this could be relevant".
Do not act like you already know their internal situation unless that context is explicitly provided.
${includeProof ? `
3. Proof
Include one short and believable proof point.
This can be a relevant example, customer type, result, audience detail, or market pattern.
Keep it light.
Do not over explain.
Do not stack multiple proof points.

4. Soft CTA` : `
3. Soft CTA`}
End with one low friction question.
The CTA should feel easy to answer, like:
"Open to a quick look?"
"Worth a quick chat?"
"Want me to send a few details?"
Avoid asking for a long meeting in the first email.

Rules:
Use {{FirstName}} and {{CompanyName}} exactly as placeholders.
Write a punchy subject line under 10 words.
Keep the body under 120 words.
Make it casual, direct, and human.
The email should feel like it is opening a conversation, not trying to close one.
Focus on their problem or priority more than our offer.
Do not use filler phrases like "I hope this finds you well."
Do not use aggressive or overly confident language.
Do not use pressure tactics.
Do not sound like a pitch deck.
Do not mention features too early.
Do not use phrases like "replace headcount", "book a 30 minute call", "ARR momentum", or anything that feels too salesy for a first touch.
Do not reference funding, hiring, layoffs, or recent news unless that context is explicitly provided and clearly relevant.
Only include one CTA.${!includeProof ? `
Do NOT include a proof point, credibility statement, customer reference, or any claim about past results. The email must have exactly ${includeProof ? "4" : "3"} parts: Hook, Relevance, and Soft CTA only.` : ""}`
    );

    const systemPrompt = parts.join("\n");

    const { object, usage } = await generateObject({
      model,
      schema: z.object({
        subject: z.string().describe("The email subject line"),
        body: z.string().describe("The email body text"),
      }),
      prompt: systemPrompt,
    });

    const inputTokens = usage.inputTokens ?? 0;
    const outputTokens = usage.outputTokens ?? 0;
    return NextResponse.json({
      subject: object.subject,
      body: object.body,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        estimatedCostUsd: calculateCost(modelId, inputTokens, outputTokens),
        model: modelId,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
