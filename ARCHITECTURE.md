# O-SQUARE 2.0 — COMPLETE CODE STRUCTURE & ARCHITECTURE REFERENCE

> **Purpose:** Use this document as the permanent architectural map of **O-Square 2.0**. Whenever you want to add a new module, modify an existing workflow, or onboard a developer/AI assistant, this file describes every layer, file, model, route, and extension pattern in the codebase.

---

## 1. HIGH-LEVEL SYSTEM ARCHITECTURE

O-Square 2.0 uses a decoupled **MERN** client-server architecture:

```text
[React 18 + Tailwind SPA (Vite :5173)]
   │  • In-memory Access Token (XSS-safe)
   │  • HttpOnly Refresh Cookie (auto-refresh via axiosClient interceptor)
   ▼
[Express.js REST API (:5000/api/v1)]
   ├── Security Perimeter: helmet() → cors(CLIENT_URL) → rateLimit() → express.json(100kb)
   ├── Auth & RBAC Guard:  protect() → authorizeRoles(...) → authorizeSelfOrRoles(...)
   ├── Input Validation:   validateBody(zodSchema)
   ├── Business Logic:     controllers/ → services/
   ├── Audit Trail:        auditService.recordAuditLog() → AuditLog collection
   └── Error Normalization: catchAsync() → AppError → globalErrorHandler()
   ▼
[MongoDB + Mongoose ODM]
```

### Core Architectural Conventions
- **Backend ES Modules (`"type": "module"`)**: Uses `import`/`export` consistently across both backend and frontend.
- **Uniform API Response Contract**:
  - Success: `{ success: true, message: "...", data: { ... }, meta?: { page, limit, total, totalPages } }` (via `sendSuccess` in `backend/src/utils/apiResponse.js`).
  - Error: `{ success: false, status: "fail"|"error", errorCode: "...", message: "...", details?: [...] }` (via `AppError` + `globalErrorHandler`).
- **Zero Client Trust**: Every role check (`superadmin`, `admin`, `teacher`, `student`), teacher batch assignment check, and student record ownership check is enforced on the backend.

---

## 2. COMPLETE BACKEND STRUCTURE (`backend/`)

### Root & Config
- `backend/package.json` — Scripts: `dev` (nodemon), `start`, `seed`, `test` (`node --test`).
- `backend/.env` & `backend/.env.example` — Environment variables (`MONGODB_URI`, `JWT_*`, `PAYMENT_WEBHOOK_SECRET`, `SEED_SUPERADMIN_*`).
- `backend/src/server.js` — Connects MongoDB, boots HTTP server, handles `SIGINT`/`SIGTERM`/`unhandledRejection` graceful shutdown.
- `backend/src/app.js` — Configures `helmet`, `cors`, `rateLimit`, `morgan`, `cookieParser`, mounts all `/api/v1/*` routers, 404 handler, and `globalErrorHandler`.
- `backend/src/config/env.js` — Loads and validates required `.env` variables on startup.
- `backend/src/config/db.js` — Mongoose connection lifecycle (`connectDatabase`, `disconnectDatabase`).

### Middleware (`backend/src/middleware/`)
- `authMiddleware.js` — `protect` (JWT + active status + passwordChangedAt check), `authorizeRoles(...roles)`, `authorizeSelfOrRoles(param, ...bypassRoles)`.
- `errorHandler.js` — Global error normalizer (Mongoose `CastError`, `11000` duplicate key, `ValidationError`, JWT errors, production stack hiding).
- `rateLimiters.js` — `authLimiter` (15 req / 15 min) and `qrScanLimiter` (20 req / min).
- `validateRequest.js` — `validateBody(zodSchema)` strips unknown fields and formats field errors.

### Utilities (`backend/src/utils/`)
- `appError.js` — `AppError(message, statusCode, errorCode, details)`.
- `catchAsync.js` — Async controller wrapper forwarding rejected promises to `next(err)`.
- `apiResponse.js` — `sendSuccess(res, { statusCode, message, data, meta })`.
- `idGenerator.js` — `generateCode(prefix)` (e.g. `OSQ-STU-2026-XXXX`, `VCH-2026-XXXX`).
- `seedSystem.js` — Idempotent CLI seeder (`npm run seed`) for `Permission`, `Role`, and initial `superadmin` `User`.

