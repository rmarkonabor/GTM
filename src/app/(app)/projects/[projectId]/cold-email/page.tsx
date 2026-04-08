"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ColdEmailIndexPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function redirect() {
      try {
        const res = await fetch(`/api/projects/${projectId}/campaigns`);
        if (res.ok) {
          const data = await res.json();
          if (data.campaigns?.length > 0) {
            router.replace(`/projects/${projectId}/cold-email/${data.campaigns[0].id}`);
            return;
          }
        }
      } finally {
        setLoading(false);
      }
    }
    redirect();
  }, [projectId, router]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled Campaign" }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/projects/${projectId}/cold-email/${data.campaign.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800">
        <Mail className="h-6 w-6 text-slate-400" />
      </div>
      <div className="text-center">
        <p className="text-white font-semibold mb-1">No sequences yet</p>
        <p className="text-slate-400 text-sm">Create your first cold email campaign to get started.</p>
      </div>
      <Button onClick={handleCreate} disabled={creating} className="gap-2">
        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Create Campaign
      </Button>
    </div>
  );
}
