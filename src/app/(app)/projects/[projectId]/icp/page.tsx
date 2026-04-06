"use client";

import { use } from "react";
import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { EditableText, EditableChips, EditableList } from "@/components/shared/inline-edit";
import { Badge } from "@/components/ui/badge";
import { Building2, User, MapPin, Cpu, DollarSign, Target, Tag, Trash2 } from "lucide-react";

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

interface ICPDefinition {
  standardIndustry: string;
  niche: string;
  keywords: string[];
  firmographics: Firmographics;
  buyerPersonas: BuyerPersona[];
}

export default function ICPPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">
        Ideal Customer Profile (ICP)
      </h1>
      <p className="text-slate-500 text-sm mb-6">
        Market-specific ICPs with Apollo/ZoomInfo-compatible firmographics and buyer personas.
      </p>

      <StepPageWrapper projectId={projectId} stepName="ICP" stepLabel="ICP">
        {(output, _refresh, editMode, save) => {
          const { icps } = output as { icps: ICPDefinition[] };

          const updateIcp = (idx: number, updates: Partial<ICPDefinition>) =>
            save({ icps: icps.map((icp, i) => i === idx ? { ...icp, ...updates } : icp) });

          const removeIcp = (idx: number) =>
            save({ icps: icps.filter((_, i) => i !== idx) });

          const updatePersona = (icpIdx: number, pIdx: number, updates: Partial<BuyerPersona>) =>
            save({
              icps: icps.map((icp, i) =>
                i === icpIdx
                  ? { ...icp, buyerPersonas: icp.buyerPersonas.map((p, j) => j === pIdx ? { ...p, ...updates } : p) }
                  : icp
              ),
            });

          const removePersona = (icpIdx: number, pIdx: number) =>
            save({
              icps: icps.map((icp, i) =>
                i === icpIdx
                  ? { ...icp, buyerPersonas: icp.buyerPersonas.filter((_, j) => j !== pIdx) }
                  : icp
              ),
            });

          const updateFirmo = (icpIdx: number, field: keyof Firmographics, value: string[]) =>
            updateIcp(icpIdx, { firmographics: { ...icps[icpIdx].firmographics, [field]: value } });

          return (
            <div className="space-y-8">
              {icps.map((icp, idx) => (
                <div key={idx}>
                  {/* Industry header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Building2 className="h-5 w-5 text-violet-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <EditableText
                          value={icp.niche}
                          editMode={editMode}
                          onSave={(v) => updateIcp(idx, { niche: v })}
                          className="font-bold text-white text-lg leading-tight"
                        />
                        <EditableText
                          value={icp.standardIndustry}
                          editMode={editMode}
                          onSave={(v) => updateIcp(idx, { standardIndustry: v })}
                          className="text-xs text-slate-400 mt-0.5"
                        />
                        {(icp.keywords?.length > 0 || editMode) && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-2">
                            <Tag className="h-3 w-3 text-slate-500 shrink-0" />
                            <EditableChips
                              items={icp.keywords ?? []}
                              onSave={(v) => updateIcp(idx, { keywords: v })}
                              editMode={editMode}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    {editMode && (
                      <button
                        onClick={() => removeIcp(idx)}
                        className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Firmographics */}
                  <div className="bg-slate-900 border border-white/10 rounded-xl p-6 mb-4">
                    <h3 className="font-semibold text-slate-300 mb-4 flex items-center gap-2">
                      <Target className="h-4 w-4 text-violet-400" />
                      Firmographics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {(
                        [
                          { icon: Building2, label: "Company Size", field: "companySize" as const, highlight: false },
                          { icon: DollarSign, label: "Revenue", field: "revenue" as const, highlight: false },
                          { icon: MapPin, label: "Geographies", field: "geographies" as const, highlight: false },
                          { icon: Building2, label: "Industries (DB)", field: "industries" as const, highlight: true },
                          { icon: Cpu, label: "Technologies", field: "technologies" as const, highlight: false },
                          { icon: Target, label: "Business Models", field: "businessModels" as const, highlight: false },
                        ]
                      ).map(({ icon: Icon, label, field, highlight }) => (
                        <div key={field}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Icon className="h-3 w-3 text-slate-400" />
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
                          </div>
                          <EditableChips
                            items={icp.firmographics[field] ?? []}
                            onSave={(v) => updateFirmo(idx, field, v)}
                            editMode={editMode}
                            chipClass={
                              highlight
                                ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                                : "bg-slate-800 text-slate-300"
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Buyer Personas */}
                  <div className="space-y-3">
                    {icp.buyerPersonas.map((persona, pi) => (
                      <div
                        key={pi}
                        className="bg-slate-900 border border-white/10 rounded-xl p-5"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 flex-wrap flex-1">
                            <User className="h-4 w-4 text-violet-400 shrink-0" />
                            <EditableText
                              value={persona.title}
                              editMode={editMode}
                              onSave={(v) => updatePersona(idx, pi, { title: v })}
                              className="font-semibold text-white"
                            />
                            <div className="flex gap-1 flex-wrap">
                              <EditableChips
                                items={persona.seniorities ?? []}
                                onSave={(v) => updatePersona(idx, pi, { seniorities: v })}
                                editMode={editMode}
                                chipClass="bg-violet-500/10 text-violet-400"
                              />
                              <EditableChips
                                items={persona.departments ?? []}
                                onSave={(v) => updatePersona(idx, pi, { departments: v })}
                                editMode={editMode}
                                chipClass="bg-slate-500/10 text-slate-400"
                              />
                            </div>
                          </div>
                          {editMode && (
                            <button
                              onClick={() => removePersona(idx, pi)}
                              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 ml-2"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Goals</h5>
                            <EditableList
                              items={persona.goals ?? []}
                              onSave={(v) => updatePersona(idx, pi, { goals: v })}
                              editMode={editMode}
                              dotColor="bg-green-400"
                            />
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Challenges</h5>
                            <EditableList
                              items={persona.challenges ?? []}
                              onSave={(v) => updatePersona(idx, pi, { challenges: v })}
                              editMode={editMode}
                              dotColor="bg-red-400"
                            />
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Trigger Events</h5>
                            <EditableList
                              items={persona.triggerEvents ?? []}
                              onSave={(v) => updatePersona(idx, pi, { triggerEvents: v })}
                              editMode={editMode}
                              dotColor="bg-blue-400"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
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
