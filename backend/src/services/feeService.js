import crypto from 'crypto';

/**
 * Calculates itemized fee breakdown, discounts, scholarships, and net payable.
 */
export function computeVoucherAmounts({
  feeStructure,
  discountPercentage = 0,
  scholarshipAmount = 0,
  includeAdmission = false,
  includeExam = false,
  lateCharges = 0,
}) {
  const baseAmount =
    Number(feeStructure.tuitionFee || 0) +
    Number(feeStructure.labFee || 0) +
    (includeAdmission ? Number(feeStructure.admissionFee || 0) : 0) +
    (includeExam ? Number(feeStructure.examFee || 0) : 0);

  const percentDiscount = Math.round((baseAmount * Number(discountPercentage || 0)) / 100);
  const rawDiscount = percentDiscount + Number(scholarshipAmount || 0);
  const discountAmount = Math.min(baseAmount, Math.max(0, rawDiscount));

  const netLate = Math.max(0, Number(lateCharges || 0));
  const totalPayable = Math.max(0, baseAmount - discountAmount + netLate);

  return {
    baseAmount,
    discountAmount,
    lateCharges: netLate,
    totalPayable,
  };
}

/**
 * Generates a unique 14-digit payment reference for Raast / 1Link bank channels.
 */
export function buildPaymentReference() {
  const ts = Date.now().toString().slice(-8);
  const rand = crypto.randomInt(1000, 9999).toString();
  return `99${ts}${rand}`;
}

/**
 * Generates a structured payment QR payload string for the voucher.
 */
export function buildQrPayloadString({ voucherNumber, paymentReference, totalPayable }) {
  return `OSQ2|REF:${paymentReference}|VCH:${voucherNumber}|AMT:${totalPayable}|CCY:PKR`;
}
