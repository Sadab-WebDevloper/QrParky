import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { ShieldCheck, Building2, Users, Car, CreditCard, CheckCircle2, XCircle, UserCheck, Shield } from 'lucide-react';
import { ROLE_LABELS } from '../constants/roles';

export default function SuperAdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [societies, setSocieties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('applications'); // 'applications', 'societies', 'users'

  // Modal State
  const [selectedCreds, setSelectedCreds] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, societiesRes, usersRes] = await Promise.all([
        API.get('/admin/dashboard/stats'),
        API.get('/admin/societies'),
        API.get('/admin/users'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (societiesRes.data.success) setSocieties(societiesRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApproveSociety = async (id) => {
    try {
      const res = await API.post(`/admin/societies/${id}/approve`);
      if (res.data.success) {
        toast.success(res.data.message);
        setSelectedCreds(res.data.data);
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    }
  };

  const handleRejectSociety = async (id) => {
    const reason = prompt('Reason for rejecting society onboarding application:');
    if (!reason) return;

    try {
      const res = await API.post(`/admin/societies/${id}/reject`, { reason });
      if (res.data.success) {
        toast.success('Society application rejected.');
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed.');
    }
  };

  const pendingSocieties = societies.filter((s) => s.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Platform Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Super Admin Dashboard</h1>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="glass-card p-4 sm:p-5 rounded-2xl border border-amber-300 dark:border-amber-500/20 bg-white/90 dark:bg-[#121214]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Societies</span>
              <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{stats.societies.total}</div>
            <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold mt-1">{stats.societies.pending} Pending Review</div>
          </div>

          <div className="glass-card p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Users</span>
              <Users className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">{stats.users.total}</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">{stats.users.members} Registered Members</div>
          </div>

          <div className="glass-card p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Active Passes</span>
              <Car className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">{stats.vehicles.active}</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">of {stats.vehicles.total} Registered</div>
          </div>

          <div className="glass-card p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Platform Revenue</span>
              <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">₹{stats.financials.totalRevenueINR}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">{stats.financials.totalOrdersPaid} Orders Paid</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-3 mb-6">
        <button
          onClick={() => setTab('applications')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            tab === 'applications'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          Pending Applications ({pendingSocieties.length})
        </button>

        <button
          onClick={() => setTab('societies')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            tab === 'societies'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          All Societies ({societies.length})
        </button>

        <button
          onClick={() => setTab('users')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            tab === 'users'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#141416]'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> All System Users ({users.length})
        </button>
      </div>

      {/* Tab 1: Pending Applications */}
      {tab === 'applications' && (
        <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden bg-white/90 dark:bg-[#121214]">
          {pendingSocieties.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 text-xs">No pending society applications awaiting review.</div>
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
                  {pendingSocieties.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-[#18181b]/50 transition">
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">{s.name}</td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs max-w-xs truncate">{s.address}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-xs">{s.submittedBy?.name}</div>
                        <div className="text-[11px] text-zinc-500">{s.submittedBy?.email} | {s.submittedBy?.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveSociety(s.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 text-xs font-bold transition flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectSociety(s.id)}
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

      {/* Tab 2: All Societies */}
      {tab === 'societies' && (
        <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden bg-white/90 dark:bg-[#121214]">
          {societies.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 text-xs">No societies registered yet.</div>
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
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white text-xs">{s.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${
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
                      <td className="px-6 py-4 font-mono text-xs text-amber-600 dark:text-amber-400 truncate max-w-xs">
                        {s.inviteLinkToken || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: All Users */}
      {tab === 'users' && (
        <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden bg-white/90 dark:bg-[#121214]">
          {users.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 text-xs">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
                <thead className="bg-zinc-100 dark:bg-[#18181b] text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">User Name</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Society</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4 text-right">Joined Date</th>
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
                        {u.society?.name || 'Global / Platform'}
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
              Society <span className="font-bold text-zinc-900 dark:text-white">{selectedCreds.societyName}</span> has been approved! Login credentials are below:
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 font-mono text-xs space-y-2">
              <div>
                <span className="text-zinc-500 uppercase font-bold text-[10px]">Admin Email:</span>
                <div className="text-amber-600 dark:text-amber-400 font-semibold">{selectedCreds.adminCredentials?.email}</div>
              </div>
              <div>
                <span className="text-zinc-500 uppercase font-bold text-[10px]">Temporary Password:</span>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{selectedCreds.adminCredentials?.temporaryPassword}</div>
              </div>
              <div>
                <span className="text-zinc-500 uppercase font-bold text-[10px]">Resident Join Token:</span>
                <div className="text-zinc-700 dark:text-zinc-300 truncate">{selectedCreds.inviteLinkToken}</div>
              </div>
            </div>

            <button
              onClick={() => setSelectedCreds(null)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 font-bold text-xs hover:opacity-95 transition shadow-md shadow-amber-500/20"
            >
              Done & Close
            </button>
          </div>
        )}
      </Modal>

    </div>
  );
}
