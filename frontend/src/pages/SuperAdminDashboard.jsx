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
  Check
} from 'lucide-react';
import { ROLE_LABELS } from '../constants/roles';

export default function SuperAdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('applications'); // 'applications', 'societies', 'users'

  // Data states
  const [societies, setSocieties] = useState([]);
  const [users, setUsers] = useState([]);

  // Server-side Pagination states per tab
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown Filter States
  const [societyStatusFilter, setSocietyStatusFilter] = useState('all'); // 'all', 'approved', 'pending', 'rejected'
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all', '2' (Society Admin), '3' (Resident Member)

  // Custom Dropdown Open States
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const statusDropdownRef = useRef(null);
  const roleDropdownRef = useRef(null);

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

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Stats once on load or manual refresh
  const fetchStats = async () => {
    try {
      const statsRes = await API.get('/admin/dashboard/stats');
      if (statsRes.data?.success) setStats(statsRes.data.data);
    } catch (err) {
      // silently fallback
    }
  };

  // Fetch Active Tab Data with Server-Side Pagination & Filtering
  const fetchTabData = async () => {
    setLoading(true);
    try {
      if (tab === 'applications') {
        const res = await API.get(`/admin/societies?status=pending&page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}`);
        if (res.data?.success) {
          setSocieties(res.data.data || []);
          if (res.data.meta) {
            setPagination(res.data.meta);
          } else {
            setPagination({ total: res.data.data?.length || 0, page: 1, limit: 10, totalPages: 1 });
          }
        }
      } else if (tab === 'societies') {
        const statusParam = societyStatusFilter === 'all' ? '' : `&status=${societyStatusFilter}`;
        const res = await API.get(`/admin/societies?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}${statusParam}`);
        if (res.data?.success) {
          setSocieties(res.data.data || []);
          if (res.data.meta) {
            setPagination(res.data.meta);
          } else {
            setPagination({ total: res.data.data?.length || 0, page: 1, limit: 10, totalPages: 1 });
          }
        }
      } else if (tab === 'users') {
        const roleParam = userRoleFilter === 'all' ? '' : `&role=${userRoleFilter}`;
        const res = await API.get(`/admin/users?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}${roleParam}`);
        if (res.data?.success) {
          setUsers(res.data.data || []);
          if (res.data.meta) {
            setPagination(res.data.meta);
          } else {
            setPagination({ total: res.data.data?.length || 0, page: 1, limit: 10, totalPages: 1 });
          }
        }
      }
    } catch (err) {
      toast.error('Failed to load table entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Re-fetch when tab, page, or filters change
  useEffect(() => {
    fetchTabData();
  }, [tab, page, societyStatusFilter, userRoleFilter]);

  // Handle live search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchTabData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTabChange = (newTab) => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Super Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage registered societies, verify onboarding applications, and oversee platform users and revenue.
          </p>
        </div>

        <button
          onClick={() => { fetchStats(); fetchTabData(); }}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          title="Refresh platform statistics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid (Compact, modern & balanced sizing) */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-5">
          <div 
            onClick={() => handleTabChange('applications')}
            className={`glass-card p-3 sm:p-3.5 rounded-xl border cursor-pointer transition hover:border-amber-400/50 ${
              stats.societies.pending > 0 
                ? 'border-yellow-400/60 dark:border-yellow-500/40 bg-yellow-50/20 dark:bg-yellow-950/20' 
                : 'border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Societies</span>
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{stats.societies.total}</div>
            <div className="text-[10px] font-semibold mt-0.5">
              {stats.societies.pending > 0 ? (
                <span className="text-amber-600 dark:text-amber-400">⚡ {stats.societies.pending} Pending Review</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">All Processed</span>
              )}
            </div>
          </div>

          <div 
            onClick={() => handleTabChange('users')}
            className="glass-card p-3 sm:p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214] cursor-pointer hover:border-amber-400/50 transition"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Users</span>
              <Users className="w-3.5 h-3.5 text-yellow-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">{stats.users.total}</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{stats.users.members} Residents</div>
          </div>

          <div className="glass-card p-3 sm:p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Active Passes</span>
              <Car className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">{stats.vehicles.active}</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">of {stats.vehicles.total} Registered</div>
          </div>

          <div className="glass-card p-3 sm:p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Platform Revenue</span>
              <CreditCard className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">₹{stats.financials.totalRevenueINR}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{stats.financials.totalOrdersPaid} Orders Paid</div>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-3 mb-6">
        <button
          onClick={() => handleTabChange('applications')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
            tab === 'applications'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          <span>Pending Applications</span>
          {stats?.societies?.pending > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              tab === 'applications' ? 'bg-zinc-950 text-amber-400' : 'bg-yellow-500 text-zinc-950'
            }`}>
              {stats.societies.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('societies')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
            tab === 'societies'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>All Societies ({stats?.societies?.total || 0})</span>
        </button>

        <button
          onClick={() => handleTabChange('users')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
            tab === 'users'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>All System Users ({stats?.users?.total || 0})</span>
        </button>
      </div>

      {/* Search Bar & Custom Dropdown Filter (High z-index so dropdown floats over table) */}
      <div className="glass-card p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#121214] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5 relative z-30">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              tab === 'applications' ? 'Search application by society name, address, submitter...' :
              tab === 'societies' ? 'Search society name, city, admin contact...' :
              'Search user name, email, phone, society...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* CUSTOM DROPDOWN: Societies Tab Filter */}
        {tab === 'societies' && (
          <div className="relative z-40" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700/80 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-amber-400 dark:hover:border-amber-500/50 transition cursor-pointer shadow-sm w-full sm:w-auto justify-between"
            >
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-zinc-400">Status:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 capitalize">
                  {societyStatusFilter === 'all' ? 'All Societies' : societyStatusFilter}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {statusDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => { setSocietyStatusFilter('all'); setPage(1); setStatusDropdownOpen(false); }}
                  className={`w-full px-3 py-2 text-left rounded-lg text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                    societyStatusFilter === 'all'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>All Societies</span>
                  {societyStatusFilter === 'all' && <Check className="w-3.5 h-3.5 text-amber-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => { setSocietyStatusFilter('approved'); setPage(1); setStatusDropdownOpen(false); }}
                  className={`w-full px-3 py-2 text-left rounded-lg text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                    societyStatusFilter === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Approved</span>
                  {societyStatusFilter === 'approved' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => { setSocietyStatusFilter('pending'); setPage(1); setStatusDropdownOpen(false); }}
                  className={`w-full px-3 py-2 text-left rounded-lg text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                    societyStatusFilter === 'pending'
                      ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Pending</span>
                  {societyStatusFilter === 'pending' && <Check className="w-3.5 h-3.5 text-yellow-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => { setSocietyStatusFilter('rejected'); setPage(1); setStatusDropdownOpen(false); }}
                  className={`w-full px-3 py-2 text-left rounded-lg text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                    societyStatusFilter === 'rejected'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Rejected</span>
                  {societyStatusFilter === 'rejected' && <Check className="w-3.5 h-3.5 text-rose-500" />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* CUSTOM DROPDOWN: Users Tab Role Filter */}
        {tab === 'users' && (
          <div className="relative z-40" ref={roleDropdownRef}>
            <button
              type="button"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700/80 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-amber-400 dark:hover:border-amber-500/50 transition cursor-pointer shadow-sm w-full sm:w-auto justify-between"
            >
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-zinc-400">Role:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {userRoleFilter === 'all' ? 'All Roles' :
                   userRoleFilter === '2' ? 'Society Admin' :
                   'Resident Member'}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => { setUserRoleFilter('all'); setPage(1); setRoleDropdownOpen(false); }}
                  className={`w-full px-3 py-2 text-left rounded-lg text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                    userRoleFilter === 'all'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>All Roles</span>
                  {userRoleFilter === 'all' && <Check className="w-3.5 h-3.5 text-amber-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => { setUserRoleFilter('2'); setPage(1); setRoleDropdownOpen(false); }}
                  className={`w-full px-3 py-2 text-left rounded-lg text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                    userRoleFilter === '2'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Society Admin</span>
                  {userRoleFilter === '2' && <Check className="w-3.5 h-3.5 text-amber-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => { setUserRoleFilter('3'); setPage(1); setRoleDropdownOpen(false); }}
                  className={`w-full px-3 py-2 text-left rounded-lg text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                    userRoleFilter === '3'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Resident Member</span>
                  {userRoleFilter === '3' && <Check className="w-3.5 h-3.5 text-amber-500" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab 1: Pending Applications */}
      {tab === 'applications' && (
        <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden bg-white/90 dark:bg-[#121214] relative z-10">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
              Loading pending applications...
            </div>
          ) : societies.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 text-xs">
              No pending society applications awaiting review.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
                <thead className="bg-zinc-100 dark:bg-[#18181b] text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Society Name</th>
                    <th className="px-6 py-4">Address</th>
                    <th className="px-6 py-4">Submitted By</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                  {societies.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-[#18181b]/50 transition">
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                        <div className="text-sm">{s.name}</div>
                        <div className="text-[11px] text-zinc-500">ID: #{s.id}</div>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs max-w-xs">
                        {s.address}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-xs">{s.submittedBy?.name || 'Administrator'}</div>
                        <div className="text-[11px] text-zinc-500">{s.submittedBy?.email} • {s.submittedBy?.phone || '—'}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveSociety(s.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve Society
                          </button>
                          <button
                            onClick={() => handleOpenRejectModal(s)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Server-Side Pagination Bar */}
          <PaginationBar
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Tab 2: All Societies */}
      {tab === 'societies' && (
        <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden bg-white/90 dark:bg-[#121214] relative z-10">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
              Loading societies...
            </div>
          ) : societies.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 text-xs">No societies found matching your search.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
                <thead className="bg-zinc-100 dark:bg-[#18181b] text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Society Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Admin Contact</th>
                    <th className="px-6 py-4">Invite Token</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                  {societies.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-[#18181b]/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900 dark:text-white text-xs">{s.name}</div>
                        <div className="text-[11px] text-zinc-400 truncate max-w-xs">{s.address}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          s.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' :
                          s.status === 'rejected' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800' :
                          'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {s.adminUser ? (
                          <div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-200">{s.adminUser.name}</div>
                            <div className="text-zinc-500">{s.adminUser.email}</div>
                          </div>
                        ) : <span className="text-zinc-400 dark:text-zinc-500 italic">None assigned</span>}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-amber-600 dark:text-amber-400">
                        {s.inviteLinkToken ? (
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[140px]">{s.inviteLinkToken}</span>
                            <button
                              onClick={() => copyToClipboard(`${window.location.origin}/register/${s.inviteLinkToken}`, 'Join link')}
                              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 cursor-pointer"
                              title="Copy resident join link"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Server-Side Pagination Bar */}
          <PaginationBar
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Tab 3: All Users */}
      {tab === 'users' && (
        <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden bg-white/90 dark:bg-[#121214] relative z-10">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 text-xs">No users found matching your search.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
                <thead className="bg-zinc-100 dark:bg-[#18181b] text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Society</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-[#18181b]/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900 dark:text-white text-xs">{u.name}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 1 ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800' :
                          u.role === 2 ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800' :
                          'bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                        }`}>
                          {ROLE_LABELS[u.role] || 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {u.society?.name || 'Platform Admin'}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        {u.phone || '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-zinc-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Server-Side Pagination Bar */}
          <PaginationBar
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

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
                  <span className="text-zinc-400 uppercase font-bold text-[10px] block">Admin Email</span>
                  <div className="text-amber-600 dark:text-amber-400 font-semibold">{selectedCreds.adminCredentials?.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedCreds.adminCredentials?.email, 'Admin Email')}
                  className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                  title="Copy Email"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-2">
                <div>
                  <span className="text-zinc-400 uppercase font-bold text-[10px] block">Temporary Password</span>
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{selectedCreds.adminCredentials?.temporaryPassword}</div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedCreds.adminCredentials?.temporaryPassword, 'Temporary Password')}
                  className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                  title="Copy Password"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-2">
                <div className="flex-1 pr-2">
                  <span className="text-zinc-400 uppercase font-bold text-[10px] block">Resident Join Token</span>
                  <div className="text-zinc-700 dark:text-zinc-300 truncate">{selectedCreds.inviteLinkToken}</div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${window.location.origin}/register/${selectedCreds.inviteLinkToken}`, 'Join Link')}
                  className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                  title="Copy Join Link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyAllCredentials}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 font-bold text-xs hover:opacity-95 transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copy All Credentials</span>
              </button>

              <button
                onClick={() => setSelectedCreds(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
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
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
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
              className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              disabled={rejectModal.submitting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
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
    <div className="flex items-center justify-between px-6 py-3.5 bg-zinc-50/50 dark:bg-[#18181b]/40 border-t border-zinc-200 dark:border-zinc-800/80 text-xs text-zinc-500 dark:text-zinc-400">
      <div>
        Page <span className="font-bold text-zinc-900 dark:text-white">{page}</span> of{' '}
        <span className="font-bold text-zinc-900 dark:text-white">{totalPages}</span> ({total} total records)
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-xs text-zinc-700 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-xs text-zinc-700 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
