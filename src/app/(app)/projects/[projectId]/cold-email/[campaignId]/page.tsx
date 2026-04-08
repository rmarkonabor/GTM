"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Eye, EyeOff, Send, CheckCircle2, Wand2, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { resolveSpintax, countSpintaxBlocks, hasUnclosedBlocks } from "@/lib/email/spintax";
import { formatCost, formatTokens } from "@/lib/ai/pricing";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepVariant {
  id: string;
  subject: string;
  body: string;
}

interface CampaignStep {
  id: string;
  seq: number;
  waitDays: number;
  variants: StepVariant[];
}

interface Campaign {
  id: string;
  name: string;
  smartleadId: number | null;
  pushedAt: string | null;
  steps: CampaignStep[];
}

interface StrategyIndustry { idx: number; label: string; data: Record<string, unknown>; }
interface StrategyMarket   { id: string;  name: string;  data: Record<string, unknown>; }
interface StrategySegment  { id: string;  name: string;  data: Record<string, unknown>; }
interface StrategyData {
  industries: StrategyIndustry[];
  markets:    StrategyMarket[];
  segments:   StrategySegment[];
}

// ─── Strategy select helper ───────────────────────────────────────────────────

function StrategySelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string | number; name: string }[];
  value: string | number | null;
  onChange: (v: string | number | null) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-slate-500">{label}</p>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full bg-slate-800 border border-white/10 rounded text-xs text-slate-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500"
      >
        <option value="">— none —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Spintax badge ────────────────────────────────────────────────────────────

function SpintaxBadge({ text }: { text: string }) {
  const count = countSpintaxBlocks(text);
  const invalid = hasUnclosedBlocks(text);
  if (invalid) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-400">unclosed brace</span>;
  if (count === 0) return null;
  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-900/40 text-violet-400">{count} spintax</span>;
}

// ─── Wait days selector ───────────────────────────────────────────────────────

const WAIT_OPTIONS = [0, 1, 2, 3, 4, 5, 7, 10, 14, 21, 30];

