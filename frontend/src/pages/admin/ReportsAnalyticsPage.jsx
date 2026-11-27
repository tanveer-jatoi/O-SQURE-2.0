import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { axiosClient } from '../../api/axiosClient.js';
import { StatCard } from '../../components/StatCard.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import { fetchAndDownloadReport } from '../../utils/fileDownload.js';

const PIE_COLORS = ['#059669', '#D97706', '#DC2626', '#4F46E5'];

const EXPORT_CARDS = [
  { type: 'fees', title: 'Fee Collections Report', desc: 'All generated vouchers, amounts paid, and settlement status.' },
  { type: 'outstanding', title: 'Outstanding Dues Report', desc: 'Pending, partially paid, and overdue student balances.' },
  { type: 'attendance', title: 'Attendance Summary Report', desc: 'Session check-in statuses across batches.' },
  { type: 'students', title: 'Student Enrollment Directory', desc: 'Complete student roster and academic status.' },
];

export function ReportsAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    axiosClient
      .get('/reports/overview')
      .then((res) => setData(res.data?.data))
      .finally(() => setLoading(false));
  }, []);

  async function handleExport(type, format) {
    const key = `${type}-${format}`;
    setExporting(key);
    try {
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      await fetchAndDownloadReport(
        `/reports/export?type=${type}&format=${format}`,
        `OSquare-${type}.${ext}`
      );
    } finally {
      setExporting('');
    }
  }

  if (loading) return <LoadingSpinner label="Aggregating campus analytics..." />;

  const fin = data?.financial || {};
  const monthlySeries = data?.monthlySeries || [];
  const attendanceSeries = data?.attendanceSeries || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financial &amp; Academic Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Real-time revenue metrics, attendance distribution, and Excel/PDF exports.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Fees Collected" value={`PKR ${(fin.totalCollected || 0).toLocaleString()}`} subtitle={`${fin.successfulTransactions || 0} verified txns`} icon={Wallet} accent="emerald" />
        <StatCard title="Today / This Month" value={`PKR ${(fin.monthlyCollections || 0).toLocaleString()}`} subtitle={`Today: PKR ${(fin.todayCollections || 0).toLocaleString()}`} icon={BarChart3} accent="indigo" />
        <StatCard title="Pending & Overdue" value={`PKR ${(fin.pendingFees || 0).toLocaleString()}`} subtitle={`Overdue: PKR ${(fin.overdueFees || 0).toLocaleString()}`} icon={Clock} accent="amber" />
        <StatCard title="Refunds & Failed" value={`PKR ${(fin.totalRefunded || 0).toLocaleString()}`} subtitle={`${fin.failedTransactions || 0} failed txns`} icon={RotateCcw} accent="rose" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Monthly Fee Collections (PKR)</h2>
          {monthlySeries.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">No completed collections yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="collected" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card-surface p-5">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Attendance Status Distribution</h2>
          {attendanceSeries.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">No attendance records yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceSeries}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label
                  >
                    {attendanceSeries.map((entry, idx) => (
                      <Cell key={entry.status} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Export Center */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Exportable Reports (Excel &amp; PDF)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {EXPORT_CARDS.map((card) => (
            <div key={card.type} className="card-surface flex flex-col justify-between p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{card.desc}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport(card.type, 'excel')}
                  disabled={Boolean(exporting)}
                  className="btn-secondary text-xs"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  {exporting === `${card.type}-excel` ? 'Exporting...' : 'Export Excel (.xlsx)'}
                </button>
                <button
                  onClick={() => handleExport(card.type, 'pdf')}
                  disabled={Boolean(exporting)}
                  className="btn-secondary text-xs"
                >
                  <Download className="h-4 w-4 text-rose-600" />
                  {exporting === `${card.type}-pdf` ? 'Exporting...' : 'Export PDF'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
