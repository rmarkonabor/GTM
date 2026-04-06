"use client";
import { use } from "react";
import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { EditableText, EditableList } from "@/components/shared/inline-edit";
import { Quote, Zap, Trash2 } from "lucide-react";

interface MessagingPillar {
  pillar: string;
  headline: string;
  supportingPoints: string[];
}

interface ManifestoOutput {
  who: string;
  whyExist: string;
  whatTheyDo: string;
  whyChooseThem: string;
  tagline: string;
  elevatorPitch: string;
  messagingPillars: MessagingPillar[];
}

export default function ManifestoPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Manifesto &amp; Messaging</h1>
      <p className="text-slate-500 text-sm mb-6">Your brand voice, messaging pillars, and elevator pitch.</p>

      <StepPageWrapper projectId={projectId} stepName="MANIFESTO" stepLabel="Manifesto">
        {(output, _refresh, editMode, save) => {
          const m = output as ManifestoOutput;
          const patch = (updates: Partial<ManifestoOutput>) => save({ ...m, ...updates });

          const removePillar = (pillar: string) =>
            patch({ messagingPillars: m.messagingPillars.filter((p) => p.pillar !== pillar) });

          const updatePillar = (pillar: string, updates: Partial<MessagingPillar>) =>
            patch({ messagingPillars: m.messagingPillars.map((p) => p.pillar === pillar ? { ...p, ...updates } : p) });

          return (
            <div className="space-y-6">
              {/* Tagline */}
              <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl p-8 text-center">
                <Zap className="h-8 w-8 text-white/70 mx-auto mb-3" />
                <EditableText
                  value={m.tagline}
                  editMode={editMode}
                  onSave={(v) => patch({ tagline: v })}
                  className="text-3xl font-bold text-white"
                />
              </div>

              {/* Core messaging */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(
                  [
                    { label: "Who we serve", key: "who" as const },
                    { label: "Why we exist", key: "whyExist" as const },
                    { label: "What we do", key: "whatTheyDo" as const },
                    { label: "Why choose us", key: "whyChooseThem" as const },
                  ] as const
                ).map((item) => (
                  <div key={item.label} className="bg-slate-900 border border-white/10 rounded-xl p-5">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{item.label}</h3>
                    <EditableText
                      value={m[item.key]}
                      editMode={editMode}
                      onSave={(v) => patch({ [item.key]: v })}
                      multiline
                      className="text-slate-300 text-sm"
                    />
                  </div>
                ))}
              </div>

              {/* Elevator pitch */}
              <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Quote className="h-4 w-4 text-violet-400" />
                  <h3 className="font-semibold text-white">Elevator Pitch</h3>
                </div>
                <EditableText
                  value={m.elevatorPitch}
                  editMode={editMode}
                  onSave={(v) => patch({ elevatorPitch: v })}
                  multiline
                  className="text-slate-400 leading-relaxed"
                />
              </div>

              {/* Messaging pillars */}
              <div>
                <h3 className="font-semibold text-white mb-4">Messaging Pillars</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {m.messagingPillars.map((p) => (
                    <div key={p.pillar} className="bg-slate-900 border border-white/10 rounded-xl p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="inline-flex items-center bg-violet-500/10 text-violet-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <EditableText
                            value={p.pillar}
                            editMode={editMode}
                            onSave={(v) => updatePillar(p.pillar, { pillar: v })}
                            className="text-xs font-semibold text-violet-400"
                          />
                        </div>
                        {editMode && (
                          <button
                            onClick={() => removePillar(p.pillar)}
                            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <EditableText
                        value={p.headline}
                        editMode={editMode}
                        onSave={(v) => updatePillar(p.pillar, { headline: v })}
                        className="font-semibold text-white mb-3"
                      />
                      <EditableList
                        items={p.supportingPoints ?? []}
                        onSave={(v) => updatePillar(p.pillar, { supportingPoints: v })}
                        editMode={editMode}
                        dotColor="bg-violet-400"
                        textClass="text-xs text-slate-400"
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
