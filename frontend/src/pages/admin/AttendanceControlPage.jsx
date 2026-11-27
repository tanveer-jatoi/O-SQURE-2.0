import { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Modal } from '../../components/Modal.jsx';

export function AttendanceControlPage() {
  const [records, setRecords] = useState([]);
  const [batches, setBatches] = useState([]);
  const [batchFilter, setBatchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'present', reason: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axiosClient.get('/batches').then((res) => setBatches(res.data?.data?.batches || []));
  }, []);

  const fetchRecords = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const res = await axiosClient.get('/attendance', {
          params: {
            page: pageNum,
            limit: 25,
            batchId: batchFilter || undefined,
            status: statusFilter || undefined,
          },
        });
        setRecords(res.data?.data?.records || []);
        setMeta(res.data?.meta || { page: 1, totalPages: 1, total: 0 });
      } finally {
        setLoading(false);
      }
    },
    [batchFilter, statusFilter]
  );

  useEffect(() => {
    fetchRecords(1);
  }, [fetchRecords]);

  async function handleSaveCorrection(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosClient.patch(`/attendance/${editTarget._id}`, editForm);
      setEditTarget(null);
      fetchRecords(meta.page);
    } finally {
      setSaving(false);
    }
  }

  const badgeVariant = {
    present: 'success',
    late: 'warning',
    absent: 'danger',
    excused: 'info',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance Control Centre</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review campus-wide attendance logs and perform audited manual corrections.
        </p>
      </div>

      <DataTable
        isLoading={loading}
        rows={records}
        filterSlot={
          <>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="input-field w-44 py-2"
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>{b.batchCode}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-36 py-2"
            >
              <option value="">All Statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="excused">Excused</option>
            </select>
          </>
        }
        columns={[
          { key: 'date', header: 'Date', render: (r) => new Date(r.attendanceDate).toLocaleDateString() },
          { key: 'student', header: 'Student', render: (r) => `${r.studentId?.studentId || ''} — ${r.studentId?.fullName || ''}` },
          { key: 'batch', header: 'Batch', render: (r) => <span className="font-mono text-xs">{r.batchId?.batchCode}</span> },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge label={r.status} variant={badgeVariant[r.status] || 'neutral'} /> },
          { key: 'manual', header: 'Audited', render: (r) => (r.isManualCorrection ? 'Manual Override' : 'QR Verified') },
          {
            key: 'actions',
            header: 'Override',
            render: (r) => (
              <button
                onClick={() => {
                  setEditTarget(r);
                  setEditForm({ status: r.status, reason: '' });
                }}
                className="text-xs font-semibold text-brand-600 hover:text-brand-800"
              >
                Correct
              </button>
            ),
          },
        ]}
        page={meta.page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        onPageChange={fetchRecords}
        emptyIcon={ClipboardCheck}
        emptyTitle="No attendance records"
        emptyDescription="Attendance logs will appear once teachers run QR sessions."
      />

      <Modal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title={`Correct Attendance: ${editTarget?.studentId?.fullName || ''}`}
      >
        <form onSubmit={handleSaveCorrection} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">New Status</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="input-field"
            >
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="excused">Excused</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Mandatory Audit Reason
            </label>
            <input
              type="text"
              required
              minLength={3}
              placeholder="e.g. Medical leave approved by coordinator"
              value={editForm.reason}
              onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditTarget(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save & Log Audit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
