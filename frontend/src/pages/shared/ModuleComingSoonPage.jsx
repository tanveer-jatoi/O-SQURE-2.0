import { Construction } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState.jsx';

export function ModuleComingSoonPage({ title, phase }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Scheduled for implementation in {phase}.
        </p>
      </div>
      <EmptyState
        icon={Construction}
        title={`${title} — Ready for ${phase}`}
        description="The navigation route, RBAC guard, and layout shell are active. Full database models, REST APIs, and interactive UI will be built in the scheduled phase."
      />
    </div>
  );
}
