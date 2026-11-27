const VARIANT_STYLES = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  info: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20',
};

export function StatusBadge({ label, variant = 'neutral' }) {
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
}
