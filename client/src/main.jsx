import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './index.css';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SessionsPage from './pages/SessionsPage';
import BookSessionPage from './pages/BookSessionPage';
import MyBookingsPage from './pages/MyBookingsPage';
import BookingStatusPage from './pages/BookingStatusPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import InstructorsPage from './pages/InstructorsPage';
import InstructorProfilePage from './pages/InstructorProfilePage';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import PaymentsPage from './pages/admin/PaymentsPage';
import BookingsAdminPage from './pages/admin/BookingsAdminPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import SlotsPage from './pages/admin/SlotsPage';
import UsersPage from './pages/admin/UsersPage';
import SiteConfigPage from './pages/admin/SiteConfigPage';
import InstructorsAdminPage from './pages/admin/InstructorsAdminPage';
import ResourcesAdminPage from './pages/admin/ResourcesAdminPage';
import ResourceHubPage from './pages/ResourceHubPage';

const PublicLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <FooterWrapper />
    </div>
  );
};

const FooterWrapper = () => {
  const [config, setConfig] = React.useState(null);
  React.useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || '/api'}/config/public`).then(r => r.json()).then(d => setConfig(d.config)).catch(() => {});
  }, []);
  return <Footer config={config} />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <ScrollToTop />
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
          {/* Public routes with navbar + footer */}
          <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><RegisterPage /></PublicLayout>} />
          <Route path="/sessions" element={<PublicLayout><SessionsPage /></PublicLayout>} />
          <Route path="/sessions/:id" element={<PublicLayout>
            <ProtectedRoute><BookSessionPage /></ProtectedRoute>
          </PublicLayout>} />
          <Route path="/my-bookings" element={<PublicLayout>
            <ProtectedRoute><MyBookingsPage /></ProtectedRoute>
          </PublicLayout>} />
          <Route path="/booking-status" element={<PublicLayout><BookingStatusPage /></PublicLayout>} />
          <Route path="/forgot-password" element={<PublicLayout><ForgotPasswordPage /></PublicLayout>} />
          <Route path="/reset-password/:token" element={<PublicLayout><ResetPasswordPage /></PublicLayout>} />
          <Route path="/instructors" element={<PublicLayout><InstructorsPage /></PublicLayout>} />
          <Route path="/instructors/:id" element={<PublicLayout><InstructorProfilePage /></PublicLayout>} />
          <Route path="/resources/:slotId" element={<PublicLayout>
            <ProtectedRoute><ResourceHubPage /></ProtectedRoute>
          </PublicLayout>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="bookings" element={<BookingsAdminPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="slots" element={<SlotsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="config" element={<SiteConfigPage />} />
            <Route path="instructors" element={<InstructorsAdminPage />} />
            <Route path="resources" element={<ResourcesAdminPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
);
