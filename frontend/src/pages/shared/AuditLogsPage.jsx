import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const res = await axiosClient.get('/audit-logs', {
          params: {
            page: pageNum,
            limit: 25,
            status: statusFilter || undefined,
            actorRole: roleFilter || undefined,
          },
        });
        setLogs(res.data?.data?.logs || []);
        setMeta(res.data?.meta || { page: 1, totalPages: 1, total: 0 });
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, roleFilter]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (l) => <span className="text-xs text-slate-500">{new Date(l.timestamp).toLocaleString()}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      render: (l) => <span className="font-mono text-xs font-semibold text-slate-800">{l.action}</span>,
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (l) => l.actorUserId?.fullName || 'Anonymous',
    },
    {
      key: 'actorRole',
      header: 'Role',
      render: (l) => <span className="text-xs uppercase text-slate-500">{l.actorRole}</span>,
    },
    {
      key: 'targetEntity',
      header: 'Target',
      render: (l) => `${l.targetEntity}${l.targetEntityId ? ` (${l.targetEntityId.slice(-6)})` : ''}`,
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (l) => <span className="font-mono text-xs">{l.ipAddress}</span>,
    },
    {
      key: 'status',
      header: 'Outcome',
      render: (l) => (
        <StatusBadge
          label={l.status}
          variant={l.status === 'success' ? 'success' : 'danger'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security Audit Trail</h1>
        <p className="mt-1 text-sm text-slate-500">
          Immutable log of authentication attempts, account updates, and sensitive ERP operations.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={logs}
        isLoading={loading}
        filterSlot={
          <>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field w-40 py-2"
            >
              <option value="">All Roles</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-36 py-2"
            >
              <option value="">All Outcomes</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </>
        }
        page={meta.page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        onPageChange={fetchLogs}
        emptyIcon={ShieldCheck}
        emptyTitle="No audit events found"
        emptyDescription="Security and administrative actions will appear here automatically."
      />
    </div>
  );
}
