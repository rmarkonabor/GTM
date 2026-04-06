"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, CheckCircle2, Sparkles, Clock, ChevronDown, ChevronUp, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ErrorDisplay } from "./ErrorDisplay";
import { StepRunning, StepPending } from "./StepStatus";
import { VersionHistory } from "./VersionHistory";
import { toast } from "sonner";
import { formatCost, formatTokens } from "@/lib/ai/pricing";

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
  model: string;
}

interface StepData {
  status: string;
  output: unknown;
  draftOutput: unknown;
  errorCode?: string;
  errorMsg?: string;
  tokenUsage?: TokenUsage | null;
}

interface Props {
  projectId: string;
  stepName: string;
  stepLabel: string;
  children: (output: unknown, refresh: () => Promise<void>) => React.ReactNode;
  onApproved?: () => void;
}

export function StepPageWrapper({ projectId, stepName, stepLabel, children, onApproved }: Props) {
  const [step, setStep] = useState<StepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [editRunning, setEditRunning] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

  const fetchStep = useCallback(async () => {
    // cache: 'no-store' prevents browser caching stale status after approval
    const res = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
    const data = await res.json();
    const found = data.project?.steps?.find((s: { stepName: string }) => s.stepName === stepName);
    return found ?? null;
  }, [projectId, stepName]);

  const refresh = useCallback(async () => {
    const found = await fetchStep();
    setStep(found);
    setLoading(false);
  }, [fetchStep]);

  useEffect(() => {
    refresh();
    const interval = setInterval(async () => {
      const found = await fetchStep();
      if (found) {
        setStep(found);
        if (found.status !== "RUNNING") clearInterval(interval);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [projectId, stepName, fetchStep, refresh]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/steps/${stepName}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Failed to approve");
      toast.success("Step approved! Next step will start shortly.");
      await refresh();
      if (onApproved) {
        // Brief pause so user sees the green "Approved" state before navigating
        await new Promise((r) => setTimeout(r, 1200));
        onApproved();
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setApproving(false);
    }
  };

  const handleEdit = async () => {
    if (!editPrompt.trim()) return;
    setEditRunning(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/steps/${stepName}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: editPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Failed to re-run step");
      toast.success("Step re-run complete. Review and approve when ready.");
      setEditPrompt("");
      setEditOpen(false);
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setEditRunning(false);
    }
  };

  const handleVersionRestored = async () => {
    await refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!step || step.status === "PENDING") return <StepPending stepLabel={stepLabel} />;
  if (step.status === "RUNNING") return <StepRunning stepLabel={stepLabel} />;
  if (step.status === "ERROR") {
    return (
      <ErrorDisplay
        code={step.errorCode ?? "UNKNOWN_ERROR"}
        message={step.errorMsg ?? "An unexpected error occurred."}
      />
    );
  }

  // For AWAITING_APPROVAL, show draftOutput; for COMPLETE show output
  const displayOutput = step.status === "AWAITING_APPROVAL" ? step.draftOutput : step.output;
  if (!displayOutput) return <StepPending stepLabel={stepLabel} />;

  const isAwaiting = step.status === "AWAITING_APPROVAL";
  const usage = step.tokenUsage;
  const hasUsage = usage && (usage.totalTokens > 0 || usage.model !== "apollo-api");

  return (
    <div className="space-y-4">
      {/* Main output */}
      {children(displayOutput, refresh)}

      {/* Approval / Edit panel */}
      <div className={`rounded-xl border p-5 space-y-4 ${isAwaiting ? "border-violet-500/30 bg-violet-500/5" : "border-white/10 bg-slate-900"}`}>
        {/* Status header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAwaiting ? (
              <>
                <Clock className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-medium text-violet-300">Awaiting your approval</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-300">Approved</span>
              </>
            )}

            {/* Token usage + cost */}
            {hasUsage && (
              <div className="flex items-center gap-1.5 ml-3 text-xs text-slate-500">
                <Cpu className="h-3 w-3 shrink-0" />
                <span>{formatTokens(usage.promptTokens)} in / {formatTokens(usage.completionTokens)} out</span>
                <span className="text-slate-600">·</span>
                <span className={usage.estimatedCostUSD > 0 ? "text-slate-400" : "text-slate-600"}>
                  {usage.estimatedCostUSD > 0 ? formatCost(usage.estimatedCostUSD) : "free"}
                </span>
                <span className="text-slate-700">{usage.model}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setVersionHistoryOpen(true)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <Clock className="h-3.5 w-3.5" />
            Version History
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {isAwaiting && (
            <Button
              onClick={handleApprove}
              disabled={approving}
              className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
            >
              {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {approving ? "Approving..." : "Approve & Continue"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setEditOpen(!editOpen)}
            className="border-white/20 text-slate-300 hover:text-white gap-2"
          >
            <Sparkles className="h-4 w-4 text-violet-400" />
            Edit with AI
            {editOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* Edit panel */}
        {editOpen && (
          <div className="space-y-3 pt-1">
            <Textarea
              placeholder={`Describe changes to make to the ${stepLabel} output... e.g. "Focus more on enterprise customers in North America"`}
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              className="dark:bg-slate-800 dark:border-white/20 dark:text-white resize-none text-sm"
              rows={3}
              disabled={editRunning}
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={handleEdit}
                disabled={editRunning || !editPrompt.trim()}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
              >
                {editRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {editRunning ? "Re-running..." : "Re-run with this prompt"}
              </Button>
              <span className="text-xs text-slate-500">This will create a new version</span>
            </div>
          </div>
        )}
      </div>

      {/* Version History Panel */}
      <VersionHistory
        projectId={projectId}
        stepName={stepName}
        stepLabel={stepLabel}
        isOpen={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        onRestored={handleVersionRestored}
      />
    </div>
  );
}
