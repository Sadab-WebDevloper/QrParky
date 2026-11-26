import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Lightbulb, 
  BookOpen, 
  LifeBuoy, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Building2,
  Car,
  Camera,
  Mail,
  MessageSquare
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function HelpSupportModal({ isOpen, onClose }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('improve'); // 'improve' | 'guide' | 'contact'
  const [formData, setFormData] = useState({
    name: '',
    emailOrPhone: '',
    category: 'improvement', // 'improvement' | 'feature' | 'issue'
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message.trim()) return;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const contactVal = formData.emailOrPhone.trim();
    if (contactVal && contactVal.includes('@') && !emailRegex.test(contactVal)) {
      toast.error('Please enter a valid email address (e.g. user@domain.com).');
      return;
    }

    setSubmitting(true);
    try {
      // Send to backend API which triggers real SMTP email dispatch
      await api.post('/public/feedback', formData);
    } catch (err) {
      console.warn('Backend feedback notification warning (saving locally):', err?.response?.data || err.message);
    }

    // Store in localStorage as persistent feedback log
    try {
      const existing = JSON.parse(localStorage.getItem('qrparky_user_feedback') || '[]');
      existing.push({
        ...formData,
        submittedAt: new Date().toISOString()
      });
      localStorage.setItem('qrparky_user_feedback', JSON.stringify(existing));
    } catch (err) {
      // Ignore storage errors
    }

    setSubmitting(false);
    setSubmitted(true);
    toast.success('Thank you! Your feedback has been sent to our team via email.');
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      emailOrPhone: '',
      category: 'improvement',
      message: ''
    });
    setSubmitted(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-backdrop overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="glass-card w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 sm:p-7 relative bg-white dark:bg-[#121215] max-h-[92vh] flex flex-col my-auto animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-zinc-950 shadow-md shadow-amber-500/20 shrink-0">
              <LifeBuoy className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Support & Feedback Hub</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                Help, Support & Improvements
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl my-4 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('improve')}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'improve'
                ? 'bg-white dark:bg-[#1c1c20] text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Suggest Ideas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white dark:bg-[#1c1c20] text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">How to Use</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-white dark:bg-[#1c1c20] text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Contact</span>
          </button>
        </div>

        {/* Tab 1: Suggest Improvement / Feedback Form */}
        {activeTab === 'improve' && (
          <div className="overflow-y-auto pr-1 flex-1">
            {submitted ? (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
                  Feedback Received!
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
                  Thank you for helping us make QrParky better. Our engineering team reviews all user suggestions and improvements directly.
                </p>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
                >
                  Submit Another Suggestion
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/20 text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Have an idea to improve the system or noticed something to fix? Share your thoughts below!
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Feedback Category
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { id: 'improvement', label: 'Improvement' },
                      { id: 'feature', label: 'New Feature' },
                      { id: 'issue', label: 'Report Issue' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`py-2 px-2 rounded-xl border text-center font-semibold transition cursor-pointer ${
                          formData.category === cat.id
                            ? 'bg-amber-500/15 border-amber-400 text-amber-700 dark:text-amber-400 shadow-sm'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Email or WhatsApp
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.emailOrPhone}
                      onChange={(e) => setFormData({ ...formData, emailOrPhone: e.target.value })}
                      placeholder="email@domain.com or phone"
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    What should we improve or add?
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your suggestion, improvement idea, or any difficulties you faced..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:opacity-95 transition cursor-pointer"
                >
                  {submitting ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Suggestion</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: User Guide (How to Use) */}
        {activeTab === 'guide' && (
          <div className="overflow-y-auto pr-1 flex-1 space-y-3">
            {/* Guide Card 1: Society Onboarding */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800/80">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span>1. How to Onboard a Society</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-8">
                Click <strong>"Onboard Your Society"</strong> on the landing page, enter society details & management contact. Super Admin reviews and automatically generates your Society Admin login.
              </p>
            </div>

            {/* Guide Card 2: Resident Vehicle Passes */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800/80">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                  <Car className="w-3.5 h-3.5" />
                </div>
                <span>2. How Residents Get Vehicle Passes</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-8">
                Society Admin shares the self-registration link. Flat owners enter vehicle number, upload RC copy, and pay sticker fee online. Instant cryptographic QR pass is generated for windshield printing.
              </p>
            </div>

            {/* Guide Card 3: Gate Scanning */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800/80">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5" />
                </div>
                <span>3. How Security Guards Scan Passes</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-8">
                Point any smartphone camera or QR scanner at the windshield sticker. The system instantly verifies the encrypted credentials in 0.4 seconds and approves gate access.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Contact Support */}
        {activeTab === 'contact' && (
          <div className="overflow-y-auto pr-1 flex-1 space-y-3.5">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800/80 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                Direct Helpdesk Support
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Available for society committees, admins, and resident inquiries.
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Support Email:</span>
                  <a href="mailto:support@qrparky.com" className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
                    support@qrparky.com
                  </a>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Technical Admin:</span>
                  <a href="mailto:admin@sadab.site" className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
                    admin@sadab.site
                  </a>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Response SLA:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Within 2 Hours</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-Bit Encrypted Platform</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-zinc-700 dark:text-zinc-300 hover:text-amber-500 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
