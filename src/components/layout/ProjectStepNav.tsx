"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Search, Target, Building2, Users, BarChart3, LayoutDashboard,
  Swords, MessageSquare, CheckCircle2, Loader2, Circle, AlertCircle,
  ChevronLeft, Clock, Mail, Plus, Send
} from "lucide-react";

interface ProjectStep {
  stepName: string;
  status: string;
}

interface Project {
  id: string;
  name: string | null;
  websiteUrl: string;
  steps: ProjectStep[];
}

const STRATEGY_STEPS = [
  { key: "RESEARCH", label: "Research", icon: Search, path: "research" },
  { key: "INDUSTRY_PRIORITY", label: "Industry Priority", icon: Building2, path: "industry-priority" },
  { key: "TARGET_MARKETS", label: "Target Markets", icon: Target, path: "target-markets" },
  { key: "ICP", label: "ICP", icon: Users, path: "icp" },
  { key: "COMPETITIVE", label: "Competitor Analysis", icon: Swords, path: "competitive-analysis" },
  { key: "SEGMENTATION", label: "Segments & Positioning", icon: BarChart3, path: "segmentation" },
  { key: "MANIFESTO", label: "Manifesto", icon: MessageSquare, path: "manifesto" },
];

function StepStatusIcon({ status }: { status: string }) {
  if (status === "COMPLETE") return <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />;
  if (status === "RUNNING") return <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin shrink-0" />;
  if (status === "ERROR") return <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />;
  if (status === "AWAITING_APPROVAL") return <Clock className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
  return <Circle className="h-3.5 w-3.5 text-slate-600 shrink-0" />;
}

function StepLink({ href, isActive, icon: Icon, label, status }: {
  href: string; isActive: boolean; icon: React.ComponentType<{ className?: string }>;
  label: string; status?: string;
}) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
          isActive
            ? "bg-violet-600/20 text-violet-300"
            : "text-slate-400 hover:text-white hover:bg-white/5"
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 truncate">{label}</span>
        {status && <StepStatusIcon status={status} />}
      </div>
    </Link>
  );
}

interface Campaign {
  id: string;
  name: string;
  smartleadId: number | null;
  pushedAt: string | null;
}

function CampaignSection({ projectId, pathname }: { projectId: string; pathname: string }) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creating, setCreating] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/campaigns`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns ?? []);
      }
    } catch {
      // silently ignore
    }
  }, [projectId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns, pathname]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled Campaign" }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchCampaigns();
        router.push(`/projects/${projectId}/cold-email/${data.campaign.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Cold Email</p>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
          title="New Campaign"
        >
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </button>
      </div>
      {campaigns.length === 0 ? (
        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
        >
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span>New campaign…</span>
        </button>
      ) : (
        campaigns.map((c) => {
          const href = `/projects/${projectId}/cold-email/${c.id}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link key={c.id} href={href}>
              <div
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                  isActive
                    ? "bg-violet-600/20 text-violet-300"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate">{c.name}</span>
                {c.pushedAt && <Send className="h-3 w-3 text-green-400 shrink-0" />}
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}

export function ProjectStepNav({ project }: { project: Project }) {
  const pathname = usePathname();
  const stepMap = Object.fromEntries(project.steps.map((s) => [s.stepName, s.status]));

  return (
    <aside className="w-52 border-r border-white/10 bg-slate-900/50 flex flex-col">
      {/* Back + project name */}
      <div className="p-4 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-3">
          <ChevronLeft className="h-3.5 w-3.5" />
          All Projects
        </Link>
        <p className="text-sm font-semibold text-white truncate">{project.name ?? project.websiteUrl}</p>
        <p className="text-xs text-slate-400 truncate">{project.websiteUrl}</p>
      </div>

      {/* Steps */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {/* Dashboard */}
        <div className="mb-2 pb-2 border-b border-white/5">
          <StepLink
            href={`/projects/${project.id}/dashboard`}
            isActive={pathname === `/projects/${project.id}/dashboard`}
            icon={LayoutDashboard}
            label="Dashboard"
          />
        </div>

        {/* GTM Strategy group */}
        <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          GTM Strategy
        </p>
        {STRATEGY_STEPS.map((step) => (
          <StepLink
            key={step.key}
            href={`/projects/${project.id}/${step.path}`}
            isActive={pathname === `/projects/${project.id}/${step.path}`}
            icon={step.icon}
            label={step.label}
            status={stepMap[step.key] ?? "PENDING"}
          />
        ))}

        {/* Cold Email section */}
        <div className="border-t border-white/5 mt-2">
          <CampaignSection projectId={project.id} pathname={pathname} />
        </div>

      </nav>
    </aside>
  );
}
