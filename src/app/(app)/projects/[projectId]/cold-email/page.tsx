"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Sparkles, Loader2, Send, AlertTriangle, Mail, Square,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ColdEmail, SubjectLineOption, QualityCheck, EmailAnnotation } from "@/types/gtm";
import { checkSpam } from "@/lib/email/spam-words";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ColdEmailDraft {
  status: "PENDING" | "RUNNING" | "COMPLETE" | "ERROR" | "CANCELLED";
  targetMarketName: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
  // New format fields
  strategy_summary?: string;
  campaign_brief?: string;
  subject_lines?: SubjectLineOption[];
  email_1?: ColdEmail;
  follow_up_1?: ColdEmail;
  follow_up_2?: ColdEmail;
  break_up_email?: ColdEmail;
  quality_check?: QualityCheck;
  missing_inputs?: string[];
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

const EMAIL_LABELS: Record<string, { label: string; sublabel: string }> = {
  email_1:      { label: "Email 1",      sublabel: "Cold First Touch" },
  follow_up_1:  { label: "Follow-up 1",  sublabel: "New Angle" },
  follow_up_2:  { label: "Follow-up 2",  sublabel: "Second Angle" },
  break_up_email: { label: "Break-up",   sublabel: "Close the Loop" },
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
      <span>Spam words: {matches.map((m) => `"${m.word}"`).join(", ")} — may reduce deliverability.</span>
    </div>
  );
}

// ─── Email Editor ─────────────────────────────────────────────────────────────

