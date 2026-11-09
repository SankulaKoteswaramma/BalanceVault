import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Customer Pages
import { UserDashboard } from './pages/user/UserDashboard';
import { OnboardingPage } from './pages/user/OnboardingPage';
import { AccountsPage } from './pages/user/AccountsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { OnboardingManagementPage } from './pages/admin/OnboardingManagementPage';
import { AccountManagementPage } from './pages/admin/AccountManagementPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Account Holder Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ACCOUNT_HOLDER']} />}>
            <Route
              path="/dashboard"
              element={
                <DashboardLayout>
                  <UserDashboard />
                </DashboardLayout>
              }
            />
            <Route
              path="/onboarding"
              element={
                <DashboardLayout>
                  <OnboardingPage />
                </DashboardLayout>
              }
            />
            <Route
              path="/accounts"
              element={
                <DashboardLayout>
                  <AccountsPage />
                </DashboardLayout>
              }
            />
          </Route>

          {/* Administrative Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
            <Route
              path="/admin"
              element={
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/users"
              element={
                <DashboardLayout>
                  <UserManagementPage />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/onboarding"
              element={
                <DashboardLayout>
                  <OnboardingManagementPage />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/accounts"
              element={
                <DashboardLayout>
                  <AccountManagementPage />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <DashboardLayout>
                  <AuditLogPage />
                </DashboardLayout>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
