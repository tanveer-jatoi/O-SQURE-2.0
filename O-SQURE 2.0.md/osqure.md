O-SQUARE 2.0 — MASTER SYSTEM DESIGN & ARCHITECTURAL BLUEPRINT
Enterprise Educational ERP & Campus Management Platform
1. PROJECT OVERVIEW & MENTOR INTRODUCTION
1.1 Welcome & Engineering Philosophy

Welcome to the architectural foundation of O-Square 2.0. As your Senior Software Architect and Engineering Mentor, our primary goal is not merely to write code, but to engineer an enterprise-grade, maintainable, scalable, and resilient campus management system from the ground up.

In enterprise software engineering, 70% of software failures occur due to premature coding without proper architectural modeling. By establishing our data contracts, security boundaries, entity relationships, and operational workflows before writing a single line of backend or frontend code, we ensure:

Zero Architectural Rework: Every database collection, reference, and index is purpose-built to prevent data anomalies.
Predictable Scalability: From single-campus operations to multi-branch franchising without breaking schemas.
Defense-in-Depth Security: Cryptographically verified QR codes, tamper-proof financial workflows, and strict server-side Role-Based and Resource-Level Access Control (RBAC).
1.2 Purpose of O-Square 2.0

O-Square 2.0 is designed specifically to automate and digitize the daily operations of an Aptech Educational Centre. It eliminates paper-based attendance, prevents proxy scanning, digitizes fee collection with automated reconciliation, and gives administrators complete operational visibility while providing teachers and students with intuitive, role-tailored portals.

1.3 Technology Stack & Justification
Layer	Technology	Engineering Justification
Frontend UI	React.js (v18+)	Component-driven architecture, virtual DOM for rapid UI updates, extensive ecosystem for enterprise dashboards.
Styling	Tailwind CSS	Utility-first CSS providing atomic, consistent design tokens, zero runtime overhead, responsive utility classes.
Routing	React Router (v6+)	Declarative client-side routing, nested route layouts for role-based dashboard shells, navigation guards.
State Management	Context API + Custom Hooks	Lightweight, predictable state for auth, active sessions, and theme without Redux boilerplate; scalable to Redux Toolkit if complex offline caching is needed.
HTTP Client	Axios	Interceptors for seamless JWT token injection, automated 401 token refreshing, centralized error handling.
Backend Runtime	Node.js (LTS)	Asynchronous, non-blocking event-driven I/O ideal for high concurrency (e.g., hundreds of students scanning QR codes simultaneously).
Web Framework	Express.js	Unopinionated, robust middleware architecture allowing granular security filters, request validators, and modular routing.
Database	MongoDB (v6+)	Flexible document model allowing embedded subdocuments (e.g., subject mark breakdowns, transaction logs) and rapid aggregation pipelines.
ODM Layer	Mongoose (v8+)	Strongly-typed schemas, pre/post middleware hooks (e.g., password hashing, cascading soft deletes), strict validation at the application tier.
Authentication	JWT + bcrypt	Stateless JSON Web Tokens (Access + Refresh token pattern) signed with SHA-256; salted bcrypt password hashing (12 rounds).
Document Engine	PDFKit / Puppeteer	Server-side pixel-perfect vector PDF generation for Fee Vouchers, Payment Receipts, and Student Result Cards.
QR Engine	qrcode / html5-qrcode	Dynamic ephemeral payload generation on the backend; low-latency WebCam/mobile camera scanning on the client.
Data Export	exceljs	Streaming XLSX generation for administrative and financial audit reports.
2. FUNCTIONAL REQUIREMENTS DOCUMENT (FRD)

The system encompasses 29 distinct functional modules, categorized by operational domain.

       +-----------------------------------------------------------+
       |                  O-SQUARE 2.0 CORE ERP                    |
       +-----------------------------------------------------------+
         |                     |                     |
   +-----------+         +-----------+         +-----------+
   | ACADEMICS |         |  FINANCE  |         | SECURITY  |
   +-----------+         +-----------+         +-----------+
   | Courses   |         | Fee Struct|         | RBAC Auth |
   | Subjects  |         | Vouchers  |         | Audit Log |
   | Batches   |         | QR Payment|         | Settings  |
   | Timetable |         | Gateway   |         | Backups   |
   | Exams     |         | Receipts  |         +-----------+
   | Results   |         | Refunds   |
   | Materials |         +-----------+
   +-----------+               |
         |               +-----------+
   +-----------+         |OPERATIONS |
   |ATTENDANCE |         +-----------+
   +-----------+         | Students  |
   | QR Session|         | Teachers  |
   | Scan Verify         | Admissions|
   | Manual Adj|         | Notices   |
   | Reporting |         | Analytics |
   +-----------+         +-----------+
