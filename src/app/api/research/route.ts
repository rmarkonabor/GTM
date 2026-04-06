import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors/handlers";
import { scrapeUrl } from "@/lib/integrations/firecrawl";
import { getLanguageModel } from "@/lib/ai/providers";
import { buildResearchPrompt } from "@/lib/ai/prompts/research";
import { safeDecrypt } from "@/lib/crypto";
import { generateText } from "ai";
import { LLMPreference } from "@/types/gtm";
import { getModelForTask } from "@/lib/ai/router";
import { calculateCost } from "@/lib/ai/pricing";
import { z } from "zod";

const schema = z.object({ projectId: z.string() });

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let projectId: string | null = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }

    const body = await req.json();
    ({ projectId } = schema.parse(body));

    const [project, user] = await Promise.all([
      prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } }),
      prisma.user.findUnique({ where: { id: session.user.id } }),
    ]);

    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    const llmRaw = safeDecrypt(user?.llmPreference ?? null);
    if (!llmRaw) {
      return NextResponse.json(
        { error: { code: "LLM_NOT_CONFIGURED", message: "Please configure your LLM provider in Settings before running research." } },
        { status: 400 }
      );
    }
    const llm = JSON.parse(llmRaw) as LLMPreference;

    // Mark step as running
    await prisma.projectStep.upsert({
      where: { projectId_stepName: { projectId, stepName: "RESEARCH" } },
      update: { status: "RUNNING", startedAt: new Date(), errorCode: null, errorMsg: null },
      create: { projectId, stepName: "RESEARCH", status: "RUNNING", startedAt: new Date() },
    });

    // Scrape website
    const scrapedContent = await scrapeUrl(project.websiteUrl);

    // Run LLM analysis
    const modelId = getModelForTask(llm.provider, "research-enrichment");
    const model = getLanguageModel(llm.provider, llm.apiKey, "research-enrichment");
    const prompt = buildResearchPrompt(project.websiteUrl, scrapedContent);
    const { text, usage } = await generateText({ model, prompt, maxOutputTokens: 2000 });

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in LLM response");
    const parsed = JSON.parse(jsonMatch[0]);
    const { companyProfile, questionsNeeded } = parsed;

    await prisma.project.update({
      where: { id: projectId },
      data: {
        companyProfile,
        businessType: companyProfile.businessType,
        clarifyingQs: { questions: questionsNeeded ?? [], answers: {} },
        status: "RESEARCHING", // stays RESEARCHING until user approves research step
      },
    });

    // Save version
    const versionCount = await prisma.projectStepVersion.count({
      where: { projectId, stepName: "RESEARCH" },
    });
    await prisma.projectStepVersion.create({
      data: {
        id: `${projectId}-RESEARCH-${versionCount + 1}-${Date.now()}`,
        projectId,
        stepName: "RESEARCH",
        versionNum: versionCount + 1,
        output: { companyProfile, questionsNeeded } as object,
      },
    });

    const tokenUsage = {
      promptTokens: usage.inputTokens ?? 0,
      completionTokens: usage.outputTokens ?? 0,
      totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
      estimatedCostUSD: calculateCost(modelId, usage.inputTokens ?? 0, usage.outputTokens ?? 0),
      model: modelId,
    };

    // Save as draft, await approval (same pattern as workflow steps)
    await prisma.projectStep.update({
      where: { projectId_stepName: { projectId, stepName: "RESEARCH" } },
      data: {
        status: "AWAITING_APPROVAL",
        draftOutput: { companyProfile, questionsNeeded } as object,
        tokenUsage: tokenUsage as object,
      },
    });

    return NextResponse.json({
      companyProfile,
      questionsNeeded: questionsNeeded ?? [],
      needsClarification: (questionsNeeded?.length ?? 0) > 0,
    });
  } catch (err) {
    // Mark step as ERROR so the UI doesn't stay stuck on "Running"
    if (projectId) {
      await prisma.projectStep.upsert({
        where: { projectId_stepName: { projectId, stepName: "RESEARCH" } },
        update: { status: "ERROR", errorCode: "RESEARCH_FAILED", errorMsg: err instanceof Error ? err.message : "Unknown error" },
        create: { projectId, stepName: "RESEARCH", status: "ERROR", errorCode: "RESEARCH_FAILED", errorMsg: err instanceof Error ? err.message : "Unknown error" },
      }).catch(() => {});
      await prisma.project.update({ where: { id: projectId }, data: { status: "ERROR" } }).catch(() => {});
    }
    return errorResponse(err);
  }
}
