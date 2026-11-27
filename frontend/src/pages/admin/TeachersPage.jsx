import { useCallback, useEffect, useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Modal } from '../../components/Modal.jsx';

const INITIAL_FORM = {
  username: '',
  email: '',
  password: '',
  fullName: '',
  cnic: '',
  contactPhone: '',
  qualification: '',
  specializationsText: '',
};

export function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchTeachers = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosClient.get('/teachers', {
          params: {
            page: pageNum,
            limit: 15,
            search: search || undefined,
            status: statusFilter || undefined,
          },
        });
        setTeachers(res.data?.data?.teachers || []);
        setMeta(res.data?.meta || { page: 1, totalPages: 1, total: 0 });
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load teachers.');
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => {
    const t = setTimeout(() => fetchTeachers(1), 250);
    return () => clearTimeout(t);
  }, [fetchTeachers]);

  async function handleCreateTeacher(e) {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      const specializations = form.specializationsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await axiosClient.post('/teachers', {
        username: form.username,
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        cnic: form.cnic,
        contactPhone: form.contactPhone,
        qualification: form.qualification,
        specializations,
      });

      setIsModalOpen(false);
      setForm(INITIAL_FORM);
      fetchTeachers(1);
    } catch (err) {
      const details = err.response?.data?.details;
      setFormError(
        details?.map((d) => d.message).join(' • ') ||
          err.response?.data?.message ||
          'Failed to create teacher.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(teacher, nextStatus) {
    try {
      await axiosClient.patch(`/teachers/${teacher._id}`, { status: nextStatus });
      fetchTeachers(meta.page);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update teacher status.');
    }
  }

  const columns = [
    {
      key: 'teacherId',
      header: 'Faculty ID',
      render: (t) => <span className="font-mono text-xs font-semibold text-brand-700">{t.teacherId}</span>,
    },
    {
      key: 'fullName',
      header: 'Faculty Name',
      render: (t) => (
        <div>
          <p className="font-medium text-slate-900">{t.fullName}</p>
          <p className="text-xs text-slate-500">{t.email}</p>
        </div>
      ),
    },
    { key: 'qualification', header: 'Qualification' },
    {
      key: 'specializations',
      header: 'Specializations',
      render: (t) => (
        <div className="flex flex-wrap gap-1">
          {(t.specializations || []).slice(0, 3).map((sp) => (
            <span key={sp} className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
              {sp}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => (
        <StatusBadge
          label={t.status}
          variant={t.status === 'active' ? 'success' : t.status === 'on_leave' ? 'warning' : 'danger'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t) => (
        <select
          value={t.status}
          onChange={(e) => handleStatusChange(t, e.target.value)}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
        >
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="resigned">Resigned</option>
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Faculty Directory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage teaching staff profiles, qualifications, and portal access.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <UserPlus className="h-4 w-4" />
          Add Faculty Member
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={teachers}
        isLoading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, Faculty ID, or qualification..."
        filterSlot={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-40 py-2"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="resigned">Resigned</option>
          </select>
        }
        page={meta.page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        onPageChange={fetchTeachers}
        emptyIcon={Users}
        emptyTitle="No faculty members found"
        emptyDescription="Add a faculty member to begin assigning batches and attendance sessions."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Faculty Member"
      >
        <form onSubmit={handleCreateTeacher} className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
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
              <label className="mb-1 block text-xs font-medium text-slate-700">CNIC</label>
              <input
                type="text"
                required
                value={form.cnic}
                onChange={(e) => setForm({ ...form, cnic: e.target.value })}
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
              <label className="mb-1 block text-xs font-medium text-slate-700">Qualification</label>
              <input
                type="text"
                required
                placeholder="e.g. BSCS / MS Software Eng"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Specializations (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. React, Node.js, MongoDB"
              value={form.specializationsText}
              onChange={(e) => setForm({ ...form, specializationsText: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="border-t border-slate-200 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Teacher Portal Credentials
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
              {isSaving ? 'Creating...' : 'Create Teacher'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
