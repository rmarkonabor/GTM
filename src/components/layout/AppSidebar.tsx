"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Plus, Settings, Target, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

const navItems = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
  { href: "/projects/new", icon: Plus,            label: "New Project" },
  { href: "/settings",     icon: Settings,        label: "Settings" },
];

export function AppSidebar({ user }: Props) {
  const pathname = usePathname();
  const initials = (user.name?.[0] ?? user.email?.[0] ?? "U").toUpperCase();

  return (
    <aside className="w-60 bg-slate-900 border-r border-white/10 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-900/40 shrink-0">
            <Target className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">GTM Planner</p>
            <p className="text-[10px] text-slate-500 leading-tight">AI-powered strategy</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-violet-600/20 text-violet-300"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-400 rounded-r-full" />
                )}
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md shadow-violet-900/30">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate leading-tight">{user.name ?? "User"}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-white/5 transition-all duration-150"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
