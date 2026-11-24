import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { 
  Building2, 
  Users, 
  Car, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Copy, 
  RefreshCw, 
  QrCode, 
  Link as LinkIcon, 
  Search, 
  Eye, 
  Phone, 
  Mail, 
  Shield, 
  Download, 
  Share2, 
  FileText,
  Bike,
  Printer,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function SocietyAdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [inviteLink, setInviteLink] = useState(null);
  const [loading, setLoading] = useState(true);

  // Consolidated Tabs: 'vehicles', 'members', 'invite'
  const [activeTab, setActiveTab] = useState('vehicles');

  // Vehicle filters
  const [vehicleFilter, setVehicleFilter] = useState('all'); // 'all', 'pending', 'active'
  const [vehicleSearch, setVehicleSearch] = useState('');

  // Member filters
  const [memberFilter, setMemberFilter] = useState('all'); // 'all', 'pending', 'approved', 'suspended'
  const [memberSearch, setMemberSearch] = useState('');

  // Modals
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeQRData, setActiveQRData] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // In-App Action Reason Modal (Replaces browser window.prompt)
  const [reasonModal, setReasonModal] = useState({
    isOpen: false,
    type: null, // 'reject_vehicle' | 'revoke_qr' | 'reject_member'
    targetId: null,
    targetName: '',
    reason: '',
    submitting: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, membersRes, vehiclesRes, inviteRes] = await Promise.all([
        API.get('/society-admin/dashboard/stats'),
        API.get('/society-admin/members?limit=100'),
        API.get('/society-admin/vehicles'),
        API.get('/society/me/invite-link'),
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (membersRes.data?.success) setMembers(membersRes.data.data);
      if (vehiclesRes.data?.success) setVehicles(vehiclesRes.data.data);
      if (inviteRes.data?.success) setInviteLink(inviteRes.data.data);
    } catch (err) {
      toast.error('Failed to load society admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Member Actions
  const handleApproveMember = async (id) => {
    try {
      const res = await API.post(`/society-admin/members/${id}/approve`);
      if (res.data?.success) {
        toast.success('Resident member approved successfully.');
        if (selectedMember && selectedMember.id === id) {
          setSelectedMember({ ...selectedMember, status: 'approved' });
        }
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    }
  };

  const handleOpenRejectMember = (member) => {
    setReasonModal({
      isOpen: true,
      type: 'reject_member',
      targetId: member.id,
      targetName: member.name,
      reason: '',
      submitting: false
    });
  };

  const handleOpenSuspendMember = async (id, action = 'suspended') => {
    try {
      const res = await API.post(`/society-admin/members/${id}/reject`, { action });
      if (res.data?.success) {
        toast.success(`Member account ${action}.`);
        if (selectedMember && selectedMember.id === id) {
          setSelectedMember({ ...selectedMember, status: action });
        }
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  // Vehicle Actions
  const handleApproveVehicle = async (id, passType = 'regular') => {
    try {
      const res = await API.post(`/society-admin/vehicles/${id}/approve`, { passType });
      if (res.data?.success) {
        toast.success('Vehicle approved! Encrypted QR Pass issued.');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Vehicle approval failed.');
    }
  };

  const handleOpenRejectVehicle = (veh) => {
    setReasonModal({
      isOpen: true,
      type: 'reject_vehicle',
      targetId: veh.id,
      targetName: veh.vehicleNumber,
      reason: '',
      submitting: false
    });
  };

  const handleOpenRevokeQR = (veh) => {
    setReasonModal({
      isOpen: true,
      type: 'revoke_qr',
      targetId: veh.id,
      targetName: veh.vehicleNumber,
      reason: '',
      submitting: false
    });
  };

  // Submit In-App Reason Modal
  const handleConfirmReasonModal = async () => {
    const { type, targetId, reason } = reasonModal;
    if (!reason.trim()) {
      toast.error('Please enter a reason.');
      return;
    }

    setReasonModal(prev => ({ ...prev, submitting: true }));

    try {
      if (type === 'reject_vehicle') {
        const res = await API.post(`/society-admin/vehicles/${targetId}/reject`, { reason });
        if (res.data?.success) {
          toast.success('Vehicle rejected.');
          fetchData();
        }
      } else if (type === 'revoke_qr') {
        const res = await API.post(`/admin/vehicles/${targetId}/qr/revoke`, { reason });
        if (res.data?.success) {
          toast.success('QR Pass revoked successfully.');
          fetchData();
        }
      } else if (type === 'reject_member') {
        const res = await API.post(`/society-admin/members/${targetId}/reject`, { action: 'rejected', reason });
        if (res.data?.success) {
          toast.success('Member registration rejected.');
          if (selectedMember && selectedMember.id === targetId) {
            setSelectedMember(null);
          }
          fetchData();
        }
      }
      setReasonModal({ isOpen: false, type: null, targetId: null, targetName: '', reason: '', submitting: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
      setReasonModal(prev => ({ ...prev, submitting: false }));
    }
  };

  // View QR Data Modal
  const handleViewQR = async (vehicleId) => {
    try {
      const res = await API.get(`/society-admin/vehicles/${vehicleId}/qr`);
      if (res.data?.success) {
        setActiveQRData(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot retrieve QR pass.');
    }
  };

  // Rotate Invite Token
  const handleRotateInviteToken = async () => {
    if (!window.confirm('Are you sure you want to rotate the invite link? The old registration link will stop working immediately.')) {
      return;
    }
    try {
      const res = await API.get('/society/me/invite-link?rotate=true');
      if (res.data?.success) {
        setInviteLink(res.data.data);
        toast.success('Invite link rotated successfully!');
      }
    } catch (err) {
      toast.error('Failed to rotate invite token.');
    }
  };

  const copyInviteLink = () => {
    if (!inviteLink) return;
    const url = `${window.location.origin}/register/${inviteLink.inviteLinkToken}`;
    navigator.clipboard.writeText(url);
    toast.success('Member registration link copied to clipboard!');
  };

  // Filter computations
  const pendingMembers = members.filter(m => m.status === 'pending' && m.role !== 2);
  const pendingVehicles = vehicles.filter(v => v.status === 'pending');
  const activeVehicles = vehicles.filter(v => v.status === 'active');

  const filteredVehicles = vehicles.filter(v => {
    const matchesFilter = 
      vehicleFilter === 'all' ? true :
      vehicleFilter === 'pending' ? v.status === 'pending' :
      vehicleFilter === 'active' ? v.status === 'active' :
      v.status === vehicleFilter;

    const query = vehicleSearch.toLowerCase().trim();
    const matchesSearch = !query || 
      v.vehicleNumber?.toLowerCase().includes(query) ||
      v.owner?.name?.toLowerCase().includes(query) ||
      v.owner?.email?.toLowerCase().includes(query) ||
      v.owner?.phone?.includes(query);

    return matchesFilter && matchesSearch;
  });

  const filteredMembers = members.filter(m => {
    if (m.role === 2) return false; // Exclude Society Admin self

    const matchesFilter = 
      memberFilter === 'all' ? true :
      memberFilter === 'pending' ? m.status === 'pending' :
      memberFilter === 'approved' ? m.status === 'approved' :
      memberFilter === 'suspended' ? m.status === 'suspended' :
      m.status === memberFilter;

    const query = memberSearch.toLowerCase().trim();
    const matchesSearch = !query || 
      m.name?.toLowerCase().includes(query) ||
      m.email?.toLowerCase().includes(query) ||
      m.phone?.includes(query);

    return matchesFilter && matchesSearch;
  });

  const inviteUrl = inviteLink ? `${window.location.origin}/register/${inviteLink.inviteLinkToken}` : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Society Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Society Admin Portal
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Approve resident vehicles, issue encrypted windshield QR passes, and manage resident permits.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setActiveTab('invite')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs sm:text-sm hover:opacity-95 shadow-md shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Invite Residents</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards (Consistent compact & balanced sizing) */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
          <div 
            onClick={() => { setActiveTab('members'); setMemberFilter('all'); }}
            className="glass-card p-3 sm:p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214] cursor-pointer hover:border-amber-400/50 transition"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Residents</span>
              <Users className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">{stats.members.total}</div>
            <div className="text-[10px] font-semibold mt-0.5 flex items-center gap-1">
              {stats.members.pending > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-bold">⚡ {stats.members.pending} Pending Review</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">All Residents Verified</span>
              )}
            </div>
          </div>

          <div 
            onClick={() => { setActiveTab('vehicles'); setVehicleFilter('pending'); }}
            className={`glass-card p-3 sm:p-3.5 rounded-xl border cursor-pointer transition ${
              stats.vehicles.pending > 0 
                ? 'border-yellow-400/60 dark:border-yellow-500/40 bg-yellow-50/20 dark:bg-yellow-950/20' 
                : 'border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider">Pending Vehicles</span>
              <Car className="w-3.5 h-3.5 text-yellow-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">{stats.vehicles.pending}</div>
            <div className="text-[10px] text-yellow-700 dark:text-yellow-400 font-semibold mt-0.5">
              {stats.vehicles.pending > 0 ? 'Requires Admin Approval' : 'No pending vehicles'}
            </div>
          </div>

          <div 
            onClick={() => { setActiveTab('vehicles'); setVehicleFilter('active'); }}
            className="glass-card p-3 sm:p-3.5 rounded-xl border border-emerald-300/60 dark:border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 cursor-pointer hover:border-emerald-400 transition"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Active QR Passes</span>
              <QrCode className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.vehicles.active}</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Issued for windshields</div>
          </div>

          <div 
            onClick={() => setActiveTab('invite')}
            className="glass-card p-3 sm:p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214] cursor-pointer hover:border-amber-400/50 transition"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Gate Security</span>
              <Shield className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">Active</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Share QR join link</div>
          </div>
        </div>
      )}

      {/* Main Consolidated Navigation Tabs (3 Tabs) */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'vehicles'
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Vehicle Passes</span>
          {pendingVehicles.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'vehicles' ? 'bg-zinc-950 text-amber-400' : 'bg-yellow-500 text-zinc-950'
            }`}>
              {pendingVehicles.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'members'
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Residents & Members</span>
          {pendingMembers.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'members' ? 'bg-zinc-950 text-amber-400' : 'bg-yellow-500 text-zinc-950'
            }`}>
              {pendingMembers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('invite')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'invite'
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          <span>Member Invite & Gate Poster</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: VEHICLE PASSES & MANAGEMENT */}
      {/* ============================================================== */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          
          {/* Controls: Search and Status Sub-filters */}
          <div className="glass-card p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#121214] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vehicle number, resident name..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {/* Sub-filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setVehicleFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  vehicleFilter === 'all'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                All ({vehicles.length})
              </button>

              <button
                onClick={() => setVehicleFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  vehicleFilter === 'pending'
                    ? 'bg-yellow-500 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <span>Pending Review</span>
                {pendingVehicles.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                )}
                <span>({pendingVehicles.length})</span>
              </button>

              <button
                onClick={() => setVehicleFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  vehicleFilter === 'active'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Active QR Passes ({activeVehicles.length})
              </button>
            </div>
          </div>

          {/* Vehicles List */}
          {filteredVehicles.length === 0 ? (
            <div className="p-12 text-center glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#121214] text-zinc-500 dark:text-zinc-400 text-sm">
              <Car className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
              No vehicles found matching the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVehicles.map((v) => {
                const isPending = v.status === 'pending';
                const isActive = v.status === 'active';

                return (
                  <div
                    key={v.id}
                    className="glass-card p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214] flex flex-col justify-between transition hover:border-zinc-300 dark:hover:border-zinc-700"
                  >
                    <div>
                      {/* Top Bar: Plate Badge + Status */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        {/* Indian HSRP License Plate Mockup */}
                        <div className="inline-flex items-center bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-400 dark:border-zinc-600 rounded-lg px-2.5 py-1 shadow-sm">
                          <div className="flex flex-col items-center mr-2 border-r border-zinc-300 dark:border-zinc-700 pr-1.5">
                            <span className="text-[7px] font-black text-blue-600 leading-none">IND</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5" />
                          </div>
                          <span className="font-mono font-black text-zinc-950 dark:text-amber-400 text-sm tracking-wider uppercase">
                            {v.vehicleNumber}
                          </span>
                        </div>

                        {/* Status Tag */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60'
                            : isPending
                            ? 'bg-yellow-100 dark:bg-yellow-950/80 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800/60'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                        }`}>
                          {v.status === 'active' ? '● Active Pass' : v.status}
                        </span>
                      </div>

                      {/* Vehicle & Owner Details */}
                      <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-zinc-100 dark:border-zinc-800/80 mb-3">
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5">Vehicle Type</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize flex items-center gap-1">
                            {v.vehicleType === '2wheeler' ? <Bike className="w-3.5 h-3.5 text-amber-500" /> : <Car className="w-3.5 h-3.5 text-amber-500" />}
                            {v.vehicleType}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5">Resident / Owner</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                            {v.owner?.name || 'Resident'}
                          </span>
                          <span className="text-[11px] text-zinc-400 block font-mono">
                            {v.owner?.phone || v.owner?.email || '—'}
                          </span>
                        </div>
                      </div>

                      {/* RC Document Preview Button if exists */}
                      {v.documents && v.documents.length > 0 && (
                        <div className="mb-3">
                          <button
                            type="button"
                            onClick={() => setSelectedDocument(v.documents[0])}
                            className="w-full py-1.5 px-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-500" />
                            <span>View Registration Certificate (RC)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleApproveVehicle(v.id, 'regular')}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve Pass</span>
                          </button>

                          <button
                            onClick={() => handleOpenRejectVehicle(v)}
                            className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 hover:bg-rose-100 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {isActive && (
                        <>
                          <button
                            onClick={() => handleViewQR(v.id)}
                            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-xs hover:opacity-95 shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>View QR Pass</span>
                          </button>

                          <button
                            onClick={() => handleOpenRevokeQR(v)}
                            className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 hover:bg-rose-100 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            title="Revoke QR pass for lost/sold vehicle"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Revoke</span>
                          </button>
                        </>
                      )}

                      {!isPending && !isActive && (
                        <span className="text-zinc-400 text-xs italic">
                          Status: {v.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: RESIDENTS & MEMBERS */}
      {/* ============================================================== */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          
          {/* Controls: Search and Member status filter */}
          <div className="glass-card p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#121214] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search resident name, email, phone..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setMemberFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  memberFilter === 'all'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                All Residents ({members.filter(m => m.role !== 2).length})
              </button>

              <button
                onClick={() => setMemberFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  memberFilter === 'pending'
                    ? 'bg-yellow-500 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <span>Pending Approval</span>
                {pendingMembers.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                )}
                <span>({pendingMembers.length})</span>
              </button>

              <button
                onClick={() => setMemberFilter('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  memberFilter === 'approved'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Approved ({members.filter(m => m.status === 'approved' && m.role !== 2).length})
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white/90 dark:bg-[#121214]">
            {filteredMembers.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                No resident members found matching your search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
                  <thead className="bg-zinc-100 dark:bg-[#18181b] text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-6 py-4">Resident</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Vehicles</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {filteredMembers.map((m) => {
                      const isPending = m.status === 'pending';

                      return (
                        <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-[#18181b]/50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-zinc-950 font-bold text-xs shrink-0">
                                {m.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-zinc-900 dark:text-white text-sm">{m.name}</div>
                                <div className="text-[11px] text-zinc-500">ID: #{m.id}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-xs">
                            <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                              <Mail className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{m.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-500 mt-0.5 font-mono">
                              <Phone className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{m.phone || '—'}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              m.status === 'approved'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                : isPending
                                ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                            }`}>
                              {m.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-xs">
                            {m.vehicles && m.vehicles.length > 0 ? (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800/40">
                                🚗 {m.vehicles.length} {m.vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
                              </span>
                            ) : (
                              <span className="text-zinc-400 dark:text-zinc-500 italic text-xs">None</span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedMember(m)}
                                className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-amber-400 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-500" />
                                <span>Details</span>
                              </button>

                              {isPending && (
                                <button
                                  onClick={() => handleApproveMember(m.id)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: INVITE LINK & SECURITY GATE POSTER */}
      {/* ============================================================== */}
      {activeTab === 'invite' && inviteLink && (
        <div className="space-y-6 max-w-4xl mx-auto">
          
          {/* Section 1: Member Registration Invite Link */}
          <div className="glass-card p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#121214]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                    Member Registration Link
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    Share this unique onboarding link with society flat owners and tenants.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRotateInviteToken}
                className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Invalidate current link and generate a fresh security token"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Rotate Security Link
              </button>
            </div>

            {/* URL Input with Copy & WhatsApp actions */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 bg-transparent text-xs font-mono text-amber-600 dark:text-amber-400 focus:outline-none truncate px-1"
              />
              
              <div className="flex items-center gap-2">
                <button
                  onClick={copyInviteLink}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 text-xs font-bold hover:opacity-95 transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Dear Residents,\n\nPlease register your vehicles on the official QrParky portal for automated gate entry & encrypted windshield QR passes:\n\n👉 ${inviteUrl}\n\nThank you,\nSociety Committee`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share via WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active permanent link (Safe to share on society WhatsApp groups)</span>
            </div>
          </div>

          {/* Section 2: Printable Gate / Notice Board QR Poster */}
          <div className="glass-card p-6 sm:p-8 rounded-2xl border border-amber-300 dark:border-amber-500/30 bg-gradient-to-b from-white to-amber-50/20 dark:from-[#121214] dark:to-amber-950/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Printer className="w-4 h-4 text-amber-500" />
                  <span>Printable Notice Board / Security Gate Poster</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Print and hang this poster at the main security cabin or notice board so incoming residents can scan and register on the spot.
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs hover:opacity-90 transition flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Poster</span>
              </button>
            </div>

            {/* Poster Preview Frame */}
            <div className="p-6 rounded-2xl bg-white border-2 border-dashed border-amber-400 max-w-sm mx-auto text-center shadow-lg text-zinc-900">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-zinc-950 font-black text-xs">
                  QP
                </div>
                <span className="font-extrabold text-base tracking-tight text-zinc-900">QrParky Access</span>
              </div>

              <h4 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider mb-1">
                Resident Vehicle Registration
              </h4>
              <p className="text-[11px] text-zinc-600 mb-4 font-medium">
                Scan with phone camera to request windshield QR Pass
              </p>

              {/* QR Code image for the invite registration URL */}
              <div className="p-3 bg-zinc-50 rounded-xl inline-block border border-zinc-200 shadow-inner mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}`}
                  alt="Registration QR Code"
                  className="w-40 h-40 rounded"
                />
              </div>

              <div className="text-[10px] text-zinc-500 space-y-1">
                <div className="font-bold text-zinc-800">3 Simple Steps:</div>
                <div>1. Scan QR with your smartphone camera</div>
                <div>2. Fill flat number & vehicle plate details</div>
                <div>3. Collect approved windshield pass from admin</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Full Member Profile Details */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title="Resident Profile Details"
      >
        {selectedMember && (
          <div className="space-y-4 py-1">
            
            {/* Header info */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-zinc-950 font-black text-base">
                {selectedMember.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-base font-bold text-zinc-900 dark:text-white">{selectedMember.name}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{selectedMember.email}</div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                selectedMember.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' :
                selectedMember.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800' :
                'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
              }`}>
                {selectedMember.status}
              </span>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Phone Number</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-white">{selectedMember.phone || 'Not provided'}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Registered On</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{new Date(selectedMember.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Vehicles Registered by this Member */}
            <div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" />
                <span>Registered Vehicles ({selectedMember.vehicles?.length || 0})</span>
              </div>

              {selectedMember.vehicles && selectedMember.vehicles.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedMember.vehicles.map((veh) => (
                    <div key={veh.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono font-bold text-zinc-900 dark:text-white text-sm">{veh.vehicleNumber}</div>
                        <div className="text-zinc-500 capitalize">{veh.vehicleType}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          veh.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 border border-yellow-300'
                        }`}>
                          {veh.status}
                        </span>

                        {veh.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMember(null);
                              handleViewQR(veh.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 text-[11px] font-bold hover:bg-amber-200 transition flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode className="w-3 h-3" /> Get QR
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400 italic">
                  This resident has not registered any vehicles yet.
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
              {selectedMember.status === 'approved' ? (
                <button
                  type="button"
                  onClick={() => handleOpenSuspendMember(selectedMember.id, 'suspended')}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
                >
                  Suspend Account
                </button>
              ) : selectedMember.status === 'suspended' ? (
                <button
                  type="button"
                  onClick={() => handleApproveMember(selectedMember.id)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
                >
                  Re-Activate Resident
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenRejectMember(selectedMember)}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveMember(selectedMember.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
                  >
                    Approve Resident
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: Official Society Access QR Pass Viewer */}
      {/* ============================================================== */}
      <Modal
        isOpen={!!activeQRData}
        onClose={() => setActiveQRData(null)}
        title="Official Society QR Vehicle Pass"
      >
        {activeQRData && (
          <div className="space-y-4 text-center">
            
            {/* Digital Pass Card */}
            <div className="relative rounded-2xl p-4 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-[#18181b] dark:to-[#121214] border border-amber-400/40 dark:border-amber-500/30 shadow-lg text-center">
              
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800/60">
                  {activeQRData.societyName}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800/60">
                  ● ACTIVE PASS
                </span>
              </div>

              {/* Vehicle Number & Info */}
              <div className="mb-3">
                <div className="text-xl font-black font-mono tracking-wider text-zinc-900 dark:text-white">
                  {activeQRData.vehicleNumber}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                  {activeQRData.ownerName} • <span className="capitalize">{activeQRData.vehicleType}</span>
                </div>
              </div>

              {/* QR Image Box */}
              <div className="p-3 bg-white rounded-xl max-w-[170px] mx-auto shadow-inner border border-zinc-200">
                <img
                  src={activeQRData.qrImageUrl}
                  alt={`QR Pass for ${activeQRData.vehicleNumber}`}
                  className="w-full h-auto rounded"
                />
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                <span>🛡️ Windshield Pass</span>
                <span>ID: #{activeQRData.vehicleId || 'QP'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <a
                href={activeQRData.qrImageUrl}
                download={`QrParky_${activeQRData.vehicleNumber}.png`}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 font-bold text-xs hover:opacity-95 shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Printable Pass (PNG)
              </a>

              {activeQRData.ownerPhone && (
                <a
                  href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(activeQRData.ownerPhone)}&text=${encodeURIComponent(
                    `Hello ${activeQRData.ownerName},\n\nYour official vehicle access pass for ${activeQRData.vehicleNumber} at ${activeQRData.societyName} is approved and active!\n\nPlease find your QR Pass in your QrParky portal.\n\nThank you,\n${activeQRData.societyName} Committee`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" /> Send Pass to WhatsApp ({activeQRData.ownerPhone})
                </a>
              )}
            </div>

          </div>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: In-App Reason Modal (Replaces browser window.prompt) */}
      {/* ============================================================== */}
      <Modal
        isOpen={reasonModal.isOpen}
        onClose={() => setReasonModal(prev => ({ ...prev, isOpen: false }))}
        title={
          reasonModal.type === 'reject_vehicle' ? 'Reject Vehicle Registration' :
          reasonModal.type === 'revoke_qr' ? 'Revoke QR Vehicle Pass' :
          'Reject Member Registration'
        }
      >
        <div className="space-y-4 py-1">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span>You are taking action on: </span>
              <strong className="font-mono">{reasonModal.targetName}</strong>.
              <span className="block text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                Please provide a clear reason so the resident understands the issue.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Reason / Explanation <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Invalid RC document uploaded, Vehicle not allotted dedicated parking, Sold/transferred..."
              value={reasonModal.reason}
              onChange={(e) => setReasonModal(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-amber-500 transition resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setReasonModal(prev => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReasonModal}
              disabled={reasonModal.submitting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              {reasonModal.submitting ? 'Processing...' : 'Confirm Action'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: Vehicle RC Document Viewer */}
      {/* ============================================================== */}
      <Modal 
        isOpen={!!selectedDocument} 
        onClose={() => setSelectedDocument(null)} 
        title="Vehicle Registration Certificate (RC) Preview"
      >
        {selectedDocument && (
          <div className="space-y-4 text-center">
            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 p-2 bg-zinc-50 dark:bg-zinc-900">
              <img src={selectedDocument} alt="Vehicle RC" className="max-w-full h-auto mx-auto rounded-xl shadow-md" />
            </div>
            <button
              onClick={() => setSelectedDocument(null)}
              className="px-6 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
            >
              Close Preview
            </button>
          </div>
        )}
      </Modal>

    </div>
  );
}
