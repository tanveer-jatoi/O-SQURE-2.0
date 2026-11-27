import { useEffect, useState } from 'react';
import { ClipboardCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { StatCard } from '../../components/StatCard.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';

export function StudentAttendancePage() {
  const [summary, setSummary] = useState({ total: 0, presentCount: 0, lateCount: 0, absentCount: 0, percentage: 0 });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient
      .get('/attendance/my-history')
      .then((res) => {
        setSummary(res.data?.data?.summary || summary);
        setRecords(res.data?.data?.records || []);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const badgeVariant = {
    present: 'success',
    late: 'warning',
    absent: 'danger',
    excused: 'info',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Attendance History</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track your verified QR check-ins and overall attendance percentage.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Attendance Rate" value={`${summary.percentage}%`} icon={ClipboardCheck} accent="indigo" />
        <StatCard title="Present" value={summary.presentCount} icon={CheckCircle2} accent="emerald" />
        <StatCard title="Late" value={summary.lateCount} icon={Clock} accent="amber" />
        <StatCard title="Absent" value={summary.absentCount} icon={XCircle} accent="rose" />
      </div>

      <DataTable
        isLoading={loading}
        rows={records}
        columns={[
          { key: 'date', header: 'Date', render: (r) => new Date(r.attendanceDate).toLocaleDateString() },
          { key: 'batch', header: 'Batch', render: (r) => <span className="font-mono text-xs font-semibold">{r.batchId?.batchCode}</span> },
          { key: 'session', header: 'Session', render: (r) => <span className="font-mono text-xs">{r.sessionId?.sessionCode}</span> },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge label={r.status} variant={badgeVariant[r.status] || 'neutral'} /> },
          { key: 'scannedAt', header: 'Check-In Time', render: (r) => (r.scannedAt ? new Date(r.scannedAt).toLocaleTimeString() : '—') },
        ]}
        emptyIcon={ClipboardCheck}
        emptyTitle="No attendance records yet"
        emptyDescription="Scan your classroom QR code to record your first check-in."
      />
    </div>
  );
}
