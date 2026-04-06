"use client";

import { useState } from "react";
import { Plus, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Props {
  projectId: string;
  stepName: "INDUSTRY_PRIORITY" | "TARGET_MARKETS";
  label: string;           // e.g. "industry" or "market"
  placeholder: string;     // e.g. "e.g. Legal Tech, EdTech"
  onExpanded: () => Promise<void>;
}

export function ExpandPanel({ projectId, stepName, label, placeholder, onExpanded }: Props) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [staged, setStaged] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const addItem = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    // Allow comma-separated input
    const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    const unique = parts.filter((p) => !staged.includes(p));
    if (unique.length > 0) setStaged((prev) => [...prev, ...unique]);
    setInputValue("");
  };

  const removeItem = (item: string) => {
    setStaged((prev) => prev.filter((s) => s !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addItem(); }
  };

  const handleGenerate = async () => {
    if (staged.length === 0) return;
    setRunning(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/steps/${stepName}/expand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: staged }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Failed to expand");
      toast.success(`${staged.length} new ${label}${staged.length > 1 ? "s" : ""} added successfully.`);
      setStaged([]);
      setOpen(false);
      await onExpanded();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRunning(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs text-slate-400 hover:text-violet-300 transition-colors mt-2"
      >
        <Plus className="h-3.5 w-3.5" />
        Add more {label}s
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium text-violet-300">Add more {label}s</span>
        </div>
        <button onClick={() => { setOpen(false); setStaged([]); setInputValue(""); }} className="text-slate-500 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-xs text-slate-400">
        Type a {label} name and press Enter (or comma-separate multiple). AI will generate full details for each.
      </p>

      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={running}
          className="dark:bg-slate-800 dark:border-white/20 dark:text-white text-sm"
        />
        <Button
          variant="outline"
          onClick={addItem}
          disabled={!inputValue.trim() || running}
          className="border-white/20 text-slate-300 hover:text-white shrink-0"
        >
          Add
        </Button>
      </div>

      {staged.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Queued ({staged.length})</p>
          <div className="flex flex-wrap gap-2">
            {staged.map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs px-2.5 py-1 rounded-full"
              >
                {item}
                <button onClick={() => removeItem(item)} disabled={running} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={running}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2 mt-1"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {running ? `Generating ${staged.length} ${label}${staged.length > 1 ? "s" : ""}…` : `Generate ${staged.length} ${label}${staged.length > 1 ? "s" : ""}`}
          </Button>
        </div>
      )}
    </div>
  );
}
