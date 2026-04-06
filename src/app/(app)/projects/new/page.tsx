"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Globe, ArrowRight, Loader2, Building2, Users, BarChart3 } from "lucide-react";

const FEATURES = [
  { icon: Building2, title: "Industry & ICP", desc: "Ranked industries and ideal customer profiles with firmographic filters" },
  { icon: Users,     title: "Segments & Positioning", desc: "Per-segment messaging hooks, pain points, and proof points" },
  { icon: BarChart3, title: "Competitive Edge", desc: "Where you win vs. competitors, and your brand manifesto" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: url, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Failed to create project");
      router.push(`/projects/${data.project.id}`);
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Hero section with gradient card */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/50 via-slate-900 to-slate-900 px-7 py-8">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-8 bottom-0 h-28 w-28 rounded-full bg-purple-500/10 blur-2xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            AI-powered strategy
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
            Build your go-to-market strategy<br />
            <span className="text-violet-400">in minutes, not months</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Enter your website URL — AI will analyze your product and generate a complete go-to-market strategy tailored to your business.
          </p>
        </div>

        {/* Feature bullets inside hero */}
        <div className="relative mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-white/8 bg-white/4 p-3.5 backdrop-blur-sm">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
                <f.icon className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <p className="text-xs font-semibold text-slate-200 mb-0.5">{f.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-white/10 rounded-xl p-6 space-y-5 shadow-xl shadow-slate-950/50">
        <div>
          <Label className="text-sm font-medium text-slate-300 mb-1 block">
            Website URL <span className="text-red-400">*</span>
          </Label>
          <p className="text-xs text-slate-500 mb-2">We&apos;ll scrape your site to understand your product and positioning.</p>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              type="url"
              placeholder="https://yourcompany.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-9 bg-slate-800 border-white/15 text-white placeholder:text-slate-600 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50 transition-all duration-200"
              required
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-300 mb-1 block">
            Project name <span className="text-slate-600 font-normal">(optional)</span>
          </Label>
          <p className="text-xs text-slate-500 mb-2">Leave blank to auto-detect from your URL.</p>
          <Input
            placeholder="e.g. Acme Corp — Q3 Launch"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-800 border-white/15 text-white placeholder:text-slate-600 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50 transition-all duration-200"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !url}
          className="group w-full bg-violet-600 hover:bg-violet-500 text-white gap-2 py-5 text-sm font-semibold shadow-lg shadow-violet-900/30 transition-all duration-200 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing website…
            </>
          ) : (
            <>
              Start Analysis
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
