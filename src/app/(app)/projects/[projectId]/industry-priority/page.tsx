"use client";

import { use } from "react";
import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { EditableText, EditableChips, EditableList } from "@/components/shared/inline-edit";
import { ExpandPanel } from "@/components/shared/ExpandPanel";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, Lightbulb, Users, Tag, Trash2 } from "lucide-react";

interface IndustryDefinition {
  standardIndustry: string;
  niche: string;
  keywords: string[];
  priorityRank: number;
  painPoints: string[];
  whatClientOffers: string[];
  howTheyWorkTogether: string;
  estimatedMarketFit: "high" | "medium" | "low";
}

interface IndustryPriorityOutput {
  industries: IndustryDefinition[];
}

const FIT_COLORS: Record<string, string> = {
  high: "bg-green-500/10 text-green-400 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function IndustryPriorityPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Industry Priority</h1>
      <p className="text-slate-500 text-sm mb-6">
        Priority industries with database-compatible classifications, sub-niches, and targeting keywords.
      </p>

      <StepPageWrapper projectId={projectId} stepName="INDUSTRY_PRIORITY" stepLabel="Industry Priority">
        {(output, refresh, editMode, save) => {
          const { industries } = output as IndustryPriorityOutput;

          const update = (rank: number, updates: Partial<IndustryDefinition>) =>
            save({ industries: industries.map((i) => i.priorityRank === rank ? { ...i, ...updates } : i) });

          const remove = (rank: number) =>
            save({ industries: industries.filter((i) => i.priorityRank !== rank) });

          return (
            <div className="space-y-4">
              {industries.map((ind) => (
                <div
                  key={ind.priorityRank}
                  className="bg-slate-900 border border-white/10 rounded-xl p-6"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-slate-400 mt-1">#{ind.priorityRank}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Building2 className="h-4 w-4 text-violet-400 shrink-0" />
                          <EditableText
                            value={ind.niche}
                            editMode={editMode}
                            onSave={(v) => update(ind.priorityRank, { niche: v })}
                            className="font-bold text-white"
                          />
                        </div>
                        <EditableText
                          value={ind.standardIndustry}
                          editMode={editMode}
                          onSave={(v) => update(ind.priorityRank, { standardIndustry: v })}
                          className="text-xs text-slate-400"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`border ${FIT_COLORS[ind.estimatedMarketFit] ?? ""}`}>
                        {ind.estimatedMarketFit} fit
                      </Badge>
                      {editMode && (
                        <button
                          onClick={() => remove(ind.priorityRank)}
                          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <EditableChips
                      items={ind.keywords ?? []}
                      onSave={(v) => update(ind.priorityRank, { keywords: v })}
                      editMode={editMode}
                    />
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Users className="h-3.5 w-3.5 text-red-400" />
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pain Points</h4>
                      </div>
                      <EditableList
                        items={ind.painPoints ?? []}
                        onSave={(v) => update(ind.priorityRank, { painPoints: v })}
                        editMode={editMode}
                        dotColor="bg-red-400"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">What You Offer</h4>
                      </div>
                      <EditableList
                        items={ind.whatClientOffers ?? []}
                        onSave={(v) => update(ind.priorityRank, { whatClientOffers: v })}
                        editMode={editMode}
                        dotColor="bg-green-400"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Lightbulb className="h-3.5 w-3.5 text-blue-400" />
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          How You Work Together
                        </h4>
                      </div>
                      <EditableText
                        value={ind.howTheyWorkTogether}
                        editMode={editMode}
                        onSave={(v) => update(ind.priorityRank, { howTheyWorkTogether: v })}
                        multiline
                        className="text-xs text-slate-400 leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <ExpandPanel
                projectId={projectId}
                stepName="INDUSTRY_PRIORITY"
                label="industry"
                placeholder="e.g. Legal Tech, EdTech, Climate Tech"
                onExpanded={refresh}
              />
            </div>
          );
        }}
      </StepPageWrapper>
    </div>
  );
}
