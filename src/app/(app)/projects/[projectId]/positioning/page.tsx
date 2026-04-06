"use client";
import { use } from "react";
import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { EditableText, EditableList } from "@/components/shared/inline-edit";
import { Lightbulb, Target, Users, Trash2 } from "lucide-react";

interface BySegment {
  segmentName: string;
  keyPlayers: string[];
  differentiationAngle: string;
}

interface PositioningOutput {
  uniqueValueProp: string;
  differentiationPoints: string[];
  positioningStatement: string;
  bySegment: BySegment[];
}

export default function PositioningPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Positioning</h1>
      <p className="text-slate-500 text-sm mb-6">
        How you differentiate vs. competitors in each segment.
      </p>

      <StepPageWrapper projectId={projectId} stepName="POSITIONING" stepLabel="Positioning">
        {(output, _refresh, editMode, save) => {
          const pos = output as PositioningOutput;

          const patch = (updates: Partial<PositioningOutput>) => save({ ...pos, ...updates });

          const removeSegment = (name: string) =>
            patch({ bySegment: pos.bySegment.filter((s) => s.segmentName !== name) });

          const updateSegment = (name: string, updates: Partial<BySegment>) =>
            patch({ bySegment: pos.bySegment.map((s) => s.segmentName === name ? { ...s, ...updates } : s) });

          return (
            <div className="space-y-5">
              {/* UVP */}
              <div className="bg-gradient-to-r from-violet-600/10 to-purple-600/10 border border-violet-500/20 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-violet-400" />
                  <h3 className="font-semibold text-violet-300 text-sm uppercase tracking-wider">Unique Value Proposition</h3>
                </div>
                <EditableText
                  value={pos.uniqueValueProp}
                  editMode={editMode}
                  onSave={(v) => patch({ uniqueValueProp: v })}
                  className="text-xl font-bold text-white"
                />
              </div>

              {/* Positioning statement */}
              <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-violet-400" />
                  <h3 className="font-semibold text-white">Positioning Statement</h3>
                  <span className="text-xs text-slate-400">(Geoffrey Moore format)</span>
                </div>
                <EditableText
                  value={pos.positioningStatement}
                  editMode={editMode}
                  onSave={(v) => patch({ positioningStatement: v })}
                  multiline
                  className="text-slate-400 italic leading-relaxed"
                />
              </div>

              {/* Differentiation points */}
              <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-3">Differentiation Points</h3>
                <EditableList
                  items={pos.differentiationPoints ?? []}
                  onSave={(v) => patch({ differentiationPoints: v })}
                  editMode={editMode}
                  dotColor="bg-violet-400"
                  textClass="text-sm text-slate-400"
                />
              </div>

              {/* By segment */}
              <div>
                <h3 className="font-semibold text-white mb-4">By Segment</h3>
                <div className="space-y-3">
                  {pos.bySegment.map((seg) => (
                    <div key={seg.segmentName} className="bg-slate-900 border border-white/10 rounded-xl p-5">
                      <div className="flex items-start justify-between mb-1">
                        <EditableText
                          value={seg.segmentName}
                          editMode={editMode}
                          onSave={(v) => updateSegment(seg.segmentName, { segmentName: v })}
                          className="font-semibold text-white"
                        />
                        {editMode && (
                          <button
                            onClick={() => removeSegment(seg.segmentName)}
                            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 ml-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-slate-400">Key players: {seg.keyPlayers.join(", ")}</span>
                      </div>
                      <EditableText
                        value={seg.differentiationAngle}
                        editMode={editMode}
                        onSave={(v) => updateSegment(seg.segmentName, { differentiationAngle: v })}
                        multiline
                        className="text-sm text-slate-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }}
      </StepPageWrapper>
    </div>
  );
}
