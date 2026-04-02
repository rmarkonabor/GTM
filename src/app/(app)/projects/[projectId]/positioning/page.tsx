import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { Lightbulb, Target, Users } from "lucide-react";

interface PositioningOutput {
  uniqueValueProp: string;
  differentiationPoints: string[];
  positioningStatement: string;
  bySegment: Array<{
    segmentName: string;
    keyPlayers: string[];
    differentiationAngle: string;
  }>;
}

export default async function PositioningPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Positioning</h1>
      <p className="text-slate-500 text-sm mb-6">
        How you differentiate vs. competitors in each segment.
      </p>

      <StepPageWrapper projectId={projectId} stepName="POSITIONING" stepLabel="Positioning">
        {(output) => {
          const pos = output as PositioningOutput;
          return (
            <div className="space-y-5">
              {/* UVP */}
              <div className="bg-gradient-to-r from-violet-600/10 to-purple-600/10 border border-violet-500/20 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-violet-400" />
                  <h3 className="font-semibold text-violet-300 text-sm uppercase tracking-wider">Unique Value Proposition</h3>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{pos.uniqueValueProp}</p>
              </div>

              {/* Positioning statement */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-violet-400" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">Positioning Statement</h3>
                  <span className="text-xs text-slate-400">(Geoffrey Moore format)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 italic leading-relaxed">{pos.positioningStatement}</p>
              </div>

              {/* Differentiation points */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Differentiation Points</h3>
                <ul className="space-y-2">
                  {pos.differentiationPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <span className="h-5 w-5 rounded-full bg-violet-500/10 text-violet-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>

              {/* By segment */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">By Segment</h3>
                <div className="space-y-3">
                  {pos.bySegment.map((seg) => (
                    <div key={seg.segmentName} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{seg.segmentName}</h4>
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-slate-400">Key players: {seg.keyPlayers.join(", ")}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{seg.differentiationAngle}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }}
      </StepPageWrapper>
    </div>
  );
}
