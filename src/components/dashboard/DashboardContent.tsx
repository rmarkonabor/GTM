"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Building2, Users, Target, Swords, BarChart3, MessageSquare,
  CheckCircle2, TrendingUp, Globe, ChevronRight, Rocket, ChevronDown,
  ExternalLink, MapPin, XCircle, Loader2, Sparkles, AlertTriangle, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EmailStep, EmailAnnotation } from "@/types/gtm";
import { checkSpam } from "@/lib/email/spam-words";

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

const METRIC_LABEL: Record<EmailAnnotation["metric"], string> = {
  open_rate: "Open Rate",
  reply_rate: "Reply Rate",
  engagement: "Engagement",
  click_rate: "Click Rate",
};

const METRIC_COLOR: Record<EmailAnnotation["metric"], string> = {
  open_rate: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  reply_rate: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  engagement: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  click_rate: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

function SpamWarning({ text }: { text: string }) {
  const matches = checkSpam(text);
  if (!matches.length) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <span>
        Spam words detected: {matches.map((m) => <strong key={m.word} className="font-semibold">&ldquo;{m.word}&rdquo;</strong>).reduce<React.ReactNode[]>((acc, el, i) => i === 0 ? [el] : [...acc, ", ", el], [])}
        {" "}— may reduce deliverability.
      </span>
    </div>
  );
}

/** Count {A|B} blocks in a string */
function countSpintax(text: string): number {
  return (text.match(/\{[^}]+\|[^}]+\}/g) ?? []).length;
}

function SpintaxBadge({ text }: { text: string }) {
  const count = countSpintax(text);
  if (count === 0) return null;
  const ok = count >= 8 && count <= 12;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${ok ? "bg-violet-500/10 text-violet-400 border-violet-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
      {count} spintax {ok ? "✓" : `(target 8–12)`}
    </span>
  );
}

