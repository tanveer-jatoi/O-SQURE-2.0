import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, getRoleHomePath } from './context/AuthContext.jsx';
import { useAuth } from './hooks/useAuth.js';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { PublicOnlyRoute } from './components/PublicOnlyRoute.jsx';
import { DashboardLayout } from './layouts/DashboardLayout.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { UnauthorizedPage } from './pages/UnauthorizedPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard.jsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard.jsx';
import { StudentDashboard } from './pages/student/StudentDashboard.jsx';
import { UsersManagementPage } from './pages/shared/UsersManagementPage.jsx';
import { AuditLogsPage } from './pages/shared/AuditLogsPage.jsx';
import { ProfileSecurityPage } from './pages/shared/ProfileSecurityPage.jsx';
import { ModuleComingSoonPage } from './pages/shared/ModuleComingSoonPage.jsx';
import { StudentsPage } from './pages/admin/StudentsPage.jsx';
import { TeachersPage } from './pages/admin/TeachersPage.jsx';
import { AdmissionsPage } from './pages/admin/AdmissionsPage.jsx';
import { AcademicsPage } from './pages/admin/AcademicsPage.jsx';
import { TeacherBatchesPage } from './pages/teacher/TeacherBatchesPage.jsx';
import { AttendanceControlPage } from './pages/admin/AttendanceControlPage.jsx';
import { QrAttendanceSessionPage } from './pages/teacher/QrAttendanceSessionPage.jsx';
import { StudentQrScanPage } from './pages/student/StudentQrScanPage.jsx';
import { StudentAttendancePage } from './pages/student/StudentAttendancePage.jsx';
import { ExaminationsPage } from './pages/admin/ExaminationsPage.jsx';
import { TeacherMarksEntryPage } from './pages/teacher/TeacherMarksEntryPage.jsx';
import { StudentResultsPage } from './pages/student/StudentResultsPage.jsx';
import { AdminFeesPage } from './pages/admin/AdminFeesPage.jsx';
import { StudentFeesPage } from './pages/student/StudentFeesPage.jsx';
import { TimetablePage } from './pages/shared/TimetablePage.jsx';
import { NoticesAndMaterialsPage } from './pages/shared/NoticesAndMaterialsPage.jsx';
import { SystemSettingsPage } from './pages/superadmin/SystemSettingsPage.jsx';
import { ReportsAnalyticsPage } from './pages/admin/ReportsAnalyticsPage.jsx';

function RootRedirect() {
  const { user, isAuthenticated, isInitializing } = useAuth();
  if (isInitializing) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleHomePath(user.role)} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Super Admin Portal */}
          <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
            <Route path="/superadmin" element={<DashboardLayout />}>
              <Route index element={<SuperAdminDashboard />} />
              <Route path="users" element={<UsersManagementPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="settings" element={<SystemSettingsPage />} />
              <Route path="security" element={<ProfileSecurityPage />} />
            </Route>
          </Route>

          {/* Campus Admin Portal (Super Admin can also access Admin ERP) */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}>
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="admissions" element={<AdmissionsPage />} />
              <Route path="teachers" element={<TeachersPage />} />
              <Route path="academics" element={<AcademicsPage />} />
              <Route path="attendance" element={<AttendanceControlPage />} />
              <Route path="exams" element={<ExaminationsPage />} />
              <Route path="fees" element={<AdminFeesPage />} />
              <Route path="timetable" element={<TimetablePage />} />
              <Route path="notices" element={<NoticesAndMaterialsPage />} />
              <Route path="reports" element={<ReportsAnalyticsPage />} />
              <Route path="users" element={<UsersManagementPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="security" element={<ProfileSecurityPage />} />
            </Route>
          </Route>

          {/* Teacher Portal */}
          <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
            <Route path="/teacher" element={<DashboardLayout />}>
              <Route index element={<TeacherDashboard />} />
              <Route path="batches" element={<TeacherBatchesPage />} />
              <Route path="qr-attendance" element={<QrAttendanceSessionPage />} />
              <Route path="marks" element={<TeacherMarksEntryPage />} />
              <Route path="timetable" element={<TimetablePage />} />
              <Route path="notices" element={<NoticesAndMaterialsPage />} />
              <Route path="security" element={<ProfileSecurityPage />} />
            </Route>
          </Route>

          {/* Student Portal */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student" element={<DashboardLayout />}>
              <Route index element={<StudentDashboard />} />
              <Route path="scan-qr" element={<StudentQrScanPage />} />
              <Route path="attendance" element={<StudentAttendancePage />} />
              <Route path="fees" element={<StudentFeesPage />} />
              <Route path="results" element={<StudentResultsPage />} />
              <Route path="timetable" element={<TimetablePage />} />
              <Route path="notices" element={<NoticesAndMaterialsPage />} />
              <Route path="security" element={<ProfileSecurityPage />} />
            </Route>
          </Route>

          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
