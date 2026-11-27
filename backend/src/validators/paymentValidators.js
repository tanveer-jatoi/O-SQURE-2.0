import { z } from 'zod';

export const initiateCheckoutSchema = z.object({
  voucherId: z.string().min(1),
  paymentMethod: z.enum(['raast_qr', 'online_gateway', 'bank_transfer']).default('raast_qr'),
  gatewayProvider: z
    .enum(['raast', 'payfast_pk', 'jazzcash', 'easypaisa'])
    .default('raast'),
});

export const recordManualPaymentSchema = z.object({
  voucherId: z.string().min(1),
  amountPaid: z.coerce.number().min(1),
  paymentMethod: z.enum(['cash', 'bank_transfer']).default('cash'),
  transactionReference: z.string().trim().min(3).max(80),
});

export const refundPaymentSchema = z.object({
  reason: z.string().trim().min(3).max(300),
});
