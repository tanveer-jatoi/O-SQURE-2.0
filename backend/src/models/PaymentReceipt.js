import mongoose from 'mongoose';

const paymentReceiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      unique: true,
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeVoucher',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    transactionReference: {
      type: String,
      required: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const PaymentReceipt = mongoose.model('PaymentReceipt', paymentReceiptSchema);