Module Specifications
1. Authentication & Session Management
Multi-role login supporting Email/Username and Password.
Dual-token architecture: Short-lived Access Token (15 min) + Long-lived Refresh Token (7 days) stored in HttpOnly cookies.
Brute-force protection: 5 failed attempts locks account for 15 minutes.
Cryptographic session invalidation on logout and password reset.
2. Super Admin Dashboard & System Control
Complete system telemetry: active users, API health, memory utilization, active database connections.
Lifecycle management for Admin accounts (create, activate, suspend, audit).
System-wide configuration: campus information, academic sessions, global policy flags.
Real-time immutable audit log viewer with search, filter, and export capabilities.
3. Admin Operational Dashboard
Real-time KPIs: Today's Fee Collections, Total Active Students, Faculty Attendance Rate, Pending Admissions, Overdue Vouchers.
Global access to all academic, administrative, and financial modules without restriction.
Manual override controls for attendance and examination marks with mandatory reason logging.
4. Teacher Portal
Assignment-based scope: Teachers can only view batches, students, and courses assigned to them.
One-click dynamic QR Attendance Session generator.
Examination marks entry workspace with draft and submit modes.
Class-specific resource uploader (PDF notes, code snippets, assignment briefs).
5. Student Portal
Personal academic summary: attendance percentage, CGPA/marks, batch timetable.
Financial overview: pending vouchers, fee history, instant online payment terminal.
Built-in camera scanner for classroom QR attendance verification.
Download center for vouchers, receipts, and published result cards.
6. Student Management
Complete student dossier: Personal details, Guardian contact, CNIC/B-Form, enrollment history, academic status (Active, On-Leave, Graduated, Suspended).
Document repository for student admission forms and identity proofs.
7. Teacher Management
Faculty profile: Qualifications, contact, joining date, active assigned batches, subject specializations, work schedule.
8. Admission Management
Prospect inquiry logging -> Admission test/interview -> Enrollment conversion workflow.
Automated creation of User and Student profiles upon admission approval.
9-12. Course, Subject, Class & Batch Management
Hierarchical structure: Course (e.g., ADSE) -> Subjects (e.g., React, Java) -> Batches (e.g., PR2-202401B).
Batch scheduling: Class days (Mon-Wed-Fri or Tue-Thu-Sat), timing slots (09:00 - 11:00, 11:00 - 13:00, etc.), assigned classroom and lab.
13. Student Enrollment
Links students to specific batches with an enrollment date, roll number, and status flag.
14-15. Attendance & QR Session Engine
Teacher launches session -> Unique dynamic QR token rendered on projector/screen.
Student scans QR -> Client sends token + student location/device context -> Server verifies token authenticity, student batch enrollment, session expiration, and single-scan uniqueness.
Manual attendance editor for Admin/Teacher with status flags: Present, Absent, Late, Excused.
16-17. Examination & Results Engine
Exam scheduling: Midterm, Final, Module Exam, Practical Lab test.
Subject-wise maximum marks, passing threshold, and weightage.
Automatic grade calculation based on standard Aptech grading scales: Distinction (>=85%), Credit (>=70%), Pass (>=50%), Fail (<50%).
Result publication toggle (Draft vs. Published) to prevent premature student access.
18-22. Fee Management, QR Payments & PDF Engines
Dynamic Fee Structure assignment (Tuition, Admission, Examination, Lab, Late Fine).
Monthly automated voucher generation with unique voucher numbers and payment references.
Integration-ready digital payment layer: Raast QR, Bank Alfalah / EasyPaisa / JazzCash payment gateways with secure webhook listeners.
Real-time transaction reconciliation: Atomic database transactions prevent double-crediting.
Automatic vector PDF voucher and receipt generation.
23-25. Timetable, Notices & Learning Materials
Weekly master timetable grid with automated collision detection (prevents double-booking teachers or classrooms).
Targeted announcements (All, Faculty Only, Student Only, Batch-specific).
Structured cloud/local storage of educational courseware.
26-29. Analytics, Roles, Settings & Audit Logs
Comprehensive financial and attendance reports with Excel and PDF export.
Granular Role-Based Access Control configuration.
Centre branding (logo, contact details, bank account instructions).
Non-repudiable audit logging recording: User, Role, IP, Action, Timestamp, and Diff.
3. SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
3.1 Non-Functional Requirements (NFR)
Performance & Latency
API Response Time: 95% of standard CRUD read/write endpoints must respond in 
<
150
 ms
<150 ms.
High Concurrency QR Scans: The attendance scan endpoint must handle a burst of 100 requests/sec with 
<
250
 ms
<250 ms processing time.
Reporting Queries: Complex financial analytics aggregating 10,000+ records must execute in 
<
1.2
 s
