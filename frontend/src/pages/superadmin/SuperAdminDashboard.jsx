import { useEffect, useState } from 'react';
import { Activity, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { StatCard } from '../../components/StatCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';

export function SuperAdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadSummary() {
      try {
        const res = await axiosClient.get('/dashboard/summary');
        if (active) setSummary(res.data?.data);
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || 'Failed to load system metrics.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSummary();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingSpinner label="Loading system telemetry..." />;

  const stats = summary?.stats || {};
  const byRole = stats.byRole || {};
  const recentLogs = summary?.recentAuditLogs || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Super Admin Control Center</h1>
        <p className="mt-1 text-sm text-slate-500">
          System-wide identity overview, privilege metrics, and live security audit activity.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total User Accounts"
          value={stats.totalUsers ?? 0}
          subtitle={`${stats.activeUsers ?? 0} active accounts`}
          icon={Users}
          accent="indigo"
        />
        <StatCard
          title="Campus Admins"
          value={byRole.admin ?? 0}
          subtitle={`${byRole.superadmin ?? 0} super admin(s)`}
          icon={ShieldCheck}
          accent="emerald"
        />
        <StatCard
          title="Faculty & Students"
          value={(byRole.teacher ?? 0) + (byRole.student ?? 0)}
          subtitle={`${byRole.teacher ?? 0} teachers • ${byRole.student ?? 0} students`}
          icon={UserCheck}
          accent="amber"
        />
        <StatCard
          title="API Server Uptime"
          value={`${stats.uptimeSeconds ?? 0}s`}
          subtitle="Node.js Express REST API"
          icon={Activity}
          accent="slate"
        />
      </div>

      <div className="card-surface overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Recent Security Audit Events</h2>
        </div>
        {recentLogs.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            No audit events recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {log.actorUserId?.fullName || 'Anonymous'}
                    </td>
                    <td className="px-4 py-3 uppercase text-xs text-slate-500">
                      {log.actorRole}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {log.ipAddress}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={log.status}
                        variant={log.status === 'success' ? 'success' : 'danger'}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
