import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown, 
  HelpCircle, 
  LogIn, 
  Zap, 
  Bike 
} from 'lucide-react';

// Lightweight, 60fps counting animation using requestAnimationFrame
function AnimatedCounter({ end, duration = 1800, decimals = 0, suffix = '', startTrigger = false }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startTrigger) return;
    let startTime = null;
    let animationFrame;

    // Smooth exponential ease-out curve
    const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const currentVal = easedProgress * end;

      setCount(currentVal);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, startTrigger]);

  const formatted = decimals > 0 
    ? count.toFixed(decimals) 
    : Math.floor(count).toLocaleString('en-IN');

  return <span>{formatted}{suffix}</span>;
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsSectionRef = useRef(null);

  // Trigger counters when stats section enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (statsSectionRef.current) {
      observer.observe(statsSectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // High-performance, zero-overhead fade-in on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-6');
            observer.unobserve(entry.target); // Unobserve once revealed to eliminate ongoing load
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.fade-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const faqs = [
    {
      q: "Does our society gate require any special scanners or physical hardware?",
      a: "No, zero physical hardware is required. Gate guards, committee members, and residents can use any standard smartphone camera or web browser to scan passes in sub-seconds. There are no expensive RFID boom barriers, cabling, or maintenance contracts to worry about."
    },
    {
      q: "How do residents register their vehicles and get their passes?",
      a: "Once your society is approved, the system generates a printable Security Gate Poster and an invite link. Admins can share this in the society's resident WhatsApp group. Residents open the link, enter their flat details and vehicle plate, upload RC proof, and complete payment directly from their phone."
    },
    {
      q: "How does a security guard verify a vehicle at the entrance?",
      a: "The guard opens the mobile scanner on their phone and scans the QR pass affixed to the vehicle windshield. Within 0.4 seconds, the screen displays a green verified badge, vehicle plate number, resident flat number, and owner name."
    },
    {
      q: "Can an unauthorized or visiting vehicle forge or reuse a QR pass?",
      a: "No. Each QR pass contains tamper-proof 256-bit encrypted metadata cryptographically bound to that exact vehicle plate and flat number. Guards immediately spot discrepancies between the physical license plate and the verified vehicle record."
    },
    {
      q: "How long does society approval and setup take?",
      a: "Society applications are typically reviewed and activated by our team within a few hours. Once approved, the admin dashboard, login credentials, and printable gate posters are instantly available for immediate resident onboarding."
    },
    {
      q: "How are vehicle pass fees collected and managed?",
      a: "Pass fees are ₹299 for 4-wheelers (cars) and ₹199 for 2-wheelers (bikes). Payments are processed securely online via Razorpay (supporting UPI, Google Pay, PhonePe, Paytm, cards, and netbanking). Society admins track all payments in real-time."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf9] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 scroll-smooth">
      {/* Hero Section (Fills full viewport so stats bar is below fold on initial load) */}
      <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex flex-col justify-center py-8 sm:py-10 lg:py-0">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] sm:w-[650px] h-[250px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[250px] sm:w-[350px] h-[200px] bg-yellow-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full my-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            
            {/* Left Column: Headlines & CTAs (Height matches right card with justify-between) */}
            <div className="lg:col-span-7 text-center lg:text-left flex flex-col justify-between py-1">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-3 w-fit mx-auto lg:mx-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                  <span>Next-Gen Society Vehicle Security</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-[2.65rem] font-extrabold tracking-tight text-zinc-900 dark:text-white mb-3.5 leading-snug sm:leading-snug lg:leading-[1.18]">
                  <span className="block">Smart, Encrypted</span>
                  <span className="block bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 dark:from-amber-300 dark:via-yellow-400 dark:to-amber-500 bg-clip-text text-transparent py-0.5">
                    Vehicle Access Passes
                  </span>
                  <span className="block">for Modern Societies</span>
                </h1>

                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 mb-5 max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal">
                  Eliminate unauthorized parking, manual logbooks, and forged stickers. QrParky provides automated resident onboarding, admin approvals, and tamper-proof QR vehicle windshield passes.
                </p>

                {/* Hero Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2.5 sm:gap-3 mb-4">
                  <Link
                    to="/apply-society"
                    className="h-10 px-5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 hover:opacity-95 active:scale-95 transition-all whitespace-nowrap group cursor-pointer"
                  >
                    <span>Onboard Your Society</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform shrink-0" />
                  </Link>

                  <Link
                    to="/login"
                    className="h-10 px-4.5 rounded-xl bg-white dark:bg-[#141417] hover:bg-zinc-100 dark:hover:bg-[#1f1f23] text-zinc-900 dark:text-white font-bold text-xs sm:text-sm border border-zinc-200 dark:border-zinc-800 hover:border-amber-400/60 dark:hover:border-amber-500/50 flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all whitespace-nowrap cursor-pointer"
                    title="Sign In to Resident / Admin Portal"
                  >
                    <LogIn className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Sign In to Portal</span>
                  </Link>
                </div>
              </div>

              {/* Left Column Bottom: Trust badges & Live strip */}
              <div className="pt-2">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-1.5 gap-x-4 text-[11px] text-zinc-500 dark:text-zinc-400 mb-3.5">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Instant QR Pass</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Tamper-Proof Encryption</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Zero Hardware Required</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-center lg:justify-start gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1 overflow-hidden">
                      <span className="inline-flex h-5 w-5 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-amber-500 text-zinc-950 font-black text-[8px] items-center justify-center">GP</span>
                      <span className="inline-flex h-5 w-5 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-yellow-500 text-zinc-950 font-black text-[8px] items-center justify-center">SH</span>
                      <span className="inline-flex h-5 w-5 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-emerald-500 text-zinc-950 font-black text-[8px] items-center justify-center">RK</span>
                    </div>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">100+ Gated Societies Protected</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                    <Zap className="w-3 h-3 fill-current" />
                    <span>0.4s Verification</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Digital Pass Card Preview (Stretched to match Left Height) */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex flex-col justify-center">
              <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[360px] h-full flex flex-col">
                
                {/* Decorative background aura */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-yellow-500/15 to-amber-600/20 blur-xl pointer-events-none" />

                {/* Digital Vehicle Pass UI Card */}
                <div className="relative rounded-2xl border border-amber-400/40 dark:border-amber-500/40 shadow-xl bg-white/95 dark:bg-[#121215] backdrop-blur-xl p-4 sm:p-5 overflow-hidden h-full flex flex-col justify-between">
                  
                  {/* Subtle Card Background Mesh */}
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />

                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 relative z-10 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-sm shrink-0">
                        <ShieldCheck className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-amber-600 dark:text-amber-400 tracking-wider uppercase flex items-center gap-1">
                          <span>VEHICLE PASS</span>
                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                          <span>SECURE</span>
                        </div>
                        <div className="text-xs font-bold text-zinc-900 dark:text-white tracking-tight leading-tight">Greenwood Palms CHS</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 text-[9px] font-extrabold shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ACTIVE
                    </span>
                  </div>

                  {/* QR Code Center Graphic */}
                  <div className="my-auto py-2.5 px-2.5 rounded-xl bg-gradient-to-b from-zinc-50 to-zinc-100/80 dark:from-[#18181c] dark:to-[#141416] border border-zinc-200 dark:border-zinc-800/80 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                    <div className="relative p-2 bg-white rounded-lg shadow-sm border border-zinc-200/80 dark:border-zinc-700/60 overflow-hidden">
                      {/* Laser Scan Line */}
                      <div className="absolute inset-x-1.5 h-0.5 bg-gradient-to-r from-transparent via-amber-500 dark:via-yellow-400 to-transparent shadow-[0_0_8px_#f59e0b] animate-laser-scan z-10 pointer-events-none" />

                      <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-500 rounded-tl-xs z-20" />
                      <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-500 rounded-tr-xs z-20" />
                      <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-500 rounded-bl-xs z-20" />
                      <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-500 rounded-br-xs z-20" />
                      
                      <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center relative">
                        <QrCode className="w-full h-full text-zinc-950 stroke-[1.8]" />
                      </div>
                    </div>

                    {/* Pass Cryptographic ID */}
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[9px] font-mono font-bold border border-amber-400/30">
                        QP-2026-GJ09-8821
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Plate & Member Info Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2.5 shrink-0">
                    
                    {/* License Plate Mockup */}
                    <div className="p-2 rounded-lg bg-zinc-50 dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800/90 flex flex-col justify-between">
                      <div className="text-zinc-500 dark:text-zinc-400 text-[8px] uppercase font-bold tracking-wider mb-0.5 flex items-center gap-1">
                        <Car className="w-2.5 h-2.5 text-amber-500" />
                        <span>Vehicle Number</span>
                      </div>
                      
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-800 dark:border-zinc-700 shadow-xs w-fit">
                        <span className="text-[6px] font-bold text-blue-600">IND</span>
                        <span className="text-[10px] font-black font-mono tracking-wider text-zinc-900 dark:text-white uppercase">
                          GJ 09 AB 1234
                        </span>
                      </div>

                      <div className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                        4-Wheeler (Car)
                      </div>
                    </div>

                    {/* Member & Flat Info */}
                    <div className="p-2 rounded-lg bg-zinc-50 dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800/90 flex flex-col justify-between">
                      <div className="text-zinc-500 dark:text-zinc-400 text-[8px] uppercase font-bold tracking-wider mb-0.5 flex items-center gap-1">
                        <Building2 className="w-2.5 h-2.5 text-amber-500" />
                        <span>Flat & Member</span>
                      </div>
                      
                      <div>
                        <div className="text-[11px] font-extrabold text-zinc-900 dark:text-white truncate">
                          A-402 • Sadab Mamu
                        </div>
                      </div>

                      <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Verified Resident</span>
                      </div>
                    </div>
                  </div>

                  {/* Windshield Validity Footer */}
                  <div className="p-2 px-2.5 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border border-amber-300/50 dark:border-amber-800/40 flex items-center justify-between text-[9px] text-amber-800 dark:text-amber-300 font-semibold shadow-2xs shrink-0">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Tamper-Proof Pass</span>
                    </span>
                    <span className="font-mono font-bold bg-amber-500/15 dark:bg-amber-400/10 px-1.5 py-0.2 rounded">
                      Valid: 2026–2027
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Social Proof / Metrics Section (Refined Compact Cards with Smooth Counting Animation) */}
      <section 
        ref={statsSectionRef}
        className="py-6 sm:py-8 bg-zinc-100/60 dark:bg-[#101012] border-y border-zinc-200 dark:border-zinc-800/80 transition-all duration-700 ease-out opacity-0 translate-y-6 fade-on-scroll"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 items-stretch">
            
            <div className="p-3 sm:p-4 rounded-xl glass-card border border-zinc-200 dark:border-zinc-800/80 flex flex-col items-center justify-center text-center shadow-xs hover:border-amber-400 dark:hover:border-amber-500/40 transition-all duration-200">
              <div className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent leading-none">
                <AnimatedCounter end={100} duration={1600} suffix="+" startTrigger={statsVisible} />
              </div>
              <div className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 font-semibold mt-1">
                Housing Societies
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl glass-card border border-zinc-200 dark:border-zinc-800/80 flex flex-col items-center justify-center text-center shadow-xs hover:border-amber-400 dark:hover:border-amber-500/40 transition-all duration-200">
              <div className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent leading-none">
                <AnimatedCounter end={25000} duration={1800} suffix="+" startTrigger={statsVisible} />
              </div>
              <div className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 font-semibold mt-1">
                Vehicles Managed
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl glass-card border border-zinc-200 dark:border-zinc-800/80 flex flex-col items-center justify-center text-center shadow-xs hover:border-amber-400 dark:hover:border-amber-500/40 transition-all duration-200">
              <div className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent leading-none">
                <AnimatedCounter end={99.9} duration={1700} decimals={1} suffix="%" startTrigger={statsVisible} />
              </div>
              <div className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 font-semibold mt-1">
                Pass Verification Rate
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl glass-card border border-zinc-200 dark:border-zinc-800/80 flex flex-col items-center justify-center text-center shadow-xs hover:border-amber-400 dark:hover:border-amber-500/40 transition-all duration-200">
              <div className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-500 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent leading-none">
                <AnimatedCounter end={100} duration={1600} suffix="%" startTrigger={statsVisible} />
              </div>
              <div className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 font-semibold mt-1">
                Paperless & Automated
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How it Works: 3 Simple Steps (Sleek Compact Cards) */}
      <section className="py-10 sm:py-14 bg-stone-50/50 dark:bg-[#09090b] relative transition-all duration-700 ease-out opacity-0 translate-y-6 fade-on-scroll">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800/50">
              Simple 3-Step Process
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-2.5 mb-1.5 tracking-tight">
              How QrParky Works For Your Society
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">
              Set up your society in minutes with zero hardware installation required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-stretch">
            
            {/* Step 1 */}
            <div className="h-full flex flex-col justify-between glass-card p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800/90 hover:border-amber-400 dark:hover:border-amber-500/50 transition-all duration-200 shadow-xs group">
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-xs mb-3 shadow-xs group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors">
                  1
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mb-1.5">Onboard Society</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed mb-3">
                  Committee members submit society details. Super Admin approves and automatically generates your Society Admin portal.
                </p>
              </div>
              <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center gap-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>2-Minute Digital Setup</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="h-full flex flex-col justify-between glass-card p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800/90 hover:border-amber-400 dark:hover:border-amber-500/50 transition-all duration-200 shadow-xs group">
              <div>
                <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-black text-xs mb-3 shadow-xs group-hover:bg-yellow-500 group-hover:text-zinc-950 transition-colors">
                  2
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mb-1.5">Invite Residents</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed mb-3">
                  Share your society invite link in resident WhatsApp groups. Members register their 2-wheelers and 4-wheelers directly.
                </p>
              </div>
              <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center gap-1.5 text-[10px] font-semibold text-yellow-600 dark:text-yellow-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Self-Service Resident Portal</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="h-full flex flex-col justify-between glass-card p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800/90 hover:border-amber-400 dark:hover:border-amber-500/50 transition-all duration-200 shadow-xs group">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xs mb-3 shadow-xs group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-colors">
                  3
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mb-1.5">Instant QR Pass</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed mb-3">
                  After society admin approval, high-resolution QR windshield stickers are instantly generated with cryptographic verification.
                </p>
              </div>
              <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Ready to Print or Scan</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Pillars: Everything Your Society Needs (Refined Grid) */}
      <section className="py-10 sm:py-14 bg-zinc-100/50 dark:bg-[#121214]/60 border-t border-zinc-200 dark:border-zinc-800 transition-all duration-700 ease-out opacity-0 translate-y-6 fade-on-scroll">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800/50">
              Complete Feature Suite
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-2.5 mb-1.5 tracking-tight">
              Everything Your Society Needs
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">
              Built specifically for residential housing complexes, gated apartments, and commercial towers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 items-stretch">
            
            {/* Box 1 */}
            <div className="h-full flex flex-col justify-between glass-card p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/90 hover:border-amber-400 dark:hover:border-amber-500/40 transition-all duration-200 shadow-xs group">
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shrink-0 shadow-xs group-hover:bg-amber-500/20 transition-colors">
                  <Shield className="w-4 h-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mb-1.5 leading-snug">Zero Unauthorized Parking</h4>
                <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Ensure every vehicle entering your premises is verified, registered, and linked to a verified flat owner.
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/50 text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Flat Verified
              </div>
            </div>

            {/* Box 2 */}
            <div className="h-full flex flex-col justify-between glass-card p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/90 hover:border-amber-400 dark:hover:border-amber-500/40 transition-all duration-200 shadow-xs group">
              <div>
                <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center mb-3 shrink-0 shadow-xs group-hover:bg-yellow-500/20 transition-colors">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mb-1.5 leading-snug">Automated Online Payments</h4>
                <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Collect vehicle sticker fees online via Razorpay. Automated receipts and real-time accounting for treasury.
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/50 text-[10px] font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Razorpay Integrated
              </div>
            </div>

            {/* Box 3 */}
            <div className="h-full flex flex-col justify-between glass-card p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/90 hover:border-amber-400 dark:hover:border-amber-500/40 transition-all duration-200 shadow-xs group">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shrink-0 shadow-xs group-hover:bg-emerald-500/20 transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mb-1.5 leading-snug">1-Click Admin Approvals</h4>
                <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Approve or reject resident applications, review uploaded RC documents, and manage slots from one dashboard.
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/50 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> RC Document Review
              </div>
            </div>

            {/* Box 4 */}
            <div className="h-full flex flex-col justify-between glass-card p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/90 hover:border-amber-400 dark:hover:border-amber-500/40 transition-all duration-200 shadow-xs group">
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shrink-0 shadow-xs group-hover:bg-amber-500/20 transition-colors">
                  <Clock className="w-4 h-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mb-1.5 leading-snug">Encrypted QR Verification</h4>
                <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Guards instantly scan windshield passes using standard smartphone cameras with sub-second encrypted verification.
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/50 text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sub-Second Scanning
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section: Smooth Accordion & Compact */}
      <section className="py-10 sm:py-14 bg-stone-50/50 dark:bg-[#09090b] relative border-t border-zinc-200 dark:border-zinc-800/80 transition-all duration-700 ease-out opacity-0 translate-y-6 fade-on-scroll">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-xl mx-auto mb-7 sm:mb-9">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800/50 inline-flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              <span>Got Questions?</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-2 mb-1 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">
              Everything you need to know about setting up and operating QrParky for your society.
            </p>
          </div>

          {/* Accordion List with Smooth CSS Grid Row Transition */}
          <div className="space-y-2.5 sm:space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-xl transition-all duration-200 border overflow-hidden ${
                    isOpen
                      ? 'bg-white dark:bg-[#141417] border-amber-400/70 dark:border-amber-500/50 shadow-sm shadow-amber-500/5'
                      : 'bg-white/80 dark:bg-[#121215]/80 border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-full p-3 sm:p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <span className="text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-white leading-snug">
                      {faq.q}
                    </span>
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-transform duration-300 ease-out ${
                        isOpen
                          ? 'bg-amber-500 text-zinc-950 rotate-180'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  {/* Smooth Animated Accordion Drawer */}
                  <div 
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-3 pb-3 sm:px-3.5 sm:pb-3.5 pt-1 text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/60 mt-0.5">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Still have questions banner */}
          <div className="mt-6 sm:mt-8 p-3 sm:p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center shrink-0 font-black text-xs">
                ?
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-white">Have a specific question about your society?</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Our team is happy to assist your managing committee.</div>
              </div>
            </div>
            <Link
              to="/apply-society"
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all shrink-0 active:scale-95 shadow-xs"
            >
              Contact & Apply →
            </Link>
          </div>

        </div>
      </section>

      {/* Redesigned Bottom CTA Banner — Sleek SaaS Card */}
      <section className="py-10 sm:py-14 relative overflow-hidden bg-[#fafaf9] dark:bg-[#09090b] transition-all duration-700 ease-out opacity-0 translate-y-6 fade-on-scroll">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 bg-gradient-to-b from-amber-50/90 via-white to-amber-100/40 dark:from-[#18181c] dark:via-[#131316] dark:to-[#0c0c0e] border border-amber-300/80 dark:border-amber-500/30 shadow-xl text-center overflow-hidden">
            
            {/* Ambient Lighting Gradients */}
            <div className="absolute top-0 right-1/4 w-48 h-48 bg-amber-500/15 blur-[70px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-10 left-1/4 w-56 h-56 bg-yellow-500/15 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-400/40 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Instant Society Setup • Zero Hardware</span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-900 dark:text-white mb-2.5 tracking-tight leading-tight">
                Ready to Upgrade Your Society's <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 dark:from-amber-300 dark:via-yellow-400 dark:to-amber-500 bg-clip-text text-transparent">
                  Vehicle Security?
                </span>
              </h2>

              <p className="text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm max-w-xl mx-auto mb-6 font-normal leading-relaxed">
                Join leading residential complexes protecting their gates with smart QR vehicle passes. Submit your society onboarding application in just 2 minutes.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 max-w-sm sm:max-w-none mx-auto mb-6">
                <Link
                  to="/apply-society"
                  className="h-10 px-5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 hover:opacity-95 active:scale-95 transition-all whitespace-nowrap group cursor-pointer"
                >
                  <span>Apply for Your Society Now</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>

                <Link
                  to="/login"
                  className="h-10 px-5 rounded-xl bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#222226] text-zinc-900 dark:text-white font-bold text-xs sm:text-sm border border-zinc-300 dark:border-zinc-700 hover:border-amber-400 dark:hover:border-amber-500/50 flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all whitespace-nowrap cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Already Registered? Sign In</span>
                </Link>
              </div>

              {/* Bottom Trust Indicators */}
              <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-center gap-y-1.5 gap-x-5 text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>256-Bit Encrypted QR</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Sub-Second Camera Scanning</span>
                </div>
                <div className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
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
