import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Car, 
  Bike, 
  FileText, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';

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
  const [errors, setErrors] = useState({});

  // Form Data including initial primary vehicle
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleNumber: '',
    vehicleType: '4wheeler',
  });

  // RC Document Attachment
  const [documentPreview, setDocumentPreview] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [registeredVehicle, setRegisteredVehicle] = useState(null);

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

  const handleDocumentChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB.');
      return;
    }
    setDocumentName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocumentPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address (e.g. resident@example.com)';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile phone is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Mobile phone must be exactly 10 digits';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.vehicleNumber.trim()) {
      newErrors.vehicleNumber = 'Vehicle registration number is required';
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

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        vehicleNumber: formData.vehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        vehicleType: formData.vehicleType,
        documents: documentPreview ? [documentPreview] : [],
      };

      const res = await API.post(`/public/members/register/${token}`, payload);
      if (res.data.success) {
        setRegisteredVehicle(res.data.data?.vehicle || {
          vehicleNumber: payload.vehicleNumber,
          vehicleType: payload.vehicleType,
        });
        setSubmitted(true);
        toast.success('Registration & vehicle pass application submitted!');
      }
    } catch (err) {
      const data = err.response?.data;
      let errMsg = data?.message || 'Registration failed.';

      // Extract specific error details if backend provides an errors array
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        const firstErr = data.errors[0];
        const detailMsg = firstErr.message || firstErr.msg;
        if (detailMsg && (errMsg === 'Validation error' || !errMsg.includes(detailMsg))) {
          errMsg = detailMsg;
        }
      }

      toast.error(errMsg);

      // Highlight the specific input field that caused the error
      const lower = errMsg.toLowerCase();
      if (lower.includes('phone')) {
        setErrors((prev) => ({ ...prev, phone: errMsg }));
      } else if (lower.includes('email')) {
        setErrors((prev) => ({ ...prev, email: errMsg }));
      } else if (lower.includes('vehicle')) {
        setErrors((prev) => ({ ...prev, vehicleNumber: errMsg }));
      } else if (lower.includes('password')) {
        setErrors((prev) => ({ ...prev, password: errMsg }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#fafaf9] dark:bg-[#09090b]">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
          <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          Validating society invite token...
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
    <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-xs font-bold mb-2.5">
          <Building2 className="w-3.5 h-3.5" /> {society?.name}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Resident Registration
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
          Create your resident account and register your vehicle pass in one step
        </p>
      </div>

      {submitted ? (
        /* SUCCESS CONFIRMATION CARD */
        <div className="glass-card p-6 sm:p-8 rounded-3xl text-center border border-emerald-300 dark:border-emerald-500/40 bg-white/95 dark:bg-[#121214] shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mb-1">
              Application Submitted!
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed max-w-sm mx-auto">
              Your resident account and vehicle pass request have been forwarded to the <span className="font-bold text-amber-600 dark:text-amber-400">{society?.name}</span> committee for review.
            </p>
          </div>

          {/* Submitted Summary Box */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-left space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-400 font-semibold uppercase text-[10px]">Resident</span>
              <span className="font-bold text-zinc-900 dark:text-white">{formData.name}</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-400 font-semibold uppercase text-[10px]">Primary Vehicle</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 capitalize">
                  {formData.vehicleType === '2wheeler' ? '🏍️ 2-Wheeler' : '🚗 4-Wheeler'}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-900 text-amber-400 font-mono font-bold text-xs uppercase border border-zinc-700">
                  {registeredVehicle?.vehicleNumber || formData.vehicleNumber.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-semibold uppercase text-[10px]">Pass Status</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800">
                Pending Admin Approval
              </span>
            </div>
          </div>

          {/* Multi-vehicle hint */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/20 text-xs text-zinc-700 dark:text-zinc-300 text-left flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed">
              <strong>Need to register a second vehicle?</strong> Once your account is approved, sign in to your dashboard anytime to register additional cars or two-wheelers.
            </span>
          </div>

          <Link
            to="/login"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs sm:text-sm hover:opacity-95 shadow-md shadow-amber-500/20 transition inline-flex items-center justify-center gap-1.5"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* REGISTRATION FORM */
        <div className="glass-card p-6 sm:p-7 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl bg-white dark:bg-[#121214] backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* SECTION 1: RESIDENT ACCOUNT DETAILS */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-100 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>1. Resident Profile</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                    }}
                    placeholder="Enter Your Full Name"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                      }}
                      placeholder="resident@example.com"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition ${
                        errors.email
                          ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 font-medium">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Mobile Phone <span className="text-zinc-400 font-normal">(10 digits)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone: digits });
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                      }}
                      placeholder="9876543210"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 font-mono transition ${
                        errors.phone
                          ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 font-medium">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Create Password <span className="text-zinc-400 font-normal">(Min 8 characters)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                    }}
                    placeholder="Minimum 8 characters"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition ${
                      errors.password
                        ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none transition p-1 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 font-medium">{errors.password}</p>
                )}
              </div>
            </div>

            {/* SECTION 2: PRIMARY VEHICLE PASS DETAILS (ONE VEHICLE DIRECTLY) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  <Car className="w-3.5 h-3.5 text-amber-500" />
                  <span>2. Primary Vehicle Pass</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Included Free
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Vehicle Registration Number (License Plate)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.vehicleNumber}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        vehicleNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') 
                      });
                      if (errors.vehicleNumber) setErrors((prev) => ({ ...prev, vehicleNumber: null }));
                    }}
                    placeholder="e.g. GJ01AB1234"
                    maxLength={14}
                    style={{ textTransform: 'uppercase' }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-sm font-mono font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition uppercase ${
                      errors.vehicleNumber
                        ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                    }`}
                  />
                </div>
                {errors.vehicleNumber && (
                  <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 font-medium">{errors.vehicleNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Vehicle Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, vehicleType: '4wheeler' })}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                      formData.vehicleType === '4wheeler'
                        ? 'bg-amber-500/15 border-amber-400 text-amber-700 dark:text-amber-400 shadow-sm'
                        : 'bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <Car className="w-4 h-4 text-amber-500" />
                    <span>4-Wheeler (Car)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, vehicleType: '2wheeler' })}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                      formData.vehicleType === '2wheeler'
                        ? 'bg-amber-500/15 border-amber-400 text-amber-700 dark:text-amber-400 shadow-sm'
                        : 'bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <Bike className="w-4 h-4 text-amber-500" />
                    <span>2-Wheeler (Bike)</span>
                  </button>
                </div>
              </div>

              {/* RC / Vehicle Document Upload (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Vehicle RC Certificate / Photo <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 p-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 bg-zinc-50 dark:bg-[#18181b] cursor-pointer text-xs text-zinc-600 dark:text-zinc-300 transition">
                    <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate max-w-[200px]">{documentName || 'Attach Photo or PDF'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleDocumentChange}
                      className="hidden"
                    />
                  </label>
                  {documentPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setDocumentPreview(null);
                        setDocumentName('');
                      }}
                      className="px-2.5 py-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-bold cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/20 text-[11px] text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Your vehicle pass will be generated upon approval. Additional vehicles can be added after login.</span>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-sm hover:opacity-95 shadow-md shadow-amber-500/20 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  Submitting Registration & Pass...
                </span>
              ) : (
                <>
                  <span>Register & Request Vehicle Pass</span>
                  <ArrowRight className="w-4 h-4" />
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
