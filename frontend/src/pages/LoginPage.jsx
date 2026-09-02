import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Lock, Mail, QrCode, ArrowRight, Eye, EyeOff, Shield } from 'lucide-react';
import { ROLES } from '../constants/roles';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
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

        {/* Minimal Card */}
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
                  placeholder="name@society.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 font-bold text-sm hover:opacity-95 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  Signing In...
                </span>
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
          <span>Encrypted Session • Role-Based Auto Redirection</span>
        </div>

      </div>
    </div>
  );
}
