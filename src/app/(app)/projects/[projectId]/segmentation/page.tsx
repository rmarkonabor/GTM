"use client";
import { use } from "react";
import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { EditableText, EditableChips, EditableList } from "@/components/shared/inline-edit";
import { Badge } from "@/components/ui/badge";
import { Globe, Building2, BarChart3, Trash2, Target, MessageSquare, Zap } from "lucide-react";

interface SegmentPositioning {
  keyPainPoints: string[];
  ourAngle: string;
  messagingHook: string;
  proofPoints: string[];
  ctaApproach: string;
}

interface Segment {
  id: string;
  name: string;
  sizeCategory: string;
  geographies: string[];
  industries: string[];
  estimatedPriority: string;
  rationale: string;
  positioning?: SegmentPositioning;
}

const PRIORITY_COLORS: Record<string, string> = {
  "tier-1": "bg-violet-500/10 text-violet-400",
  "tier-2": "bg-blue-500/10 text-blue-400",
  "tier-3": "bg-slate-500/10 text-slate-400",
};

const SIZE_COLORS: Record<string, string> = {
  enterprise: "bg-orange-500/10 text-orange-400",
  "mid-market": "bg-blue-500/10 text-blue-400",
  smb: "bg-green-500/10 text-green-400",
  startup: "bg-violet-500/10 text-violet-400",
};

export default function SegmentationPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Segments & Positioning</h1>
      <p className="text-slate-500 text-sm mb-6">
        Market segments with targeted positioning strategy for each.
      </p>

      <StepPageWrapper projectId={projectId} stepName="SEGMENTATION" stepLabel="Segments & Positioning">
        {(output, _refresh, editMode, save) => {
          const { segments } = output as { segments: Segment[] };

          const update = (id: string, updates: Partial<Segment>) =>
            save({ segments: segments.map((s) => s.id === id ? { ...s, ...updates } : s) });

          const updatePositioning = (id: string, updates: Partial<SegmentPositioning>) =>
            save({
              segments: segments.map((s) =>
                s.id === id ? { ...s, positioning: { ...s.positioning, ...updates } as SegmentPositioning } : s
              ),
            });

          const remove = (id: string) =>
            save({ segments: segments.filter((s) => s.id !== id) });

          return (
            <div className="space-y-6">
              {segments.map((seg, i) => (
                <div key={seg.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="p-6 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                        <BarChart3 className="h-4 w-4 text-violet-400 shrink-0" />
                        <EditableText
                          value={seg.name}
                          editMode={editMode}
                          onSave={(v) => update(seg.id, { name: v })}
                          className="font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <Badge className={PRIORITY_COLORS[seg.estimatedPriority] ?? ""}>{seg.estimatedPriority}</Badge>
                        <Badge className={SIZE_COLORS[seg.sizeCategory] ?? ""}>{seg.sizeCategory}</Badge>
                        {editMode && (
                          <button
                            onClick={() => remove(seg.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <EditableText
                        value={seg.rationale}
                        editMode={editMode}
                        onSave={(v) => update(seg.id, { rationale: v })}
                        multiline
                        className="text-sm text-slate-500 dark:text-slate-400"
                      />
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Globe className="h-3 w-3 text-slate-400" />
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Geographies</span>
                        </div>
                        <EditableChips
                          items={seg.geographies ?? []}
                          onSave={(v) => update(seg.id, { geographies: v })}
                          editMode={editMode}
                          chipClass="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Industries</span>
                        </div>
                        <EditableChips
                          items={seg.industries ?? []}
                          onSave={(v) => update(seg.id, { industries: v })}
                          editMode={editMode}
                          chipClass="bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Positioning */}
                  {seg.positioning && (
                    <div className="p-6 space-y-5 bg-slate-50/50 dark:bg-slate-800/20">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5" />
                        Positioning Strategy
                      </h4>

                      {/* Messaging Hook */}
                      <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-4">
                        <p className="text-xs font-semibold text-violet-400 mb-1.5 flex items-center gap-1.5">
                          <MessageSquare className="h-3 w-3" />
                          Messaging Hook
                        </p>
                        <EditableText
                          value={seg.positioning.messagingHook}
                          editMode={editMode}
                          onSave={(v) => updatePositioning(seg.id, { messagingHook: v })}
                          multiline
                          className="text-sm font-medium text-slate-700 dark:text-slate-200"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Key Pain Points */}
                        <div>
                          <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1.5">
                            <Zap className="h-3 w-3" />
                            Key Pain Points
                          </p>
                          <EditableList
                            items={seg.positioning.keyPainPoints}
                            onSave={(v) => updatePositioning(seg.id, { keyPainPoints: v })}
                            editMode={editMode}
                            dotColor="bg-red-400"
                          />
                        </div>

                        {/* Proof Points */}
                        <div>
                          <p className="text-xs font-semibold text-green-400 mb-2">Proof Points</p>
                          <EditableList
                            items={seg.positioning.proofPoints}
                            onSave={(v) => updatePositioning(seg.id, { proofPoints: v })}
                            editMode={editMode}
                            dotColor="bg-green-400"
                          />
                        </div>
                      </div>

                      {/* Our Angle */}
                      <div>
                        <p className="text-xs font-semibold text-blue-400 mb-1.5">Our Angle</p>
                        <EditableText
                          value={seg.positioning.ourAngle}
                          editMode={editMode}
                          onSave={(v) => updatePositioning(seg.id, { ourAngle: v })}
                          multiline
                          className="text-sm text-slate-600 dark:text-slate-400"
                        />
                      </div>

                      {/* CTA Approach */}
                      <div>
                        <p className="text-xs font-semibold text-amber-400 mb-1.5">CTA Approach</p>
                        <EditableText
                          value={seg.positioning.ctaApproach}
                          editMode={editMode}
                          onSave={(v) => updatePositioning(seg.id, { ctaApproach: v })}
                          className="text-sm text-slate-600 dark:text-slate-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        }}
      </StepPageWrapper>
    </div>
  );
}