### Mongoose Database Models (`backend/src/models/` — 28 Schemas)
| Domain | Model Files |
| :--- | :--- |
| **Auth & Security** | `User.js`, `Role.js`, `Permission.js`, `AuditLog.js` |
| **People & Admissions** | `Student.js`, `Teacher.js`, `Admission.js` |
| **Academics** | `Course.js`, `Subject.js`, `ClassRoom.js`, `Batch.js`, `Enrollment.js`, `TeacherAssignment.js` |
| **QR Attendance** | `AttendanceSession.js`, `Attendance.js` |
| **Exams & Grading** | `Examination.js`, `ExamSubject.js`, `Result.js` |
| **Finance & Payments** | `FeeStructure.js`, `StudentFee.js`, `FeeVoucher.js`, `Payment.js`, `PaymentTransaction.js`, `PaymentReceipt.js`, `Refund.js` |
| **Campus Hub & Config** | `Timetable.js`, `Announcement.js`, `LearningMaterial.js`, `SystemSetting.js` |

### Business Services (`backend/src/services/`)
- `tokenService.js` — Signs/verifies Access & Refresh JWTs, SHA-256 `hashToken`, cookie options.
- `auditService.js` — `recordAuditLog()` capturing actor, role, IP, User-Agent, action, entity, metadata.
- `onboardingService.js` — Atomic `provisionStudentAccount()` & `provisionTeacherAccount()` with User rollback on failure.
- `scheduleConflictService.js` — `validateBatchScheduleConflict()`, `validateTimetableSlotConflict()`, `getTeacherAssignedBatchIds()`.
- `qrAttendanceService.js` — Per-session secret generation, 30s HMAC-SHA256 rotating QR tokens, `crypto.timingSafeEqual` verification.
- `gradingService.js` — `calculateGrade()` (`Distinction` ≥ 85%, `Credit` ≥ 70%, `Pass` ≥ passingMarks, `Fail`).
- `pdfResultService.js` — `streamResultCardPdf()` (A4 Result Card PDF via `pdfkit`).
- `feeService.js` — `computeVoucherAmounts()`, `buildPaymentReference()`, `buildQrPayloadString()`.
- `paymentService.js` — `renderPaymentQrDataUrl()`, `verifyPaymentWebhookSignature()`, idempotent `reconcileSettledTransaction()`, `recordFailedTransaction()`.
- `pdfFinanceService.js` — `streamFeeVoucherPdf()` & `streamPaymentReceiptPdf()` (A4 PDFs with embedded QR codes).
- `reportExportService.js` — `streamExcelReport()` (`exceljs` `.xlsx`) & `streamTabularPdfReport()` (A4 landscape PDF).

### Validation Schemas (`backend/src/validators/`)
- `authValidators.js`, `userValidators.js`, `studentValidators.js`, `teacherValidators.js`, `admissionValidators.js`, `academicValidators.js`, `attendanceValidators.js`, `examValidators.js`, `feeValidators.js`, `paymentValidators.js`, `campusHubValidators.js`.

### Controllers & Routes (`backend/src/controllers/` & `backend/src/routes/`)
| API Mount (`/api/v1/...`) | Route File | Controller File |
| :--- | :--- | :--- |
| `/health` | `healthRoutes.js` | Inline health & DB state |
| `/auth` | `authRoutes.js` | `authController.js` |
| `/users` | `userRoutes.js` | `userController.js` |
| `/audit-logs` | `auditLogRoutes.js` | `auditLogController.js` |
| `/dashboard` | `dashboardRoutes.js` | `dashboardController.js` |
| `/students` | `studentRoutes.js` | `studentController.js` |
| `/teachers` | `teacherRoutes.js` | `teacherController.js` |
| `/admissions` | `admissionRoutes.js` | `admissionController.js` |
| `/courses` | `courseRoutes.js` | `academicController.js` |
| `/subjects` | `subjectRoutes.js` | `academicController.js` |
| `/classes` | `classRoomRoutes.js` | `academicController.js` |
| `/batches` | `batchRoutes.js` | `academicController.js` |
| `/enrollments` | `enrollmentRoutes.js` | `academicController.js` |
| `/attendance-sessions` | `attendanceSessionRoutes.js` | `attendanceSessionController.js` |
| `/attendance` | `attendanceRoutes.js` | `attendanceController.js` |
| `/examinations` | `examRoutes.js` | `examController.js` |
| `/results` | `resultRoutes.js` | `resultController.js` |
| `/fees` | `feeRoutes.js` | `feeController.js` |
| `/vouchers` | `voucherRoutes.js` | `voucherController.js` |
| `/payments` | `paymentRoutes.js` | `paymentController.js` |
| `/payment-webhooks` | `paymentWebhookRoutes.js` | `paymentController.js` |
| `/receipts` | `receiptRoutes.js` | `paymentController.js` |
| `/timetable` | `timetableRoutes.js` | `timetableController.js` |
| `/announcements` | `announcementRoutes.js` | `campusHubController.js` |
| `/materials` | `learningMaterialRoutes.js` | `campusHubController.js` |
| `/settings` | `settingRoutes.js` | `campusHubController.js` |
| `/reports` | `reportRoutes.js` | `reportController.js` |

