import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  AlertTriangle,
  Search,
  X,
  Filter,
  ChevronDown,
  Check
} from 'lucide-react';

export default function MemberDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'awaiting_payment', 'pending'
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  // Vehicle Registration Modal & Form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('4wheeler');
  const [registering, setRegistering] = useState(false);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [documentName, setDocumentName] = useState('');

  // QR Pass Modal State
  const [activeQRData, setActiveQRData] = useState(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
    const isValid = allowedTypes.includes(file.type?.toLowerCase()) || ['jpg', 'jpeg', 'png'].includes(ext);

    if (!isValid) {
      toast.error('Only JPG and PNG images are allowed.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be 5MB or less.');
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

  // Payment Handler for Pass Fees (₹299 for 4-Wheeler / ₹199 for 2-Wheeler) using Official Razorpay Checkout
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
        amount: orderData.amount, // in paise
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
              toast.success('Payment successful! Official windshield pass unlocked.');
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

  const filteredVehicles = vehicles.filter((v) => {
    const matchesFilter =
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? v.status === 'active' :
      statusFilter === 'suspended' ? (v.status === 'suspended' || (v.status === 'expired' && v.qrCode)) :
      statusFilter === 'awaiting_payment' ? v.status === 'awaiting_payment' :
      statusFilter === 'pending' ? v.status === 'pending' :
      v.status === statusFilter;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      v.vehicleNumber?.toLowerCase().includes(query) ||
      v.vehicleType?.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.avatar ? (
            <img src={user.avatar} alt={user?.name || 'Resident'} className="w-10 h-10 rounded-xl object-cover border border-amber-500/40 shadow-sm shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-zinc-950 font-black text-sm shadow-sm shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
              <Building2 className="w-3 h-3" />
              <span>{user?.societyName || 'Resident Portal'}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
              {user?.name ? `${user.name}` : 'Resident Member Dashboard'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="h-8 px-3 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs hover:opacity-95 shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Stats Grid — Compact low-profile cards matching Super Admin & Society Admin */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        
        {/* Total Vehicles Card */}
        <div 
          onClick={() => setStatusFilter('all')}
          className="p-2.5 sm:p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#121214] glass-card glass-card-hover transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Vehicles</span>
            <div className="w-6.5 h-6.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Car className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
              {vehicles.length}
            </div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
              Registered in flat
            </div>
          </div>
        </div>

        {/* Active Passes Card */}
        <div 
          onClick={() => setStatusFilter('active')}
          className="p-2.5 sm:p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#121214] glass-card glass-card-hover transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Active Passes</span>
            <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <QrCode className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
              {activeVehicles.length}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>Ready to scan</span>
            </div>
          </div>
        </div>

        {/* Fee Pending Card */}
        <div 
          onClick={() => setStatusFilter('awaiting_payment')}
          className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer glass-card glass-card-hover ${
            awaitingPaymentVehicles.length > 0 
              ? 'border-amber-400/70 dark:border-amber-500/40 bg-amber-50/25 dark:bg-amber-950/20 shadow-sm' 
              : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#121214]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Fee Pending</span>
            <div className="w-6.5 h-6.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight leading-none">
              {awaitingPaymentVehicles.length}
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
              {awaitingPaymentVehicles.length > 0 ? 'Fee to unlock' : 'No dues'}
            </div>
          </div>
        </div>

        {/* Under Review Card */}
        <div 
          onClick={() => setStatusFilter('pending')}
          className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer glass-card glass-card-hover ${
            pendingVehicles.length > 0 
              ? 'border-yellow-400/70 dark:border-yellow-500/40 bg-yellow-50/25 dark:bg-yellow-950/20 shadow-sm' 
              : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#121214]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider">Under Review</span>
            <div className="w-6.5 h-6.5 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-xl sm:text-2xl font-black text-yellow-600 dark:text-yellow-400 tracking-tight leading-none">
              {pendingVehicles.length}
            </div>
            <div className="text-[10px] text-yellow-600 dark:text-yellow-400 font-semibold">
              {pendingVehicles.length > 0 ? 'Awaiting committee' : 'All approved'}
            </div>
          </div>
        </div>

      </div>

      {/* Main Vehicle Passes Card */}
      <div className="animate-tab-pane glass-card rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214] relative z-10 shadow-sm flex flex-col overflow-visible">
        
        {/* Table Card Toolbar: Full Width Search & Status Filter */}
        <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-[#151518]/60 flex items-center justify-between gap-2.5 rounded-t-2xl overflow-visible">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by license plate or vehicle type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-8 rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-amber-500 transition shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Custom Dropdown: Vehicle Status Filter */}
          <div className="relative z-30 shrink-0" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              className="h-8 flex items-center justify-between gap-1.5 px-2.5 rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700/80 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-amber-400 dark:hover:border-amber-500/50 transition cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-1">
                <Filter className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="text-zinc-400 text-[11px]">Status:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 capitalize text-xs">
                  {statusFilter === 'all' ? 'All' :
                   statusFilter === 'active' ? 'Active' :
                   statusFilter === 'suspended' ? 'Suspended' :
                   statusFilter === 'awaiting_payment' ? 'Fee Pending' :
                   'Under Review'}
                </span>
              </div>
              <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {statusDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-1 z-40 animate-dropdown">
                {[
                  { value: 'all', label: 'All Vehicles' },
                  { value: 'active', label: 'Active Passes' },
                  { value: 'suspended', label: 'Suspended Passes' },
                  { value: 'awaiting_payment', label: 'Fee Pending' },
                  { value: 'pending', label: 'Under Review' },
                ].map((opt) => {
                  const isSelected = statusFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setStatusDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 text-left rounded-lg text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-amber-600 dark:hover:text-amber-400'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-amber-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Content State: Loading, Empty, or Table/Card views */}
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading registered vehicles...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2.5 shadow-sm">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">No vehicles registered yet</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4 leading-relaxed">
              Register your car or two-wheeler to generate your official society-verified windshield QR access pass.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="h-8 px-4 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs hover:opacity-95 shadow-sm inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Register Your First Vehicle</span>
            </button>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
            <Car className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mx-auto mb-1.5" />
            No vehicles match your search or filter.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
                <thead className="bg-zinc-50/80 dark:bg-[#161619] text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-4 py-2">Vehicle Plate</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Permit Details</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60">
                  {filteredVehicles.map((v) => {
                    const isActive = v.status === 'active';
                    const isSuspended = v.status === 'suspended' || (v.status === 'expired' && v.qrCode);
                    const isAwaitingPayment = v.status === 'awaiting_payment';
                    const isPending = v.status === 'pending';

                    return (
                      <tr key={v.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#18181b]/50 transition-colors">
                        {/* Vehicle Plate */}
                        <td className="px-4 py-2">
                          <div className="inline-flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-0.5 shadow-2xs">
                            <span className="text-[7px] font-black text-blue-600 mr-1">IND</span>
                            <span className="font-mono font-black text-zinc-950 dark:text-amber-400 text-xs uppercase tracking-wider">
                              {v.vehicleNumber}
                            </span>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-2">
                          <span className="text-[11px] text-zinc-600 dark:text-zinc-300 capitalize flex items-center gap-1 font-semibold">
                            {v.vehicleType === '2wheeler' ? <Bike className="w-3.5 h-3.5 text-amber-500" /> : <Car className="w-3.5 h-3.5 text-amber-500" />}
                            {v.vehicleType === '2wheeler' ? '2-Wheeler (Bike)' : '4-Wheeler (Car)'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                              : isSuspended
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                              : isAwaitingPayment
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                              : isPending
                              ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                          }`}>
                            {isActive && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />}
                            {isSuspended && <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />}
                            {isAwaitingPayment && <Lock className="w-2.5 h-2.5 text-amber-500" />}
                            {isPending && <Clock className="w-2.5 h-2.5 text-yellow-500" />}
                            <span>
                              {isActive ? 'Active Pass' :
                               isSuspended ? 'Pass Suspended' :
                               isAwaitingPayment ? `Fee Pending (${v.vehicleType === '2wheeler' ? '₹199' : '₹299'})` :
                               isPending ? 'Under Review' : 'Rejected'}
                            </span>
                          </span>
                        </td>

                        {/* Permit Details */}
                        <td className="px-4 py-2 text-[11px] text-zinc-500 font-mono">
                          {isActive ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                              <span>Valid: {new Date().getFullYear()}–{new Date().getFullYear() + 1}</span>
                            </span>
                          ) : isSuspended ? (
                            <div className="flex flex-col">
                              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                <span>Administrative Hold</span>
                              </span>
                              {v.suspensionReason && (
                                <span className="text-zinc-600 dark:text-zinc-400 text-[10px] font-sans truncate max-w-[220px]" title={v.suspensionReason}>
                                  Reason: {v.suspensionReason}
                                </span>
                              )}
                            </div>
                          ) : isAwaitingPayment ? (
                            <span className="text-amber-600 dark:text-amber-400">One-time {v.vehicleType === '2wheeler' ? '₹199' : '₹299'} pass fee</span>
                          ) : (
                            <span className="text-zinc-400 italic">Society Verification</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isActive ? (
                              <button
                                type="button"
                                onClick={() => handleViewQR(v.id)}
                                className="h-7 px-2.5 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-[11px] flex items-center gap-1 shadow-sm hover:opacity-95 transition cursor-pointer active:scale-95"
                              >
                                <QrCode className="w-3 h-3 stroke-[2.5]" />
                                <span>View QR Pass</span>
                              </button>
                            ) : isSuspended ? (
                              <button
                                type="button"
                                onClick={() => handleViewQR(v.id)}
                                className="h-7 px-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center gap-1 hover:bg-rose-100 transition cursor-pointer active:scale-95"
                              >
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                <span>View Notice</span>
                              </button>
                            ) : isAwaitingPayment ? (
                              <button
                                type="button"
                                onClick={() => handleViewQR(v.id)}
                                className="h-7 px-2.5 rounded-lg bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-amber-500/15 border border-amber-400/80 text-amber-700 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1 hover:bg-amber-500/25 transition cursor-pointer shadow-sm active:scale-95"
                              >
                                <Lock className="w-3 h-3 text-amber-500" />
                                <span>Unlock (Pay {v.vehicleType === '2wheeler' ? '₹199' : '₹299'})</span>
                              </button>
                            ) : isPending ? (
                              <span className="text-yellow-600 dark:text-yellow-400 text-[11px] font-semibold flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Under Review</span>
                              </span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold">
                                Rejected
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Box/Card View */}
            <div className="sm:hidden p-2.5 space-y-2.5">
              {filteredVehicles.map((v) => {
                const isActive = v.status === 'active';
                const isSuspended = v.status === 'suspended' || (v.status === 'expired' && v.qrCode);
                const isAwaitingPayment = v.status === 'awaiting_payment';
                const isPending = v.status === 'pending';

                return (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#141416] shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-0.5 shadow-2xs">
                        <span className="text-[7px] font-black text-blue-600 mr-1">IND</span>
                        <span className="font-mono font-black text-zinc-950 dark:text-amber-400 text-xs uppercase tracking-wider">
                          {v.vehicleNumber}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                          : isSuspended
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                          : isAwaitingPayment
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                          : isPending
                          ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                      }`}>
                        {isActive ? 'Active Pass' :
                         isSuspended ? '⏸ Pass Suspended' :
                         isAwaitingPayment ? `Fee Pending (${v.vehicleType === '2wheeler' ? '₹199' : '₹299'})` :
                         isPending ? 'Under Review' : 'Rejected'}
                      </span>
                    </div>

                    {isSuspended && (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>Vehicle Pass Temporarily Suspended</span>
                        </div>
                        {v.suspensionReason && (
                          <p className="text-[11px] text-zinc-700 dark:text-zinc-300 pl-5">
                            <strong>Reason:</strong> {v.suspensionReason}
                          </p>
                        )}
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 pl-5">
                          Please contact your Society Management Office to resolve and reactivate your pass.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-[11px] py-1.5 border-y border-zinc-100 dark:border-zinc-800/80">
                      <div>
                        <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider block">Vehicle Type</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize flex items-center gap-1 mt-0.5">
                          {v.vehicleType === '2wheeler' ? <Bike className="w-3 h-3 text-amber-500" /> : <Car className="w-3 h-3 text-amber-500" />}
                          {v.vehicleType}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider block">Permit Status</span>
                        <span className="font-mono text-zinc-600 dark:text-zinc-300 block mt-0.5">
                          {isActive ? `Valid: ${new Date().getFullYear()}` : isSuspended ? 'Hold' : isAwaitingPayment ? 'Fee Required' : 'In Review'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-1">
                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => handleViewQR(v.id)}
                          className="w-full h-8 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>View & Print QR Pass</span>
                        </button>
                      ) : isSuspended ? (
                        <button
                          type="button"
                          onClick={() => handleViewQR(v.id)}
                          className="w-full h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          <span>View Suspension Notice</span>
                        </button>
                      ) : isAwaitingPayment ? (
                        <button
                          type="button"
                          onClick={() => handleViewQR(v.id)}
                          className="w-full h-8 rounded-lg bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-amber-500/15 border border-amber-400/80 text-amber-700 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1.5 hover:bg-amber-500/25 active:scale-95 transition cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Unlock Pass (Pay {v.vehicleType === '2wheeler' ? '₹199' : '₹299'})</span>
                        </button>
                      ) : isPending ? (
                        <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-400/20 text-center text-[10px] text-yellow-700 dark:text-yellow-400 font-medium">
                          Verification in progress by Committee
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-400/20 text-center text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                          Application rejected. Contact Admin.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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
              Vehicle RC Certificate / Car Photo <span className="text-zinc-400 font-normal">(JPG, PNG • Max 5MB)</span>
            </label>
            <div className="flex items-center gap-2.5">
              <label className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 bg-zinc-50 dark:bg-[#18181b] cursor-pointer text-xs text-zinc-600 dark:text-zinc-300 transition">
                <FileText className="w-4 h-4 text-amber-500" />
                <span className="truncate max-w-[200px]">{documentName || 'Attach JPG or PNG (Max 5MB)'}</span>
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

            {/* Suspended Alert Banner */}
            {(activeQRData.isSuspended || activeQRData.status === 'suspended') && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800/80 text-xs text-rose-800 dark:text-rose-300 text-left flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-700 dark:text-rose-300">Vehicle Pass Temporarily Suspended</div>
                  <p className="text-[11px] mt-0.5 text-zinc-700 dark:text-zinc-300">
                    <strong>Reason:</strong> {activeQRData.suspensionReason || 'Temporary administrative hold by society administration.'}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Gate scanner access is paused. Please contact your society management office to resolve and reactivate your pass.
                  </p>
                </div>
              </div>
            )}
            
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

                {(activeQRData.isSuspended || activeQRData.status === 'suspended') ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 text-[10px] font-bold">
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    PASS SUSPENDED
                  </span>
                ) : activeQRData.isLocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px] font-bold">
                    <Lock className="w-3 h-3 text-amber-500" />
                    PENDING ACTIVATION
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ACTIVE PERMIT
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
                      (activeQRData.isLocked || activeQRData.isSuspended || activeQRData.status === 'suspended') ? 'filter blur-[4px] select-none pointer-events-none' : ''
                    }`}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />

                  {/* Frosted Security Watermark Overlay */}
                  {activeQRData.isLocked && (
                    <div 
                      className="absolute inset-0 bg-black/15 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-center select-none"
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <div className="w-9 h-9 rounded-xl bg-zinc-950/85 backdrop-blur-md border border-amber-500/40 text-amber-400 flex items-center justify-center mb-1 shadow-md">
                        <Lock className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 bg-white/90 dark:bg-zinc-900/90 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 shadow-xs">
                        Activation Required
                      </span>
                    </div>
                  )}

                  {/* Suspended Overlay */}
                  {(activeQRData.isSuspended || activeQRData.status === 'suspended') && (
                    <div 
                      className="absolute inset-0 bg-zinc-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-2 text-center select-none"
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <div className="w-9 h-9 rounded-xl bg-rose-950/90 border border-rose-500/60 text-rose-400 flex items-center justify-center mb-1 shadow-md">
                        <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-white bg-rose-600/90 px-2 py-0.5 rounded-md border border-rose-500 shadow-xs">
                        Access Paused
                      </span>
                    </div>
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
            {(activeQRData.isSuspended || activeQRData.status === 'suspended') ? (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-center text-xs text-rose-800 dark:text-rose-300">
                <p className="font-bold">Pass access is on temporary hold.</p>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">Printing and active gate scanning are disabled until reactivated by society management.</p>
              </div>
            ) : activeQRData.isLocked ? (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleInitiatePayment(activeQRData.vehicleId)}
                  disabled={paymentLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-black text-xs sm:text-sm hover:opacity-95 shadow-lg shadow-amber-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4 stroke-[2.5]" />
                  <span>{paymentLoading ? 'Processing Activation...' : `Activate & Download Official Pass • ${activeQRData.vehicleType === '2wheeler' ? '₹199' : '₹299'}`}</span>
                </button>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  🔒 Official Society Windshield Permit 
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
