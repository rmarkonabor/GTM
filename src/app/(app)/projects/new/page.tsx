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
  { icon: BarChart3, title: "Competitive Edge", desc: "Where you win vs. competitors, and your GTM manifesto" },
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
      {/* Hero */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
          AI-powered GTM strategy
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
          Build your GTM strategy<br />
          <span className="text-violet-400">in minutes, not months</span>
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Enter your website URL — AI will analyze your product and generate a complete go-to-market strategy tailored to your business.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-white/10 rounded-xl p-6 space-y-4 mb-6">
        <div>
          <Label className="text-sm font-medium text-slate-300 mb-1.5 block">
            Website URL <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              type="url"
              placeholder="https://yourcompany.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-9 bg-slate-800 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500/50 focus:ring-violet-500/20 transition-colors duration-200"
              required
            />
          </div>
          <p className="text-xs text-slate-600 mt-1.5">We&apos;ll scrape your site to understand your product and positioning.</p>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-300 mb-1.5 block">
            Project name <span className="text-slate-600 font-normal">(optional)</span>
          </Label>
          <Input
            placeholder="Auto-detected from your website"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-800 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500/50 focus:ring-violet-500/20 transition-colors duration-200"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !url}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white gap-2 py-5 text-sm font-semibold shadow-lg shadow-violet-900/30 transition-all duration-200 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing website…
            </>
          ) : (
            <>
              Start GTM Analysis
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Feature bullets */}
      <div className="grid grid-cols-1 gap-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/60 border border-white/5">
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <f.icon className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">{f.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
