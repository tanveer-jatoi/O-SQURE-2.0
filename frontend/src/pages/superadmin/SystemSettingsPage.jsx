import { useEffect, useState } from 'react';
import { CheckCircle2, Save, Settings } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';

export function SystemSettingsPage() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    axiosClient
      .get('/settings')
      .then((res) => setForm(res.data?.data?.settings || {}));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      await axiosClient.patch('/settings', {
        campusName: form.campusName,
        campusPhone: form.campusPhone,
        campusEmail: form.campusEmail,
        defaultLateThresholdMinutes: Number(form.defaultLateThresholdMinutes),
        defaultLateFineAmount: Number(form.defaultLateFineAmount),
        attendanceQrRotationSeconds: Number(form.attendanceQrRotationSeconds),
      });
      setSavedMsg('System settings saved and logged to Audit Trail.');
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <LoadingSpinner label="Loading system settings..." />;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Global System Settings</h1>
          <p className="text-sm text-slate-500">Configure campus identity, attendance grace windows, and billing defaults.</p>
        </div>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          <span>{savedMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="card-surface space-y-4 p-6">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Campus Name</label>
          <input type="text" required value={form.campusName || ''} onChange={(e) => setForm({ ...form, campusName: e.target.value })} className="input-field" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Campus Phone</label>
            <input type="text" value={form.campusPhone || ''} onChange={(e) => setForm({ ...form, campusPhone: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Campus Email</label>
            <input type="email" value={form.campusEmail || ''} onChange={(e) => setForm({ ...form, campusEmail: e.target.value })} className="input-field" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Late Threshold (mins)</label>
            <input type="number" min="0" max="60" value={form.defaultLateThresholdMinutes ?? 15} onChange={(e) => setForm({ ...form, defaultLateThresholdMinutes: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">QR Rotation (sec)</label>
            <input type="number" min="10" max="60" value={form.attendanceQrRotationSeconds ?? 20} onChange={(e) => setForm({ ...form, attendanceQrRotationSeconds: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Default Late Fine (PKR)</label>
            <input type="number" min="0" value={form.defaultLateFineAmount ?? 500} onChange={(e) => setForm({ ...form, defaultLateFineAmount: e.target.value })} className="input-field" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
