import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  code: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ code, message, onRetry }: Props) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-red-500/25 bg-gradient-to-br from-red-950/50 via-red-900/20 to-slate-900 p-5 shadow-xl shadow-red-950/20">
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-red-500/10 blur-2xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-20 w-20 rounded-full bg-red-600/5 blur-2xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Icon block */}
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/15 border border-red-500/25 shadow-sm shadow-red-950/30">
          <AlertTriangle className="h-5 w-5 text-red-400" strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <p className="text-sm font-semibold text-red-300 tracking-wide">
              Step Failed
            </p>
            <code className="inline-flex items-center rounded-md border border-red-500/25 bg-red-500/10 px-2 py-0.5 font-mono text-xs font-medium text-red-400 tracking-wider">
              {code}
            </code>
          </div>
          <p className="text-sm text-red-300/70 leading-relaxed">{message}</p>
        </div>

        {/* Retry button */}
        {onRetry && (
          <Button
            size="default"
            onClick={onRetry}
            className="shrink-0 gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/35 hover:border-red-500/60 text-red-300 hover:text-red-100 transition-all duration-200 shadow-sm shadow-red-950/30 font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
