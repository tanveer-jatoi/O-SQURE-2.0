import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { getRoleHomePath } from '../context/AuthContext.jsx';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await login(identifier, password);
      navigate(getRoleHomePath(user.role), { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Unable to sign in. Please check your credentials and try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left Brand Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-900 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">O-Square 2.0</span>
        </div>

        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-bold leading-tight">
            Unified Campus Operations, Attendance &amp; Fee Intelligence
          </h1>
          <p className="text-sm leading-relaxed text-slate-300">
            Role-based access for campus administrators, faculty, and students with dynamic QR
            attendance verification and reconciled digital fee management.
          </p>
        </div>

        <p className="text-xs text-slate-400">
          O-Square 2.0 Educational ERP &bull; Secure Campus Platform
        </p>
      </div>

      {/* Right Login Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white lg:hidden">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in to your portal
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Use your campus email or username to access O-Square 2.0.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card-surface space-y-5 p-7">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="identifier"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email or Username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="e.g. admin@osquare.edu"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
