import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { Lock, Mail, QrCode, ArrowRight, Eye, EyeOff, Shield, AlertTriangle, ShieldAlert, KeyRound } from 'lucide-react';
import { ROLES } from '../constants/roles';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Security / Malicious Activity & Lockout UI States
  const [lockoutAlert, setLockoutAlert] = useState(null); // { message, minutesRemaining }
  const [attemptWarning, setAttemptWarning] = useState(null); // string

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLockoutAlert(null);
    setAttemptWarning(null);

    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      
      if (user.role === ROLES.SUPER_ADMIN) {
        navigate('/admin/dashboard');
      } else if (user.role === ROLES.SOCIETY_ADMIN) {
        navigate('/society-admin/dashboard');
      } else {
        navigate('/member/dashboard');
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 423 || data?.locked) {
        // Account Locked due to repeated failed logins
        setLockoutAlert({
          message: data?.message || 'Account locked for security reasons. Too many failed attempts.',
          minutesRemaining: data?.minutesRemaining || 15,
        });
        toast.error('Account locked due to suspicious activity.');
      } else if (status === 429) {
        // IP / Rate Limit Blocked
        setLockoutAlert({
          message: data?.message || 'Too many requests from this network. Temporarily blocked.',
          minutesRemaining: 15,
        });
        toast.error('Network rate limit triggered.');
      } else if (data?.attemptsRemaining !== undefined) {
        setAttemptWarning(`Warning: ${data.attemptsRemaining} attempt(s) remaining before temporary account lockout.`);
        toast.error(data.message || 'Invalid credentials.');
      } else {
        toast.error(data?.message || 'Login failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { email: forgotEmail });
      toast.success(res.data?.message || 'Password reset link sent to your email.');
      setForgotModalOpen(false);
      setForgotEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-8 sm:py-12 bg-[#fafaf9] dark:bg-[#09090b]">
      <div className="w-full max-w-[400px]">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 shadow-md shadow-amber-500/20 mb-3">
            <QrCode className="w-6 h-6 text-zinc-950" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Sign In</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mt-1">Access your society portal & vehicle passes</p>
        </div>

        {/* Prominent Malicious Activity & Account Lockout Warning */}
        {lockoutAlert && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
              <span>Security Lockout Triggered</span>
            </div>
            <p className="leading-relaxed">{lockoutAlert.message}</p>
            <div className="font-mono text-[11px] text-rose-600 dark:text-rose-400">
              ⏱️ Auto-unlocks in approximately {lockoutAlert.minutesRemaining} minute(s).
            </div>
          </div>
        )}

        {/* Failed Attempt Warning Banner */}
        {attemptWarning && !lockoutAlert && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{attemptWarning}</span>
          </div>
        )}

        {/* Login Card */}
        <div className="glass-card p-6 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl bg-white dark:bg-[#121214] backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotModalOpen(true);
                  }}
                  className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Your Password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 focus:outline-none transition p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (lockoutAlert && lockoutAlert.minutesRemaining > 0)}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 font-bold text-sm hover:opacity-95 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  Verifying Credentials...
                </span>
              ) : lockoutAlert ? (
                'Account Temporarily Locked'
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Clean footer info */}
          <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 text-center text-xs text-zinc-500 dark:text-zinc-400">
            <span>Housing Society Committee? </span>
            <Link to="/apply-society" className="text-amber-600 dark:text-amber-400 font-semibold hover:underline">
              Onboard Society
            </Link>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          <span>Brute-Force Protected • Auto Account Lockout Protection</span>
        </div>

      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={forgotModalOpen} onClose={() => setForgotModalOpen(false)} title="Reset Account Password">
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Enter your registered account email. We will send a secure time-limited link to reset your password.
          </p>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="name@society.com"
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 font-bold text-xs hover:opacity-95 shadow-md shadow-amber-500/20 transition disabled:opacity-50"
            >
              {forgotLoading ? 'Dispatching Reset Link...' : 'Send Password Reset Email'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
