import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { 
  ShieldCheck, 
  Building2, 
  Users, 
  Car, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  RefreshCw, 
  Search, 
  Mail, 
  Phone, 
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  MessageSquare,
  MapPin,
  Calendar,
  Clock,
  X
} from 'lucide-react';
import { ROLE_LABELS } from '../constants/roles';

export default function SuperAdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('applications'); // 'applications', 'societies', 'users', 'support', 'payments'

  // Dedicated data states per tab to eliminate cross-tab bleeding
  const [applications, setApplications] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [users, setUsers] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentMetrics, setPaymentMetrics] = useState({ totalRevenueINR: 0, paidOrdersCount: 0, totalOrdersCount: 0 });

  // Server-side Pagination states per tab
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown Filter States
  const [societyStatusFilter, setSocietyStatusFilter] = useState('all'); // 'all', 'approved', 'pending', 'rejected'
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all', '1' (Super Admin), '2' (Society Admin), '3' (Resident Member)
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all'); // 'all', 'paid', 'created', 'failed'

  // Custom Dropdown UI States
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const roleDropdownRef = useRef(null);
  const paymentDropdownRef = useRef(null);

  // Smooth Sliding Tab Indicator State & Refs
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabsContainerRef = useRef(null);
  const tabRefs = useRef({});

  // Update sliding indicator on tab change & window resize
  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[tab];
      if (activeEl && tabsContainerRef.current) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1
        });
      }
    };
    updateIndicator();
    const timer = setTimeout(updateIndicator, 40);
    window.addEventListener('resize', updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [tab, stats]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setRoleDropdownOpen(false);
      }
      if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(e.target)) {
        setPaymentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request race-condition guard
  const requestIdRef = useRef(0);
  const searchMountedRef = useRef(false);

  // Modal: Show Generated Credentials after Society Approval
  const [selectedCreds, setSelectedCreds] = useState(null);

  // In-App Rejection Modal (replaces browser window.prompt)
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    societyId: null,
    societyName: '',
    reason: '',
    submitting: false
  });

  // Live Alert & Unread Applications Notification Tracking
  const [hasUnreadApplications, setHasUnreadApplications] = useState(false);
  const [liveAlert, setLiveAlert] = useState(null);
  const lastSignatureRef = useRef(null);
  const prevPendingCountRef = useRef(0);
  const tabRef = useRef(tab);

  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  // Synthesize gentle notification chime without external file dependency
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // Note D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // Note A5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Audio autoplay policy guard
    }
  };

  // Ultra-lightweight background sync for new society registration requests
  const pollForNewRequests = async () => {
    if (typeof document !== 'undefined' && document.hidden) return;

    try {
      const checkRes = await API.get('/admin/pending-check').catch(() => null);
      if (!checkRes || !checkRes.data?.success || !checkRes.data?.data) return;

      const { pendingSocietiesCount, latestSociety, syncSignature } = checkRes.data.data;

      // Zero work if signature has not changed on server
      if (lastSignatureRef.current === syncSignature) {
        return;
      }

      // Check if pending count increased (new incoming society application)
      const hasNewRequest =
        pendingSocietiesCount > prevPendingCountRef.current;

      if (hasNewRequest && lastSignatureRef.current !== null) {
        playNotificationChime();
        const societyName = latestSociety?.name || 'New Society';

        setLiveAlert({
          id: Date.now(),
          name: societyName,
          count: pendingSocietiesCount,
          timestamp: new Date(),
        });

        toast.info(
          `🔔 New Society Application: "${societyName}" has submitted for registration!`
        );

        // Show badge until super admin explicitly opens pending applications tab
        setHasUnreadApplications(true);
      }

      lastSignatureRef.current = syncSignature;
      prevPendingCountRef.current = pendingSocietiesCount;

      // Refresh stats
      fetchStats();

      // If already viewing applications tab, also refresh list directly
      if (tabRef.current === 'applications') {
        fetchTabData();
      }
    } catch (err) {
      // Silent error for background fail-safe
    }
  };

  // Fetch Stats once on load or manual refresh
  const fetchStats = async () => {
    try {
      const statsRes = await API.get('/admin/dashboard/stats');
      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
        const pending = statsRes.data.data?.societies?.pending || 0;
        if (lastSignatureRef.current === null) {
          prevPendingCountRef.current = pending;
          lastSignatureRef.current = `${pending}_init`;
          if (pending > 0 && tabRef.current !== 'applications') {
            setHasUnreadApplications(true);
          }
        }
      }
    } catch (err) {
      // silently fallback
    }
  };

  // Fetch Active Tab Data with Server-Side Pagination & Filtering
  const fetchTabData = async (targetTab = tab, targetPage = page, targetSearch = searchQuery) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);

    try {
      const activeTab = targetTab || tab;
      const activePage = targetPage || 1;
      const activeSearch = targetSearch !== undefined ? targetSearch : searchQuery;

      if (activeTab === 'applications') {
        const res = await API.get(`/admin/societies?status=pending&page=${activePage}&limit=10&search=${encodeURIComponent(activeSearch)}`);
        if (reqId !== requestIdRef.current) return;
        if (res.data?.success) {
          setApplications(res.data.data || []);
          setPagination(res.data.meta || { total: res.data.data?.length || 0, page: activePage, limit: 10, totalPages: 1 });
        }
      } else if (activeTab === 'societies') {
        const statusParam = societyStatusFilter === 'all' ? '' : `&status=${societyStatusFilter}`;
        const res = await API.get(`/admin/societies?page=${activePage}&limit=10&search=${encodeURIComponent(activeSearch)}${statusParam}`);
        if (reqId !== requestIdRef.current) return;
        if (res.data?.success) {
          setSocieties(res.data.data || []);
          setPagination(res.data.meta || { total: res.data.data?.length || 0, page: activePage, limit: 10, totalPages: 1 });
        }
      } else if (activeTab === 'users') {
        const roleParam = userRoleFilter === 'all' ? '' : `&role=${userRoleFilter}`;
        const res = await API.get(`/admin/users?page=${activePage}&limit=10&search=${encodeURIComponent(activeSearch)}${roleParam}`);
        if (reqId !== requestIdRef.current) return;
        if (res.data?.success) {
          setUsers(res.data.data || []);
          setPagination(res.data.meta || { total: res.data.data?.length || 0, page: activePage, limit: 10, totalPages: 1 });
        }
      } else if (activeTab === 'support') {
        const res = await API.get(`/admin/support-feedback?page=${activePage}&limit=10&search=${encodeURIComponent(activeSearch)}`);
        if (reqId !== requestIdRef.current) return;
        if (res.data?.success) {
          setSupportMessages(res.data.data || []);
          setPagination(res.data.meta || { total: res.data.data?.length || 0, page: activePage, limit: 10, totalPages: 1 });
        }
      } else if (activeTab === 'payments') {
        const statusParam = paymentStatusFilter === 'all' ? '' : `&status=${paymentStatusFilter}`;
        const res = await API.get(`/admin/payments?page=${activePage}&limit=10&search=${encodeURIComponent(activeSearch)}${statusParam}`);
        if (reqId !== requestIdRef.current) return;
        if (res.data?.success) {
          setPayments(res.data.data || []);
          if (res.data.metrics) {
            setPaymentMetrics(res.data.metrics);
          }
          setPagination(res.data.meta || { total: res.data.data?.length || 0, page: activePage, limit: 10, totalPages: 1 });
        }
      }
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        return;
      }
      if (reqId === requestIdRef.current) {
        const activeTab = targetTab || tab;
        if (activeTab === 'applications') setApplications([]);
        else if (activeTab === 'societies') setSocieties([]);
        else if (activeTab === 'users') setUsers([]);
        else if (activeTab === 'support') setSupportMessages([]);
        else if (activeTab === 'payments') setPayments([]);
        setPagination({ total: 0, page: 1, limit: 10, totalPages: 1 });

        // Only alert on internal server errors (5xx)
        if (err?.response?.status && err.response.status >= 500) {
          toast.error('Failed to load table entries.');
        }
      }
    } finally {
      if (reqId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStats();

    // Background polling interval (10s) with browser visibility protection
    const interval = setInterval(() => {
      pollForNewRequests();
    }, 10000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        pollForNewRequests();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Re-fetch when tab, page, or filters change
  useEffect(() => {
    fetchTabData();
  }, [tab, page, societyStatusFilter, userRoleFilter, paymentStatusFilter]);

  // Handle live search with debounce without firing on mount
  useEffect(() => {
    if (!searchMountedRef.current) {
      searchMountedRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      setPage(1);
      fetchTabData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTabChange = (newTab) => {
    if (newTab === 'applications') {
      setHasUnreadApplications(false);
      setLiveAlert(null);
    }
    if (newTab === tab) return;
    setTab(newTab);
    setPage(1);
    setSearchQuery('');
  };

  const handleApproveSociety = async (id) => {
    try {
      const res = await API.post(`/admin/societies/${id}/approve`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Society approved successfully!');
        setSelectedCreds(res.data.data);
        fetchStats();
        fetchTabData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    }
  };

  const handleOpenRejectModal = (soc) => {
    setRejectModal({
      isOpen: true,
      societyId: soc.id,
      societyName: soc.name,
      reason: '',
      submitting: false
    });
  };

  const handleConfirmReject = async () => {
    const { societyId, reason } = rejectModal;
    if (!reason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }

    setRejectModal(prev => ({ ...prev, submitting: true }));

    try {
      const res = await API.post(`/admin/societies/${societyId}/reject`, { reason });
      if (res.data?.success) {
        toast.success('Society application rejected.');
        setRejectModal({ isOpen: false, societyId: null, societyName: '', reason: '', submitting: false });
        fetchStats();
        fetchTabData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed.');
      setRejectModal(prev => ({ ...prev, submitting: false }));
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const copyAllCredentials = () => {
    if (!selectedCreds) return;
    const credsText = 
`🏢 Society: ${selectedCreds.societyName}
📧 Admin Email: ${selectedCreds.adminCredentials?.email}
🔑 Temporary Password: ${selectedCreds.adminCredentials?.temporaryPassword}
🔗 Login URL: ${window.location.origin}/login
🎟️ Resident Join Token: ${selectedCreds.inviteLinkToken}
🌐 Resident Registration URL: ${window.location.origin}/register/${selectedCreds.inviteLinkToken}`;

    navigator.clipboard.writeText(credsText);
    toast.success('All onboarding credentials copied!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
            <ShieldCheck className="w-3 h-3" />
            <span>Platform Administration</span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
            Super Admin Dashboard
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Super Admin</span>
        </div>
      </div>

      {/* Live Society Application Alert Banner */}
      {liveAlert && (
        <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-sm animate-toast-in">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>🔔 <strong>New Society Application:</strong> &ldquo;{liveAlert.name}&rdquo; has submitted for registration!</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { handleTabChange('applications'); setLiveAlert(null); }}
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 text-xs font-black hover:bg-amber-400 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Review Now →
            </button>
            <button
              onClick={() => setLiveAlert(null)}
              className="p-1 rounded-lg hover:bg-amber-500/20 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Stats Grid — Compact low-profile cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
          
          {/* Societies Card */}
          <div 
            onClick={() => handleTabChange('applications')}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer glass-card glass-card-hover ${
              stats.societies.pending > 0 
                ? 'border-amber-400/70 dark:border-amber-500/40 bg-amber-50/25 dark:bg-amber-950/20 shadow-sm' 
                : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#121214]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Societies</span>
              <div className="w-6.5 h-6.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                {stats.societies.total}
              </div>
              <div className="text-[10px] font-semibold">
                {stats.societies.pending > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>{stats.societies.pending} Pending</span>
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>All Processed</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Total Users Card */}
          <div 
            onClick={() => handleTabChange('users')}
            className="p-2.5 sm:p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#121214] glass-card glass-card-hover transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Users</span>
              <div className="w-6.5 h-6.5 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                {stats.users.total}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                {stats.users.members} Residents
              </div>
            </div>
          </div>

          {/* Active Passes Card */}
          <div className="p-2.5 sm:p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#121214] glass-card glass-card-hover transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Active Passes</span>
              <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Car className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                {stats.vehicles.active}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                of {stats.vehicles.total} Registered
              </div>
            </div>
          </div>

          {/* Platform Revenue Card */}
          <div 
            onClick={() => handleTabChange('payments')}
            className="p-2.5 sm:p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#121214] glass-card glass-card-hover transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Platform Revenue</span>
              <div className="w-6.5 h-6.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight leading-none">
                ₹{stats.financials.totalRevenueINR}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>{stats.financials.totalOrdersPaid} Orders Paid</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab Block: Nav + Pane together so spacing is fully controlled */}
      <div className="flex flex-col gap-3">

        {/* Tab Navigation: Mobile 2x2 Grid / Desktop Animated Sliding Segmented Bar */}
        <div
          ref={tabsContainerRef}
          className="relative grid grid-cols-2 gap-1 sm:flex sm:items-center w-full p-1 rounded-xl bg-zinc-100/90 dark:bg-[#151518] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm"
        >
          {/* Animated Sliding Pill (Desktop Only) */}
          <div
            className="hidden sm:block absolute top-1 bottom-1 rounded-lg bg-amber-500 shadow-sm transition-all duration-300 ease-out pointer-events-none"
            style={{
              transform: `translateX(${indicatorStyle.left}px)`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity
            }}
          />

          {/* Tab 1: Applications */}
          <button
            ref={(el) => (tabRefs.current['applications'] = el)}
            onClick={() => handleTabChange('applications')}
            className={`relative z-10 sm:flex-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              tab === 'applications'
                ? 'bg-amber-500 text-zinc-950 font-black sm:bg-transparent shadow-sm sm:shadow-none'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 shrink-0 ${tab === 'applications' ? 'text-zinc-950' : 'text-zinc-400'}`} />
            <span className="truncate">Pending Applications</span>
            {hasUnreadApplications ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-amber-400 text-zinc-950 border border-amber-300 shadow-sm animate-pulse shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping shrink-0" />
                <span>{stats?.societies?.pending ? `${stats.societies.pending} NEW` : 'NEW'}</span>
              </span>
            ) : stats?.societies?.pending > 0 && tab !== 'applications' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            ) : null}
          </button>

          {/* Tab 2: All Societies */}
          <button
            ref={(el) => (tabRefs.current['societies'] = el)}
            onClick={() => handleTabChange('societies')}
            className={`relative z-10 sm:flex-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              tab === 'societies'
                ? 'bg-amber-500 text-zinc-950 font-black sm:bg-transparent shadow-sm sm:shadow-none'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Building2 className={`w-3.5 h-3.5 shrink-0 ${tab === 'societies' ? 'text-zinc-950' : 'text-zinc-400'}`} />
            <span className="truncate">All Societies</span>
          </button>

          {/* Tab 3: All Users */}
          <button
            ref={(el) => (tabRefs.current['users'] = el)}
            onClick={() => handleTabChange('users')}
            className={`relative z-10 sm:flex-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              tab === 'users'
                ? 'bg-amber-500 text-zinc-950 font-black sm:bg-transparent shadow-sm sm:shadow-none'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Users className={`w-3.5 h-3.5 shrink-0 ${tab === 'users' ? 'text-zinc-950' : 'text-zinc-400'}`} />
            <span className="truncate">All System Users</span>
          </button>

          {/* Tab 4: Support */}
          <button
            ref={(el) => (tabRefs.current['support'] = el)}
            onClick={() => handleTabChange('support')}
            className={`relative z-10 sm:flex-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              tab === 'support'
                ? 'bg-amber-500 text-zinc-950 font-black sm:bg-transparent shadow-sm sm:shadow-none'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${tab === 'support' ? 'text-zinc-950' : 'text-zinc-400'}`} />
            <span className="truncate">Support Inquiries</span>
          </button>

          {/* Tab 5: Pass Payments */}
          <button
            ref={(el) => (tabRefs.current['payments'] = el)}
            onClick={() => handleTabChange('payments')}
            className={`relative z-10 sm:flex-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 col-span-2 sm:col-span-1 ${
              tab === 'payments'
                ? 'bg-amber-500 text-zinc-950 font-black sm:bg-transparent shadow-sm sm:shadow-none'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className={`w-3.5 h-3.5 shrink-0 ${tab === 'payments' ? 'text-zinc-950' : 'text-zinc-400'}`} />
            <span className="truncate">Pass Payments</span>
          </button>

        </div>

        {/* Tab 1: Pending Applications */}
      {tab === 'applications' && (
        <div key="tab-applications" className="animate-tab-pane glass-card rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214] relative z-10 shadow-sm flex flex-col">
          
          {/* Table Card Toolbar: Full Width Search */}
          <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-[#151518]/60 flex items-center rounded-t-2xl">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search applications..."
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
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="bg-zinc-50/80 dark:bg-[#161619] text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80 dark:border-zinc-800/80">
                <tr>
                  <th className="px-4 py-2">Society Name</th>
                  <th className="px-4 py-2">Address</th>
                  <th className="px-4 py-2">Submitted By</th>
                  <th className="px-4 py-2 ">Actions</th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeleton cols={4} rows={4} />
              ) : applications.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">All Caught Up!</div>
                      <div className="text-[11px] mt-0.5 text-zinc-400">No pending society applications awaiting review.</div>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60">
                  {applications.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#18181b]/50 transition-colors">
                      <td className="px-4 py-2 font-bold text-zinc-900 dark:text-white">
                        <div className="text-xs font-extrabold">{s.name}</div>
                      </td>
                      <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400 text-xs max-w-xs leading-relaxed">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{s.address}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-xs">{s.submittedBy?.name || 'Administrator'}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {s.submittedBy?.email} • {s.submittedBy?.phone || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-start gap-1.5">
                          <button
                            onClick={() => handleApproveSociety(s.id)}
                            className="h-7.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleOpenRejectModal(s)}
                            className="h-7.5 px-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 hover:bg-rose-100 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>

          {/* Mobile Box/Card View */}
          <div className="sm:hidden">
            {loading ? (
              <CardSkeleton count={3} />
            ) : applications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                <div className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">All Caught Up!</div>
                <div className="mt-0.5 text-[11px]">No pending society applications.</div>
              </div>
            ) : (
              <div className="space-y-2.5 p-2.5">
                {applications.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#141416] shadow-sm space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-zinc-900 dark:text-white text-xs">{s.name}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0">
                        Pending
                      </span>
                    </div>

                    <div className="flex items-start gap-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                      <MapPin className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{s.address}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 text-[11px] space-y-0.5">
                      <div className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Submitted By</div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-200">{s.submittedBy?.name || 'Administrator'}</div>
                      <div className="flex flex-col text-[10px] text-zinc-500 font-mono">
                        <span>{s.submittedBy?.email}</span>
                        {s.submittedBy?.phone && <span>{s.submittedBy?.phone}</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        onClick={() => handleApproveSociety(s.id)}
                        className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleOpenRejectModal(s)}
                        className="h-8 px-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Server-Side Pagination Bar */}
          <PaginationBar
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}


      {/* Tab 2: All Societies */}
      {tab === 'societies' && (
        <div key="tab-societies" className="animate-tab-pane glass-card rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214] relative z-10 shadow-sm flex flex-col overflow-visible">
          
          {/* Table Card Toolbar: Full Width Search & Status Filter */}
          <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-[#151518]/60 flex items-center justify-between gap-2.5 rounded-t-2xl overflow-visible">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search societies..."
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

            {/* Custom Dropdown: Societies Tab Status Filter */}
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
                    {societyStatusFilter === 'all' ? 'All' : societyStatusFilter}
                  </span>
                </div>
                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {statusDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-1 z-40 animate-dropdown">
                  {[
                    { value: 'all', label: 'All Societies' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'rejected', label: 'Rejected' },
                  ].map((opt) => {
                    const isSelected = societyStatusFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSocietyStatusFilter(opt.value);
                          setPage(1);
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
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="bg-zinc-50/80 dark:bg-[#161619] text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80 dark:border-zinc-800/80">
                <tr>
                  <th className="px-4 py-2">Society Name</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Admin Contact</th>
                  <th className="px-4 py-2">Contact Number</th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeleton cols={4} rows={4} />
              ) : societies.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">No Societies Found</div>
                      <div className="text-[11px] mt-0.5 text-zinc-400">No registered housing societies match your search or filter criteria.</div>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60">
                  {societies.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#18181b]/50 transition-colors">
                      <td className="px-4 py-2">
                        <div className="font-extrabold text-zinc-900 dark:text-white text-xs">{s.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate max-w-xs">{s.address}</div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          s.status === 'approved' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' :
                          s.status === 'rejected' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30' :
                          'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {s.adminUser ? (
                          <div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-200">{s.adminUser.name}</div>
                            <div className="text-zinc-500 text-[10px] font-mono">{s.adminUser.email}</div>
                          </div>
                        ) : <span className="text-zinc-400 dark:text-zinc-500 italic text-[11px]">None assigned</span>}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {(s.adminUser?.phone || s.submittedBy?.phone) ? (
                          <a
                            href={`tel:${s.adminUser?.phone || s.submittedBy?.phone}`}
                            className="inline-flex items-center gap-1 font-mono text-zinc-900 dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-400 font-semibold transition group"
                          >
                            <Phone className="w-3 h-3 text-amber-500 group-hover:scale-110 transition shrink-0" />
                            <span>{s.adminUser?.phone || s.submittedBy?.phone}</span>
                          </a>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-500 italic text-[11px]">No phone</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>

          {/* Mobile Box/Card View */}
          <div className="sm:hidden">
            {loading ? (
              <CardSkeleton count={3} />
            ) : societies.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">No Societies Found</div>
                <div className="text-[11px] mt-0.5 text-zinc-400">No registered housing societies match your search or filter criteria.</div>
              </div>
            ) : (
              <div className="space-y-2.5 p-2.5">
                {societies.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#141416] shadow-sm space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-zinc-900 dark:text-white text-xs">{s.name}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                        s.status === 'approved' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' :
                        s.status === 'rejected' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                      }`}>
                        {s.status}
                      </span>
                    </div>

                    <div className="flex items-start gap-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                      <MapPin className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{s.address}</span>
                    </div>

                    {s.adminUser && (
                      <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 text-[11px] space-y-0.5">
                        <div className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Society Admin</div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-200">{s.adminUser.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{s.adminUser.email}</div>
                      </div>
                    )}

                    {(s.adminUser?.phone || s.submittedBy?.phone) && (
                      <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-amber-500" />
                          <span>{s.adminUser?.phone || s.submittedBy?.phone}</span>
                        </div>
                        <a
                          href={`tel:${s.adminUser?.phone || s.submittedBy?.phone}`}
                          className="h-7 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold transition flex items-center gap-1 shrink-0"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Server-Side Pagination Bar */}
          <PaginationBar
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}


      {/* Tab 3: All Users */}
      {tab === 'users' && (
        <div key="tab-users" className="glass-card rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214] relative z-10 shadow-sm flex flex-col animate-tab-pane overflow-visible">
          
          {/* Table Card Toolbar: Full Width Search & Role Filter */}
          <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-[#151518]/60 flex items-center justify-between gap-2.5 rounded-t-2xl overflow-visible">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search users..."
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

            {/* Custom Dropdown: Users Tab Role Filter */}
            <div className="relative z-30 shrink-0" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="h-8 flex items-center justify-between gap-1.5 px-2.5 rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700/80 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-amber-400 dark:hover:border-amber-500/50 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-1">
                  <Filter className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="text-zinc-400 text-[11px]">Role:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">
                    {userRoleFilter === 'all' ? 'All' :
                     userRoleFilter === '1' ? 'Super Admin' :
                     userRoleFilter === '2' ? 'Society Admin' :
                     'Resident'}
                  </span>
                </div>
                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-1 z-40 animate-dropdown">
                  {[
                    { value: 'all', label: 'All Roles' },
                    { value: '1', label: 'Super Admin' },
                    { value: '2', label: 'Society Admin' },
                    { value: '3', label: 'Resident Member' },
                  ].map((opt) => {
                    const isSelected = userRoleFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setUserRoleFilter(opt.value);
                          setPage(1);
                          setRoleDropdownOpen(false);
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
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="bg-zinc-50/80 dark:bg-[#161619] text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80 dark:border-zinc-800/80">
                <tr>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Society</th>
                  <th className="px-4 py-2">Contact</th>
                  <th className="px-4 py-2">Joined</th>
                  <th className="px-4 py-2 text-right">Role</th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeleton cols={5} rows={5} />
              ) : users.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">No Users Found</div>
                      <div className="text-[11px] mt-0.5 text-zinc-400">No user accounts found matching your selected role or search query.</div>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#18181b]/50 transition-colors">
                      <td className="px-4 py-2">
                        <div className="font-extrabold text-zinc-900 dark:text-white text-xs leading-tight">{u.name}</div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono leading-tight">{u.email}</div>
                      </td>
                      <td className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {u.society?.name || 'Platform Admin'}
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        {u.phone || '—'}
                      </td>
                      <td className="px-4 py-2 text-[11px] text-zinc-500 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          u.role === 1 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30' :
                          u.role === 2 ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30' :
                          'bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                        }`}>
                          {ROLE_LABELS[u.role] || 'User'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>

          {/* Mobile Box/Card View */}
          <div className="sm:hidden">
            {loading ? (
              <CardSkeleton count={3} />
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5" />
                </div>
                <div className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">No Users Found</div>
                <div className="text-[11px] mt-0.5 text-zinc-400">No user accounts found matching your selected role or search query.</div>
              </div>
            ) : (
              <div className="space-y-2.5 p-2.5">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#141416] shadow-sm space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-zinc-900 dark:text-white text-xs">{u.name}</div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">{u.email}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                        u.role === 1 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30' :
                        u.role === 2 ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30' :
                        'bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                      }`}>
                        {ROLE_LABELS[u.role] || 'User'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] py-1.5 border-y border-zinc-100 dark:border-zinc-800/80">
                      <div>
                        <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider block">Society</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                          {u.society?.name || 'Platform Admin'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider block">Phone</span>
                        <span className="font-mono text-zinc-700 dark:text-zinc-300 block">
                          {u.phone || '—'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-500" />
                        <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Server-Side Pagination Bar */}
          <PaginationBar
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}


      {/* Tab 4: Support & Help Inquiries */}
      {tab === 'support' && (
        <div key="tab-support" className="glass-card rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214] relative z-10 shadow-sm flex flex-col animate-tab-pane">
          
          {/* Table Card Toolbar: Full Width Search */}
          <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-[#151518]/60 flex items-center rounded-t-2xl">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search inquiries..."
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
           
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="bg-zinc-50/80 dark:bg-[#161619] text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80 dark:border-zinc-800/80">
                <tr>
                  <th className="px-4 py-2">Sender</th>
                  <th className="px-4 py-2">Contact</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Message</th>
                  <th className="px-4 py-2 text-right">Received</th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeleton cols={5} rows={5} />
              ) : supportMessages.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">No Support Inquiries Yet</div>
                      <div className="text-[11px] mt-0.5 text-zinc-400">No member support requests or feedback messages have been submitted.</div>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60">
                  {supportMessages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#18181b]/50 transition-colors">
                      <td className="px-4 py-2 font-bold text-zinc-900 dark:text-white text-xs">
                        {msg.name}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        <div className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono text-[11px]">{msg.emailOrPhone}</div>
                        {msg.emailOrPhone?.includes('@') && (
                          <a
                            href={`mailto:${msg.emailOrPhone}?subject=Re:%20QR%20Parky%20Support%20Inquiry`}
                            className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 mt-0.5 font-semibold"
                          >
                            <Mail className="w-2.5 h-2.5" /> Reply via Email
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          msg.category === 'issue' || msg.category === 'bug' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30' :
                          msg.category === 'feature' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30' :
                          msg.category === 'suggestion' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30' :
                          'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                        }`}>
                          {msg.category || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 max-w-md whitespace-pre-wrap leading-snug">
                        {msg.message || <span className="text-zinc-400 italic">No message body provided</span>}
                      </td>
                      <td className="px-4 py-2 text-right text-[11px] text-zinc-500 whitespace-nowrap">
                        {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>

          {/* Mobile Box/Card View */}
          <div className="sm:hidden">
            {loading ? (
              <CardSkeleton count={3} />
            ) : supportMessages.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">No Support Inquiries Yet</div>
                <div className="text-[11px] mt-0.5 text-zinc-400">No member support requests or feedback messages have been submitted.</div>
              </div>
            ) : (
              <div className="space-y-2.5 p-2.5">
                {supportMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#141416] shadow-sm space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-zinc-900 dark:text-white text-xs">{msg.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{msg.emailOrPhone}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                        msg.category === 'issue' || msg.category === 'bug' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30' :
                        msg.category === 'feature' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30' :
                        msg.category === 'suggestion' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30' :
                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                      }`}>
                        {msg.category || 'General'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-snug">
                      {msg.message || <span className="text-zinc-400 italic">No message body provided</span>}
                    </div>

                    <div className="flex items-center justify-between pt-0.5 text-[10px]">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>{new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>

                      {msg.emailOrPhone?.includes('@') && (
                        <a
                          href={`mailto:${msg.emailOrPhone}?subject=Re:%20QR%20Parky%20Support%20Inquiry`}
                          className="h-7 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Reply</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Server-Side Pagination Bar */}
          <PaginationBar
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Tab 5: Pass Payments & Transactions */}
      {tab === 'payments' && (
        <div key="tab-payments" className="glass-card rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214] relative z-10 shadow-sm flex flex-col animate-tab-pane">
          
          {/* Table Card Toolbar: Search & Status Filter */}
          <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-[#151518]/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 rounded-t-2xl">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search payments, members, societies, vehicle plate, or order ID..."
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

            {/* Custom Dropdown: Payment Status Filter */}
            <div className="relative z-30 shrink-0" ref={paymentDropdownRef}>
              <button
                type="button"
                onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
                className="h-8 flex items-center justify-between gap-1.5 px-2.5 rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700/80 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-amber-400 dark:hover:border-amber-500/50 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-1">
                  <Filter className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="text-zinc-400 text-[11px]">Status:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 capitalize text-xs">
                    {paymentStatusFilter === 'all' ? 'All' :
                     paymentStatusFilter === 'paid' ? 'Paid' :
                     paymentStatusFilter === 'created' ? 'Awaiting Payment' :
                     paymentStatusFilter === 'failed' ? 'Failed' : paymentStatusFilter}
                  </span>
                </div>
                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${paymentDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {paymentDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-1 z-40 animate-dropdown">
                  {[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'paid', label: 'Paid Passes' },
                    { value: 'created', label: 'Awaiting Payment' },
                    { value: 'failed', label: 'Failed' },
                  ].map((opt) => {
                    const isSelected = paymentStatusFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setPaymentStatusFilter(opt.value);
                          setPaymentDropdownOpen(false);
                          setPage(1);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${
                          isSelected
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="bg-zinc-50/80 dark:bg-[#161619] text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80 dark:border-zinc-800/80">
                <tr>
                  <th className="px-4 py-2">Order / Transaction</th>
                  <th className="px-4 py-2">Resident Member</th>
                  <th className="px-4 py-2">Society</th>
                  <th className="px-4 py-2">Vehicle(s)</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Date & Time</th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeleton cols={7} rows={5} />
              ) : payments.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">No Payment Transactions Found</div>
                      <div className="text-[11px] mt-0.5 text-zinc-400">No pass payments or transactions have been recorded matching your criteria.</div>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60">
                  {payments.map((p) => {
                    const isPaid = p.status === 'paid';
                    const isCreated = p.status === 'created';
                    const isFailed = p.status === 'failed';

                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#18181b]/50 transition-colors">
                        <td className="px-4 py-2 font-mono text-xs">
                          <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                            <span>#ord_{p.orderId}</span>
                          </div>
                          {p.razorpayPaymentId ? (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 truncate max-w-[150px]" title={p.razorpayPaymentId}>
                              {p.razorpayPaymentId}
                            </div>
                          ) : (
                            <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate max-w-[150px]" title={p.razorpayOrderId}>
                              {p.razorpayOrderId}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <div className="font-bold text-zinc-900 dark:text-white text-xs">
                            {p.member?.name || 'Unknown Member'}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-medium">
                            {p.member?.phone || p.member?.email || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                            <Building2 className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{p.member?.societyName || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          {p.vehicles && p.vehicles.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {p.vehicles.map((v) => (
                                <span
                                  key={v.id}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono font-bold text-[11px] text-zinc-800 dark:text-zinc-200"
                                >
                                  <Car className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                  <span>{v.vehicleNumber}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic text-[11px]">Pass Generated</span>
                          )}
                        </td>
                        <td className="px-4 py-2 font-mono font-extrabold text-xs text-amber-600 dark:text-amber-400">
                          ₹{p.amountINR}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPaid
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : isCreated
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                : isFailed
                                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            {isPaid && <CheckCircle2 className="w-2.5 h-2.5" />}
                            {isPaid ? 'Paid' : isCreated ? 'Awaiting Payment' : isFailed ? 'Failed' : p.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-[11px] text-zinc-500 whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
          </div>

          {/* Mobile Box/Card View */}
          <div className="sm:hidden">
            {loading ? (
              <CardSkeleton count={3} />
            ) : payments.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">No Payment Transactions Found</div>
                <div className="text-[11px] mt-0.5 text-zinc-400">No pass payments or transactions have been recorded matching your criteria.</div>
              </div>
            ) : (
              <div className="space-y-2.5 p-2.5">
                {payments.map((p) => {
                  const isPaid = p.status === 'paid';
                  const isCreated = p.status === 'created';
                  const isFailed = p.status === 'failed';

                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white/60 dark:bg-zinc-900/40 space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-900 dark:text-white">
                          <CreditCard className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>#ord_{p.orderId}</span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                              : isCreated
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                              : isFailed
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {isPaid && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {isPaid ? 'Paid' : isCreated ? 'Awaiting Payment' : isFailed ? 'Failed' : p.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-white">{p.member?.name || 'Unknown Member'}</div>
                          <div className="text-[11px] text-zinc-500">
                            {p.member?.phone || p.member?.email}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-amber-600 dark:text-amber-400 font-mono text-sm">
                            ₹{p.amountINR}
                          </div>
                          {p.razorpayPaymentId && (
                            <div className="text-[10px] text-zinc-400 font-mono truncate max-w-[120px]">
                              {p.razorpayPaymentId}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80 pt-1.5">
                        <Building2 className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="font-semibold">{p.member?.societyName || 'N/A'}</span>
                      </div>

                      {p.vehicles && p.vehicles.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {p.vehicles.map((v) => (
                            <span
                              key={v.id}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-800 dark:text-zinc-200"
                            >
                              <Car className="w-2.5 h-2.5 text-amber-500" />
                              <span>{v.vehicleNumber}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                        <span>Initiated</span>
                        <span>{new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Server-Side Pagination Bar */}
          <PaginationBar
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}
      </div>

      {/* Modal: Show Generated Credentials after Society Approval */}
      <Modal
        isOpen={!!selectedCreds}
        onClose={() => setSelectedCreds(null)}
        title="Society Approved & Admin Credentials Generated"
      >
        {selectedCreds && (
          <div className="space-y-4 py-1">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 text-xs text-emerald-800 dark:text-emerald-200">
              Society <span className="font-bold text-zinc-900 dark:text-white">{selectedCreds.societyName}</span> has been approved! Login credentials have been generated below:
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-zinc-400 uppercase font-bold text-[10px] block tracking-wider">Admin Email</span>
                  <div className="text-amber-600 dark:text-amber-400 font-semibold mt-0.5">{selectedCreds.adminCredentials?.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedCreds.adminCredentials?.email, 'Admin Email')}
                  className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 cursor-pointer transition"
                  title="Copy Email"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-2.5">
                <div>
                  <span className="text-zinc-400 uppercase font-bold text-[10px] block tracking-wider">Temporary Password</span>
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-0.5">{selectedCreds.adminCredentials?.temporaryPassword}</div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedCreds.adminCredentials?.temporaryPassword, 'Temporary Password')}
                  className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 cursor-pointer transition"
                  title="Copy Password"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-2.5">
                <div className="flex-1 pr-2">
                  <span className="text-zinc-400 uppercase font-bold text-[10px] block tracking-wider">Resident Join Token</span>
                  <div className="text-zinc-700 dark:text-zinc-300 truncate mt-0.5">{selectedCreds.inviteLinkToken}</div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${window.location.origin}/register/${selectedCreds.inviteLinkToken}`, 'Join Link')}
                  className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 cursor-pointer transition"
                  title="Copy Join Link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={copyAllCredentials}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-zinc-950 font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Copy className="w-4 h-4" />
                <span>Copy All Credentials</span>
              </button>

              <button
                onClick={() => setSelectedCreds(null)}
                className="h-11 px-5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* In-App Rejection Modal */}
      <Modal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal(prev => ({ ...prev, isOpen: false }))}
        title="Reject Society Application"
      >
        <div className="space-y-4 py-1">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span>You are rejecting: </span>
              <strong className="font-semibold">{rejectModal.societyName}</strong>.
              <span className="block text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                Please provide a rejection reason for the applicant.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Reason for Rejection <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Incomplete society address, Unable to verify secretary details, Duplicate entry..."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-amber-500 transition resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setRejectModal(prev => ({ ...prev, isOpen: false }))}
              className="h-10 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              disabled={rejectModal.submitting}
              className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {rejectModal.submitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

/**
 * Reusable Server-Side Pagination Bar Component
 */
function PaginationBar({ pagination, onPageChange }) {
  const { total = 0, page = 1, totalPages = 1 } = pagination || {};

  // If all records fit on 1 page or empty, don't show an unnecessary empty pagination bar
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-zinc-50/60 dark:bg-[#161619]/60 border-t border-zinc-200/80 dark:border-zinc-800/80 text-[11px] text-zinc-500 dark:text-zinc-400">
      <div>
        Page <span className="font-bold text-zinc-900 dark:text-white">{page}</span> of{' '}
        <span className="font-bold text-zinc-900 dark:text-white">{totalPages}</span> ({total} total records)
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-7.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-xs text-zinc-700 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer shadow-sm"
        >
          <ChevronLeft className="w-3 h-3" />
          <span>Previous</span>
        </button>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-7.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-xs text-zinc-700 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer shadow-sm"
        >
          <span>Next</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/**
 * Reusable Stable Table Skeleton Rows (Prevents layout shift and table flickering)
 */
function TableSkeleton({ cols = 4, rows = 4 }) {
  return (
    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="hover:bg-transparent">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="px-4 py-2">
              <div 
                className="h-3.5 bg-zinc-200/70 dark:bg-zinc-800/80 rounded-md animate-pulse"
                style={{ width: `${Math.max(45, (85 - (cIdx * 15)))}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

/**
 * Reusable Mobile Card Skeleton
 */
function CardSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 animate-pulse space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-zinc-200/70 dark:bg-zinc-800/80 rounded w-1/3" />
            <div className="h-4 bg-zinc-200/70 dark:bg-zinc-800/80 rounded-full w-16" />
          </div>
          <div className="h-3 bg-zinc-200/70 dark:bg-zinc-800/80 rounded w-2/3" />
          <div className="h-3 bg-zinc-200/70 dark:bg-zinc-800/80 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
