import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    processedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Refund = mongoose.model('Refund', refundSchema);
