"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Globe, CheckCircle2, Clock, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  RESEARCHING: { label: "Researching", icon: Loader2, color: "bg-blue-500/10 text-blue-400" },
  CLARIFYING: { label: "Clarifying", icon: Clock, color: "bg-yellow-500/10 text-yellow-400" },
  IN_PROGRESS: { label: "In Progress", icon: Loader2, color: "bg-violet-500/10 text-violet-400" },
  COMPLETE: { label: "Complete", icon: CheckCircle2, color: "bg-green-500/10 text-green-400" },
  ERROR: { label: "Error", icon: AlertCircle, color: "bg-red-500/10 text-red-400" },
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .finally(() => setLoading(false));
  }, []);

  const completedSteps = (p: Project) =>
    p.steps.filter((s) => s.status === "COMPLETE").length;

  const deleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.preventDefault();
    const confirmed = window.confirm(`Delete project "${projectName}"? This cannot be undone.`);
    if (!confirmed) return;
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data?.error?.message ?? "Failed to delete project. Please try again.");
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your GTM Projects</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Each project is a complete go-to-market strategy for a product.
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl">
          <Globe className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
            No projects yet
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            Start by entering your website URL to generate your first GTM strategy.
          </p>
          <Link href="/projects/new">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              Create first project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => {
            const statusCfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.RESEARCHING;
            const Icon = statusCfg.icon;
            return (
              <div key={project.id} className="group relative">
                <Link href={`/projects/${project.id}`}>
                  <div className="border border-slate-200 dark:border-white/10 rounded-xl p-5 hover:border-violet-400/50 hover:shadow-sm transition-all bg-white dark:bg-slate-900 cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 pr-8">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                          {project.name}
                        </h3>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {project.websiteUrl}
                        </p>
                      </div>
                      <Badge className={`ml-2 shrink-0 gap-1 ${statusCfg.color}`}>
                        <Icon className={`h-3 w-3 ${project.status === "IN_PROGRESS" ? "animate-spin" : ""}`} />
                        {statusCfg.label}
                      </Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                        <span>Steps completed</span>
                        <span>{completedSteps(project)}/9</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full transition-all"
                          style={{ width: `${(completedSteps(project) / 9) * 100}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-3">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>

                {/* Delete button — outside <Link> to avoid navigation interference */}
                <button
                  onClick={(e) => deleteProject(e, project.id, project.name)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                  title="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
