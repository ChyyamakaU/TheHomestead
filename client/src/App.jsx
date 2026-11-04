import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/ui/ProtectedRoute';
import TenantRoute from './components/ui/TenantRoute';

// Public pages
import HomePage from './pages/public/HomePage';
import ApartmentsPage from './pages/public/ApartmentsPage';
import ApartmentDetailPage from './pages/public/ApartmentDetailPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import FaqPage from './pages/public/FaqPage';
import PrivacyPage from './pages/public/PrivacyPage';
import TermsPage from './pages/public/TermsPage';
import CookiePage from './pages/public/CookiePage';
import NotFoundPage from './pages/public/NotFoundPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Admin pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminApartmentsPage from './pages/admin/AdminApartmentsPage';
import AdminViewingRequestsPage from './pages/admin/AdminViewingRequestsPage';
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage';

// Tenant dashboard pages
import DashboardLayout from './pages/dashboard/DashboardLayout';
import DashboardOverviewPage from './pages/dashboard/DashboardOverviewPage';
import DashboardProfilePage from './pages/dashboard/DashboardProfilePage';

// Styles
import './components/ui/ui.css';
import './components/layout/navbar.css';
import './components/layout/footer.css';
import './components/layout/admin.css';
import './components/apartments/apartments.css';
import './components/search/search.css';
import './components/forms/forms.css';
import './styles/pages.css';
import './styles/admin.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public routes (with Navbar + Footer) ─────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/apartments" element={<ApartmentsPage />} />
            <Route path="/apartments/:slug" element={<ApartmentDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookies" element={<CookiePage />} />
          </Route>

          {/* ── Auth pages (standalone centred layout) ────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Admin login ───────────────────────────────────── */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* ── Admin routes (admin/superadmin only) ─────────── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="apartments" element={<AdminApartmentsPage />} />
            <Route path="viewing-requests" element={<AdminViewingRequestsPage />} />
            <Route path="applications" element={<AdminApplicationsPage />} />
          </Route>

          {/* ── Tenant dashboard (tenant only) ───────────────── */}
          <Route
            path="/dashboard"
            element={
              <TenantRoute>
                <DashboardLayout />
              </TenantRoute>
            }
          >
            <Route index element={<DashboardOverviewPage />} />
            <Route path="profile" element={<DashboardProfilePage />} />
            {/* Phases 4–9 will add: applications, viewings, saved, payments */}
          </Route>

          {/* ── 404 ──────────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
