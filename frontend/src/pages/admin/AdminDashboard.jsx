import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  Users,
  Wallet,
} from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { StatCard } from '../../components/StatCard.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';

const QUICK_MODULES = [
  {
    title: 'Student Directory & Admissions',
    description: 'Enroll students, manage dossiers, and monitor academic status.',
    path: '/admin/students',
    icon: GraduationCap,
  },
  {
    title: 'Faculty & Assignments',
    description: 'Manage teachers, specializations, and batch allocations.',
    path: '/admin/teachers',
    icon: Users,
  },
  {
    title: 'Courses & Batch Schedules',
    description: 'Configure courses, subjects, classrooms, and active batches.',
    path: '/admin/academics',
    icon: BookOpen,
  },
  {
    title: 'Attendance Control Centre',
    description: 'Oversee live QR sessions, roll calls, and manual overrides.',
    path: '/admin/attendance',
    icon: ClipboardCheck,
  },
  {
    title: 'Fees, Vouchers & Payments',
    description: 'Generate A4 PDF vouchers, track Raast QR payments, and issue receipts.',
    path: '/admin/fees',
    icon: Wallet,
  },
  {
    title: 'Examinations & Results',
    description: 'Schedule exams, verify teacher marks entry, and publish grades.',
    path: '/admin/exams',
    icon: FileSpreadsheet,
  },
];

export function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    axiosClient
      .get('/dashboard/summary')
      .then((res) => {
        if (active) setSummary(res.data?.data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingSpinner label="Loading campus dashboard..." />;

  const stats = summary?.stats || {};
  const byRole = stats.byRole || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Campus Admin ERP Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Full operational access across students, faculty, attendance, examinations, and finance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Registered Students"
          value={byRole.student ?? 0}
          subtitle="Active student accounts"
          icon={GraduationCap}
          accent="indigo"
        />
        <StatCard
          title="Faculty Members"
          value={byRole.teacher ?? 0}
          subtitle="Active teacher accounts"
          icon={Users}
          accent="emerald"
        />
        <StatCard
          title="Active Portal Users"
          value={stats.activeUsers ?? 0}
          subtitle={`Out of ${stats.totalUsers ?? 0} total`}
          icon={ClipboardCheck}
          accent="amber"
        />
        <StatCard
          title="Audit Events Logged"
          value={summary?.recentAuditLogs?.length ?? 0}
          subtitle="Recent tracked operations"
          icon={Wallet}
          accent="slate"
        />
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Operational Modules</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.path}
                to={mod.path}
                className="card-surface group p-5 transition-all hover:border-brand-300 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{mod.title}</h3>
                </div>
                <p className="mt-2.5 text-sm text-slate-500">{mod.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
