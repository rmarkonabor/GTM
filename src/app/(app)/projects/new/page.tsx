"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Globe, ArrowRight, Loader2, Target, CheckCircle2, AlertCircle } from "lucide-react";

interface ClarifyingQuestion {
  id: string;
  question: string;
  purpose: string;
  optional: boolean;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<"url" | "questions" | "running">("url");
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create project
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: url, name: name || undefined }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error?.message ?? "Failed to create project");

      const pid = createData.project.id;
      setProjectId(pid);

      // Step 2: Run research
      toast.info("Analyzing your website...");
      const researchRes = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: pid }),
      });
      const researchData = await researchRes.json();
      if (!researchRes.ok) throw new Error(researchData.error?.message ?? "Research failed");

      if (researchData.needsClarification && researchData.questionsNeeded?.length > 0) {
        setQuestions(researchData.questionsNeeded);
        setStep("questions");
      } else {
        // No questions needed — start workflow immediately
        await startWorkflow(pid);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswersSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      // Save answers
      const ansRes = await fetch("/api/clarifying", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, answers }),
      });
      if (!ansRes.ok) {
        const d = await ansRes.json();
        throw new Error(d.error?.message ?? "Failed to save answers");
      }

      await startWorkflow(projectId);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const startWorkflow = async (pid: string) => {
    const wfRes = await fetch("/api/workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: pid }),
    });
    const wfData = await wfRes.json();
    if (!wfRes.ok) throw new Error(wfData.error?.message ?? "Failed to start workflow");
    setStep("running");
    setTimeout(() => router.push(`/projects/${pid}`), 1500);
  };

  if (step === "running") {
    return (
      <div className="p-8 max-w-lg mx-auto text-center pt-24">
        <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          GTM strategy started!
        </h2>
        <p className="text-slate-500">
          Your strategy is being built in the background. Redirecting you to the project...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-5 w-5 text-violet-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New GTM Project</h1>
        </div>
        <p className="text-slate-500 text-sm">
          {step === "url"
            ? "Enter your website URL and our AI will research your company."
            : "A few quick questions to make your strategy more accurate."}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="mt-0.5 opacity-80">{error}</p>
          </div>
        </div>
      )}

      {step === "url" && (
        <form onSubmit={handleUrlSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6 space-y-4">
          <div>
            <Label className="text-sm text-slate-700 dark:text-slate-300">
              Website URL <span className="text-red-400">*</span>
            </Label>
            <div className="relative mt-1.5">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="url"
                placeholder="https://yourcompany.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-9 dark:bg-slate-800 dark:border-white/20 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-sm text-slate-700 dark:text-slate-300">
              Project name <span className="text-slate-400">(optional)</span>
            </Label>
            <Input
              placeholder="Auto-detected from URL"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 dark:bg-slate-800 dark:border-white/20 dark:text-white"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing website...
              </>
            ) : (
              <>
                Start Research
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}

      {step === "questions" && (
        <form onSubmit={handleAnswersSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6 space-y-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            The AI has {questions.length} question{questions.length > 1 ? "s" : ""} to improve your strategy. Optional questions can be skipped.
          </p>

          {questions.map((q) => (
            <div key={q.id}>
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {q.question}
                {q.optional && (
                  <span className="ml-1.5 text-slate-400 font-normal">(optional)</span>
                )}
              </Label>
              <p className="text-xs text-slate-400 mt-0.5 mb-1.5">{q.purpose}</p>
              <Textarea
                placeholder="Your answer..."
                value={answers[q.question] ?? ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setAnswers((prev) => ({ ...prev, [q.question]: e.target.value }))
                }
                className="dark:bg-slate-800 dark:border-white/20 dark:text-white resize-none"
                rows={2}
              />
            </div>
          ))}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Building strategy...
              </>
            ) : (
              <>
                Build My GTM Strategy
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