function WaitSelector({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      className="bg-slate-800 border border-white/10 rounded-md text-xs text-slate-300 px-2 py-1 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-violet-500"
    >
      {WAIT_OPTIONS.map((d) => (
        <option key={d} value={d}>
          {d === 0 ? "Day 0 (immediate)" : `+${d} day${d === 1 ? "" : "s"}`}
        </option>
      ))}
    </select>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({
  step,
  isOnly,
  totalSteps,
  projectId,
  campaignId,
  strategy,
  onDelete,
  onUpdateVariants,
  onUpdateWaitDays,
}: {
  step: CampaignStep;
  isOnly: boolean;
  totalSteps: number;
  projectId: string;
  campaignId: string;
  strategy: StrategyData | null;
  onDelete: () => void;
  onUpdateVariants: (variants: StepVariant[]) => void;
  onUpdateWaitDays: (days: number) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [preview, setPreview] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selIndustry, setSelIndustry] = useState<number | null>(null);
  const [selMarket, setSelMarket] = useState<string | null>(null);
  const [selSegment, setSelSegment] = useState<string | null>(null);
  const [composePrompt, setComposePrompt] = useState("");
  const [includeProof, setIncludeProof] = useState(true);
  const [refineMode, setRefineMode] = useState(false);
  const [composing, setComposing] = useState(false);
  const [spintaxing, setSpintaxing] = useState(false);
  const [composeUsage, setComposeUsage] = useState<{ inputTokens: number; outputTokens: number; estimatedCostUsd: number; model: string } | null>(null);
  const [spintaxUsage, setSpintaxUsage] = useState<{ inputTokens: number; outputTokens: number; estimatedCostUsd: number; model: string } | null>(null);

  const currentVariant = step.variants[activeIdx] ?? step.variants[0];

  async function handleCompose() {
    if (refineMode && !currentVariant.subject && !currentVariant.body) {
      toast.error("Nothing to refine — write some copy first.");
      return;
    }
    setComposing(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/campaigns/${campaignId}/steps/${step.id}/compose`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            industryIdx: selIndustry,
            marketId: selMarket,
            segmentId: selSegment,
            prompt: composePrompt,
            includeProof,
            refineMode,
            existingSubject: refineMode ? currentVariant.subject : undefined,
            existingBody: refineMode ? currentVariant.body : undefined,
            seq: step.seq,
            totalSteps,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Failed to generate copy.");
        return;
      }
      const updated = step.variants.map((v, i) =>
        i === activeIdx ? { ...v, subject: data.subject, body: data.body } : v
      );
      onUpdateVariants(updated);
      if (data.usage) setComposeUsage(data.usage);
      toast.success("Email copy generated.");
    } catch {
      toast.error("Network error generating copy.");
    } finally {
      setComposing(false);
    }
  }

  async function handleSpintax() {
    const variant = step.variants[activeIdx] ?? step.variants[0];
    if (!variant?.subject.trim() && !variant?.body.trim()) {
      toast.error("Write some copy first before adding spintax.");
      return;
    }
    setSpintaxing(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/campaigns/${campaignId}/steps/${step.id}/spintax`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: variant.subject, body: variant.body }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Failed to generate spintax.");
        return;
      }
      const updated = step.variants.map((v, i) =>
        i === activeIdx ? { ...v, subject: data.subject, body: data.body } : v
      );
      onUpdateVariants(updated);
      if (data.usage) setSpintaxUsage(data.usage);
      toast.success("Spintax added.");
    } catch {
      toast.error("Network error generating spintax.");
    } finally {
      setSpintaxing(false);
    }
  }

  if (!currentVariant) return null;

  function setField(field: "subject" | "body", value: string) {
    const updated = step.variants.map((v, i) =>
      i === activeIdx ? { ...v, [field]: value } : v
    );
    onUpdateVariants(updated);
  }

  function addVariant() {
    if (step.variants.length >= 3) return;
    const letter = ["b", "c"][step.variants.length - 1];
    const newVariant: StepVariant = { id: letter, subject: "", body: "" };
    const updated = [...step.variants, newVariant];
    onUpdateVariants(updated);
    setActiveIdx(updated.length - 1);
  }

  function deleteVariant(idx: number) {
    if (step.variants.length <= 1) return;
    const updated = step.variants.filter((_, i) => i !== idx);
    onUpdateVariants(updated);
    setActiveIdx(Math.min(activeIdx, updated.length - 1));
  }

  const previewSubject = resolveSpintax(currentVariant.subject);
  const previewBody = resolveSpintax(currentVariant.body);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden">
      {/* Step header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <span className="text-xs font-semibold text-violet-400 bg-violet-900/30 px-2 py-0.5 rounded-full">
          Step {step.seq}
        </span>
        <WaitSelector
          value={step.waitDays}
          onChange={(days) => onUpdateWaitDays(days)}
          disabled={step.seq === 1}
        />
        <div className="flex-1" />
        <button
          onClick={handleSpintax}
          disabled={spintaxing}
          title="Generate spintax variations"
          className="text-slate-500 hover:text-violet-400 transition-colors disabled:opacity-40"
        >
          {spintaxing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />}
        </button>
        {spintaxUsage && !spintaxing && (
          <span className="text-[10px] text-slate-600 tabular-nums" title={`${spintaxUsage.inputTokens + spintaxUsage.outputTokens} tokens · ${spintaxUsage.model}`}>
            {formatCost(spintaxUsage.estimatedCostUsd)}
          </span>
        )}
        <button
          onClick={() => setComposerOpen((p) => !p)}
          title="AI Compose"
          className={cn(
            "transition-colors",
            composerOpen ? "text-violet-400" : "text-slate-500 hover:text-violet-400"
          )}
        >
          <Wand2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => setPreview((p) => !p)}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title={preview ? "Hide preview" : "Show preview"}
        >
          {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        {!isOnly && (
          <button
            onClick={onDelete}
            className="text-slate-600 hover:text-red-400 transition-colors"
            title="Delete step"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Variant tabs */}
      <div className="flex items-center gap-1 px-4 pt-3">
        {step.variants.map((v, i) => (
          <div key={v.id} className="flex items-center gap-1">
            <button
              onClick={() => setActiveIdx(i)}
              className={cn(
                "px-3 py-1 rounded-t text-xs font-medium transition-colors border-b-2",
                i === activeIdx
                  ? "text-violet-300 border-violet-500 bg-violet-900/20"
                  : "text-slate-500 border-transparent hover:text-slate-300"
              )}
            >
              Variant {String.fromCharCode(65 + i)}
            </button>
            {i === activeIdx && step.variants.length > 1 && (
              <button
                onClick={() => deleteVariant(i)}
                className="text-slate-600 hover:text-red-400 transition-colors mb-0.5"
                title="Remove variant"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        {step.variants.length < 3 && (
          <button
            onClick={addVariant}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-violet-400 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Variant
          </button>
        )}
      </div>

      {/* AI Composer panel */}
      {composerOpen && (
        <div className="mx-4 mb-3 mt-2 p-3 rounded-lg bg-slate-800/60 border border-violet-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest">AI Composer</p>
            <div className="flex items-center gap-1 p-0.5 bg-slate-900/60 rounded-md">
              <button
                onClick={() => setRefineMode(false)}
                className={cn(
                  "text-[10px] px-2.5 py-1 rounded transition-colors",
                  !refineMode
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-slate-300"
                )}
              >
                Fresh
              </button>
              <button
                onClick={() => setRefineMode(true)}
                className={cn(
                  "text-[10px] px-2.5 py-1 rounded transition-colors",
                  refineMode
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-slate-300"
                )}
              >
                Refine existing
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StrategySelect
              label="Industry"
              options={(strategy?.industries ?? []).map((i) => ({ id: i.idx, name: i.label }))}
              value={selIndustry}
              onChange={(v) => setSelIndustry(v !== null ? Number(v) : null)}
            />
            <StrategySelect
              label="Target Market"
              options={(strategy?.markets ?? []).map((m) => ({ id: m.id, name: m.name }))}
              value={selMarket}
              onChange={(v) => setSelMarket(v as string | null)}
            />
            <StrategySelect
              label="Segment"
              options={(strategy?.segments ?? []).map((s) => ({ id: s.id, name: s.name }))}
              value={selSegment}
              onChange={(v) => setSelSegment(v as string | null)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIncludeProof((p) => !p)}
              className={cn(
                "flex items-center gap-1.5 text-[10px] px-2 py-1 rounded border transition-colors",
                includeProof
                  ? "border-violet-500/50 text-violet-400 bg-violet-900/20"
                  : "border-white/10 text-slate-500 hover:text-slate-300"
              )}
            >
              <span>{includeProof ? "✓" : "○"}</span>
              Include proof point
            </button>
          </div>
          <textarea
            placeholder="Additional instructions (tone, length, specific points…)"
            value={composePrompt}
            onChange={(e) => setComposePrompt(e.target.value)}
            rows={2}
            className="w-full text-xs bg-slate-900/50 border border-white/10 rounded px-2 py-1.5 text-white resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <Button
            size="sm"
            onClick={handleCompose}
            disabled={composing}
            className="gap-2 w-full"
          >
            {composing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            {composing ? "Generating…" : "Generate Copy"}
          </Button>
          {composeUsage && !composing && (
            <p className="text-[10px] text-slate-500 text-center tabular-nums">
              {formatTokens(composeUsage.inputTokens + composeUsage.outputTokens)} tokens
              {" · "}{formatCost(composeUsage.estimatedCostUsd)}
              {" · "}<span className="text-slate-600">{composeUsage.model}</span>
            </p>
          )}
        </div>
      )}

      {/* Variant editor */}
      {!preview ? (
        <div className="px-4 pb-4 pt-2 space-y-3">
          {/* Subject */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400">Subject Line</label>
              <SpintaxBadge text={currentVariant.subject} />
            </div>
            <Input
              value={currentVariant.subject}
              onChange={(e) => setField("subject", e.target.value)}
              placeholder="Enter subject line…"
              className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-600"
            />
          </div>

          {/* Body */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400">Email Body</label>
              <SpintaxBadge text={currentVariant.body} />
            </div>
            <textarea
              value={currentVariant.body}
              onChange={(e) => setField("body", e.target.value)}
              placeholder="Write your email here. Use {OptionA|OptionB} for spintax…"
              rows={10}
              className="w-full rounded-md border border-white/10 bg-slate-800/50 px-3 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-y"
            />
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4 pt-2 space-y-3">
          <div className="text-xs text-slate-500 mb-2">Preview (spintax resolved to first variant)</div>
          <div className="space-y-1">
            <div className="text-xs text-slate-400 mb-1">Subject</div>
            <div className="bg-slate-800/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white">
              {previewSubject || <span className="text-slate-600 italic">No subject</span>}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-400 mb-1">Body</div>
            <div className="bg-slate-800/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-mono whitespace-pre-wrap min-h-[10rem]">
              {previewBody || <span className="text-slate-600 italic">No body</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CampaignEditorPage({
  params,
}: {
  params: Promise<{ projectId: string; campaignId: string }>;
}) {
  const { projectId, campaignId } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [addingStep, setAddingStep] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const nameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCampaign = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/campaigns/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data.campaign);
      } else if (res.status === 404) {
        router.replace(`/projects/${projectId}/cold-email`);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error?.message ?? "Failed to load campaign.");
      }
    } catch {
      toast.error("Network error — could not load campaign.");
    } finally {
      setLoading(false);
    }
  }, [projectId, campaignId, router]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  // Fetch GTM strategy data for AI composer dropdowns
  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.project?.steps) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const steps: any[] = data.project.steps;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ip = steps.find((s: any) => s.stepName === "INDUSTRY_PRIORITY");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tm = steps.find((s: any) => s.stepName === "TARGET_MARKETS");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sg = steps.find((s: any) => s.stepName === "SEGMENTATION");
        setStrategy({
          industries: (ip?.output?.industries ?? []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (ind: any, i: number) => ({
              idx: i,
              label: [ind.niche, ind.standardIndustry].filter(Boolean).join(" / ") || `Industry ${i + 1}`,
              data: ind,
            })
          ),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          markets: (tm?.output?.markets ?? []).map((m: any) => ({
            id: m.id ?? m.name,
            name: m.name,
            data: m,
          })),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          segments: (sg?.output?.segments ?? []).map((s: any) => ({
            id: s.id ?? s.name,
            name: s.estimatedPriority ? `${s.name} (${s.estimatedPriority})` : s.name,
            data: s,
          })),
        });
      })
      .catch(() => {});
  }, [projectId]);

  // ── Rename campaign ──────────────────────────────────────────────────────

  function handleNameChange(name: string) {
    setCampaign((prev) => prev ? { ...prev, name } : prev);
    if (nameTimer.current) clearTimeout(nameTimer.current);
    nameTimer.current = setTimeout(async () => {
      await fetch(`/api/projects/${projectId}/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    }, 800);
  }

  // ── Update step (debounced) ──────────────────────────────────────────────

  function scheduleStepSave(stepId: string, data: { waitDays?: number; variants?: StepVariant[] }) {
    clearTimeout(saveTimers.current[stepId]);
    saveTimers.current[stepId] = setTimeout(async () => {
      await fetch(`/api/projects/${projectId}/campaigns/${campaignId}/steps/${stepId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }, 800);
  }

  function handleUpdateVariants(stepId: string, variants: StepVariant[]) {
    setCampaign((prev) => {
      if (!prev) return prev;
      return { ...prev, steps: prev.steps.map((s) => s.id === stepId ? { ...s, variants } : s) };
    });
    scheduleStepSave(stepId, { variants });
  }

  function handleUpdateWaitDays(stepId: string, waitDays: number) {
    setCampaign((prev) => {
      if (!prev) return prev;
      return { ...prev, steps: prev.steps.map((s) => s.id === stepId ? { ...s, waitDays } : s) };
    });
    scheduleStepSave(stepId, { waitDays });
  }

  // ── Add step ────────────────────────────────────────────────────────────

  async function handleAddStep() {
    setAddingStep(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/campaigns/${campaignId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await fetchCampaign();
      } else {
        toast.error("Failed to add step.");
      }
    } catch {
      toast.error("Network error — could not add step.");
    } finally {
      setAddingStep(false);
    }
  }

  // ── Delete step ─────────────────────────────────────────────────────────

  async function handleDeleteStep(stepId: string) {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/campaigns/${campaignId}/steps/${stepId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setCampaign((prev) =>
          prev
            ? {
                ...prev,
                steps: prev.steps
                  .filter((s) => s.id !== stepId)
                  .map((s, i) => ({ ...s, seq: i + 1 })),
              }
            : prev
        );
      } else {
        toast.error("Failed to delete step.");
      }
    } catch {
      toast.error("Network error — could not delete step.");
    }
  }

  // ── Push to Smartlead ────────────────────────────────────────────────────

  async function handleConfirmPush() {
    setPushing(true);
    setConfirmOpen(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/campaigns/${campaignId}/push`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error?.message ?? "Failed to push to Smartlead.";
        toast.error(msg);
        return;
      }
      toast.success(campaign?.smartleadId ? "Campaign updated on Smartlead." : "Campaign pushed to Smartlead!");
      setCampaign((prev) =>
        prev ? { ...prev, smartleadId: data.smartleadId, pushedAt: data.pushedAt } : prev
      );
    } finally {
      setPushing(false);
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────

  const isPushed = !!campaign?.smartleadId;
  const pushLabel = isPushed ? "Update on Smartlead" : "Push to Smartlead";

  const totalVariants = campaign?.steps.reduce((sum, s) => sum + s.variants.length, 0) ?? 0;

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!campaign) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex-1 min-w-0">
          <Input
            value={campaign.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="text-xl font-bold bg-transparent border-transparent hover:border-white/10 focus:border-white/20 text-white px-0 h-auto py-1 focus:bg-slate-800/30"
          />
          {campaign.pushedAt && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Pushed {new Date(campaign.pushedAt).toLocaleDateString()}
            </div>
          )}
        </div>
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={pushing || campaign.steps.length === 0}
          className="gap-2 shrink-0"
          variant={isPushed ? "outline" : "default"}
        >
          {pushing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {pushLabel}
        </Button>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {campaign.steps.map((step, idx) => (
          <div key={step.id}>
            <StepCard
              step={step}
              isOnly={campaign.steps.length === 1}
              totalSteps={campaign.steps.length}
              projectId={projectId}
              campaignId={campaignId}
              strategy={strategy}
              onDelete={() => handleDeleteStep(step.id)}
              onUpdateVariants={(variants) => handleUpdateVariants(step.id, variants)}
              onUpdateWaitDays={(days) => handleUpdateWaitDays(step.id, days)}
            />
            {/* Add step between */}
            {idx < campaign.steps.length - 1 && (
              <div className="flex justify-center py-1">
                <div className="w-px h-4 bg-white/10" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add step button */}
      <div className="mt-4 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddStep}
          disabled={addingStep}
          className="gap-2 text-slate-500 hover:text-white"
        >
          {addingStep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add Step
        </Button>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{isPushed ? "Update on Smartlead" : "Push to Smartlead"}</DialogTitle>
            <DialogDescription>
              {isPushed
                ? "This will re-sync all steps to the existing Smartlead campaign, overwriting the current sequence."
                : "This will create a new campaign on Smartlead and upload all steps."}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-slate-800/50 border border-white/5 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Campaign</span>
              <span className="text-white font-medium truncate max-w-[60%] text-right">{campaign.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Steps</span>
              <span className="text-white">{campaign.steps.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total variants</span>
              <span className="text-white">{totalVariants}</span>
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleConfirmPush} disabled={pushing}>
              {pushing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isPushed ? "Update" : "Push"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