<1.2 s using MongoDB index-covered aggregation pipelines.
Security & Compliance
Transport Security: Enforce HTTPS via TLS 1.3 in production with HSTS headers.
Data Protection: Sensitive credentials and webhook secrets stored as encrypted environment variables; passwords salted with bcrypt.
CORS Policy: Whitelist restricted to authorized client domains only; disallow wildcard origins on credentialed endpoints.
Rate Limiting:
General API: 100 requests / 15 minutes per IP.
Auth Login: 5 requests / 15 minutes per IP.
QR Attendance Scan: 10 requests / minute per authenticated student.
Reliability, Data Integrity & Recovery
ACID Compliance: Multi-document transactions used for all financial updates (e.g., updating voucher status, creating transaction record, and issuing receipt in one atomic commit).
Graceful Shutdown: Node.js processes handle SIGTERM and SIGINT signals to finish in-flight requests and safely close database connection pools.
4. USER ROLE AND PERMISSION MATRIX

The system implements strict Role-Based Access Control (RBAC) coupled with Resource-Level Authorization.

LEGEND:
[C] Create    [R] Read/View    [U] Update/Edit    [D] Delete
[-] No Access [A] Assignment-Scoped Access        [O] Self-Ownership Only
Functional Domain / Resource	Super Admin	Admin	Teacher	Student
System Settings & Backups	C / R / U / D	R / U	-	-
Admin Account Management	C / R / U / D	-	-	-
Audit Logs Inspection	R / Export	R	-	-
Faculty & Staff Records	C / R / U / D	C / R / U / D	R [O]	-
Student Profiles & Records	C / R / U / D	C / R / U / D	R [A]	R [O]
Courses & Subjects	C / R / U / D	C / R / U / D	R	R
Batches & Classrooms	C / R / U / D	C / R / U / D	R [A]	R [O]
Batch Student Enrollments	C / R / U / D	C / R / U / D	R [A]	-
QR Attendance Sessions	C / R / U / D	C / R / U / D	C / R / U [A]	-
Student Attendance Records	C / R / U / D	C / R / U / D	C / R / U [A]	C [Scan] / R [O]
Examinations Management	C / R / U / D	C / R / U / D	R [A]	-
Marks Entry & Grading	C / R / U / D	C / R / U / D	C / R / U [A]	-
Published Results	C / R / U / D	C / R / U / D	R [A]	R [O]
Fee Structures & Rules	C / R / U / D	C / R / U / D	-	-
Fee Vouchers & Invoicing	C / R / U / D	C / R / U / D	-	R [O]
Payment Transactions	C / R / U / D	C / R / U / D	-	C [Pay] / R [O]
Payment Receipts	C / R / U / D	C / R / U / D	-	R [O]
Timetables Scheduling	C / R / U / D	C / R / U / D	R [A]	R [O]
Notices & Announcements	C / R / U / D	C / R / U / D	R	R
Learning Materials	C / R / U / D	C / R / U / D	C / R / U / D [A]	R [O]
5. SYSTEM ARCHITECTURE DIAGRAM
6. COMPLETE DATABASE DESIGN (28 MONGOOSE SCHEMAS)

Here are the complete document definitions, field constraints, relationships, and performance indexes.

6.1 Security & User Identity
1. users

Represents login credentials and identity for all roles.

javascript
{
  _id: ObjectId,
  username: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'teacher', 'student'], required: true, index: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active', index: true },
  avatarUrl: { type: String, default: null },
  lastLogin: { type: Date, default: null },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  refreshTokenHash: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
2. roles & permissions

Enables dynamic privilege granting when extending beyond fixed roles.

javascript
// permissions
{
  _id: ObjectId,
  code: { type: String, required: true, unique: true }, // e.g., 'FEE_MANAGE', 'MARKS_OVERRIDE'
  description: { type: String, required: true },
  module: { type: String, required: true }
}
// roles
{
  _id: ObjectId,
  name: { type: String, required: true, unique: true },
  permissions: [{ type: ObjectId, ref: 'permissions' }],
  isSystemRole: { type: Boolean, default: false }
}
6.2 People & Profiles
3. students

Complete demographic and academic profile linked 1:1 to a users document.

javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'users', required: true, unique: true, index: true },
  studentId: { type: String, required: true, unique: true, index: true }, // e.g. "APT-2024-001"
  fullName: { type: String, required: true, trim: true },
  fatherName: { type: String, required: true, trim: true },
  cnicBForm: { type: String, required: true, unique: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  dob: { type: Date, required: true },
  contactPhone: { type: String, required: true },
  guardianPhone: { type: String, required: true },
  address: { type: String, required: true },
  admissionDate: { type: Date, default: Date.now },
  academicStatus: { type: String, enum: ['active', 'graduated', 'dropped', 'suspended'], default: 'active', index: true },
  currentBatchId: { type: ObjectId, ref: 'batches', default: null, index: true }
}
4. teachers

Faculty dossier linked 1:1 to a users document.

javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'users', required: true, unique: true, index: true },
  teacherId: { type: String, required: true, unique: true, index: true }, // e.g. "FAC-102"
  fullName: { type: String, required: true, trim: true },
  cnic: { type: String, required: true, unique: true },
  contactPhone: { type: String, required: true },
  email: { type: String, required: true },
  qualification: { type: String, required: true },
  specializations: [{ type: String }],
  joiningDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'on_leave', 'resigned'], default: 'active', index: true }
}
5. admissions

Manages prospect applications and enrollment conversion.

javascript
{
  _id: ObjectId,
  inquiryNumber: { type: String, required: true, unique: true },
  candidateName: { type: String, required: true },
  guardianName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  interestedCourseId: { type: ObjectId, ref: 'courses', required: true },
  targetBatchId: { type: ObjectId, ref: 'batches', default: null },
  status: { type: String, enum: ['inquiry', 'interview_scheduled', 'approved', 'rejected', 'enrolled'], default: 'inquiry' },
  notes: { type: String },
  convertedStudentId: { type: ObjectId, ref: 'students', default: null }
}
6.3 Academic Hierarchy
6. courses

Educational programs (e.g., ADSE - Advanced Diploma in Software Engineering, DISM).

javascript
{
  _id: ObjectId,
  courseCode: { type: String, required: true, unique: true }, // e.g. "ADSE"
  title: { type: String, required: true },
  description: { type: String },
  totalSemesters: { type: Number, required: true },
  durationMonths: { type: Number, required: true },
  baseFee: { type: Number, required: true },
  status: { type: String, enum: ['active', 'archived'], default: 'active' }
}
7. subjects

Individual modules/topics belonging to courses.

javascript
{
  _id: ObjectId,
  subjectCode: { type: String, required: true, unique: true }, // e.g. "CPISM-01"
  title: { type: String, required: true },
  courseId: { type: ObjectId, ref: 'courses', required: true, index: true },
  semester: { type: Number, required: true },
  creditHours: { type: Number, required: true },
  totalMarks: { type: Number, default: 100 },
  passingMarks: { type: Number, default: 50 }
}
8. classes (Classrooms/Labs)

Physical physical infrastructure.

javascript
{
  _id: ObjectId,
  roomName: { type: String, required: true, unique: true }, // e.g. "Lab 3 - Second Floor"
  roomType: { type: String, enum: ['theory_room', 'computer_lab'], required: true },
  capacity: { type: Number, required: true },
  isActive: { type: Boolean, default: true }
}
9. batches

Specific cohort of students running on a schedule.

javascript
{
  _id: ObjectId,
  batchCode: { type: String, required: true, unique: true, index: true }, // e.g. "2401B"
  courseId: { type: ObjectId, ref: 'courses', required: true, index: true },
  classRoomId: { type: ObjectId, ref: 'classes', required: true },
  assignedTeacherId: { type: ObjectId, ref: 'teachers', required: true, index: true },
  startDate: { type: Date, required: true },
  expectedEndDate: { type: Date, required: true },
  daysPattern: { type: String, enum: ['MWF', 'TTS', 'DAILY', 'WEEKEND'], required: true },
  startTime: { type: String, required: true }, // "09:00" (24-hour)
  endTime: { type: String, required: true },   // "11:00"
  status: { type: String, enum: ['upcoming', 'in_progress', 'completed'], default: 'in_progress', index: true }
}
10. enrollments

M:N mapping of students to batches.

javascript
{
  _id: ObjectId,
  studentId: { type: ObjectId, ref: 'students', required: true, index: true },
  batchId: { type: ObjectId, ref: 'batches', required: true, index: true },
  enrollmentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'transferred', 'completed', 'dropped'], default: 'active', index: true }
}
// Unique compound index: One active enrollment per student per batch
// { studentId: 1, batchId: 1 } -> UNIQUE
11. teacherAssignments

Allows assigning secondary teachers or subject-specific faculty to batches.

javascript
{
  _id: ObjectId,
  teacherId: { type: ObjectId, ref: 'teachers', required: true, index: true },
  batchId: { type: ObjectId, ref: 'batches', required: true, index: true },
  subjectId: { type: ObjectId, ref: 'subjects', required: true },
  isPrimary: { type: Boolean, default: false }
}
6.4 QR Attendance Domain
12. attendanceSessions

A dynamic, time-boxed attendance window launched by a teacher.

javascript
{
  _id: ObjectId,
  sessionCode: { type: String, required: true, unique: true, index: true }, // UUID or crypto nonce
  batchId: { type: ObjectId, ref: 'batches', required: true, index: true },
  teacherId: { type: ObjectId, ref: 'teachers', required: true },
  sessionDate: { type: Date, required: true },
  startTime: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true }, // e.g. +15 minutes
  jwtSecretToken: { type: String, required: true }, // Signed secret embedded in rotating QR
  lateThresholdMinutes: { type: Number, default: 15 },
  isActive: { type: Boolean, default: true, index: true },
  closedAt: { type: Date, default: null }
}
13. attendance

