import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { 
  Car, 
  Plus, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Download, 
  FileText, 
  ShieldCheck, 
  Building2, 
  Bike, 
  Sparkles, 
  Printer,
  Lock,
  CreditCard,
  AlertCircle
} from 'lucide-react';

export default function MemberDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Vehicle Registration Modal & Form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('4wheeler');
  const [registering, setRegistering] = useState(false);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [documentName, setDocumentName] = useState('');

  // QR Pass Modal State
  const [activeQRData, setActiveQRData] = useState(null);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await API.get('/member/vehicles');
      if (res.data.success) {
        setVehicles(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load member vehicles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

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

  const handleRegisterVehicle = async (e) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const res = await API.post('/member/vehicles', {
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        vehicleType,
        passType: 'regular',
        documents: documentPreview ? [documentPreview] : [],
      });

      if (res.data.success) {
        toast.success('Vehicle registered! Pass will activate upon Society Admin approval.');
        setVehicleNumber('');
        setVehicleType('4wheeler');
        setDocumentPreview(null);
        setDocumentName('');
        setIsAddOpen(false);
        fetchVehicles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register vehicle.');
    } finally {
      setRegistering(false);
    }
  };

  const handleViewQR = async (vehicleId) => {
    try {
      const res = await API.get(`/member/vehicles/${vehicleId}/qr`);
      if (res.data.success) {
        setActiveQRData(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot access QR Code vault.');
    }
  };

  // Razorpay SDK Loader
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Payment Handler for ₹299 Pass Fee using Official Razorpay Checkout
  const handleInitiatePayment = async (vehicleId) => {
    try {
      setPaymentLoading(true);

      const isLoaded = await loadRazorpay();
      if (!isLoaded || !window.Razorpay) {
        toast.error('Unable to load Razorpay payment gateway. Please disable ad-blockers or check your connection.');
        setPaymentLoading(false);
        return;
      }

      const idempotencyKey = `pay_${vehicleId}_${Date.now()}`;
      const res = await API.post('/member/orders', {
        vehicleIds: [vehicleId],
        idempotencyKey,
      });

      if (!res.data?.success) {
        toast.error(res.data?.message || 'Failed to initialize payment order.');
        setPaymentLoading(false);
        return;
      }

      const orderData = res.data.data;

      // Configure Official Razorpay Checkout Modal Options
      const options = {
        key: orderData.keyId || 'rzp_test_U2RwL6i1AZ9RIK',
        amount: orderData.amount, // in paise: 29900
        currency: orderData.currency || 'INR',
        name: 'QrParky',
        description: `Official Windshield QR Pass (${activeQRData?.vehicleNumber || 'Vehicle'})`,
        image: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QrParky',
        order_id: orderData.razorpayOrderId.startsWith('order_mock_') ? undefined : orderData.razorpayOrderId,
        handler: async function (response) {
          try {
            setPaymentLoading(true);
            const verifyRes = await API.post('/webhooks/razorpay', {
              razorpay_order_id: response.razorpay_order_id || orderData.razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data?.success) {
              toast.success('Payment of ₹299 successful! Official windshield pass unlocked.');
              await fetchVehicles();
              await handleViewQR(vehicleId);
            } else {
              toast.error(verifyRes.data?.message || 'Payment verification failed.');
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification error.');
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        notes: {
          vehicleId: String(vehicleId),
          vehicleNumber: activeQRData?.vehicleNumber || '',
          societyName: activeQRData?.societyName || '',
        },
        theme: {
          color: '#f59e0b', // Brand amber/gold
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
            toast.info('Payment checkout closed.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (failResp) {
        setPaymentLoading(false);
        toast.error(`Payment failed: ${failResp.error?.description || 'Transaction declined'}`);
      });

      // Open Official Razorpay Checkout Popup
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate Razorpay checkout.');
      setPaymentLoading(false);
    }
  };

  // Dedicated Vehicle Pass Sticker Printer (Isolates print exclusively to windshield sticker)
  const handlePrintPass = () => {
    if (!activeQRData) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const pri = iframe.contentWindow;
    pri.document.open();
    pri.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QrParky Pass - ${activeQRData.vehicleNumber}</title>
          <style>
            @page {
              size: auto;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
            }
            .pass-card {
              width: 320px;
              border: 2px dashed #f59e0b;
              border-radius: 20px;
              padding: 20px;
              text-align: center;
              background: #fff;
            }
            .pass-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 10px;
              margin-bottom: 12px;
            }
            .soc-name {
              font-size: 13px;
              font-weight: 800;
              color: #111827;
              text-align: left;
            }
            .active-badge {
              font-size: 10px;
              font-weight: 800;
              color: #047857;
              background: #ecfdf5;
              border: 1px solid #a7f3d0;
              padding: 2px 8px;
              border-radius: 9999px;
            }
            .qr-box {
              padding: 10px;
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              display: inline-block;
              margin-bottom: 12px;
            }
            .qr-box img {
              width: 170px;
              height: 170px;
              display: block;
            }
            .veh-num {
              font-family: monospace;
              font-size: 20px;
              font-weight: 900;
              letter-spacing: 1px;
              color: #111827;
              margin-bottom: 4px;
            }
            .owner-name {
              font-size: 11px;
              color: #6b7280;
              margin-bottom: 12px;
            }
            .pass-footer {
              border-top: 1px solid #e5e7eb;
              padding-top: 8px;
              font-size: 10px;
              color: #9ca3af;
              display: flex;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          <div class="pass-card">
            <div class="pass-header">
              <div class="soc-name">📍 ${activeQRData.societyName || 'Society Pass'}</div>
              <div class="active-badge">● ACTIVE PASS</div>
            </div>
            <div class="qr-box">
              <img id="qr-img" src="${activeQRData.qrImageUrl}" alt="Vehicle QR Pass" />
            </div>
            <div class="veh-num">${activeQRData.vehicleNumber}</div>
            <div class="owner-name">${user?.name || 'Resident'} • Windshield Permit</div>
            <div class="pass-footer">
              <span>🛡️ Tamper-Proof</span>
              <span>Valid: ${new Date().getFullYear()}–${new Date().getFullYear() + 1}</span>
            </div>
          </div>
        </body>
      </html>
    `);
    pri.document.close();

    const img = pri.document.getElementById('qr-img');
    const triggerPrint = () => {
      pri.focus();
      pri.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    };

    if (img && !img.complete) {
      img.onload = triggerPrint;
      img.onerror = triggerPrint;
    } else {
      setTimeout(triggerPrint, 300);
    }
  };

  const activeVehicles = vehicles.filter((v) => v.status === 'active');
  const awaitingPaymentVehicles = vehicles.filter((v) => v.status === 'awaiting_payment');
  const pendingVehicles = vehicles.filter((v) => v.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>{user?.societyName || 'Resident Portal'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            My Vehicles & Passes
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your registered flat vehicles, windshield QR access stickers, and entry permits.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs sm:text-sm hover:opacity-95 shadow-md shadow-amber-500/20 active:scale-[0.99] transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Overview Stat Cards (Consistent compact & balanced sizing) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
        <div className="glass-card p-3 sm:p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Vehicles</span>
            <Car className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">{vehicles.length}</div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Registered in flat</div>
        </div>

        <div className="glass-card p-3 sm:p-3.5 rounded-xl border border-emerald-300/60 dark:border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Active QR Passes</span>
            <QrCode className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeVehicles.length}</div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400/90 font-semibold mt-0.5">Ready to scan</div>
        </div>

        <div className="glass-card p-3 sm:p-3.5 rounded-xl border border-amber-300/60 dark:border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Fee Pending</span>
            <Lock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{awaitingPaymentVehicles.length}</div>
          <div className="text-[10px] text-amber-700 dark:text-amber-400/90 font-semibold mt-0.5">₹299 fee to unlock</div>
        </div>

        <div className="glass-card p-3 sm:p-3.5 rounded-xl border border-yellow-300/60 dark:border-yellow-500/30 bg-yellow-50/20 dark:bg-yellow-950/10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider">Under Review</span>
            <Clock className="w-3.5 h-3.5 text-yellow-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-yellow-600 dark:text-yellow-400">{pendingVehicles.length}</div>
          <div className="text-[10px] text-yellow-700 dark:text-yellow-400/90 font-semibold mt-0.5">Awaiting committee</div>
        </div>
      </div>

      {/* Vehicles Grid / Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
            Vehicle Pass List ({vehicles.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-sm animate-pulse glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800">
            Loading registered vehicles...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="p-10 sm:p-14 text-center glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#121214]">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">No vehicles registered yet</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-5 leading-relaxed">
              Add your car or two-wheeler to generate your society-verified windshield QR access pass.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 font-bold text-xs hover:opacity-95 shadow-md shadow-amber-500/20 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Register Your First Vehicle</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <div 
                key={v.id} 
                className="glass-card p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#121214] shadow-sm hover:border-amber-400 dark:hover:border-amber-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: Type & Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        {v.vehicleType === '2wheeler' ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white capitalize">
                          {v.vehicleType === '2wheeler' ? '2-Wheeler (Bike)' : '4-Wheeler (Car)'}
                        </span>
                        <div className="text-[10px] text-zinc-400">Society Pass</div>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      v.status === 'active' 
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60' 
                        : v.status === 'awaiting_payment'
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60'
                        : v.status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-950/80 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800/60'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                    }`}>
                      {v.status === 'active' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      {v.status === 'awaiting_payment' && <Lock className="w-3 h-3 text-amber-500" />}
                      {v.status === 'pending' && <Clock className="w-3 h-3 text-yellow-500" />}
                      {v.status === 'rejected' && <XCircle className="w-3 h-3 text-rose-500" />}
                      <span>
                        {v.status === 'active' ? 'Active Pass' : 
                         v.status === 'awaiting_payment' ? 'Fee Pending (₹299)' :
                         v.status === 'pending' ? 'Under Review' : 'Rejected'}
                      </span>
                    </span>
                  </div>

                  {/* Indian License Plate Mockup */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border-2 border-zinc-800 dark:border-zinc-700 shadow-sm mb-4">
                    <div className="flex flex-col items-center justify-center leading-none pr-1.5 border-r border-zinc-300 dark:border-zinc-700 text-[8px] font-black text-blue-700 dark:text-blue-400">
                      <span>🇮🇳</span>
                      <span className="text-[6px] tracking-tighter mt-0.5 font-bold">IND</span>
                    </div>
                    <span className="text-sm font-black font-mono tracking-wider text-zinc-900 dark:text-white uppercase">
                      {v.vehicleNumber}
                    </span>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/70">
                  {v.status === 'active' ? (
                    <button
                      type="button"
                      onClick={() => handleViewQR(v.id)}
                      className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 hover:opacity-95 transition cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 stroke-[2.5]" />
                      <span>View & Print QR Pass</span>
                    </button>
                  ) : v.status === 'awaiting_payment' ? (
                    <button
                      type="button"
                      onClick={() => handleViewQR(v.id)}
                      className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-amber-500/15 border border-amber-400/80 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-500/25 transition cursor-pointer shadow-sm"
                    >
                      <Lock className="w-4 h-4 text-amber-500" />
                      <span>Unlock Pass (Pay ₹299)</span>
                    </button>
                  ) : v.status === 'pending' ? (
                    <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-400/20 text-center text-[11px] text-yellow-700 dark:text-yellow-400 font-medium">
                      Verification in progress by Committee
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-400/20 text-center text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      Application rejected. Contact Admin.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Register New Vehicle */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Vehicle For Pass">
        <form onSubmit={handleRegisterVehicle} className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/20 text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Passes are free for verified society residents and activate after admin review.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Vehicle Registration Number (License Plate)
            </label>
            <input
              type="text"
              required
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="e.g. GJ09AB1234"
              maxLength={12}
              style={{ textTransform: 'uppercase' }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-sm font-mono font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Vehicle Type
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setVehicleType('4wheeler')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                  vehicleType === '4wheeler'
                    ? 'bg-amber-500/15 border-amber-400 text-amber-700 dark:text-amber-400 shadow-sm'
                    : 'bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>4-Wheeler (Car)</span>
              </button>

              <button
                type="button"
                onClick={() => setVehicleType('2wheeler')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                  vehicleType === '2wheeler'
                    ? 'bg-amber-500/15 border-amber-400 text-amber-700 dark:text-amber-400 shadow-sm'
                    : 'bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>2-Wheeler (Bike)</span>
              </button>
            </div>
          </div>

          {/* RC / Vehicle Document Upload */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Vehicle RC Certificate / Photo <span className="text-zinc-400 font-normal">(Optional)</span>
            </label>
            <div className="flex items-center gap-2.5">
              <label className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 bg-zinc-50 dark:bg-[#18181b] cursor-pointer text-xs text-zinc-600 dark:text-zinc-300 transition">
                <FileText className="w-4 h-4 text-amber-500" />
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
                  className="px-3 py-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-bold cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={registering}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs sm:text-sm hover:opacity-95 shadow-md shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {registering ? 'Submitting Application...' : 'Submit Vehicle for Approval'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Official Digital QR Windshield Pass */}
      <Modal isOpen={!!activeQRData} onClose={() => setActiveQRData(null)} title="Official Society Vehicle Pass">
        {activeQRData && (
          <div className="space-y-4 text-center">
            
            {/* Digital Pass Card */}
            <div className="relative rounded-3xl p-5 bg-gradient-to-b from-white via-zinc-50 to-zinc-100 dark:from-[#18181c] dark:via-[#141416] dark:to-[#101012] border border-amber-400/50 dark:border-amber-500/40 shadow-xl overflow-hidden">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-zinc-950 shadow-sm">
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="text-left">
                    <div className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      OFFICIAL PERMIT
                    </div>
                    <div className="text-xs font-extrabold text-zinc-900 dark:text-white truncate max-w-[170px]">
                      {activeQRData.societyName || 'Society Vehicle Pass'}
                    </div>
                  </div>
                </div>

                {activeQRData.isLocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 text-[10px] font-black">
                    <Lock className="w-3 h-3 text-amber-500" />
                    LOCKED (FEE: ₹299)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 text-[10px] font-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ACTIVE
                  </span>
                )}
              </div>

              {/* QR Code Graphic Frame with Scanner Reticle */}
              <div 
                className="my-4 p-4 rounded-2xl bg-zinc-50 dark:bg-[#1b1b20] border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center relative select-none"
                onContextMenu={(e) => e.preventDefault()}
              >
                <div 
                  className="relative p-2.5 bg-white rounded-xl shadow-md border border-zinc-200 overflow-hidden"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-500 rounded-tl-xs z-10" />
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-500 rounded-tr-xs z-10" />
                  <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-500 rounded-bl-xs z-10" />
                  <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-500 rounded-br-xs z-10" />

                  <img 
                    src={activeQRData.qrImageUrl} 
                    alt={`Pass QR Code ${activeQRData.vehicleNumber}`} 
                    className={`w-36 h-36 object-contain transition-all duration-300 ${
                      activeQRData.isLocked ? 'filter blur-[14px] opacity-40 select-none pointer-events-none' : ''
                    }`}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />

                  {/* Anti-screenshot & Locked Overlay */}
                  {activeQRData.isLocked && (
                    <div 
                      className="absolute inset-0 bg-zinc-950/65 backdrop-blur-[2px] flex flex-col items-center justify-center p-2 text-center select-none"
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center mb-1.5 text-zinc-950 shadow-lg shadow-amber-500/30 animate-pulse">
                        <Lock className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                        QR BLURRED
                      </span>
                      <span className="text-[9px] font-bold text-zinc-300 mt-0.5">
                        Screenshot Disabled • Unscannable
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-2.5 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-400/20 flex items-center justify-center gap-1.5">
                  {activeQRData.isLocked ? (
                    <>
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>PASS FEE REQUIRED: ₹299</span>
                    </>
                  ) : (
                    <span>PASS ID: QP-{new Date().getFullYear()}-{activeQRData.vehicleNumber}</span>
                  )}
                </div>
              </div>

              {/* Vehicle Number & Info */}
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs mb-2">
                <div className="text-left">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">Vehicle Plate</div>
                  <div className="font-mono font-black text-sm text-zinc-900 dark:text-white uppercase">
                    {activeQRData.vehicleNumber}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">Resident</div>
                  <div className="font-bold text-xs text-zinc-900 dark:text-white">
                    {user?.name || 'Verified Flat Owner'}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center justify-between pt-1">
                <span>🛡️ Tamper-Proof Windshield Pass</span>
                <span>Valid: {new Date().getFullYear()}–{new Date().getFullYear() + 1}</span>
              </div>
            </div>

            {/* Print & Download Actions or Pay Fee Button */}
            {activeQRData.isLocked ? (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleInitiatePayment(activeQRData.vehicleId)}
                  disabled={paymentLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-black text-xs sm:text-sm hover:opacity-95 shadow-lg shadow-amber-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4 stroke-[2.5]" />
                  <span>{paymentLoading ? 'Processing Checkout...' : 'Pay Pass Fee ₹299 & Download Official Pass'}</span>
                </button>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  🔒 One-time sticker fee • Removes blur and enables instant print & download
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={activeQRData.qrImageUrl}
                  download={`QRParky_Pass_${activeQRData.vehicleNumber}.png`}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs hover:opacity-95 shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save Sticker</span>
                </a>

                <button
                  type="button"
                  onClick={handlePrintPass}
                  className="py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sticker</span>
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
}
