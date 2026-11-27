import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { AppError } from './utils/appError.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import admissionRoutes from './routes/admissionRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import classRoomRoutes from './routes/classRoomRoutes.js';
import batchRoutes from './routes/batchRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import attendanceSessionRoutes from './routes/attendanceSessionRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import examRoutes from './routes/examRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import voucherRoutes from './routes/voucherRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import paymentWebhookRoutes from './routes/paymentWebhookRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import learningMaterialRoutes from './routes/learningMaterialRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

const app = express();

// 1. Security HTTP Headers
app.use(helmet());

// 2. Strict CORS Configuration (whitelist only our React frontend)
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Global Rate Limiting (protects API from bursts & automated abuse)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP. Please try again later.',
  },
});
app.use('/api', apiLimiter);

// 4. Request Logging (development)
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// 5. Body & Cookie Parsers (with payload size limit to prevent memory exhaustion)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// 6. API Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/admissions', admissionRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/classes', classRoomRoutes);
app.use('/api/v1/batches', batchRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/attendance-sessions', attendanceSessionRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/examinations', examRoutes);
app.use('/api/v1/results', resultRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/vouchers', voucherRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/payment-webhooks', paymentWebhookRoutes);
app.use('/api/v1/receipts', receiptRoutes);
app.use('/api/v1/timetable', timetableRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/materials', learningMaterialRoutes);
app.use('/api/v1/settings', settingRoutes);
app.use('/api/v1/reports', reportRoutes);

// 7. Catch Unhandled Routes (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found on this server.`, 404, 'ROUTE_NOT_FOUND'));
});

// 8. Global Error Handler
app.use(globalErrorHandler);

export default app;
