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
  icpIdx: z.number().nullable().optional(),
  personaIdx: z.number().nullable().optional(),
  prompt: z.string().max(5000).default(""),
  includeProof: z.boolean().default(true),
  refineMode: z.boolean().default(false),
  existingSubject: z.string().optional(),
  existingBody: z.string().optional(),
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
    const { industryIdx, marketId, segmentId, icpIdx, personaIdx, prompt, includeProof, refineMode, existingSubject, existingBody, seq, totalSteps } = parsed.data;

    // Verify ownership + load project and user in parallel
    const [project, user] = await Promise.all([
      prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id },
        include: {
          steps: {
            where: { stepName: { in: ["INDUSTRY_PRIORITY", "TARGET_MARKETS", "SEGMENTATION", "ICP"] } },
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const icpOutput: any = stepOutputs["ICP"];

    const selectedIndustry =
      industryIdx != null ? ip?.industries?.[industryIdx] ?? null : null;
    const selectedMarket =
      marketId ? tm?.markets?.find((m: { id: string }) => m.id === marketId) ?? null : null;
    const selectedSegment =
      segmentId ? sg?.segments?.find((s: { id: string }) => s.id === segmentId) ?? null : null;
    const selectedICP =
      icpIdx != null ? icpOutput?.icps?.[icpIdx] ?? null : null;
    const selectedPersona =
      selectedICP && personaIdx != null ? selectedICP.buyerPersonas?.[personaIdx] ?? null : null;

    // Resolve company profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const companyProfile = (project as any).companyProfile as Record<string, string> | null ?? null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const websiteUrl = (project as any).websiteUrl as string | null ?? null;

    // Build prompt
    const parts: string[] = [];
    parts.push("You are an expert B2B cold email copywriter.\n");

    if (refineMode && (existingSubject || existingBody)) {
      parts.push("EXISTING EMAIL TO REFINE:");
      if (existingSubject) parts.push(`Subject: ${existingSubject}`);
      if (existingBody) parts.push(`Body:\n${existingBody}`);
      parts.push("");
    }

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
      if (selectedMarket.whyNow) parts.push(`Why now: ${selectedMarket.whyNow}`);
      if (selectedMarket.whyUs) parts.push(`Our edge: ${selectedMarket.whyUs}`);
      parts.push("");
    }

    if (selectedSegment) {
      parts.push("SEGMENT:");
      if (selectedSegment.name) parts.push(`Name: ${selectedSegment.name}`);
      if (selectedSegment.estimatedPriority) parts.push(`Priority: ${selectedSegment.estimatedPriority}`);
      if (selectedSegment.sizeCategory) parts.push(`Size: ${selectedSegment.sizeCategory}`);
      if (selectedSegment.buyingMotion) parts.push(`Buying motion: ${selectedSegment.buyingMotion}`);
      if (selectedSegment.painMultiplier) parts.push(`Pain impact: ${selectedSegment.painMultiplier}`);
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

    if (selectedICP) {
      parts.push("RECIPIENT ICP:");
      if (selectedICP.niche) parts.push(`Niche: ${selectedICP.niche}`);
      if (selectedICP.standardIndustry) parts.push(`Industry: ${selectedICP.standardIndustry}`);
      if (selectedICP.engagementModel) parts.push(`Buying model: ${selectedICP.engagementModel}`);
      if (selectedICP.decisionCriteria?.length)
        parts.push(`Decision criteria: ${selectedICP.decisionCriteria.join(", ")}`);
      if (selectedICP.lossReasons?.length)
        parts.push(`Common objections to pre-empt: ${selectedICP.lossReasons.join(", ")}`);
      parts.push("");
    }

    if (selectedPersona) {
      parts.push("RECIPIENT PERSONA:");
      parts.push(`Title: ${selectedPersona.title}`);
      if (selectedPersona.goals?.length)
        parts.push(`Goals: ${selectedPersona.goals.join(", ")}`);
      if (selectedPersona.challenges?.length)
        parts.push(`Challenges: ${selectedPersona.challenges.join(", ")}`);
      if (selectedPersona.triggerEvents?.length)
        parts.push(`Trigger events: ${selectedPersona.triggerEvents.join(", ")}`);
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

    const opening = refineMode
      ? `Refine and improve the existing email above for true cold outreach to a cold lead who does not know us.
Keep what works. Fix what doesn't. Do not start from scratch — preserve the intent and structure unless the instructions say otherwise.
Apply the context and rules below to improve relevance, tone, and targeting.`
      : `Write a personalized cold email for true cold outreach using {{FirstName}} and {{CompanyName}} as merge tag placeholders.

The recipient does not know us. Write like this is a first touch from a stranger, so the email should feel light, respectful, and easy to reply to.`;

    parts.push(
      `${opening}

Use this structure:

1. Hook
Write one short, specific question that speaks directly to the recipient's world — their role, their team, their priorities, or a challenge they are likely living right now.
${selectedPersona ? `Write specifically for a ${selectedPersona.title}.` : ""}
The hook must be about THEM, not about us or what we do.
Do NOT mention sales, marketing, outreach, or anything that signals this is a pitch.
Do NOT open with a compliment, a company name drop, or a statement about their growth.
Use "you" or "your" to make it feel personal and direct.
The reader should finish the first line thinking "how did they know that?" not "here comes a sales email."

2. Relevance
In one or two sentences, connect their likely situation to why you are reaching out.
Write from their perspective — use "you", "your team", "your buyers", "your pipeline".
Use soft, respectful language: "thought this might be relevant", "seemed worth a quick note", "not sure if it applies to you".${selectedPersona?.challenges?.length ? `\nTheir known challenges: ${selectedPersona.challenges.slice(0, 2).join(", ")}.` : ""}
Do not assume you know their internal situation. Invite them in, do not tell them what their problem is.
${includeProof ? `
3. Proof
One short, grounded proof point that supports why this is relevant to someone in their position.
Anchor it to their reality, not our achievements — frame it as "others like you" or "companies in your space" rather than "we have X customers".
Keep it one sentence. Do not stack claims.

4. Soft CTA` : `
3. Soft CTA`}
End with a single low-friction question that is easy to answer yes or no.
Make it about them: "Would that be useful for your team?", "Open to a quick look?", "Worth a brief chat?"
Do not ask for a meeting, a demo, or a call in the first touch.

Rules:
Use {{FirstName}} and {{CompanyName}} exactly as placeholders.
Write a punchy subject line under 10 words — make it feel like something a colleague would send, not a sales tool.
Keep the body under 120 words.
Use "you" and "your" throughout — the ratio of "you" to "we/our" should heavily favour the reader.
Make every sentence about their world, their priorities, their outcomes.
Sound like a human who did their homework, not a tool that ran a sequence.
No filler openers. No "I hope this finds you well", "I came across your profile", or "I wanted to reach out".
No pressure, no urgency tactics, no pitch deck language.
No feature lists, no product names in the first two sentences.
Do not use phrases like "replace headcount", "book a 30 minute call", "ARR momentum", "revolutionize", or "game-changer".
Do not reference funding, hiring, layoffs, or recent news unless that context is explicitly provided.
Only one CTA.${!includeProof ? `
Do NOT include a proof point, credibility statement, customer reference, or any claim about past results. The email must have exactly 3 parts: Hook, Relevance, and Soft CTA only.` : ""}`
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
