import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { Badge } from "@/components/ui/badge";
import { Globe, Building2, BarChart3 } from "lucide-react";

interface Segment {
  id: string;
  name: string;
  sizeCategory: string;
  geographies: string[];
  industries: string[];
  estimatedPriority: string;
  rationale: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  "tier-1": "bg-violet-500/10 text-violet-400",
  "tier-2": "bg-blue-500/10 text-blue-400",
  "tier-3": "bg-slate-500/10 text-slate-400",
};

const SIZE_COLORS: Record<string, string> = {
  enterprise: "bg-orange-500/10 text-orange-400",
  "mid-market": "bg-blue-500/10 text-blue-400",
  smb: "bg-green-500/10 text-green-400",
  startup: "bg-violet-500/10 text-violet-400",
};

export default async function SegmentationPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Segmentation</h1>
      <p className="text-slate-500 text-sm mb-6">
        Distinct market segments by size, geography, and industry.
      </p>

      <StepPageWrapper projectId={projectId} stepName="SEGMENTATION" stepLabel="Segmentation">
        {(output) => {
          const { segments } = output as { segments: Segment[] };
          return (
            <div className="space-y-4">
              {segments.map((seg, i) => (
                <div key={seg.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-violet-400" />
                        <h3 className="font-bold text-slate-900 dark:text-white">{seg.name}</h3>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={PRIORITY_COLORS[seg.estimatedPriority] ?? ""}>
                        {seg.estimatedPriority}
                      </Badge>
                      <Badge className={SIZE_COLORS[seg.sizeCategory] ?? ""}>
                        {seg.sizeCategory}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{seg.rationale}</p>

                  <div className="flex flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Globe className="h-3 w-3 text-slate-400" />
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Geographies</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {seg.geographies.map((g) => (
                          <span key={g} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-xs">{g}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Industries</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {seg.industries.map((ind) => (
                          <span key={ind} className="bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded text-xs">{ind}</span>
                        ))}
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
