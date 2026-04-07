"use client";

import { use, useEffect, useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { DashboardContent, DashboardProject } from "@/components/dashboard/DashboardContent";

export default function PublicSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [project, setProject] = useState<DashboardProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/share/${token}`, { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error?.message ?? "Not found");
        setProject(data.project);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-4">
        <div className="h-16 w-16 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center mb-6">
          <ExternalLink className="h-7 w-7 text-slate-500" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Link Not Found</h1>
        <p className="text-slate-400 text-sm max-w-xs">
          This share link is invalid or has been revoked by the project owner.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">NABOR AI</span>
            <span className="text-xs text-slate-500">Shared Strategy</span>
          </div>
          <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-1 rounded-full">Read-only</span>
        </div>
      </div>

      <div className="px-4 py-8">
        <DashboardContent project={project} readOnly />
      </div>
    </div>
  );
}
