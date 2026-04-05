"use client";

import { useSearchParams } from "next/navigation";
import { Target, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Server configuration error",
    description: "There is a problem with the server configuration. Please contact support.",
  },
  AccessDenied: {
    title: "Access denied",
    description: "You do not have permission to sign in.",
  },
  Verification: {
    title: "Link expired",
    description: "The sign-in link has expired or has already been used. Please request a new one.",
  },
  OAuthAccountNotLinked: {
    title: "Email already in use",
    description:
      "This email is already associated with a different sign-in method. Try signing in with your original method.",
  },
  OAuthCallback: {
    title: "Sign-in failed",
    description:
      "There was a problem signing in with Google. Make sure pop-ups aren't blocked and try again.",
  },
  Default: {
    title: "Sign-in error",
    description: "An unexpected error occurred. Please try again.",
  },
};

export default function AuthErrorPage() {
  const params = useSearchParams();
  const error = params.get("error") ?? "Default";
  const info = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Target className="h-10 w-10 text-violet-400" />
            <AlertCircle className="h-5 w-5 text-red-400 absolute -bottom-1 -right-1" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{info.title}</h1>
        <p className="text-slate-400 mb-6 text-sm leading-relaxed">{info.description}</p>
        {error !== "Default" && (
          <p className="text-xs text-slate-600 mb-6 font-mono">Error code: {error}</p>
        )}
        <Link href="/sign-in">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
            Back to sign in
          </Button>
        </Link>
      </div>
    </div>
  );
}
