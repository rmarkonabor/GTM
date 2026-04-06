import { inngest } from "@/../inngest/client";
import { prisma } from "@/lib/db/client";
import { Prisma, StepName } from "@prisma/client";
import { getErrorDetails } from "@/lib/errors/types";
import { WorkflowContext, LLMPreference, DBPreferences } from "@/types/gtm";
import { safeDecrypt } from "@/lib/crypto";
import { runIndustryPriority } from "./steps/runIndustryPriority";
import { runICP } from "./steps/runICP";
import { runTargetMarkets } from "./steps/runTargetMarkets";
import { runCompetitive } from "./steps/runCompetitive";
import { runSegmentation } from "./steps/runSegmentation";
import { runMarketSizing } from "./steps/runMarketSizing";
import { runPositioning } from "./steps/runPositioning";
import { runManifesto } from "./steps/runManifesto";

// Canonical order — must match the restore route and nav
// INDUSTRY_PRIORITY → TARGET_MARKETS → ICP → COMPETITIVE → SEGMENTATION → MARKET_SIZING → POSITIONING → MANIFESTO
// ICP comes after TARGET_MARKETS so it can create market-specific profiles
const STEP_ORDER: StepName[] = [
  "INDUSTRY_PRIORITY",
  "TARGET_MARKETS",
  "ICP",
  "COMPETITIVE",
  "SEGMENTATION",
  "MARKET_SIZING",
  "POSITIONING",
  "MANIFESTO",
];