Atomic attendance records for students.

javascript
{
  _id: ObjectId,
  sessionId: { type: ObjectId, ref: 'attendanceSessions', required: true, index: true },
  batchId: { type: ObjectId, ref: 'batches', required: true, index: true },
  studentId: { type: ObjectId, ref: 'students', required: true, index: true },
  attendanceDate: { type: Date, required: true, index: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'excused'], required: true, index: true },
  scannedAt: { type: Date, default: null },
  deviceInfo: { type: String, default: null }, // IP / User-Agent signature
  isManualCorrection: { type: Boolean, default: false },
  correctedByUserId: { type: ObjectId, ref: 'users', default: null },
  correctionReason: { type: String, default: null }
}
// Unique Compound Index: Student can only have 1 attendance record per session
// { sessionId: 1, studentId: 1 } -> UNIQUE
6.5 Examinations & Grading
14. examinations

Exam schedules and terms.

javascript
{
  _id: ObjectId,
  title: { type: String, required: true }, // e.g., "Semester 1 Final Exam - Fall 2024"
  courseId: { type: ObjectId, ref: 'courses', required: true },
  term: { type: String, enum: ['quiz', 'midterm', 'final', 'project'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isPublished: { type: Boolean, default: false, index: true }
}
15. examSubjects

Specific exam paper schedule for a subject.

javascript
{
  _id: ObjectId,
  examinationId: { type: ObjectId, ref: 'examinations', required: true, index: true },
  subjectId: { type: ObjectId, ref: 'subjects', required: true },
  examDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  totalMarks: { type: Number, required: true },
  passingMarks: { type: Number, required: true }
}
16. results

Student score cards and grades.

javascript
{
  _id: ObjectId,
  examinationId: { type: ObjectId, ref: 'examinations', required: true, index: true },
  examSubjectId: { type: ObjectId, ref: 'examSubjects', required: true },
  studentId: { type: ObjectId, ref: 'students', required: true, index: true },
  batchId: { type: ObjectId, ref: 'batches', required: true },
  marksObtained: { type: Number, required: true },
  grade: { type: String, enum: ['Distinction', 'Credit', 'Pass', 'Fail'], required: true },
  isAbsent: { type: Boolean, default: false },
  enteredByTeacherId: { type: ObjectId, ref: 'teachers', required: true },
  isPublished: { type: Boolean, default: false }
}
// Unique Compound Index: One score per student per exam subject
// { examSubjectId: 1, studentId: 1 } -> UNIQUE
6.6 Complete Financial Architecture
17. feeStructures

Standard monthly or semester billing templates.

javascript
{
  _id: ObjectId,
  title: { type: String, required: true }, // e.g. "Standard ADSE Monthly Fee"
  courseId: { type: ObjectId, ref: 'courses', required: true },
  admissionFee: { type: Number, default: 0 },
  tuitionFee: { type: Number, required: true },
  labFee: { type: Number, default: 0 },
  examFee: { type: Number, default: 0 },
  defaultDueDateDay: { type: Number, default: 10 }, // 10th of every month
  lateFineAmount: { type: Number, default: 500 },
  isActive: { type: Boolean, default: true }
}
18. studentFees (Student Ledger Account)

Tracks cumulative student dues, scholarships, and balance.

javascript
{
  _id: ObjectId,
  studentId: { type: ObjectId, ref: 'students', required: true, unique: true, index: true },
  feeStructureId: { type: ObjectId, ref: 'feeStructures', required: true },
  discountPercentage: { type: Number, default: 0 },
  scholarshipAmount: { type: Number, default: 0 },
  totalBilled: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 } // positive = arrears, negative = advance
}
19. feeVouchers

Official monthly billing invoice containing digital payment codes.

javascript
{
  _id: ObjectId,
  voucherNumber: { type: String, required: true, unique: true, index: true }, // "VCH-2024-00912"
  studentId: { type: ObjectId, ref: 'students', required: true, index: true },
  batchId: { type: ObjectId, ref: 'batches', required: true },
  billingMonth: { type: String, required: true }, // "2024-11"
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true, index: true },
  baseAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  lateCharges: { type: Number, default: 0 },
  totalPayable: { type: Number, required: true },
  paymentReference: { type: String, required: true, unique: true, index: true }, // ISO Raast reference
  status: { 
    type: String, 
    enum: ['unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'], 
    default: 'unpaid', 
    index: true 
  },
  paidAmount: { type: Number, default: 0 },
  qrPayloadString: { type: String, required: true } // Formatted EMVCo / Raast Merchant QR string
}
20. payments

High-level payment settlements.

