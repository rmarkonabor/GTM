import { inngest } from "@/../inngest/client";
import { prisma } from "@/lib/db/client";
import { StepName } from "@prisma/client";
import { getErrorDetails } from "@/lib/errors/types";
import { WorkflowContext } from "@/types/gtm";
import { runTargetMarkets } from "./steps/runTargetMarkets";
import { runIndustryPriority } from "./steps/runIndustryPriority";
import { runICP } from "./steps/runICP";
import { runSegmentation } from "./steps/runSegmentation";
import { runMarketSizing } from "./steps/runMarketSizing";
import { runCompetitive } from "./steps/runCompetitive";
import { runPositioning } from "./steps/runPositioning";
import { runManifesto } from "./steps/runManifesto";
import { buildStepContext } from "./context-builder";

export const gtmWorkflow = inngest.createFunction(
  {
    id: "gtm-workflow",
    retries: 2,
    triggers: [{ event: "gtm/workflow.start" }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: any) => {
    const { projectId, llmPreference, dbPreferences } = event.data as {
      projectId: string;
      llmPreference: { provider: string; apiKey: string };
      dbPreferences: { apollo?: { apiKey: string }; clay?: { apiKey: string } };
    };

    // Load project
    const project = await step.run("load-project", async () => {
      return prisma.project.update({
        where: { id: projectId },
        data: { status: "IN_PROGRESS" },
        include: { steps: true },
      });
    });

    const ctx: WorkflowContext = {
      projectId,
      websiteUrl: project.websiteUrl,
      companyProfile: project.companyProfile as unknown as WorkflowContext["companyProfile"],
      clarifyingAnswers: (project.clarifyingQs as { answers?: Record<string, string> })?.answers ?? {},
      businessType: project.businessType ?? "other",
      steps: {},
    };

    const runStep = async <T>(
      stepName: StepName,
      fn: (ctx: WorkflowContext) => Promise<T>
    ): Promise<T> => {
      return step.run(`step-${stepName}`, async () => {
        await prisma.projectStep.upsert({
          where: { projectId_stepName: { projectId, stepName } },
          update: { status: "RUNNING", startedAt: new Date(), errorCode: null, errorMsg: null },
          create: { projectId, stepName, status: "RUNNING", startedAt: new Date() },
        });
        try {
          const output = await fn(ctx);
          await prisma.projectStep.update({
            where: { projectId_stepName: { projectId, stepName } },
            data: { status: "COMPLETE", output: output as object, completedAt: new Date() },
          });
          return output;
        } catch (err) {
          const { code, message } = getErrorDetails(err);
          await prisma.projectStep.update({
            where: { projectId_stepName: { projectId, stepName } },
            data: { status: "ERROR", errorCode: code, errorMsg: message },
          });
          throw err;
        }
      });
    };

    // Step 1: Target Markets (research already done before workflow starts)
    const targetMarkets = await runStep("TARGET_MARKETS", (c) =>
      runTargetMarkets(c, llmPreference)
    );
    ctx.steps.TARGET_MARKETS = targetMarkets;

    // Step 2: Industry Priority (for each market)
    const industryPriority = await runStep("INDUSTRY_PRIORITY", (c) =>
      runIndustryPriority(c, llmPreference)
    );
    ctx.steps.INDUSTRY_PRIORITY = industryPriority;

    // Step 3: ICP
    const icp = await runStep("ICP", (c) => runICP(c, llmPreference));
    ctx.steps.ICP = icp;

    // Step 4: Segmentation
    const segmentation = await runStep("SEGMENTATION", (c) =>
      runSegmentation(c, llmPreference)
    );
    ctx.steps.SEGMENTATION = segmentation;

    // Step 5: Market Sizing
    const marketSizing = await runStep("MARKET_SIZING", (c) =>
      runMarketSizing(c, llmPreference, dbPreferences)
    );
    ctx.steps.MARKET_SIZING = marketSizing;

    // Step 6: Competitive Analysis
    const competitive = await runStep("COMPETITIVE", (c) =>
      runCompetitive(c, llmPreference)
    );
    ctx.steps.COMPETITIVE = competitive;

    // Step 7: Positioning
    const positioning = await runStep("POSITIONING", (c) =>
      runPositioning(c, llmPreference)
    );
    ctx.steps.POSITIONING = positioning;

    // Step 8: Manifesto
    const manifesto = await runStep("MANIFESTO", (c) =>
      runManifesto(c, llmPreference)
    );
    ctx.steps.MANIFESTO = manifesto;

    // Mark project complete
    await step.run("complete-project", async () => {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: "COMPLETE" },
      });
    });

    return { projectId, status: "COMPLETE" };
  }
);
