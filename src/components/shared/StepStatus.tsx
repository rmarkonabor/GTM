"use client";

import { useState } from "react";
import { Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  stepLabel: string;
  onStop?: () => Promise<void>;
}

export function StepRunning({ stepLabel, onStop }: Props) {
  const [stopping, setStopping] = useState(false);

  const handleStop = async () => {
    if (!onStop) return;
    setStopping(true);
    try {
      await onStop();
    } finally {
      setStopping(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center relative overflow-hidden">
      {/* Animated background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="h-48 w-48 rounded-full border border-violet-500/10 animate-ping"
          style={{ animationDuration: "2.5s" }}
        />
        <div
          className="absolute h-64 w-64 rounded-full border border-violet-500/5 animate-ping"
          style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}
        />
        <div
          className="absolute h-80 w-80 rounded-full border border-violet-500/5 animate-ping"
          style={{ animationDuration: "4.5s", animationDelay: "1s" }}
        />
      </div>

      {/* Central pulsing icon */}
      <div className="relative mb-6">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-500/10">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
        <div className="absolute inset-0 rounded-2xl bg-violet-500/20 blur-xl -z-10" />
      </div>

      <h3 className="text-lg font-semibold text-white mb-2 relative">
        Building your {stepLabel}…
      </h3>
      <p className="text-slate-400 text-sm max-w-xs relative leading-relaxed">
        Our AI is researching and crafting this section.
        <br />
        <span className="text-slate-500">Usually done in 1–2 minutes — feel free to step away.</span>
      </p>

      {/* Shimmer progress bar */}
      <div className="mt-6 w-48 h-1 rounded-full bg-slate-800 overflow-hidden relative">
        <div className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-violet-500 to-transparent animate-shimmer" />
      </div>

      {/* Stop button */}
      {onStop && (
        <Button
          variant="outline"
          onClick={handleStop}
          disabled={stopping}
          className="mt-6 border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/40 gap-2 relative"
        >
          {stopping ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Square className="h-3.5 w-3.5 fill-current" />
          )}
          {stopping ? "Stopping…" : "Stop"}
        </Button>
      )}
    </div>
  );
}

export function StepPending({ stepLabel }: { stepLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="h-16 w-16 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center shadow-lg">
          <svg
            className="h-7 w-7 text-slate-500"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
            <circle cx="12" cy="16" r="1.5" fill="currentColor" opacity="0.5" />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-2xl bg-slate-700/20 blur-lg -z-10" />
      </div>

      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        {stepLabel} is locked
      </h3>
      <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
        This step unlocks automatically once the
        <br />
        previous step is reviewed and approved.
      </p>

      <div className="mt-6 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-500/60" />
        <span className="h-1.5 w-1.5 rounded-full bg-violet-500/40" />
        <span className="h-1.5 w-5 rounded-full bg-slate-700" />
      </div>
    </div>
  );
}
