import { useCallback, useEffect, useState } from 'react';
import { GraduationCap, UserPlus } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Modal } from '../../components/Modal.jsx';

const INITIAL_FORM = {
  username: '',
  email: '',
  password: '',
  fullName: '',
  fatherName: '',
  cnicBForm: '',
  gender: 'male',
  dob: '',
  contactPhone: '',
  guardianPhone: '',
  address: '',
};

const STATUS_BADGE = {
  active: 'success',
  graduated: 'info',
  suspended: 'danger',
  dropped: 'warning',
};

export function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchStudents = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosClient.get('/students', {
          params: {
            page: pageNum,
            limit: 15,
            search: search || undefined,
            status: statusFilter || undefined,
          },
        });
        setStudents(res.data?.data?.students || []);
        setMeta(res.data?.meta || { page: 1, totalPages: 1, total: 0 });
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load students.');
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => {
    const t = setTimeout(() => fetchStudents(1), 250);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  async function handleCreateStudent(e) {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      await axiosClient.post('/students', form);
      setIsModalOpen(false);
      setForm(INITIAL_FORM);
      fetchStudents(1);
    } catch (err) {
      const details = err.response?.data?.details;
      setFormError(
        details?.map((d) => d.message).join(' • ') ||
          err.response?.data?.message ||
          'Failed to enroll student.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(student, nextStatus) {
    try {
      await axiosClient.patch(`/students/${student._id}`, { academicStatus: nextStatus });
      fetchStudents(meta.page);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update student status.');
    }
  }

  const columns = [
    {
      key: 'studentId',
      header: 'Student ID',
      render: (s) => <span className="font-mono text-xs font-semibold text-brand-700">{s.studentId}</span>,
    },
    {
      key: 'fullName',
      header: 'Student Name',
      render: (s) => (
        <div>
          <p className="font-medium text-slate-900">{s.fullName}</p>
          <p className="text-xs text-slate-500">S/O {s.fatherName}</p>
        </div>
      ),
    },
    { key: 'contactPhone', header: 'Phone' },
    { key: 'cnicBForm', header: 'CNIC / B-Form', render: (s) => <span className="font-mono text-xs">{s.cnicBForm}</span> },
    {
      key: 'academicStatus',
      header: 'Status',
      render: (s) => (
        <StatusBadge
          label={s.academicStatus}
          variant={STATUS_BADGE[s.academicStatus] || 'neutral'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <select
          value={s.academicStatus}
          onChange={(e) => handleStatusChange(s, e.target.value)}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
        >
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="graduated">Graduated</option>
          <option value="dropped">Dropped</option>
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Directory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enroll students, manage dossiers, and control student portal access.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <UserPlus className="h-4 w-4" />
          Enroll New Student
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={students}
        isLoading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, Student ID, CNIC, or phone..."
        filterSlot={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-40 py-2"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="graduated">Graduated</option>
            <option value="dropped">Dropped</option>
          </select>
        }
        page={meta.page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        onPageChange={fetchStudents}
        emptyIcon={GraduationCap}
        emptyTitle="No students enrolled yet"
        emptyDescription="Enroll your first student or convert an approved admission inquiry."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enroll New Student"
      >
        <form onSubmit={handleCreateStudent} className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {formError}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Father / Guardian Name</label>
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
              <label className="mb-1 block text-xs font-medium text-slate-700">CNIC / B-Form</label>
              <input
                type="text"
                required
                value={form.cnicBForm}
                onChange={(e) => setForm({ ...form, cnicBForm: e.target.value })}
                className="input-field"
              />
            </div>
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
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Date of Birth</label>
              <input
                type="date"
                required
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Student Phone</label>
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
            <label className="mb-1 block text-xs font-medium text-slate-700">Residential Address</label>
            <input
              type="text"
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="border-t border-slate-200 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Student Portal Credentials
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Username</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="input-field"
                />
              </div>
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
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Initial Password (8+ chars, upper/lower/digit)
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary">
              {isSaving ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
