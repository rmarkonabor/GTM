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
  marketId: z.string().nullable().optional(),
  segmentId: z.string().nullable().optional(),
  icpIdx: z.number().nullable().optional(),
  personaIdx: z.number().nullable().optional(),
  prompt: z.string().default(""),
  refineMode: z.boolean().default(false),
  existingMessage: z.string().optional(),
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

    const rawBody = await req.json();
    const parsed = bodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid request body." } },
        { status: 400 }
      );
    }
    const { marketId, segmentId, icpIdx, personaIdx, prompt, refineMode, existingMessage, seq, totalSteps } = parsed.data;

    const [project, user] = await Promise.all([
      prisma.project.findFirst({
        where: { id: projectId, userId: session.user.id },
        include: {
          steps: {
            where: { stepName: { in: ["TARGET_MARKETS", "SEGMENTATION", "ICP"] } },
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

    const llmRaw = safeDecrypt(user?.llmPreference ?? null);
    if (!llmRaw) {
      return NextResponse.json(
        { error: { code: "LLM_NOT_CONFIGURED", message: "Please configure your AI provider in Settings." } },
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

    const modelId = getModelForTask(llmPreference.provider, "linkedin-compose");
    const model = getLanguageModel(llmPreference.provider, llmPreference.apiKey, "linkedin-compose");

    // Extract strategy data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stepOutputs: Record<string, any> = {};
    for (const s of project.steps) {
      stepOutputs[s.stepName] = s.output;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tm: any = stepOutputs["TARGET_MARKETS"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sg: any = stepOutputs["SEGMENTATION"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const icpOutput: any = stepOutputs["ICP"];

    const selectedMarket = marketId
      ? tm?.markets?.find((m: { id: string }) => m.id === marketId) ?? null
      : null;
    const selectedSegment = segmentId
      ? sg?.segments?.find((s: { id: string }) => s.id === segmentId) ?? null
      : null;
    const selectedICP = icpIdx != null ? icpOutput?.icps?.[icpIdx] ?? null : null;
    const selectedPersona =
      selectedICP && personaIdx != null
        ? selectedICP.buyerPersonas?.[personaIdx] ?? null
        : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const companyProfile = (project as any).companyProfile as Record<string, string> | null ?? null;

    // Character limit depends on step position
    const isConnectionNote = seq === 1;
    const charLimit = isConnectionNote ? 300 : 1000;

    // Build prompt
    const parts: string[] = [];
    parts.push("You are an expert at writing LinkedIn cold outreach messages that feel human, warm, and genuinely relevant.\n");

    if (refineMode && existingMessage) {
      parts.push("EXISTING MESSAGE TO REFINE:");
      parts.push(existingMessage);
      parts.push("");
    }

    if (companyProfile) {
      parts.push("OUR COMPANY:");
      if (companyProfile.name) parts.push(`Name: ${companyProfile.name}`);
      if (companyProfile.primaryProduct) parts.push(`Product: ${companyProfile.primaryProduct}`);
      if (companyProfile.targetAudience) parts.push(`Audience: ${companyProfile.targetAudience}`);
      parts.push("");
    }

    if (selectedMarket) {
      parts.push("TARGET MARKET:");
      if (selectedMarket.name) parts.push(`Name: ${selectedMarket.name}`);
      if (selectedMarket.urgentProblems?.length)
        parts.push(`Urgent problems: ${selectedMarket.urgentProblems.join(", ")}`);
      parts.push("");
    }

    if (selectedSegment) {
      parts.push("SEGMENT:");
      if (selectedSegment.name) parts.push(`Name: ${selectedSegment.name}`);
      const pos = selectedSegment.positioning;
      if (pos) {
        if (pos.messagingHook) parts.push(`Messaging hook: ${pos.messagingHook}`);
        if (pos.ourAngle) parts.push(`Our angle: ${pos.ourAngle}`);
      }
      parts.push("");
    }

    if (selectedPersona) {
      parts.push("RECIPIENT PERSONA:");
      parts.push(`Title: ${selectedPersona.title}`);
      if (selectedPersona.goals?.length)
        parts.push(`Goals: ${selectedPersona.goals.join(", ")}`);
      if (selectedPersona.challenges?.length)
        parts.push(`Challenges: ${selectedPersona.challenges.join(", ")}`);
      parts.push("");
    } else if (selectedICP) {
      parts.push("RECIPIENT ICP:");
      if (selectedICP.niche) parts.push(`Niche: ${selectedICP.niche}`);
      if (selectedICP.standardIndustry) parts.push(`Industry: ${selectedICP.standardIndustry}`);
      parts.push("");
    }

    if (seq > 1) {
      parts.push(`SEQUENCE CONTEXT: This is follow-up step ${seq} of ${totalSteps}. They have already received a connection request. Reference that naturally.\n`);
    }

    if (prompt.trim()) {
      parts.push(`INSTRUCTIONS: ${prompt.trim()}\n`);
    }

    const opening = refineMode && existingMessage
      ? `Refine the existing LinkedIn message above. Keep what works, fix what doesn't. Preserve the tone and intent unless the instructions say otherwise.`
      : isConnectionNote
      ? `Write a LinkedIn connection request note${selectedPersona ? ` to a ${selectedPersona.title}` : ""}.`
      : `Write a LinkedIn follow-up message${selectedPersona ? ` to a ${selectedPersona.title}` : ""} who accepted your connection request.`;

    if (isConnectionNote) {
      parts.push(`${opening}

Rules:
- Under ${charLimit} characters total (not words — characters). This is a hard limit.
- No subject line.
- Do not use {{FirstName}} — LinkedIn already shows your name.
- Sound like a real person, not a bot or marketer.
- One genuine reason you are connecting — tied to their role or a challenge relevant to them.
- Do not pitch a product or ask for a meeting in the connection note.
- Do not flatter excessively ("I've been following your work...").
- End with something that invites a simple reply or just leaves the door open.
- Casual, warm, brief.`);
    } else {
      parts.push(`${opening}

Structure:
1. Brief acknowledgment that they accepted (one sentence, light and natural)
2. Relevance — why you reached out, tied to their role or a challenge they likely face
3. One soft proof point or credibility signal (optional but encouraged)
4. Low-friction CTA — an easy question, not a meeting request

Rules:
- Under ${charLimit} characters total.
- No subject line.
- Do not use {{FirstName}}.
- Conversational and direct — reads like a real message, not a pitch deck.
- Avoid corporate language.
- Only one CTA.
- Do not sound desperate or pushy.`);
    }

    const systemPrompt = parts.join("\n");

    const { object, usage } = await generateObject({
      model,
      schema: z.object({
        message: z.string().describe("The LinkedIn message text"),
      }),
      prompt: systemPrompt,
    });

    const inputTokens = usage.inputTokens ?? 0;
    const outputTokens = usage.outputTokens ?? 0;
    return NextResponse.json({
      message: object.message,
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
