"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Link2, Check, Link2Off, Download, FileText, Printer } from "lucide-react";
import { DashboardContent, DashboardProject } from "@/components/dashboard/DashboardContent";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DashboardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<DashboardProject | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const fetchProject = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const r = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
      const d = await r.json();
      setProject(d.project);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [projectId]);

  // Fetch on mount — router.refresh() ensures server components also re-render fresh
  useEffect(() => {
    router.refresh();
    fetchProject();
  }, [projectId, fetchProject, router]);

  // Re-fetch when the tab regains focus (user switched away to edit a step)
  useEffect(() => {
    const onFocus = () => fetchProject();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchProject]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!project) return <p className="text-slate-400 p-8">Project not found.</p>;

  return (
    <DashboardContent
      project={project}
      heroExtra={
        <div className="flex items-center gap-1.5">
          <ExportButton projectId={projectId} />
          <ShareButton projectId={projectId} />
        </div>
      }
    />
  );
}

// ─── Share Button ──────────────────────────────────────────────────────────

function ShareButton({ projectId }: { projectId: string }) {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchShareStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/share`);
      const data = await res.json();
      setShareToken(data.shareToken ?? null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchShareStatus(); }, [fetchShareStatus]);

  const handleShare = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/share`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Failed to create share link");
      setShareToken(data.shareToken);
      const url = `${window.location.origin}/share/${data.shareToken}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleCopy = async () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/share/${shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/share`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke");
      setShareToken(null);
      toast.success("Share link revoked.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (loading) return null;

  if (shareToken) {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          onClick={handleCopy}
          variant="ghost"
          size="sm"
          className="bg-white/10 hover:bg-white/20 text-white text-xs gap-1.5 h-8 px-3"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
          {copied ? "Copied!" : "Copy Share Link"}
        </Button>
        <Button
          onClick={handleRevoke}
          variant="ghost"
          size="sm"
          className="bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-300 text-xs gap-1.5 h-8 px-2"
          title="Revoke share link"
        >
          <Link2Off className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleShare}
      variant="ghost"
      size="sm"
      className="bg-white/10 hover:bg-white/20 text-white text-xs gap-1.5 h-8 px-3"
    >
      <Link2 className="h-3.5 w-3.5" />
      Share
    </Button>
  );
}

// ─── Export Button ─────────────────────────────────────────────────────────

function ExportButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const handleMarkdown = async () => {
    setOpen(false);
    setDownloading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/export`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const cd = res.headers.get("content-disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      a.href = url;
      a.download = match?.[1] ?? "gtm-strategy.md";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePdf = () => {
    setOpen(false);
    window.open(`/export/${projectId}`, "_blank");
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <Button
        onClick={() => setOpen((o) => !o)}
        variant="ghost"
        size="sm"
        className="bg-white/10 hover:bg-white/20 text-white text-xs gap-1.5 h-8 px-3"
        disabled={downloading}
      >
        {downloading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        Export
      </Button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 50,
            minWidth: "180px",
          }}
          className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        >
          <button
            onClick={handleMarkdown}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
          >
            <FileText className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
            <div>
              <div className="font-medium">Download Markdown</div>
              <div className="text-slate-500 text-[10px]">Paste into Notion or Docs</div>
            </div>
          </button>
          <div className="border-t border-white/5" />
          <button
            onClick={handlePdf}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
          >
            <Printer className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
            <div>
              <div className="font-medium">Export PDF</div>
              <div className="text-slate-500 text-[10px]">Opens print dialog</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
