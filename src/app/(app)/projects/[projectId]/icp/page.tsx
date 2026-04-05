import { StepPageWrapper } from "@/components/shared/StepPageWrapper";
import { Badge } from "@/components/ui/badge";
import { Building2, User, MapPin, Cpu, DollarSign, Target } from "lucide-react";

interface Firmographics {
  companySize: string[];
  revenue: string[];
  geographies: string[];
  industries: string[];
  technologies: string[];
  businessModels: string[];
}

interface BuyerPersona {
  title: string;
  seniorities: string[];
  departments: string[];
  goals: string[];
  challenges: string[];
  triggerEvents: string[];
}

interface ICPDefinition {
  industryName: string;
  firmographics: Firmographics;
  buyerPersonas: BuyerPersona[];
}

export default async function ICPPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
        Ideal Customer Profile (ICP)
      </h1>
      <p className="text-slate-500 text-sm mb-6">
        Firmographics and buyer personas per industry — ready for Apollo/ZoomInfo filtering.
      </p>

      <StepPageWrapper projectId={projectId} stepName="ICP" stepLabel="ICP">
        {(output) => {
          const { icps } = output as { icps: ICPDefinition[] };
          return (
            <div className="space-y-8">
              {icps.map((icp) => (
                <div key={icp.industryName}>
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-4 w-4 text-violet-400" />
                    <h2 className="font-bold text-slate-900 dark:text-white text-lg">{icp.industryName}</h2>
                  </div>

                  {/* Firmographics */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6 mb-4">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                      <Target className="h-4 w-4 text-violet-400" />
                      Firmographics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <ChipGroup icon={Building2} label="Company Size" items={icp.firmographics.companySize} />
                      <ChipGroup icon={DollarSign} label="Revenue" items={icp.firmographics.revenue} />
                      <ChipGroup icon={MapPin} label="Geographies" items={icp.firmographics.geographies} />
                      <ChipGroup icon={Building2} label="Industries" items={icp.firmographics.industries} />
                      <ChipGroup icon={Cpu} label="Technologies" items={icp.firmographics.technologies} />
                      <ChipGroup icon={Target} label="Business Models" items={icp.firmographics.businessModels} />
                    </div>
                  </div>

                  {/* Buyer Personas */}
                  <div className="space-y-3">
                    {icp.buyerPersonas.map((persona) => (
                      <div
                        key={persona.title}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <User className="h-4 w-4 text-violet-400" />
                          <h4 className="font-semibold text-slate-900 dark:text-white">{persona.title}</h4>
                          <div className="flex gap-1 ml-2">
                            {persona.seniorities.map((s) => (
                              <Badge key={s} className="bg-violet-500/10 text-violet-400 text-xs capitalize">{s}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <BulletList title="Goals" items={persona.goals} color="green" />
                          <BulletList title="Challenges" items={persona.challenges} color="red" />
                          <BulletList title="Trigger Events" items={persona.triggerEvents} color="blue" />
                        </div>
                      </div>
                    ))}
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

function ChipGroup({ icon: Icon, label, items }: { icon: React.ElementType; label: string; items: string[] }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="h-3 w-3 text-slate-400" />
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span key={item} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-xs">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

const COLOR_BG: Record<string, string> = {
  green: "bg-green-400", red: "bg-red-400", blue: "bg-blue-400",
  yellow: "bg-yellow-400", violet: "bg-violet-400", purple: "bg-purple-400",
};

function BulletList({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div>
      <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</h5>
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
