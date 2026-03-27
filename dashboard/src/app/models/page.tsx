import AppHeader from "@/components/AppHeader";
import { modelTiers, routePresets } from "@/lib/dashboard-data";
import { ArrowUpRight, Shield, Sparkles } from "lucide-react";

export default function ModelsPage() {
  return (
    <div className="space-y-6">
      <AppHeader
        eyebrow="Models"
        title="A routing catalog with intent."
        description="Each tier is now presented as an operator-facing system instead of a flat table. You can compare latency posture, cost profile, reliability, and the kinds of prompts each route is meant to absorb."
        stats={[
          {
            label: "Model pool",
            value: "9",
            note: "Three tiers with a deliberate mix of free and premium capacity.",
          },
          {
            label: "Free coverage",
            value: "62%",
            note: "Most short-form traffic stays inside the zero-cost path.",
          },
          {
            label: "Operating modes",
            value: `${routePresets.length}`,
            note: "Balanced, economy, and quality presets shape final selection.",
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-6">
          {modelTiers.map((tier) => (
            <article key={tier.name} className="glass-panel-strong overflow-hidden">
              <div className="grid gap-5 border-b border-white/70 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-center">
                <div>
                  <span className="eyebrow">{tier.badge}</span>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                      {tier.name}
                    </h2>
                    <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {tier.models.length} models
                    </span>
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600">
                    {tier.summary}
                  </p>
                </div>

                <div
                  className={`rounded-[28px] bg-gradient-to-br ${tier.accent} p-5 text-white shadow-[0_20px_60px_rgba(51,65,85,0.18)]`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                    Tier snapshot
                  </p>
                  <div className="mt-4 space-y-3 text-sm text-white/85">
                    <div className="flex items-center justify-between">
                      <span>Average latency</span>
                      <span className="font-semibold text-white">{tier.avgLatency}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Coverage</span>
                      <span className="font-semibold text-white">{tier.coverage}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-3">
                {tier.models.map((model) => (
                  <div key={model.id} className="glass-soft p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold tracking-tight text-slate-900">
                          {model.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{model.provider}</p>
                      </div>
                      <div className="rounded-2xl border border-white/85 bg-white/78 p-2.5">
                        <ArrowUpRight className="h-4 w-4 text-slate-500" />
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-600">{model.strength}</p>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-white/82 bg-white/72 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                          Cost
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">{model.cost}</p>
                      </div>
                      <div className="rounded-2xl border border-white/82 bg-white/72 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                          Context
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">{model.context}</p>
                      </div>
                      <div className="rounded-2xl border border-white/82 bg-white/72 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                          Latency
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">{model.latency}</p>
                      </div>
                      <div className="rounded-2xl border border-white/82 bg-white/72 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                          Reliability
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">{model.reliability}</p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[22px] border border-dashed border-slate-200 bg-white/68 px-3.5 py-3">
                      <p className="font-mono text-[11px] leading-6 text-slate-500">
                        {model.id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <aside className="space-y-6">
          <div className="glass-panel p-5 sm:p-6">
            <p className="section-title">Routing policy</p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
              <div className="rounded-[24px] border border-white/80 bg-white/72 p-4">
                <p className="font-semibold text-slate-900">1. Classify the prompt</p>
                <p className="mt-2">
                  The system estimates whether the request is simple, intermediate, or hard before model selection.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/80 bg-white/72 p-4">
                <p className="font-semibold text-slate-900">2. Apply the preset</p>
                <p className="mt-2">
                  Balanced keeps the middle path, economy prefers cheaper routes, and quality escalates faster.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/80 bg-white/72 p-4">
                <p className="font-semibold text-slate-900">3. Deliver with fallback</p>
                <p className="mt-2">
                  Each tier keeps multiple models available so routing can remain resilient when a provider degrades.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-500" />
              <p className="section-title">Operator notes</p>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <li>Keep free-tier capacity as the default for low-risk requests.</li>
              <li>Use the quality preset when prompts imply architecture, debugging, or long context.</li>
              <li>Review history frequently to confirm the classifier is not over-escalating.</li>
            </ul>
          </div>

          <div className="glass-panel p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-slate-500" />
              <p className="section-title">Why this view matters</p>
            </div>
            <p className="mt-4 text-sm leading-8 text-slate-600">
              The models screen now behaves more like a control room: fewer generic rows, more context about what each route is meant to handle and how aggressively the system should reach for it.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
