import { useEffect, useState } from 'react';
import { BookOpen, Users } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';

export function TeacherBatchesPage() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient
      .get('/batches')
      .then((res) => {
        const list = res.data?.data?.batches || [];
        setBatches(list);
        if (list.length > 0) setSelectedBatch(list[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedBatch) return;
    axiosClient
      .get(`/batches/${selectedBatch._id}/students`)
      .then((res) => setRoster(res.data?.data?.enrollments || []))
      .catch(() => setRoster([]));
  }, [selectedBatch]);

  if (loading) return <LoadingSpinner label="Loading assigned batches..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Assigned Batches</h1>
        <p className="mt-1 text-sm text-slate-500">
          View only the batches and enrolled students assigned to your faculty profile.
        </p>
      </div>

      {batches.length === 0 ? (
        <div className="card-surface p-8 text-center text-sm text-slate-500">
          You have no batches assigned yet.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3">
            {batches.map((b) => (
              <button
                key={b._id}
                onClick={() => setSelectedBatch(b)}
                className={`w-full text-left card-surface p-4 transition-all ${
                  selectedBatch?._id === b._id
                    ? 'border-brand-600 ring-2 ring-brand-500/20'
                    : 'hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-brand-700">{b.batchCode}</span>
                  <StatusBadge label={b.daysPattern} variant="info" />
                </div>
                <p className="mt-1 font-semibold text-slate-900">{b.courseId?.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {b.classRoomId?.roomName} &bull; {b.startTime}–{b.endTime}
                </p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            <DataTable
              rows={roster}
              columns={[
                { key: 'studentId', header: 'Student ID', render: (e) => <span className="font-mono text-xs font-semibold text-brand-700">{e.studentId?.studentId}</span> },
                { key: 'fullName', header: 'Student Name', render: (e) => e.studentId?.fullName },
                { key: 'contactPhone', header: 'Contact', render: (e) => e.studentId?.contactPhone },
                { key: 'status', header: 'Status', render: (e) => <StatusBadge label={e.status} variant="success" /> },
              ]}
              emptyIcon={Users}
              emptyTitle="No students enrolled"
              emptyDescription="No active enrollments in this batch yet."
            />
          </div>
        </div>
      )}
    </div>
  );
}
