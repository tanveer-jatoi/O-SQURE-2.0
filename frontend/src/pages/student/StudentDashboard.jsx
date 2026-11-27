import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, FileSpreadsheet, QrCode, Receipt } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { StatCard } from '../../components/StatCard.jsx';

export function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.fullName}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your personal academic portal for attendance, fee vouchers, receipts, and results.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Attendance Rate"
          value="—"
          subtitle="Tracked per batch session"
          icon={ClipboardCheck}
          accent="emerald"
        />
        <StatCard
          title="Pending Vouchers"
          value="0"
          subtitle="Fee hub ready in Phase 16"
          icon={Receipt}
          accent="amber"
        />
        <StatCard
          title="Published Results"
          value="0"
          subtitle="Report cards available"
          icon={FileSpreadsheet}
          accent="indigo"
        />
        <StatCard
          title="Weekly Classes"
          value="0"
          subtitle="Batch timetable"
          icon={CalendarDays}
          accent="slate"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/student/scan-qr" className="card-surface p-5 hover:border-brand-300">
          <div className="flex items-center gap-3">
            <QrCode className="h-5 w-5 text-brand-600" />
            <h3 className="font-semibold text-slate-900">Scan Classroom QR</h3>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
            Mark your live class attendance by scanning your teacher&apos;s rotating session QR code.
          </p>
        </Link>
        <Link to="/student/fees" className="card-surface p-5 hover:border-brand-300">
          <div className="flex items-center gap-3">
            <Receipt className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-900">Fee Vouchers &amp; Receipts</h3>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
            View monthly fee invoices, pay online via QR, and download verified PDF receipts.
          </p>
        </Link>
      </div>
    </div>
  );
}
