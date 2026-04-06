"use client";

import { use } from "react";
import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { ExpandPanel } from "@/components/shared/ExpandPanel";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, Lightbulb, Users, Tag } from "lucide-react";

interface IndustryDefinition {
  standardIndustry: string;
  niche: string;
  keywords: string[];
  priorityRank: number;
  painPoints: string[];
  whatClientOffers: string[];
  howTheyWorkTogether: string;
  estimatedMarketFit: "high" | "medium" | "low";
}

interface IndustryPriorityOutput {
  industries: IndustryDefinition[];
}

const FIT_COLORS: Record<string, string> = {
  high: "bg-green-500/10 text-green-400 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function IndustryPriorityPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Industry Priority</h1>
      <p className="text-slate-500 text-sm mb-6">
        Priority industries with database-compatible classifications, sub-niches, and targeting keywords.
      </p>

      <StepPageWrapper projectId={projectId} stepName="INDUSTRY_PRIORITY" stepLabel="Industry Priority">
        {(output, refresh) => {
          const { industries } = output as IndustryPriorityOutput;
          return (
            <div className="space-y-4">
              {industries.map((ind) => (
                <div
                  key={ind.priorityRank}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-slate-400 mt-1">#{ind.priorityRank}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Building2 className="h-4 w-4 text-violet-400 shrink-0" />
                          <h3 className="font-bold text-slate-900 dark:text-white">{ind.niche}</h3>
                        </div>
                        <p className="text-xs text-slate-400">{ind.standardIndustry}</p>
                      </div>
                    </div>
                    <Badge className={`border ${FIT_COLORS[ind.estimatedMarketFit] ?? ""} shrink-0`}>
                      {ind.estimatedMarketFit} fit
                    </Badge>
                  </div>

                  {/* Keywords */}
                  {ind.keywords?.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {ind.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Details grid */}
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

              <ExpandPanel
                projectId={projectId}
                stepName="INDUSTRY_PRIORITY"
                label="industry"
                placeholder="e.g. Legal Tech, EdTech, Climate Tech"
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
  red: "text-red-400", green: "text-green-400", blue: "text-blue-400",
  yellow: "text-yellow-400", violet: "text-violet-400",
};
const COLOR_BG: Record<string, string> = {
  red: "bg-red-400", green: "bg-green-400", blue: "bg-blue-400",
  yellow: "bg-yellow-400", violet: "bg-violet-400",
};

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
        <Icon className={`h-3.5 w-3.5 ${COLOR_TEXT[color] ?? "text-slate-400"}`} />
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h4>
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
