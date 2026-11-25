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
  Clock
} from 'lucide-react';
import { ROLE_LABELS } from '../constants/roles';

export default function SuperAdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('applications'); // 'applications', 'societies', 'users', 'support'

  // Dedicated data states per tab to eliminate cross-tab bleeding
  const [applications, setApplications] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [users, setUsers] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);

  // Server-side Pagination states per tab
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown Filter States
  const [societyStatusFilter, setSocietyStatusFilter] = useState('all'); // 'all', 'approved', 'pending', 'rejected'
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all', '1' (Super Admin), '2' (Society Admin), '3' (Resident Member)

  // Custom Dropdown UI States
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const roleDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setRoleDropdownOpen(false);
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
    const reqId = ++requestIdRef.current;
    setLoading(true);

    try {
      if (tab === 'applications') {
        const res = await API.get(`/admin/societies?status=pending&page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}`);
        if (reqId !== requestIdRef.current) return;
        if (res.data?.success) {
          setApplications(res.data.data || []);
          setPagination(res.data.meta || { total: res.data.data?.length || 0, page: 1, limit: 10, totalPages: 1 });
        }
      } else if (tab === 'societies') {
        const statusParam = societyStatusFilter === 'all' ? '' : `&status=${societyStatusFilter}`;
        const res = await API.get(`/admin/societies?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}${statusParam}`);
        if (reqId !== requestIdRef.current) return;
        if (res.data?.success) {
          setSocieties(res.data.data || []);
          setPagination(res.data.meta || { total: res.data.data?.length || 0, page: 1, limit: 10, totalPages: 1 });
        }
      } else if (tab === 'users') {
        const roleParam = userRoleFilter === 'all' ? '' : `&role=${userRoleFilter}`;
        const res = await API.get(`/admin/users?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}${roleParam}`);
        if (reqId !== requestIdRef.current) return;
        if (res.data?.success) {
          setUsers(res.data.data || []);
          setPagination(res.data.meta || { total: res.data.data?.length || 0, page: 1, limit: 10, totalPages: 1 });
        }
      } else if (tab === 'support') {
        const res = await API.get(`/admin/support-feedback?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}`);
        if (reqId !== requestIdRef.current) return;
        if (res.data?.success) {
          setSupportMessages(res.data.data || []);
          setPagination(res.data.meta || { total: res.data.data?.length || 0, page: 1, limit: 10, totalPages: 1 });
        }
      }
    } catch (err) {
      if (reqId === requestIdRef.current) {
        toast.error('Failed to load table entries.');
      }
    } finally {
      if (reqId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Re-fetch when tab, page, or filters change
  useEffect(() => {
    fetchTabData();
  }, [tab, page, societyStatusFilter, userRoleFilter]);

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

        {/* <button
          onClick={() => { fetchStats(); fetchTabData(); }}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          title="Refresh platform statistics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button> */}
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

        <button
          onClick={() => handleTabChange('support')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
            tab === 'support'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Support Inquiries</span>
        </button>
      </div>

      {/* Search Bar & Custom Design-Colored Dropdown Filter */}
      <div className="glass-card p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#121214] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5 relative z-30">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              tab === 'applications' ? 'Search application by society name, address, submitter...' :
              tab === 'societies' ? 'Search society name, city, admin contact...' :
              tab === 'support' ? 'Search support messages by sender, contact, category...' :
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
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {statusDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-1.5 z-50 animate-dropdown">
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
                      className={`w-full px-3 py-2 text-left rounded-xl text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-amber-600 dark:hover:text-amber-400'
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
                   userRoleFilter === '1' ? 'Super Admin' :
                   userRoleFilter === '2' ? 'Society Admin' :
                   'Resident Member'}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-1.5 z-50 animate-dropdown">
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
                      className={`w-full px-3 py-2 text-left rounded-xl text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-amber-600 dark:hover:text-amber-400'
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
        )}
      </div>

      {/* Tab 1: Pending Applications */}
      {tab === 'applications' && (
        <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden bg-white/90 dark:bg-[#121214] relative z-10 min-h-[420px] flex flex-col justify-between">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
              <thead className="bg-zinc-100 dark:bg-[#18181b] text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Society Name</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Submitted By</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeleton cols={4} rows={4} />
              ) : applications.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={4} className="p-16 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                      No pending society applications awaiting review.
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                  {applications.map((s) => (
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
              )}
            </table>
          </div>

          {/* Mobile Box/Card View */}
          <div className="sm:hidden">
            {loading ? (
              <CardSkeleton count={3} />
            ) : applications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                No pending society applications awaiting review.
              </div>
            ) : (
              <div className="space-y-3 p-3">
                {applications.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#141416] shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-white text-sm">{s.name}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">ID: #{s.id}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800 shrink-0">
                        Pending
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{s.address}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 text-xs space-y-1">
                      <div className="text-[10px] uppercase font-bold text-zinc-400">Submitted By</div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-200">{s.submittedBy?.name || 'Administrator'}</div>
                      <div className="flex flex-col gap-0.5 text-[11px] text-zinc-500 font-mono">
                        <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-zinc-400" />{s.submittedBy?.email}</span>
                        {s.submittedBy?.phone && (
                          <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-zinc-400" />{s.submittedBy?.phone}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleApproveSociety(s.id)}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleOpenRejectModal(s)}
                        className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 hover:bg-rose-100 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
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
        <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden bg-white/90 dark:bg-[#121214] relative z-10 min-h-[420px] flex flex-col justify-between">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
              <thead className="bg-zinc-100 dark:bg-[#18181b] text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Society Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Admin Contact</th>
                  <th className="px-6 py-4">Invite Token</th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeleton cols={4} rows={4} />
              ) : societies.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={4} className="p-16 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                      No societies found matching your search.
                    </td>
                  </tr>
                </tbody>
              ) : (
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
              )}
            </table>
          </div>

          {/* Mobile Box/Card View */}
          <div className="sm:hidden">
            {loading ? (
              <CardSkeleton count={3} />
            ) : societies.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                No societies found matching your search.
              </div>
            ) : (
              <div className="space-y-3 p-3">
                {societies.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#141416] shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-white text-sm">{s.name}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">ID: #{s.id}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        s.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' :
                        s.status === 'rejected' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800' :
                        'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                      }`}>
                        {s.status}
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{s.address}</span>
                    </div>

                    {s.adminUser && (
                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 text-xs space-y-0.5">
                        <div className="text-[10px] uppercase font-bold text-zinc-400">Society Admin</div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-200">{s.adminUser.name}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">{s.adminUser.email}</div>
                      </div>
                    )}

                    {s.inviteLinkToken && (
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-zinc-400 font-mono truncate max-w-[180px]">
                          Token: <span className="text-amber-600 dark:text-amber-400 font-bold">{s.inviteLinkToken}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(`${window.location.origin}/register/${s.inviteLinkToken}`, 'Join link')}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-400/20 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy Link</span>
                        </button>
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
        <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden bg-white/90 dark:bg-[#121214] relative z-10 min-h-[420px] flex flex-col justify-between">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
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
              {loading ? (
                <TableSkeleton cols={5} rows={4} />
              ) : users.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={5} className="p-16 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                      No users found matching your search.
                    </td>
                  </tr>
                </tbody>
              ) : (
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
              )}
            </table>
          </div>

          {/* Mobile Box/Card View */}
          <div className="sm:hidden">
            {loading ? (
              <CardSkeleton count={3} />
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                No users found matching your search.
              </div>
            ) : (
              <div className="space-y-3 p-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#141416] shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-white text-sm">{u.name}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{u.email}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        u.role === 1 ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800' :
                        u.role === 2 ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800' :
                        'bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                      }`}>
                        {ROLE_LABELS[u.role] || 'User'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-zinc-100 dark:border-zinc-800/80">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5">Society</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                          {u.society?.name || 'Platform Admin'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5">Phone</span>
                        <span className="font-mono text-zinc-700 dark:text-zinc-300 block">
                          {u.phone || '—'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-500" />
                        <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                      </span>
                      <span className="font-mono text-[10px]">ID: #{u.id}</span>
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
        <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden bg-white/90 dark:bg-[#121214] relative z-10 min-h-[420px] flex flex-col justify-between">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
              <thead className="bg-zinc-100 dark:bg-[#18181b] text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Sender</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4 text-right">Received</th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeleton cols={5} rows={4} />
              ) : supportMessages.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={5} className="p-16 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                      No support inquiries or feedback received yet.
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                  {supportMessages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-zinc-50 dark:hover:bg-[#18181b]/50 transition">
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white text-xs">
                        {msg.name}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-semibold text-zinc-800 dark:text-zinc-200">{msg.emailOrPhone}</div>
                        {msg.emailOrPhone?.includes('@') && (
                          <a
                            href={`mailto:${msg.emailOrPhone}?subject=Re:%20QR%20Parky%20Support%20Inquiry`}
                            className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Mail className="w-3 h-3" /> Reply via Email
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          msg.category === 'issue' || msg.category === 'bug' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800' :
                          msg.category === 'feature' ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-800' :
                          msg.category === 'suggestion' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800' :
                          'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                        }`}>
                          {msg.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-700 dark:text-zinc-300 max-w-md whitespace-pre-wrap leading-relaxed">
                        {msg.message || <span className="text-zinc-400 italic">No message body provided</span>}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-zinc-500 whitespace-nowrap">
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
                No support inquiries or feedback received yet.
              </div>
            ) : (
              <div className="space-y-3 p-3">
                {supportMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#141416] shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-white text-sm">{msg.name}</div>
                        <div className="text-[11px] text-zinc-500">{msg.emailOrPhone}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        msg.category === 'issue' || msg.category === 'bug' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800' :
                        msg.category === 'feature' ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-800' :
                        msg.category === 'suggestion' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800' :
                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                      }`}>
                        {msg.category || 'General'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {msg.message || <span className="text-zinc-400 italic">No message body provided</span>}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>{new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>

                      {msg.emailOrPhone?.includes('@') && (
                        <a
                          href={`mailto:${msg.emailOrPhone}?subject=Re:%20QR%20Parky%20Support%20Inquiry`}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-400/20 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
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

/**
 * Reusable Stable Table Skeleton Rows (Prevents layout shift and table flickering)
 */
function TableSkeleton({ cols = 4, rows = 4 }) {
  return (
    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="hover:bg-transparent">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="px-6 py-4">
              <div 
                className="h-4 bg-zinc-200/70 dark:bg-zinc-800/80 rounded-md animate-pulse"
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
