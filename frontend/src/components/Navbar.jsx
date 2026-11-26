import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import Modal from './Modal';
import { QrCode, ShieldCheck, LogOut, User, Building2, Car, ChevronDown, LayoutDashboard, AlertCircle, Sun, Moon } from 'lucide-react';
import { ROLES, ROLE_LABELS } from '../constants/roles';

export default function Navbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenLogoutConfirm = () => {
    setDropdownOpen(false);
    setConfirmLogoutOpen(true);
  };

  const handleConfirmLogout = () => {
    setConfirmLogoutOpen(false);
    logout();
    toast.success('Signed out successfully.');
    navigate('/login', { replace: true });
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === ROLES.SUPER_ADMIN) return '/admin/dashboard';
    if (user.role === ROLES.SOCIETY_ADMIN) return '/society-admin/dashboard';
    return '/member/dashboard';
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full glass-card border-b border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-[#09090b]/90 backdrop-blur-xl transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition duration-200 shrink-0">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-950 font-black" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-700 dark:from-amber-200 dark:via-yellow-300 dark:to-amber-500 bg-clip-text text-transparent tracking-tight">
                QrParky
              </span>
            </div>
          </Link>

          {/* Dynamic Navigation & Profile */}
          <nav className="flex items-center gap-2 sm:gap-3">
            
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400 bg-zinc-100 dark:bg-zinc-900 hover:bg-amber-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-500/40 transition shadow-sm cursor-pointer shrink-0"
              aria-label="Toggle light and dark mode"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                

                {/* Profile Avatar & Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-500/40 transition cursor-pointer"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-lg object-cover border border-amber-500/30" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-zinc-950 font-black text-xs">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className="font-semibold text-xs text-zinc-700 dark:text-zinc-200 max-w-[110px] truncate hidden sm:inline">
                      {user.name}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 glass-card rounded-2xl border border-amber-300/30 dark:border-amber-500/20 shadow-2xl p-2 bg-white dark:bg-[#121214] z-[100] animate-dropdown">
                      
                      {/* User Info Header */}
                      <div className="p-2.5 border-b border-zinc-200 dark:border-zinc-800 mb-1 flex items-center gap-2.5">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-xl object-cover border border-amber-500/40 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-zinc-950 font-black text-sm shrink-0">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">{user.name}</div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{user.email}</div>
                        </div>
                      </div>

                      <div className="px-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800 mb-1">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/40 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                          {ROLE_LABELS[user.role] || 'User'}
                        </div>

                        {user.societyName && (
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                            📍 {user.societyName}
                          </div>
                        )}
                      </div>

                      {/* Menu Actions */}
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        View Dashboard
                      </Link>

                      {/* Sign Out Trigger */}
                      <button
                        type="button"
                        onClick={handleOpenLogoutConfirm}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-300 transition text-left mt-1 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/apply-society"
                  className="hidden sm:inline-flex text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-300 px-3 py-2 rounded-xl transition whitespace-nowrap"
                >
                  Apply Society
                </Link>

                <Link
                  to="/login"
                  className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 hover:opacity-95 shadow-md shadow-amber-500/20 transition whitespace-nowrap shrink-0"
                >
                  Login
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Logout Confirmation Animated Modal */}
      <Modal
        isOpen={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        title="Confirm Sign Out"
      >
        <div className="text-center space-y-4 py-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Are you sure you want to sign out?</h3>
            {/* <p className="text-xs text-zinc-500 dark:text-zinc-400">
              You will need to enter your credentials again to access your dashboard.
            </p> */}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <button
              type="button"
              onClick={() => setConfirmLogoutOpen(false)}
              className="py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold hover:opacity-95 shadow-lg shadow-rose-500/20 transition"
            >
              Yes, Sign Out
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
