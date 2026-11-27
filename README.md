# O-Square 2.0 — Educational ERP & Campus Management System

A full-stack **MERN** (MongoDB, Express.js, React.js, Node.js) Educational ERP built from scratch with Role-Based Access Control (RBAC), dynamic anti-proxy QR attendance, Raast/online fee payment reconciliation, A4 vector PDF vouchers & receipts, and Excel/PDF analytics exports.

---

## Architecture & Directory Structure

```text
O-SQURE 2.0/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment validation & MongoDB lifecycle
│   │   ├── controllers/     # HTTP request/response handlers
│   │   ├── middleware/      # JWT protect, RBAC, Zod validator, rate limiters, errorHandler
│   │   ├── models/          # 25+ Mongoose schemas & compound indexes
│   │   ├── routes/          # Modular Express REST routers (/api/v1/*)
│   │   ├── services/        # QR crypto, grading, fee math, PDFKit, ExcelJS, audit logging
│   │   ├── utils/           # AppError, catchAsync, apiResponse, idGenerator, seedSystem
│   │   ├── validators/      # Zod request schemas
│   │   ├── app.js           # Express app & security middlewares
│   │   └── server.js        # Server bootstrap & graceful shutdown
│   └── tests/               # Automated security & core logic QA suite (node --test)
└── frontend/
    └── src/
        ├── api/             # Axios client with in-memory JWT & auto-refresh queue
        ├── components/      # DataTable, StatCard, Modal, StatusBadge, ProtectedRoute
        ├── config/          # Role-based sidebar navigation trees
        ├── context/         # AuthContext (HttpOnly refresh bootstrap)
        ├── hooks/           # useAuth
        ├── layouts/         # Responsive DashboardLayout shell
        ├── pages/           # SuperAdmin, Admin, Teacher, Student & shared pages
        └── utils/           # Blob download/print helpers
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** v20+ (tested on v25.2.1)
- **MongoDB** Community Server (`localhost:27017`) **or** a MongoDB Atlas connection URI

### 2. Configure Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and set your values:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/osquare2_db

JWT_ACCESS_SECRET=replace_with_64_char_random_secret
JWT_REFRESH_SECRET=replace_with_different_64_char_random_secret
PAYMENT_WEBHOOK_SECRET=replace_with_gateway_hmac_secret

SEED_SUPERADMIN_EMAIL=superadmin@osquare.edu
SEED_SUPERADMIN_USERNAME=superadmin
SEED_SUPERADMIN_NAME=System Super Admin
SEED_SUPERADMIN_PASSWORD=ChooseAStrongPassword123
```

### 3. Install Dependencies & Seed Database
```powershell
# Backend
cd backend
npm install
npm run seed

# Frontend
cd ../frontend
npm install
```

### 4. Run Both Servers
```powershell
# Terminal 1 (Backend API on http://localhost:5000)
cd backend
npm run dev

# Terminal 2 (Frontend SPA on http://localhost:5173)
cd frontend
npm run dev
```

---

## Automated Testing
Run the Security & Core Logic QA Suite in `backend/`:
```powershell
cd backend
npm test
```

---

## API Endpoints (`/api/v1`)

| Prefix | Purpose | Access |
| :--- | :--- | :--- |
| `/health` | Service & DB health check | Public |
| `/auth` | Login, Refresh, Logout, Me, Change Password | Public / Authenticated |
| `/users` | Account & role management | Super Admin, Admin (restricted) |
| `/audit-logs` | Immutable security audit trail | Super Admin, Admin |
| `/dashboard` | Role-scoped summary metrics | Authenticated |
| `/students` | Student directory & self-profile | Admin, Teacher (assigned), Student (self) |
| `/teachers` | Faculty directory & self-profile | Admin, Teacher (self) |
| `/admissions` | Inquiry pipeline & enrollment conversion | Super Admin, Admin |
| `/courses`, `/subjects`, `/classes`, `/batches`, `/enrollments` | Academic hierarchy & conflict-checked batches | Role-scoped |
| `/attendance-sessions` | Rotating 30s QR session lifecycle | Admin, Teacher (assigned) |
| `/attendance` | Student QR scan, history & audited overrides | Role-scoped |
| `/examinations`, `/results` | Exam scheduling, marks entry & PDF result cards | Role-scoped |
| `/fees`, `/vouchers` | Fee plans, discounts, monthly vouchers & PDFs | Admin, Student (self) |
| `/payments`, `/receipts` | QR checkout, counter payments, refunds & PDFs | Admin, Student (self) |
| `/payment-webhooks` | HMAC-SHA256 signed provider webhook listener | Gateway Signature |
| `/timetable`, `/announcements`, `/materials` | Weekly schedule, notices & study resources | Role-scoped |
| `/settings` | Campus configuration | Super Admin (write), Admin (read) |
| `/reports` | Financial/attendance KPIs & Excel/PDF exports | Super Admin, Admin |

---

## Production Deployment Checklist
1. Set `NODE_ENV=production` in `backend/.env` so stack traces are hidden and `HttpOnly` refresh cookies enforce `Secure` + `SameSite=Strict`.
2. Rotate `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `PAYMENT_WEBHOOK_SECRET` with high-entropy 64-character random strings.
3. Set `CLIENT_URL` to your exact HTTPS frontend domain (e.g. `https://erp.yourcampus.edu`).
4. Build the frontend static bundle via `cd frontend && npm run build` and serve `frontend/dist/` behind Nginx / Cloudflare / Vercel with TLS 1.3 enabled.
5. Remove `SEED_SUPERADMIN_PASSWORD` from `.env` after initial seeding.
