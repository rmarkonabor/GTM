"use client";
import { use } from "react";
import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { Quote, Zap } from "lucide-react";

interface MessagingPillar {
  pillar: string;
  headline: string;
  supportingPoints: string[];
}

interface ManifestoOutput {
  who: string;
  whyExist: string;
  whatTheyDo: string;
  whyChooseThem: string;
  tagline: string;
  elevatorPitch: string;
  messagingPillars: MessagingPillar[];
}

export default function ManifestoPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Manifesto &amp; Messaging</h1>
      <p className="text-slate-500 text-sm mb-6">Your brand voice, messaging pillars, and elevator pitch.</p>

      <StepPageWrapper projectId={projectId} stepName="MANIFESTO" stepLabel="Manifesto">
        {(output) => {
          const m = output as ManifestoOutput;
          return (
            <div className="space-y-6">
              {/* Tagline */}
              <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl p-8 text-center">
                <Zap className="h-8 w-8 text-white/70 mx-auto mb-3" />
                <p className="text-3xl font-bold text-white">{m.tagline}</p>
              </div>

              {/* Core messaging */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Who we serve", value: m.who },
                  { label: "Why we exist", value: m.whyExist },
                  { label: "What we do", value: m.whatTheyDo },
                  { label: "Why choose us", value: m.whyChooseThem },
                ].map((item) => (
                  <div key={item.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{item.label}</h3>
                    <p className="text-slate-700 dark:text-slate-300 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Elevator pitch */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Quote className="h-4 w-4 text-violet-400" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">Elevator Pitch</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{m.elevatorPitch}</p>
              </div>

              {/* Messaging pillars */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Messaging Pillars</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {m.messagingPillars.map((p) => (
                    <div key={p.pillar} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5">
                      <div className="inline-flex items-center bg-violet-500/10 text-violet-400 text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
                        {p.pillar}
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white mb-3">{p.headline}</p>
                      <ul className="space-y-1.5">
                        {p.supportingPoints.map((sp, i) => (
                          <li key={i} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                            {sp}
                          </li>
                        ))}
                      </ul>
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
