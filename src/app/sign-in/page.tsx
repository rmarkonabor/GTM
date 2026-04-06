"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Target, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const result = await signIn("email", {
        email,
        callbackUrl: "/dashboard",
        redirect: false,
      });
      if (result?.error) {
        toast.error("Failed to send sign-in link. Please try again.");
      } else {
        toast.success("Sign-in link sent! Check your email.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Target className="h-10 w-10 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sign in to NABOR AI</h1>
          <p className="text-slate-400 mt-2 text-sm">Build your go-to-market strategy</p>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-xl p-8 space-y-4">
          {/* Google */}
          <Button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10 gap-2"
          >
            <Globe className="h-4 w-4" />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">or</span>
            </div>
          </div>

          {/* Email */}
          <form onSubmit={handleEmail} className="space-y-3">
            <div>
              <Label className="text-slate-300 text-sm" htmlFor="email">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 bg-slate-800 border-white/20 text-white placeholder:text-slate-500"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
            >
              <Mail className="h-4 w-4" />
              {loading ? "Sending link..." : "Continue with Email"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
