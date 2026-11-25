import React from 'react';
import { ShieldCheck, QrCode, Lock, LifeBuoy } from 'lucide-react';

export default function Footer({ onOpenHelp }) {
  const handleOpenHelp = () => {
    if (onOpenHelp) {
      onOpenHelp();
    } else {
      window.dispatchEvent(new CustomEvent('open-help-modal'));
    }
  };

  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#09090b] text-zinc-500 dark:text-zinc-400 py-10 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-zinc-950">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-zinc-900 dark:text-white text-base">QrParky</span>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Smart Society Vehicle & Access Management Platform</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-zinc-500 dark:text-zinc-400">
          {/* <button
            type="button"
            onClick={handleOpenHelp}
            className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
          >
            <LifeBuoy className="w-4 h-4" /> Help & Support
          </button> */}
          
          <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Bank-Grade Security
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">|</span>
          <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium">
            <Lock className="w-4 h-4 text-amber-500" /> Tamper-Proof QR
          </span>
          <span className="text-zinc-300 dark:text-zinc-600 hidden sm:inline">|</span>
          <span className="text-zinc-400 dark:text-zinc-500">© {new Date().getFullYear()} QrParky. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
