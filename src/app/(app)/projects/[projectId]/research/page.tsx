import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
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

export default async function ResearchPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Company Research</h1>
      <p className="text-slate-500 text-sm mb-6">AI-extracted company profile from your website.</p>

      <StepPageWrapper projectId={projectId} stepName="RESEARCH" stepLabel="Company Research">
        {(output) => {
          const { companyProfile: cp } = output as ResearchOutput;
          return (
            <div className="space-y-5">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{cp.name}</h2>
                  <Badge className="bg-violet-500/10 text-violet-400 capitalize">{cp.businessType?.replace("_", " ")}</Badge>
                </div>
                <p className="text-slate-600 dark:text-slate-400">{cp.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon={Zap} title="Primary Product" content={cp.primaryProduct} />
                <InfoCard icon={Users} title="Target Audience" content={cp.targetAudience} />
                <InfoCard icon={MapPin} title="Geographic Focus" content={cp.geographicFocus} />
                {cp.teamSize && <InfoCard icon={Building2} title="Team Size" content={cp.teamSize} />}
              </div>

              {cp.keyDifferentiators?.length > 0 && (
                <ListCard title="Key Differentiators" items={cp.keyDifferentiators} color="violet" />
              )}
              {cp.currentCustomerExamples?.length > 0 && (
                <ListCard title="Customer Examples" items={cp.currentCustomerExamples} color="green" />
              )}
              {cp.techStack?.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Tech Stack / Integrations</h3>
                  <div className="flex flex-wrap gap-2">
                    {cp.techStack.map((t) => (
                      <span key={t} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-xs">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }}
      </StepPageWrapper>
    </div>
  );
}

function InfoCard({ icon: Icon, title, content }: { icon: React.ElementType; title: string; content: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-violet-400" />
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
      </div>
      <p className="text-slate-900 dark:text-white text-sm">{content}</p>
    </div>
  );
}

function ListCard({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className={`h-1.5 w-1.5 rounded-full bg-${color}-400 mt-1.5 shrink-0`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
