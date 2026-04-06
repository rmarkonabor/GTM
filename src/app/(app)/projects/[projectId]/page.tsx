"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowRight, AlertCircle, Globe } from "lucide-react";

const STEP_PATHS: Record<string, string> = {
  RESEARCH: "research",
  TARGET_MARKETS: "target-markets",
  INDUSTRY_PRIORITY: "industry-priority",
  ICP: "icp",
  SEGMENTATION: "segmentation",
  COMPETITIVE: "competitive-analysis",
  MANIFESTO: "manifesto",
};

interface ClarifyingQuestion {
  id: string;
  question: string;
  purpose: string;
  optional: boolean;
}

interface Project {
  id: string;
  websiteUrl: string;
  status: string;
  clarifyingQs: { questions: ClarifyingQuestion[]; answers: Record<string, string> } | null;
  steps: { stepName: string; status: string }[];
}

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [phase, setPhase] = useState<"loading" | "researching" | "clarifying" | "starting" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.project as Project;
  }, [projectId]);

  const runResearch = useCallback(async () => {
    setPhase("researching");
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      let data: Record<string, unknown> = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }
      if (!res.ok) {
        setErrorMsg((data.error as { message?: string })?.message ?? `Research failed (${res.status}). Please try again.`);
        setPhase("error");
        return;
      }
      // Research is now AWAITING_APPROVAL — send user to review it
      router.push(`/projects/${projectId}/research`);
    } catch (err) {
      setErrorMsg((err as Error).message ?? "Research failed. Please try again.");
      setPhase("error");
    }
  }, [projectId, fetchProject]);

  const startWorkflow = useCallback(async () => {
    setPhase("starting");
    const res = await fetch("/api/workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error?.message ?? "Failed to start workflow.");
      setPhase("error");
      return;
    }
    router.push(`/projects/${projectId}/research`);
  }, [projectId, router]);

  // On mount: fetch project and decide what to do
  useEffect(() => {
    fetchProject().then((p) => {
      if (!p) { setErrorMsg("Project not found."); setPhase("error"); return; }
      setProject(p);

      // Highest priority: any step awaiting approval or actively running
      const priorityStep = p.steps.find((s) =>
        s.status === "AWAITING_APPROVAL" || s.status === "RUNNING" || s.status === "ERROR"
      );
      if (priorityStep) {
        router.replace(`/projects/${projectId}/${STEP_PATHS[priorityStep.stepName]}`);
        return;
      }

      // If clarifying questions need answering
      if (p.status === "CLARIFYING" && p.clarifyingQs?.questions?.length) {
        setAnswers(p.clarifyingQs.answers ?? {});
        setPhase("clarifying");
        return;
      }

      // If workflow is complete, go to dashboard
      if (p.status === "COMPLETE") {
        router.replace(`/projects/${projectId}/dashboard`);
        return;
      }

      // If workflow is in progress, go to most recent completed step
      if (p.status === "IN_PROGRESS") {
        const lastComplete = [...p.steps].reverse().find((s) => s.status === "COMPLETE");
        router.replace(`/projects/${projectId}/${STEP_PATHS[lastComplete?.stepName ?? "RESEARCH"]}`);
        return;
      }

      if (p.status === "ERROR") {
        setErrorMsg("Research failed. Please try again.");
        setPhase("error");
        return;
      }

      // RESEARCHING or fresh — start/resume research
      runResearch();
    });
  }, [fetchProject, projectId, router, runResearch]);

  const handleAnswersSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/clarifying", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, answers }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error?.message ?? "Failed to save answers");
      }
      await startWorkflow();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === "loading" || phase === "researching" || phase === "starting") {
    const label =
      phase === "researching" ? "Analyzing your website…" :
      phase === "starting" ? "Starting analysis…" :
      "Loading project…";

    return (
      <div className="p-8 max-w-xl">
        <div className="flex items-center gap-3 text-slate-400 mb-4">
          <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
          <span className="text-sm">{label}</span>
        </div>
        {project && (
          <div className="bg-slate-900 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Globe className="h-4 w-4" />
              {project.websiteUrl}
            </div>
          </div>
        )}
        {phase === "researching" && (
          <p className="text-xs text-slate-400 mt-4">
            Scraping website and running AI analysis. This takes 15–30 seconds.
            <br />You can close this tab — the project is saved and will be here when you return.
          </p>
        )}
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="p-8 max-w-xl">
        <div className="flex items-start gap-3 bg-red-900/20 border border-red-800 rounded-xl p-5">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-red-300">Something went wrong</p>
            <p className="text-sm text-red-400 mt-1">{errorMsg}</p>
          </div>
        </div>
        <Button
          onClick={() => { setPhase("researching"); runResearch(); }}
          className="mt-4 bg-violet-600 hover:bg-violet-700 text-white gap-2"
        >
          <ArrowRight className="h-4 w-4" /> Retry Research
        </Button>
      </div>
    );
  }

  // phase === "clarifying"
  const questions = project?.clarifyingQs?.questions ?? [];
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">A few quick questions</h1>
        <p className="text-slate-500 text-sm">
          Help the AI tailor your strategy. Optional questions can be skipped.
        </p>
      </div>

      <form onSubmit={handleAnswersSubmit} className="bg-slate-900 border border-white/10 rounded-xl p-6 space-y-5">
        {questions.map((q) => (
          <div key={q.id}>
            <Label className="text-sm font-medium text-slate-300">
              {q.question}
              {q.optional && <span className="ml-1.5 text-slate-400 font-normal">(optional)</span>}
            </Label>
            <p className="text-xs text-slate-400 mt-0.5 mb-1.5">{q.purpose}</p>
            <Textarea
              placeholder="Your answer…"
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              className="bg-slate-800 border-white/20 text-white resize-none"
              rows={2}
            />
          </div>
        ))}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {submitting ? "Building strategy…" : "Build My Strategy"}
        </Button>
      </form>
    </div>
  );
}
