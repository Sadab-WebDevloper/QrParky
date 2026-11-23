import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { 
  Camera, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Car, 
  Building2, 
  Phone, 
  User, 
  Clock, 
  Volume2, 
  VolumeX, 
  FlipHorizontal, 
  Upload, 
  KeyRound, 
  ArrowLeft 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (rear) or 'user' (front)
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Verification states
  const [verifying, setVerifying] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { valid: bool, message: str, data: obj, rawToken: str }
  const [scanHistory, setScanHistory] = useState([]);

  // Manual Token Input State
  const [manualToken, setManualToken] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanningLoopRef = useRef(null);
  const fileInputRef = useRef(null);

  // Play synthetic verification beeps without external assets
  const playBeep = (isSuccess) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High pleasant A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime); // Low warning A3
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // AudioContext not supported or blocked
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setScanResult(null);

    // Stop any existing stream
    stopCamera();

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');

        // Wait for loadedmetadata to play cleanly without interruption
        video.onloadedmetadata = async () => {
          try {
            await video.play();
            setScanning(true);
            startDecodingLoop();
          } catch (playErr) {
            // AbortError happens when a new play/load request interrupts, which is safe to ignore
            if (playErr.name !== 'AbortError') {
              setCameraError(`Camera playback error: ${playErr.message}`);
            }
          }
        };
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : `Camera initialization error: ${err.message}`
      );
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (scanningLoopRef.current) {
      cancelAnimationFrame(scanningLoopRef.current);
      scanningLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = null;
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  // Switch between front and rear cameras
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Continuous frame scanning loop using BarcodeDetector
  const startDecodingLoop = () => {
    if (!('BarcodeDetector' in window)) {
      // BarcodeDetector not natively available in this specific browser
      return;
    }

    const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });

    const detectFrame = async () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue && !verifying) {
              handleTokenScanned(rawValue);
              return; // Stop detection loop until user resets
            }
          }
        } catch (e) {
          // Frame decode skip
        }
      }
      scanningLoopRef.current = requestAnimationFrame(detectFrame);
    };

    scanningLoopRef.current = requestAnimationFrame(detectFrame);
  };

  // Verify scanned QR Token against Backend API
  const handleTokenScanned = async (tokenString) => {
    if (verifying) return;
    setVerifying(true);
    stopCamera();

    // Clean token string (extract token if it's a full verification URL)
    let token = tokenString.trim();
    if (token.includes('/verify/')) {
      token = token.split('/verify/').pop();
    }

    try {
      const res = await API.get(`/public/qr/verify/${encodeURIComponent(token)}`);
      
      const resultData = {
        valid: res.data.valid,
        message: res.data.message || 'ACCESS GRANTED',
        data: res.data.data,
        rawToken: token,
        timestamp: new Date().toLocaleTimeString(),
      };

      playBeep(true);
      setScanResult(resultData);
      setScanHistory((prev) => [resultData, ...prev.slice(0, 9)]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'ACCESS DENIED. Invalid or tampered QR pass.';
      const resultData = {
        valid: false,
        message: errMsg,
        data: null,
        rawToken: token,
        timestamp: new Date().toLocaleTimeString(),
      };

      playBeep(false);
      setScanResult(resultData);
      setScanHistory((prev) => [resultData, ...prev.slice(0, 9)]);
    } finally {
      setVerifying(false);
    }
  };

  // Image Upload Scanner Fallback
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!('BarcodeDetector' in window)) {
      alert('Photo QR scanning requires native BarcodeDetector or manual token entry.');
      return;
    }

    try {
      const imageBitmap = await createImageBitmap(file);
      const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const barcodes = await barcodeDetector.detect(imageBitmap);

      if (barcodes && barcodes.length > 0) {
        handleTokenScanned(barcodes[0].rawValue);
      } else {
        alert('No readable QR code found in this photo. Please try a clearer picture.');
      }
    } catch (err) {
      alert(`Photo scanning failed: ${err.message}`);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    startCamera();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      
      {/* Guard Header Bar */}
      <div className="bg-[#121214] border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-black uppercase tracking-wider">
              <Camera className="w-3.5 h-3.5" /> Gate Security Pass Scanner
            </div>
            <h1 className="text-base sm:text-lg font-extrabold text-white leading-tight">Live Vehicle Pass Verification</h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white transition"
            title={soundEnabled ? 'Mute Scan Sound' : 'Unmute Scan Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          <button
            onClick={toggleFacingMode}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white transition"
            title="Flip Camera (Front/Rear)"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Scanner Container */}
      <div className="flex-1 max-w-xl w-full mx-auto p-4 flex flex-col justify-center">
        
        {/* Verification Result Card (When Pass Scanned) */}
        {scanResult ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            <div className={`p-6 rounded-3xl border text-center shadow-2xl ${
              scanResult.valid
                ? 'bg-gradient-to-b from-emerald-950/80 to-[#121214] border-emerald-500/60 shadow-emerald-500/10'
                : 'bg-gradient-to-b from-rose-950/80 to-[#121214] border-rose-500/60 shadow-rose-500/10'
            }`}>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest mb-4 border shadow-sm">
                {scanResult.valid ? (
                  <span className="text-emerald-400 bg-emerald-950/90 border-emerald-500 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> ACCESS GRANTED
                  </span>
                ) : (
                  <span className="text-rose-400 bg-rose-950/90 border-rose-500 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> ACCESS DENIED
                  </span>
                )}
              </div>

              {/* Vehicle Number Big Display */}
              {scanResult.valid && scanResult.data ? (
                <>
                  <div className="text-3xl sm:text-4xl font-mono font-black text-white tracking-widest mb-1">
                    {scanResult.data.vehicleNumber}
                  </div>
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-6">
                    Verified {scanResult.data.vehicleType}
                  </div>

                  {/* Metadata Table */}
                  <div className="bg-[#18181b]/90 rounded-2xl p-4 border border-zinc-800 text-left text-xs space-y-2.5 mb-6">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" /> Society:
                      </span>
                      <span className="font-bold text-white text-right">{scanResult.data.societyName}</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-400" /> Resident Owner:
                      </span>
                      <span className="font-bold text-white text-right">{scanResult.data.ownerName}</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-400" /> Emergency Phone:
                      </span>
                      <a href={`tel:${scanResult.data.ownerPhone}`} className="font-mono font-bold text-amber-400 text-right hover:underline">
                        {scanResult.data.ownerPhone}
                      </a>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Pass Issued:
                      </span>
                      <span className="text-zinc-300 font-mono text-[11px] text-right">
                        {new Date(scanResult.data.issuedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-6 space-y-3">
                  <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
                  <p className="text-sm font-bold text-rose-300 max-w-sm mx-auto">
                    {scanResult.message}
                  </p>
                  <p className="text-xs text-zinc-500">
                    This vehicle pass does not have active authorization. Do NOT open the barrier gate.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <button
                onClick={resetScanner}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 font-black text-sm hover:opacity-95 shadow-xl shadow-amber-500/20 active:scale-[0.99] transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Scan Next Vehicle Pass
              </button>
            </div>

          </div>
        ) : (
          /* Live Camera Viewfinder Box */
          <div className="space-y-4">
            
            <div className="relative rounded-3xl overflow-hidden border-2 border-zinc-800 bg-[#121214] aspect-[4/3] sm:aspect-square flex items-center justify-center shadow-2xl">
              
              {/* Video Element */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />

              {/* Target Scan Frame Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="relative w-64 h-64 border-2 border-amber-400/80 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] flex flex-col justify-between p-3">
                  
                  {/* Glowing Laser Scan Beam */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-bounce" />

                  {/* Corner accents */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-400 rounded-tl-lg" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-400 rounded-tr-lg" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-400 rounded-bl-lg" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-400 rounded-br-lg" />
                  
                  <div className="text-[10px] font-bold text-amber-300 text-center tracking-wider uppercase bg-black/60 py-0.5 rounded-full">
                    Align Windshield QR Pass
                  </div>
                </div>
              </div>

              {/* Fallback if Camera Permission Denied or Failed */}
              {cameraError && (
                <div className="absolute inset-0 bg-[#121214]/95 p-6 flex flex-col items-center justify-center text-center space-y-4">
                  <ShieldAlert className="w-12 h-12 text-rose-500" />
                  <div className="text-sm font-bold text-white max-w-xs">{cameraError}</div>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs"
                  >
                    Retry Camera
                  </button>
                </div>
              )}

              {/* Status Indicator */}
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Camera Live</span>
              </div>
            </div>

            {/* Quick Actions (Upload Image & Manual Token) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 text-amber-400" /> Scan Photo File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-amber-400" /> Enter Token Key
              </button>
            </div>

            {/* Manual Token Verification Drawer */}
            {showManualInput && (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Manual AES Token Key / Cipher Text
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="iv:authTag:cipherText"
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => manualToken && handleTokenScanned(manualToken)}
                    disabled={!manualToken}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-zinc-950 font-bold text-xs hover:opacity-95 disabled:opacity-40"
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Guard Gate Shift Log (Last 10 Scans) */}
        {scanHistory.length > 0 && (
          <div className="mt-6 bg-[#121214] rounded-2xl p-4 border border-zinc-800">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center justify-between">
              <span>Gate Shift Scan History</span>
              <span className="font-mono text-zinc-400">{scanHistory.length} logs</span>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {scanHistory.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 text-xs font-mono border border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    {item.valid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span className="font-bold text-white">{item.data?.vehicleNumber || 'INVALID PASS'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                    <span>{item.data?.societyName || 'Unregistered'}</span>
                    <span className="text-zinc-500">{item.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
