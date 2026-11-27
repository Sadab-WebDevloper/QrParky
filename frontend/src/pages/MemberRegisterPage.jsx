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
  ShieldCheck,
  Camera,
  Upload
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
    vehicleName: '',
    vehicleNumber: '',
    vehicleType: '4wheeler',
  });

  // Resident Profile Avatar
  const [avatarPreview, setAvatarPreview] = useState(null);

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

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

  const isValidJpgOrPng = (file) => {
    if (!file) return false;
    const isMimeValid = ALLOWED_IMAGE_TYPES.includes(file.type?.toLowerCase());
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
    const isExtValid = ['jpg', 'jpeg', 'png'].includes(ext);
    return isMimeValid || isExtValid;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidJpgOrPng(file)) {
      toast.error('Only JPG and PNG images are allowed for profile photo.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Profile photo size must be 5MB or less.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidJpgOrPng(file)) {
      toast.error('Only JPG and PNG images are allowed for car image / RC certificate.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Car image / RC document size must be 5MB or less.');
      e.target.value = '';
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
    const fullNameRegex = /^[a-zA-Z]+(?:[ '.-]+[a-zA-Z]+)+$/;

    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      newErrors.name = 'Full name is required (first and last name)';
    } else if (trimmedName.length < 3) {
      newErrors.name = 'Full name must be at least 3 characters';
    } else if (!fullNameRegex.test(trimmedName)) {
      newErrors.name = 'Please enter your full name (both first and last name, letters only)';
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
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formValidationErrors = validateForm();
    const errorKeys = Object.keys(formValidationErrors);
    if (errorKeys.length > 0) {
      // Show the exact first field validation error directly
      toast.error(formValidationErrors[errorKeys[0]]);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        vehicleName: formData.vehicleName.trim() || undefined,
        vehicleNumber: formData.vehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        vehicleType: formData.vehicleType,
        documents: documentPreview ? [documentPreview] : [],
        avatar: avatarPreview || undefined,
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
      let errMsg = '';

      // 1. Check for specific errors array from validation (Zod, express-validator, Sequelize)
      if (data?.errors) {
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          const first = data.errors[0];
          if (typeof first === 'string') {
            errMsg = first;
          } else if (typeof first === 'object' && first !== null) {
            errMsg = first.message || first.msg || first.detail || '';
          }
        } else if (typeof data.errors === 'object') {
          const firstKey = Object.keys(data.errors)[0];
          if (firstKey) {
            const val = data.errors[firstKey];
            errMsg = typeof val === 'string' ? val : (val?.message || val?.msg || '');
          }
        }
      }

      // 2. Check for backend data.message / data.error / data.detail
      if (!errMsg) {
        if (typeof data === 'string') {
          if (data.includes('Payload Too Large') || err.response?.status === 413) {
            errMsg = 'Uploaded photos or documents exceed the maximum upload size limit. Please upload images under 5MB.';
          } else if (data.includes('Too many requests') || err.response?.status === 429) {
            errMsg = 'Too many registration requests. Please wait a moment before trying again.';
          } else if (data.includes('<') && data.includes('>')) {
            const textOnly = data.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            errMsg = textOnly.slice(0, 150);
          } else {
            errMsg = data;
          }
        } else if (typeof data === 'object' && data !== null) {
          errMsg = data.message || data.error || data.detail || '';
        }
      }

      // 3. Fallbacks based on HTTP status code if message is generic
      if (!errMsg || errMsg.toLowerCase() === 'validation error') {
        if (err.response?.status === 413) {
          errMsg = 'Attached photo or RC document is too large. Please upload an image under 5MB.';
        } else if (err.response?.status === 429) {
          errMsg = 'Too many attempts from your device. Please try again later.';
        } else if (err.response?.status === 404) {
          errMsg = 'Invalid or expired society invite link. Please request a new link from your Society Admin.';
        } else if (err.response?.status === 409) {
          errMsg = 'An account or vehicle with these details is already registered.';
        } else if (err.response?.status === 500) {
          errMsg = 'Server temporarily unavailable during registration. Please try again shortly.';
        }
      }

      // 4. Network or connection errors
      if (!errMsg) {
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          errMsg = 'Connection timed out while uploading images. Please check your network and try again.';
        } else if (err.message === 'Network Error' || !err.response) {
          errMsg = 'Unable to connect to server. Please check your network connection.';
        } else if (err.message) {
          errMsg = err.message;
        } else {
          errMsg = 'Please check that your name, email, phone, and vehicle registration are valid.';
        }
      }

      // Ensure generic "Registration failed" is never shown
      if (errMsg.toLowerCase().includes('registration failed')) {
        errMsg = 'Please verify that your email, phone, and vehicle number are not already registered.';
      }

      toast.error(errMsg);

      // Highlight the specific input field that caused the error
      const lower = errMsg.toLowerCase();
      if (lower.includes('phone') || lower.includes('mobile')) {
        setErrors((prev) => ({ ...prev, phone: errMsg }));
      } else if (lower.includes('email')) {
        setErrors((prev) => ({ ...prev, email: errMsg }));
      } else if (lower.includes('vehicle') || lower.includes('plate')) {
        setErrors((prev) => ({ ...prev, vehicleNumber: errMsg }));
      } else if (lower.includes('password')) {
        setErrors((prev) => ({ ...prev, password: errMsg }));
      } else if (lower.includes('name')) {
        setErrors((prev) => ({ ...prev, name: errMsg }));
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
    <div className="max-w-xl mx-auto px-4 py-3 sm:py-5">
      {/* Header */}
      <div className="text-center mb-3 sm:mb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-[11px] font-bold mb-1.5">
          <Building2 className="w-3 h-3" /> {society?.name}
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
          Resident Registration
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
          Create your account and apply for vehicle pass in one step
        </p>
      </div>

      {submitted ? (
        /* SUCCESS CONFIRMATION CARD */
        <div className="glass-card p-5 sm:p-6 rounded-2xl text-center border border-emerald-300 dark:border-emerald-500/40 bg-white/95 dark:bg-[#121214] shadow-xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white mb-0.5">
              Application Submitted!
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed max-w-sm mx-auto">
              Your resident account and vehicle pass request have been forwarded to the <span className="font-bold text-amber-600 dark:text-amber-400">{society?.name}</span> committee for review.
            </p>
          </div>

          {/* Submitted Summary Box */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-left space-y-2">
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-400 font-semibold uppercase text-[10px]">Resident</span>
              <div className="flex items-center gap-2">
                {avatarPreview && (
                  <img src={avatarPreview} alt="Resident" className="w-6 h-6 rounded-full object-cover border border-amber-500/40" />
                )}
                <span className="font-bold text-zinc-900 dark:text-white">{formData.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-400 font-semibold uppercase text-[10px]">Primary Vehicle</span>
              <div className="flex items-center gap-1.5">
                {formData.vehicleName && (
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                    {formData.vehicleName} •
                  </span>
                )}
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 capitalize">
                  {formData.vehicleType === '2wheeler' ? '🏍️ 2-Wheeler' : '🚗 4-Wheeler'}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-900 text-amber-400 font-mono font-bold text-[11px] uppercase border border-zinc-700">
                  {registeredVehicle?.vehicleNumber || formData.vehicleNumber.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-semibold uppercase text-[10px]">Pass Status</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800">
                Pending Admin Approval
              </span>
            </div>
          </div>

          {/* Multi-vehicle hint */}
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/20 text-[11px] text-zinc-700 dark:text-zinc-300 text-left flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong>Need to register a second vehicle?</strong> Once approved, sign in to your dashboard anytime to register additional cars or two-wheelers.
            </span>
          </div>

          <Link
            to="/login"
            className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs sm:text-sm hover:opacity-95 shadow-md shadow-amber-500/20 transition inline-flex items-center justify-center gap-1.5"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* REGISTRATION FORM */
        <div className="glass-card p-4 sm:p-5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-lg bg-white/95 dark:bg-[#121214] backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* SECTION 1: RESIDENT ACCOUNT DETAILS */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 pb-1 border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>1. Resident Profile</span>
              </div>

              {/* Centered Profile Avatar Upload */}
              <div className="flex flex-col items-center justify-center py-1">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-zinc-300 dark:border-zinc-700 group-hover:border-amber-500 bg-zinc-50 dark:bg-[#18181b] flex items-center justify-center transition shadow-inner">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Resident Profile Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                        <User className="w-8 h-8 stroke-[1.5]" />
                      </div>
                    )}
                  </div>

                  {/* Camera Upload Badge */}
                  <label
                    className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center cursor-pointer shadow-md transition active:scale-95 border-2 border-white dark:border-[#121214]"
                    title="Upload Profile Photo (JPG, PNG - Max 5MB)"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {avatarPreview ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Photo Attached
                    </span>
                    <button
                      type="button"
                      onClick={() => setAvatarPreview(null)}
                      className="text-[10px] text-rose-500 hover:underline cursor-pointer font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer font-medium flex items-center gap-1">
                    <Upload className="w-3 h-3 text-amber-500" />
                    <span>Upload Resident Photo <span className="text-zinc-400 dark:text-zinc-500 font-normal">(JPG, PNG • Max 5MB)</span></span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Row 1: Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                      }}
                      placeholder="Enter Your Full Name"
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
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                      }}
                      placeholder="resident@example.com"
                      className={`w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition ${
                        errors.email
                          ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5 font-medium">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Phone and Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Mobile Phone <span className="text-zinc-400 font-normal">(10 digits)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
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
                      className={`w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 font-mono transition ${
                        errors.phone
                          ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5 font-medium">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Password <span className="text-zinc-400 font-normal">(Min 8 chars)</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
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
                      className={`w-full pl-9 pr-9 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition ${
                        errors.password
                          ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none transition p-1 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5 font-medium">{errors.password}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: PRIMARY VEHICLE PASS DETAILS */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  <Car className="w-3.5 h-3.5 text-amber-500" />
                  <span>2. Vehicle Details</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Included Free
                </span>
              </div>

              {/* 1. Car / Scooter Name & 2. Number Plate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    1. Car / Scooter Name 
                  </label>
                  <div className="relative">
                    <Car className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.vehicleName}
                      onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
                      placeholder="e.g. Honda City / Activa 6G"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    2. Number Plate (Registration Plate) 
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
                      className={`w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border text-xs sm:text-sm font-mono font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition uppercase ${
                        errors.vehicleNumber
                          ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-zinc-200 dark:border-zinc-800 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.vehicleNumber && (
                    <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5 font-medium">{errors.vehicleNumber}</p>
                  )}
                </div>
              </div>

              {/* 3. Vehicle Type & 4. RC Certificate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    3. Vehicle Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, vehicleType: '4wheeler' })}
                      className={`h-[38px] px-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                        formData.vehicleType === '4wheeler'
                          ? 'bg-amber-500/15 border-amber-400 text-amber-700 dark:text-amber-400 shadow-xs'
                          : 'bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                      }`}
                    >
                      <Car className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>4-Wheeler</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, vehicleType: '2wheeler' })}
                      className={`h-[38px] px-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                        formData.vehicleType === '2wheeler'
                          ? 'bg-amber-500/15 border-amber-400 text-amber-700 dark:text-amber-400 shadow-xs'
                          : 'bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                      }`}
                    >
                      <Bike className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>2-Wheeler</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    4. RC Certificate / Document <span className="text-zinc-400 font-normal">(JPG, PNG • Max 5MB)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 h-[38px] px-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 bg-zinc-50 dark:bg-[#18181b] cursor-pointer text-xs text-zinc-600 dark:text-zinc-300 transition">
                      <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate max-w-[150px]">{documentName || 'Attach JPG or PNG (Max 5MB)'}</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
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
                        className="h-[38px] px-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-bold cursor-pointer shrink-0"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 h-10 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs sm:text-sm hover:opacity-95 shadow-md shadow-amber-500/20 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  Submitting Application...
                </span>
              ) : (
                <>
                  <span>Register & Request Pass</span>
                  <ArrowRight className="w-4 h-4" />
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
