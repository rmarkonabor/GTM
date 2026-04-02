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
import { z } from "zod";

const schema = z.object({ projectId: z.string() });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Please sign in." } }, { status: 401 });
    }

    const body = await req.json();
    const { projectId } = schema.parse(body);

    const [project, user] = await Promise.all([
      prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } }),
      prisma.user.findUnique({ where: { id: session.user.id } }),
    ]);

    if (!project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
    }

    // Get user's LLM preference
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
    const model = getLanguageModel(llm.provider, llm.apiKey, "research-enrichment");
    const prompt = buildResearchPrompt(project.websiteUrl, scrapedContent);
    const { text } = await generateText({ model, prompt, maxOutputTokens: 2000 });

    let parsed;
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("SCRAPING_PARSE_ERROR: Could not parse research output. Please try again.");
    }

    const { companyProfile, questionsNeeded } = parsed;

    // Save company profile to project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        companyProfile,
        businessType: companyProfile.businessType,
        clarifyingQs: { questions: questionsNeeded, answers: {} },
        status: questionsNeeded?.length > 0 ? "CLARIFYING" : "IN_PROGRESS",
      },
    });

    // Mark research step complete
    await prisma.projectStep.update({
      where: { projectId_stepName: { projectId, stepName: "RESEARCH" } },
      data: {
        status: "COMPLETE",
        output: { companyProfile, questionsNeeded },
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      companyProfile,
      questionsNeeded,
      needsClarification: questionsNeeded?.length > 0,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
