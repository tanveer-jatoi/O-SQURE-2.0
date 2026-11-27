const COLOR_ACCENTS = {
  indigo: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-slate-100 text-slate-700',
};

export function StatCard({ title, value, subtitle, icon: Icon, accent = 'indigo' }) {
  const accentClass = COLOR_ACCENTS[accent] || COLOR_ACCENTS.indigo;

  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
