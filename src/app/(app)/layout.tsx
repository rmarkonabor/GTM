import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error("[AppLayout] getServerSession failed:", err);
    throw new Error(`Auth error: ${(err as Error).message}`);
  }
  if (!session) redirect("/sign-in");

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <AppSidebar user={session.user} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
