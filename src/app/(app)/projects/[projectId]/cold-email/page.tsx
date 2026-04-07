"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Sparkles, Loader2, Send, AlertTriangle, Mail, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EmailStep, EmailAnnotation } from "@/types/gtm";
import { checkSpam } from "@/lib/email/spam-words";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ColdEmailDraft {
  status: "PENDING" | "RUNNING" | "COMPLETE" | "ERROR" | "CANCELLED";
  targetMarketName: string;
  steps: EmailStep[];
  error?: string;
  startedAt: string;
  completedAt?: string;
}

interface TargetMarket { name: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const METRIC_LABEL: Record<EmailAnnotation["metric"], string> = {
  open_rate: "Open Rate",
  reply_rate: "Reply Rate",
  engagement: "Engagement",
  click_rate: "Click Rate",
};

const METRIC_COLOR: Record<EmailAnnotation["metric"], string> = {
  open_rate: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  reply_rate: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  engagement: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  click_rate: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

function countSpintax(text: string): number {
  return (text.match(/\{[^}]+\|[^}]+\}/g) ?? []).length;
}

function SpintaxBadge({ text }: { text: string }) {
  const count = countSpintax(text);
  if (count === 0) return null;
  const ok = count >= 8 && count <= 12;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${ok ? "bg-violet-500/10 text-violet-400 border-violet-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
      {count} spintax {ok ? "✓" : "(target 8–12)"}
    </span>
  );
}

function SpamWarning({ text }: { text: string }) {
  const matches = checkSpam(text);
  if (!matches.length) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <span>
        Spam words: {matches.map((m) => `"${m.word}"`).join(", ")} — may reduce deliverability.
      </span>
    </div>
  );
}

