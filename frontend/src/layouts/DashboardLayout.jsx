import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { GraduationCap, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { ROLE_NAV_ITEMS } from '../config/navigation.js';
import { StatusBadge } from '../components/StatusBadge.jsx';

const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Campus Admin',
  teacher: 'Teacher Portal',
  student: 'Student Portal',
};

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = ROLE_NAV_ITEMS[user?.role] || [];
  const portalLabel = ROLE_LABELS[user?.role] || 'Portal';

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-slate-100 transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-white">O-Square 2.0</p>
              <p className="text-[11px] text-slate-400">{portalLabel}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={Boolean(item.exact)}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-rose-600/15 hover:text-rose-300"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden text-sm font-semibold text-slate-800 sm:inline">
              O-Square Educational Centre
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{user?.fullName}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <StatusBadge label={user?.role?.toUpperCase()} variant="info" />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
