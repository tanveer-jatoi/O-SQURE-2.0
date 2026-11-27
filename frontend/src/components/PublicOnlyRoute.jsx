import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getRoleHomePath } from '../context/AuthContext.jsx';
import { LoadingSpinner } from './LoadingSpinner.jsx';

export function PublicOnlyRoute() {
  const { user, isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner label="Loading O-Square 2.0..." />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  return <Outlet />;
}
