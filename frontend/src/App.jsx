import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ROLES } from './constants/roles';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SocietyApplyPage from './pages/SocietyApplyPage';
import MemberRegisterPage from './pages/MemberRegisterPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SocietyAdminDashboard from './pages/SocietyAdminDashboard';
import MemberDashboard from './pages/MemberDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-400 bg-white dark:bg-[#09090b]">Loading auth state...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf9] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/apply-society" element={<SocietyApplyPage />} />
          <Route path="/register/:token" element={<MemberRegisterPage />} />

          {/* Protected Dashboards */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/society-admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN]}>
                <SocietyAdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/member/dashboard"
            element={
              <ProtectedRoute allowedRoles={[ROLES.MEMBER]}>
                <MemberDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
