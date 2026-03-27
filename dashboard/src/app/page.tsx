import Link from "next/link";
import ChatWindowButton from "@/components/ChatWindowButton";
import { modelTiers, routePresets } from "@/lib/dashboard-data";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Layers3,
  MessageSquare,
  PlugZap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const workspaceCards = [
  {
    href: "/models",
    title: "Models",
    note: "Inspect the routing tiers, default models, and where each route is best used.",
    icon: Layers3,
  },
  {
    href: "/history",
    title: "History",
    note: "Review recent prompts, model decisions, latency, and routing outcomes.",
    icon: Clock3,
  },
  {
    href: "/providers",
    title: "Provider",
    note: "Set the OpenRouter key override, base URL, and visible model ids for chat.",
    icon: PlugZap,
  },
];

const featureRows = [
  {
    title: "Tiered routing",
    detail: "Classifies prompts and moves them across simple, intermediate, and hard tiers instead of sending everything to one expensive model.",
  },
  {
    title: "Separate chat workspace",
    detail: "Keeps the routed chat in its own window so operations pages stay available while conversations continue.",
  },
  {
    title: "OpenRouter control",
    detail: "Runs chat through a FastAPI backend that owns transport, model calls, and workflow execution.",
  },
  {
    title: "Operational visibility",
    detail: "Tracks recent routing history, surfaced model choice, token use, and request latency in one place.",
  },
];

export default function Home() {
  return (
    <div className="space-y-6 font-reference">
      <section className="glass-panel-strong overflow-hidden px-6 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_24rem]">
          <div className="page-enter">
            <div className="flex items-center gap-3">
              <span className="eyebrow">Overview</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" />
                Router online
              </span>
            </div>

            <h1 className="reference-title mt-8 max-w-4xl text-balance text-[clamp(2.35rem,5.3vw,4.15rem)] text-slate-950">
              Route the right prompt to the right model.
            </h1>

            <p className="mt-5 max-w-3xl text-[15px] leading-8 font-medium text-slate-600 sm:text-base">
              Agent Router is a multipage control surface for model routing. Next.js handles the UI only, while a FastAPI service runs the backend workflow, LLM integrations, and routing logic behind a dedicated API boundary.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ChatWindowButton
                className="pill pill-active"
                aria-label="Open chat in a separate window"
              >
                <MessageSquare className="h-4 w-4" />
                Open chat
              </ChatWindowButton>
              <Link href="/providers" className="pill">
                <PlugZap className="h-4 w-4" />
                Manage providers
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="metric-card">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Routing tiers
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  {modelTiers.length}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Simple, intermediate, and hard decision paths.
                </p>
              </div>

              <div className="metric-card">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Routing modes
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  {routePresets.length}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Balanced, economy, and quality operating modes.
                </p>
              </div>

              <div className="metric-card">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Provider lanes
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  1
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Frontend requests travel over HTTP to the FastAPI backend on `/api/chat`.
                </p>
              </div>
            </div>
          </div>

          <aside className="glass-soft p-5 sm:p-6">
            <p className="section-title">What it does</p>
            <div className="mt-5 space-y-4">
              {featureRows.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-[24px] border border-white/80 bg-white/78 px-4 py-4"
                >
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-slate-500" />
                    <p className="text-sm font-bold text-slate-900">{feature.title}</p>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{feature.detail}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="glass-panel p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-title">Workspace</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                Core pages
              </h2>
            </div>
            <span className="rounded-full border border-white/80 bg-white/82 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Main app
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {workspaceCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group rounded-[28px] border border-white/80 bg-white/76 p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(148,163,184,0.12)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-950 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{card.note}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    Open
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="glass-panel p-6 sm:p-7">
          <p className="section-title">Operational profile</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[24px] border border-white/80 bg-white/78 px-4 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-bold text-slate-900">Default path</p>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Simple prompts stay on the default OpenRouter-backed Llama route behind FastAPI.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/80 bg-white/78 px-4 py-4">
              <div className="flex items-center gap-2">
                <PlugZap className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-bold text-slate-900">Provider control</p>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                OpenRouter settings decide which model ids are available inside the separate chat window.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/80 bg-white/78 px-4 py-4">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-bold text-slate-900">Review loop</p>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Use Models, History, and the OpenRouter settings together to tune cost, quality, and reliability.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
