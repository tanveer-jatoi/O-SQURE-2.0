import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { Permission } from '../models/Permission.js';
import { Role } from '../models/Role.js';
import { User } from '../models/User.js';

const DEFAULT_PERMISSIONS = [
  { code: 'SYSTEM_SETTINGS_MANAGE', module: 'system', description: 'Configure global system settings' },
  { code: 'ADMIN_ACCOUNTS_MANAGE', module: 'users', description: 'Create and manage Admin accounts' },
  { code: 'AUDIT_LOGS_VIEW', module: 'security', description: 'View system audit logs' },
  { code: 'STUDENTS_MANAGE', module: 'students', description: 'Create, edit, and manage all students' },
  { code: 'TEACHERS_MANAGE', module: 'teachers', description: 'Create, edit, and manage all teachers' },
  { code: 'ACADEMICS_MANAGE', module: 'academics', description: 'Manage courses, subjects, classes, and batches' },
  { code: 'ATTENDANCE_MANAGE_ALL', module: 'attendance', description: 'Manage and override all attendance records' },
  { code: 'ATTENDANCE_SESSION_RUN', module: 'attendance', description: 'Run QR attendance sessions for assigned batches' },
  { code: 'ATTENDANCE_SCAN_SELF', module: 'attendance', description: 'Scan QR codes for own attendance' },
  { code: 'EXAMS_MANAGE_ALL', module: 'exams', description: 'Manage all exams and publish results' },
  { code: 'MARKS_ENTRY_ASSIGNED', module: 'exams', description: 'Enter marks for assigned batches' },
  { code: 'FEES_MANAGE_ALL', module: 'finance', description: 'Manage fee structures, vouchers, and payments' },
  { code: 'FEES_PAY_SELF', module: 'finance', description: 'View and pay own fee vouchers' },
];

const DEFAULT_ROLES = [
  {
    name: 'superadmin',
    displayName: 'Super Administrator',
    isSystemRole: true,
    permissions: DEFAULT_PERMISSIONS.map((p) => p.code),
  },
  {
    name: 'admin',
    displayName: 'Campus Administrator',
    isSystemRole: true,
    permissions: [
      'AUDIT_LOGS_VIEW',
      'STUDENTS_MANAGE',
      'TEACHERS_MANAGE',
      'ACADEMICS_MANAGE',
      'ATTENDANCE_MANAGE_ALL',
      'EXAMS_MANAGE_ALL',
      'FEES_MANAGE_ALL',
    ],
  },
  {
    name: 'teacher',
    displayName: 'Faculty / Teacher',
    isSystemRole: true,
    permissions: ['ATTENDANCE_SESSION_RUN', 'MARKS_ENTRY_ASSIGNED'],
  },
  {
    name: 'student',
    displayName: 'Student',
    isSystemRole: true,
    permissions: ['ATTENDANCE_SCAN_SELF', 'FEES_PAY_SELF'],
  },
];

async function seed() {
  await connectDatabase();

  console.log('[SEED] Upserting permissions...');
  for (const perm of DEFAULT_PERMISSIONS) {
    await Permission.updateOne({ code: perm.code }, { $set: perm }, { upsert: true });
  }

  console.log('[SEED] Upserting roles...');
  for (const role of DEFAULT_ROLES) {
    await Role.updateOne({ name: role.name }, { $set: role }, { upsert: true });
  }

  const adminEmail = process.env.SEED_SUPERADMIN_EMAIL;
  const adminPassword = process.env.SEED_SUPERADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const existing = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!existing) {
      await User.create({
        username: process.env.SEED_SUPERADMIN_USERNAME || 'superadmin',
        email: adminEmail.toLowerCase(),
        fullName: process.env.SEED_SUPERADMIN_NAME || 'System Super Admin',
        passwordHash: adminPassword,
        role: 'superadmin',
        status: 'active',
      });
      console.log(`[SEED] Initial Super Admin created for ${adminEmail}`);
    } else {
      console.log(`[SEED] Super Admin (${adminEmail}) already exists. Skipping.`);
    }
  } else if (env.nodeEnv !== 'production') {
    console.log(
      '[SEED] Set SEED_SUPERADMIN_EMAIL and SEED_SUPERADMIN_PASSWORD in .env to create the initial Super Admin account.'
    );
  }

  await disconnectDatabase();
  console.log('[SEED] Completed successfully.');
}

seed().catch((err) => {
  console.error('[SEED ERROR]', err);
  process.exit(1);
});
