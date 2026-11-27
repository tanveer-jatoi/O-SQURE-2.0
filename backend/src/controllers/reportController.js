import { FeeVoucher } from '../models/FeeVoucher.js';
import { Payment } from '../models/Payment.js';
import { StudentFee } from '../models/StudentFee.js';
import { Refund } from '../models/Refund.js';
import { Attendance } from '../models/Attendance.js';
import { Student } from '../models/Student.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { streamExcelReport, streamTabularPdfReport } from '../services/reportExportService.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * GET /api/v1/reports/overview
 * Aggregates live financial and attendance KPIs for the Admin Analytics Dashboard.
 */
export const getReportsOverview = catchAsync(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    paymentStats,
    todayStats,
    monthStats,
    voucherStats,
    discountStats,
    refundStats,
    monthlyCollections,
    attendanceBreakdown,
  ] = await Promise.all([
    Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amountPaid' } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'completed', paymentDate: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'completed', paymentDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]),
    FeeVoucher.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          remaining: { $sum: { $max: [0, { $subtract: ['$totalPayable', '$paidAmount'] }] } },
        },
      },
    ]),
    StudentFee.aggregate([
      { $group: { _id: null, totalScholarship: { $sum: '$scholarshipAmount' } } },
    ]),
    Refund.aggregate([
      { $group: { _id: null, totalRefunded: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paymentDate' } },
          collected: { $sum: '$amountPaid' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 6 },
    ]),
    Attendance.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const paymentByStatus = Object.fromEntries(paymentStats.map((p) => [p._id, p]));
  const voucherByStatus = Object.fromEntries(voucherStats.map((v) => [v._id, v]));

  const pendingFees =
    (voucherByStatus.pending?.remaining || 0) +
    (voucherByStatus.partially_paid?.remaining || 0) +
    (voucherByStatus.overdue?.remaining || 0);

  return sendSuccess(res, {
    message: 'Analytics overview retrieved.',
    data: {
      financial: {
        totalCollected: paymentByStatus.completed?.amount || 0,
        todayCollections: todayStats[0]?.total || 0,
        monthlyCollections: monthStats[0]?.total || 0,
        pendingFees,
        overdueFees: voucherByStatus.overdue?.remaining || 0,
        successfulTransactions: paymentByStatus.completed?.count || 0,
        failedTransactions: paymentByStatus.failed?.count || 0,
        totalScholarships: discountStats[0]?.totalScholarship || 0,
        totalRefunded: refundStats[0]?.totalRefunded || 0,
      },
      monthlySeries: monthlyCollections.map((m) => ({
        month: m._id,
        collected: m.collected,
      })),
      attendanceSeries: attendanceBreakdown.map((a) => ({
        status: a._id,
        count: a.count,
      })),
    },
  });
});

/**
 * GET /api/v1/reports/export?type=fees|outstanding|attendance|students&format=excel|pdf
 */
export const exportReport = catchAsync(async (req, res, next) => {
  const { type = 'fees', format = 'excel' } = req.query;

  let title = '';
  let columns = [];
  let rows = [];

  if (type === 'fees') {
    title = 'Fee Collection Report';
    columns = [
      { header: 'Voucher #', key: 'voucherNumber', width: 20 },
      { header: 'Student ID', key: 'studentId', width: 20 },
      { header: 'Student Name', key: 'studentName', width: 24 },
      { header: 'Month', key: 'billingMonth', width: 12 },
      { header: 'Payable (PKR)', key: 'totalPayable', width: 16 },
      { header: 'Paid (PKR)', key: 'paidAmount', width: 16 },
      { header: 'Status', key: 'status', width: 15 },
    ];
    const vouchers = await FeeVoucher.find()
      .populate('studentId', 'studentId fullName')
      .sort({ createdAt: -1 })
      .lean();
    rows = vouchers.map((v) => ({
      voucherNumber: v.voucherNumber,
      studentId: v.studentId?.studentId || '—',
      studentName: v.studentId?.fullName || '—',
      billingMonth: v.billingMonth,
      totalPayable: v.totalPayable,
      paidAmount: v.paidAmount,
      status: v.status.toUpperCase(),
    }));
  } else if (type === 'outstanding') {
    title = 'Outstanding Fees Report';
    columns = [
      { header: 'Voucher #', key: 'voucherNumber', width: 20 },
      { header: 'Student ID', key: 'studentId', width: 20 },
      { header: 'Student Name', key: 'studentName', width: 24 },
      { header: 'Due Date', key: 'dueDate', width: 16 },
      { header: 'Remaining (PKR)', key: 'remaining', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
    ];
    const vouchers = await FeeVoucher.find({
      status: { $in: ['pending', 'overdue', 'partially_paid'] },
    })
      .populate('studentId', 'studentId fullName')
      .sort({ dueDate: 1 })
      .lean();
    rows = vouchers.map((v) => ({
      voucherNumber: v.voucherNumber,
      studentId: v.studentId?.studentId || '—',
      studentName: v.studentId?.fullName || '—',
      dueDate: new Date(v.dueDate).toLocaleDateString(),
      remaining: Math.max(0, v.totalPayable - v.paidAmount),
      status: v.status.toUpperCase(),
    }));
  } else if (type === 'attendance') {
    title = 'Attendance Summary Report';
    columns = [
      { header: 'Date', key: 'date', width: 16 },
      { header: 'Student ID', key: 'studentId', width: 20 },
      { header: 'Student Name', key: 'studentName', width: 24 },
      { header: 'Batch', key: 'batchCode', width: 15 },
      { header: 'Status', key: 'status', width: 14 },
    ];
    const records = await Attendance.find()
      .populate('studentId', 'studentId fullName')
      .populate('batchId', 'batchCode')
      .sort({ attendanceDate: -1 })
      .limit(500)
      .lean();
    rows = records.map((r) => ({
      date: new Date(r.attendanceDate).toLocaleDateString(),
      studentId: r.studentId?.studentId || '—',
      studentName: r.studentId?.fullName || '—',
      batchCode: r.batchId?.batchCode || '—',
      status: r.status.toUpperCase(),
    }));
  } else if (type === 'students') {
    title = 'Student Enrollment Directory';
    columns = [
      { header: 'Student ID', key: 'studentId', width: 20 },
      { header: 'Full Name', key: 'fullName', width: 24 },
      { header: 'Father Name', key: 'fatherName', width: 24 },
      { header: 'Phone', key: 'contactPhone', width: 18 },
      { header: 'Status', key: 'academicStatus', width: 15 },
    ];
    const students = await Student.find().sort({ createdAt: -1 }).lean();
    rows = students.map((s) => ({
      studentId: s.studentId,
      fullName: s.fullName,
      fatherName: s.fatherName,
      contactPhone: s.contactPhone,
      academicStatus: s.academicStatus.toUpperCase(),
    }));
  } else {
    return next(new AppError('Unsupported report type.', 400, 'INVALID_REPORT_TYPE'));
  }

  await recordAuditLog({
    req,
    action: 'REPORT_EXPORTED',
    targetEntity: 'Report',
    metadata: { type, format, rowCount: rows.length },
  });

  const filename = `OSquare-${type}-${new Date().toISOString().slice(0, 10)}`;

  if (format === 'pdf') {
    return streamTabularPdfReport(res, {
      title,
      subtitle: `Generated on ${new Date().toLocaleString()} | Total Records: ${rows.length}`,
      filename,
      columns,
      rows,
    });
  }

  return streamExcelReport(res, {
    sheetName: title.slice(0, 30),
    filename,
    columns,
    rows,
  });
});
