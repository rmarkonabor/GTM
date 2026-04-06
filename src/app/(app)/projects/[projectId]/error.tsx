"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ProjectError]", error);
  }, [error]);

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-start gap-3 bg-red-900/20 border border-red-800 rounded-xl p-5 mb-4">
        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-red-300">Something went wrong</p>
          <p className="text-sm text-red-400 mt-1">
            {error.message || "An unexpected error occurred loading this project."}
          </p>
          {error.digest && (
            <p className="text-xs text-red-400 mt-1">Error ID: {error.digest}</p>
          )}
        </div>
      </div>
      <Button onClick={reset} className="bg-violet-600 hover:bg-violet-700 text-white">
        Try Again
      </Button>
    </div>
  );
}
