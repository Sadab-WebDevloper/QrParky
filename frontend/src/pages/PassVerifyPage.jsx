import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { PhoneCall, ShieldCheck, ShieldAlert, User, AlertCircle, AlertTriangle } from 'lucide-react';

export default function PassVerifyPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [data, setData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const verifyPass = async () => {
      if (!token) {
        setErrorMessage('Pass verification token missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await API.get(`/public/qr/verify/${encodeURIComponent(token)}`);
        if (isMounted) {
          if (res.data?.success && res.data?.valid) {
            setVerified(true);
            setData(res.data.data);
          } else {
            setVerified(false);
            setErrorMessage(res.data?.message || 'Access Denied: Pass is inactive.');
            if (res.data?.data) {
              setData(res.data.data);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setVerified(false);
          const errData = err.response?.data;
          setErrorMessage(
            errData?.message || 'Access Denied: Invalid, expired, or tampered QR code.'
          );
          if (errData?.data) {
            setData(errData.data);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifyPass();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const vehicleNumber = data?.vehicleNumber || '---';
  const ownerName = data?.ownerName || 'Resident Owner';
  const adminPhone = data?.adminPhone || '';

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-sm space-y-5">
        
        {/* Brand / Logo Header */}
        <div className="text-center space-y-1">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-zinc-950 font-black text-sm shadow-md shadow-amber-500/20 group-hover:scale-105 transition">
              QP
            </div>
            <span className="font-extrabold text-xl tracking-tight text-zinc-900 dark:text-white">
              QrParky
            </span>
          </Link>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Vehicle Pass Verification
          </p>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="glass-card p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center space-y-4 shadow-xl">
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
              Verifying pass...
            </p>
          </div>
        )}

        {/* Verified Active Pass Display */}
        {!loading && verified && (
          <div className="glass-card p-6 sm:p-7 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214] shadow-2xl space-y-6">
            
            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Verified Vehicle Pass</span>
            </div>

            {/* 1. Number Plate */}
            <div className="space-y-1.5 text-center">
              <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Vehicle Plate Number
              </span>
              
              {/* Indian HSRP License Plate Mockup */}
              <div className="py-3 px-4 rounded-xl bg-gradient-to-b from-zinc-50 to-zinc-100 border-2 border-zinc-900 dark:border-zinc-700 flex items-center justify-between shadow-inner">
                {/* IND blue strip */}
                <div className="flex flex-col items-center justify-center pr-3 border-r-2 border-zinc-300 dark:border-zinc-600 text-blue-700">
                  <span className="text-[9px] font-black leading-none">IND</span>
                  <div className="w-3 h-3 my-0.5 rounded-full border border-blue-600 flex items-center justify-center">
                    <span className="text-[5px] text-blue-600 font-bold">☸</span>
                  </div>
                </div>

                {/* Bold Registration Number */}
                <div className="flex-1 text-center font-mono font-black text-2xl sm:text-3xl tracking-widest text-zinc-950 uppercase select-all">
                  {vehicleNumber}
                </div>
              </div>
            </div>

            {/* 2. Car Owner Name */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-center space-y-1">
              <div className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>Owner Name</span>
              </div>
              <div className="text-lg font-black text-zinc-900 dark:text-white capitalize">
                {ownerName}
              </div>
            </div>

            {/* Validity Information */}
            <div className="py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>1-Year Official Permit</span>
              </span>
              <span className="font-mono text-zinc-500 dark:text-zinc-400 font-normal">
                {data?.expiresAt ? `Expires: ${new Date(data.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : `Valid: ${new Date().getFullYear()}–${new Date().getFullYear() + 1}`}
              </span>
            </div>

            {/* 3. Call Society Admin Button */}
            {adminPhone ? (
              <div className="space-y-2 pt-1">
                <a
                  href={`tel:${adminPhone}`}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition-all active:scale-95 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 animate-bounce" />
                  <span>Call Society Admin ({adminPhone})</span>
                </a>
                <p className="text-[11px] text-center text-zinc-600 dark:text-zinc-400">
                  Tap to call society admin for parking or movement issues
                </p>
              </div>
            ) : (
              <div className="text-center text-xs text-zinc-600 dark:text-zinc-400 py-2">
                Society Admin phone not configured
              </div>
            )}

          </div>
        )}

        {/* Invalid / Denied State */}
        {!loading && !verified && (() => {
          const isSuspended = errorMessage?.toLowerCase().includes('suspended') || !!data?.suspensionReason;
          return (
            <div className={`glass-card p-6 rounded-3xl border ${
              isSuspended 
                ? 'border-amber-400 dark:border-amber-600/50 bg-amber-500/5' 
                : 'border-red-300 dark:border-red-900/50'
            } bg-white dark:bg-[#121214] shadow-xl text-center space-y-4`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                isSuspended ? 'bg-amber-500/15 text-amber-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {isSuspended ? <AlertTriangle className="w-6 h-6 stroke-[2.5]" /> : <ShieldAlert className="w-6 h-6" />}
              </div>

              <div className="space-y-1">
                <h3 className={`text-base font-black ${
                  isSuspended ? 'text-amber-700 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {isSuspended ? 'Access Denied: Pass Suspended' : 'Invalid or Inactive Pass'}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                  {errorMessage}
                </p>
                {data?.suspensionReason && !errorMessage.includes(data.suspensionReason) && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    <strong>Reason:</strong> {data.suspensionReason}
                  </p>
                )}
              </div>

              {/* Show Number Plate & Admin Call button if available even if inactive */}
              {vehicleNumber !== '---' && (
                <div className="py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-mono font-bold text-sm text-zinc-800 dark:text-zinc-200">
                  Plate: {vehicleNumber}
                </div>
              )}

              {adminPhone && (
                <a
                  href={`tel:${adminPhone}`}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-xs shadow-md transition active:scale-95 ${
                    isSuspended ? 'bg-amber-600 hover:bg-amber-500' : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Society Admin ({adminPhone})</span>
                </a>
              )}

              <div className="pt-2">
                <Link
                  to="/"
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Go to QrParky Home
                </Link>
              </div>
            </div>
          );
        })()}

        {/* Footer */}
        <div className="text-center text-[10px] text-zinc-600 dark:text-zinc-400">
          QrParky &bull; Smart Resident Vehicle Access
        </div>

      </div>
    </div>
  );
}
