import { inngest } from "@/../inngest/client";
import { prisma } from "@/lib/db/client";
import { safeDecrypt } from "@/lib/crypto";
import { LLMPreference } from "@/types/gtm";
import { buildContextFromDB, buildColdEmailContext } from "@/lib/workflow/context-builder";
import { getLanguageModel } from "@/lib/ai/providers";
import { buildColdEmailPrompt } from "@/lib/ai/prompts/cold-email";
import { generateObject } from "ai";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────
//
// Entire 4-step sequence in ONE structured object — one LLM call, one failure
// point, no state machine, no partial draft management.

const EmailSchema = z.object({
  type: z.enum(["email_1", "follow_up_1", "follow_up_2", "break_up_email"]),
  subject: z.string(),
  body: z.string(),
  waitDays: z.number().int().min(0),
  angle: z.string(),
  annotations: z
    .array(
      z.object({
        part: z.enum(["subject", "opener", "body", "cta", "closing"]),
        metric: z.enum(["open_rate", "reply_rate", "engagement", "click_rate"]),
        impact: z.string(),
      })
    )
    .min(1)
    .max(4),
});

const SequenceSchema = z.object({
  strategy_summary: z.string(),
  campaign_brief: z.string(),
  subject_lines: z
    .array(z.object({ text: z.string(), rationale: z.string() }))
    .min(1)
    .max(3),
  emails: z.array(EmailSchema).length(4),
  missing_inputs: z.array(z.string()),
});

// ─── Inngest function ─────────────────────────────────────────────────────────

export const coldEmailGenerator = inngest.createFunction(
  {
    id: "cold-email-generator",
    retries: 0,
    cancelOn: [
      {
        event: "gtm/cold-email.cancel",
        if: "async.data.projectId == event.data.projectId",
      },
    ],
    triggers: [{ event: "gtm/cold-email.generate" }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onFailure: async ({ event, error }: any) => {
      const projectId = event?.data?.event?.data?.projectId as string | undefined;
      console.error("[cold-email] onFailure", { projectId, error: error?.message });
      if (!projectId) return;
      try {
        const row = await prisma.project.findUnique({
          where: { id: projectId },
          select: { coldEmailDraft: true },
        });
        const current = (row?.coldEmailDraft ?? {}) as Record<string, unknown>;
        // Only overwrite if we're still RUNNING — avoid clobbering a later success
        if (current.status === "RUNNING" || current.status === "PENDING") {
          await prisma.project.update({
            where: { id: projectId },
            data: {
              coldEmailDraft: {
                ...current,
                status: "ERROR",
                error: error?.message ?? "Generation failed. Please try again.",
              },
            },
          });
        }
      } catch (e) {
        console.error("[cold-email] onFailure DB write failed", e);
      }
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event }: any) => {
    const { projectId, targetMarketName } = event.data as {
      projectId: string;
      targetMarketName: string;
    };
    const startedAt = Date.now();
    console.log("[cold-email] START", { projectId, targetMarketName });

    try {
      // 1. Load project + API key + context (all in one go)
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { user: true },
      });
      if (!project) throw new Error("Project not found");

      const llmRaw = safeDecrypt(project.user?.llmPreference ?? null);
      if (!llmRaw) throw new Error("No LLM API key configured — add it in Settings.");
      const llmPreference = JSON.parse(llmRaw) as LLMPreference;

      const ctx = await buildContextFromDB(projectId);
      if (!ctx) throw new Error("Project context not found");

      const context = buildColdEmailContext(ctx, targetMarketName);
      const model = getLanguageModel(llmPreference.provider, llmPreference.apiKey, "cold-email");
      const prompt = buildColdEmailPrompt(context, targetMarketName);

      console.log("[cold-email] calling LLM", {
        provider: llmPreference.provider,
        contextChars: context.length,
        promptChars: prompt.length,
      });

      // 2. ONE LLM call — Promise.race guarantees timeout regardless of SDK behaviour
      const controller = new AbortController();
      const TIMEOUT_MS = 120_000;

      const llmCall = generateObject({
        model,
        schema: SequenceSchema,
        prompt,
        maxRetries: 0,
        abortSignal: controller.signal,
      }).then((r) => r.object);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => {
          controller.abort();
          reject(new Error(`LLM timed out after ${TIMEOUT_MS / 1000}s. Try again or switch provider in Settings.`));
        }, TIMEOUT_MS)
      );

      const result = await Promise.race([llmCall, timeout]);
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      console.log("[cold-email] LLM done", { elapsed, emails: result.emails.length });

      // 3. Unpack emails array into named fields for the UI
      const byType = Object.fromEntries(result.emails.map((e) => [e.type, e]));

      // 4. Write COMPLETE to DB
      await prisma.project.update({
        where: { id: projectId },
        data: {
          coldEmailDraft: {
            status: "COMPLETE",
            targetMarketName,
            startedAt: new Date(startedAt).toISOString(),
            completedAt: new Date().toISOString(),
            strategy_summary: result.strategy_summary,
            campaign_brief: result.campaign_brief,
            subject_lines: result.subject_lines,
            missing_inputs: result.missing_inputs,
            email_1: byType["email_1"] ?? null,
            follow_up_1: byType["follow_up_1"] ?? null,
            follow_up_2: byType["follow_up_2"] ?? null,
            break_up_email: byType["break_up_email"] ?? null,
          },
        },
      });

      console.log("[cold-email] COMPLETE", { projectId, elapsed });
    } catch (err) {
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      const msg = err instanceof Error ? err.message : "Cold email generation failed";
      console.error("[cold-email] ERROR", { projectId, elapsed, msg });

      // Write ERROR to DB directly — don't rely on onFailure alone
      try {
        const row = await prisma.project.findUnique({
          where: { id: projectId },
          select: { coldEmailDraft: true },
        });
        const current = (row?.coldEmailDraft ?? {}) as Record<string, unknown>;
        await prisma.project.update({
          where: { id: projectId },
          data: {
            coldEmailDraft: {
              ...current,
              status: "ERROR",
              error: msg,
            },
          },
        });
      } catch (dbErr) {
        console.error("[cold-email] failed to write ERROR to DB", dbErr);
      }

      throw err;
    }
  }
);
