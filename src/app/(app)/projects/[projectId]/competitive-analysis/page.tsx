"use client";
import { use } from "react";
import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { EditableText, EditableList } from "@/components/shared/inline-edit";
import { ExternalLink, MapPin, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Competitor {
  name: string;
  domain: string;
  location: string;
  valueProp: string;
  keyOfferings: string[];
  whereTheyWin: string[];
  whereClientWins: string[];
  targetSegment: string;
  pricingModel?: string;
}

export default function CompetitiveAnalysisPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Competitor Analysis</h1>
      <p className="text-slate-500 text-sm mb-6">Competitor comparison by segment. See where you win and where they win.</p>

      <StepPageWrapper projectId={projectId} stepName="COMPETITIVE" stepLabel="Competitor Analysis">
        {(output, _refresh, editMode, save) => {
          const { competitors, isIndustrySpecific } = output as { competitors: Competitor[]; isIndustrySpecific: boolean };

          const update = (domain: string, updates: Partial<Competitor>) =>
            save({ competitors: competitors.map((c) => c.domain === domain ? { ...c, ...updates } : c), isIndustrySpecific });

          const remove = (domain: string) =>
            save({ competitors: competitors.filter((c) => c.domain !== domain), isIndustrySpecific });

          return (
            <div className="space-y-6">
              {competitors.map((c) => (
                <div key={c.domain} className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-white/10 flex items-start justify-between">
                    <div className="flex-1">
                      <EditableText
                        value={c.name}
                        editMode={editMode}
                        onSave={(v) => update(c.domain, { name: v })}
                        className="font-bold text-white text-lg"
                      />
                      <div className="flex items-center gap-3 mt-1">
                        <a
                          href={`https://${c.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                        >
                          <ExternalLink className="h-3 w-3" />{c.domain}
                        </a>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="h-3 w-3" />{c.location}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge className="bg-slate-800 text-slate-300 text-xs">{c.targetSegment}</Badge>
                      {c.pricingModel && <Badge variant="outline" className="text-xs">{c.pricingModel}</Badge>}
                      {editMode && (
                        <button
                          onClick={() => remove(c.domain)}
                          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <EditableText
                        value={c.valueProp}
                        editMode={editMode}
                        onSave={(v) => update(c.domain, { valueProp: v })}
                        multiline
                        className="text-sm text-slate-400 italic"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Key Offerings</h4>
                        <EditableList
                          items={c.keyOfferings ?? []}
                          onSave={(v) => update(c.domain, { keyOfferings: v })}
                          editMode={editMode}
                          dotColor="bg-slate-400"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Where They Win
                        </h4>
                        <EditableList
                          items={c.whereTheyWin ?? []}
                          onSave={(v) => update(c.domain, { whereTheyWin: v })}
                          editMode={editMode}
                          dotColor="bg-red-400"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Where You Win
                        </h4>
                        <EditableList
                          items={c.whereClientWins ?? []}
                          onSave={(v) => update(c.domain, { whereClientWins: v })}
                          editMode={editMode}
                          dotColor="bg-green-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        }}
      </StepPageWrapper>
    </div>
  );
}
