import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, FileSpreadsheet, QrCode } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { StatCard } from '../../components/StatCard.jsx';

export function TeacherDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.fullName}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Assignment-scoped faculty workspace for your batches, QR attendance sessions, and grading.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Assigned Batches"
          value="0"
          subtitle="Populates in Phase 13"
          icon={BookOpen}
          accent="indigo"
        />
        <StatCard
          title="Live QR Sessions"
          value="Ready"
          subtitle="Dynamic attendance engine"
          icon={QrCode}
          accent="emerald"
        />
        <StatCard
          title="Pending Marks Entry"
          value="0"
          subtitle="Exam papers assigned"
          icon={FileSpreadsheet}
          accent="amber"
        />
        <StatCard
          title="Weekly Classes"
          value="0"
          subtitle="Timetable slots"
          icon={CalendarDays}
          accent="slate"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/teacher/qr-attendance" className="card-surface p-5 hover:border-brand-300">
          <h3 className="font-semibold text-slate-900">Launch QR Attendance Session</h3>
          <p className="mt-1 text-sm text-slate-500">
            Generate rotating cryptographic QR codes for students in your assigned classes.
          </p>
        </Link>
        <Link to="/teacher/marks" className="card-surface p-5 hover:border-brand-300">
          <h3 className="font-semibold text-slate-900">Subject Marks Entry</h3>
          <p className="mt-1 text-sm text-slate-500">
            Record and submit examination scores for your assigned subjects.
          </p>
        </Link>
      </div>
    </div>
  );
}
