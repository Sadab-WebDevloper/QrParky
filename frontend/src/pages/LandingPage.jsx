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
  ChevronRight,
  Camera,
  LogIn,
  Zap,
  Lock
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf9] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[350px] bg-amber-500/15 blur-[140px] rounded-full pointer-events-none animate-pulse-ambient" />
        <div className="absolute top-1/3 left-1/4 w-[300px] sm:w-[400px] h-[300px] bg-yellow-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse-ambient" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-7 text-center lg:text-left flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-5 glow-gold w-fit mx-auto lg:mx-0">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>Next-Gen Society Vehicle Security</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[3.4rem] font-black tracking-tight text-zinc-900 dark:text-white mb-5 leading-[1.14]">
                Smart, Encrypted <br />
                <span className="bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-700 dark:from-amber-300 dark:via-yellow-400 dark:to-amber-500 bg-clip-text text-transparent">
                  Vehicle Access Passes
                </span> <br />
                for Modern Societies
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-zinc-600 dark:text-zinc-300 mb-7 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Eliminate unauthorized parking, manual logbooks, and forged stickers. QrParky provides automated resident onboarding, admin approvals, and tamper-proof QR vehicle windshield passes.
              </p>

              {/* Hero Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-6">
                <Link
                  to="/apply-society"
                  className="h-[50px] px-7 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all whitespace-nowrap group"
                >
                  <span>Onboard Your Society</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>

                <Link
                  to="/scan"
                  className="h-[50px] px-6 rounded-xl bg-white dark:bg-[#141417] hover:bg-zinc-100 dark:hover:bg-[#1f1f23] text-zinc-900 dark:text-white font-bold text-sm sm:text-base border border-zinc-200 dark:border-zinc-800 hover:border-amber-400/60 dark:hover:border-amber-500/50 flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all whitespace-nowrap"
                  title="Open Gate Scanner"
                >
                  <Camera className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Gate Scanner</span>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-5 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Instant QR Pass</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Tamper-Proof Encryption</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Zero Hardware Required</span>
                </div>
              </div>

              {/* Live Trust Metric Strip — Balances Left & Right Height */}
              <div className="mt-6 pt-5 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center lg:justify-start gap-5 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <span className="inline-flex h-6 w-6 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-amber-500 text-zinc-950 font-black text-[9px] items-center justify-center">GP</span>
                    <span className="inline-flex h-6 w-6 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-yellow-500 text-zinc-950 font-black text-[9px] items-center justify-center">SH</span>
                    <span className="inline-flex h-6 w-6 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-emerald-500 text-zinc-950 font-black text-[9px] items-center justify-center">RK</span>
                  </div>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">100+ Gated Societies Protected</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>0.4s Verification</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Digital Pass Card Preview */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0">
              <div className="relative mx-auto max-w-sm sm:max-w-md animate-float-slow">
                
                {/* Decorative background aura & ambient glow */}
                <div className="absolute -inset-1.5 rounded-[2.5rem] bg-gradient-to-tr from-amber-500/30 via-yellow-500/20 to-amber-600/30 blur-2xl pointer-events-none" />

                {/* Digital Vehicle Pass UI Card — High-Security Smart Permit */}
                <div className="relative rounded-3xl sm:rounded-[2rem] border border-amber-400/40 dark:border-amber-500/40 shadow-2xl bg-white/95 dark:bg-[#121215] backdrop-blur-2xl p-5 sm:p-6 overflow-hidden">
                  
                  {/* Subtle Card Background Mesh & Watermark */}
                  <div className="absolute -right-8 -top-8 w-40 h-40 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />

                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                        <ShieldCheck className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-amber-600 dark:text-amber-400 tracking-widest uppercase flex items-center gap-1.5">
                          <span>OFFICIAL VEHICLE PASS</span>
                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                          <span>SECURE</span>
                        </div>
                        <div className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">Greenwood Palms CHS</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 text-[10px] font-extrabold shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ACTIVE
                    </span>
                  </div>

                  {/* QR Code Center Graphic — High-Tech Scanner Frame */}
                  <div className="my-3.5 p-3.5 rounded-2xl bg-gradient-to-b from-zinc-50 to-zinc-100/80 dark:from-[#18181c] dark:to-[#141416] border border-zinc-200 dark:border-zinc-800/80 flex flex-col items-center justify-center relative overflow-hidden shadow-inner group">
                    
                    {/* Scanner Reticle / Corner Target Brackets with Animated Scan Line */}
                    <div className="relative p-2.5 bg-white rounded-xl shadow-md border border-zinc-200/80 dark:border-zinc-700/60 overflow-hidden">
                      {/* High-Tech Animated Laser Scan Line */}
                      <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-amber-500 dark:via-yellow-400 to-transparent shadow-[0_0_10px_#f59e0b] animate-laser-scan z-10 pointer-events-none" />

                      <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-amber-500 rounded-tl-sm z-20" />
                      <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-amber-500 rounded-tr-sm z-20" />
                      <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-amber-500 rounded-bl-sm z-20" />
                      <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-amber-500 rounded-br-sm z-20" />
                      
                      <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center relative">
                        <QrCode className="w-full h-full text-zinc-950 stroke-[1.8]" />
                      </div>
                    </div>

                    {/* Pass Cryptographic ID */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-mono font-bold border border-amber-400/30">
                        PASS ID: QP-2026-GJ09-8821
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Plate & Member Info Grid */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs mb-3.5">
                    
                    {/* Authentic Indian Number Plate (GJ - Gujarat) */}
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800/90 flex flex-col justify-between">
                      <div className="text-zinc-500 dark:text-zinc-400 text-[9px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                        <Car className="w-3 h-3 text-amber-500" />
                        <span>Vehicle Number</span>
                      </div>
                      
                      {/* Indian HSRP License Plate Mockup */}
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-900 border-2 border-zinc-800 dark:border-zinc-700 shadow-sm w-fit">
                        <div className="flex flex-col items-center justify-center leading-none pr-1 border-r border-zinc-300 dark:border-zinc-700 text-[7px] font-black text-blue-700 dark:text-blue-400">
                          <span>🇮🇳</span>
                          <span className="text-[6px] tracking-tighter mt-0.5 font-bold">IND</span>
                        </div>
                        <span className="text-xs font-black font-mono tracking-wider text-zinc-900 dark:text-white uppercase">
                          GJ 09 AB 1234
                        </span>
                      </div>

                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                        4-Wheeler (Car)
                      </div>
                    </div>

                    {/* Member & Flat Info */}
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800/90 flex flex-col justify-between">
                      <div className="text-zinc-500 dark:text-zinc-400 text-[9px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-amber-500" />
                        <span>Flat & Member</span>
                      </div>
                      
                      <div>
                        <div className="text-xs font-extrabold text-zinc-900 dark:text-white truncate">
                          A-402 • Sadab Mamu
                        </div>
                        {/* <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                          Resident Flat Owner
                        </div> */}
                      </div>

                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified Resident</span>
                      </div>
                    </div>
                  </div>

                  {/* Windshield Validity Footer */}
                  <div className="p-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border border-amber-300/50 dark:border-amber-800/40 flex items-center justify-between text-[10px] text-amber-800 dark:text-amber-300 font-semibold shadow-sm">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Tamper-Proof Windshield Pass</span>
                    </span>
                    <span className="font-mono font-bold bg-amber-500/15 dark:bg-amber-400/10 px-2 py-0.5 rounded-md">
                      Valid: 2026–2027
                    </span>
                  </div>
                </div>

                {/* Redesigned Gate Access Approved Live Badge — Balanced & Centered */}
                {/* <div className="absolute -bottom-4 sm:-bottom-5 left-1/2 -translate-x-1/2 w-[92%] sm:w-max max-w-[340px] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-white/95 dark:bg-[#18181c]/95 border border-emerald-400/60 dark:border-emerald-500/50 shadow-xl shadow-emerald-500/10 backdrop-blur-xl flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3.5 z-20">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative flex items-center justify-center shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                        <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5 leading-tight whitespace-nowrap">
                        <span>Gate Access Approved</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                        Windshield Pass • 0.4s Scan
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 whitespace-nowrap">
                    PASS
                  </span>
                </div> */}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Social Proof / Metrics Section — Unified Equal Padding Cards */}
      <section className="py-10 sm:py-14 bg-zinc-100/60 dark:bg-[#101012] border-y border-zinc-200 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 items-stretch">
            
            <div className="p-4 sm:p-6 rounded-2xl glass-card border border-zinc-200 dark:border-zinc-800/80 flex flex-col items-center justify-center text-center shadow-sm hover:border-amber-400 dark:hover:border-amber-500/40 transition-all">
              <div className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
                100+
              </div>
              <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-semibold mt-1">
                Housing Societies
              </div>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl glass-card border border-zinc-200 dark:border-zinc-800/80 flex flex-col items-center justify-center text-center shadow-sm hover:border-amber-400 dark:hover:border-amber-500/40 transition-all">
              <div className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
                25,000+
              </div>
              <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-semibold mt-1">
                Vehicles Managed
              </div>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl glass-card border border-zinc-200 dark:border-zinc-800/80 flex flex-col items-center justify-center text-center shadow-sm hover:border-amber-400 dark:hover:border-amber-500/40 transition-all">
              <div className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
                99.9%
              </div>
              <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-semibold mt-1">
                Security Accuracy
              </div>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl glass-card border border-zinc-200 dark:border-zinc-800/80 flex flex-col items-center justify-center text-center shadow-sm hover:border-amber-400 dark:hover:border-amber-500/40 transition-all">
              <div className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
                100%
              </div>
              <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-semibold mt-1">
                Paperless & Automated
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How it Works: 3 Simple Steps (Equal Height Cards) */}
      <section className="py-16 sm:py-24 bg-stone-50/50 dark:bg-[#09090b] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest bg-amber-100 dark:bg-amber-950/60 px-3.5 py-1.5 rounded-full border border-amber-300 dark:border-amber-800/50">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white mt-4 mb-3 tracking-tight">
              How QrParky Works For Your Society
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
              Set up your society in minutes with zero hardware installation required.
            </p>
          </div>

          {/* Equal height grid with h-full and flex column */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            
            {/* Step 1 */}
            <div className="h-full flex flex-col justify-between glass-card p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800/90 hover:border-amber-400 dark:hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl dark:shadow-none group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-xl mb-6 shadow-sm group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-all duration-300">
                  1
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mb-3">Onboard Society</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                  Committee members submit society details. Super Admin approves and automatically generates your Society Admin portal.
                </p>
              </div>
              <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>2-Minute Digital Setup</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="h-full flex flex-col justify-between glass-card p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800/90 hover:border-amber-400 dark:hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl dark:shadow-none group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-yellow-100 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-black text-xl mb-6 shadow-sm group-hover:scale-110 group-hover:bg-yellow-500 group-hover:text-zinc-950 transition-all duration-300">
                  2
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mb-3">Invite Residents</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                  Share your society invite link in resident WhatsApp groups. Members register their 2-wheelers and 4-wheelers directly.
                </p>
              </div>
              <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center gap-2 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Self-Service Resident Portal</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="h-full flex flex-col justify-between glass-card p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800/90 hover:border-amber-400 dark:hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl dark:shadow-none group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xl mb-6 shadow-sm group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-all duration-300">
                  3
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mb-3">Instant QR Pass</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                  After society admin approval, high-resolution QR windshield stickers are instantly generated with cryptographic verification.
                </p>
              </div>
              <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Ready to Print or Scan</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Pillars: Everything Your Society Needs (Equal Height Grid) */}
      <section className="py-16 sm:py-24 bg-zinc-100/50 dark:bg-[#121214]/60 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest bg-amber-100 dark:bg-amber-950/60 px-3.5 py-1.5 rounded-full border border-amber-300 dark:border-amber-800/50">
              Complete Feature Suite
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white mt-4 mb-3 tracking-tight">
              Everything Your Society Needs
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
              Built specifically for residential housing complexes, gated apartments, and commercial towers.
            </p>
          </div>

          {/* Equal height 4-box grid on desktop, 2x2 on tablet, 1 col on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 items-stretch">
            
            {/* Box 1 */}
            <div className="h-full flex flex-col justify-between glass-card p-6 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 hover:border-amber-400 dark:hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl dark:shadow-none group">
              <div>
                <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 shrink-0 shadow-sm group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mb-2 leading-snug">Zero Unauthorized Parking</h4>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Ensure every vehicle entering your premises is verified, registered, and linked to a verified flat owner.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/50 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Flat Verified
              </div>
            </div>

            {/* Box 2 */}
            <div className="h-full flex flex-col justify-between glass-card p-6 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 hover:border-amber-400 dark:hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl dark:shadow-none group">
              <div>
                <div className="w-11 h-11 rounded-xl bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center mb-5 shrink-0 shadow-sm group-hover:scale-110 group-hover:bg-yellow-500/20 transition-all duration-300">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mb-2 leading-snug">Automated Online Payments</h4>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Collect vehicle sticker fees online via Razorpay. Automated receipts and real-time accounting for treasury.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/50 text-[11px] font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Razorpay Integrated
              </div>
            </div>

            {/* Box 3 */}
            <div className="h-full flex flex-col justify-between glass-card p-6 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 hover:border-amber-400 dark:hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl dark:shadow-none group">
              <div>
                <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 shrink-0 shadow-sm group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mb-2 leading-snug">1-Click Admin Approvals</h4>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Approve or reject resident applications, review uploaded RC documents, and manage slots from one dashboard.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/50 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> RC Document Review
              </div>
            </div>

            {/* Box 4 */}
            <div className="h-full flex flex-col justify-between glass-card p-6 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 hover:border-amber-400 dark:hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl dark:shadow-none group">
              <div>
                <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 shrink-0 shadow-sm group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mb-2 leading-snug">Encrypted QR Verification</h4>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Guards instantly scan windshield passes using standard smartphone cameras with sub-second encrypted verification.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/50 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sub-Second Scanning
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Redesigned Bottom CTA Banner — Premium SaaS Card */}
      <section className="py-16 sm:py-24 relative overflow-hidden bg-[#fafaf9] dark:bg-[#09090b]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 md:p-16 bg-gradient-to-b from-amber-50/90 via-white to-amber-100/40 dark:from-[#18181c] dark:via-[#131316] dark:to-[#0c0c0e] border border-amber-300/80 dark:border-amber-500/30 shadow-2xl text-center overflow-hidden">
            
            {/* Ambient Lighting Gradients */}
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/15 blur-[90px] rounded-full pointer-events-none animate-pulse-ambient" />
            <div className="absolute -bottom-10 left-1/4 w-80 h-80 bg-yellow-500/15 blur-[100px] rounded-full pointer-events-none animate-pulse-ambient" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-400/40 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-6">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Instant Society Setup • Zero Hardware</span>
              </div>

              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight leading-[1.2]">
                Ready to Upgrade Your Society's <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 dark:from-amber-300 dark:via-yellow-400 dark:to-amber-500 bg-clip-text text-transparent">
                  Vehicle Security?
                </span>
              </h2>

              <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base max-w-2xl mx-auto mb-8 sm:mb-10 font-normal leading-relaxed">
                Join leading residential complexes protecting their gates with smart QR vehicle passes. Submit your society onboarding application in just 2 minutes.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 max-w-md sm:max-w-none mx-auto mb-8">
                <Link
                  to="/apply-society"
                  className="h-[50px] px-8 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all whitespace-nowrap group"
                >
                  <span>Apply for Your Society Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>

                <Link
                  to="/login"
                  className="h-[50px] px-8 rounded-xl bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#222226] text-zinc-900 dark:text-white font-bold text-sm sm:text-base border border-zinc-300 dark:border-zinc-700 hover:border-amber-400 dark:hover:border-amber-500/50 flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Already Registered? Sign In</span>
                </Link>
              </div>

              {/* Bottom Trust Indicators */}
              <div className="pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>256-Bit Encrypted QR</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Sub-Second Camera Scanning</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-yellow-500 shrink-0" />
                  <span>Zero Physical Hardware</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
