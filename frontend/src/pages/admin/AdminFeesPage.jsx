import { useCallback, useEffect, useState } from 'react';
import { Download, Plus, Receipt, Users, Wallet } from 'lucide-react';
import { axiosClient } from '../../api/axiosClient.js';
import { fetchAndOpenPdf } from '../../utils/fileDownload.js';
import { DataTable } from '../../components/DataTable.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { Modal } from '../../components/Modal.jsx';

const TABS = [
  { id: 'vouchers', label: 'Fee Vouchers', icon: Receipt },
  { id: 'payments', label: 'Payments & Refunds', icon: Wallet },
  { id: 'accounts', label: 'Student Ledgers & Discounts', icon: Users },
  { id: 'structures', label: 'Fee Structures', icon: Wallet },
];

const VOUCHER_BADGE = {
  paid: 'success',
  pending: 'warning',
  processing: 'info',
  partially_paid: 'info',
  overdue: 'danger',
  failed: 'danger',
  expired: 'neutral',
  refunded: 'neutral',
};

export function AdminFeesPage() {
  const [activeTab, setActiveTab] = useState('vouchers');
  const [vouchers, setVouchers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [structures, setStructures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalType, setModalType] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [vRes, pRes, aRes, sRes, cRes, stRes] = await Promise.all([
        axiosClient.get('/vouchers', { params: { status: statusFilter || undefined, limit: 50 } }),
        axiosClient.get('/payments'),
        axiosClient.get('/fees/accounts'),
        axiosClient.get('/fees/structures'),
        axiosClient.get('/courses'),
        axiosClient.get('/students', { params: { limit: 100 } }),
      ]);
      setVouchers(vRes.data?.data?.vouchers || []);
      setPayments(pRes.data?.data?.payments || []);
      setAccounts(aRes.data?.data?.accounts || []);
      setStructures(sRes.data?.data?.feeStructures || []);
      setCourses(cRes.data?.data?.courses || []);
      setStudents(stRes.data?.data?.students || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load fee data.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function openModal(type) {
    setFormError('');
    setForm({});
    setModalType(type);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (modalType === 'structures') {
        await axiosClient.post('/fees/structures', form);
      } else if (modalType === 'accounts') {
        await axiosClient.post('/fees/accounts/assign', form);
      } else if (modalType === 'vouchers') {
        await axiosClient.post('/vouchers', form);
      } else if (modalType === 'payments') {
        await axiosClient.post('/payments/manual', form);
      }
      setModalType(null);
      loadAll();
    } catch (err) {
      const details = err.response?.data?.details;
      setFormError(
        details?.map((d) => d.message).join(' • ') ||
          err.response?.data?.message ||
          'Operation failed.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleApplyLateFine(voucher) {
    try {
      await axiosClient.patch(`/vouchers/${voucher._id}/late-fine`, { lateCharges: 500 });
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to apply late fine.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fee Management &amp; Vouchers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure fee structures, assign student concessions, and generate monthly vouchers.
          </p>
        </div>
        <button onClick={() => openModal(activeTab)} className="btn-primary">
          <Plus className="h-4 w-4" />
          {activeTab === 'vouchers'
            ? 'Generate Voucher'
            : activeTab === 'payments'
            ? 'Record Counter Payment'
            : activeTab === 'accounts'
            ? 'Assign Fee Plan'
            : 'New Fee Structure'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium ${
                active
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'vouchers' && (
        <DataTable
          isLoading={loading}
          rows={vouchers}
          filterSlot={
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-44 py-2"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="partially_paid">Partially Paid</option>
            </select>
          }
          columns={[
            { key: 'voucherNumber', header: 'Voucher #', render: (v) => <span className="font-mono text-xs font-semibold text-brand-700">{v.voucherNumber}</span> },
            { key: 'student', header: 'Student', render: (v) => `${v.studentId?.studentId || ''} — ${v.studentId?.fullName || ''}` },
            { key: 'billingMonth', header: 'Month' },
            { key: 'totalPayable', header: 'Payable (PKR)', render: (v) => v.totalPayable.toLocaleString() },
            { key: 'dueDate', header: 'Due Date', render: (v) => new Date(v.dueDate).toLocaleDateString() },
            { key: 'status', header: 'Status', render: (v) => <StatusBadge label={v.status} variant={VOUCHER_BADGE[v.status] || 'neutral'} /> },
            {
              key: 'actions',
              header: 'Actions',
              render: (v) => (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchAndOpenPdf(`/vouchers/${v._id}/pdf`, `Voucher-${v.voucherNumber}.pdf`, 'download')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </button>
                  {v.status !== 'paid' ? (
                    <button
                      onClick={() => handleApplyLateFine(v)}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-900"
                    >
                      + Fine
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700">Paid</span>
                  )}
                </div>
              ),
            },
          ]}
          emptyIcon={Receipt}
          emptyTitle="No fee vouchers generated"
          emptyDescription="Assign a fee plan to a student, then generate their monthly voucher."
        />
      )}

      {activeTab === 'payments' && (
        <DataTable
          isLoading={loading}
          rows={payments}
          columns={[
            { key: 'voucher', header: 'Voucher #', render: (p) => <span className="font-mono text-xs font-semibold text-brand-700">{p.voucherId?.voucherNumber}</span> },
            { key: 'student', header: 'Student', render: (p) => `${p.studentId?.studentId || ''} — ${p.studentId?.fullName || ''}` },
            { key: 'amountPaid', header: 'Amount (PKR)', render: (p) => p.amountPaid.toLocaleString() },
            { key: 'method', header: 'Method', render: (p) => p.paymentMethod.replace('_', ' ').toUpperCase() },
            { key: 'status', header: 'Status', render: (p) => <StatusBadge label={p.status} variant={p.status === 'completed' ? 'success' : p.status === 'refunded' ? 'neutral' : 'warning'} /> },
            { key: 'date', header: 'Date', render: (p) => new Date(p.paymentDate).toLocaleDateString() },
          ]}
          emptyIcon={Wallet}
          emptyTitle="No payment transactions yet"
          emptyDescription="Verified online and counter payments will appear here."
        />
      )}

      {activeTab === 'accounts' && (
        <DataTable
          isLoading={loading}
          rows={accounts}
          columns={[
            { key: 'student', header: 'Student', render: (a) => `${a.studentId?.studentId || ''} — ${a.studentId?.fullName || ''}` },
            { key: 'structure', header: 'Fee Plan', render: (a) => a.feeStructureId?.title },
            { key: 'discount', header: 'Discount %', render: (a) => `${a.discountPercentage}%` },
            { key: 'scholarship', header: 'Scholarship (PKR)', render: (a) => a.scholarshipAmount.toLocaleString() },
            { key: 'balance', header: 'Balance (PKR)', render: (a) => <span className="font-semibold">{a.currentBalance.toLocaleString()}</span> },
          ]}
          emptyIcon={Users}
          emptyTitle="No student fee accounts"
          emptyDescription="Assign a fee structure to students to manage discounts and billing."
        />
      )}

      {activeTab === 'structures' && (
        <DataTable
          isLoading={loading}
          rows={structures}
          columns={[
            { key: 'title', header: 'Structure Title', render: (s) => <span className="font-medium text-slate-900">{s.title}</span> },
            { key: 'course', header: 'Course', render: (s) => s.courseId?.courseCode },
            { key: 'tuitionFee', header: 'Tuition (PKR)', render: (s) => s.tuitionFee.toLocaleString() },
            { key: 'labFee', header: 'Lab Fee', render: (s) => s.labFee.toLocaleString() },
            { key: 'lateFineAmount', header: 'Late Fine', render: (s) => s.lateFineAmount.toLocaleString() },
          ]}
          emptyIcon={Wallet}
          emptyTitle="No fee structures configured"
          emptyDescription="Create a course fee structure to begin billing students."
        />
      )}

      <Modal
        isOpen={Boolean(modalType)}
        onClose={() => setModalType(null)}
        title={
          modalType === 'vouchers'
            ? 'Generate Monthly Fee Voucher'
            : modalType === 'accounts'
            ? 'Assign Fee Plan & Concessions'
            : 'Create Fee Structure'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {formError}
            </div>
          )}

          {modalType === 'structures' && (
            <>
              <input type="text" required placeholder="Title (e.g. Standard SE Monthly)" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
              <select required value={form.courseId || ''} onChange={(e) => setForm({ ...form, courseId: e.target.value })} className="input-field">
                <option value="">Select Course</option>
                {courses.map((c) => <option key={c._id} value={c._id}>{c.courseCode} — {c.title}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" required min="0" placeholder="Tuition Fee" value={form.tuitionFee || ''} onChange={(e) => setForm({ ...form, tuitionFee: e.target.value })} className="input-field" />
                <input type="number" min="0" placeholder="Lab Fee" value={form.labFee || ''} onChange={(e) => setForm({ ...form, labFee: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" min="0" placeholder="Admission Fee" value={form.admissionFee || ''} onChange={(e) => setForm({ ...form, admissionFee: e.target.value })} className="input-field" />
                <input type="number" min="0" placeholder="Late Fine" value={form.lateFineAmount || 500} onChange={(e) => setForm({ ...form, lateFineAmount: e.target.value })} className="input-field" />
              </div>
            </>
          )}

          {modalType === 'accounts' && (
            <>
              <select required value={form.studentId || ''} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="input-field">
                <option value="">Select Student</option>
                {students.map((s) => <option key={s._id} value={s._id}>{s.studentId} — {s.fullName}</option>)}
              </select>
              <select required value={form.feeStructureId || ''} onChange={(e) => setForm({ ...form, feeStructureId: e.target.value })} className="input-field">
                <option value="">Select Fee Structure</option>
                {structures.map((st) => <option key={st._id} value={st._id}>{st.title} (PKR {st.tuitionFee})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" min="0" max="100" placeholder="Discount %" value={form.discountPercentage || 0} onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })} className="input-field" />
                <input type="number" min="0" placeholder="Scholarship (PKR)" value={form.scholarshipAmount || 0} onChange={(e) => setForm({ ...form, scholarshipAmount: e.target.value })} className="input-field" />
              </div>
            </>
          )}

          {modalType === 'vouchers' && (
            <>
              <select required value={form.studentId || ''} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="input-field">
                <option value="">Select Student</option>
                {students.map((s) => <option key={s._id} value={s._id}>{s.studentId} — {s.fullName}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="month" required value={form.billingMonth || ''} onChange={(e) => setForm({ ...form, billingMonth: e.target.value })} className="input-field" />
                <input type="date" required value={form.dueDate || ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input-field" />
              </div>
              <input type="text" required placeholder="Description (e.g. Monthly Tuition Nov 2026)" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
            </>
          )}

          {modalType === 'payments' && (
            <>
              <select required value={form.voucherId || ''} onChange={(e) => setForm({ ...form, voucherId: e.target.value })} className="input-field">
                <option value="">Select Unpaid Voucher</option>
                {vouchers.filter((v) => v.status !== 'paid').map((v) => (
                  <option key={v._id} value={v._id}>{v.voucherNumber} — {v.studentId?.fullName} (PKR {v.totalPayable - v.paidAmount})</option>
                ))}
              </select>
              <input type="number" required min="1" placeholder="Amount Paid (PKR)" value={form.amountPaid || ''} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} className="input-field" />
              <select value={form.paymentMethod || 'cash'} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="input-field">
                <option value="cash">Counter Cash</option>
                <option value="bank_transfer">Verified Bank Transfer</option>
              </select>
              <input type="text" required placeholder="Bank Slip / Counter Ref #" value={form.transactionReference || ''} onChange={(e) => setForm({ ...form, transactionReference: e.target.value })} className="input-field" />
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalType(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