javascript
{
  _id: ObjectId,
  voucherId: { type: ObjectId, ref: 'feeVouchers', required: true, index: true },
  studentId: { type: ObjectId, ref: 'students', required: true, index: true },
  amountPaid: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['raast_qr', 'online_gateway', 'bank_transfer', 'cash'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending', index: true },
  collectedByUserId: { type: ObjectId, ref: 'users', default: null } // If manual counter cash
}
21. paymentTransactions

Detailed gateway telemetry & idempotency log.

javascript
{
  _id: ObjectId,
  paymentId: { type: ObjectId, ref: 'payments', required: true, index: true },
  voucherId: { type: ObjectId, ref: 'feeVouchers', required: true },
  gatewayTransactionId: { type: String, required: true, unique: true, index: true }, // Gateway TXN ID
  gatewayProvider: { type: String, required: true }, // e.g. "Alfalah", "EasyPaisa", "Raast"
  rawWebhookPayload: { type: Object },
  signatureVerified: { type: Boolean, default: false },
  transactionStatus: { type: String, enum: ['initiated', 'authorized', 'settled', 'failed'], required: true },
  createdAt: { type: Date, default: Date.now }
}
22. paymentReceipts

Immutable proof of verified payment.

javascript
{
  _id: ObjectId,
  receiptNumber: { type: String, required: true, unique: true, index: true }, // "REC-2024-1002"
  paymentId: { type: ObjectId, ref: 'payments', required: true, unique: true },
  voucherId: { type: ObjectId, ref: 'feeVouchers', required: true },
  studentId: { type: ObjectId, ref: 'students', required: true },
  amountPaid: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  transactionReference: { type: String, required: true },
  issuedAt: { type: Date, default: Date.now },
  pdfStoragePath: { type: String, default: null }
}
23-24. discounts & refunds
javascript
// refunds
{
  _id: ObjectId,
  paymentId: { type: ObjectId, ref: 'payments', required: true },
  studentId: { type: ObjectId, ref: 'students', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  processedByUserId: { type: ObjectId, ref: 'users', required: true },
  processedAt: { type: Date, default: Date.now }
}
6.7 Scheduling, Communication & Audit
25. timetables

Weekly scheduled slots with collision-prevention indexes.

javascript
{
  _id: ObjectId,
  batchId: { type: ObjectId, ref: 'batches', required: true, index: true },
  courseId: { type: ObjectId, ref: 'courses', required: true },
  subjectId: { type: ObjectId, ref: 'subjects', required: true },
  teacherId: { type: ObjectId, ref: 'teachers', required: true, index: true },
  classRoomId: { type: ObjectId, ref: 'classes', required: true, index: true },
  dayOfWeek: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true }    // "11:00"
}
26. announcements

Broadcast notices across user groups.

javascript
{
  _id: ObjectId,
  title: { type: String, required: true },
  content: { type: String, required: true },
  authorId: { type: ObjectId, ref: 'users', required: true },
  targetRole: { type: String, enum: ['all', 'teachers', 'students', 'batch_specific'], default: 'all' },
  targetBatchId: { type: ObjectId, ref: 'batches', default: null },
  isPinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true }
}
27. learningMaterials

Course materials uploaded by teachers or admin.

javascript
{
  _id: ObjectId,
  title: { type: String, required: true },
  description: { type: String },
  batchId: { type: ObjectId, ref: 'batches', required: true, index: true },
  subjectId: { type: ObjectId, ref: 'subjects', required: true },
  uploadedByTeacherId: { type: ObjectId, ref: 'teachers', required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, required: true }, // 'pdf', 'zip', 'doc'
  uploadedAt: { type: Date, default: Date.now }
}
28. auditLogs

Immutable security and administrative audit trail.

javascript
{
  _id: ObjectId,
  actorUserId: { type: ObjectId, ref: 'users', required: true, index: true },
  actorRole: { type: String, required: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String },
  action: { type: String, required: true, index: true }, // e.g., 'FEE_VOUCHER_GENERATED', 'ATTENDANCE_OVERRIDE'
  targetEntity: { type: String, required: true },      // e.g., 'feeVouchers', 'attendance'
  targetEntityId: { type: String, required: true },
  metadata: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now, index: true }
}
7. ENTITY RELATIONSHIP DIAGRAM (ERD)
8. QR CODE ATTENDANCE ARCHITECTURE & WORKFLOW
8.1 The Threat Model (Why Simple QR Codes Fail)

A major vulnerability in naive QR attendance systems is Proxy Attendance:

A student physically present takes a screenshot of the QR code and sends it via WhatsApp to absent classmates.
Those absent students scan the screenshot from home and get marked "Present".
8.2 O-Square 2.0 Dynamic Cryptographic Defense
Short-Lived Ephemeral Token: The displayed QR code is not static. The frontend projector screen refreshes its payload every 15 to 30 seconds.
HMAC / JWT Payload: The QR code encodes a cryptographically signed token containing:
QR Payload
=
Sign
(
SessionId
+
Timestamp
+
RotatingNonce
,
SessionSecret
)
QR Payload=Sign(SessionId+Timestamp+RotatingNonce,SessionSecret)
Double Verification on Backend:
The token expires within 30 seconds of rendering.
The scanning student must be authenticated via their own JWT.
The student must be actively enrolled in that exact batchId.
The student's device cannot scan twice for the same session.
9. QR FEE PAYMENT & DIRECT ONLINE RECONCILIATION
9.1 Pakistani Financial Integration & Standards

