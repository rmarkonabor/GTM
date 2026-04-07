"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Users, Target, Swords, BarChart3, MessageSquare,
  CheckCircle2, TrendingUp, Globe, ChevronRight, Rocket, ChevronDown,
  ExternalLink, MapPin, XCircle, Loader2, Mail, RefreshCw, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ─── Types (exported for reuse) ────────────────────────────────────────────

export interface StepData {
  stepName: string;
  status: string;
  output: unknown;
  draftOutput: unknown;
}

export interface DashboardProject {
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
  domain?: string;
  location?: string;
  valueProp: string;
  keyOfferings?: string[];
  whereTheyWin?: string[];
  whereClientWins: string[];
  targetSegment: string;
  pricingModel?: string;
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

// Defensive: AI output may return objects instead of strings in arrays
const str = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : JSON.stringify(v));

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

// ─── Helper: extract step data from project ────────────────────────────────

export function buildStepMap(steps: StepData[]) {
  const stepMap: Record<string, unknown> = {};
  for (const s of steps) {
    const data = s.status === "AWAITING_APPROVAL" ? (s.draftOutput ?? s.output) : s.output;
    if (data && (s.status === "COMPLETE" || s.status === "AWAITING_APPROVAL")) {
      stepMap[s.stepName] = data;
    }
  }
  return stepMap;
}

// ─── Main Dashboard Content ────────────────────────────────────────────────

interface DashboardContentProps {
  project: DashboardProject;
  /** Hide tabs / execution section on public share page */
  readOnly?: boolean;
  /** Extra content to render after the hero (e.g. share button) */
  heroExtra?: React.ReactNode;
}

