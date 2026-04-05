"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Settings, Save } from "lucide-react";

const LLM_PROVIDERS = [
  { value: "openai", label: "OpenAI", models: "Complex: gpt-4o · Simple: gpt-4o-mini" },
  { value: "anthropic", label: "Anthropic (Claude)", models: "Complex: claude-opus-4-6 · Simple: claude-haiku-4-5" },
  { value: "google", label: "Google Gemini", models: "Complex: gemini-2.0-pro · Simple: gemini-2.0-flash" },
];

interface SettingsData {
  llm: { provider: string; apiKey: string } | null;
  apollo: string | null;
  clay: string | null;
}

function KeyField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <Label className="text-sm text-slate-700 dark:text-slate-300">{label}</Label>
      <div className="relative mt-1.5">
        <Input
          type={show ? "text" : "password"}
          placeholder={placeholder ?? "Paste key here"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10 font-mono text-sm dark:bg-slate-800 dark:border-white/20 dark:text-white"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [llmProvider, setLlmProvider] = useState("openai");
  const [llmKey, setLlmKey] = useState("");
  const [apolloKey, setApolloKey] = useState("");
  const [clayKey, setClayKey] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: SettingsData) => {
        if (data.llm) {
          setLlmProvider(data.llm.provider);
          setLlmKey(data.llm.apiKey);
        }
        if (data.apollo) setApolloKey(data.apollo);
        if (data.clay) setClayKey(data.clay);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (llmKey) body.llm = { provider: llmProvider, apiKey: llmKey };
      if (apolloKey) body.databases = { ...(body.databases as object ?? {}), apollo: { apiKey: apolloKey } };
      if (clayKey) body.databases = { ...(body.databases as object ?? {}), clay: { apiKey: clayKey } };

      if (!llmKey && !apolloKey && !clayKey) {
        toast.warning("Enter at least one API key to save.");
        return;
      }

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message);
      toast.success("Settings saved.");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading settings...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5 text-violet-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        </div>
        <p className="text-slate-500 text-sm">API keys are encrypted at rest and never shared.</p>
      </div>

      <div className="space-y-6">
        {/* LLM */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">LLM Provider</h2>
          <div>
            <Label className="text-sm text-slate-700 dark:text-slate-300">Provider</Label>
            <Select value={llmProvider} onValueChange={setLlmProvider}>
              <SelectTrigger className="mt-1.5 dark:bg-slate-800 dark:border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LLM_PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
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
            hint="Tiered routing uses the best model for complex tasks and a cheaper model for simple ones automatically."
          />
        </section>

        {/* Databases */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Market Sizing Databases</h2>
            <p className="text-xs text-slate-400 mt-1">Validates TAM/SAM/SOM against real company counts.</p>
          </div>
          <KeyField
            label="Apollo.io API Key"
            value={apolloKey}
            onChange={setApolloKey}
            placeholder="Apollo API key"
          />
          <KeyField
            label="Clay API Key"
            value={clayKey}
            onChange={setClayKey}
            placeholder="Clay API key"
          />
        </section>

        <Button
          onClick={save}
          disabled={saving}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
