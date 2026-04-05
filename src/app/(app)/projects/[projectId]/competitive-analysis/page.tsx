"use client";
import { use } from "react";
import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { ExternalLink, MapPin, CheckCircle2, XCircle } from "lucide-react";
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
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Competitive Analysis</h1>
      <p className="text-slate-500 text-sm mb-6">Competitor comparison by segment. See where you win and where they win.</p>

      <StepPageWrapper projectId={projectId} stepName="COMPETITIVE" stepLabel="Competitive Analysis">
        {(output) => {
          const { competitors } = output as { competitors: Competitor[]; isIndustrySpecific: boolean };
          return (
            <div className="space-y-6">
              {competitors.map((c) => (
                <div key={c.domain} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{c.name}</h3>
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
                    <div className="flex gap-2">
                      <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs">{c.targetSegment}</Badge>
                      {c.pricingModel && <Badge variant="outline" className="text-xs">{c.pricingModel}</Badge>}
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-4">"{c.valueProp}"</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Offerings */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Key Offerings</h4>
                        <ul className="space-y-1">
                          {c.keyOfferings.map((o, i) => (
                            <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                              <span className="h-1 w-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />{o}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Where they win */}
                      <div>
                        <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Where They Win
                        </h4>
                        <ul className="space-y-1">
                          {c.whereTheyWin.map((w, i) => (
                            <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                              <span className="h-1 w-1 rounded-full bg-red-400 mt-1.5 shrink-0" />{w}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Where you win */}
                      <div>
                        <h4 className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Where You Win
                        </h4>
                        <ul className="space-y-1">
                          {c.whereClientWins.map((w, i) => (
                            <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                              <span className="h-1 w-1 rounded-full bg-green-400 mt-1.5 shrink-0" />{w}
                            </li>
                          ))}
                        </ul>
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
