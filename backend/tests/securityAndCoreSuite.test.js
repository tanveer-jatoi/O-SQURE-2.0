import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { PassThrough } from 'node:stream';
import mongoose from 'mongoose';

import app from '../src/app.js';
import { env } from '../src/config/env.js';
import {
  authorizeRoles,
  authorizeSelfOrRoles,
} from '../src/middleware/authMiddleware.js';
import {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../src/services/tokenService.js';
import {
  generateSessionSecret,
  createEphemeralQrPayload,
  parseQrTokenUnverified,
  verifyQrTokenSignature,
} from '../src/services/qrAttendanceService.js';
import { calculateGrade } from '../src/services/gradingService.js';
import {
  doDayPatternsOverlap,
  doTimeRangesOverlap,
} from '../src/services/scheduleConflictService.js';
import {
  computeVoucherAmounts,
  buildPaymentReference,
  buildQrPayloadString,
} from '../src/services/feeService.js';
import { verifyPaymentWebhookSignature } from '../src/services/paymentService.js';
import {
  streamFeeVoucherPdf,
  streamPaymentReceiptPdf,
} from '../src/services/pdfFinanceService.js';
import {
  streamExcelReport,
  streamTabularPdfReport,
} from '../src/services/reportExportService.js';

function createMockStream() {
  const s = new PassThrough();
  const chunks = [];
  s.on('data', (c) => chunks.push(c));
  s.setHeader = () => {};
  return { stream: s, getBuffer: () => Buffer.concat(chunks) };
}

describe('O-Square 2.0 — Security & Core Logic QA Suite', () => {
  let server;
  let baseUrl;

  before(
    () =>
      new Promise((resolve) => {
        server = app.listen(0, () => {
          const { port } = server.address();
          baseUrl = `http://localhost:${port}`;
          resolve();
        });
      })
  );

  after(() => new Promise((resolve) => server.close(resolve)));

  it('1. Rejects unauthenticated access across all protected ERP endpoints (401)', async () => {
    const protectedEndpoints = [
      '/api/v1/auth/me',
      '/api/v1/users',
      '/api/v1/audit-logs',
      '/api/v1/dashboard/summary',
      '/api/v1/students',
      '/api/v1/teachers',
      '/api/v1/admissions',
      '/api/v1/courses',
      '/api/v1/batches',
      '/api/v1/attendance-sessions',
      '/api/v1/attendance',
      '/api/v1/examinations',
      '/api/v1/results',
      '/api/v1/fees/structures',
      '/api/v1/vouchers',
      '/api/v1/payments',
      '/api/v1/receipts',
      '/api/v1/timetable',
      '/api/v1/announcements',
      '/api/v1/materials',
      '/api/v1/settings',
      '/api/v1/reports/overview',
    ];

    for (const path of protectedEndpoints) {
      const res = await fetch(`${baseUrl}${path}`);
      assert.equal(res.status, 401, `Expected 401 on ${path}, got ${res.status}`);
    }
  });

  it('2. Enforces security HTTP headers (Helmet) & input validation (Zod)', async () => {
    const healthRes = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(healthRes.status, 200);
    assert.equal(healthRes.headers.get('x-content-type-options'), 'nosniff');

    const badLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'x', password: '12' }),
    });
    assert.equal(badLogin.status, 400);
    const body = await badLogin.json();
    assert.equal(body.errorCode, 'VALIDATION_ERROR');
  });

  it('3. Enforces RBAC role guards and student self-ownership guards', () => {
    let errRole = null;
    authorizeRoles('superadmin', 'admin')({ user: { role: 'teacher' } }, {}, (e) => {
      errRole = e;
    });
    assert.equal(errRole?.statusCode, 403);
    assert.equal(errRole?.errorCode, 'FORBIDDEN_ROLE');

    let adminAllowed = false;
    authorizeRoles('superadmin', 'admin')({ user: { role: 'admin' } }, {}, (e) => {
      if (!e) adminAllowed = true;
    });
    assert.equal(adminAllowed, true);

    const studentUid = new mongoose.Types.ObjectId();
    const otherUid = new mongoose.Types.ObjectId();

    let ownerErr = null;
    authorizeSelfOrRoles('id', 'admin')(
      { user: { _id: studentUid, role: 'student' }, params: { id: otherUid.toString() } },
      {},
      (e) => {
        ownerErr = e;
      }
    );
    assert.equal(ownerErr?.statusCode, 403);
    assert.equal(ownerErr?.errorCode, 'FORBIDDEN_OWNER');

    let ownerOk = false;
    authorizeSelfOrRoles('id', 'admin')(
      { user: { _id: studentUid, role: 'student' }, params: { id: studentUid.toString() } },
      {},
      (e) => {
        if (!e) ownerOk = true;
      }
    );
    assert.equal(ownerOk, true);
  });

  it('4. Issues and verifies JWT Access/Refresh tokens & SHA-256 token hashing', () => {
    const user = { _id: new mongoose.Types.ObjectId(), role: 'student' };
    const access = signAccessToken(user);
    const decodedA = verifyAccessToken(access);
    assert.equal(decodedA.sub, user._id.toString());
    assert.equal(decodedA.role, 'student');

    const refresh = signRefreshToken(user);
    const decodedR = verifyRefreshToken(refresh);
    assert.equal(decodedR.tokenType, 'refresh');
    assert.equal(hashToken(refresh).length, 64);
  });

  it('5. QR Attendance rejects expired or forged tokens and accepts valid ephemeral tokens', async () => {
    const sid = new mongoose.Types.ObjectId().toString();
    const secret = generateSessionSecret();
    const qr = await createEphemeralQrPayload(sid, secret);

    assert.ok(qr.qrDataUrl.startsWith('data:image/png;base64,'));
    const parsed = parseQrTokenUnverified(qr.token);
    assert.equal(verifyQrTokenSignature(parsed, secret).valid, true);
    assert.deepEqual(verifyQrTokenSignature(parsed, 'wrong_secret'), {
      valid: false,
      reason: 'INVALID_SIGNATURE',
    });

    const expiredPayload = Buffer.from(
      JSON.stringify({ sid, nonce: 'abcd', exp: Math.floor(Date.now() / 1000) - 30 })
    ).toString('base64url');
    const expSig = crypto.createHmac('sha256', secret).update(expiredPayload).digest('hex');
    const expParsed = parseQrTokenUnverified(`${expiredPayload}.${expSig}`);
    assert.deepEqual(verifyQrTokenSignature(expParsed, secret), {
      valid: false,
      reason: 'QR_TOKEN_EXPIRED',
    });
  });

  it('6. Payment webhook rejects invalid HMAC signature and verifies valid signature', async () => {
    const payload = {
      paymentId: 'pay_123',
      gatewayTransactionId: 'TXN-991',
      gatewayProvider: 'raast',
      status: 'settled',
      amountSettled: 12000,
    };

    const validSig = crypto
      .createHmac('sha256', env.paymentWebhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    assert.equal(verifyPaymentWebhookSignature(payload, validSig), true);
    assert.equal(verifyPaymentWebhookSignature(payload, 'forged_sig'), false);

    const res = await fetch(`${baseUrl}/api/v1/payment-webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-osquare-signature': 'forged_sig' },
      body: JSON.stringify(payload),
    });
    assert.equal(res.status, 401);
  });

  it('7. Calculates fees, grades, and schedule conflicts accurately', () => {
    const amounts = computeVoucherAmounts({
      feeStructure: { tuitionFee: 10000, labFee: 2000 },
      discountPercentage: 10,
      scholarshipAmount: 800,
      lateCharges: 500,
    });
    assert.deepEqual(amounts, {
      baseAmount: 12000,
      discountAmount: 2000,
      lateCharges: 500,
      totalPayable: 10500,
    });

    const ref = buildPaymentReference();
    assert.ok(ref.startsWith('99') && ref.length === 14);
    assert.ok(buildQrPayloadString({ voucherNumber: 'V1', paymentReference: ref, totalPayable: 10500 }).includes('PKR'));

    assert.equal(calculateGrade({ marksObtained: 88, totalMarks: 100, passingMarks: 50 }).grade, 'Distinction');
    assert.equal(calculateGrade({ marksObtained: 72, totalMarks: 100, passingMarks: 50 }).grade, 'Credit');
    assert.equal(calculateGrade({ marksObtained: 55, totalMarks: 100, passingMarks: 50 }).grade, 'Pass');
    assert.equal(calculateGrade({ marksObtained: 40, totalMarks: 100, passingMarks: 50 }).grade, 'Fail');
    assert.equal(calculateGrade({ marksObtained: 95, totalMarks: 100, passingMarks: 50, isAbsent: true }).grade, 'Fail');

    assert.equal(doDayPatternsOverlap('MWF', 'TTS'), false);
    assert.equal(doDayPatternsOverlap('MWF', 'DAILY'), true);
    assert.equal(doTimeRangesOverlap('09:00', '11:00', '11:00', '13:00'), false);
    assert.equal(doTimeRangesOverlap('09:00', '11:00', '10:00', '12:00'), true);
  });

  it('8. Generates valid binary PDFs (Vouchers, Receipts, Reports) and Excel (.xlsx) exports', async () => {
    const vMock = createMockStream();
    await streamFeeVoucherPdf(vMock.stream, {
      voucher: {
        voucherNumber: 'VCH-QA-1',
        status: 'pending',
        issueDate: new Date(),
        dueDate: new Date(),
        billingMonth: '2026-11',
        description: 'Tuition',
        baseAmount: 10000,
        discountAmount: 0,
        lateCharges: 0,
        totalPayable: 10000,
        paymentReference: '99123456789012',
        qrPayloadString: 'OSQ2|REF:99123456789012|VCH:VCH-QA-1|AMT:10000|CCY:PKR',
      },
      student: { fullName: 'QA Student', studentId: 'OSQ-STU-QA' },
    });
    await new Promise((r) => vMock.stream.on('end', r));
    assert.equal(vMock.getBuffer().toString('utf8', 0, 5), '%PDF-');

    const rMock = createMockStream();
    await streamPaymentReceiptPdf(rMock.stream, {
      receipt: {
        receiptNumber: 'REC-QA-1',
        issuedAt: new Date(),
        amountPaid: 10000,
        paymentMethod: 'raast_qr',
        transactionReference: 'TXN-QA-1',
      },
      voucher: { voucherNumber: 'VCH-QA-1', billingMonth: '2026-11' },
      student: { fullName: 'QA Student', studentId: 'OSQ-STU-QA' },
    });
    await new Promise((r) => rMock.stream.on('end', r));
    assert.equal(rMock.getBuffer().toString('utf8', 0, 5), '%PDF-');

    const xMock = createMockStream();
    await streamExcelReport(xMock.stream, {
      sheetName: 'QA',
      filename: 'qa',
      columns: [{ header: 'Col', key: 'c' }],
      rows: [{ c: 'ok' }],
    });
    assert.equal(xMock.getBuffer().toString('utf8', 0, 2), 'PK');

    const pMock = createMockStream();
    streamTabularPdfReport(pMock.stream, {
      title: 'QA Report',
      subtitle: 'Test',
      filename: 'qa',
      columns: [{ header: 'Col', key: 'c' }],
      rows: [{ c: 'ok' }],
    });
    await new Promise((r) => pMock.stream.on('end', r));
    assert.equal(pMock.getBuffer().toString('utf8', 0, 5), '%PDF-');
  });
});
