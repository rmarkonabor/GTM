"use client";

import { use, useEffect, useState } from "react";
import {
  Building2, Users, Target, Swords, BarChart3, MessageSquare,
  CheckCircle2, Loader2, TrendingUp, Globe, ChevronRight, Rocket, ChevronDown,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface StepData {
  stepName: string;
  status: string;
  output: unknown;
  draftOutput: unknown;
}

interface Project {
  id: string;
  name: string | null;
  websiteUrl: string;
  status: string;
  companyProfile: CompanyProfile | null;
  steps: StepData[];
}

interface CompanyProfile {
  name: string;
  description: string;
  primaryProduct: string;
  targetAudience: string;
  keyDifferentiators: string[];
}

interface IndustryDef {
  standardIndustry: string;
  niche: string;
  painPoints: string[];
  estimatedMarketFit: string;
  priorityRank: number;
}

interface TargetMarket {
  name: string;
  urgentProblems: string[];
  priorityScore: number;
}

interface ICP {
  niche: string;
  standardIndustry: string;
  keywords: string[];
  buyerPersonas: { title: string }[];
  firmographics: { companySize: string[]; geographies: string[] };
}

interface Competitor {
  name: string;
  valueProp: string;
  targetSegment: string;
  whereClientWins: string[];
}

interface Segment {
  name: string;
  sizeCategory: string;
  estimatedPriority: string;
  geographies?: string[];
  industries?: string[];
  rationale?: string;
  positioning?: {
    messagingHook: string;
    keyPainPoints: string[];
    ourAngle: string;
    proofPoints?: string[];
    ctaApproach?: string;
  };
}

interface Manifesto {
  tagline: string;
  elevatorPitch: string;
  who: string;
  whyChooseThem: string;
  messagingPillars: { pillar: string; headline: string }[];
}

const TIER_COLOR: Record<string, string> = {
  "tier-1": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "tier-2": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "tier-3": "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const FIT_COLOR: Record<string, string> = {
  high: "text-emerald-400",
  medium: "text-amber-400",
  low: "text-slate-500",
};

type Tab = "strategy" | "execution";

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("strategy");

  useEffect(() => {
    fetch(`/api/projects/${projectId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setProject(d.project); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!project) return <p className="text-slate-400 p-8">Project not found.</p>;

  const stepMap: Record<string, unknown> = {};
  for (const s of project.steps) {
    const data = s.status === "AWAITING_APPROVAL" ? (s.draftOutput ?? s.output) : s.output;
    if (data && (s.status === "COMPLETE" || s.status === "AWAITING_APPROVAL")) {
      stepMap[s.stepName] = data;
    }
  }

  const profile = project.companyProfile;
  const industries = (stepMap.INDUSTRY_PRIORITY as { industries: IndustryDef[] })?.industries;
  const markets = (stepMap.TARGET_MARKETS as { markets: TargetMarket[] })?.markets;
  const icps = (stepMap.ICP as { icps: ICP[] })?.icps;
  const competitors = (stepMap.COMPETITIVE as { competitors: Competitor[] })?.competitors;
  const segments = (stepMap.SEGMENTATION as { segments: Segment[] })?.segments;
  const manifesto = stepMap.MANIFESTO as Manifesto | undefined;

  const completedCount = project.steps.filter((s) => s.status === "COMPLETE" || s.status === "AWAITING_APPROVAL").length;
  const totalSteps = 6;
  const allDone = completedCount >= totalSteps;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Hero / Company */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoNnptMC0zMHY2aC02VjRoNnptMCAzMHY2aC02di02aDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="relative">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
            <Globe className="h-4 w-4" />
            {project.websiteUrl}
          </div>
          {manifesto?.tagline ? (
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{manifesto.tagline}</h1>
          ) : (
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{profile?.name ?? "Your Strategy"}</h1>
          )}
          {manifesto?.elevatorPitch ? (
            <p className="text-white/80 text-lg leading-relaxed max-w-3xl">{manifesto.elevatorPitch}</p>
          ) : profile?.description ? (
            <p className="text-white/80 text-lg leading-relaxed max-w-3xl">{profile.description}</p>
          ) : null}

          {/* Progress pill */}
          <div className="mt-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            {allDone ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span className="text-sm text-white font-medium">Strategy Complete</span>
              </>
            ) : (
              <>
                <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${(completedCount / totalSteps) * 100}%` }} />
                </div>
                <span className="text-sm text-white/70">{completedCount}/{totalSteps} steps</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-white/10 rounded-xl p-1">
        <TabButton
          active={activeTab === "strategy"}
          onClick={() => setActiveTab("strategy")}
          icon={TrendingUp}
          label="GTM Strategy"
        />
        <TabButton
          active={activeTab === "execution"}
          onClick={() => setActiveTab("execution")}
          icon={Rocket}
          label="Execution"
        />
      </div>

      {/* Tab content */}
      {activeTab === "strategy" ? (
        <StrategyTab
          profile={profile}
          industries={industries}
          markets={markets}
          icps={icps}
          competitors={competitors}
          segments={segments}
          manifesto={manifesto}
        />
      ) : (
        <ExecutionTab />
      )}
    </div>
  );
}

