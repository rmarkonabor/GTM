"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { ErrorDisplay } from "./ErrorDisplay";
import { StepRunning, StepPending } from "./StepStatus";

interface StepData {
  status: string;
  output: unknown;
  errorCode?: string;
  errorMsg?: string;
}

interface Props {
  projectId: string;
  stepName: string;
  stepLabel: string;
  children: (output: unknown) => React.ReactNode;
}

export function StepPageWrapper({ projectId, stepName, stepLabel, children }: Props) {
  const [step, setStep] = useState<StepData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStep = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`);
    const data = await res.json();
    const found = data.project?.steps?.find((s: { stepName: string }) => s.stepName === stepName);
    setStep(found ?? null);
    setLoading(false);
  }, [projectId, stepName]);

  useEffect(() => {
    fetchStep();
    // Poll while running
    const interval = setInterval(async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      const found = data.project?.steps?.find((s: { stepName: string }) => s.stepName === stepName);
      if (found) {
        setStep(found);
        if (found.status !== "RUNNING") clearInterval(interval);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [projectId, stepName, fetchStep]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!step || step.status === "PENDING") return <StepPending stepLabel={stepLabel} />;
  if (step.status === "RUNNING") return <StepRunning stepLabel={stepLabel} />;
  if (step.status === "ERROR") {
    return (
      <ErrorDisplay
        code={step.errorCode ?? "UNKNOWN_ERROR"}
        message={step.errorMsg ?? "An unexpected error occurred."}
      />
    );
  }
  if (!step.output) return <StepPending stepLabel={stepLabel} />;

  return <>{children(step.output)}</>;
}