export function DashboardContent({ project, readOnly, heroExtra }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>("strategy");

  const stepMap = buildStepMap(project.steps);

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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{str(manifesto.tagline)}</h1>
          ) : (
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{str(profile?.name ?? "Your Strategy")}</h1>
          )}
          {manifesto?.elevatorPitch ? (
            <p className="text-white/80 text-lg leading-relaxed max-w-3xl">{str(manifesto.elevatorPitch)}</p>
          ) : profile?.description ? (
            <p className="text-white/80 text-lg leading-relaxed max-w-3xl">{str(profile.description)}</p>
          ) : null}

          <div className="mt-6 flex items-center gap-3 flex-wrap">
            {/* Progress pill */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
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
            {heroExtra}
          </div>
        </div>
      </div>

      {/* Tabs */}
      {!readOnly && (
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
      )}

      {/* Tab content */}
      {(!readOnly && activeTab === "execution") ? (
        <ExecutionTab project={project} />
      ) : (
        <StrategyTab
          profile={profile}
          industries={industries}
          markets={markets}
          icps={icps}
          competitors={competitors}
          segments={segments}
          manifesto={manifesto}
        />
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
            <p className="text-slate-300 text-sm leading-relaxed">{str(manifesto.who)}</p>
          </Card>
          <Card>
            <CardLabel>Why Choose Us</CardLabel>
            <p className="text-slate-300 text-sm leading-relaxed">{str(manifesto.whyChooseThem)}</p>
          </Card>
        </div>
      )}

      {/* Messaging Pillars */}
      {manifesto?.messagingPillars?.length ? (
        <section>
          <SectionHeader icon={MessageSquare} title="Messaging Pillars" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {manifesto.messagingPillars.map((p, i) => (
              <Card key={i}>
                <span className="inline-block bg-violet-500/10 text-violet-400 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">{str(p.pillar)}</span>
                <p className="font-semibold text-white text-sm">{str(p.headline)}</p>
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
            {industries?.sort((a, b) => a.priorityRank - b.priorityRank).slice(0, 5).map((ind, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-white text-sm">{str(ind.niche)}</p>
                  <span className={`text-xs font-medium ${FIT_COLOR[str(ind.estimatedMarketFit)] ?? "text-slate-400"}`}>
                    {str(ind.estimatedMarketFit)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">{str(ind.standardIndustry)}</p>
                <div className="flex flex-wrap gap-1">
                  {ind.painPoints.slice(0, 2).map((pp, i) => (
                    <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{str(pp)}</span>
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
            {markets?.sort((a, b) => (b.priorityScore as number) - (a.priorityScore as number)).slice(0, 5).map((mkt, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-white text-sm">{str(mkt.name)}</p>
                  <span className="text-xs font-bold text-violet-400">{String(mkt.priorityScore ?? "")}/10</span>
                </div>
                <div className="space-y-1 mt-2">
                  {mkt.urgentProblems.slice(0, 2).map((p, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-red-400 shrink-0" />
                      <span className="text-xs text-slate-400">{str(p)}</span>
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
            {icps?.slice(0, 5).map((icp, i) => (
              <Card key={i}>
                <p className="font-semibold text-white text-sm mb-1">{str(icp.niche)}</p>
                <p className="text-xs text-slate-500 mb-2">{icp.firmographics?.geographies?.slice(0, 2).map(str).join(", ")}</p>
                {(icp.keywords?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {icp.keywords.slice(0, 4).map((kw, j) => (
                      <span key={j} className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">{str(kw)}</span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {icp.buyerPersonas?.slice(0, 2).map((bp, j) => (
                    <span key={j} className="text-[10px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full">{str(bp.title)}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {segments.map((seg, i) => (
              <ExpandableSegmentCard key={i} seg={seg} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Competitive Landscape */}
      {competitors?.length ? (
        <section>
          <SectionHeader icon={Swords} title="Competitive Landscape" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {competitors.map((c, i) => (
              <CompetitorCard key={i} competitor={c} />
            ))}
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

interface StoredCampaign {
  campaignId: number;
  name: string;
  targetMarketName: string;
  pushedAt: string;
  stats: {
    sent: number; opened: number; clicked: number; replied: number; bounced: number;
    openRate: number; clickRate: number; replyRate: number; status: string;
  } | null;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PAUSED:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  STOPPED:  "bg-red-500/10 text-red-400 border-red-500/20",
  DRAFTED:  "bg-slate-500/10 text-slate-400 border-slate-500/20",
  ARCHIVED: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

function StatPill({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col items-center bg-slate-800/60 rounded-lg px-4 py-2.5 min-w-[72px]">
      <span className="text-base font-bold text-white leading-tight">{value}{sub}</span>
      <span className="text-[10px] text-slate-500 mt-0.5">{label}</span>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: StoredCampaign }) {
  const s = campaign.stats;
  const statusKey = s?.status?.toUpperCase() ?? "DRAFTED";
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-white text-sm truncate">{campaign.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{campaign.targetMarketName} · {new Date(campaign.pushedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {s && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_BADGE[statusKey] ?? STATUS_BADGE.DRAFTED}`}>
              {statusKey}
            </span>
          )}
        </div>
      </div>

      {s ? (
        <div className="flex flex-wrap gap-2">
          <StatPill label="Sent"     value={s.sent} />
          <StatPill label="Opened"   value={s.openRate}  sub="%" />
          <StatPill label="Clicked"  value={s.clickRate} sub="%" />
          <StatPill label="Replied"  value={s.replyRate} sub="%" />
          <StatPill label="Bounced"  value={s.sent > 0 ? Math.round((s.bounced / s.sent) * 100) : 0} sub="%" />
        </div>
      ) : (
        <p className="text-xs text-slate-600 italic">Metrics unavailable — add Smartlead API key in Settings.</p>
      )}
    </div>
  );
}

function ExecutionTab({ project }: { project: DashboardProject }) {
  const [campaigns, setCampaigns] = useState<StoredCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCampaigns = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/campaigns`);
      const data = await res.json();
      if (data.campaigns) setCampaigns(data.campaigns);
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [project.id]);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-violet-400" />
          <h2 className="font-semibold text-white">Smartlead Campaigns</h2>
          {campaigns.length > 0 && (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-white/10">
              {campaigns.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {campaigns.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadCampaigns(true)}
              disabled={refreshing}
              className="text-slate-400 hover:text-white gap-1.5 text-xs h-8"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh metrics
            </Button>
          )}
          <Link href={`/projects/${project.id}/cold-email`}>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white gap-1.5 text-xs h-8">
              <Rocket className="h-3.5 w-3.5" />
              New Sequence
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading campaigns…
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center space-y-3">
          <Mail className="h-8 w-8 text-slate-700 mx-auto" />
          <p className="text-slate-400 text-sm font-medium">No campaigns pushed yet</p>
          <p className="text-slate-600 text-xs max-w-xs mx-auto">
            Generate a cold email sequence and push it to Smartlead — it&apos;ll appear here with live metrics.
          </p>
          <Link href={`/projects/${project.id}/cold-email`}>
            <Button size="sm" className="mt-2 bg-violet-600 hover:bg-violet-500 text-white gap-1.5 text-xs">
              <Rocket className="h-3.5 w-3.5" /> Create your first sequence
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.slice().reverse().map((c) => (
            <CampaignCard key={c.campaignId} campaign={c} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Competitor Card ────────────────────────────────────────────────────────

function CompetitorCard({ competitor: c }: { competitor: Competitor }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
      {/* Header — always visible */}
      <button onClick={() => setOpen(!open)} className="w-full text-left p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-semibold text-white">{str(c.name)}</p>
              {c.pricingModel && (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-white/10">
                  {str(c.pricingModel)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {c.domain && (
                <a
                  href={`https://${str(c.domain)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 hover:underline"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  {str(c.domain)}
                </a>
              )}
              {c.location && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {str(c.location)}
                </span>
              )}
              <span className="text-xs text-slate-600">{str(c.targetSegment)}</span>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 mt-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>

        {/* Value prop always shown */}
        <p className="text-xs text-slate-400 mt-2 leading-relaxed text-left">{str(c.valueProp)}</p>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-4">
          {/* Key Offerings */}
          {c.keyOfferings?.length ? (
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Key Offerings</p>
              <div className="flex flex-wrap gap-1.5">
                {c.keyOfferings.map((o, i) => (
                  <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-white/5">
                    {str(o)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            {/* Where They Win */}
            {c.whereTheyWin?.length ? (
              <div>
                <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Where They Win
                </p>
                <ul className="space-y-1.5">
                  {c.whereTheyWin.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-red-400 shrink-0" />
                      <span className="text-xs text-slate-400">{str(w)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Where We Win */}
            {c.whereClientWins?.length ? (
              <div>
                <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Where We Win
                </p>
                <ul className="space-y-1.5">
                  {c.whereClientWins.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-xs text-slate-400">{str(w)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Expandable Segment Card ────────────────────────────────────────────────

function ExpandableSegmentCard({ seg }: { seg: Segment }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 text-left space-y-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">{str(seg.name)}</p>
            <p className="text-xs text-slate-500 capitalize">{str(seg.sizeCategory)}</p>
          </div>
          <div className="flex items-center gap-2">
            {seg.estimatedPriority && (
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${TIER_COLOR[str(seg.estimatedPriority)] ?? TIER_COLOR["tier-3"]}`}>
                {str(seg.estimatedPriority).replace("-", " ").toUpperCase()}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </div>
        </div>

        {seg.positioning?.messagingHook && (
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-violet-400 font-medium mb-1">Messaging Hook</p>
            <p className="text-sm text-slate-300">{str(seg.positioning.messagingHook)}</p>
          </div>
        )}

        {!open && seg.positioning?.keyPainPoints?.length ? (
          <div className="flex flex-wrap gap-1">
            {seg.positioning.keyPainPoints.slice(0, 3).map((pp, i) => (
              <span key={i} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">{str(pp)}</span>
            ))}
          </div>
        ) : null}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
          {seg.rationale && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Why This Segment</p>
              <p className="text-sm text-slate-300 leading-relaxed">{str(seg.rationale)}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            {seg.geographies?.length ? (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Geographies</p>
                <div className="flex flex-wrap gap-1">
                  {seg.geographies.map((g, i) => (
                    <span key={i} className="text-[10px] bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded-full">{str(g)}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {seg.industries?.length ? (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Industries</p>
                <div className="flex flex-wrap gap-1">
                  {seg.industries.map((ind, i) => (
                    <span key={i} className="text-[10px] bg-violet-900/20 text-violet-400 px-2 py-0.5 rounded-full">{str(ind)}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {seg.positioning?.ourAngle && (
            <div>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1.5">Our Angle</p>
              <p className="text-sm text-slate-300 leading-relaxed">{str(seg.positioning.ourAngle)}</p>
            </div>
          )}

          {seg.positioning?.keyPainPoints?.length ? (
            <div>
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1.5">Key Pain Points</p>
              <div className="space-y-1.5">
                {seg.positioning.keyPainPoints.map((pp, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-red-400 shrink-0" />
                    <span className="text-xs text-slate-400">{str(pp)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {seg.positioning?.proofPoints?.length ? (
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">Proof Points</p>
              <div className="space-y-1.5">
                {seg.positioning.proofPoints.map((pp, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-xs text-slate-400">{str(pp)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {seg.positioning?.ctaApproach && (
            <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-violet-400 mb-1">CTA Approach</p>
              <p className="text-sm text-slate-300">{str(seg.positioning.ctaApproach)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared UI components ──────────────────────────────────────────────────

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
