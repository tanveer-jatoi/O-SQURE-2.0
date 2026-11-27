import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeVoucher',
      required: true,
      index: true,
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
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['raast_qr', 'online_gateway', 'bank_transfer', 'cash'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    collectedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
