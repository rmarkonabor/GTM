"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Eye, EyeOff, Loader2, Settings } from "lucide-react";

const LLM_PROVIDERS = [
  { value: "openai", label: "OpenAI (GPT-4o)", models: "Complex: gpt-4o · Simple: gpt-4o-mini" },
  { value: "anthropic", label: "Anthropic (Claude)", models: "Complex: claude-opus-4-6 · Simple: claude-haiku-4-5" },
  { value: "google", label: "Google Gemini", models: "Complex: gemini-2.0-pro · Simple: gemini-2.0-flash" },
];

export default function SettingsPage() {
  const [llmProvider, setLlmProvider] = useState("openai");
  const [llmKey, setLlmKey] = useState("");
  const [apolloKey, setApolloKey] = useState("");
  const [clayKey, setClayKey] = useState("");
  const [showLlm, setShowLlm] = useState(false);
  const [showApollo, setShowApollo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingConfig, setExistingConfig] = useState<{
    hasLlm: boolean;
    hasApollo: boolean;
    hasClay: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setExistingConfig);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (llmKey) body.llm = { provider: llmProvider, apiKey: llmKey };
      if (apolloKey || clayKey) {
        body.databases = {
          ...(apolloKey ? { apollo: { apiKey: apolloKey } } : {}),
          ...(clayKey ? { clay: { apiKey: clayKey } } : {}),
        };
      }

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
      toast.success("Settings saved securely.");
      setLlmKey("");
      setApolloKey("");
      setClayKey("");
      // Refresh status
      const updated = await fetch("/api/settings").then((r) => r.json());
      setExistingConfig(updated);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5 text-violet-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        </div>
        <p className="text-slate-500 text-sm">
          API keys are encrypted and stored securely. They are never sent to the client.
        </p>
      </div>

      <div className="space-y-8">
        {/* LLM Section */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-white">LLM Provider</h2>
            {existingConfig?.hasLlm && (
              <span className="flex items-center gap-1.5 text-xs text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Configured
              </span>
            )}
          </div>

          <div className="space-y-4">
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

            <div>
              <Label className="text-sm text-slate-700 dark:text-slate-300">
                API Key {existingConfig?.hasLlm && "(leave blank to keep existing)"}
              </Label>
              <div className="relative mt-1.5">
                <Input
                  type={showLlm ? "text" : "password"}
                  placeholder="sk-..."
                  value={llmKey}
                  onChange={(e) => setLlmKey(e.target.value)}
                  className="pr-10 dark:bg-slate-800 dark:border-white/20 dark:text-white"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowLlm((v) => !v)}
                >
                  {showLlm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Smart tiered routing: complex tasks use the best model, simple tasks use a cheaper model automatically.
              </p>
            </div>
          </div>
        </section>

        {/* Databases Section */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">
            Market Sizing Databases
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Used to validate your ICP firmographics against real company data for accurate TAM/SAM/SOM.
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-slate-700 dark:text-slate-300">
                  Apollo.io API Key
                </Label>
                {existingConfig?.hasApollo && (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle2 className="h-3 w-3" /> Configured
                  </span>
                )}
              </div>
              <div className="relative mt-1.5">
                <Input
                  type={showApollo ? "text" : "password"}
                  placeholder="Apollo API key"
                  value={apolloKey}
                  onChange={(e) => setApolloKey(e.target.value)}
                  className="pr-10 dark:bg-slate-800 dark:border-white/20 dark:text-white"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  onClick={() => setShowApollo((v) => !v)}
                >
                  {showApollo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-slate-700 dark:text-slate-300">Clay API Key</Label>
                {existingConfig?.hasClay && (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle2 className="h-3 w-3" /> Configured
                  </span>
                )}
              </div>
              <Input
                type="password"
                placeholder="Clay API key"
                value={clayKey}
                onChange={(e) => setClayKey(e.target.value)}
                className="mt-1.5 dark:bg-slate-800 dark:border-white/20 dark:text-white"
              />
            </div>
          </div>
        </section>

        <Button
          onClick={save}
          disabled={saving}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
