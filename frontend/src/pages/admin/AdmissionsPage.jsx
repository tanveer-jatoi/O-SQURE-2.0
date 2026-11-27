import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, UserCheck, UserPlus } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Modal } from '../../components/Modal.jsx';

const INITIAL_INQUIRY = {
  candidateName: '',
  fatherName: '',
  email: '',
  cnicBForm: '',
  gender: 'male',
  dob: '',
  contactPhone: '',
  guardianPhone: '',
  address: '',
  interestedCourseName: '',
  notes: '',
};

const BADGE_MAP = {
  inquiry: 'neutral',
  interview_scheduled: 'info',
  approved: 'warning',
  enrolled: 'success',
  rejected: 'danger',
};

export function AdmissionsPage() {
  const [admissions, setAdmissions] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_INQUIRY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [convertTarget, setConvertTarget] = useState(null);
  const [convertCreds, setConvertCreds] = useState({ username: '', password: '' });
  const [convertError, setConvertError] = useState('');
  const [converting, setConverting] = useState(false);

  const fetchAdmissions = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosClient.get('/admissions', {
          params: {
            page: pageNum,
            limit: 15,
            search: search || undefined,
            status: statusFilter || undefined,
          },
        });
        setAdmissions(res.data?.data?.admissions || []);
        setMeta(res.data?.meta || { page: 1, totalPages: 1, total: 0 });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admissions.');
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => {
    const t = setTimeout(() => fetchAdmissions(1), 250);
    return () => clearTimeout(t);
  }, [fetchAdmissions]);

  async function handleCreateInquiry(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await axiosClient.post('/admissions', form);
      setCreateOpen(false);
      setForm(INITIAL_INQUIRY);
      fetchAdmissions(1);
    } catch (err) {
      const details = err.response?.data?.details;
      setFormError(
        details?.map((d) => d.message).join(' • ') ||
          err.response?.data?.message ||
          'Unable to create inquiry.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusUpdate(item, nextStatus) {
    try {
      await axiosClient.patch(`/admissions/${item._id}/status`, { status: nextStatus });
      fetchAdmissions(meta.page);
    } catch (err) {
      setError(err.response?.data?.message || 'Status update failed.');
    }
  }

  async function handleConvert(e) {
    e.preventDefault();
    setConvertError('');
    setConverting(true);
    try {
      await axiosClient.post(`/admissions/${convertTarget._id}/convert`, convertCreds);
      setConvertTarget(null);
      setConvertCreds({ username: '', password: '' });
      fetchAdmissions(meta.page);
    } catch (err) {
      const details = err.response?.data?.details;
      setConvertError(
        details?.map((d) => d.message).join(' • ') ||
          err.response?.data?.message ||
          'Conversion failed.'
      );
    } finally {
      setConverting(false);
    }
  }

  const columns = [
    {
      key: 'inquiryNumber',
      header: 'Inquiry #',
      render: (a) => <span className="font-mono text-xs font-semibold text-brand-700">{a.inquiryNumber}</span>,
    },
    {
      key: 'candidateName',
      header: 'Applicant',
      render: (a) => (
        <div>
          <p className="font-medium text-slate-900">{a.candidateName}</p>
          <p className="text-xs text-slate-500">{a.email}</p>
        </div>
      ),
    },
    { key: 'interestedCourseName', header: 'Program' },
    { key: 'contactPhone', header: 'Phone' },
    {
      key: 'status',
      header: 'Stage',
      render: (a) => (
        <StatusBadge
          label={a.status.replace('_', ' ')}
          variant={BADGE_MAP[a.status] || 'neutral'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Workflow',
      render: (a) =>
        a.status === 'enrolled' ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <UserCheck className="h-3.5 w-3.5" /> Enrolled
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <select
              value={a.status}
              onChange={(e) => handleStatusUpdate(a, e.target.value)}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
            >
              <option value="inquiry">Inquiry</option>
              <option value="interview_scheduled">Interview</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            {a.status === 'approved' && (
              <button
                onClick={() => {
                  setConvertTarget(a);
                  setConvertError('');
                }}
                className="rounded bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
              >
                Convert to Student
              </button>
            )}
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admissions Pipeline</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track inquiries, schedule interviews, approve applicants, and convert to enrolled students.
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <UserPlus className="h-4 w-4" />
          New Inquiry
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={admissions}
        isLoading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search candidate, inquiry #, or email..."
        filterSlot={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-44 py-2"
          >
            <option value="">All Stages</option>
            <option value="inquiry">Inquiry</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="approved">Approved</option>
            <option value="enrolled">Enrolled</option>
            <option value="rejected">Rejected</option>
          </select>
        }
        page={meta.page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        onPageChange={fetchAdmissions}
        emptyIcon={ClipboardList}
        emptyTitle="No admission inquiries"
        emptyDescription="Log a new prospect inquiry to start the admissions workflow."
      />

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Admission Inquiry">
        <form onSubmit={handleCreateInquiry} className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {formError}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Candidate Name</label>
              <input
                type="text"
                required
                value={form.candidateName}
                onChange={(e) => setForm({ ...form, candidateName: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Father Name</label>
              <input
                type="text"
                required
                value={form.fatherName}
                onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">CNIC / B-Form</label>
              <input
                type="text"
                required
                value={form.cnicBForm}
                onChange={(e) => setForm({ ...form, cnicBForm: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="input-field"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">DOB</label>
              <input
                type="date"
                required
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Program / Course</label>
              <input
                type="text"
                required
                placeholder="e.g. Software Eng Diploma"
                value={form.interestedCourseName}
                onChange={(e) => setForm({ ...form, interestedCourseName: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Contact Phone</label>
              <input
                type="text"
                required
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Guardian Phone</label>
              <input
                type="text"
                required
                value={form.guardianPhone}
                onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Address</label>
            <input
              type="text"
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Log Inquiry'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(convertTarget)}
        onClose={() => setConvertTarget(null)}
        title={`Enroll ${convertTarget?.candidateName || ''}`}
      >
        <form onSubmit={handleConvert} className="space-y-4">
          {convertError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {convertError}
            </div>
          )}
          <p className="text-xs text-slate-600">
            Assign portal login credentials to convert inquiry{' '}
            <strong>{convertTarget?.inquiryNumber}</strong> into an active Student account.
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Portal Username</label>
            <input
              type="text"
              required
              value={convertCreds.username}
              onChange={(e) => setConvertCreds({ ...convertCreds, username: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Initial Password (8+ chars, upper/lower/digit)
            </label>
            <input
              type="password"
              required
              value={convertCreds.password}
              onChange={(e) => setConvertCreds({ ...convertCreds, password: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setConvertTarget(null)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={converting} className="btn-primary">
              {converting ? 'Enrolling...' : 'Create Student Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
