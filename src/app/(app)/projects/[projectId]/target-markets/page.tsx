import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { TrendingUp, AlertTriangle, Info } from "lucide-react";

interface TargetMarket {
  id: string;
  name: string;
  urgentProblems: string[];
  importantProblems: string[];
  macroTrends: string[];
  whyRightMarket: string;
  priorityScore: number;
}

export default async function TargetMarketsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Target Markets</h1>
      <p className="text-slate-500 text-sm mb-6">Top market opportunities ranked by fit and urgency.</p>

      <StepPageWrapper projectId={projectId} stepName="TARGET_MARKETS" stepLabel="Target Markets">
        {(output) => {
          const { markets } = output as { markets: TargetMarket[] };
          return (
            <div className="space-y-5">
              {markets.map((market, i) => (
                <div key={market.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-xs text-slate-400 font-medium">#{i + 1}</span>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{market.name}</h2>
                    </div>
                    <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1">
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
              ))}
            </div>
          );
        }}
      </StepPageWrapper>
    </div>
  );
}

function ProblemList({ icon: Icon, title, items, color }: { icon: React.ElementType; title: string; items: string[]; color: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`h-3.5 w-3.5 text-${color}-400`} />
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h4>
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
