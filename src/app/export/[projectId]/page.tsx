"use client";

import { use, useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepData {
  stepName: string;
  status: string;
  output: unknown;
  draftOutput: unknown;
}

interface CompanyProfile {
  name?: string;
  description?: string;
  primaryProduct?: string;
  targetAudience?: string;
  businessType?: string;
  geographicFocus?: string;
  keyDifferentiators?: string[];
  currentCustomerExamples?: string[];
}

interface ProjectData {
  websiteUrl: string;
  companyProfile: CompanyProfile | null;
  steps: StepData[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sv = (v: unknown): string =>
  typeof v === "string" ? v : typeof v === "number" ? String(v) : JSON.stringify(v);

const av = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function buildStepMap(steps: StepData[]) {
  const map: Record<string, unknown> = {};
  for (const step of steps) {
    const data =
      step.status === "AWAITING_APPROVAL"
        ? (step.draftOutput ?? step.output)
        : step.output;
    if (data && (step.status === "COMPLETE" || step.status === "AWAITING_APPROVAL")) {
      map[step.stepName] = data;
    }
  }
  return map;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExportPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const r = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
      if (!r.ok) { setError(true); return; }
      const d = await r.json();
      if (!d.project) { setError(true); return; }
      setProject(d.project);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  useEffect(() => {
    if (!loading && project) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [loading, project]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#7c3aed" }}>
          <Loader2 style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} />
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "14px" }}>Preparing export…</span>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "white" }}>
        <p style={{ fontFamily: "system-ui, sans-serif", color: "#6b7280", fontSize: "14px" }}>
          Could not load project. Please close this tab and try again.
        </p>
      </div>
    );
  }

  return <ExportDocument project={project} />;
}

// ─── Export document ──────────────────────────────────────────────────────────