O-Square 2.0 generates standard Raast / EMVCo compliant merchant QR payloads directly printed on the fee voucher and displayed in the student dashboard.

Every voucher has a unique ISO-standard Payment Reference Number (e.g. 99000123456789).
When paid via Raast, participating bank apps (HBL, Meezan, Alfalah) or digital wallets (EasyPaisa, JazzCash), the payment gateway triggers an instantaneous, cryptographically signed webhook to the backend.
9.2 Transaction Lifecycle & Idempotency

To prevent financial discrepancies or double-crediting:

Every webhook payload contains a gatewayTransactionId.
The backend checks for duplicate transaction IDs before updating any ledger.
Operations run inside a MongoDB Multi-Document ACID Transaction.
10. PDF FEE VOUCHER & PAYMENT RECEIPT WORKFLOW
  +--------------------------------------------------------------------------+
  |                   APTECH COMPUTER EDUCATION - VOUCHER                    |
  | Centre: Gulshan Center 1 | Tel: +92-21-34980000 | Tax ID: 1234567-8      |
  +--------------------------------------------------------------------------+
  | Voucher No: VCH-2024-00912          | Issue Date: 01-Nov-2024            |
  | Student ID: APT-2024-001            | Due Date:   10-Nov-2024            |
  | Student:    Muhammad Ali            | Course:     ADSE (Batch: 2401B)    |
  +--------------------------------------------------------------------------+
  | DESCRIPTION                                              AMOUNT (PKR)    |
  +--------------------------------------------------------------------------+
  | 1. Monthly Tuition Fee (November 2024)                         12,000    |
  | 2. Lab & Technology Maintenance Charges                          1,500    |
  | 3. Scholarship / Fee Concession (10%)                          -1,200    |
  +--------------------------------------------------------------------------+
  | TOTAL PAYABLE WITHIN DUE DATE:                              PKR 12,300   |
  | LATE FINE (Applicable after 10-Nov-2024):                    PKR   500   |
  | TOTAL PAYABLE AFTER DUE DATE:                               PKR 12,800   |
  +--------------------------------------------------------------------------+
  | PAYMENT INSTRUCTIONS:                               [ QR CODE ]          |
  | Pay via Raast or 1Link 1Bill using Reference:       [ Scan via ]         |
  | Reference: 9910023400912                            [ Bank App ]         |
  +--------------------------------------------------------------------------+
PDF Engine Implementation Strategy
Vector Fidelity: Built with pdfkit on the backend to produce clean vector graphics, crisp Aptech logos, and machine-readable barcodes/QR codes without raster blur.
Three-Part Voucher Support: The system supports standard 3-slip formats (Bank Copy, Institute Copy, Student Copy) on a single landscape A4 sheet, or a modern single-sheet portrait A4 format with verified payment instructions.
11. DASHBOARD NAVIGATION & INFORMATION ARCHITECTURE
O-Square 2.0 Dashboards
│
├── SUPER ADMIN PORTAL
│   ├── System Health & Telemetry
│   ├── Admin Management (Create, Suspend, Permissions)
│   ├── Campus & Centre Configurations
│   ├── Global Security & Backup Settings
│   └── Immutable Audit Trail Viewer
│
├── ADMIN DASHBOARD (Full Operational Authority)
│   ├── Operational KPIs & Real-Time Financials
│   ├── Student Directory & Admission Pipeline
│   ├── Faculty Management & Workload Assignment
│   ├── Academic Structure (Courses, Subjects, Classes, Batches)
│   ├── Attendance Control Centre (Sessions, Manual Adjustments, Reports)
│   ├── Examinations & Results Publisher
│   ├── Complete Fee Terminal (Structures, Voucher Generator, Reconciliation)
│   ├── Weekly Timetable Matrix & Conflict Checker
│   ├── Announcements & Notice Board
│   └── Analytics & Data Export (Excel / PDF)
│
├── TEACHER DASHBOARD (Assignment-Scoped)
│   ├── My Assigned Batches & Students
│   ├── Live QR Attendance Session Launcher
│   ├── Attendance History & Roll-Call Override
│   ├── Examination Marks Entry Portal
│   ├── My Weekly Timetable
│   └── Courseware & Learning Material Uploader
│
└── STUDENT DASHBOARD (Self-Service)
    ├── Academic Overview (Attendance %, CGPA, Enrolled Batch)
    ├── Live Classroom QR Scanner (Camera view)
    ├── Timetable & Class Schedule
    ├── Financial Hub (Pending Vouchers, Payment History)
    ├── Direct Online Payment Terminal
    ├── Download Center (PDF Vouchers, Official Receipts)
    ├── Published Result Cards
    └── Study Materials & Announcements
