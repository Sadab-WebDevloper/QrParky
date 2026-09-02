import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { Building2, Users, Car, CheckCircle2, XCircle, ShieldAlert, Copy, RefreshCw, QrCode, Link as LinkIcon, History } from 'lucide-react';

export default function SocietyAdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [inviteLink, setInviteLink] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('members'); // 'members', 'vehicles', 'active', 'invite', 'audit'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, membersRes, vehiclesRes, inviteRes, logsRes] = await Promise.all([
        API.get('/society-admin/dashboard/stats'),
        API.get('/society-admin/members'),
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

  const handleRejectMember = async (id) => {
    try {
      const res = await API.post(`/society-admin/members/${id}/reject`, { action: 'rejected' });
      if (res.data.success) {
        toast.success('Member rejected.');
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

  const pendingMembers = members.filter((m) => m.status === 'pending');
  const pendingVehicles = vehicles.filter((v) => v.status === 'pending');

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
          <div className="glass-card p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Members</span>
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">{stats.members.total}</div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">{stats.members.pending} Pending</div>
          </div>

          <div className="glass-card p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pending Vehicles</span>
              <Car className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">{stats.vehicles.pending}</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Review Required</div>
          </div>

          <div className="glass-card p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Awaiting Payment</span>
              <Car className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">{stats.vehicles.awaitingPayment}</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Approved by Admin</div>
          </div>

          <div className="glass-card p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Active Passes</span>
              <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">{stats.vehicles.active}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Active Passes</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-3 mb-6">
        <button
          onClick={() => setTab('members')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            tab === 'members'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          Pending Members ({pendingMembers.length})
        </button>

        <button
          onClick={() => setTab('vehicles')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            tab === 'vehicles'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          Pending Vehicles ({pendingVehicles.length})
        </button>

        <button
          onClick={() => setTab('active')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            tab === 'active'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          Active Passes & Revoke
        </button>

        <button
          onClick={() => setTab('invite')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            tab === 'invite'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" /> Join Link
        </button>
      </div>

      {/* Tab 1: Pending Members */}
      {tab === 'members' && (
        <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white/90 dark:bg-[#121214]">
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
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 text-xs font-bold transition flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve Member
                          </button>
                          <button
                            onClick={() => handleRejectMember(m.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 hover:bg-rose-100 dark:hover:bg-rose-500/30 text-xs font-bold transition flex items-center gap-1"
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

      {/* Tab 2: Pending Vehicles */}
      {tab === 'vehicles' && (
        <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white/90 dark:bg-[#121214]">
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
                            💎 Professional (₹299)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-[#18181b] text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 font-bold">
                            🟢 Regular (Free)
                          </span>
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
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 text-xs font-bold transition flex items-center gap-1"
                            title="Generate and issue encrypted QR pass immediately with ₹0 fee"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Issue Regular QR (Free)
                          </button>

                          <button
                            onClick={() => handleApproveVehicle(v.id, 'professional')}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 hover:bg-amber-100 dark:hover:bg-amber-500/30 text-xs font-bold transition flex items-center gap-1"
                            title="Approve as Professional Pass (requires member payment before activation)"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Approve as Pro (Paid)
                          </button>

                          <button
                            onClick={() => handleRejectVehicle(v.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 hover:bg-rose-100 dark:hover:bg-rose-500/30 text-xs font-bold transition flex items-center gap-1"
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

      {/* Tab 3: Active Passes & Revocation */}
      {tab === 'active' && (
        <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white/90 dark:bg-[#121214]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
              <thead className="bg-zinc-100 dark:bg-[#18181b] text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Vehicle Number</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Owner Member</th>
                  <th className="px-6 py-4">QR Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-zinc-50 dark:hover:bg-[#18181b]/50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-zinc-900 dark:text-white">{v.vehicleNumber}</td>
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
                    <td className="px-6 py-4 text-xs font-semibold text-zinc-900 dark:text-zinc-200">{v.owner?.name}</td>
                    <td className="px-6 py-4 text-xs">
                      {v.qrCode && v.qrCode.isActive ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE QR
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-500 font-semibold">NO ACTIVE QR</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {v.qrCode && v.qrCode.isActive && (
                        <button
                          onClick={() => handleRevokeQR(v.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 hover:bg-rose-100 dark:hover:bg-rose-500/30 text-xs font-bold transition flex items-center gap-1 ml-auto"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Revoke Lost/Stolen QR
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

      {/* Tab 4: Join Link Generator */}
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
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 text-xs font-bold hover:opacity-95 transition flex items-center gap-1.5 shrink-0 shadow-md shadow-amber-500/20"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Link
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
            <span>Link Expires: {new Date(inviteLink.inviteLinkExpiry).toLocaleDateString()}</span>
            <button
              onClick={handleRotateInviteToken}
              className="text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Rotate & Revoke Old Link
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
