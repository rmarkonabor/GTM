"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Eye, EyeOff, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { resolveSpintax, countSpintaxBlocks, hasUnclosedBlocks } from "@/lib/email/spintax";
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
  onDelete,
  onUpdateVariants,
  onUpdateWaitDays,
}: {
  step: CampaignStep;
  isOnly: boolean;
  onDelete: () => void;
  onUpdateVariants: (variants: StepVariant[]) => void;
  onUpdateWaitDays: (days: number) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [preview, setPreview] = useState(false);

  const currentVariant = step.variants[activeIdx] ?? step.variants[0];
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
      } else {
        router.replace(`/projects/${projectId}/cold-email`);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, campaignId, router]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

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
      }
    } finally {
      setAddingStep(false);
    }
  }

  // ── Delete step ─────────────────────────────────────────────────────────

  async function handleDeleteStep(stepId: string) {
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