function EmailEditor({
  emailKey, email, onChange,
}: {
  emailKey: string;
  email: ColdEmail;
  onChange: (updated: ColdEmail) => void;
}) {
  const { label, sublabel } = EMAIL_LABELS[emailKey] ?? { label: emailKey, sublabel: "" };
  const combined = email.subject + " " + email.body;

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-white/5 bg-slate-800/40 gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-white">{label}</span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400">{sublabel}</span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-500">Day {email.waitDays}</span>
            <SpintaxBadge text={combined} />
          </div>
          {email.angle && (
            <p className="text-[11px] text-slate-500 italic">Angle: {email.angle}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
          {email.annotations.map((a, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${METRIC_COLOR[a.metric]}`}
              title={a.impact}
            >
              {a.part !== "subject" && <span className="text-[9px] opacity-60 uppercase">{a.part}</span>}
              {METRIC_LABEL[a.metric]}
            </span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Subject line</label>
          <Input
            value={email.subject}
            onChange={(e) => onChange({ ...email, subject: e.target.value })}
            className="bg-slate-800 border-white/10 text-white text-sm font-medium"
          />
          {email.annotations.filter((a) => a.part === "subject").map((a, i) => (
            <p key={i} className="mt-1 text-[10px] text-slate-500 leading-relaxed">{a.impact}</p>
          ))}
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Body</label>
          <Textarea
            value={email.body}
            onChange={(e) => onChange({ ...email, body: e.target.value })}
            rows={emailKey === "break_up_email" ? 4 : 7}
            className="bg-slate-800 border-white/10 text-white text-sm resize-y font-mono leading-relaxed"
          />
          {email.annotations.filter((a) => a.part !== "subject").map((a, i) => (
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

// ─── Subject Line Selector ────────────────────────────────────────────────────

function SubjectLineSelector({
  options, selectedIdx, onSelect,
}: {
  options: SubjectLineOption[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-white">Subject Line Options</h3>
        <span className="text-xs text-slate-500">for Email 1 — select one</span>
      </div>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
              selectedIdx === i
                ? "border-violet-500/50 bg-violet-500/10"
                : "border-white/10 bg-slate-800/50 hover:border-white/20"
            }`}
          >
            <p className={`text-sm font-medium ${selectedIdx === i ? "text-violet-300" : "text-white"}`}>
              {opt.text}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">{opt.rationale}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Quality Check ────────────────────────────────────────────────────────────

function QualityCheckPanel({ qc }: { qc: QualityCheck }) {
  const [open, setOpen] = useState(false);
  const checks: { label: string; value: boolean }[] = [
    { label: "Feels human", value: qc.feels_human },
    { label: "No buzzwords", value: qc.no_buzzwords },
    { label: "Prospect-focused", value: qc.prospect_focused },
    { label: "CTA easy to reply to", value: qc.cta_easy_to_reply },
  ];
  const allPassed = checks.every((c) => c.value);

  return (
    <div className={`rounded-xl border px-4 py-3 ${allPassed ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full gap-3"
      >
        <div className="flex items-center gap-2">
          {allPassed
            ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            : <AlertTriangle className="h-4 w-4 text-amber-400" />
          }
          <span className="text-sm font-semibold text-white">Quality Check</span>
          <span className="text-xs text-slate-500">Email 1: {qc.word_count_email_1} words</span>
          {qc.word_count_email_1 < 50 && (
            <span className="text-[10px] text-amber-400 border border-amber-500/20 bg-amber-500/10 rounded-full px-2 py-0.5">Too short</span>
          )}
          {qc.word_count_email_1 > 100 && (
            <span className="text-[10px] text-amber-400 border border-amber-500/20 bg-amber-500/10 rounded-full px-2 py-0.5">Too long</span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>

      {open && (
        <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
          <div className="grid grid-cols-2 gap-2">
            {checks.map((c) => (
              <div key={c.label} className="flex items-center gap-2 text-xs">
                {c.value
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                }
                <span className={c.value ? "text-slate-300" : "text-slate-400"}>{c.label}</span>
              </div>
            ))}
          </div>
          {qc.notes && (
            <p className="text-[11px] text-slate-500 pt-1 border-t border-white/5">{qc.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Missing Inputs ───────────────────────────────────────────────────────────

function MissingInputs({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3">
      <Info className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-slate-400 mb-1.5">Would improve with:</p>
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-slate-500">· {item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const EMAIL_KEYS = ["email_1", "follow_up_1", "follow_up_2", "break_up_email"] as const;
type EmailKey = typeof EMAIL_KEYS[number];

export default function ColdEmailPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [markets, setMarkets] = useState<TargetMarket[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("");
  const [draft, setDraft] = useState<ColdEmailDraft | null>(null);

  // Editable email content
  const [emails, setEmails] = useState<Partial<Record<EmailKey, ColdEmail>>>({});
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState(0);

  // Push state
  const [campaignName, setCampaignName] = useState("");
  const [pushing, setPushing] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isComplete = draft?.status === "COMPLETE" && draft.email_1;

  // Load project data + existing draft
  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        const project = data.project;
        if (!project) return;
        setCompanyName(project.companyProfile?.name ?? "Campaign");
        const tmStep = project.steps?.find(
          (s: { stepName: string; status: string }) =>
            s.stepName === "TARGET_MARKETS" && (s.status === "COMPLETE" || s.status === "AWAITING_APPROVAL")
        );
        if (tmStep?.output?.markets) setMarkets(tmStep.output.markets);
      })
      .catch(() => {});

    fetch(`/api/projects/${projectId}/cold-email`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.draft) return;
        const d = data.draft as ColdEmailDraft;
        setDraft(d);
        if (d.status === "COMPLETE" && d.email_1) {
          initEmailsFromDraft(d);
          setSelectedMarket(d.targetMarketName);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  function initEmailsFromDraft(d: ColdEmailDraft) {
    const next: Partial<Record<EmailKey, ColdEmail>> = {};
    for (const key of EMAIL_KEYS) {
      const val = d[key as keyof ColdEmailDraft] as ColdEmail | undefined;
      if (val) next[key] = val;
    }
    setEmails(next);
    // Campaign name is set by the auto-update effect once companyName resolves
  }

  // Auto-update campaign name whenever we have all the pieces.
  // Deliberately no !isComplete guard — companyName arrives async (separate fetch)
  // so we need this to fire even after draft is already loaded.
  useEffect(() => {
    if (companyName && selectedMarket) {
      setCampaignName(`${companyName} — ${selectedMarket} Sequence`);
    }
  }, [companyName, selectedMarket]);

  // Polling
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
        if (d.status === "COMPLETE" && d.email_1) {
          initEmailsFromDraft(d);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.status, projectId]);

  const handleGenerate = useCallback(async () => {
    if (!selectedMarket) { toast.warning("Select a target market first."); return; }
    setEmails({});
    setSelectedSubjectIdx(0);
    setDraft({ status: "PENDING", targetMarketName: selectedMarket, startedAt: new Date().toISOString() });
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
    const subjectForEmail1 = draft?.subject_lines?.[selectedSubjectIdx]?.text ?? emails.email_1?.subject ?? "";
    const steps = EMAIL_KEYS
      .map((key) => emails[key])
      .filter((e): e is ColdEmail => !!e)
      .map((e, i) => ({
        subject: i === 0 ? subjectForEmail1 : e.subject,
        body: e.body,
        waitDays: e.waitDays,
      }));

    if (!steps.length) { toast.warning("No emails to push."); return; }
    setPushing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/cold-email/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName,
          targetMarketName: draft?.targetMarketName ?? selectedMarket,
          steps,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Failed to create campaign");
      toast.success(`Campaign "${campaignName}" created on Smartlead!`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPushing(false);
    }
  }, [campaignName, emails, selectedSubjectIdx, draft, selectedMarket, projectId]);

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
        <p className="text-slate-500 text-sm ml-10">
          Generate a 4-step sequence grounded in your GTM strategy, then push to Smartlead.
        </p>
      </div>

      {/* Generator card */}
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4">
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
            {generating ? "Generating…" : isComplete ? "Regenerate" : "Generate Sequence"}
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

        {draft?.status === "ERROR" && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs text-red-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            {draft.error ?? "Generation failed. Please try again."}
          </div>
        )}
      </div>

      {/* Results */}
      {isComplete && (
        <>
          {/* Strategy summary */}
          {(draft.strategy_summary || draft.campaign_brief) && (
            <div className="rounded-xl border border-white/10 bg-slate-900 p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Strategy</p>
              {draft.strategy_summary && (
                <p className="text-sm text-slate-300 leading-relaxed">{draft.strategy_summary}</p>
              )}
              {draft.campaign_brief && (
                <p className="text-xs text-slate-500 leading-relaxed">{draft.campaign_brief}</p>
              )}
            </div>
          )}

          {/* Subject line selector */}
          {draft.subject_lines && draft.subject_lines.length > 0 && (
            <SubjectLineSelector
              options={draft.subject_lines}
              selectedIdx={selectedSubjectIdx}
              onSelect={setSelectedSubjectIdx}
            />
          )}

          {/* Email editors */}
          <div className="space-y-4">
            {EMAIL_KEYS.map((key) => {
              const email = emails[key];
              if (!email) return null;
              return (
                <EmailEditor
                  key={key}
                  emailKey={key}
                  email={email}
                  onChange={(updated) => setEmails((prev) => ({ ...prev, [key]: updated }))}
                />
              );
            })}
          </div>

          {/* Quality check */}
          {draft.quality_check && <QualityCheckPanel qc={draft.quality_check} />}

          {/* Missing inputs */}
          {draft.missing_inputs && <MissingInputs items={draft.missing_inputs} />}

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
            <p className="text-xs text-slate-600">
              Creates the campaign with 4 sequence steps using the selected subject line for Email 1. No leads added.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
