import { Target, Mail } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <Mail className="h-12 w-12 text-violet-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Check your email</h1>
        <p className="text-slate-400">
          We sent you a sign-in link. Click it to continue — the link expires in 24 hours.
        </p>
      </div>
    </div>
  );
}
