export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";
import { safeDecrypt } from "@/lib/crypto";
import { LLMPreference } from "@/types/gtm";
import { buildContextFromDB, buildStepContext } from "@/lib/workflow/context-builder";
import { getLanguageModel } from "@/lib/ai/providers";
import { buildColdEmailPrompt } from "@/lib/ai/prompts/cold-email";
import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 120;

const EmailAnnotationSchema = z.object({
  part: z.enum(["subject", "opener", "body", "cta"]),
  text: z.string(),
  metric: z.enum(["open_rate", "reply_rate", "engagement", "click_rate"]),
  impact: z.string(),
});

const EmailStepSchema = z.object({
  subject: z.string(),
  body: z.string(),
  waitDays: z.number().int().min(0),
  annotations: z.array(EmailAnnotationSchema),
});

const ColdEmailOutputSchema = z.object({
  steps: z.array(EmailStepSchema).length(3),
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
    const body = await req.json();
    const targetMarketName: string = body.targetMarketName ?? "";

    if (!targetMarketName.trim()) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "targetMarketName is required." } }, { status: 400 });
    }

    const [project, user] = await Promise.all([
      prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } }),
      prisma.user.findUnique({ where: { id: session.user.id } }),
    ]);
    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    const llmRaw = safeDecrypt(user?.llmPreference ?? null);
    if (!llmRaw) {
      return NextResponse.json({ error: { code: "LLM_NOT_CONFIGURED", message: "Please configure your LLM in Settings." } }, { status: 400 });
    }
    const llmPreference = JSON.parse(llmRaw) as LLMPreference;

    const ctx = await buildContextFromDB(projectId);
    if (!ctx) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project context not found." } }, { status: 404 });
    }

    const context = buildStepContext(ctx);
    const prompt = buildColdEmailPrompt(context, targetMarketName);

    const model = getLanguageModel(llmPreference.provider, llmPreference.apiKey, "cold-email");
    const { object } = await generateObject({ model, schema: ColdEmailOutputSchema, prompt });

    return NextResponse.json({ steps: object.steps });
  } catch (err) {
    return errorResponse(err);
  }
}
