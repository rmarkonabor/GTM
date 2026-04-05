"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Clock, RotateCcw, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Version {
  id: string;
  versionNum: number;
  output: unknown;
  prompt: string | null;
  createdAt: string;
}

interface Props {
  projectId: string;
  stepName: string;
  stepLabel: string;
  isOpen: boolean;
  onClose: () => void;
  onRestored: (downstreamReset: string[]) => void;
}

export function VersionHistory({ projectId, stepName, stepLabel, isOpen, onClose, onRestored }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/steps/${stepName}/versions`);
      const data = await res.json();
      setVersions(data.versions ?? []);
    } finally {
      setLoading(false);
    }
  }, [projectId, stepName]);

  useEffect(() => {
    if (isOpen) fetchVersions();
  }, [isOpen, fetchVersions]);

  const handleRestore = async (versionNum: number) => {
    setRestoring(versionNum);
    try {
      const res = await fetch(`/api/projects/${projectId}/steps/${stepName}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionNum }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Failed to restore");
      const downstream: string[] = data.downstreamReset ?? [];
      if (downstream.length > 0) {
        toast.info(`Restored v${versionNum}. ${downstream.length} downstream step(s) reset to pending.`);
      } else {
        toast.success(`Restored version ${versionNum}`);
      }
      onRestored(downstream);
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRestoring(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg h-full bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-400" />
            <h2 className="font-semibold text-white">{stepLabel} — Version History</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="text-slate-400 text-sm text-center py-8">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-8">No versions yet.</div>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="bg-slate-800 border border-white/10 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">Version {v.versionNum}</span>
                      {v.versionNum === versions[0]?.versionNum && (
                        <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">Latest</span>
                      )}
                    </div>
                    {v.prompt && (
                      <p className="text-xs text-slate-400 mt-0.5 italic">&quot;{v.prompt.slice(0, 60)}{v.prompt.length > 60 ? "..." : ""}&quot;</p>
                    )}
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(v.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedVersion(expandedVersion === v.versionNum ? null : v.versionNum)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      {expandedVersion === v.versionNum ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <Button
                      size="sm"
                      onClick={() => handleRestore(v.versionNum)}
                      disabled={restoring === v.versionNum}
                      className="bg-violet-600 hover:bg-violet-700 text-white h-7 text-xs gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      {restoring === v.versionNum ? "Restoring..." : "Restore"}
                    </Button>
                  </div>
                </div>
                {expandedVersion === v.versionNum && (
                  <div className="border-t border-white/10 p-4">
                    <pre className="text-xs text-slate-300 overflow-auto max-h-60 whitespace-pre-wrap">
                      {JSON.stringify(v.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Warning */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-300">Restoring a version will reset all downstream steps to pending and require re-approval.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
