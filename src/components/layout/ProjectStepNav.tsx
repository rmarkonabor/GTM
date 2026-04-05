"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Search, Target, Building2, Users, BarChart3, TrendingUp,
  Swords, Lightbulb, MessageSquare, CheckCircle2, Loader2, Circle, AlertCircle,
  ChevronLeft, Clock
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

const STEPS = [
  { key: "RESEARCH", label: "Research", icon: Search, path: "research" },
  { key: "TARGET_MARKETS", label: "Target Markets", icon: Target, path: "target-markets" },
  { key: "INDUSTRY_PRIORITY", label: "Industry Priority", icon: Building2, path: "industry-priority" },
  { key: "ICP", label: "ICP", icon: Users, path: "icp" },
  { key: "SEGMENTATION", label: "Segmentation", icon: BarChart3, path: "segmentation" },
  { key: "MARKET_SIZING", label: "Market Sizing", icon: TrendingUp, path: "market-sizing" },
  { key: "COMPETITIVE", label: "Competitive", icon: Swords, path: "competitive-analysis" },
  { key: "POSITIONING", label: "Positioning", icon: Lightbulb, path: "positioning" },
  { key: "MANIFESTO", label: "Manifesto", icon: MessageSquare, path: "manifesto" },
];

function StepStatusIcon({ status }: { status: string }) {
  if (status === "COMPLETE") return <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />;
  if (status === "RUNNING") return <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin shrink-0" />;
  if (status === "ERROR") return <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />;
  if (status === "AWAITING_APPROVAL") return <Clock className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
  return <Circle className="h-3.5 w-3.5 text-slate-600 shrink-0" />;
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
      <nav className="flex-1 p-3 space-y-0.5">
        {STEPS.map((step) => {
          const status = stepMap[step.key] ?? "PENDING";
          const href = `/projects/${project.id}/${step.path}`;
          const isActive = pathname === href;

          return (
            <Link key={step.key} href={href}>
              <div
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                  isActive
                    ? "bg-violet-600/20 text-violet-300"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <step.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate">{step.label}</span>
                <StepStatusIcon status={status} />
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
