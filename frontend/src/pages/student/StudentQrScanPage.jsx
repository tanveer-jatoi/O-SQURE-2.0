import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle2, QrCode, AlertCircle } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';

export function StudentQrScanPage() {
  const scannerRef = useRef(null);
  const [manualToken, setManualToken] = useState('');
  const [result, setResult] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  async function submitToken(token) {
    if (submitting || !token) return;
    setSubmitting(true);
    setResult({ type: '', message: '' });
    try {
      const res = await axiosClient.post('/attendance/scan', { token });
      setResult({ type: 'success', message: res.data?.message || 'Attendance marked!' });
    } catch (err) {
      setResult({
        type: 'error',
        message: err.response?.data?.message || 'Unable to verify QR code.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader-region',
      { fps: 10, qrbox: { width: 240, height: 240 } },
      false
    );

    scanner.render(
      (decodedText) => {
        submitToken(decodedText);
      },
      () => {
        // Ignore continuous frame decode misses
      }
    );

    scannerRef.current = scanner;
    return () => {
      scanner.clear().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Scan Classroom QR</h1>
        <p className="mt-1 text-sm text-slate-500">
          Point your camera at the live QR code displayed by your teacher.
        </p>
      </div>

      {result.message && (
        <div
          className={`flex items-start gap-2.5 rounded-xl border px-4 py-3.5 text-sm font-medium ${
            result.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {result.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <span>{result.message}</span>
        </div>
      )}

      <div className="card-surface p-5">
        <div id="qr-reader-region" className="overflow-hidden rounded-lg" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitToken(manualToken.trim());
        }}
        className="card-surface space-y-3 p-5"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <QrCode className="h-4 w-4 text-brand-600" />
          <span>Manual Token Fallback</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Paste session token if camera is unavailable..."
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="input-field"
          />
          <button type="submit" disabled={submitting} className="btn-primary shrink-0">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
