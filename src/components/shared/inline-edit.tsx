"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus } from "lucide-react";

// Defensive: AI output may return non-strings; coerce before rendering
const s = (v: unknown): string =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : v == null ? "" : JSON.stringify(v);

// ─── EditableText ─────────────────────────────────────────────────────────────

export function EditableText({
  value,
  onSave,
  editMode,
  className = "",
  multiline = false,
}: {
  value: string;
  onSave: (v: string) => void;
  editMode: boolean;
  className?: string;
  multiline?: boolean;
}) {
  const safe = s(value);
  const [local, setLocal] = useState(safe);
  useEffect(() => setLocal(s(value)), [value]);

  if (!editMode) return <span className={className}>{safe}</span>;

  const commit = () => { if (local !== safe) onSave(local); };
  const base = `bg-transparent border-b border-slate-600 focus:border-violet-500 focus:outline-none w-full ${className}`;

  if (multiline) {
    return (
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        className={`${base} resize-none`}
        rows={Math.max(2, local.split("\n").length)}
      />
    );
  }
  return (
    <input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      className={base}
    />
  );
}

// ─── EditableChips ────────────────────────────────────────────────────────────

export function EditableChips({
  items,
  onSave,
  editMode,
  chipClass = "bg-slate-800 text-slate-300",
}: {
  items: string[];
  onSave: (items: string[]) => void;
  editMode: boolean;
  chipClass?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  const remove = (i: number) => onSave(items.filter((_, idx) => idx !== i));
  const add = () => {
    if (draft.trim()) onSave([...items, draft.trim()]);
    setDraft(""); setAdding(false);
  };

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span key={i} className={`inline-flex items-center gap-1 ${chipClass} px-2 py-0.5 rounded-full text-xs`}>
          {s(item)}
          {editMode && (
            <button onClick={() => remove(i)} className="text-slate-400 hover:text-red-400 ml-0.5">
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </span>
      ))}
      {editMode && (
        adding ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={add}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
              if (e.key === "Escape") { setAdding(false); setDraft(""); }
            }}
            placeholder="Add..."
            className="text-xs bg-slate-800 border border-violet-500/50 rounded-full px-2 py-0.5 focus:outline-none w-20"
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-0.5 text-xs text-slate-500 hover:text-violet-400 px-1.5 py-0.5 rounded-full border border-dashed border-slate-600 hover:border-violet-500"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        )
      )}
    </div>
  );
}

// ─── EditableList ─────────────────────────────────────────────────────────────

function EditableListItem({
  item, onSave, onRemove, editMode, dotColor, textClass,
}: {
  item: string; onSave: (v: string) => void; onRemove: () => void;
  editMode: boolean; dotColor: string; textClass: string;
}) {
  const safe = s(item);
  const [local, setLocal] = useState(safe);
  useEffect(() => setLocal(s(item)), [item]);

  return (
    <li className="flex items-start gap-1.5 group">
      <span className={`h-1 w-1 rounded-full ${dotColor} mt-1.5 shrink-0`} />
      {editMode ? (
        <input
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => { if (local !== safe) onSave(local); }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLElement).blur()}
          className={`${textClass} flex-1 bg-transparent border-b border-slate-600 focus:border-violet-500 focus:outline-none`}
        />
      ) : (
        <span className={`${textClass} flex-1`}>{safe}</span>
      )}
      {editMode && (
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity shrink-0"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </li>
  );
}

export function EditableList({
  items,
  onSave,
  editMode,
  dotColor = "bg-slate-400",
  textClass = "text-xs text-slate-400",
}: {
  items: string[];
  onSave: (items: string[]) => void;
  editMode: boolean;
  dotColor?: string;
  textClass?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  const removeAt = (i: number) => onSave(items.filter((_, idx) => idx !== i));
  const updateAt = (i: number, v: string) => onSave(items.map((item, idx) => idx === i ? v : item));
  const add = () => {
    if (draft.trim()) onSave([...items, draft.trim()]);
    setDraft(""); setAdding(false);
  };

  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <EditableListItem
          key={i}
          item={item}
          onSave={(v) => updateAt(i, v)}
          onRemove={() => removeAt(i)}
          editMode={editMode}
          dotColor={dotColor}
          textClass={textClass}
        />
      ))}
      {editMode && (
        adding ? (
          <li className="flex items-center gap-1.5">
            <span className={`h-1 w-1 rounded-full ${dotColor} mt-1.5 shrink-0`} />
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={add}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
                if (e.key === "Escape") { setAdding(false); setDraft(""); }
              }}
              placeholder="Type and press Enter..."
              className={`${textClass} flex-1 bg-transparent border-b border-violet-500 focus:outline-none`}
            />
          </li>
        ) : (
          <li>
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-400"
            >
              <Plus className="h-3 w-3" /> Add item
            </button>
          </li>
        )
      )}
    </ul>
  );
}
