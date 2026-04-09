"use client";
import { use } from "react";
import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { EditableText, EditableList } from "@/components/shared/inline-edit";
import { ExternalLink, MapPin, CheckCircle2, XCircle, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
  threatLevel?: "high" | "medium" | "low";
  edgeTrend?: "gaining" | "holding" | "losing";
}

const THREAT_COLORS: Record<string, string> = {
  high: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-green-500/10 text-green-400 border-green-500/20",
};

const TREND_ICON: Record<string, React.ReactNode> = {
  gaining: <TrendingUp className="h-3 w-3 text-red-400" />,
  holding: <Minus className="h-3 w-3 text-slate-400" />,
  losing: <TrendingDown className="h-3 w-3 text-green-400" />,
};

const TREND_LABEL: Record<string, string> = {
  gaining: "Gaining share",
  holding: "Holding",
  losing: "Losing share",
};

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

          const s = (v: unknown): string =>
            typeof v === "string" ? v : v == null ? "" : String(v);

          return (
            <div className="space-y-6">
              {competitors.map((c, i) => (
                <div key={i} className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-white/10 flex items-start justify-between">
                    <div className="flex-1">
                      <EditableText
                        value={s(c.name)}
                        editMode={editMode}
                        onSave={(v) => update(c.domain, { name: v })}
                        className="font-bold text-white text-lg"
                      />
                      <div className="flex items-center gap-3 mt-1">
                        <a
                          href={`https://${s(c.domain)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                        >
                          <ExternalLink className="h-3 w-3" />{s(c.domain)}
                        </a>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="h-3 w-3" />{s(c.location)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3 flex-wrap justify-end">
                      <Badge className="bg-slate-800 text-slate-300 text-xs">{s(c.targetSegment)}</Badge>
                      {c.pricingModel && <Badge variant="outline" className="text-xs">{s(c.pricingModel)}</Badge>}
                      {c.threatLevel && (
                        <Badge className={`text-xs border ${THREAT_COLORS[c.threatLevel] ?? ""}`}>
                          {c.threatLevel} threat
                        </Badge>
                      )}
                      {c.edgeTrend && (
                        <Badge className="bg-slate-800/50 border border-white/10 text-xs flex items-center gap-1">
                          {TREND_ICON[c.edgeTrend]}
                          <span className="text-slate-300">{TREND_LABEL[c.edgeTrend]}</span>
                        </Badge>
                      )}
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
