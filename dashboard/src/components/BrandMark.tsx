interface BrandMarkProps {
  className?: string;
  compact?: boolean;
}

export default function BrandMark({
  className = "",
  compact = false,
}: BrandMarkProps) {
  if (compact) {
    return (
      <div className={`inline-flex min-w-0 items-center ${className}`.trim()}>
        <p className="font-brand text-xl font-extrabold tracking-[-0.08em] text-slate-950">
          S.
        </p>
      </div>
    );
  }

  return (
    <div className={`inline-flex min-w-0 flex-col leading-none ${className}`.trim()}>
      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
        Agent Router
      </p>
      <p className="font-brand mt-2 truncate text-[2.1rem] font-extrabold tracking-[-0.08em] text-slate-950">
        Studio.
      </p>
    </div>
  );
}