export const gtmWorkflow = inngest.createFunction(
  {
    id: "gtm-workflow",
    retries: 1,
    triggers: [{ event: "gtm/workflow.start" }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: any) => {
    const { projectId } = event.data as { projectId: string };

    // Load project, user LLM settings, and completed step outputs
    const loaded = await step.run("load-context", async () => {
      const p = await prisma.project.findUnique({
        where: { id: projectId },
        include: { steps: true },
      });
      if (!p) throw new Error(`Project ${projectId} not found`);

      const user = await prisma.user.findUnique({ where: { id: p.userId } });
      const llmRaw = safeDecrypt(user?.llmPreference ?? null);
      if (!llmRaw) throw new Error("LLM not configured — please set your API key in Settings.");
      const llm = JSON.parse(llmRaw) as LLMPreference;
      const dbRaw = safeDecrypt(user?.dbPreferences ?? null);
      const db: DBPreferences = dbRaw ? JSON.parse(dbRaw) : {};

      const priorOutputs: Record<string, unknown> = {};
      for (const s of p.steps) {
        if (s.status === "COMPLETE" && s.output) {
          priorOutputs[s.stepName] = s.output;
        }
      }

      // Ensure project is IN_PROGRESS
      if (p.status !== "IN_PROGRESS" && p.status !== "COMPLETE") {
        await prisma.project.update({ where: { id: projectId }, data: { status: "IN_PROGRESS" } });
      }

      return {
        websiteUrl: p.websiteUrl,
        companyProfile: p.companyProfile,
        clarifyingQs: p.clarifyingQs,
        businessType: p.businessType,
        projectStatus: p.status,
        steps: p.steps.map((s) => ({ stepName: s.stepName, status: s.status })),
        priorOutputs,
        llm,
        db,
      };
    });

    // Find the next step to run — only after all prior steps are COMPLETE
    const nextStepName = STEP_ORDER.find((s, idx) => {
      const existing = loaded.steps.find(
        (ps: { stepName: StepName; status: string }) => ps.stepName === s
      );
      // This step must be pending/unstarted
      if (existing && existing.status !== "PENDING") return false;
      // All prior steps must be COMPLETE
      const priorSteps = STEP_ORDER.slice(0, idx);
      const allPriorComplete = priorSteps.every((prior) => {
        const priorStep = loaded.steps.find(
          (ps: { stepName: StepName; status: string }) => ps.stepName === prior
        );
        return priorStep?.status === "COMPLETE";
      });
      return allPriorComplete;
    });

    // All steps done — mark project complete
    if (!nextStepName) {
      await step.run("complete-project", async () => {
        await prisma.project.update({ where: { id: projectId }, data: { status: "COMPLETE" } });
      });
      return { projectId, status: "COMPLETE" };
    }

    const ctx: WorkflowContext = {
      projectId,
      websiteUrl: loaded.websiteUrl,
      companyProfile: loaded.companyProfile as WorkflowContext["companyProfile"],
      clarifyingAnswers:
        (loaded.clarifyingQs as { answers?: Record<string, string> } | null)?.answers ?? {},
      businessType: loaded.businessType ?? "other",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      steps: loaded.priorOutputs as any,
    };

    const llmPreference = loaded.llm as LLMPreference;
    const dbPreferences = loaded.db as DBPreferences;

    // Run the next step: mark RUNNING → call LLM → save → mark AWAITING_APPROVAL
    await step.run(`run-${nextStepName}`, async () => {
      await prisma.projectStep.upsert({
        where: { projectId_stepName: { projectId, stepName: nextStepName } },
        update: {
          status: "RUNNING",
          startedAt: new Date(),
          errorCode: null,
          errorMsg: null,
          draftOutput: Prisma.DbNull,
        },
        create: {
          projectId,
          stepName: nextStepName,
          status: "RUNNING",
          startedAt: new Date(),
        },
      });

      try {
        let output: unknown;
        let tokenUsage: unknown = null;

        switch (nextStepName) {
          case "INDUSTRY_PRIORITY": {
            const r = await runIndustryPriority(ctx, llmPreference);
            output = r.output; tokenUsage = r.usage; break;
          }
          case "ICP": {
            const r = await runICP(ctx, llmPreference);
            output = r.output; tokenUsage = r.usage; break;
          }
          case "TARGET_MARKETS": {
            const r = await runTargetMarkets(ctx, llmPreference);
            output = r.output; tokenUsage = r.usage; break;
          }
          case "COMPETITIVE": {
            const r = await runCompetitive(ctx, llmPreference);
            output = r.output; tokenUsage = r.usage; break;
          }
          case "SEGMENTATION": {
            const r = await runSegmentation(ctx, llmPreference);
            output = r.output; tokenUsage = r.usage; break;
          }
          case "MARKET_SIZING": {
            const r = await runMarketSizing(ctx, llmPreference, dbPreferences);
            output = r.output; tokenUsage = r.usage; break;
          }
          case "POSITIONING": {
            const r = await runPositioning(ctx, llmPreference);
            output = r.output; tokenUsage = r.usage; break;
          }
          case "MANIFESTO": {
            const r = await runManifesto(ctx, llmPreference);
            output = r.output; tokenUsage = r.usage; break;
          }
          default:
            throw new Error(`Unknown step: ${nextStepName}`);
        }

        // Save a version snapshot
        const count = await prisma.projectStepVersion.count({
          where: { projectId, stepName: nextStepName },
        });
        await prisma.projectStepVersion.create({
          data: {
            id: `${projectId}-${nextStepName}-${count + 1}-${Date.now()}`,
            projectId,
            stepName: nextStepName,
            versionNum: count + 1,
            output: output as object,
          },
        });

        await prisma.projectStep.update({
          where: { projectId_stepName: { projectId, stepName: nextStepName } },
          data: {
            status: "AWAITING_APPROVAL",
            draftOutput: output as object,
            tokenUsage: tokenUsage as object ?? Prisma.DbNull,
          },
        });
      } catch (err) {
        const { code, message } = getErrorDetails(err);
        await prisma.projectStep.update({
          where: { projectId_stepName: { projectId, stepName: nextStepName } },
          data: { status: "ERROR", errorCode: code, errorMsg: message },
        });
        throw err;
      }
    });

    return { projectId, step: nextStepName, status: "AWAITING_APPROVAL" };
  }
);
