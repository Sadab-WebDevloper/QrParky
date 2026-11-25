import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { Building2, User, Mail, Phone, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';

export default function SocietyApplyPage() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!formData.name.trim()) {
      newErrors.name = 'Society name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Society name must be at least 3 characters';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Full physical address is required';
    } else if (formData.address.trim().length < 5) {
      newErrors.address = 'Full physical address must be at least 5 characters';
    }

    if (!formData.adminName.trim()) {
      newErrors.adminName = 'Administrator name is required';
    }

    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = 'Administrator email address is required';
    } else if (!emailRegex.test(formData.adminEmail.trim())) {
      newErrors.adminEmail = 'Please enter a valid email address (e.g. admin@society.com)';
    }

    if (!formData.adminPhone.trim()) {
      newErrors.adminPhone = 'Mobile phone number is required';
    } else if (!/^\d{10}$/.test(formData.adminPhone.trim())) {
      newErrors.adminPhone = 'Mobile phone must be exactly 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please resolve form validation errors.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        submittedBy: {
          name: formData.adminName.trim(),
          email: formData.adminEmail.trim(),
          phone: formData.adminPhone.trim(),
        },
      };

      const res = await API.post('/public/societies/apply', payload);
      if (res.data.success) {
        setSubmitted(true);
        toast.success('Society application submitted successfully!');
      }
    } catch (err) {
      const data = err.response?.data;
      let errMsg = data?.message || 'Failed to submit society application.';

      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        const firstErr = data.errors[0];
        const detailMsg = firstErr.message || firstErr.msg;
        if (detailMsg && (errMsg === 'Validation error' || !errMsg.includes(detailMsg))) {
          errMsg = detailMsg;
        }
      }

      toast.error(errMsg);

      // Highlight the specific conflicting field
      const lower = errMsg.toLowerCase();
      if (lower.includes('society') || lower.includes('name')) {
        setErrors((prev) => ({ ...prev, name: errMsg }));
      } else if (lower.includes('email')) {
        setErrors((prev) => ({ ...prev, adminEmail: errMsg }));
      } else if (lower.includes('phone') || lower.includes('mobile')) {
        setErrors((prev) => ({ ...prev, adminPhone: errMsg }));
      } else if (lower.includes('address')) {
        setErrors((prev) => ({ ...prev, address: errMsg }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
      
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 mb-3">
          <Building2 className="w-5 h-5" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Onboard Your Housing Society</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mt-1">Submit society details for verification and portal setup</p>
      </div>

      {submitted ? (
        <div className="glass-card p-6 sm:p-8 rounded-2xl text-center border border-emerald-300 dark:border-emerald-500/40 glow-emerald bg-white/90 dark:bg-[#121214]">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1.5">Application Submitted!</h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm mb-5">
            Your application for <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formData.name}</span> has been received.
          </p>
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto mb-6">
            Upon verification, your society portal login credentials will be sent to <span className="text-zinc-900 dark:text-white font-semibold">{formData.adminEmail}</span>.
          </div>
          <Link
            to="/login"
            className="px-6 py-2.5 rounded-xl bg-zinc-100 dark:bg-[#18181b] hover:bg-zinc-200 dark:hover:bg-[#222226] border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-semibold text-xs transition inline-flex items-center gap-1.5"
          >
            Back to Sign In <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="glass-card p-6 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-xl bg-white dark:bg-[#121214] backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Section 1: Society Info */}
            <div>
              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Society Details
              </div>
              
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Society Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                      }}
                      placeholder="e.g. Greenwood Palms CHS"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition ${
                        errors.name
                          ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 font-medium">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Full Physical Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
                    <textarea
                      required
                      rows={2}
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({ ...formData, address: e.target.value });
                        if (errors.address) setErrors((prev) => ({ ...prev, address: null }));
                      }}
                      placeholder="Street, Landmark, City & Pincode"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition resize-none ${
                        errors.address
                          ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.address && (
                    <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 font-medium">{errors.address}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Society Admin / Secretary Contact */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80">
              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Society Admin / Secretary Details
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Full Name <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">(Secretary / Committee Admin)</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={formData.adminName}
                      onChange={(e) => {
                        setFormData({ ...formData, adminName: e.target.value });
                        if (errors.adminName) setErrors((prev) => ({ ...prev, adminName: null }));
                      }}
                      placeholder="e.g. Rajesh Sharma"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition ${
                        errors.adminName
                          ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.adminName && (
                    <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 font-medium">{errors.adminName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={formData.adminEmail}
                        onChange={(e) => {
                          setFormData({ ...formData, adminEmail: e.target.value });
                          if (errors.adminEmail) setErrors((prev) => ({ ...prev, adminEmail: null }));
                        }}
                        placeholder="admin@society.com"
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition ${
                          errors.adminEmail
                            ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                            : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                        }`}
                      />
                    </div>
                    {errors.adminEmail && (
                      <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 font-medium">{errors.adminEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Mobile Phone <span className="text-zinc-400 font-normal">(10 digits)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={formData.adminPhone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData({ ...formData, adminPhone: digits });
                          if (errors.adminPhone) setErrors((prev) => ({ ...prev, adminPhone: null }));
                        }}
                        placeholder="9820012345"
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 font-mono transition ${
                          errors.adminPhone
                            ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                            : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                        }`}
                      />
                    </div>
                    {errors.adminPhone && (
                      <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 font-medium">{errors.adminPhone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 font-bold text-sm hover:opacity-95 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  Submitting Application...
                </span>
              ) : (
                <>
                  Submit Application <ArrowRight className="w-4 h-4" />
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
