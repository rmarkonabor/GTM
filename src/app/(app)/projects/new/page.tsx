"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Globe, ArrowRight, Loader2, Target } from "lucide-react";

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
      // Immediately redirect — project page handles research + questions
      router.push(`/projects/${data.project.id}`);
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-5 w-5 text-violet-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New GTM Project</h1>
        </div>
        <p className="text-slate-500 text-sm">Enter your website URL and AI will build your complete GTM strategy.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6 space-y-4">
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

        <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {loading ? "Creating project..." : "Start GTM Analysis"}
        </Button>
      </form>
    </div>
  );
}
