import { useState } from 'react';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { axiosClient, setAccessToken } from '../../api/axiosClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';

export function ProfileSecurityPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  async function handlePasswordChange(e) {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setSubmitting(true);

    try {
      const res = await axiosClient.patch('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      const newToken = res.data?.data?.accessToken;
      if (newToken) setAccessToken(newToken);
      setCurrentPassword('');
      setNewPassword('');
      setStatus({ type: 'success', message: 'Password updated and active session rotated.' });
    } catch (err) {
      const details = err.response?.data?.details;
      const msg =
        details?.map((d) => d.message).join(' • ') ||
        err.response?.data?.message ||
        'Unable to change password.';
      setStatus({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Profile &amp; Security</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review your identity permissions and rotate your password securely.
        </p>
      </div>

      <div className="card-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{user?.fullName}</h2>
            <p className="text-sm text-slate-500">
              @{user?.username} &bull; {user?.email}
            </p>
          </div>
          <StatusBadge label={user?.role?.toUpperCase()} variant="info" />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Granted RBAC Permissions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(user?.permissions || []).map((perm) => (
              <span
                key={perm}
                className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700"
              >
                {perm}
              </span>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handlePasswordChange} className="card-surface p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-brand-600" />
          <h2 className="text-base font-semibold text-slate-900">Change Password</h2>
        </div>

        {status.message && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm ${
              status.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {status.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <span>{status.message}</span>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Current Password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            New Password (8+ chars, uppercase, lowercase, number)
          </label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-field"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
