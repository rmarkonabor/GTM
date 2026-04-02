import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, Lightbulb, Users } from "lucide-react";

interface IndustryDefinition {
  industryName: string;
  priorityRank: number;
  painPoints: string[];
  whatClientOffers: string[];
  howTheyWorkTogether: string;
  estimatedMarketFit: "high" | "medium" | "low";
}

interface IndustryPriorityOutput {
  targetMarketId: string;
  industries: IndustryDefinition[];
}

const FIT_COLORS: Record<string, string> = {
  high: "bg-green-500/10 text-green-400",
  medium: "bg-yellow-500/10 text-yellow-400",
  low: "bg-slate-500/10 text-slate-400",
};

export default async function IndustryPriorityPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Industry Priority</h1>
      <p className="text-slate-500 text-sm mb-6">
        Industries ranked by priority — with pain points, your offering, and engagement model.
      </p>

      <StepPageWrapper projectId={projectId} stepName="INDUSTRY_PRIORITY" stepLabel="Industry Priority">
        {(output) => {
          const allGroups = output as IndustryPriorityOutput[];
          return (
            <div className="space-y-8">
              {allGroups.map((group, gi) => (
                <div key={gi}>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Market {gi + 1} · Industry Breakdown
                  </h2>
                  <div className="space-y-4">
                    {group.industries.map((ind) => (
                      <div
                        key={ind.industryName}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400">#{ind.priorityRank}</span>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-violet-400" />
                              <h3 className="font-bold text-slate-900 dark:text-white">{ind.industryName}</h3>
                            </div>
                          </div>
                          <Badge className={FIT_COLORS[ind.estimatedMarketFit] ?? ""}>
                            {ind.estimatedMarketFit} fit
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Section icon={Users} title="Pain Points" items={ind.painPoints} color="red" />
                          <Section icon={CheckCircle2} title="What You Offer" items={ind.whatClientOffers} color="green" />
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <Lightbulb className="h-3.5 w-3.5 text-blue-400" />
                              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                How You Work Together
                              </h4>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {ind.howTheyWorkTogether}
                            </p>
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

function Section({
  icon: Icon,
  title,
  items,
  color,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`h-3.5 w-3.5 text-${color}-400`} />
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h4>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
            <span className={`h-1 w-1 rounded-full bg-${color}-400 mt-1.5 shrink-0`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
