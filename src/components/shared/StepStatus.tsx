import { Loader2 } from "lucide-react";

interface Props {
  stepLabel: string;
}

export function StepRunning({ stepLabel }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-violet-400 mb-4" />
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
        Building {stepLabel}...
      </h3>
      <p className="text-slate-400 text-sm">
        This may take 1–2 minutes. You can leave and come back.
      </p>
    </div>
  );
}

export function StepPending({ stepLabel }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-10 w-10 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 mb-4" />
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {stepLabel} not started yet
      </h3>
      <p className="text-slate-400 text-sm">
        Previous steps need to complete first.
      </p>
    </div>
  );
}
