"use client";

import { use } from "react";
import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { ExpandPanel } from "@/components/shared/ExpandPanel";
import { TrendingUp, AlertTriangle, Info, Building2, Users, Globe } from "lucide-react";

interface Firmographics {
  companySize: string[];
  revenue: string[];
  geographies: string[];
  industries: string[];
  technologies: string[];
  businessModels: string[];
}

interface BuyerPersona {
  title: string;
  seniorities: string[];
  departments: string[];
  goals: string[];
  challenges: string[];
  triggerEvents: string[];
}

interface TargetMarket {
  id: string;
  name: string;
  urgentProblems: string[];
  importantProblems: string[];
  macroTrends: string[];
  whyRightMarket: string;
  priorityScore: number;
  firmographics: Firmographics;
  buyerPersonas: BuyerPersona[];
}

export default function TargetMarketsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Target Markets</h1>
      <p className="text-slate-500 text-sm mb-6">
        Top market opportunities with market-specific firmographics and buyer personas.
      </p>

      <StepPageWrapper projectId={projectId} stepName="TARGET_MARKETS" stepLabel="Target Markets">
        {(output, refresh) => {
          const { markets } = output as { markets: TargetMarket[] };
          return (
            <div className="space-y-6">
              {markets.map((market, i) => (
                <div key={market.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                  {/* Market header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs text-slate-400 font-medium">#{i + 1}</span>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{market.name}</h2>
                      </div>
                      <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 shrink-0">
                        <span className="text-violet-300 font-bold text-lg">{market.priorityScore}</span>
                        <span className="text-violet-400 text-xs">/10</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400">{market.whyRightMarket}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <ProblemList icon={AlertTriangle} title="Urgent Problems" items={market.urgentProblems} color="red" />
                      <ProblemList icon={Info} title="Important Problems" items={market.importantProblems} color="yellow" />
                      <ProblemList icon={TrendingUp} title="Macro Trends" items={market.macroTrends} color="blue" />
                    </div>
                  </div>

                  {/* Firmographics + Personas */}
                  {(market.firmographics || market.buyerPersonas?.length > 0) && (
                    <div className="border-t border-slate-100 dark:border-white/5 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Firmographics */}
                        {market.firmographics && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-3">
                              <Building2 className="h-3.5 w-3.5 text-violet-400" />
                              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Firmographics</h4>
                            </div>
                            <div className="space-y-2 text-xs">
                              <FirmoRow label="Company Size" values={market.firmographics.companySize} />
                              <FirmoRow label="Revenue" values={market.firmographics.revenue} />
                              <FirmoRow label="Geographies" values={market.firmographics.geographies} />
                              <FirmoRow label="Industries" values={market.firmographics.industries} />
                              {market.firmographics.technologies?.length > 0 && (
                                <FirmoRow label="Technologies" values={market.firmographics.technologies} />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Buyer Personas */}
                        {market.buyerPersonas?.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-3">
                              <Users className="h-3.5 w-3.5 text-violet-400" />
                              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Buyer Personas</h4>
                            </div>
                            <div className="space-y-3">
                              {market.buyerPersonas.map((persona, pi) => (
                                <div key={pi} className="bg-white dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-white/5">
                                  <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 mb-1">{persona.title}</p>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {persona.seniorities?.map((s) => (
                                      <span key={s} className="bg-violet-500/10 text-violet-400 text-xs px-1.5 py-0.5 rounded">{s}</span>
                                    ))}
                                    {persona.departments?.map((d) => (
                                      <span key={d} className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs px-1.5 py-0.5 rounded">{d}</span>
                                    ))}
                                  </div>
                                  {persona.triggerEvents?.length > 0 && (
                                    <div>
                                      <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
                                        <Globe className="h-3 w-3" /> Trigger Events
                                      </p>
                                      <ul className="space-y-0.5">
                                        {persona.triggerEvents.map((te, ti) => (
                                          <li key={ti} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                                            <span className="h-1 w-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                            {te}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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

const COLOR_TEXT: Record<string, string> = {
  red: "text-red-400", yellow: "text-yellow-400", blue: "text-blue-400",
  green: "text-green-400", violet: "text-violet-400",
};
const COLOR_BG: Record<string, string> = {
  red: "bg-red-400", yellow: "bg-yellow-400", blue: "bg-blue-400",
  green: "bg-green-400", violet: "bg-violet-400",
};

function ProblemList({ icon: Icon, title, items, color }: { icon: React.ElementType; title: string; items: string[]; color: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`h-3.5 w-3.5 ${COLOR_TEXT[color] ?? "text-slate-400"}`} />
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h4>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
            <span className={`h-1 w-1 rounded-full ${COLOR_BG[color] ?? "bg-slate-400"} mt-1.5 shrink-0`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FirmoRow({ label, values }: { label: string; values: string[] }) {
  if (!values?.length) return null;
  return (
    <div className="flex gap-2">
      <span className="text-slate-400 shrink-0 w-24">{label}:</span>
      <span className="text-slate-700 dark:text-slate-300">{values.join(", ")}</span>
    </div>
  );
}
