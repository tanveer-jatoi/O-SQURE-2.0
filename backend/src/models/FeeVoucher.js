import mongoose from 'mongoose';

const feeVoucherSchema = new mongoose.Schema(
  {
    voucherNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    billingMonth: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}$/, 'billingMonth must be YYYY-MM'],
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    baseAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    lateCharges: { type: Number, default: 0, min: 0 },
    totalPayable: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    paymentReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    qrPayloadString: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'paid',
        'partially_paid',
        'overdue',
        'failed',
        'expired',
        'refunded',
      ],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

feeVoucherSchema.index({ studentId: 1, billingMonth: 1 }, { unique: true });

export const FeeVoucher = mongoose.model('FeeVoucher', feeVoucherSchema);
