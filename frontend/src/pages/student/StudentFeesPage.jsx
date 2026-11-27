import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Printer,
  QrCode,
  Receipt,
  Wallet,
} from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { fetchAndOpenPdf } from '../../utils/fileDownload.js';
import { StatCard } from '../../components/StatCard.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Modal } from '../../components/Modal.jsx';

const VOUCHER_BADGE = {
  paid: 'success',
  pending: 'warning',
  processing: 'info',
  partially_paid: 'info',
  overdue: 'danger',
  failed: 'danger',
  refunded: 'neutral',
};

export function StudentFeesPage() {
  const [totals, setTotals] = useState({ totalPayable: 0, pendingAmount: 0, paidAmount: 0, overdueAmount: 0 });
  const [vouchers, setVouchers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [payTarget, setPayTarget] = useState(null);
  const [provider, setProvider] = useState('raast');
  const [method, setMethod] = useState('raast_qr');
  const [checkoutData, setCheckoutData] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [initiating, setInitiating] = useState(false);

  const loadFees = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, rRes] = await Promise.all([
        axiosClient.get('/fees/my-summary'),
        axiosClient.get('/receipts'),
      ]);
      setTotals(fRes.data?.data?.totals || { totalPayable: 0, pendingAmount: 0, paidAmount: 0, overdueAmount: 0 });
      setVouchers(fRes.data?.data?.vouchers || []);
      setReceipts(rRes.data?.data?.receipts || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  async function handleInitiateCheckout(e) {
    e.preventDefault();
    if (!payTarget) return;
    setCheckoutError('');
    setInitiating(true);
    try {
      const res = await axiosClient.post('/payments/checkout', {
        voucherId: payTarget._id,
        paymentMethod: method,
        gatewayProvider: provider,
      });
      setCheckoutData(res.data?.data);
    } catch (err) {
      setCheckoutError(err.response?.data?.message || 'Unable to initiate payment.');
    } finally {
      setInitiating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Fee Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          View monthly fee vouchers, pay online via Raast QR or digital wallets, and access verified receipts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Billed" value={`PKR ${totals.totalPayable.toLocaleString()}`} icon={Wallet} accent="indigo" />
        <StatCard title="Total Paid" value={`PKR ${totals.paidAmount.toLocaleString()}`} icon={CheckCircle2} accent="emerald" />
        <StatCard title="Pending Dues" value={`PKR ${totals.pendingAmount.toLocaleString()}`} icon={Clock} accent="amber" />
        <StatCard title="Overdue" value={`PKR ${totals.overdueAmount.toLocaleString()}`} icon={AlertTriangle} accent="rose" />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">Fee Vouchers</h2>
        <DataTable
          isLoading={loading}
          rows={vouchers}
          columns={[
            { key: 'voucherNumber', header: 'Voucher #', render: (v) => <span className="font-mono text-xs font-semibold text-brand-700">{v.voucherNumber}</span> },
            { key: 'billingMonth', header: 'Month' },
            { key: 'description', header: 'Description' },
            { key: 'totalPayable', header: 'Payable (PKR)', render: (v) => v.totalPayable.toLocaleString() },
            { key: 'dueDate', header: 'Due Date', render: (v) => new Date(v.dueDate).toLocaleDateString() },
            { key: 'status', header: 'Status', render: (v) => <StatusBadge label={v.status} variant={VOUCHER_BADGE[v.status] || 'neutral'} /> },
            {
              key: 'actions',
              header: 'Actions',
              render: (v) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchAndOpenPdf(`/vouchers/${v._id}/pdf`, `Voucher-${v.voucherNumber}.pdf`, 'download')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-brand-700"
                    title="Download PDF Voucher"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </button>
                  <button
                    onClick={() => fetchAndOpenPdf(`/vouchers/${v._id}/pdf`, `Voucher-${v.voucherNumber}.pdf`, 'print')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                    title="View / Print Voucher"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                  {v.status !== 'paid' && v.status !== 'refunded' && (
                    <button
                      onClick={() => {
                        setPayTarget(v);
                        setCheckoutData(null);
                        setCheckoutError('');
                      }}
                      className="inline-flex items-center gap-1 rounded bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
                    >
                      <CreditCard className="h-3.5 w-3.5" /> Pay Now
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          emptyIcon={Receipt}
          emptyTitle="No fee vouchers issued yet"
          emptyDescription="Your monthly fee vouchers will appear here once generated by administration."
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">Verified Payment Receipts</h2>
        <DataTable
          isLoading={loading}
          rows={receipts}
          columns={[
            { key: 'receiptNumber', header: 'Receipt #', render: (r) => <span className="font-mono text-xs font-semibold text-emerald-700">{r.receiptNumber}</span> },
            { key: 'voucher', header: 'Voucher #', render: (r) => r.voucherId?.voucherNumber },
            { key: 'amountPaid', header: 'Amount (PKR)', render: (r) => r.amountPaid.toLocaleString() },
            { key: 'paymentMethod', header: 'Method', render: (r) => r.paymentMethod.replace('_', ' ').toUpperCase() },
            { key: 'transactionReference', header: 'TXN Reference', render: (r) => <span className="font-mono text-xs">{r.transactionReference}</span> },
            { key: 'issuedAt', header: 'Date', render: (r) => new Date(r.issuedAt).toLocaleDateString() },
            {
              key: 'pdf',
              header: 'Receipt PDF',
              render: (r) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchAndOpenPdf(`/receipts/${r._id}/pdf`, `Receipt-${r.receiptNumber}.pdf`, 'download')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                  <button
                    onClick={() => fetchAndOpenPdf(`/receipts/${r._id}/pdf`, `Receipt-${r.receiptNumber}.pdf`, 'print')}
                    className="text-slate-500 hover:text-slate-800"
                    title="Print Receipt"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                </div>
              ),
            },
          ]}
          emptyIcon={CheckCircle2}
          emptyTitle="No payment receipts yet"
          emptyDescription="Receipts are generated automatically once a payment is verified."
        />
      </div>

      <Modal
        isOpen={Boolean(payTarget)}
        onClose={() => {
          setPayTarget(null);
          loadFees();
        }}
        title={`Pay Voucher ${payTarget?.voucherNumber || ''}`}
      >
        {!checkoutData ? (
          <form onSubmit={handleInitiateCheckout} className="space-y-4">
            {checkoutError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {checkoutError}
              </div>
            )}
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="text-slate-600">{payTarget?.description}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                PKR {(payTarget ? payTarget.totalPayable - payTarget.paidAmount : 0).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Payment Channel</label>
              <select
                value={provider}
                onChange={(e) => {
                  const p = e.target.value;
                  setProvider(p);
                  setMethod(p === 'raast' ? 'raast_qr' : 'online_gateway');
                }}
                className="input-field"
              >
                <option value="raast">Raast QR (Instant Bank Transfer)</option>
                <option value="payfast_pk">PayFast PK (Cards / Bank Account)</option>
                <option value="jazzcash">JazzCash Mobile Wallet</option>
                <option value="easypaisa">Easypaisa Mobile Wallet</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPayTarget(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={initiating} className="btn-primary">
                <QrCode className="h-4 w-4" />
                {initiating ? 'Generating...' : 'Generate Payment QR'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center space-y-3 text-center">
            <img
              src={checkoutData.qrDataUrl}
              alt="Payment QR"
              className="h-52 w-52 rounded-xl border border-slate-200 p-2"
            />
            <div className="w-full rounded-lg bg-slate-50 p-3 text-xs space-y-1">
              <p><strong>Payment Reference:</strong> <span className="font-mono">{checkoutData.paymentReference}</span></p>
              <p><strong>Gateway TXN ID:</strong> <span className="font-mono">{checkoutData.gatewayTransactionId}</span></p>
              <p><strong>Amount Due:</strong> PKR {checkoutData.amountDue.toLocaleString()}</p>
            </div>
            <p className="text-xs text-slate-500">
              Scan with your banking app or Raast QR scanner. Status updates automatically once verified by the provider webhook.
            </p>
            <button
              onClick={() => {
                setPayTarget(null);
                loadFees();
              }}
              className="btn-primary w-full"
            >
              Done
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
