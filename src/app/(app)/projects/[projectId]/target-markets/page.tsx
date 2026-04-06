"use client";

import { use } from "react";
import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { EditableText, EditableList } from "@/components/shared/inline-edit";
import { ExpandPanel } from "@/components/shared/ExpandPanel";
import { TrendingUp, AlertTriangle, Info, Trash2 } from "lucide-react";

interface TargetMarket {
  id: string;
  name: string;
  urgentProblems: string[];
  importantProblems: string[];
  macroTrends: string[];
  whyRightMarket: string;
  priorityScore: number;
}

export default function TargetMarketsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Target Markets</h1>
      <p className="text-slate-500 text-sm mb-6">
        Top market opportunities ranked by priority.
      </p>

      <StepPageWrapper projectId={projectId} stepName="TARGET_MARKETS" stepLabel="Target Markets">
        {(output, refresh, editMode, save) => {
          const { markets } = output as { markets: TargetMarket[] };

          const update = (id: string, updates: Partial<TargetMarket>) =>
            save({ markets: markets.map((m) => m.id === id ? { ...m, ...updates } : m) });

          const remove = (id: string) =>
            save({ markets: markets.filter((m) => m.id !== id) });

          return (
            <div className="space-y-6">
              {markets.map((market, i) => (
                <div key={market.id} className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <span className="text-xs text-slate-400 font-medium">#{i + 1}</span>
                        <EditableText
                          value={market.name}
                          editMode={editMode}
                          onSave={(v) => update(market.id, { name: v })}
                          className="text-lg font-bold text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1">
                          <span className="text-violet-300 font-bold text-lg">{market.priorityScore}</span>
                          <span className="text-violet-400 text-xs">/10</span>
                        </div>
                        {editMode && (
                          <button
                            onClick={() => remove(market.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                      <EditableText
                        value={market.whyRightMarket}
                        editMode={editMode}
                        onSave={(v) => update(market.id, { whyRightMarket: v })}
                        multiline
                        className="text-sm text-slate-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Urgent Problems</h4>
                        </div>
                        <EditableList
                          items={market.urgentProblems ?? []}
                          onSave={(v) => update(market.id, { urgentProblems: v })}
                          editMode={editMode}
                          dotColor="bg-red-400"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Info className="h-3.5 w-3.5 text-yellow-400" />
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Important Problems</h4>
                        </div>
                        <EditableList
                          items={market.importantProblems ?? []}
                          onSave={(v) => update(market.id, { importantProblems: v })}
                          editMode={editMode}
                          dotColor="bg-yellow-400"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Macro Trends</h4>
                        </div>
                        <EditableList
                          items={market.macroTrends ?? []}
                          onSave={(v) => update(market.id, { macroTrends: v })}
                          editMode={editMode}
                          dotColor="bg-blue-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <ExpandPanel
                projectId={projectId}
                stepName="TARGET_MARKETS"
                label="market"
                placeholder="e.g. Mid-Market Healthcare, Legal Firms in North America"
                onExpanded={refresh}
              />
            </div>
          );
        }}
      </StepPageWrapper>
    </div>
  );
}
