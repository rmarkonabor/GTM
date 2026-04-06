"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Globe, CheckCircle2, Clock, AlertCircle, Loader2, Trash2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectStep {
  stepName: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  status: string;
  createdAt: string;
  steps: ProjectStep[];
}

const WORKFLOW_STEPS = ["INDUSTRY_PRIORITY", "TARGET_MARKETS", "ICP", "COMPETITIVE", "SEGMENTATION", "MANIFESTO"];
const TOTAL_STEPS = WORKFLOW_STEPS.length;

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string; spin?: boolean }> = {
  RESEARCHING: { label: "Researching", icon: Loader2,       className: "bg-blue-500/10 text-blue-400 border-blue-500/20", spin: true },
  CLARIFYING:  { label: "Clarifying",  icon: Clock,         className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  IN_PROGRESS: { label: "In Progress", icon: Loader2,       className: "bg-violet-500/10 text-violet-400 border-violet-500/20", spin: true },
  COMPLETE:    { label: "Complete",    icon: CheckCircle2,  className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  ERROR:       { label: "Error",       icon: AlertCircle,   className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .finally(() => setLoading(false));
  }, []);

  const completedSteps = (p: Project) =>
    p.steps.filter((s) => WORKFLOW_STEPS.includes(s.stepName) && s.status === "COMPLETE").length;

  const deleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${projectName}"? This cannot be undone.`)) return;
    setDeleting(projectId);
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data?.error?.message ?? "Failed to delete project.");
    }
    setDeleting(null);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Projects</h1>
          <p className="text-slate-400 mt-1 text-sm">Each project is a complete go-to-market strategy built by AI.</p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2 shadow-lg shadow-violet-900/30 transition-all duration-200">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border border-violet-500/20 flex items-center justify-center bg-violet-500/5">
                <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
              </div>
              <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-lg animate-pulse" />
            </div>
            <p className="text-sm text-slate-500">Loading your projects…</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="relative overflow-hidden flex flex-col items-center justify-center py-20 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/30 text-center">
          {/* Background orbs */}
          <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-violet-500/6 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-purple-500/6 blur-3xl" />

          <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/25 flex items-center justify-center mb-5 shadow-xl shadow-violet-900/20">
            <Sparkles className="h-7 w-7 text-violet-400" />
            <div className="absolute inset-0 rounded-2xl bg-violet-500/10 blur-md -z-10" />
          </div>

          <h3 className="font-bold text-white mb-2 text-xl">No projects yet</h3>
          <p className="text-slate-400 text-sm mb-6 text-center max-w-sm leading-relaxed px-4">
            Enter your website URL and AI will build your complete go-to-market strategy — from ICP to messaging — in minutes.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8 px-4">
            {["ICP & Personas", "Target Markets", "Competitive Analysis", "Manifesto"].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400"
              >
                <span className="h-1 w-1 rounded-full bg-violet-500" />
                {label}
              </span>
            ))}
          </div>

          <Link href="/projects/new">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2 shadow-lg shadow-violet-900/40 transition-all duration-200 group px-5">
              <Plus className="h-4 w-4" />
              Create your first project
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => {
            const cfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.IN_PROGRESS;
            const Icon = cfg.icon;
            const done = completedSteps(project);
            const pct = Math.round((done / TOTAL_STEPS) * 100);
            const isComplete = project.status === "COMPLETE";

            return (
              <div key={project.id} className="group relative">
                <Link href={`/projects/${project.id}${isComplete ? "/dashboard" : ""}`}>
                  <div className="relative overflow-hidden border border-white/10 rounded-xl bg-slate-900 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-900/20 transition-all duration-200 cursor-pointer">
                    {/* Left accent stripe */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl bg-gradient-to-b from-violet-500 to-violet-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    {/* Hover gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/0 to-purple-600/0 group-hover:from-violet-600/5 group-hover:to-purple-600/5 transition-all duration-300 pointer-events-none rounded-xl" />

                    <div className="relative p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="min-w-0 pr-6">
                          <h3 className="font-semibold text-white truncate leading-tight text-base">{project.name}</h3>
                          <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1">
                            <Globe className="h-3 w-3 shrink-0" />
                            {project.websiteUrl}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${cfg.className}`}>
                          <Icon className={`h-3 w-3 ${cfg.spin ? "animate-spin" : ""}`} />
                          {cfg.label}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-500">{done} of {TOTAL_STEPS} steps complete</span>
                          <span className={`font-semibold tabular-nums ${isComplete ? "text-emerald-400" : "text-slate-400"}`}>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isComplete
                                ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                                : "bg-gradient-to-r from-violet-700 to-violet-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {/* Step segment dots */}
                        <div className="flex gap-1 mt-1.5">
                          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                            <div
                              key={i}
                              className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${
                                i < done
                                  ? isComplete ? "bg-emerald-500/50" : "bg-violet-500/50"
                                  : "bg-slate-800"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(project.createdAt)}
                        </span>
                        <span className="text-xs text-violet-400/60 group-hover:text-violet-400 flex items-center gap-1 transition-colors duration-200">
                          {isComplete ? "View strategy" : "Continue"} <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => deleteProject(e, project.id, project.name)}
                  disabled={deleting === project.id}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-150 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 z-10"
                  title="Delete project"
                >
                  {deleting === project.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