function EmailEditor({ step, index, onChange }: {
  step: EmailStep; index: number; onChange: (updated: EmailStep) => void;
}) {
  const combined = step.subject + " " + step.body;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-800/40">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-white">Step {index + 1}</span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-400">Day {step.waitDays}</span>
          <SpintaxBadge text={combined} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {step.annotations.map((a, i) => (
            <span key={i} className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${METRIC_COLOR[a.metric]}`} title={a.impact}>
              {a.part !== "subject" && <span className="text-[9px] opacity-60 uppercase">{a.part}</span>}
              {METRIC_LABEL[a.metric]}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Subject line</label>
          <Input
            value={step.subject}
            onChange={(e) => onChange({ ...step, subject: e.target.value })}
            className="bg-slate-800 border-white/10 text-white text-sm font-medium"
          />
          {step.annotations.filter((a) => a.part === "subject").map((a, i) => (
            <p key={i} className="mt-1 text-[10px] text-slate-500 leading-relaxed">{a.impact}</p>
          ))}
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Body</label>
          <Textarea
            value={step.body}
            onChange={(e) => onChange({ ...step, body: e.target.value })}
            rows={8}
            className="bg-slate-800 border-white/10 text-white text-sm resize-y font-mono leading-relaxed"
          />
          {step.annotations.filter((a) => a.part !== "subject").map((a, i) => (
            <p key={i} className="mt-1 text-[10px] text-slate-500 leading-relaxed">
              <span className="text-slate-600 font-semibold uppercase">{a.part}</span> — {a.impact}
            </p>
          ))}
        </div>
        <SpamWarning text={combined} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ColdEmailPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [markets, setMarkets] = useState<TargetMarket[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("");
  const [draft, setDraft] = useState<ColdEmailDraft | null>(null);
  const [emailSteps, setEmailSteps] = useState<EmailStep[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [pushing, setPushing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load project data + existing draft
  useEffect(() => {
    // Load target markets from project steps
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        const project = data.project;
        if (!project) return;
        setCompanyName(project.companyProfile?.name ?? "Campaign");
        const tmStep = project.steps?.find((s: { stepName: string; status: string }) => s.stepName === "TARGET_MARKETS" && (s.status === "COMPLETE" || s.status === "AWAITING_APPROVAL"));
        if (tmStep?.output?.markets) setMarkets(tmStep.output.markets);
      })
      .catch(() => {});

    // Load existing cold email draft
    fetch(`/api/projects/${projectId}/cold-email`)
      .then((r) => r.json())
      .then((data) => {
        if (data.draft) {
          const d = data.draft as ColdEmailDraft;
          setDraft(d);
          if (d.status === "COMPLETE" && d.steps?.length) {
            setEmailSteps(d.steps);
            setSelectedMarket(d.targetMarketName);
          }
        }
      })
      .catch(() => {});
  }, [projectId]);

  // Auto-update campaign name when market/company changes
  useEffect(() => {
    if (selectedMarket && companyName && emailSteps.length === 0) {
      setCampaignName(`${companyName} — ${selectedMarket} Sequence`);
    }
  }, [selectedMarket, companyName, emailSteps.length]);

  // Poll while generating
  useEffect(() => {
    const isRunning = draft?.status === "PENDING" || draft?.status === "RUNNING";
    if (!isRunning) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    if (pollRef.current) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/cold-email`);
        const data = await res.json();
        if (!data.draft) return;
        const d = data.draft as ColdEmailDraft;
        setDraft(d);
        if (d.status === "COMPLETE" && d.steps?.length) {
          setEmailSteps(d.steps);
          setCampaignName(`${companyName} — ${d.targetMarketName} Sequence`);
          toast.success("Email sequence ready!");
          clearInterval(pollRef.current!); pollRef.current = null;
        } else if (d.status === "ERROR") {
          toast.error(d.error ?? "Generation failed. Please try again.");
          clearInterval(pollRef.current!); pollRef.current = null;
        } else if (d.status === "CANCELLED") {
          clearInterval(pollRef.current!); pollRef.current = null;
        }
      } catch { /* keep polling */ }
    }, 3000);

    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [draft?.status, projectId, companyName]);

  const handleGenerate = useCallback(async () => {
    if (!selectedMarket) { toast.warning("Select a target market first."); return; }
    setEmailSteps([]);
    setDraft({ status: "PENDING", targetMarketName: selectedMarket, steps: [], startedAt: new Date().toISOString() });
    try {
      const res = await fetch(`/api/projects/${projectId}/cold-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetMarketName: selectedMarket }),
      });
      const data = await res.json();
      if (!res.ok) { setDraft(null); throw new Error(data.error?.message ?? "Failed to start generation"); }
      toast("Generating in the background — feel free to navigate away.");
    } catch (err) {
      toast.error((err as Error).message);
      setDraft(null);
    }
  }, [selectedMarket, projectId]);

  const handleStop = useCallback(async () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setDraft((prev) => prev ? { ...prev, status: "CANCELLED" } : null);
    try {
      await fetch(`/api/projects/${projectId}/cold-email`, { method: "DELETE" });
    } catch { /* best-effort */ }
    toast("Generation stopped.");
  }, [projectId]);

  const handlePush = useCallback(async () => {
    if (!campaignName.trim()) { toast.warning("Enter a campaign name."); return; }
    setPushing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/cold-email/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName,
          targetMarketName: draft?.targetMarketName ?? selectedMarket,
          steps: emailSteps.map((s) => ({ subject: s.subject, body: s.body, waitDays: s.waitDays })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Failed to create campaign");
      toast.success(`Campaign "${campaignName}" created on Smartlead!`);
      setCampaignName(`${companyName} — ${selectedMarket} Sequence`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPushing(false);
    }
  }, [campaignName, emailSteps, projectId, draft?.targetMarketName, selectedMarket, companyName]);

  const generating = draft?.status === "PENDING" || draft?.status === "RUNNING";

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="h-8 w-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
            <Mail className="h-4 w-4 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Cold Email Sequence</h1>
        </div>
        <p className="text-slate-500 text-sm ml-10">Generate a 3-step sequence grounded in your GTM strategy, then push to Smartlead.</p>
      </div>

      {/* Generator card */}
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-5">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-slate-400 block mb-1.5">Target Market</label>
            {markets.length === 0 ? (
              <p className="text-xs text-slate-500 bg-slate-800 border border-white/10 rounded-lg px-3 py-2">
                Complete the Target Markets step first.
              </p>
            ) : (
              <Select value={selectedMarket} onValueChange={setSelectedMarket} disabled={generating}>
                <SelectTrigger className="bg-slate-800 border-white/15 text-white">
                  <SelectValue placeholder="Select a market…" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/15">
                  {markets.map((m) => (
                    <SelectItem key={m.name} value={m.name} className="text-white focus:bg-violet-600/20 focus:text-violet-300">
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating || !selectedMarket || markets.length === 0}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shrink-0"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Generating…" : emailSteps.length > 0 ? "Regenerate" : "Generate Sequence"}
          </Button>
        </div>

        {generating && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs text-violet-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              Generating in the background — you can safely navigate away and come back.
            </div>
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors shrink-0"
              title="Stop generation"
            >
              <Square className="h-3 w-3 fill-current" />
              Stop
            </button>
          </div>
        )}

        {/* Spintax legend */}
        {emailSteps.length === 0 && !generating && (
          <div className="flex flex-wrap gap-2 pt-1">
            {(Object.keys(METRIC_LABEL) as EmailAnnotation["metric"][]).map((m) => (
              <span key={m} className={`text-[10px] px-2.5 py-1 rounded-full border ${METRIC_COLOR[m]}`}>
                {METRIC_LABEL[m]}
              </span>
            ))}
            <span className="text-[10px] text-slate-600 self-center ml-1">— metric impact annotations</span>
          </div>
        )}
      </div>

      {/* Email editors */}
      {emailSteps.length > 0 && (
        <>
          <div className="space-y-4">
            {emailSteps.map((step, i) => (
              <EmailEditor
                key={i}
                step={step}
                index={i}
                onChange={(updated) => setEmailSteps((prev) => prev.map((s, idx) => idx === i ? updated : s))}
              />
            ))}
          </div>

          {/* Push to Smartlead */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-400" />
              <h3 className="font-semibold text-white text-sm">Push to Smartlead</h3>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Campaign Name</label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="bg-slate-800 border-white/10 text-white text-sm"
                placeholder="My Campaign"
              />
            </div>
            <Button
              onClick={handlePush}
              disabled={pushing || !campaignName.trim()}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white gap-2"
            >
              {pushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {pushing ? "Creating campaign…" : "Create Campaign on Smartlead"}
            </Button>
            <p className="text-xs text-slate-600">Creates the campaign + 3 sequence steps. No leads added. Metrics will appear on the project dashboard.</p>
          </div>
        </>
      )}
    </div>
  );
}
