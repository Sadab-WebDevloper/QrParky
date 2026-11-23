import React, { useState, useEffect } from 'react';
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
  History, 
  CreditCard,
  Search,
  Eye,
  Phone,
  Mail,
  Calendar,
  Shield,
  Download,
  Share2,
  ExternalLink,
  FileText
} from 'lucide-react';

export default function SocietyAdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [inviteLink, setInviteLink] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all-members'); // 'all-members', 'pending-members', 'vehicles', 'active', 'invite'
  
  // Member Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('all');

  // Selected Member Details Modal State
  const [selectedMember, setSelectedMember] = useState(null);

  // Active QR Pass Viewer Modal State
  const [activeQRData, setActiveQRData] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, membersRes, vehiclesRes, inviteRes, logsRes] = await Promise.all([
        API.get('/society-admin/dashboard/stats'),
        API.get('/society-admin/members?limit=100'),
        API.get('/society-admin/vehicles'),
        API.get('/society/me/invite-link'),
        API.get('/society-admin/audit-logs'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (membersRes.data.success) setMembers(membersRes.data.data);
      if (vehiclesRes.data.success) setVehicles(vehiclesRes.data.data);
      if (inviteRes.data.success) setInviteLink(inviteRes.data.data);
      if (logsRes.data.success) setAuditLogs(logsRes.data.data);
    } catch (err) {
      toast.error('Failed to load society admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveMember = async (id) => {
    try {
      const res = await API.post(`/society-admin/members/${id}/approve`);
      if (res.data.success) {
        toast.success('Member approved successfully.');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    }
  };

  const handleRejectMember = async (id, action = 'rejected') => {
    try {
      const res = await API.post(`/society-admin/members/${id}/reject`, { action });
      if (res.data.success) {
        toast.success(`Member ${action} successfully.`);
        if (selectedMember && selectedMember.id === id) {
          setSelectedMember(null);
        }
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const handleApproveVehicle = async (id, passType = 'regular') => {
    try {
      const res = await API.post(`/society-admin/vehicles/${id}/approve`, { passType });
      if (res.data.success) {
        toast.success(
          passType === 'regular'
            ? 'Regular QR Pass generated and issued instantly!'
            : 'Vehicle approved for Professional Pass. Member can now complete checkout.'
        );
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    }
  };

  const handleRejectVehicle = async (id) => {
    const reason = prompt('Reason for rejecting vehicle:');
    if (!reason) return;

    try {
      const res = await API.post(`/society-admin/vehicles/${id}/reject`, { reason });
      if (res.data.success) {
        toast.success('Vehicle rejected.');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed.');
    }
  };

  const handleRevokeQR = async (vehicleId) => {
    const reason = prompt('Reason for revoking QR code (e.g. Lost sticker, Stolen vehicle, Sold):');
    if (!reason) return;

    try {
      const res = await API.post(`/admin/vehicles/${vehicleId}/qr/revoke`, { reason });
      if (res.data.success) {
        toast.success('QR Code revoked successfully!');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Revocation failed.');
    }
  };

  const handleViewQR = async (vehicleId) => {
    setLoadingQR(true);
    try {
      const res = await API.get(`/society-admin/vehicles/${vehicleId}/qr`);
      if (res.data.success) {
        setActiveQRData(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot access QR Code vault for this vehicle.');
    } finally {
      setLoadingQR(false);
    }
  };

  const handleRotateInviteToken = async () => {
    try {
      const res = await API.get('/society/me/invite-link?rotate=true');
      if (res.data.success) {
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

  const pendingMembers = members.filter((m) => m.status === 'pending' && m.role !== 2);
  const pendingVehicles = vehicles.filter((v) => v.status === 'pending');

  // Filtered members for the All Members tab (excluding Society Admin role)
  const filteredMembers = members.filter((m) => {
    if (m.role === 2) return false;

    const matchesSearch = 
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone?.includes(searchQuery);
    
    const matchesStatus = 
      memberStatusFilter === 'all' || m.status === memberStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" /> Society Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Society Admin Portal</h1>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="glass-card p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Registered Members</span>
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">{stats.members.total}</div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">{stats.members.pending} Pending Review</div>
          </div>

          <div className="glass-card p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pending Vehicles</span>
              <Car className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">{stats.vehicles.pending}</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Review Required</div>
          </div>

          <div className="glass-card p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Awaiting Payment</span>
              <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">{stats.vehicles.awaitingPayment}</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Approved by Admin</div>
          </div>

          <div className="glass-card p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Active Passes</span>
              <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">{stats.vehicles.active}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Issued QR Codes</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-3 mb-6">
        <button
          onClick={() => setTab('all-members')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            tab === 'all-members'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Registered Members ({members.filter(m => m.role !== 2).length})
        </button>

        <button
          onClick={() => setTab('pending-members')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            tab === 'pending-members'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          Pending Approvals ({pendingMembers.length})
        </button>

        <button
          onClick={() => setTab('vehicles')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            tab === 'vehicles'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          <Car className="w-3.5 h-3.5" /> Pending Vehicles ({pendingVehicles.length})
        </button>

        <button
          onClick={() => setTab('active')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            tab === 'active'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" /> Active QR Passes & Download ({vehicles.filter(v => v.status === 'active').length})
        </button>

        <button
          onClick={() => setTab('invite')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            tab === 'invite'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" /> Join Link
        </button>
      </div>

      {/* Tab 1: ALL REGISTERED MEMBERS (Comprehensive View) */}
      {tab === 'all-members' && (
        <div className="space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-card p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214]">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search member name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Status:</span>
              <select
                value={memberStatusFilter}
                onChange={(e) => setMemberStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
              >
                <option value="all">All Status ({members.filter(m => m.role !== 2).length})</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending Review</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-[#121214]">
            {filteredMembers.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                No members found matching your search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
                  <thead className="bg-zinc-100 dark:bg-[#18181b] text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-6 py-4">Member Name</th>
                      <th className="px-6 py-4">Contact Info</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Vehicles Registered</th>
                      <th className="px-6 py-4">Registration Date</th>
                      <th className="px-6 py-4 text-right">Details & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-[#18181b]/50 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-zinc-900 dark:text-white text-sm">{m.name}</div>
                          <div className="text-[11px] text-zinc-500">ID: #{m.id}</div>
                        </td>

                        <td className="px-6 py-4 text-xs">
                          <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-200">
                            <Mail className="w-3.5 h-3.5 text-zinc-400" />
                            {m.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-500 mt-0.5 font-mono">
                            <Phone className="w-3.5 h-3.5 text-zinc-400" />
                            {m.phone || '—'}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            m.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' :
                            m.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800' :
                            'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                          }`}>
                            {m.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs">
                          {m.vehicles && m.vehicles.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800/40">
                                🚗 {m.vehicles.length} {m.vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
                              </span>
                            </div>
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
                              <Eye className="w-3.5 h-3.5 text-amber-500" /> View Profile
                            </button>

                            {m.status === 'pending' && (
                              <button
                                onClick={() => handleApproveMember(m.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Pending Members Approval */}
      {tab === 'pending-members' && (
        <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-[#121214]">
          {pendingMembers.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 text-sm">No pending member registration requests.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
                <thead className="bg-zinc-100 dark:bg-[#18181b] text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Registration Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                  {pendingMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-[#18181b]/50 transition">
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">{m.name}</td>
                      <td className="px-6 py-4 text-xs">
                        <div className="text-zinc-900 dark:text-zinc-200">{m.email}</div>
                        <div className="text-zinc-500">{m.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400">{new Date(m.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveMember(m.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve Member
                          </button>
                          <button
                            onClick={() => handleRejectMember(m.id, 'rejected')}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 hover:bg-rose-100 dark:hover:bg-rose-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
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
        </div>
      )}

      {/* Tab 3: Pending Vehicles */}
      {tab === 'vehicles' && (
        <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-[#121214]">
          {pendingVehicles.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 text-sm">No pending vehicle approval requests.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
                <thead className="bg-zinc-100 dark:bg-[#18181b] text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Vehicle Number</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Requested Pass</th>
                    <th className="px-6 py-4">RC Document</th>
                    <th className="px-6 py-4">Owner Member</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                  {pendingVehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-zinc-50 dark:hover:bg-[#18181b]/50 transition">
                      <td className="px-6 py-4 font-mono font-bold text-zinc-900 dark:text-amber-400 text-base">{v.vehicleNumber}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-zinc-600 dark:text-zinc-300 capitalize">{v.vehicleType}</td>
                      <td className="px-6 py-4 text-xs">
                        {v.passType === 'professional' ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 font-bold">
                            💎 Professional (₹499)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-[#18181b] text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 font-bold">
                            🟢 Regular (Free)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {v.documents && v.documents.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedDocument(v.documents[0])}
                            className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950 font-bold text-[11px] flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 transition"
                          >
                            <FileText className="w-3.5 h-3.5" /> View RC
                          </button>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600 italic text-[11px]">Not provided</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-200">{v.owner?.name}</div>
                        <div className="text-zinc-500">{v.owner?.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveVehicle(v.id, 'regular')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Generate and issue encrypted QR pass immediately with ₹0 fee"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Issue Regular QR (Free)
                          </button>

                          <button
                            onClick={() => handleApproveVehicle(v.id, 'professional')}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 hover:bg-amber-100 dark:hover:bg-amber-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Approve as Professional Pass (requires member payment before activation)"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Approve as Pro (Paid)
                          </button>

                          <button
                            onClick={() => handleRejectVehicle(v.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 hover:bg-rose-100 dark:hover:bg-rose-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
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
        </div>
      )}

      {/* Tab 4: Active Passes & Revocation & Direct QR Download */}
      {tab === 'active' && (
        <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-[#121214]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
              <thead className="bg-zinc-100 dark:bg-[#18181b] text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Vehicle Number</th>
                  <th className="px-6 py-4">Pass Tier</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Owner Member</th>
                  <th className="px-6 py-4">QR Pass Actions</th>
                  <th className="px-6 py-4 text-right">Revoke / Security</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-zinc-50 dark:hover:bg-[#18181b]/50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-zinc-900 dark:text-white text-base">{v.vehicleNumber}</td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      {v.passType === 'professional' ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">💎 Professional</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">🟢 Regular</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                        v.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' :
                        v.status === 'awaiting_payment' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800' :
                        v.status === 'expired' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800' :
                        'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                      <div>{v.owner?.name}</div>
                      <div className="text-zinc-500 font-normal">{v.owner?.phone || v.owner?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {v.status === 'active' ? (
                        <button
                          onClick={() => handleViewQR(v.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 text-xs font-bold hover:opacity-95 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" /> View & Download QR
                        </button>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-500 italic">Activation required</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {v.qrCode && v.qrCode.isActive && (
                        <button
                          onClick={() => handleRevokeQR(v.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 hover:bg-rose-100 dark:hover:bg-rose-500/30 text-xs font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Revoke Pass
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Join Link Generator */}
      {tab === 'invite' && inviteLink && (
        <div className="glass-card p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-2xl mx-auto text-center bg-white/90 dark:bg-[#121214]">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-4">
            <LinkIcon className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Member Registration Invite Link</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-6">Share this link with resident members to allow them to register accounts under your society.</p>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 mb-6">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/register/${inviteLink.inviteLinkToken}`}
              className="flex-1 bg-transparent text-xs font-mono text-amber-600 dark:text-amber-400 focus:outline-none truncate"
            />
            <button
              onClick={copyInviteLink}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 text-xs font-bold hover:opacity-95 transition flex items-center gap-1.5 shrink-0 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Link
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Permanent Link (Active until you click refresh)
            </span>
            <button
              onClick={handleRotateInviteToken}
              className="text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1.5 cursor-pointer"
              title="Click to generate a fresh link and revoke the old link"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Rotate & Revoke Old Link
            </button>
          </div>
        </div>
      )}

      {/* Modal 1: Full Member Profile & Vehicle Details */}
      <Modal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title="Member Profile Details"
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

            {/* Contact & Meta Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Phone Number</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-white">{selectedMember.phone || 'Not provided'}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Joined Date</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{new Date(selectedMember.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Registered Vehicles List with Direct QR Access */}
            <div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" /> Registered Vehicles ({selectedMember.vehicles?.length || 0})
              </div>

              {selectedMember.vehicles && selectedMember.vehicles.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedMember.vehicles.map((veh) => (
                    <div key={veh.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono font-bold text-zinc-900 dark:text-white text-sm">{veh.vehicleNumber}</div>
                        <div className="text-zinc-500 capitalize">{veh.vehicleType} • {veh.passType} Pass</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          veh.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300' :
                          veh.status === 'awaiting_payment' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-300' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 border border-yellow-300'
                        }`}>
                          {veh.status}
                        </span>

                        {veh.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => handleViewQR(veh.id)}
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
                  This member has not registered any vehicles yet.
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
              {selectedMember.status === 'approved' ? (
                <button
                  type="button"
                  onClick={() => handleRejectMember(selectedMember.id, 'suspended')}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
                >
                  Suspend Member Account
                </button>
              ) : selectedMember.status === 'suspended' ? (
                <button
                  type="button"
                  onClick={() => handleApproveMember(selectedMember.id)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
                >
                  Re-Activate Member
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleApproveMember(selectedMember.id);
                    setSelectedMember(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
                >
                  Approve Registration
                </button>
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

      {/* Modal 2: Official Society Access QR Pass Viewer & External Dispatch Modal */}
      <Modal
        isOpen={!!activeQRData}
        onClose={() => setActiveQRData(null)}
        title="Official Society QR Vehicle Pass"
      >
        {activeQRData && (
          <div className="space-y-3.5 text-center">
            
            {/* Digital Pass Card (Windshield Pass Preview) */}
            <div className="relative rounded-2xl p-4 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-[#18181b] dark:to-[#121214] border border-amber-400/40 dark:border-amber-500/30 shadow-lg text-center">
              
              {/* Top Banner */}
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5 mb-3">
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
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {activeQRData.ownerName} • <span className="capitalize">{activeQRData.vehicleType}</span> ({activeQRData.passType === 'professional' ? '💎 Pro' : '🟢 Regular'})
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

              {/* Card Footer Tag */}
              <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                <span>🛡️ Windshield Pass</span>
                <span>ID: #{activeQRData.vehicleId || 'QP'}</span>
              </div>
            </div>

            {/* Compact Token Box with Copy Action */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-500">
              <span className="truncate max-w-[260px] text-left">
                Token: <strong className="text-amber-600 dark:text-amber-400">{activeQRData.payloadEncrypted}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeQRData.payloadEncrypted);
                  toast.success('Signature token copied!');
                }}
                className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 shrink-0 cursor-pointer"
                title="Copy Signature Token"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              
              {/* 1. Download QR PNG */}
              <a
                href={activeQRData.qrImageUrl}
                download={`QrParky_${activeQRData.vehicleNumber}.png`}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 font-bold text-xs hover:opacity-95 shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Printable Pass (PNG)
              </a>

              {/* 2. WhatsApp Direct Dispatch */}
              {activeQRData.ownerPhone && (
                <a
                  href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(activeQRData.ownerPhone)}&text=${encodeURIComponent(
                    `Hello ${activeQRData.ownerName},\n\nYour official vehicle access pass for ${activeQRData.vehicleNumber} at ${activeQRData.societyName} is ready and approved!\n\nPlease find your QR Pass details attached or login to your QrParky portal.\n\nThank you,\n${activeQRData.societyName} Committee`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" /> Send Pass to WhatsApp ({activeQRData.ownerPhone})
                </a>
              )}

              {/* 3. Copy Details */}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `QrParky Vehicle Pass for ${activeQRData.vehicleNumber} (${activeQRData.societyName})\nOwner: ${activeQRData.ownerName}\nPass Type: ${activeQRData.passType}\nToken: ${activeQRData.payloadEncrypted}`
                  );
                  toast.success('Pass details copied to clipboard!');
                }}
                className="w-full py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Pass Text
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* RC Document Viewer Modal */}
      <Modal isOpen={!!selectedDocument} onClose={() => setSelectedDocument(null)} title="Vehicle Registration Certificate (RC) Preview">
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