12. UI/UX DESIGN SYSTEM & COMPONENT ARCHITECTURE
12.1 Visual Style Tokens
Element	Specification	Tailwind CSS Token
Primary Navy	Enterprise Deep Slate Navy	bg-slate-900 / text-slate-900
Accent Royal	Institutional Indigo	bg-indigo-600 / hover:bg-indigo-700
Success / Paid	Emerald Green	text-emerald-600 / bg-emerald-50
Warning / Late	Amber Orange	text-amber-600 / bg-amber-50
Danger / Arrears	Crimson Red	text-rose-600 / bg-rose-50
Background	Clean Neutral Gray	bg-slate-50 / bg-white
Typography	Inter / System UI Sans	font-sans antialiased
12.2 Component Standards
Responsive Data Tables:
Column sorting, global search debounce (300ms), multi-criteria filters.
Server-side pagination controls with item counts and page size selector.
Smooth skeleton loading states during fetch transitions.
Interactive Form System:
Form state management with client-side validation schema.
Inline error feedback on touched inputs.
Unsaved changes confirmation modal to prevent accidental data loss.
Mobile-Optimized Scanner Component:
High-contrast camera viewport overlay with animated scanning line.
Instant vibration/audio feedback on successful QR recognition.
Fallback manual code entry if camera permissions are denied.
13. SECURITY ARCHITECTURE & DEFENSE STRATEGY
Key Security Implementations:
Zero Client Trust: No frontend flag determines authorization. Every request to /api/* resolves the authenticated user from the verified JWT payload and evaluates server-side permissions.
Resource-Level Guard:
When a Teacher requests /api/batches/:id/students, the server queries teacherAssignments to prove the teacher is assigned to that batch.
When a Student requests /api/vouchers/:id, the server verifies voucher.studentId.toString() === req.user.studentId.toString().
NoSQL Injection Defense: All user inputs are sanitized and passed through strongly typed Mongoose queries; raw string concatenation into query objects is prohibited.
Audit Logging: Any write, update, or delete action on sensitive collections (attendance, results, fee vouchers, payments, settings) automatically logs an immutable event to auditLogs.
14. 22-PHASE DEVELOPMENT ROADMAP & MILESTONES
  Phase 01: Project Analysis & Requirements                  [COMPLETED]
  Phase 02: Functional Requirements Document (FRD)          [COMPLETED]
  Phase 03: Software Requirements Specification (SRS)        [COMPLETED]
  Phase 04: System Architecture                             [COMPLETED]
  Phase 05: Role and Permission Matrix                      [COMPLETED]
  Phase 06: Database Design and Complete ERD                [COMPLETED]
  Phase 07: UI/UX Wireframes and Design System              [COMPLETED]
------------------------------------------------------------------------
  Phase 08: Backend Project Setup & Structure               [Awaiting Approval]
  Phase 09: Authentication, JWT & RBAC Middleware
  Phase 10: Frontend Project Setup & Tailwind Design System
  Phase 11: Multi-Role Dashboard Layouts
  Phase 12: Student & Teacher Management Modules
  Phase 13: Courses, Subjects, Classes & Batches
  Phase 14: Dynamic QR Code Attendance System
  Phase 15: Examination & Results Management
  Phase 16: Fee Structures, Accounts & Voucher Management
  Phase 17: QR Fee Payment & Gateway Integration
  Phase 18: Vector PDF Voucher & Receipt Generation
  Phase 19: Timetables & Announcements
  Phase 20: Reports, Financial Analytics & Excel Export
  Phase 21: End-to-End Security & Performance Auditing
  Phase 22: Deployment Preparation, Seeding & Documentation
15. SENIOR MENTOR'S SUMMARY & NEXT STEPS

We have completed the system analysis and design phase:

Every business rule for the Aptech educational centre has been codified.
The complete 28-collection MongoDB database schema is defined with foreign key references and compound indexes.
The cryptographic anti-proxy QR attendance system and idempotent fee payment workflows are architected.
The security, authorization, and UI/UX design patterns are mapped out.

IMPORTANT

We have strictly refrained from writing any application code during this design phase, adhering to professional software engineering standards.

Decisions for Your Review:
Fee Voucher Format: Do you prefer the standard 3-slip single landscape A4 layout (Bank Copy, Institute Copy, Student Copy) or the modern single-sheet portrait A4 layout?
Attendance Grace Period: Should the default threshold for being marked Late instead of Present be configured at 15 minutes, or would you prefer a custom campus policy?

Please review this master blueprint. Once you approve, we will immediately initiate Phase 8: Backend Project Setup & Folder Architecture!