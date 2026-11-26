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
    const fullNameRegex = /^[a-zA-Z]+(?:[ '.-]+[a-zA-Z]+)+$/;

    const trimmedName = formData.name.trim();
    const trimmedAddress = formData.address.trim();
    const trimmedAdminName = formData.adminName.trim();
    const trimmedAdminEmail = formData.adminEmail.trim();
    const trimmedAdminPhone = formData.adminPhone.trim();

    if (!trimmedName) {
      newErrors.name = 'Society name is required';
    } else if (trimmedName.length < 5) {
      newErrors.name = 'Society name must be at least 5 characters';
    }

    if (!trimmedAddress) {
      newErrors.address = 'Full physical address is required';
    } else if (trimmedAddress.length < 5) {
      newErrors.address = 'Full physical address must be at least 5 characters';
    } else if (trimmedAddress.length > 300) {
      newErrors.address = 'Full physical address cannot exceed 300 characters';
    }

    if (!trimmedAdminName) {
      newErrors.adminName = 'Administrator full name is required';
    } else if (trimmedAdminName.length < 3) {
      newErrors.adminName = 'Full name must be at least 3 characters';
    } else if (!fullNameRegex.test(trimmedAdminName)) {
      newErrors.adminName = 'Please enter your full name (both first and last name, letters only)';
    }

    if (!trimmedAdminEmail) {
      newErrors.adminEmail = 'Administrator email address is required';
    } else if (!emailRegex.test(trimmedAdminEmail)) {
      newErrors.adminEmail = 'Please enter a valid email address (e.g. admin@society.com)';
    }

    if (!trimmedAdminPhone) {
      newErrors.adminPhone = 'Mobile phone number is required';
    } else if (!/^\d{10}$/.test(trimmedAdminPhone)) {
      newErrors.adminPhone = 'Mobile phone must be exactly 10 digits';
    }

    setErrors(newErrors);

    // Show only the specific first failing field's error in toast
    const firstErrorMessage = 
      newErrors.name || 
      newErrors.address || 
      newErrors.adminName || 
      newErrors.adminEmail || 
      newErrors.adminPhone;

    if (firstErrorMessage) {
      toast.error(firstErrorMessage);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
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
        if (detailMsg && (errMsg.toLowerCase().includes('validation') || !errMsg.includes(detailMsg))) {
          errMsg = detailMsg;
        }
      }

      toast.error(errMsg);

      // Highlight the specific conflicting field
      const lower = errMsg.toLowerCase();
      if (lower.includes('society') || lower.includes('society name')) {
        setErrors((prev) => ({ ...prev, name: errMsg }));
      } else if (lower.includes('email')) {
        setErrors((prev) => ({ ...prev, adminEmail: errMsg }));
      } else if (lower.includes('phone') || lower.includes('mobile')) {
        setErrors((prev) => ({ ...prev, adminPhone: errMsg }));
      } else if (lower.includes('address')) {
        setErrors((prev) => ({ ...prev, address: errMsg }));
      } else if (lower.includes('name') || lower.includes('admin')) {
        setErrors((prev) => ({ ...prev, adminName: errMsg }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 sm:py-6">
      
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 mb-2">
          <Building2 className="w-4 h-4" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Onboard Your Housing Society</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">Submit society details for verification and portal setup</p>
      </div>

      {submitted ? (
        <div className="glass-card p-5 sm:p-6 rounded-2xl text-center border border-emerald-300 dark:border-emerald-500/40 glow-emerald bg-white/90 dark:bg-[#121214] space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mb-1">Application Submitted!</h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-xs mb-3">
            Your application for <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formData.name}</span> has been received.
          </p>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto mb-4">
            Upon verification, your society portal login credentials will be sent to <span className="text-zinc-900 dark:text-white font-semibold">{formData.adminEmail}</span>.
          </div>
          <Link
            to="/login"
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 transition-colors"
          >
            <span>Back to Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="glass-card p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-xl bg-white dark:bg-[#121214] backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Section 1: Society Info */}
            <div>
              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Society Details
              </div>
              
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Society Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                      }}
                      placeholder="e.g. Greenwood Palms CHS"
                      className={`w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition ${
                        errors.name
                          ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5 font-medium">{errors.name}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Full Physical Address
                    </label>
                  </div>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
                    <textarea
                      required
                      rows={2}
                      maxLength={300}
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({ ...formData, address: e.target.value });
                        if (errors.address) setErrors((prev) => ({ ...prev, address: null }));
                      }}
                      placeholder="Street, Landmark, City & Pincode"
                      className={`w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition resize-none ${
                        errors.address
                          ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.address && (
                    <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5 font-medium">{errors.address}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Society Admin / Secretary Contact */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/80">
              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Society Admin / Secretary Details
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Full Name <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400">(Secretary / Committee Admin)</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={formData.adminName}
                      onChange={(e) => {
                        setFormData({ ...formData, adminName: e.target.value });
                        if (errors.adminName) setErrors((prev) => ({ ...prev, adminName: null }));
                      }}
                      placeholder="e.g. Sadab Mamu"
                      className={`w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition ${
                        errors.adminName
                          ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.adminName && (
                    <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5 font-medium">{errors.adminName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={formData.adminEmail}
                        onChange={(e) => {
                          setFormData({ ...formData, adminEmail: e.target.value });
                          if (errors.adminEmail) setErrors((prev) => ({ ...prev, adminEmail: null }));
                        }}
                        placeholder="admin@society.com"
                        className={`w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition ${
                          errors.adminEmail
                            ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                            : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                        }`}
                      />
                    </div>
                    {errors.adminEmail && (
                      <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5 font-medium">{errors.adminEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Mobile Phone <span className="text-[10px] text-zinc-400 font-normal">(10 digits)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                        placeholder="9876543210"
                        className={`w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 font-mono transition ${
                          errors.adminPhone
                            ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                            : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                        }`}
                      />
                    </div>
                    {errors.adminPhone && (
                      <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5 font-medium">{errors.adminPhone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 font-bold text-xs sm:text-sm hover:opacity-95 shadow-md shadow-amber-500/20 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  Submitting Application...
                </span>
              ) : (
                <>
                  <span>Submit Application</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-800/80 text-center text-xs text-zinc-500">
            Already registered? <Link to="/login" className="text-amber-600 dark:text-amber-400 font-semibold hover:underline">Sign In here</Link>
          </div>
        </div>
      )}
    </div>
  );
}
