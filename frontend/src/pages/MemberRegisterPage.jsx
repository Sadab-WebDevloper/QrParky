import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { UserCheck, Building2, ShieldAlert, CheckCircle2, ArrowRight, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';

export default function MemberRegisterPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [society, setSociety] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    const checkToken = async () => {
      try {
        const res = await API.get(`/public/societies/invite/${token}`);
        if (res.data.success) {
          setSociety(res.data.data);
        }
      } catch (err) {
        setInvalid(true);
      } finally {
        setLoading(false);
      }
    };
    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await API.post(`/public/members/register/${token}`, formData);
      if (res.data.success) {
        setSubmitted(true);
        toast.success('Registration submitted! Awaiting Society Admin approval.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#fafaf9] dark:bg-[#09090b]">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
          <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          Validating invite token...
        </div>
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="glass-card p-6 sm:p-7 rounded-2xl border border-rose-300 dark:border-rose-500/40 bg-white/90 dark:bg-[#121214]">
          <ShieldAlert className="w-12 h-12 text-rose-500 dark:text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Invalid or Expired Invite Link</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-xs mb-5">
            This invite link is invalid or expired. Please request a new registration link from your Society Admin.
          </p>
          <Link to="/" className="px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-[#222226] transition inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[420px] mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-xs font-bold mb-2.5">
          <Building2 className="w-3.5 h-3.5" /> {society?.name}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Resident Registration</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Register to access digital vehicle passes</p>
      </div>

      {submitted ? (
        <div className="glass-card p-6 sm:p-7 rounded-2xl text-center border border-emerald-300 dark:border-emerald-500/40 glow-emerald bg-white/90 dark:bg-[#121214]">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Registration Pending</h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-xs mb-5">
            Your account request has been forwarded to the <span className="font-semibold text-emerald-600 dark:text-emerald-400">{society?.name}</span> administrator.
          </p>
          <Link
            to="/login"
            className="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-semibold text-xs hover:bg-zinc-200 dark:hover:bg-[#222226] transition inline-flex items-center justify-center gap-1.5"
          >
            Go to Sign In <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="glass-card p-6 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl bg-white dark:bg-[#121214] backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your name"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="aarav@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Mobile Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 font-bold text-sm hover:opacity-95 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  Registering...
                </span>
              ) : (
                <>
                  Create Member Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800/80 text-center text-xs text-zinc-500">
            Already registered? <Link to="/login" className="text-amber-600 dark:text-amber-400 font-semibold hover:underline">Sign In here</Link>
          </div>
        </div>
      )}
    </div>
  );
}