function EmailEditor({
  step,
  index,
  onChange,
}: {
  step: EmailStep;
  index: number;
  onChange: (updated: EmailStep) => void;
}) {
  const combined = step.subject + " " + step.body;

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-800/40">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">Step {index + 1}</span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-400">Day {step.waitDays}</span>
          <SpintaxBadge text={combined} />
        </div>
        {step.annotations.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {step.annotations.map((a, i) => (
              <span key={i} className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${METRIC_COLOR[a.metric]}`} title={a.impact}>
                {a.part !== "subject" ? <span className="text-[9px] opacity-60 uppercase">{a.part}</span> : null}
                {METRIC_LABEL[a.metric]}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Subject */}
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Subject line
          </label>
          <Input
            value={step.subject}
            onChange={(e) => onChange({ ...step, subject: e.target.value })}
            className="bg-slate-800 border-white/10 text-white text-sm font-medium"
          />
          {step.annotations.filter((a) => a.part === "subject").map((a, i) => (
            <p key={i} className="mt-1 text-[10px] text-slate-500 leading-relaxed">{a.impact}</p>
          ))}
        </div>

        {/* Body */}
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Body
          </label>
          <Textarea
            value={step.body}
            onChange={(e) => onChange({ ...step, body: e.target.value })}
            rows={8}
            className="bg-slate-800 border-white/10 text-white text-sm resize-y font-mono leading-relaxed"
          />
          {step.annotations.filter((a) => a.part !== "subject").map((a, i) => (
            <p key={i} className="mt-1 text-[10px] text-slate-500 leading-relaxed">
              <span className="text-slate-600 font-semibold uppercase">{a.part}</span>{" "}— {a.impact}
            </p>
          ))}
        </div>

        <SpamWarning text={combined} />
      </div>
    </div>
  );
}

interface ColdEmailDraft {
  status: "PENDING" | "RUNNING" | "COMPLETE" | "ERROR";
  targetMarketName: string;
  steps: EmailStep[];
  error?: string;
  startedAt: string;
  completedAt?: string;
}

function ExecutionTab({ project }: { project: DashboardProject }) {
  const stepMap = buildStepMap(project.steps);
  const markets = (stepMap.TARGET_MARKETS as { markets: { name: string }[] } | undefined)?.markets ?? [];

  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [draft, setDraft] = useState<ColdEmailDraft | null>(null);
  const [emailSteps, setEmailSteps] = useState<EmailStep[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [pushing, setPushing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // On mount: load any existing saved draft
  useEffect(() => {
    fetch(`/api/projects/${project.id}/cold-email`)
      .then((r) => r.json())
      .then((data) => {
        if (data.draft) {
          const d = data.draft as ColdEmailDraft;
          setDraft(d);
          if (d.status === "COMPLETE" && d.steps?.length) {
            setEmailSteps(d.steps);
            setCampaignName(`${project.companyProfile?.name ?? "Campaign"} — ${d.targetMarketName} Sequence`);
          }
        }
      })
      .catch(() => {});
  }, [project.id, project.companyProfile?.name]);

  // Poll while PENDING or RUNNING — continues even if user switches tabs
  useEffect(() => {
    const isRunning = draft?.status === "PENDING" || draft?.status === "RUNNING";
    if (!isRunning) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    if (pollRef.current) return; // already polling

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${project.id}/cold-email`);
        const data = await res.json();
        if (!data.draft) return;
        const d = data.draft as ColdEmailDraft;
        setDraft(d);
        if (d.status === "COMPLETE" && d.steps?.length) {
          setEmailSteps(d.steps);
          setCampaignName(`${project.companyProfile?.name ?? "Campaign"} — ${d.targetMarketName} Sequence`);
          toast.success("Email sequence ready!");
          clearInterval(pollRef.current!);
          pollRef.current = null;
        } else if (d.status === "ERROR") {
          toast.error(d.error ?? "Generation failed. Please try again.");
          clearInterval(pollRef.current!);
          pollRef.current = null;
        }
      } catch { /* network blip — keep polling */ }
    }, 3000);

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [draft?.status, project.id, project.companyProfile?.name]);

  const handleGenerate = useCallback(async () => {
    if (!selectedMarket) { toast.warning("Select a target market first."); return; }
    setEmailSteps([]);
    setDraft({ status: "PENDING", targetMarketName: selectedMarket, steps: [], startedAt: new Date().toISOString() });
    try {
      const res = await fetch(`/api/projects/${project.id}/cold-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetMarketName: selectedMarket }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDraft(null);
        throw new Error(data.error?.message ?? "Failed to start generation");
      }
      toast("Generating in background — you can switch tabs freely.");
    } catch (err) {
      toast.error((err as Error).message);
      setDraft(null);
    }
  }, [selectedMarket, project.id]);

  const handlePush = useCallback(async () => {
    if (!campaignName.trim()) { toast.warning("Enter a campaign name."); return; }
    setPushing(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/cold-email/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName,
          steps: emailSteps.map((s) => ({ subject: s.subject, body: s.body, waitDays: s.waitDays })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Failed to create campaign");
      toast.success(`Campaign created! ID: ${data.campaignId}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPushing(false);
    }
  }, [campaignName, emailSteps, project.id]);

  const generating = draft?.status === "PENDING" || draft?.status === "RUNNING";

  if (markets.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-10 text-center">
        <Rocket className="h-8 w-8 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Complete the Target Markets step to unlock the cold email generator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cold Email Generator */}
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-5">
        <div className="flex items-center gap-2 pb-1 border-b border-white/8">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <h2 className="font-semibold text-white">Cold Email Sequence Generator</h2>
        </div>

        <p className="text-slate-400 text-sm leading-relaxed">
          Pick a target market and generate a 3-step cold email sequence grounded in your GTM strategy. Generation runs in the background — feel free to navigate away and come back.
        </p>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-slate-400 block mb-1.5">Target Market</label>
            <Select value={selectedMarket} onValueChange={setSelectedMarket} disabled={generating}>
              <SelectTrigger className="bg-slate-800 border-white/15 text-white">
                <SelectValue placeholder="Select a market…" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/15">
                {markets.map((m) => (
                  <SelectItem key={m.name} value={m.name} className="text-white focus:bg-violet-600/20 focus:text-violet-300">
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating || !selectedMarket}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shrink-0"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Generating…" : emailSteps.length > 0 ? "Regenerate" : "Generate Sequence"}
          </Button>
        </div>

        {/* Status banner while running */}
        {generating && (
          <div className="flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs text-violet-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            Generating your email sequence in the background. You can safely switch tabs — it will be here when you return.
          </div>
        )}

        {/* Annotation legend */}
        {emailSteps.length === 0 && !generating && (
          <div className="flex flex-wrap gap-2 pt-1">
            {(Object.keys(METRIC_LABEL) as EmailAnnotation["metric"][]).map((m) => (
              <span key={m} className={`text-[10px] px-2.5 py-1 rounded-full border ${METRIC_COLOR[m]}`}>
                {METRIC_LABEL[m]}
              </span>
            ))}
            <span className="text-[10px] text-slate-600 self-center ml-1">— metric impact annotations</span>
          </div>
        )}
      </div>

      {/* Email editors */}
      {emailSteps.length > 0 && (
        <>
          <div className="space-y-4">
            {emailSteps.map((step, i) => (
              <EmailEditor
                key={i}
                step={step}
                index={i}
                onChange={(updated) =>
                  setEmailSteps((prev) => prev.map((s, idx) => idx === i ? updated : s))
                }
              />
            ))}
          </div>

          {/* Push to Smartlead */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-400" />
              <h3 className="font-semibold text-white text-sm">Push to Smartlead</h3>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Campaign Name</label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="bg-slate-800 border-white/10 text-white text-sm"
                placeholder="My Campaign"
              />
            </div>
            <Button
              onClick={handlePush}
              disabled={pushing || !campaignName.trim()}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white gap-2"
            >
              {pushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {pushing ? "Creating campaign…" : "Create Campaign on Smartlead"}
            </Button>
            <p className="text-xs text-slate-600">Creates the campaign + 3 sequence steps. No leads are added.</p>
          </div>
        </>
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
