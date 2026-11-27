import { useCallback, useEffect, useState } from 'react';
import { QrCode, RefreshCw, Square, Users } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';

export function QrAttendanceSessionPage() {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [lateThresholdMinutes, setLateThresholdMinutes] = useState(15);

  const [session, setSession] = useState(null);
  const [qr, setQr] = useState(null);
  const [countdown, setCountdown] = useState(20);
  const [roster, setRoster] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    axiosClient.get('/batches').then((res) => {
      const list = res.data?.data?.batches || [];
      setBatches(list);
      if (list.length > 0) setBatchId(list[0]._id);
    });
  }, []);

  const refreshLive = useCallback(async (sessionId) => {
    try {
      const [qrRes, liveRes] = await Promise.all([
        axiosClient.get(`/attendance-sessions/${sessionId}/qr`),
        axiosClient.get(`/attendance-sessions/${sessionId}/live`),
      ]);
      setQr(qrRes.data?.data?.qr);
      setRoster(liveRes.data?.data?.roster || []);
      setCountdown(20);
    } catch (err) {
      if (err.response?.data?.errorCode === 'SESSION_ENDED') {
        setSession((prev) => (prev ? { ...prev, isActive: false } : null));
      }
    }
  }, []);

  // Auto-rotate QR every 20 seconds while session is active
  useEffect(() => {
    if (!session?.isActive) return undefined;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refreshLive(session._id);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session, refreshLive]);

  async function handleStartSession(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await axiosClient.post('/attendance-sessions', {
        batchId,
        durationMinutes,
        lateThresholdMinutes,
      });
      const created = res.data?.data?.session;
      setSession(created);
      setQr(res.data?.data?.qr);
      setCountdown(20);
      const liveRes = await axiosClient.get(`/attendance-sessions/${created._id}/live`);
      setRoster(liveRes.data?.data?.roster || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start attendance session.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCloseSession() {
    if (!session) return;
    setBusy(true);
    try {
      await axiosClient.patch(`/attendance-sessions/${session._id}/close`);
      setSession({ ...session, isActive: false });
      const liveRes = await axiosClient.get(`/attendance-sessions/${session._id}/live`);
      setRoster(liveRes.data?.data?.roster || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close session.');
    } finally {
      setBusy(false);
    }
  }

  const presentCount = roster.filter((r) => r.status === 'present' || r.status === 'late').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">QR Attendance Session</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate a rotating cryptographic QR code for your assigned batch. Tokens expire every 30
          seconds to prevent proxy sharing.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!session || !session.isActive ? (
        <form onSubmit={handleStartSession} className="card-surface max-w-xl space-y-4 p-6">
          <h2 className="text-base font-semibold text-slate-900">Configure New Session</h2>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Assigned Batch</label>
            <select
              required
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="input-field"
            >
              <option value="">Select Batch</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.batchCode} — {b.courseId?.title} ({b.startTime}–{b.endTime})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Session Duration (mins)
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Late Threshold (mins)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={lateThresholdMinutes}
                onChange={(e) => setLateThresholdMinutes(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          <button type="submit" disabled={busy || !batchId} className="btn-primary">
            <QrCode className="h-4 w-4" />
            {busy ? 'Starting...' : 'Start Live QR Session'}
          </button>
        </form>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-surface flex flex-col items-center p-6 text-center">
            <div className="flex w-full items-center justify-between pb-4">
              <span className="font-mono text-xs font-bold text-brand-700">
                {session.sessionCode}
              </span>
              <StatusBadge label={`Refreshing in ${countdown}s`} variant="info" />
            </div>

            {qr?.qrDataUrl && (
              <img
                src={qr.qrDataUrl}
                alt="Live Attendance QR"
                className="h-64 w-64 rounded-xl border border-slate-200 p-2 bg-white"
              />
            )}

            <p className="mt-3 text-xs text-slate-500">
              Students must scan from their portal. Screenshots expire automatically.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => refreshLive(session._id)}
                className="btn-secondary"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Now
              </button>
              <button
                onClick={handleCloseSession}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-700"
              >
                <Square className="h-4 w-4" />
                End Session
              </button>
            </div>
          </div>

          <div className="card-surface p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-600" />
                <h2 className="text-base font-semibold text-slate-900">Live Scan Monitor</h2>
              </div>
              <span className="text-xs font-semibold text-emerald-700">
                {presentCount} / {roster.length} Scanned
              </span>
            </div>

            <div className="mt-3 max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {roster.map((item) => (
                <div key={item.studentId} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{item.fullName}</p>
                    <p className="font-mono text-xs text-slate-500">{item.studentId}</p>
                  </div>
                  <StatusBadge
                    label={item.status}
                    variant={
                      item.status === 'present'
                        ? 'success'
                        : item.status === 'late'
                        ? 'warning'
                        : item.status === 'absent'
                        ? 'danger'
                        : 'neutral'
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
