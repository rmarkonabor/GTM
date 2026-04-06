"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { EditableText, EditableChips, EditableList } from "@/components/shared/inline-edit";
import { Badge } from "@/components/ui/badge";
import { Globe, Users, MapPin, Building2, Zap } from "lucide-react";

interface CompanyProfile {
  name: string;
  description: string;
  businessType: string;
  primaryProduct: string;
  targetAudience: string;
  geographicFocus: string;
  keyDifferentiators: string[];
  currentCustomerExamples: string[];
  techStack: string[];
  teamSize?: string;
  fundingStage?: string;
}

interface ResearchOutput {
  companyProfile: CompanyProfile;
  questionsNeeded: unknown[];
}

export default function ResearchPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Company Research</h1>
      <p className="text-slate-500 text-sm mb-6">AI-extracted company profile from your website.</p>

      <StepPageWrapper
        projectId={projectId}
        stepName="RESEARCH"
        stepLabel="Company Research"
        onApproved={() => router.push(`/projects/${projectId}/industry-priority`)}
      >
        {(output, refresh, editMode, save) => {
          const { companyProfile: cp, questionsNeeded } = output as ResearchOutput;
          const patch = (updates: Partial<CompanyProfile>) =>
            save({ companyProfile: { ...cp, ...updates }, questionsNeeded });

          return (
            <div className="space-y-5">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <EditableText
                    value={cp.name}
                    editMode={editMode}
                    onSave={(v) => patch({ name: v })}
                    className="text-xl font-bold text-slate-900 dark:text-white"
                  />
                  <Badge className="bg-violet-500/10 text-violet-400 capitalize shrink-0 ml-3">
                    {cp.businessType?.replace("_", " ")}
                  </Badge>
                </div>
                <EditableText
                  value={cp.description}
                  editMode={editMode}
                  onSave={(v) => patch({ description: v })}
                  multiline
                  className="text-slate-600 dark:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditableInfoCard icon={Zap} title="Primary Product" value={cp.primaryProduct} editMode={editMode} onSave={(v) => patch({ primaryProduct: v })} />
                <EditableInfoCard icon={Users} title="Target Audience" value={cp.targetAudience} editMode={editMode} onSave={(v) => patch({ targetAudience: v })} />
                <EditableInfoCard icon={MapPin} title="Geographic Focus" value={cp.geographicFocus} editMode={editMode} onSave={(v) => patch({ geographicFocus: v })} />
                {cp.teamSize && <EditableInfoCard icon={Building2} title="Team Size" value={cp.teamSize} editMode={editMode} onSave={(v) => patch({ teamSize: v })} />}
              </div>

              {(cp.keyDifferentiators?.length > 0 || editMode) && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Key Differentiators</h3>
                  <EditableList
                    items={cp.keyDifferentiators ?? []}
                    onSave={(v) => patch({ keyDifferentiators: v })}
                    editMode={editMode}
                    dotColor="bg-violet-400"
                    textClass="text-sm text-slate-600 dark:text-slate-400"
                  />
                </div>
              )}

              {(cp.currentCustomerExamples?.length > 0 || editMode) && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Customer Examples</h3>
                  <EditableList
                    items={cp.currentCustomerExamples ?? []}
                    onSave={(v) => patch({ currentCustomerExamples: v })}
                    editMode={editMode}
                    dotColor="bg-green-400"
                    textClass="text-sm text-slate-600 dark:text-slate-400"
                  />
                </div>
              )}

              {(cp.techStack?.length > 0 || editMode) && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Tech Stack / Integrations</h3>
                  <EditableChips
                    items={cp.techStack ?? []}
                    onSave={(v) => patch({ techStack: v })}
                    editMode={editMode}
                    chipClass="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  />
                </div>
              )}
            </div>
          );
        }}
      </StepPageWrapper>
    </div>
  );
}

function EditableInfoCard({
  icon: Icon, title, value, editMode, onSave,
}: {
  icon: React.ElementType; title: string; value: string;
  editMode: boolean; onSave: (v: string) => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-violet-400" />
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
      </div>
      <EditableText
        value={value}
        editMode={editMode}
        onSave={onSave}
        multiline
        className="text-slate-900 dark:text-white text-sm"
      />
    </div>
  );
}
