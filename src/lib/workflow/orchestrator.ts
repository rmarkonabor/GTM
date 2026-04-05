import { inngest } from "@/../inngest/client";
import { prisma } from "@/lib/db/client";
import { Prisma, StepName } from "@prisma/client";
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

export const gtmWorkflow = inngest.createFunction(
  {
    id: "gtm-workflow",
    retries: 0,
    triggers: [{ event: "gtm/workflow.start" }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: any) => {
    const { projectId, llmPreference, dbPreferences } = event.data as {
      projectId: string;
      llmPreference: { provider: string; apiKey: string };
      dbPreferences: { apollo?: { apiKey: string }; clay?: { apiKey: string } };
    };

    // Load project + any previously completed steps (for re-runs)
    const { project, priorOutputs } = await step.run("load-project", async () => {
      const p = await prisma.project.update({
        where: { id: projectId },
        data: { status: "IN_PROGRESS" },
        include: { steps: true },
      });
      const outputs: Record<string, unknown> = {};
      for (const s of p.steps) {
        if (s.status === "COMPLETE" && s.output) {
          outputs[s.stepName] = s.output;
        }
      }
      return { project: p, priorOutputs: outputs };
    });

    const ctx: WorkflowContext = {
      projectId,
      websiteUrl: project.websiteUrl,
      companyProfile: project.companyProfile as unknown as WorkflowContext["companyProfile"],
      clarifyingAnswers: (project.clarifyingQs as { answers?: Record<string, string> })?.answers ?? {},
      businessType: project.businessType ?? "other",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      steps: priorOutputs as any,
    };

    // Helper: save a version of step output
    const saveVersion = async (stepName: StepName, output: unknown, prompt?: string) => {
      const count = await prisma.projectStepVersion.count({ where: { projectId, stepName } });
      await prisma.projectStepVersion.create({
        data: {
          id: `${projectId}-${stepName}-${count + 1}-${Date.now()}`,
          projectId,
          stepName,
          versionNum: count + 1,
          output: output as object,
          prompt: prompt ?? null,
        },
      });
    };

    const runStep = async <T>(
      stepName: StepName,
      fn: (ctx: WorkflowContext) => Promise<T>
    ): Promise<T> => {
      // Check if already complete (for workflow re-runs starting from later step)
      const alreadyDone = await step.run(`check-${stepName}`, async () => {
        const s = await prisma.projectStep.findUnique({
          where: { projectId_stepName: { projectId, stepName } },
        });
        return s?.status === "COMPLETE" ? s.output : null;
      });
      if (alreadyDone) return alreadyDone as T;

      // Run the step
      await step.run(`run-${stepName}`, async () => {
        await prisma.projectStep.upsert({
          where: { projectId_stepName: { projectId, stepName } },
          update: { status: "RUNNING", startedAt: new Date(), errorCode: null, errorMsg: null, draftOutput: Prisma.DbNull },
          create: { projectId, stepName, status: "RUNNING", startedAt: new Date() },
        });
        try {
          const output = await fn(ctx);
          // Save version
          await saveVersion(stepName, output);
          // Save as draft, await approval
          await prisma.projectStep.update({
            where: { projectId_stepName: { projectId, stepName } },
            data: { status: "AWAITING_APPROVAL", draftOutput: output as object },
          });
        } catch (err) {
          const { code, message } = getErrorDetails(err);
          await prisma.projectStep.update({
            where: { projectId_stepName: { projectId, stepName } },
            data: { status: "ERROR", errorCode: code, errorMsg: message },
          });
          throw err;
        }
      });

      // Wait for user approval
      await step.waitForEvent(`wait-approval-${stepName}`, {
        event: "gtm/step.approved",
        timeout: "7d",
        if: `event.data.projectId == "${projectId}" && event.data.stepName == "${stepName}"`,
      });

      // Load the approved output from DB (approve API already set output + COMPLETE)
      const approvedOutput = await step.run(`load-approved-${stepName}`, async () => {
        const s = await prisma.projectStep.findUnique({
          where: { projectId_stepName: { projectId, stepName } },
        });
        return s?.output as T;
      });

      return approvedOutput;
    };

    const targetMarkets = await runStep("TARGET_MARKETS", (c) => runTargetMarkets(c, llmPreference));
    ctx.steps.TARGET_MARKETS = targetMarkets;

    const industryPriority = await runStep("INDUSTRY_PRIORITY", (c) => runIndustryPriority(c, llmPreference));
    ctx.steps.INDUSTRY_PRIORITY = industryPriority;

    const icp = await runStep("ICP", (c) => runICP(c, llmPreference));
    ctx.steps.ICP = icp;

    const segmentation = await runStep("SEGMENTATION", (c) => runSegmentation(c, llmPreference));
    ctx.steps.SEGMENTATION = segmentation;

    const marketSizing = await runStep("MARKET_SIZING", (c) => runMarketSizing(c, llmPreference, dbPreferences));
    ctx.steps.MARKET_SIZING = marketSizing;

    const competitive = await runStep("COMPETITIVE", (c) => runCompetitive(c, llmPreference));
    ctx.steps.COMPETITIVE = competitive;

    const positioning = await runStep("POSITIONING", (c) => runPositioning(c, llmPreference));
    ctx.steps.POSITIONING = positioning;

    const manifesto = await runStep("MANIFESTO", (c) => runManifesto(c, llmPreference));
    ctx.steps.MANIFESTO = manifesto;

    await step.run("complete-project", async () => {
      await prisma.project.update({ where: { id: projectId }, data: { status: "COMPLETE" } });
    });

    return { projectId, status: "COMPLETE" };
  }
);