// ─── Strategy Tab ───────────────────────────────────────────────────────────

function StrategyTab({
  profile, industries, markets, icps, competitors, segments, manifesto,
}: {
  profile: CompanyProfile | null;
  industries: IndustryDef[] | undefined;
  markets: TargetMarket[] | undefined;
  icps: ICP[] | undefined;
  competitors: Competitor[] | undefined;
  segments: Segment[] | undefined;
  manifesto: Manifesto | undefined;
}) {
  return (
    <div className="space-y-8">
      {/* Manifesto — who + why */}
      {manifesto && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardLabel>Who We Serve</CardLabel>
            <p className="text-slate-300 text-sm leading-relaxed">{manifesto.who}</p>
          </Card>
          <Card>
            <CardLabel>Why Choose Us</CardLabel>
            <p className="text-slate-300 text-sm leading-relaxed">{manifesto.whyChooseThem}</p>
          </Card>
        </div>
      )}

      {/* Messaging Pillars */}
      {manifesto?.messagingPillars?.length ? (
        <section>
          <SectionHeader icon={MessageSquare} title="Messaging Pillars" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {manifesto.messagingPillars.map((p) => (
              <Card key={p.pillar}>
                <span className="inline-block bg-violet-500/10 text-violet-400 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">{p.pillar}</span>
                <p className="font-semibold text-white text-sm">{p.headline}</p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* Industries → Markets → ICPs flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Industries */}
        <section>
          <SectionHeader icon={Building2} title="Priority Industries" />
          <div className="space-y-3">
            {industries?.sort((a, b) => a.priorityRank - b.priorityRank).slice(0, 5).map((ind) => (
              <Card key={ind.standardIndustry}>
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-white text-sm">{ind.niche}</p>
                  <span className={`text-xs font-medium ${FIT_COLOR[ind.estimatedMarketFit] ?? "text-slate-400"}`}>
                    {ind.estimatedMarketFit}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">{ind.standardIndustry}</p>
                <div className="flex flex-wrap gap-1">
                  {ind.painPoints.slice(0, 2).map((pp) => (
                    <span key={pp} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{pp}</span>
                  ))}
                </div>
              </Card>
            )) ?? <EmptyCard label="Not completed yet" />}
          </div>
        </section>

        {/* Target Markets */}
        <section>
          <SectionHeader icon={Target} title="Target Markets" />
          <div className="space-y-3">
            {markets?.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5).map((mkt) => (
              <Card key={mkt.name}>
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-white text-sm">{mkt.name}</p>
                  <span className="text-xs font-bold text-violet-400">{mkt.priorityScore}/10</span>
                </div>
                <div className="space-y-1 mt-2">
                  {mkt.urgentProblems.slice(0, 2).map((p) => (
                    <div key={p} className="flex items-start gap-1.5">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-red-400 shrink-0" />
                      <span className="text-xs text-slate-400">{p}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )) ?? <EmptyCard label="Not completed yet" />}
          </div>
        </section>

        {/* ICPs */}
        <section>
          <SectionHeader icon={Users} title="Ideal Customers" />
          <div className="space-y-3">
            {icps?.slice(0, 5).map((icp) => (
              <Card key={icp.niche}>
                <p className="font-semibold text-white text-sm mb-1">{icp.niche}</p>
                <p className="text-xs text-slate-500 mb-2">{icp.firmographics.geographies?.slice(0, 2).join(", ")}</p>
                {icp.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {icp.keywords.slice(0, 4).map((kw) => (
                      <span key={kw} className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">{kw}</span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {icp.buyerPersonas.slice(0, 2).map((bp) => (
                    <span key={bp.title} className="text-[10px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full">{bp.title}</span>
                  ))}
                </div>
              </Card>
            )) ?? <EmptyCard label="Not completed yet" />}
          </div>
        </section>
      </div>

      {/* Segments & Positioning */}
      {segments?.length ? (
        <section>
          <SectionHeader icon={BarChart3} title="Segments & Positioning" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {segments.map((seg) => (
              <ExpandableSegmentCard key={seg.name} seg={seg} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Competitive Landscape */}
      {competitors?.length ? (
        <section>
          <SectionHeader icon={Swords} title="Competitive Landscape" />
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Competitor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Market</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Their Play</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Where We Win</th>
                </tr>
              </thead>
              <tbody>
                {competitors.slice(0, 8).map((c) => (
                  <tr key={c.name} className="border-b border-white/5 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{c.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{c.targetSegment}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-xs">{c.valueProp}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.whereClientWins.slice(0, 2).map((w) => (
                          <span key={w} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">{w}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* Strategy Flow */}
      <section>
        <SectionHeader icon={TrendingUp} title="Strategy Flow" />
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { label: "Industries", done: !!industries },
            { label: "Markets", done: !!markets },
            { label: "ICP", done: !!icps },
            { label: "Competitive", done: !!competitors },
            { label: "Segments", done: !!segments },
            { label: "Manifesto", done: !!manifesto },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${step.done ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : "border-white/10 bg-slate-900 text-slate-500"}`}>
                {step.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 rounded-full border border-slate-600" />}
                {step.label}
              </div>
              {i < arr.length - 1 && <ChevronRight className="h-4 w-4 text-slate-600 shrink-0" />}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Execution Tab ──────────────────────────────────────────────────────────

function ExecutionTab() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/20 p-12 text-center">
        {/* Decorative */}
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-violet-500/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-purple-500/5 blur-3xl" />

        <div className="relative">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/25 flex items-center justify-center mb-5 shadow-xl shadow-violet-900/20">
            <Rocket className="h-7 w-7 text-violet-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">Execution Hub</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
            Turn your GTM strategy into action. Execution tools will help you generate outreach sequences, content plans, campaign briefs, and more — all powered by your strategy data.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              "Outreach Sequences",
              "Content Calendar",
              "Campaign Briefs",
              "Sales Playbook",
              "Email Templates",
              "Landing Pages",
            ].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-slate-400"
              >
                <span className="h-1 w-1 rounded-full bg-violet-500" />
                {label}
              </span>
            ))}
          </div>

          <p className="mt-8 text-xs text-slate-600">Coming soon</p>
        </div>
      </div>
    </div>
  );
}

// ─── Expandable Segment Card ────────────────────────────────────────────────

function ExpandableSegmentCard({ seg }: { seg: Segment }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
      {/* Always visible header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 text-left space-y-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">{seg.name}</p>
            <p className="text-xs text-slate-500 capitalize">{seg.sizeCategory}</p>
          </div>
          <div className="flex items-center gap-2">
            {seg.estimatedPriority && (
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${TIER_COLOR[seg.estimatedPriority] ?? TIER_COLOR["tier-3"]}`}>
                {seg.estimatedPriority.replace("-", " ").toUpperCase()}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </div>
        </div>

        {seg.positioning?.messagingHook && (
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-violet-400 font-medium mb-1">Messaging Hook</p>
            <p className="text-sm text-slate-300">{seg.positioning.messagingHook}</p>
          </div>
        )}

        {!open && seg.positioning?.keyPainPoints?.length ? (
          <div className="flex flex-wrap gap-1">
            {seg.positioning.keyPainPoints.slice(0, 3).map((pp) => (
              <span key={pp} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">{pp}</span>
            ))}
          </div>
        ) : null}
      </button>

      {/* Expanded details */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
          {/* Rationale */}
          {seg.rationale && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Why This Segment</p>
              <p className="text-sm text-slate-300 leading-relaxed">{seg.rationale}</p>
            </div>
          )}

          {/* Geographies & Industries */}
          <div className="flex flex-wrap gap-4">
            {seg.geographies?.length ? (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Geographies</p>
                <div className="flex flex-wrap gap-1">
                  {seg.geographies.map((g) => (
                    <span key={g} className="text-[10px] bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded-full">{g}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {seg.industries?.length ? (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Industries</p>
                <div className="flex flex-wrap gap-1">
                  {seg.industries.map((ind) => (
                    <span key={ind} className="text-[10px] bg-violet-900/20 text-violet-400 px-2 py-0.5 rounded-full">{ind}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Our Angle */}
          {seg.positioning?.ourAngle && (
            <div>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1.5">Our Angle</p>
              <p className="text-sm text-slate-300 leading-relaxed">{seg.positioning.ourAngle}</p>
            </div>
          )}

          {/* Pain Points */}
          {seg.positioning?.keyPainPoints?.length ? (
            <div>
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1.5">Key Pain Points</p>
              <div className="space-y-1.5">
                {seg.positioning.keyPainPoints.map((pp) => (
                  <div key={pp} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-red-400 shrink-0" />
                    <span className="text-xs text-slate-400">{pp}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Proof Points */}
          {seg.positioning?.proofPoints?.length ? (
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">Proof Points</p>
              <div className="space-y-1.5">
                {seg.positioning.proofPoints.map((pp) => (
                  <div key={pp} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-xs text-slate-400">{pp}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* CTA Approach */}
          {seg.positioning?.ctaApproach && (
            <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-violet-400 mb-1">CTA Approach</p>
              <p className="text-sm text-slate-300">{seg.positioning.ctaApproach}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared components ──────────────────────────────────────────────────────

function TabButton({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void;
  icon: React.ComponentType<{ className?: string }>; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-violet-600/20 text-violet-300 shadow-sm"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900 border border-white/10 rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{children}</p>;
}

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-violet-400" />
      <h2 className="text-lg font-semibold text-white">{title}</h2>
    </div>
  );
}

function EmptyCard({ label }: { label: string }) {
  return (
    <div className="border border-dashed border-white/10 rounded-xl p-4 text-center">
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
