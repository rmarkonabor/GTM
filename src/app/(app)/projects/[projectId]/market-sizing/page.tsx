"use client";

import { use, useState } from "react";
import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Building2, Users, Download, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompanyPreview {
  name: string;
  industry: string;
  employeeCount: string;
  revenue: string;
  location: string;
  domain: string;
  linkedinUrl: string;
}

interface MarketSizeResult {
  segmentName: string;
  database: string;
  tam_companies: number;
  sam_companies: number;
  som_companies: number;
  tam_contacts: number;
  sam_contacts: number;
  som_contacts: number;
  companyPreview?: CompanyPreview[];
}

interface MarketSizingOutput {
  results: MarketSizeResult[];
  totalTAM_companies: number;
  totalSAM_companies: number;
  totalSOM_companies: number;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const COLORS = ["#7c3aed", "#a855f7", "#c084fc"];

function downloadCSV(results: MarketSizeResult[]) {
  const headers = ["Segment", "Company Name", "Industry", "Employee Count", "Revenue", "Location", "Domain", "LinkedIn"];
  const rows: string[][] = [];

  for (const r of results) {
    for (const c of r.companyPreview ?? []) {
      rows.push([r.segmentName, c.name, c.industry, c.employeeCount, c.revenue, c.location, c.domain, c.linkedinUrl]);
    }
  }

  if (!rows.length) return;

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "market-sizing-companies.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function CompanyTable({ results }: { results: MarketSizeResult[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const hasAny = results.some((r) => (r.companyPreview ?? []).length > 0);
  if (!hasAny) return null;

  const toggle = (seg: string) =>
    setExpanded((prev) => ({ ...prev, [seg]: prev[seg] === false ? true : false }));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Company Preview</h3>
          <p className="text-xs text-slate-400 mt-0.5">Sample of matching companies from Apollo · up to 25 per segment</p>
        </div>
        <Button
          variant="outline"
          onClick={() => downloadCSV(results)}
          className="border-white/20 text-slate-300 hover:text-white gap-2 text-sm"
        >
          <Download className="h-4 w-4" />
          Download CSV
        </Button>
      </div>

      {results.map((r) => {
        const companies = r.companyPreview ?? [];
        if (!companies.length) return null;
        const isOpen = expanded[r.segmentName] !== false;

        return (
          <div key={r.segmentName}>
            <button
              onClick={() => toggle(r.segmentName)}
              className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {r.segmentName}{" "}
                <span className="text-slate-400 font-normal">({companies.length} companies)</span>
              </span>
              {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>

            {isOpen && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10">
                      {["Company Name", "Industry", "Employees", "Revenue", "Location", "Domain", "LinkedIn"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white whitespace-nowrap">{c.name || "—"}</td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{c.industry || "—"}</td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{c.employeeCount || "—"}</td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{c.revenue || "—"}</td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{c.location || "—"}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {c.domain ? (
                            <a href={`https://${c.domain}`} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
                              {c.domain} <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {c.linkedinUrl ? (
                            <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 flex items-center gap-1 text-xs">
                              LinkedIn <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MarketSizingPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Market Sizing</h1>
      <p className="text-slate-500 text-sm mb-6">Real account counts from Apollo.io. Not AI estimates.</p>

      <StepPageWrapper projectId={projectId} stepName="MARKET_SIZING" stepLabel="Market Sizing">
        {(output) => {
          const data = output as MarketSizingOutput;
          const totalChartData = [
            { name: "TAM", value: data.totalTAM_companies },
            { name: "SAM", value: data.totalSAM_companies },
            { name: "SOM", value: data.totalSOM_companies },
          ];

          return (
            <div className="space-y-6">
              {/* Total summary */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "TAM", sub: "Total Addressable Market", value: data.totalTAM_companies, colorClass: "text-violet-400" },
                  { label: "SAM", sub: "Serviceable Addressable", value: data.totalSAM_companies, colorClass: "text-purple-400" },
                  { label: "SOM", sub: "Serviceable Obtainable", value: data.totalSOM_companies, colorClass: "text-fuchsia-400" },
                ].map((m) => (
                  <div key={m.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5 text-center">
                    <p className="text-xs text-slate-400 mb-1">{m.sub}</p>
                    <p className={`text-3xl font-bold ${m.colorClass}`}>{fmt(m.value)}</p>
                    <p className="text-sm text-slate-500 mt-1">{m.label} Companies</p>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">TAM → SAM → SOM</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={totalChartData}>
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis tickFormatter={fmt} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip formatter={(v) => [fmt(Number(v)), "Companies"]} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {totalChartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Per-segment breakdown */}
              <div className="space-y-4">
                {data.results.map((r) => (
                  <div key={r.segmentName} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{r.segmentName}</h3>
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded capitalize">{r.database}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-slate-400 uppercase">
                          <Building2 className="h-3 w-3" /> Companies
                        </div>
                        <div className="flex gap-4 text-sm">
                          <Stat label="TAM" value={fmt(r.tam_companies)} />
                          <Stat label="SAM" value={fmt(r.sam_companies)} />
                          <Stat label="SOM" value={fmt(r.som_companies)} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-slate-400 uppercase">
                          <Users className="h-3 w-3" /> Contacts
                        </div>
                        <div className="flex gap-4 text-sm">
                          <Stat label="TAM" value={fmt(r.tam_contacts)} />
                          <Stat label="SAM" value={fmt(r.sam_contacts)} />
                          <Stat label="SOM" value={fmt(r.som_contacts)} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Company preview table */}
              <CompanyTable results={data.results} />
            </div>
          );
        }}
      </StepPageWrapper>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
