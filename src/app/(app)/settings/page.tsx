"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Settings, Save, Sparkles, CheckCircle2 } from "lucide-react";

const LLM_PROVIDERS = [
  { value: "openai",    label: "OpenAI",             models: "Complex: gpt-4o · Simple: gpt-4o-mini" },
  { value: "anthropic", label: "Anthropic (Claude)",  models: "Complex: claude-opus-4-6 · Simple: claude-haiku-4-5" },
  { value: "google",    label: "Google Gemini",       models: "Complex: gemini-2.0-pro · Simple: gemini-2.0-flash" },
];

interface SettingsData {
  llm: { provider: string; configured: boolean } | null;
  smartlead: { configured: boolean } | null;
}

function KeyField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  configured,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  configured?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-sm text-slate-300">{label}</Label>
        {configured && !value && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Saved
          </span>
        )}
      </div>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          placeholder={configured && !value ? "Paste new key to replace" : (placeholder ?? "Paste key here")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10 font-mono text-sm bg-slate-800 border-white/15 text-white placeholder:text-slate-500 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingLlm, setSavingLlm] = useState(false);
  const [savingSl, setSavingSl] = useState(false);
  const [llmProvider, setLlmProvider] = useState("openai");
  const [llmConfigured, setLlmConfigured] = useState(false);
  const [llmKey, setLlmKey] = useState("");
  const [slConfigured, setSlConfigured] = useState(false);
  const [slKey, setSlKey] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: SettingsData) => {
        if (data.llm) {
          setLlmProvider(data.llm.provider);
          setLlmConfigured(data.llm.configured);
        }
        if (data.smartlead?.configured) {
          setSlConfigured(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const saveLlm = async () => {
    if (!llmKey && !llmConfigured) {
      toast.warning("Enter an API key to save.");
      return;
    }
    if (!llmKey && llmConfigured) {
      // No new key entered — only update provider if it changed
      // For now just show success (provider change requires new key validation server-side)
      toast.info("Enter a new API key to update, or leave blank to keep the current one.");
      return;
    }
    setSavingLlm(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ llm: { provider: llmProvider, apiKey: llmKey } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message);
      setLlmConfigured(true);
      setLlmKey("");
      toast.success("LLM settings saved.");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save settings.");
    } finally {
      setSavingLlm(false);
    }
  };

  const saveSmartlead = async () => {
    if (!slKey && !slConfigured) {
      toast.warning("Enter a Smartlead API key to save.");
      return;
    }
    if (!slKey && slConfigured) {
      toast.info("Enter a new API key to update.");
      return;
    }
    setSavingSl(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smartlead: { apiKey: slKey } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message);
      setSlConfigured(true);
      setSlKey("");
      toast.success("Smartlead API key saved.");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save settings.");
    } finally {
      setSavingSl(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="h-8 w-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
            <Settings className="h-4 w-4 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>
        <p className="text-slate-500 text-sm ml-10">API keys are encrypted at rest and never shared.</p>
      </div>

      <div className="space-y-6">
        {/* LLM Provider card */}
        <section className="bg-slate-900 border border-white/10 rounded-xl p-6 space-y-5 shadow-xl shadow-slate-950/50">
          <div className="flex items-center gap-2 pb-1 border-b border-white/8">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <h2 className="font-semibold text-white">LLM Provider</h2>
          </div>

          <div>
            <Label className="text-sm text-slate-300 mb-1.5 block">Provider</Label>
            <Select value={llmProvider} onValueChange={setLlmProvider}>
              <SelectTrigger className="bg-slate-800 border-white/15 text-white focus:ring-violet-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/15">
                {LLM_PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-white focus:bg-violet-600/20 focus:text-violet-300">
                    <div>
                      <p className="font-medium">{p.label}</p>
                      <p className="text-xs text-slate-400">{p.models}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <KeyField
            label="API Key"
            value={llmKey}
            onChange={setLlmKey}
            placeholder="sk-..."
            hint="Tiered routing automatically uses the best model for complex tasks (research, ICP, competitive) and a cheaper model for simple ones."
            configured={llmConfigured}
          />

          <Button
            onClick={saveLlm}
            disabled={savingLlm}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white gap-2 py-5 text-sm font-semibold shadow-lg shadow-violet-900/30 transition-all duration-200"
          >
            {savingLlm ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {savingLlm ? "Saving…" : "Save LLM Settings"}
          </Button>
        </section>

        {/* Smartlead card */}
        <section className="bg-slate-900 border border-white/10 rounded-xl p-6 space-y-5 shadow-xl shadow-slate-950/50">
          <div className="flex items-center gap-2 pb-1 border-b border-white/8">
            <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h2 className="font-semibold text-white">Smartlead</h2>
          </div>

          <KeyField
            label="API Key"
            value={slKey}
            onChange={setSlKey}
            placeholder="sl-..."
            hint="Used to create campaigns and email sequences from your GTM strategy. Find your API key in Smartlead → Settings → API."
            configured={slConfigured}
          />

          <Button
            onClick={saveSmartlead}
            disabled={savingSl}
            className="w-full bg-emerald-700 hover:bg-emerald-600 text-white gap-2 py-5 text-sm font-semibold shadow-lg shadow-emerald-900/30 transition-all duration-200"
          >
            {savingSl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {savingSl ? "Saving…" : "Save Smartlead Key"}
          </Button>
        </section>
      </div>
    </div>
  );
}
