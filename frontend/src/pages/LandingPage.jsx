import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  QrCode, 
  CreditCard, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  Car, 
  Sparkles, 
  Users, 
  Clock, 
  Shield, 
  FileCheck, 
  ChevronRight 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf9] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-28 lg:pb-32">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-amber-500/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-yellow-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-6 glow-gold">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                Next-Gen Society Vehicle Security
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-900 dark:text-white mb-6 leading-[1.1]">
                Smart, Encrypted <br />
                <span className="bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-700 dark:from-amber-300 dark:via-yellow-400 dark:to-amber-500 bg-clip-text text-transparent">
                  Vehicle Access Passes
                </span> <br />
                for Modern Societies
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Eliminate unauthorized parking, manual logbooks, and forged stickers. QrParky provides automated resident onboarding, admin approvals, and tamper-proof QR vehicle windshield passes.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                <Link
                  to="/apply-society"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 font-black text-base shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 group"
                >
                  Onboard Your Society
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-[#141416] hover:bg-zinc-100 dark:hover:bg-[#1e1e22] text-zinc-900 dark:text-white font-bold text-base border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-500/50 shadow-sm transition flex items-center justify-center gap-2"
                >
                  Member & Admin Login
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Instant QR Pass Generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Tamper-Proof Encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Zero Hardware Required</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Digital Pass Card Preview */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-sm sm:max-w-md">
                
                {/* Decorative background aura */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500 to-yellow-600 opacity-30 blur-xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

                {/* Digital Vehicle Pass UI Card */}
                <div className="relative glass-card p-6 sm:p-8 rounded-3xl border border-amber-400/40 dark:border-amber-500/30 shadow-2xl bg-white/95 dark:bg-[#121214] backdrop-blur-2xl">
                  
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-5 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-md shadow-amber-500/20">
                        <QrCode className="w-6 h-6 text-zinc-950 font-black" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">OFFICIAL VEHICLE PASS</div>
                        <div className="text-base font-bold text-zinc-900 dark:text-white">Greenwood Palms CHS</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 text-[11px] font-bold">
                      ● ACTIVE
                    </span>
                  </div>

                  {/* QR Code Center Graphic */}
                  <div className="my-6 p-5 rounded-2xl bg-white flex flex-col items-center justify-center shadow-inner border border-zinc-100 dark:border-transparent relative overflow-hidden">
                    <div className="w-36 h-36 border-4 border-zinc-950 rounded-xl p-2 flex items-center justify-center relative bg-white">
                      <QrCode className="w-full h-full text-zinc-950" />
                    </div>
                    <p className="text-[11px] text-zinc-600 font-mono font-bold mt-2">PASS ID: QP-2026-MH02-8821</p>
                  </div>

                  {/* Vehicle & Owner Info Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
                      <div className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold">Vehicle No.</div>
                      <div className="text-sm font-black text-zinc-900 dark:text-white">MH 02 AB 1234</div>
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">4-Wheeler (Car)</div>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
                      <div className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold">Flat & Member</div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">A-402 • Aarav M.</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Owner Member</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    <span>🛡️ Verified Windshield Pass</span>
                    <span>Valid: 2026-2027</span>
                  </div>
                </div>

                {/* Floating micro notification tag */}
                <div className="absolute -bottom-5 -left-4 sm:-left-6 glass-card px-4 py-2.5 rounded-2xl border border-emerald-300 dark:border-emerald-500/40 shadow-xl flex items-center gap-2.5 bg-white/95 dark:bg-[#18181b] animate-bounce">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-zinc-900 dark:text-white">Gate Access Approved</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Instant Verification</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Social Proof / Metrics Bar */}
      <section className="py-10 bg-zinc-100/80 dark:bg-[#121214] border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">100+</div>
              <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-semibold mt-1">Housing Societies</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">25,000+</div>
              <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-semibold mt-1">Vehicles Managed</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">99.9%</div>
              <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-semibold mt-1">Gate Security Accuracy</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">100%</div>
              <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-semibold mt-1">Paperless & Automated</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works: 3 Simple Steps */}
      <section className="py-20 bg-stone-50/50 dark:bg-[#09090b] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest bg-amber-100 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800/50">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white mt-4 mb-4">
              How QrParky Works For Your Society
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
              Set up your society in minutes with zero hardware installation required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="glass-card p-8 rounded-3xl relative border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-xl mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Onboard Society</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4">
                Committee members submit society details. Super Admin approves and automatically generates your Society Admin portal.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> 2-Minute Setup
              </div>
            </div>

            {/* Step 2 */}
            <div className="glass-card p-8 rounded-3xl relative border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-yellow-100 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-black text-xl mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Invite Residents</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4">
                Share your society invite link in resident WhatsApp groups. Members register their 2-wheelers and 4-wheelers directly.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Self-Service Registration
              </div>
            </div>

            {/* Step 3 */}
            <div className="glass-card p-8 rounded-3xl relative border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xl mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Instant QR Pass</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4">
                After society admin approval, high-resolution QR windshield stickers are instantly generated.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Ready to Print or Scan
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-20 bg-zinc-100/50 dark:bg-[#121214]/60 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white mb-4">
              Everything Your Society Needs
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
              Built specifically for residential housing complexes, gated apartments, and commercial towers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="glass-card p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-500/30 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-2">Zero Unauthorized Parking</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Ensure every vehicle entering your premises is verified, registered, and linked to a verified flat owner.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-500/30 transition">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-2">Automated Online Payments</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Collect vehicle sticker fees online. Automated payment receipts and real-time accounting for society treasury.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-500/30 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-2">1-Click Admin Approvals</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Approve or reject resident applications and vehicle additions in seconds from a clean mobile-friendly dashboard.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-500/30 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-2">Encrypted QR Verification</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Guards can instantly scan windshield passes using standard smartphone cameras without proprietary hardware.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 relative overflow-hidden bg-[#fafaf9] dark:bg-[#09090b]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl p-8 sm:p-14 bg-gradient-to-tr from-amber-100 via-stone-50 to-yellow-100 dark:from-[#18181b] dark:via-[#121214] dark:to-[#18181b] border border-amber-300/60 dark:border-amber-500/30 shadow-2xl text-center overflow-hidden">
            
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white mb-4 relative z-10">
              Ready to Upgrade Your Society's Vehicle Security?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base max-w-2xl mx-auto mb-8 relative z-10">
              Join leading residential complexes protecting their gates with smart QR vehicle passes. Submit your society application in 2 minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link
                to="/apply-society"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 font-black text-base shadow-xl shadow-amber-500/25 hover:opacity-95 transition flex items-center justify-center gap-2"
              >
                Apply for Your Society Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#222226] text-zinc-900 dark:text-white font-bold text-base border border-zinc-300 dark:border-zinc-700/80 hover:border-amber-400 dark:hover:border-amber-500/50 shadow-sm transition"
              >
                Already Registered? Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
