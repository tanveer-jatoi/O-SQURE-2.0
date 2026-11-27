import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { getRoleHomePath } from '../context/AuthContext.jsx';

export function UnauthorizedPage() {
  const { user } = useAuth();
  const homePath = user ? getRoleHomePath(user.role) : '/login';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Your current account role does not have permission to view this section.
      </p>
      <Link to={homePath} className="btn-primary mt-6">
        Return to Dashboard
      </Link>
    </div>
  );
}
