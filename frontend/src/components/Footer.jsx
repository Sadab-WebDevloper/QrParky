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
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#09090b] text-zinc-500 dark:text-zinc-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-0 md:h-20 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-zinc-950 shrink-0">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900 dark:text-white text-sm">QrParky</span>
            <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
            <p className="hidden sm:block text-[11px] text-zinc-400 dark:text-zinc-500">Smart Society Vehicle & Access Management</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Bank-Grade Security
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">|</span>
          <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 font-medium">
            <Lock className="w-3.5 h-3.5 text-amber-500" /> Tamper-Proof QR
          </span>
          <span className="text-zinc-300 dark:text-zinc-600 hidden sm:inline">|</span>
          <span className="text-zinc-400 dark:text-zinc-500">© {new Date().getFullYear()} QrParky. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
