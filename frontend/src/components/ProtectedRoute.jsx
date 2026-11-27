import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { LoadingSpinner } from './LoadingSpinner.jsx';

export function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner label="Verifying your session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
