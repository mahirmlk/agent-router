import type { ReactNode } from "react";

interface HeaderStat {
  label: string;
  value: string;
  note: string;
}

interface AppHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  stats?: HeaderStat[];
}

export default function AppHeader({
  eyebrow,
  title,
  description,
  actions,
  stats = [],
}: AppHeaderProps) {
  return (
    <section className="glass-panel-strong page-enter overflow-hidden">
      <div className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
        <div className="space-y-4">
          <span className="eyebrow">{eyebrow}</span>
          <div className="space-y-3">
            <h1 className="page-title text-balance">{title}</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:items-end">
          {actions ? <div className="flex w-full justify-start xl:justify-end">{actions}</div> : null}
          {stats.length > 0 ? (
            <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto xl:min-w-[320px]">
              {stats.map((stat) => (
                <div key={stat.label} className="metric-card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">{stat.note}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
