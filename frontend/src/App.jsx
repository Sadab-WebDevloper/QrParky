import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ROLES } from './constants/roles';
import { LifeBuoy, Sparkles } from 'lucide-react';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HelpSupportModal from './components/HelpSupportModal';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ScannerPage from './pages/ScannerPage';
import SocietyApplyPage from './pages/SocietyApplyPage';
import MemberRegisterPage from './pages/MemberRegisterPage';
import PassVerifyPage from './pages/PassVerifyPage';
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
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Global listener so any component can open the Help & Support modal
  useEffect(() => {
    const handleOpenHelp = () => setHelpModalOpen(true);
    window.addEventListener('open-help-modal', handleOpenHelp);
    return () => window.removeEventListener('open-help-modal', handleOpenHelp);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf9] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <Navbar onOpenHelp={() => setHelpModalOpen(true)} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage onOpenHelp={() => setHelpModalOpen(true)} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/scan" element={<ScannerPage />} />
          <Route path="/apply-society" element={<SocietyApplyPage />} />
          <Route path="/register/:token" element={<MemberRegisterPage />} />
          <Route path="/pass/verify/:token" element={<PassVerifyPage />} />

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
      <Footer onOpenHelp={() => setHelpModalOpen(true)} />

      {/* Global Floating Help & Support / Improvement Launcher */}
      <button
        type="button"
        onClick={() => setHelpModalOpen(true)}
        className="fixed bottom-5 right-5 z-40 group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-black text-xs shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all border border-amber-300 dark:border-amber-400/40 cursor-pointer"
        aria-label="Help and Support"
        title="Need Help or Want to Suggest Improvements?"
      >
        <LifeBuoy className="w-4 h-4 text-zinc-950 group-hover:rotate-45 transition-transform shrink-0 stroke-[2.5]" />
        <span className="hidden sm:inline">Help & Feedback</span>
        <span className="sm:hidden">Help</span>
      </button>

      {/* Help, Support & Suggestions Modal */}
      <HelpSupportModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  );
}