### Automated Tests (`backend/tests/`)
- `securityAndCoreSuite.test.js` — Runs via `npm test` (`node --test`).

---

## 3. COMPLETE FRONTEND STRUCTURE (`frontend/`)

### Core Configuration & Entry
- `frontend/package.json`, `vite.config.js` (`/api` proxy to `:5000`), `tailwind.config.js`, `postcss.config.js`, `index.html`.
- `frontend/src/main.jsx` — React DOM root.
- `frontend/src/index.css` — Tailwind directives + `.card-surface`, `.btn-primary`, `.btn-secondary`, `.input-field`.
- `frontend/src/App.jsx` — Master `BrowserRouter` route tree guarded by `PublicOnlyRoute` & `ProtectedRoute`.

### State, API & Helpers
- `frontend/src/api/axiosClient.js` — In-memory `accessToken` + `withCredentials: true` + queued `401` silent token refresh.
- `frontend/src/context/AuthContext.jsx` — Silent session bootstrap on mount, `login`, `logout`, `hasPermission`, `getRoleHomePath`.
- `frontend/src/hooks/useAuth.js` — Context consumer hook.
- `frontend/src/config/navigation.js` — `ROLE_NAV_ITEMS` sidebar trees for `superadmin`, `admin`, `teacher`, `student`.
- `frontend/src/utils/fileDownload.js` — `fetchAndOpenPdf` (download/print) and `fetchAndDownloadReport` (`.xlsx` / `.pdf`).

### Layout & Reusable Components
- `frontend/src/layouts/DashboardLayout.jsx` — Responsive Slate Navy sidebar + sticky top header + `<Outlet />`.
- `frontend/src/components/`:
  - `ProtectedRoute.jsx`, `PublicOnlyRoute.jsx`
  - `DataTable.jsx`, `StatCard.jsx`, `Modal.jsx`, `StatusBadge.jsx`, `LoadingSpinner.jsx`, `EmptyState.jsx`

### Pages (`frontend/src/pages/`)
- **Auth & Fallbacks**: `LoginPage.jsx`, `UnauthorizedPage.jsx`, `NotFoundPage.jsx`
- **Super Admin (`pages/superadmin/`)**: `SuperAdminDashboard.jsx`, `SystemSettingsPage.jsx`
- **Admin (`pages/admin/`)**: `AdminDashboard.jsx`, `StudentsPage.jsx`, `TeachersPage.jsx`, `AdmissionsPage.jsx`, `AcademicsPage.jsx`, `AttendanceControlPage.jsx`, `ExaminationsPage.jsx`, `AdminFeesPage.jsx`, `ReportsAnalyticsPage.jsx`
- **Teacher (`pages/teacher/`)**: `TeacherDashboard.jsx`, `TeacherBatchesPage.jsx`, `QrAttendanceSessionPage.jsx`, `TeacherMarksEntryPage.jsx`
- **Student (`pages/student/`)**: `StudentDashboard.jsx`, `StudentQrScanPage.jsx`, `StudentAttendancePage.jsx`, `StudentFeesPage.jsx`, `StudentResultsPage.jsx`
- **Shared (`pages/shared/`)**: `UsersManagementPage.jsx`, `AuditLogsPage.jsx`, `ProfileSecurityPage.jsx`, `TimetablePage.jsx`, `NoticesAndMaterialsPage.jsx`, `ModuleComingSoonPage.jsx`

---

## 4. PLAYBOOK: HOW TO ADD A NEW MODULE TO O-SQUARE 2.0

Follow this exact 6-step pattern whenever you add a new feature (e.g. *Library Management* or *Hostel*):

1. **Database Model**: Create `backend/src/models/NewEntity.js` with Mongoose schema & indexes.
2. **Input Validator**: Create `backend/src/validators/newEntityValidators.js` using `zod`.
3. **Controller & Service**: Create `backend/src/controllers/newEntityController.js` wrapping handlers in `catchAsync`, throwing `AppError`, returning `sendSuccess`, and logging mutations with `recordAuditLog`.
4. **Route & Mount**: Create `backend/src/routes/newEntityRoutes.js` with `protect`, `authorizeRoles(...)`, and `validateBody(...)`, then mount `app.use('/api/v1/new-entities', newEntityRoutes)` in `backend/src/app.js`.
5. **Frontend Page & Nav**: Create the page in `frontend/src/pages/<role>/NewEntityPage.jsx` using `axiosClient`, `DataTable`, `Modal`, and `StatusBadge`. Add the link to `frontend/src/config/navigation.js` and the `<Route>` inside `frontend/src/App.jsx`.
6. **Verify**: Add endpoint & logic tests to `backend/tests/securityAndCoreSuite.test.js`, run `cd backend && npm test`, and run `cd frontend && npm run build`.
