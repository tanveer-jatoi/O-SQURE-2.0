import { useCallback, useEffect, useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Modal } from '../../components/Modal.jsx';

export function UsersManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'teacher',
  });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosClient.get('/users', {
          params: {
            page: pageNum,
            limit: 15,
            search: search || undefined,
            role: roleFilter || undefined,
          },
        });
        setUsers(res.data?.data?.users || []);
        setMeta(res.data?.meta || { page: 1, totalPages: 1, total: 0 });
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load user accounts.');
      } finally {
        setLoading(false);
      }
    },
    [search, roleFilter]
  );

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(1), 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  async function handleCreateUser(e) {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      await axiosClient.post('/users', form);
      setIsModalOpen(false);
      setForm({ fullName: '', username: '', email: '', password: '', role: 'teacher' });
      fetchUsers(1);
    } catch (err) {
      const details = err.response?.data?.details;
      const msg =
        details?.map((d) => d.message).join(' • ') ||
        err.response?.data?.message ||
        'Failed to create user.';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(target) {
    const nextStatus = target.status === 'active' ? 'suspended' : 'active';
    try {
      await axiosClient.patch(`/users/${target._id}/status`, { status: nextStatus });
      fetchUsers(meta.page);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update user status.');
    }
  }

  const columns = [
    { key: 'fullName', header: 'Full Name', render: (u) => <span className="font-medium text-slate-900">{u.fullName}</span> },
    { key: 'username', header: 'Username', render: (u) => <span className="font-mono text-xs">{u.username}</span> },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (u) => <StatusBadge label={u.role.toUpperCase()} variant="info" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <StatusBadge
          label={u.status}
          variant={u.status === 'active' ? 'success' : 'danger'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (u) =>
        u._id !== currentUser?._id ? (
          <button
            onClick={() => handleToggleStatus(u)}
            className="text-xs font-semibold text-brand-600 hover:text-brand-800"
          >
            {u.status === 'active' ? 'Suspend' : 'Activate'}
          </button>
        ) : (
          <span className="text-xs text-slate-400">Current User</span>
        ),
    },
  ];

  const allowedCreateRoles =
    currentUser?.role === 'superadmin'
      ? ['superadmin', 'admin', 'teacher', 'student']
      : ['teacher', 'student'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User &amp; Role Accounts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage portal access, account activation, and role assignments.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <UserPlus className="h-4 w-4" />
          Create Account
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={users}
        isLoading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, or username..."
        filterSlot={
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field w-40 py-2"
          >
            <option value="">All Roles</option>
            {currentUser?.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        }
        page={meta.page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        onPageChange={fetchUsers}
        emptyIcon={Users}
        emptyTitle="No matching users"
        emptyDescription="Create an account or adjust your role/search filters."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Portal Account"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {formError}
            </div>
          )}
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
              <label className="mb-1 block text-xs font-medium text-slate-700">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input-field"
              >
                {allowedCreateRoles.map((r) => (
                  <option key={r} value={r}>
                    {r.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
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
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Temporary Password (min 8 chars, upper/lower/digit)
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary">
              {isSaving ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
