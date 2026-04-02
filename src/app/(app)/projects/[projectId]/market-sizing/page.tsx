"use client";

import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Building2, Users } from "lucide-react";

interface MarketSizeResult {
  segmentName: string;
  database: string;
  tam_companies: number;
  sam_companies: number;
  som_companies: number;
  tam_contacts: number;
  sam_contacts: number;
  som_contacts: number;
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

export default function MarketSizingPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Market Sizing</h1>
      <p className="text-slate-500 text-sm mb-6">Real account counts from Apollo.io / Clay. Not AI estimates.</p>

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
                  { label: "TAM", sub: "Total Addressable Market", value: data.totalTAM_companies, color: "violet" },
                  { label: "SAM", sub: "Serviceable Addressable", value: data.totalSAM_companies, color: "purple" },
                  { label: "SOM", sub: "Serviceable Obtainable", value: data.totalSOM_companies, color: "fuchsia" },
                ].map((m) => (
                  <div key={m.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5 text-center">
                    <p className="text-xs text-slate-400 mb-1">{m.sub}</p>
                    <p className={`text-3xl font-bold text-${m.color}-400`}>{fmt(m.value)}</p>
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