function ExportDocument({ project }: { project: ProjectData }) {
  const stepMap = buildStepMap(project.steps);
  const profile = project.companyProfile;
  const markets = av((stepMap.TARGET_MARKETS as { markets?: unknown[] } | undefined)?.markets);
  const icps = av((stepMap.ICP as { icps?: unknown[] } | undefined)?.icps);
  const competitors = av((stepMap.COMPETITIVE as { competitors?: unknown[] } | undefined)?.competitors);
  const segments = av((stepMap.SEGMENTATION as { segments?: unknown[] } | undefined)?.segments);
  const industries = av((stepMap.INDUSTRY_PRIORITY as { industries?: unknown[] } | undefined)?.industries);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const manifesto = stepMap.MANIFESTO as any;

  const companyName = profile?.name ?? "GTM Strategy";
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: white; }
        body { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; color: #1a1a2e; }
        .page { max-width: 820px; margin: 0 auto; padding: 56px 64px; }

        h1 { font-size: 26pt; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
        h2 { font-size: 15pt; font-weight: 700; color: #2d1b69; margin: 32px 0 12px; border-bottom: 2px solid #e2d9f3; padding-bottom: 6px; }
        h3 { font-size: 12.5pt; font-weight: 600; color: #1a1a2e; margin: 0 0 8px; }
        h4 { font-size: 11pt; font-weight: 600; color: #4a3f7a; margin: 10px 0 3px; }
        p { line-height: 1.65; color: #374151; }

        .tagline { font-size: 13pt; font-style: italic; color: #6b5fa6; margin-bottom: 4px; }
        .meta { font-size: 9pt; color: #9ca3af; margin-bottom: 24px; font-family: system-ui, sans-serif; }
        .meta span { margin-right: 20px; }

        .lbl { display: block; font-size: 8pt; font-weight: 700; color: #6b5fa6; text-transform: uppercase; letter-spacing: 0.06em; font-family: system-ui, sans-serif; margin-bottom: 3px; }
        .val { font-size: 10pt; color: #374151; line-height: 1.55; }

        .pill { display: inline-block; font-size: 8pt; padding: 1px 7px; border-radius: 10px; margin-right: 4px; font-family: system-ui, sans-serif; font-weight: 600; }
        .tier-1 { background: #d1fae5; color: #065f46; }
        .tier-2 { background: #fef3c7; color: #92400e; }
        .tier-3 { background: #f3f4f6; color: #6b7280; }
        .threat-high { background: #fee2e2; color: #991b1b; }
        .threat-medium { background: #fef3c7; color: #92400e; }
        .threat-low { background: #d1fae5; color: #065f46; }
        .trend-gaining { background: #d1fae5; color: #065f46; }
        .trend-holding { background: #e0e7ff; color: #3730a3; }
        .trend-losing { background: #fee2e2; color: #991b1b; }
        .fit-high { background: #d1fae5; color: #065f46; }
        .fit-medium { background: #fef3c7; color: #92400e; }
        .fit-low { background: #fee2e2; color: #991b1b; }
        .pill-blue { background: #e0f2fe; color: #0369a1; }
        .pill-purple { background: #ede9fe; color: #5b21b6; }

        .card { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 14px; break-inside: avoid; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .meta-row { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 10px; font-family: system-ui, sans-serif; }
        .meta-item { font-size: 9.5pt; color: #374151; }
        .meta-item strong { color: #1a1a2e; }

        .hook { font-size: 11.5pt; font-style: italic; color: #4a3f7a; border-left: 3px solid #7c3aed; padding: 6px 14px; margin: 10px 0; line-height: 1.6; background: #f5f3ff; border-radius: 0 6px 6px 0; }
        .pain-box { background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; }

        hr.div { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }

        ul { padding-left: 16px; margin: 5px 0; }
        li { line-height: 1.6; color: #374151; font-size: 10pt; margin-bottom: 1px; }

        .persona-block { margin-top: 8px; padding: 8px 12px; border-left: 2px solid #e2d9f3; }
        .persona-title { font-weight: 600; font-size: 10pt; color: #1a1a2e; margin-bottom: 2px; }
        .persona-line { font-size: 9pt; color: #6b7280; line-height: 1.5; font-family: system-ui, sans-serif; }
        .persona-line strong { color: #4a3f7a; }

        .footer { margin-top: 48px; padding-top: 14px; border-top: 1px solid #e5e7eb; font-size: 8.5pt; color: #9ca3af; font-family: system-ui, sans-serif; display: flex; justify-content: space-between; }

        @media print {
          body { font-size: 10pt; }
          .page { padding: 16px 24px; max-width: 100%; }
          h2 { margin: 20px 0 10px; }
          .card { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <div className="page">
        {/* Header */}
        <h1>{companyName}</h1>
        {manifesto?.tagline && <p className="tagline">{sv(manifesto.tagline)}</p>}
        <p className="meta">
          <span>{project.websiteUrl}</span>
          <span>Exported {today}</span>
        </p>

        {manifesto?.elevatorPitch && (
          <p style={{ fontSize: "12pt", lineHeight: "1.7", color: "#374151", marginBottom: "8px" }}>
            {sv(manifesto.elevatorPitch)}
          </p>
        )}
        {!manifesto?.elevatorPitch && profile?.description && (
          <p style={{ fontSize: "12pt", lineHeight: "1.7", color: "#374151" }}>
            {profile.description}
          </p>
        )}

        <hr className="div" />

        {/* Manifesto */}
        {manifesto && (
          <>
            <h2>Messaging &amp; Positioning</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              {manifesto.who && (
                <div className="card" style={{ margin: 0 }}>
                  <span className="lbl">Who we serve</span>
                  <p className="val">{sv(manifesto.who)}</p>
                </div>
              )}
              {manifesto.whyChooseThem && (
                <div className="card" style={{ margin: 0 }}>
                  <span className="lbl">Why choose us</span>
                  <p className="val">{sv(manifesto.whyChooseThem)}</p>
                </div>
              )}
            </div>

            {av(manifesto.messagingPillars).length > 0 && (
              <>
                <h3 style={{ marginTop: "16px", marginBottom: "10px" }}>Messaging Pillars</h3>
                {av(manifesto.messagingPillars).map((p, idx) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const pillar = p as any;
                  return (
                    <div key={idx} className="card">
                      <h4>{sv(pillar.pillar)}</h4>
                      <p className="val" style={{ marginTop: "4px" }}>{sv(pillar.headline)}</p>
                      {av(pillar.supportingPoints).length > 0 && (
                        <ul style={{ marginTop: "8px" }}>
                          {av(pillar.supportingPoints).map((pt, i) => <li key={i}>{sv(pt)}</li>)}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </>
            )}
            <hr className="div" />
          </>
        )}

        {/* Target Markets */}
        {markets.length > 0 && (
          <>
            <h2>Target Markets</h2>
            {markets.map((m, idx) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const market = m as any;
              return (
                <div key={idx} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <h3>{sv(market.name)}</h3>
                    {market.priorityScore && (
                      <span style={{ fontSize: "9pt", color: "#6b5fa6", fontFamily: "system-ui, sans-serif" }}>
                        Priority: {sv(market.priorityScore)}/10
                      </span>
                    )}
                  </div>

                  {(market.whyNow || market.whyUs) && (
                    <div className="two-col" style={{ marginBottom: "12px" }}>
                      {market.whyNow && (
                        <div><span className="lbl">Why now</span><p className="val">{sv(market.whyNow)}</p></div>
                      )}
                      {market.whyUs && (
                        <div><span className="lbl">Why us</span><p className="val">{sv(market.whyUs)}</p></div>
                      )}
                    </div>
                  )}

                  <div className="two-col">
                    {av(market.urgentProblems).length > 0 && (
                      <div>
                        <span className="lbl">Urgent Problems</span>
                        <ul>{av(market.urgentProblems).map((p, i) => <li key={i}>{sv(p)}</li>)}</ul>
                      </div>
                    )}
                    {av(market.macroTrends).length > 0 && (
                      <div>
                        <span className="lbl">Macro Trends</span>
                        <ul>{av(market.macroTrends).map((t, i) => <li key={i}>{sv(t)}</li>)}</ul>
                      </div>
                    )}
                  </div>

                  {market.whyRightMarket && (
                    <p className="val" style={{ marginTop: "10px", fontSize: "9.5pt", color: "#6b7280" }}>
                      {sv(market.whyRightMarket)}
                    </p>
                  )}
                </div>
              );
            })}
            <hr className="div" />
          </>
        )}

        {/* Market Segments */}
        {segments.length > 0 && (
          <>
            <h2>Market Segments &amp; Positioning</h2>
            {segments.map((seg, idx) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const segment = seg as any;
              const priority = sv(segment.estimatedPriority ?? "");
              const pos = segment.positioning;
              const tierClass = priority === "tier-1" ? "tier-1" : priority === "tier-2" ? "tier-2" : "tier-3";
              return (
                <div key={idx} className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <h3>{sv(segment.name)}</h3>
                    <span className={`pill ${tierClass}`}>{priority}</span>
                    <span className="pill pill-purple">{sv(segment.sizeCategory)}</span>
                    {segment.buyingMotion && (
                      <span className="pill pill-blue">{sv(segment.buyingMotion)}</span>
                    )}
                  </div>

                  {segment.painMultiplier && (
                    <div className="pain-box">
                      <span className="lbl">Pain Multiplier</span>
                      <p className="val">{sv(segment.painMultiplier)}</p>
                    </div>
                  )}

                  {pos?.messagingHook && <p className="hook">&ldquo;{sv(pos.messagingHook)}&rdquo;</p>}

                  {segment.rationale && (
                    <p className="val" style={{ marginBottom: "10px" }}>{sv(segment.rationale)}</p>
                  )}

                  <div className="two-col" style={{ marginBottom: pos?.ourAngle ? "10px" : "0" }}>
                    {av(pos?.keyPainPoints).length > 0 && (
                      <div>
                        <span className="lbl">Key Pain Points</span>
                        <ul>{av(pos?.keyPainPoints).map((p, i) => <li key={i}>{sv(p)}</li>)}</ul>
                      </div>
                    )}
                    {av(pos?.proofPoints).length > 0 && (
                      <div>
                        <span className="lbl">Proof Points</span>
                        <ul>{av(pos?.proofPoints).map((p, i) => <li key={i}>{sv(p)}</li>)}</ul>
                      </div>
                    )}
                  </div>

                  {pos?.ourAngle && (
                    <div style={{ marginTop: "10px" }}>
                      <span className="lbl">Our Angle</span>
                      <p className="val">{sv(pos.ourAngle)}</p>
                    </div>
                  )}
                  {pos?.ctaApproach && (
                    <div style={{ marginTop: "8px" }}>
                      <span className="lbl">CTA</span>
                      <p className="val">{sv(pos.ctaApproach)}</p>
                    </div>
                  )}
                </div>
              );
            })}
            <hr className="div" />
          </>
        )}

        {/* ICPs */}
        {icps.length > 0 && (
          <>
            <h2>Ideal Customer Profiles</h2>
            {icps.map((icp, idx) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const i = icp as any;
              const firmographics = i.firmographics;
              return (
                <div key={idx} className="card">
                  <h3>{sv(i.niche)}</h3>
                  <div className="meta-row">
                    <span className="meta-item"><strong>Industry:</strong> {sv(i.standardIndustry)}</span>
                    {i.engagementModel && <span className="meta-item"><strong>Buying model:</strong> {sv(i.engagementModel)}</span>}
                    {av(firmographics?.companySize).length > 0 && (
                      <span className="meta-item"><strong>Size:</strong> {av(firmographics?.companySize).map(sv).join(", ")}</span>
                    )}
                    {av(firmographics?.geographies).length > 0 && (
                      <span className="meta-item"><strong>Geo:</strong> {av(firmographics?.geographies).map(sv).join(", ")}</span>
                    )}
                  </div>

                  <div className="two-col">
                    {av(i.decisionCriteria).length > 0 && (
                      <div>
                        <span className="lbl">Decision Criteria</span>
                        <ul>{av(i.decisionCriteria).map((c, ci) => <li key={ci}>{sv(c)}</li>)}</ul>
                      </div>
                    )}
                    {av(i.lossReasons).length > 0 && (
                      <div>
                        <span className="lbl">Objections to Pre-empt</span>
                        <ul>{av(i.lossReasons).map((r, ri) => <li key={ri}>{sv(r)}</li>)}</ul>
                      </div>
                    )}
                  </div>

                  {av(i.buyerPersonas).length > 0 && (
                    <div style={{ marginTop: "12px" }}>
                      <span className="lbl">Buyer Personas</span>
                      {av(i.buyerPersonas).map((persona, pi) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const bp = persona as any;
                        return (
                          <div key={pi} className="persona-block">
                            <p className="persona-title">{sv(bp.title)}</p>
                            {av(bp.goals).length > 0 && (
                              <p className="persona-line">
                                <strong>Goals:</strong> {av(bp.goals).map(sv).join(" · ")}
                              </p>
                            )}
                            {av(bp.challenges).length > 0 && (
                              <p className="persona-line">
                                <strong>Challenges:</strong> {av(bp.challenges).map(sv).join(" · ")}
                              </p>
                            )}
                            {av(bp.triggerEvents).length > 0 && (
                              <p className="persona-line">
                                <strong>Triggers:</strong> {av(bp.triggerEvents).map(sv).join(" · ")}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <hr className="div" />
          </>
        )}

        {/* Competitive Landscape */}
        {competitors.length > 0 && (
          <>
            <h2>Competitive Landscape</h2>
            {competitors.map((comp, idx) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const c = comp as any;
              const threat = sv(c.threatLevel ?? "");
              const trend = sv(c.edgeTrend ?? "");
              return (
                <div key={idx} className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <h3>{sv(c.name)}</h3>
                    {c.domain && (
                      <span style={{ fontSize: "9pt", color: "#9ca3af", fontFamily: "system-ui, sans-serif" }}>
                        {sv(c.domain)}
                      </span>
                    )}
                    {threat && <span className={`pill threat-${threat}`}>Threat: {threat}</span>}
                    {trend && <span className={`pill trend-${trend}`}>{trend}</span>}
                  </div>

                  {c.valueProp && <p className="val" style={{ marginBottom: "10px" }}>{sv(c.valueProp)}</p>}

                  <div className="two-col">
                    {av(c.whereTheyWin).length > 0 && (
                      <div>
                        <span className="lbl">Where they win</span>
                        <ul>{av(c.whereTheyWin).map((w, wi) => <li key={wi}>{sv(w)}</li>)}</ul>
                      </div>
                    )}
                    {av(c.whereClientWins).length > 0 && (
                      <div>
                        <span className="lbl">Where we win</span>
                        <ul>{av(c.whereClientWins).map((w, wi) => <li key={wi}>{sv(w)}</li>)}</ul>
                      </div>
                    )}
                  </div>

                  {c.pricingModel && (
                    <p style={{ fontSize: "9.5pt", color: "#6b7280", marginTop: "8px", fontFamily: "system-ui, sans-serif" }}>
                      <strong>Pricing:</strong> {sv(c.pricingModel)}
                    </p>
                  )}
                </div>
              );
            })}
            <hr className="div" />
          </>
        )}

        {/* Industry Priorities */}
        {industries.length > 0 && (
          <>
            <h2>Industry Priorities</h2>
            {industries.map((ind, idx) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const industry = ind as any;
              const fit = sv(industry.estimatedMarketFit ?? "");
              return (
                <div key={idx} className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <h3>{sv(industry.niche)}</h3>
                    <span style={{ fontSize: "9pt", color: "#6b7280", fontFamily: "system-ui, sans-serif" }}>
                      {sv(industry.standardIndustry)}
                    </span>
                    {fit && <span className={`pill fit-${fit}`}>Fit: {fit}</span>}
                  </div>
                  {industry.howTheyWorkTogether && (
                    <p className="val" style={{ marginBottom: "8px" }}>{sv(industry.howTheyWorkTogether)}</p>
                  )}
                  {av(industry.painPoints).length > 0 && (
                    <>
                      <span className="lbl">Pain Points</span>
                      <ul>{av(industry.painPoints).map((p, pi) => <li key={pi}>{sv(p)}</li>)}</ul>
                    </>
                  )}
                </div>
              );
            })}
            <hr className="div" />
          </>
        )}

        {/* Company Profile */}
        {profile && (
          <>
            <h2>Company Profile</h2>
            <div className="card">
              <div className="two-col">
                {profile.primaryProduct && (
                  <div><span className="lbl">Primary Product</span><p className="val">{profile.primaryProduct}</p></div>
                )}
                {profile.targetAudience && (
                  <div><span className="lbl">Target Audience</span><p className="val">{profile.targetAudience}</p></div>
                )}
                {profile.businessType && (
                  <div><span className="lbl">Business Type</span><p className="val">{profile.businessType}</p></div>
                )}
                {profile.geographicFocus && (
                  <div><span className="lbl">Geographic Focus</span><p className="val">{profile.geographicFocus}</p></div>
                )}
              </div>

              {profile.keyDifferentiators && profile.keyDifferentiators.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <span className="lbl">Key Differentiators</span>
                  <ul>{profile.keyDifferentiators.map((d, i) => <li key={i}>{d}</li>)}</ul>
                </div>
              )}
              {profile.currentCustomerExamples && profile.currentCustomerExamples.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <span className="lbl">Current Customer Examples</span>
                  <ul>{profile.currentCustomerExamples.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
              )}
            </div>
          </>
        )}

        <div className="footer">
          <span>GTM Planning Tool</span>
          <span>{today}</span>
        </div>
      </div>
    </>
  );
}
