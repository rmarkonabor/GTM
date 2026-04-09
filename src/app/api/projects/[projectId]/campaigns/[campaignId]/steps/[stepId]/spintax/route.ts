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
  subject: z.string().max(500),
  body: z.string().max(5000),
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
    const { subject, body } = parsed.data;

    if (!subject.trim() && !body.trim()) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Write some copy first before adding spintax." } },
        { status: 400 }
      );
    }

    // Verify ownership + load user in parallel
    const [project, user] = await Promise.all([
      prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } }),
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
    const modelId = getModelForTask(llmPreference.provider, "spintax-generate");
    const model = getLanguageModel(llmPreference.provider, llmPreference.apiKey, "spintax-generate");

    const systemPrompt = `You are an expert cold email copywriter who uses spintax to create natural, high-volume outreach variations.

Spintax format: {VariantA|VariantB} or {VariantA|VariantB|VariantC}

ORIGINAL EMAIL:
Subject: ${subject}
Body:
${body}

Add spintax variations to the subject and body above. Follow these rules strictly:

Quantity: Add 8 to 12 spintax blocks total across the subject and body combined. This creates enough variation for uniqueness at scale without reducing readability.

Strategic placement: Focus blocks on high-impact positions — subject line openers, greeting variants, hook phrasing, transition words, CTA wording, and sentence-level rephrasing. Distribute across the full email.

Leave unspun: Do not spin key value propositions, specific numbers, company names, proof points, or any phrase where precision matters. Spinning these reduces clarity and trust.

Rules:
1. Maintain Natural Language Flow — every resolved variant must read like a human wrote it naturally.
2. Use Contextually Appropriate Variations — synonyms, rephrased openers, alternative hook angles, equivalent CTA phrasing.
3. Do Not Sacrifice Message Clarity — every possible resolved version must convey the same core message.
4. Do Not Create Grammatically Incorrect Combinations — every combination must be grammatically correct on its own.
5. Do Not Spin Every Word — spinning too densely makes emails robotic. Keep unspun anchor phrases that carry the core message.

Return the subject and body with spintax blocks inserted. Do not change the meaning or structure. Do not add or remove sentences. Only inject variation blocks into existing phrasing.`;

    const { object, usage } = await generateObject({
      model,
      schema: z.object({
        subject: z.string().describe("Subject line with spintax blocks added"),
        body: z.string().describe("Email body with spintax blocks added"),
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
