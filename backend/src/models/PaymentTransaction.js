import mongoose from 'mongoose';

const paymentTransactionSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeVoucher',
      required: true,
    },
    gatewayTransactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    gatewayProvider: {
      type: String,
      enum: ['raast', 'payfast_pk', 'jazzcash', 'easypaisa', 'manual_counter'],
      required: true,
    },
    rawWebhookPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    signatureVerified: {
      type: Boolean,
      default: false,
    },
    transactionStatus: {
      type: String,
      enum: ['initiated', 'authorized', 'settled', 'failed'],
      default: 'initiated',
      index: true,
    },
  },
  { timestamps: true }
);

export const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);
