import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Globe, Target, Users, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-violet-400" />
          <span className="font-bold text-lg">NABOR AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-8">
          <Zap className="h-3.5 w-3.5" />
          AI-powered GTM strategy in minutes
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
          Your complete GTM strategy,<br />built from your website
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Enter your website URL. Our AI researches your company, identifies your best markets,
          defines ideal customer profiles, and delivers a battle-ready GTM strategy.
        </p>

        <Link href="/sign-in">
          <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white px-8 gap-2">
            Start for free
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Globe,
              title: "AI-Powered Research",
              desc: "Paste your URL. Our AI scrapes and analyzes your product, audience, and differentiators — then asks only what it can't figure out.",
            },
            {
              icon: Target,
              title: "ICP & Market Definition",
              desc: "Get industry-specific ICPs with firmographics, buyer personas, and pain points that actually match your offering.",
            },
            {
              icon: BarChart3,
              title: "Segments & Positioning",
              desc: "AI-generated market segments with targeted positioning, messaging hooks, and proof points for each.",
            },
            {
              icon: Users,
              title: "Competitive Analysis",
              desc: "Know who you're fighting for every segment. Value props, key offerings, where you win, where they win.",
            },
            {
              icon: Zap,
              title: "Positioning & Messaging",
              desc: "Walk away with a positioning statement, messaging pillars, tagline, and elevator pitch.",
            },
            {
              icon: ArrowRight,
              title: "Bring Your Own LLM",
              desc: "Use OpenAI, Anthropic, or Google Gemini with your own API key. Smart tiered routing keeps costs low.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/8 transition-colors"
            >
              <f.icon className="h-8 w-8 text-violet-400 mb-3" />
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
