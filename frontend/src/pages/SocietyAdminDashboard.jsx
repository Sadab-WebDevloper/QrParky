import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
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
  ChevronDown,
  Filter,
  Check,
  MapPin,
  Calendar,
  ExternalLink,
  BellRing,
  X,
  Clock,
  CreditCard,
  Layers,
  ShieldCheck,
  PauseCircle,
  PlayCircle
} from 'lucide-react';

export default function SocietyAdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [inviteLink, setInviteLink] = useState(null);
  const [loading, setLoading] = useState(true);

  // Consolidated Tabs: 'vehicles', 'members', 'invite'
  const [activeTab, setActiveTab] = useState('vehicles');

  // Vehicle filters
  const [vehicleFilter, setVehicleFilter] = useState('all'); // 'all', 'pending', 'awaiting_payment', 'active'
  const [vehicleSearch, setVehicleSearch] = useState('');

  // Member filters
  const [memberFilter, setMemberFilter] = useState('all'); // 'all', 'pending', 'approved', 'suspended'
  const [memberSearch, setMemberSearch] = useState('');

  // Dropdown states for custom filters
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const vehicleDropdownRef = useRef(null);
  const memberDropdownRef = useRef(null);

  // Sliding indicator state & refs
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabsContainerRef = useRef(null);
  const tabRefs = useRef({});

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

  // In-App Live Notification States & Tracking (Ultra-low footprint)
  const [liveAlert, setLiveAlert] = useState(null);
  const lastSignatureRef = useRef(null);
  const prevCountsRef = useRef({ members: 0, vehicles: 0 });

  // Synthesize gentle notification chime without external file dependency
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // Note D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // Note A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Audio autoplay policy guard
    }
  };

  // Update sliding indicator on tab change & window resize
  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activeTab];
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
  }, [activeTab, stats]);

  // Close custom dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (vehicleDropdownRef.current && !vehicleDropdownRef.current.contains(e.target)) {
        setVehicleDropdownOpen(false);
      }
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(e.target)) {
        setMemberDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Unified Fast Bootstrap: Try single consolidated endpoint first
      const initRes = await API.get('/society-admin/dashboard/init').catch(() => null);

      if (initRes && initRes.data?.success && initRes.data?.data) {
        const { stats, members, vehicles, inviteLink, pendingCheck } = initRes.data.data;
        setStats(stats);
        setMembers(members || []);
        setVehicles(vehicles || []);
        setInviteLink(inviteLink);

        if (pendingCheck) {
          lastSignatureRef.current = pendingCheck.syncSignature;
          prevCountsRef.current = {
            members: pendingCheck.pendingMembersCount || 0,
            vehicles: pendingCheck.pendingVehiclesCount || 0,
          };
        }
      } else {
        // Fallback for older server deployments
        const [statsRes, membersRes, vehiclesRes, inviteRes] = await Promise.all([
          API.get('/society-admin/dashboard/stats'),
          API.get('/society-admin/members?limit=100'),
          API.get('/society-admin/vehicles'),
          API.get('/society/me/invite-link'),
        ]);

        const loadedMembers = membersRes.data?.data || [];
        const loadedVehicles = vehiclesRes.data?.data || [];

        if (statsRes.data?.success) setStats(statsRes.data.data);
        if (membersRes.data?.success) setMembers(loadedMembers);
        if (vehiclesRes.data?.success) setVehicles(loadedVehicles);
        if (inviteRes.data?.success) setInviteLink(inviteRes.data.data);

        // Initialize sync signature directly from loaded data
        const pendingMems = loadedMembers.filter(m => m.status === 'pending' && m.role !== 2);
        const pendingVechs = loadedVehicles.filter(v => v.status === 'pending');
        prevCountsRef.current = {
          members: pendingMems.length,
          vehicles: pendingVechs.length,
        };
        lastSignatureRef.current = `${pendingMems.length}_${pendingVechs.length}_${pendingMems[0]?.id || 0}_${pendingVechs[0]?.id || 0}`;
      }
    } catch (err) {
      toast.error('Failed to load society admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // Ultra-lightweight background sync (consumes <50 bytes and ~1ms query per check)
  const pollForNewRequests = async () => {
    // 1. Tab Visibility Guard: Pause completely when browser tab is inactive/minimized
    if (typeof document !== 'undefined' && document.hidden) {
      return;
    }

    try {
      // 2. Micro-check endpoint (safely caught in case live backend hasn't restarted yet)
      const checkRes = await API.get('/society-admin/pending-check').catch(() => null);
      if (!checkRes || !checkRes.data?.success || !checkRes.data?.data) return;

      const { pendingMembersCount, pendingVehiclesCount, latestMember, latestVehicle, syncSignature } = checkRes.data.data;

      // 3. ZERO WORK if nothing has changed on server
      if (lastSignatureRef.current === syncSignature) {
        return;
      }

      // Check if counts increased (new incoming request)
      const isNewMember = pendingMembersCount > prevCountsRef.current.members;
      const isNewVehicle = pendingVehiclesCount > prevCountsRef.current.vehicles;
      const hasNewRequest = isNewMember || isNewVehicle;

      if (hasNewRequest && lastSignatureRef.current !== null) {
        playNotificationChime();

        const applicantName = latestMember?.name || latestVehicle?.ownerName || 'New Resident';
        const plateNumber = latestVehicle?.vehicleNumber || '';
        const vehicleName = latestVehicle?.vehicleName || '';
        const totalNew = pendingMembersCount + pendingVehiclesCount;

        setLiveAlert({
          id: Date.now(),
          name: applicantName,
          vehicleName: vehicleName,
          vehicleNumber: plateNumber,
          count: totalNew,
          targetTab: isNewMember ? 'members' : 'vehicles',
          timestamp: new Date(),
        });

        const vehicleDesc = vehicleName && plateNumber ? `${vehicleName} (${plateNumber})` : (plateNumber || vehicleName || '');
        toast.info(
          `🔔 New Request: ${applicantName} has applied ${vehicleDesc ? `with ${vehicleDesc}` : 'for society registration'}!`
        );
      }

      // Update cached signature and counts
      lastSignatureRef.current = syncSignature;
      prevCountsRef.current = {
        members: pendingMembersCount,
        vehicles: pendingVehiclesCount,
      };

      // 4. ONLY fetch full lists when a verified change is detected
      const [membersRes, vehiclesRes, statsRes] = await Promise.all([
        API.get('/society-admin/members?limit=100'),
        API.get('/society-admin/vehicles'),
        API.get('/society-admin/dashboard/stats'),
      ]);

      if (membersRes.data?.success) setMembers(membersRes.data.data || []);
      if (vehiclesRes.data?.success) setVehicles(vehiclesRes.data.data || []);
      if (statsRes.data?.success) setStats(statsRes.data.data);
    } catch (err) {
      // Silent error for background fail-safe
    }
  };

  useEffect(() => {
    fetchData();

    // Fast, responsive polling interval (8s) with tab visibility protection
    const interval = setInterval(() => {
      pollForNewRequests();
    }, 8000);

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
        toast.success(res.data?.message || 'Vehicle approved by Committee! Member can now pay pass fee to activate.');
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

  const handleOpenSuspendPass = (veh) => {
    setReasonModal({
      isOpen: true,
      type: 'suspend_pass',
      targetId: veh.id,
      targetName: veh.vehicleNumber,
      reason: '',
      submitting: false
    });
  };

  const handleOpenRevokeQR = handleOpenSuspendPass;

  const handleReactivatePass = async (veh) => {
    try {
      const res = await API.post(`/society-admin/vehicles/${veh.id}/reactivate`);
      if (res.data?.success) {
        toast.success(`Pass reactivated for ${veh.vehicleNumber}! Status is now Active.`);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reactivate pass.');
    }
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
      } else if (type === 'suspend_pass' || type === 'revoke_qr') {
        const res = await API.post(`/society-admin/vehicles/${targetId}/suspend`, { reason });
        if (res.data?.success) {
          toast.success('Vehicle pass suspended. Resident has been notified with the reason.');
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

  // Dedicated Poster Printer (Isolates print exclusively to the gate poster card)
  const handlePrintPoster = () => {
    if (!inviteUrl) {
      toast.error('Registration link is not ready yet.');
      return;
    }

    const societyName = user?.societyName || 'Society Access Portal';
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(inviteUrl)}`;

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
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Resident Registration Poster - ${societyName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 24px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background-color: #ffffff;
              color: #18181b;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
            }
            .poster-card {
              width: 100%;
              max-width: 440px;
              margin: 0 auto;
              padding: 36px 28px;
              border: 3.5px dashed #f59e0b;
              border-radius: 24px;
              text-align: center;
              background: #ffffff;
            }
            .brand-header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              margin-bottom: 12px;
            }
            .logo-icon {
              width: 34px;
              height: 34px;
              background: #f59e0b;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 900;
              font-size: 15px;
              color: #000;
            }
            .brand-title {
              font-size: 18px;
              font-weight: 800;
              color: #09090b;
            }
            .society-badge {
              display: inline-block;
              background: #fef3c7;
              color: #92400e;
              border: 1px solid #fde68a;
              font-size: 13px;
              font-weight: 800;
              padding: 5px 16px;
              border-radius: 9999px;
              margin-bottom: 16px;
            }
            .main-title {
              font-size: 18px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #09090b;
              margin: 0 0 6px 0;
            }
            .subtitle {
              font-size: 12px;
              color: #52525b;
              margin: 0 0 20px 0;
              font-weight: 500;
            }
            .qr-wrapper {
              display: inline-block;
              padding: 16px;
              background: #fafafa;
              border: 1.5px solid #e4e4e7;
              border-radius: 18px;
              margin-bottom: 20px;
            }
            .qr-wrapper img {
              width: 240px;
              height: 240px;
              display: block;
            }
            .steps-container {
              background: #fafafa;
              border: 1px solid #f4f4f5;
              border-radius: 14px;
              padding: 14px 18px;
              text-align: left;
              max-width: 360px;
              margin: 0 auto;
            }
            .steps-header {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #18181b;
              margin-bottom: 6px;
              text-align: center;
            }
            .step-item {
              font-size: 11px;
              color: #3f3f46;
              line-height: 1.6;
            }
            .footer-note {
              margin-top: 20px;
              font-size: 10px;
              color: #a1a1aa;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="poster-card">
            <div class="brand-header">
              <div class="logo-icon">QP</div>
              <span class="brand-title">QrParky Access</span>
            </div>
            
            <div class="society-badge">📍 ${societyName}</div>
            
            <h1 class="main-title">Resident Vehicle Registration</h1>
            <p class="subtitle">Scan with your smartphone camera to request official windshield QR Pass</p>
            
            <div class="qr-wrapper">
              <img id="qr-img" src="${qrSrc}" alt="Resident Registration QR Code" />
            </div>

            <div class="steps-container">
              <div class="steps-header">3 Simple Steps to Register:</div>
              <div class="step-item">1. 📷 Open camera app and scan this QR code</div>
              <div class="step-item">2. 📝 Enter flat number & vehicle plate details</div>
              <div class="step-item">3. 🛡️ Collect approved windshield QR pass from admin</div>
            </div>

            <div class="footer-note">
              Security Gate & Notice Board Official Poster • QrParky
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

  // Dedicated Vehicle Pass Sticker Printer (Isolates pass print)
  const handlePrintVehiclePass = (passData) => {
    if (!passData) return;

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
          <title>QrParky Pass - ${passData.vehicleNumber}</title>
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
              <div class="soc-name">📍 ${passData.societyName || 'Society Pass'}</div>
              <div class="active-badge">● ACTIVE PASS</div>
            </div>
            <div class="qr-box">
              <img id="qr-img" src="${passData.qrImageUrl}" alt="Vehicle QR Pass" />
            </div>
            <div class="veh-num">${passData.vehicleNumber}</div>
            <div class="owner-name">${passData.ownerName || 'Resident'} • Windshield Permit</div>
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

  // Filter computations
  const pendingMembers = members.filter(m => m.status === 'pending' && m.role !== 2);
  const pendingVehicles = vehicles.filter(v => v.status === 'pending');
  const awaitingPaymentVehicles = vehicles.filter(v => v.status === 'awaiting_payment');
  const activeVehicles = vehicles.filter(v => v.status === 'active');

  const filteredVehicles = vehicles.filter(v => {
    const matchesFilter = 
      vehicleFilter === 'all' ? true :
      vehicleFilter === 'pending' ? v.status === 'pending' :
      vehicleFilter === 'awaiting_payment' ? v.status === 'awaiting_payment' :
      vehicleFilter === 'active' ? v.status === 'active' :
      vehicleFilter === 'suspended' ? (v.status === 'suspended' || (v.status === 'expired' && v.qrCode)) :
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

  const getMemberVehicles = (member) => {
    if (member?.vehicles && member.vehicles.length > 0) return member.vehicles;
    return vehicles.filter(
      (v) => Number(v.memberId) === Number(member?.id) || Number(v.owner?.id) === Number(member?.id)
    );
  };

  const inviteUrl = inviteLink ? `${window.location.origin}/register/${inviteLink.inviteLinkToken}` : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
            <Building2 className="w-3 h-3" />
            <span>Society Administration</span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
            Society Admin Dashboard
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* In-App Live Notification Bell with Pending Counter */}
          <button
            onClick={() => {
              if ((stats?.members?.pending || 0) > 0) {
                setActiveTab('members');
                setMemberFilter('pending');
              } else if ((stats?.vehicles?.pending || 0) > 0) {
                setActiveTab('vehicles');
                setVehicleFilter('pending');
              } else {
                toast.info('No pending resident requests at this time.');
              }
            }}
            className="relative h-8 px-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-amber-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="In-App Notifications / Pending Requests"
          >
            <BellRing className={`w-3.5 h-3.5 ${((stats?.members?.pending || 0) + (stats?.vehicles?.pending || 0)) > 0 ? 'text-amber-500 animate-pulse' : 'text-zinc-400'}`} />
            <span className="hidden sm:inline">Requests</span>
            {((stats?.members?.pending || 0) + (stats?.vehicles?.pending || 0)) > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px] shadow-xs animate-bounce">
                {(stats?.members?.pending || 0) + (stats?.vehicles?.pending || 0)}
              </span>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>{user?.societyName || 'Society Admin'}</span>
          </div>
        </div>
      </div>

      {/* Live Notification Alert Banner */}
      {liveAlert && (
        <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center font-black shrink-0 shadow-xs">
              <BellRing className="w-3.5 h-3.5 animate-bounce" />
            </div>
            <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
              <span className="font-bold text-amber-600 dark:text-amber-400">{liveAlert.name}</span> has submitted a new request {liveAlert.vehicleNumber && <span>with <span className="font-semibold text-zinc-900 dark:text-white">{liveAlert.vehicleName ? `${liveAlert.vehicleName} ` : ''}</span><span className="font-mono font-bold text-amber-600 dark:text-amber-400">({liveAlert.vehicleNumber})</span></span>}!
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setActiveTab(liveAlert.targetTab);
                if (liveAlert.targetTab === 'vehicles') setVehicleFilter('pending');
                if (liveAlert.targetTab === 'members') setMemberFilter('pending');
                setLiveAlert(null);
              }}
              className="h-7 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs transition"
            >
              <span>Review Request</span>
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setLiveAlert(null)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid — Compact low-profile cards matching Super Admin */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
          
          {/* Residents Card */}
          <div 
            onClick={() => { setActiveTab('members'); setMemberFilter('all'); }}
            className="p-2.5 sm:p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#121214] glass-card glass-card-hover transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Residents</span>
              <div className="w-6.5 h-6.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                {stats.members.total}
              </div>
              <div className="text-[10px] font-semibold">
                {stats.members.pending > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>{stats.members.pending} Pending</span>
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>All Verified</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pending Vehicles Card */}
          <div 
            onClick={() => { setActiveTab('vehicles'); setVehicleFilter('pending'); }}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer glass-card glass-card-hover ${
              stats.vehicles.pending > 0 
                ? 'border-yellow-400/70 dark:border-yellow-500/40 bg-yellow-50/25 dark:bg-yellow-950/20 shadow-sm' 
                : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#121214]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider">Pending Vehicles</span>
              <div className="w-6.5 h-6.5 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 flex items-center justify-center shrink-0">
                <Car className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                {stats.vehicles.pending}
              </div>
              <div className="text-[10px] font-semibold text-yellow-600 dark:text-yellow-400">
                {stats.vehicles.pending > 0 ? 'Requires Review' : 'All Clear'}
              </div>
            </div>
          </div>

          {/* Active Passes Card */}
          <div 
            onClick={() => { setActiveTab('vehicles'); setVehicleFilter('active'); }}
            className="p-2.5 sm:p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#121214] glass-card glass-card-hover transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Active Passes</span>
              <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <QrCode className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
                {stats.vehicles.active}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                Issued for windshields
              </div>
            </div>
          </div>

          {/* Gate Security / Invite Link Card */}
          <div 
            onClick={() => setActiveTab('invite')}
            className="p-2.5 sm:p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#121214] glass-card glass-card-hover transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Gate QR Access</span>
              <div className="w-6.5 h-6.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Shield className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-1 min-h-[1.75rem] sm:min-h-[2rem]">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                Print Poster →
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Tab Block: Nav + Pane together so spacing is fully controlled */}
      <div className="flex flex-col gap-3">

        {/* Tab Navigation: Mobile 3-Column Grid / Desktop Animated Sliding Segmented Bar */}
        <div
          ref={tabsContainerRef}
          className="relative grid grid-cols-3 gap-1 sm:flex sm:items-center w-full p-1 rounded-xl bg-zinc-100/90 dark:bg-[#151518] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm"
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

          {/* Tab 1: Vehicles */}
          <button
            ref={(el) => (tabRefs.current['vehicles'] = el)}
            onClick={() => setActiveTab('vehicles')}
            className={`relative z-10 sm:flex-1 px-1.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer active:scale-95 min-w-0 ${
              activeTab === 'vehicles'
                ? 'bg-amber-500 text-zinc-950 font-black sm:bg-transparent shadow-sm sm:shadow-none'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Car className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'vehicles' ? 'text-zinc-950' : 'text-zinc-400'}`} />
            <span className="truncate sm:hidden">Passes</span>
            <span className="hidden sm:inline">Vehicle Passes</span>
            {pendingVehicles.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 sm:bg-zinc-950 animate-pulse shrink-0" />
            )}
          </button>

          {/* Tab 2: Members */}
          <button
            ref={(el) => (tabRefs.current['members'] = el)}
            onClick={() => setActiveTab('members')}
            className={`relative z-10 sm:flex-1 px-1.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer active:scale-95 min-w-0 ${
              activeTab === 'members'
                ? 'bg-amber-500 text-zinc-950 font-black sm:bg-transparent shadow-sm sm:shadow-none'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Users className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'members' ? 'text-zinc-950' : 'text-zinc-400'}`} />
            <span className="truncate sm:hidden">Members</span>
            <span className="hidden sm:inline">Residents & Members</span>
            {pendingMembers.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 sm:bg-zinc-950 animate-pulse shrink-0" />
            )}
          </button>

          {/* Tab 3: Member Invite */}
          <button
            ref={(el) => (tabRefs.current['invite'] = el)}
            onClick={() => setActiveTab('invite')}
            className={`relative z-10 sm:flex-1 px-1.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer active:scale-95 min-w-0 ${
              activeTab === 'invite'
                ? 'bg-amber-500 text-zinc-950 font-black sm:bg-transparent shadow-sm sm:shadow-none'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <LinkIcon className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'invite' ? 'text-zinc-950' : 'text-zinc-400'}`} />
            <span className="truncate sm:hidden">Invite</span>
            <span className="hidden sm:inline">Member Invite</span>
          </button>
        </div>

        {/* Tab 1: Vehicle Passes Pane */}
        {activeTab === 'vehicles' && (
          <div key="tab-vehicles" className="animate-tab-pane glass-card rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214] relative z-10 shadow-sm flex flex-col overflow-visible">
            
            {/* Table Card Toolbar: Full Width Search & Status Filter */}
            <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-[#151518]/60 flex items-center justify-between gap-2.5 rounded-t-2xl overflow-visible">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search vehicle number, resident name, phone..."
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-8 rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-amber-500 transition shadow-xs"
                />
                {vehicleSearch && (
                  <button
                    type="button"
                    onClick={() => setVehicleSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Custom Dropdown: Vehicle Status Filter */}
              <div className="relative z-30 shrink-0" ref={vehicleDropdownRef}>
                <button
                  type="button"
                  onClick={() => setVehicleDropdownOpen(!vehicleDropdownOpen)}
                  className="h-8 flex items-center justify-between gap-1.5 px-2.5 rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700/80 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-amber-400 dark:hover:border-amber-500/50 transition cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-1">
                    <Filter className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="text-zinc-400 text-[11px]">Status:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 capitalize text-xs">
                      {vehicleFilter === 'all' ? 'All' :
                       vehicleFilter === 'pending' ? 'Pending' :
                       vehicleFilter === 'awaiting_payment' ? 'Fee Pending' :
                       vehicleFilter === 'suspended' ? 'Suspended' :
                       'Active Passes'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${vehicleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {vehicleDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-1 z-40 animate-dropdown">
                    {[
                      { value: 'all', label: 'All Vehicles' },
                      { value: 'active', label: 'Active Passes' },
                      { value: 'suspended', label: 'Suspended Passes' },
                      { value: 'pending', label: 'Pending Review' },
                      { value: 'awaiting_payment', label: 'Fee Pending' },
                    ].map((opt) => {
                      const isSelected = vehicleFilter === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setVehicleFilter(opt.value);
                            setVehicleDropdownOpen(false);
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
                    <th className="px-4 py-2">Vehicle</th>
                    <th className="px-4 py-2">Resident / Owner</th>
                    <th className="px-4 py-2">RC Document</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                {loading ? (
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {Array.from({ length: 4 }).map((_, rIdx) => (
                      <tr key={rIdx}>
                        {Array.from({ length: 5 }).map((_, cIdx) => (
                          <td key={cIdx} className="px-4 py-2">
                            <div className="h-3.5 bg-zinc-200/70 dark:bg-zinc-800/80 rounded-md animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                ) : filteredVehicles.length === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                        <Car className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mx-auto mb-1.5" />
                        No vehicles found matching the selected filter.
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60">
                    {filteredVehicles.map((v) => {
                      const isPending = v.status === 'pending';
                      const isActive = v.status === 'active';
                      const isSuspended = v.status === 'suspended' || (v.status === 'expired' && v.qrCode);

                      return (
                        <tr key={v.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#18181b]/50 transition-colors">
                          {/* Plate & Type */}
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <div className="inline-flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-0.5 shadow-2xs">
                                <span className="text-[7px] font-black text-blue-600 mr-1">IND</span>
                                <span className="font-mono font-black text-zinc-950 dark:text-amber-400 text-xs uppercase tracking-wider">
                                  {v.vehicleNumber}
                                </span>
                              </div>
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 capitalize flex items-center gap-0.5">
                                {v.vehicleType === '2wheeler' ? <Bike className="w-3 h-3 text-amber-500" /> : <Car className="w-3 h-3 text-amber-500" />}
                                {v.vehicleType}
                              </span>
                            </div>
                          </td>

                          {/* Resident Info */}
                          <td className="px-4 py-2">
                            <div className="font-semibold text-zinc-900 dark:text-zinc-200 text-xs">
                              {v.owner?.name || 'Resident'}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              {v.owner?.phone || v.owner?.email || '—'}
                            </div>
                          </td>

                          {/* RC Document */}
                          <td className="px-4 py-2 text-xs">
                            {v.documents && v.documents.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => setSelectedDocument(v.documents[0])}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 hover:text-amber-500 text-[11px] font-semibold transition cursor-pointer"
                              >
                                <FileText className="w-3 h-3 text-amber-500" />
                                <span>View RC</span>
                              </button>
                            ) : (
                              <span className="text-zinc-400 italic text-[11px]">No doc</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-2">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              isActive
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : isSuspended
                                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                                : v.status === 'awaiting_payment'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                : isPending
                                ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                            }`}
                            title={isSuspended && v.suspensionReason ? `Reason: ${v.suspensionReason}` : undefined}
                            >
                              {isActive ? '● Active Pass' :
                               isSuspended ? '⏸ Suspended' :
                               v.status === 'awaiting_payment' ? '🟡 Fee Pending' :
                               isPending ? 'Pending Review' : v.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleApproveVehicle(v.id, 'regular')}
                                    className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenRejectVehicle(v)}
                                    className="h-7 px-2 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 hover:bg-rose-100 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}

                              {isActive && (
                                <>
                                  <button
                                    onClick={() => handleViewQR(v.id)}
                                    className="h-7 px-2.5 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-[11px] hover:opacity-95 shadow-sm transition flex items-center gap-1 cursor-pointer active:scale-95"
                                  >
                                    <QrCode className="w-3 h-3" />
                                    <span>QR Pass</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenSuspendPass(v)}
                                    className="h-7 px-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-600/40 hover:bg-amber-500/20 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                                    title="Temporarily hold/pause this vehicle's pass"
                                  >
                                    <PauseCircle className="w-3 h-3 text-amber-500" />
                                    <span>Suspend Pass</span>
                                  </button>
                                </>
                              )}

                              {isSuspended && (
                                <>
                                  <button
                                    onClick={() => handleViewQR(v.id)}
                                    className="h-7 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold hover:bg-zinc-200 transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <QrCode className="w-3 h-3" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    onClick={() => handleReactivatePass(v)}
                                    className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                                    title="Restore pass access back to Active"
                                  >
                                    <PlayCircle className="w-3 h-3" />
                                    <span>Reactivate Pass</span>
                                  </button>
                                </>
                              )}

                              {v.status === 'awaiting_payment' && v.owner?.phone && (
                                <a
                                  href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(v.owner.phone)}&text=${encodeURIComponent(
                                    `Hello ${v.owner.name},\n\nYour vehicle registration (${v.vehicleNumber}) has been verified & approved by the committee! Please sign in to QrParky to complete the ${v.vehicleType === '2wheeler' ? '₹199' : '₹299'} pass fee and download your windshield QR pass.\n\nThank you,\n${user?.societyName || 'Society Committee'}`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-sm"
                                  title="Remind member on WhatsApp"
                                >
                                  <Share2 className="w-3 h-3" />
                                  <span>Remind</span>
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                )}
              </table>
            </div>

            {/* Mobile Box/Card View */}
            <div className="sm:hidden p-2.5 space-y-2.5">
              {filteredVehicles.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                  <Car className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mx-auto mb-1.5" />
                  No vehicles found.
                </div>
              ) : (
                filteredVehicles.map((v) => {
                  const isPending = v.status === 'pending';
                  const isActive = v.status === 'active';
                  const isSuspended = v.status === 'suspended' || (v.status === 'expired' && v.qrCode);

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
                            : v.status === 'awaiting_payment'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                            : isPending
                            ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}>
                          {isActive ? '● Active Pass' :
                           isSuspended ? '⏸ Suspended' :
                           v.status === 'awaiting_payment' ? '🟡 Fee Pending' :
                           isPending ? 'Pending' : v.status}
                        </span>
                      </div>

                      {isSuspended && v.suspensionReason && (
                        <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-[10px] text-rose-700 dark:text-rose-300">
                          <strong>Suspended:</strong> {v.suspensionReason}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-[11px] py-1.5 border-y border-zinc-100 dark:border-zinc-800/80">
                        <div>
                          <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider block">Resident</span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-200 truncate block">
                            {v.owner?.name || 'Resident'}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono block">
                            {v.owner?.phone || v.owner?.email || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider block">Vehicle Type</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize flex items-center gap-1">
                            {v.vehicleType === '2wheeler' ? <Bike className="w-3 h-3 text-amber-500" /> : <Car className="w-3 h-3 text-amber-500" />}
                            {v.vehicleType}
                          </span>
                        </div>
                      </div>

                      {v.documents && v.documents.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedDocument(v.documents[0])}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold flex items-center justify-center gap-1"
                        >
                          <FileText className="w-3 h-3 text-amber-500" />
                          <span>View Registration Certificate (RC)</span>
                        </button>
                      )}

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApproveVehicle(v.id, 'regular')}
                              className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleOpenRejectVehicle(v)}
                              className="h-8 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {isActive && (
                          <>
                            <button
                              onClick={() => handleViewQR(v.id)}
                              className="h-8 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95"
                            >
                              <QrCode className="w-3 h-3" />
                              <span>View QR</span>
                            </button>
                            <button
                              onClick={() => handleOpenSuspendPass(v)}
                              className="h-8 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-600/40 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                            >
                              <PauseCircle className="w-3 h-3 text-amber-500" />
                              <span>Suspend Pass</span>
                            </button>
                          </>
                        )}

                        {isSuspended && (
                          <>
                            <button
                              onClick={() => handleViewQR(v.id)}
                              className="h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <QrCode className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => handleReactivatePass(v)}
                              className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95"
                            >
                              <PlayCircle className="w-3 h-3" />
                              <span>Reactivate Pass</span>
                            </button>
                          </>
                        )}

                        {v.status === 'awaiting_payment' && v.owner?.phone && (
                          <a
                            href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(v.owner.phone)}&text=${encodeURIComponent(
                              `Hello ${v.owner.name},\n\nYour vehicle registration (${v.vehicleNumber}) has been verified & approved by the committee! Please sign in to QrParky to complete the ${v.vehicleType === '2wheeler' ? '₹199' : '₹299'} pass fee and download your windshield QR pass.\n\nThank you,\n${user?.societyName || 'Society Committee'}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="col-span-2 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Remind Resident via WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* Tab 2: Residents & Members Pane */}
        {activeTab === 'members' && (
          <div key="tab-members" className="animate-tab-pane glass-card rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214] relative z-10 shadow-sm flex flex-col overflow-visible">
            
            {/* Table Card Toolbar: Full Width Search & Status Filter */}
            <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-[#151518]/60 flex items-center justify-between gap-2.5 rounded-t-2xl overflow-visible">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search resident name, email, phone..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-8 rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-amber-500 transition shadow-xs"
                />
                {memberSearch && (
                  <button
                    type="button"
                    onClick={() => setMemberSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Custom Dropdown: Member Status Filter */}
              <div className="relative z-30 shrink-0" ref={memberDropdownRef}>
                <button
                  type="button"
                  onClick={() => setMemberDropdownOpen(!memberDropdownOpen)}
                  className="h-8 flex items-center justify-between gap-1.5 px-2.5 rounded-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700/80 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-amber-400 dark:hover:border-amber-500/50 transition cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-1">
                    <Filter className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="text-zinc-400 text-[11px]">Status:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 capitalize text-xs">
                      {memberFilter === 'all' ? 'All' :
                       memberFilter === 'pending' ? 'Pending' :
                       memberFilter === 'approved' ? 'Approved' :
                       'Suspended'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${memberDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {memberDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-1 z-40 animate-dropdown">
                    {[
                      { value: 'all', label: 'All Residents' },
                      { value: 'pending', label: 'Pending Approval' },
                      { value: 'approved', label: 'Approved' },
                      { value: 'suspended', label: 'Suspended' },
                    ].map((opt) => {
                      const isSelected = memberFilter === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setMemberFilter(opt.value);
                            setMemberDropdownOpen(false);
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
                    <th className="px-4 py-2">Resident</th>
                    <th className="px-4 py-2">Contact</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Vehicles</th>
                    <th className="px-4 py-2">Joined</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                {loading ? (
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {Array.from({ length: 4 }).map((_, rIdx) => (
                      <tr key={rIdx}>
                        {Array.from({ length: 6 }).map((_, cIdx) => (
                          <td key={cIdx} className="px-4 py-2">
                            <div className="h-3.5 bg-zinc-200/70 dark:bg-zinc-800/80 rounded-md animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                ) : filteredMembers.length === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                        <Users className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mx-auto mb-1.5" />
                        No resident members found matching your search.
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60">
                    {filteredMembers.map((m) => {
                      const isPending = m.status === 'pending';

                      return (
                        <tr key={m.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#18181b]/50 transition-colors">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-zinc-950 font-bold text-xs shrink-0 shadow-xs">
                                {m.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-extrabold text-zinc-900 dark:text-white text-xs">{m.name}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-2 text-xs">
                            <div className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">{m.email}</div>
                            <div className="text-zinc-500 text-[10px] font-mono">{m.phone || '—'}</div>
                          </td>

                          <td className="px-4 py-2">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              m.status === 'approved'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : isPending
                                ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                            }`}>
                              {m.status}
                            </span>
                          </td>

                          <td className="px-4 py-2 text-xs">
                            {(() => {
                              const memberVehicles = getMemberVehicles(m);
                              return memberVehicles.length > 0 ? (
                              <div className="space-y-1.5 max-w-xs">
                                {memberVehicles.map((v) => (
                                  <div key={v.id} className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
                                    <span className="text-[11px] font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                                      {v.vehicleType === '2wheeler' ? '🏍️' : '🚗'} {v.vehicleName || (v.vehicleType === '2wheeler' ? 'Two-Wheeler' : 'Four-Wheeler')}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-amber-400 font-mono font-bold text-[10px] uppercase tracking-wider border border-zinc-700">
                                      {v.vehicleNumber}
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                                      v.status === 'active' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' :
                                      v.status === 'pending' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30' :
                                      'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                    }`}>
                                      {v.status === 'pending' ? 'Pass Pending' : v.status}
                                    </span>
                                    {v.documents && v.documents.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedDocument(v.documents[0])}
                                        className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[10px] font-bold border border-amber-500/20 inline-flex items-center gap-0.5 cursor-pointer transition"
                                        title="View RC Document"
                                      >
                                        <FileText className="w-2.5 h-2.5" />
                                        <span>RC Doc</span>
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-zinc-400 italic text-[11px]">No vehicle applied</span>
                            );
                            })()}
                          </td>

                          <td className="px-4 py-2 text-[11px] text-zinc-500 whitespace-nowrap">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </td>

                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedMember(m)}
                                className="h-7 px-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-amber-400 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-amber-500" />
                                <span>Details</span>
                              </button>

                              {isPending && (
                                <button
                                  onClick={() => handleApproveMember(m.id)}
                                  className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                )}
              </table>
            </div>

            {/* Mobile Box/Card View */}
            <div className="sm:hidden p-2.5 space-y-2.5">
              {filteredMembers.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                  <Users className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mx-auto mb-1.5" />
                  No residents found.
                </div>
              ) : (
                filteredMembers.map((m) => {
                  const isPending = m.status === 'pending';
                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#141416] shadow-sm space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-zinc-950 font-bold text-xs shrink-0 shadow-xs">
                            {m.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-zinc-900 dark:text-white text-xs">{m.name}</div>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                          m.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            : isPending
                            ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                        }`}>
                          {m.status}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 text-[11px] space-y-0.5">
                        <div className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200">
                          <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span className="truncate">{m.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-500 font-mono">
                          <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span>{m.phone || '—'}</span>
                        </div>
                      </div>

                      {/* Detailed Vehicle Information on Mobile */}
                      <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                          <span>Vehicle Details</span>
                          <span className="text-[10px] text-zinc-400 lowercase font-normal">
                            Joined {new Date(m.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {(() => {
                          const memberVehicles = getMemberVehicles(m);
                          return memberVehicles.length > 0 ? (
                          <div className="space-y-1">
                            {memberVehicles.map((v) => (
                              <div key={v.id} className="flex items-center justify-between gap-1 p-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs">
                                <div>
                                  <div className="font-bold text-zinc-900 dark:text-white text-[11px] flex items-center gap-1">
                                    <span>{v.vehicleType === '2wheeler' ? '🏍️' : '🚗'}</span>
                                    <span>{v.vehicleName || (v.vehicleType === '2wheeler' ? '2-Wheeler' : '4-Wheeler')}</span>
                                  </div>
                                  <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-[10px]">
                                    {v.vehicleNumber}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                    v.status === 'active' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                                    v.status === 'pending' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' :
                                    'bg-zinc-100 dark:bg-zinc-800 text-zinc-600'
                                  }`}>
                                    {v.status === 'pending' ? 'Pending' : v.status}
                                  </span>
                                  {v.documents && v.documents.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedDocument(v.documents[0])}
                                      className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20 flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <FileText className="w-2.5 h-2.5" />
                                      <span>RC</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-zinc-400 italic">No vehicle applied</div>
                        );
                        })()}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                        <button
                          onClick={() => setSelectedMember(m)}
                          className="h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-amber-500" />
                          <span>Details</span>
                        </button>

                        {isPending ? (
                          <button
                            onClick={() => handleApproveMember(m.id)}
                            className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        ) : (
                          <div className="h-8 text-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* Tab 3: Member Invite Pane */}
        {activeTab === 'invite' && inviteLink && (
          <div key="tab-invite" className="animate-tab-pane space-y-3">
            
            {/* Section 1: Member Registration Invite Link */}
            <div className="glass-card p-3.5 sm:p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121214]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                      Member Registration Link
                    </h2>
                    {/* <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                      Share this unique onboarding link with society flat owners and tenants.
                    </p> */}
                  </div>
                </div>

                {/* <button
                  onClick={handleRotateInviteToken}
                  className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                  title="Invalidate current link and generate a fresh security token"
                >
                  <RefreshCw className="w-3 h-3" /> Rotate Security Link
                </button> */}
              </div>

              {/* URL Input with Copy & WhatsApp actions */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2.5">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="flex-1 bg-transparent text-xs font-mono text-amber-600 dark:text-amber-400 focus:outline-none truncate px-1"
                />
                
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={copyInviteLink}
                    className="flex-1 sm:flex-none h-8 px-3 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 text-xs font-bold hover:opacity-95 transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Link</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Dear Residents,\n\nPlease register your vehicles on the official QrParky portal for automated gate entry & encrypted windshield QR passes:\n\n👉 ${inviteUrl}\n\nThank you,\nSociety Committee`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Active Link • Valid for 1 Year
                  {inviteLink.inviteLinkExpiry && ` (Expires: ${new Date(inviteLink.inviteLinkExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})`}
                </span>
              </div>
            </div>

            {/* Section 2: Printable Gate / Notice Board QR Poster */}
            <div className="glass-card p-3.5 sm:p-4 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-gradient-to-b from-white to-amber-50/20 dark:from-[#121214] dark:to-amber-950/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Printable Notice Board Poster</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Hang this poster at the gate or notice board for on-the-spot resident registration.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePrintPoster}
                  className="w-full sm:w-auto h-8 px-3.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Poster</span>
                </button>
              </div>

              {/* Poster Preview Frame */}
              <div className="p-4 rounded-xl bg-white border-2 border-dashed border-amber-400 max-w-xs mx-auto text-center shadow-md text-zinc-900 mb-8 sm:mb-2">
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-zinc-950 font-black text-[11px]">
                    QP
                  </div>
                  <span className="font-extrabold text-sm tracking-tight text-zinc-900">QrParky Access</span>
                </div>

                {user?.societyName && (
                  <div className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-block mb-1.5">
                    📍 {user.societyName}
                  </div>
                )}

                <h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider mb-0.5">
                  Resident Vehicle Registration
                </h4>
                <p className="text-[10px] text-zinc-600 mb-2.5 font-medium">
                  Scan with phone camera to request windshield pass
                </p>

                {/* QR Code image */}
                <div className="p-2 bg-zinc-50 rounded-lg inline-block border border-zinc-200 shadow-inner mb-2.5">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(inviteUrl)}`}
                    alt="Registration QR Code"
                    className="w-32 h-32 rounded"
                  />
                </div>

                <div className="text-[10px] text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 text-left space-y-1">
                  <div className="font-bold text-zinc-900 text-center mb-0.5 text-[11px]">3 Simple Steps:</div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-600">1.</span>
                    <span>Scan QR code with smartphone camera</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-600">2.</span>
                    <span>Submit vehicle & flat owner details</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-600">3.</span>
                    <span>Receive approved windshield pass</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

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
            {(() => {
              const selectedMemberVehicles = getMemberVehicles(selectedMember);
              return (
            <div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" />
                <span>Registered Vehicles ({selectedMemberVehicles.length})</span>
              </div>

              {selectedMemberVehicles.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedMemberVehicles.map((veh) => (
                    <div key={veh.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-white text-xs flex items-center gap-1.5">
                          <span>{veh.vehicleType === '2wheeler' ? '🏍️' : '🚗'}</span>
                          <span>{veh.vehicleName || (veh.vehicleType === '2wheeler' ? 'Two-Wheeler' : 'Four-Wheeler')}</span>
                        </div>
                        <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5 uppercase">
                          {veh.vehicleNumber}
                        </div>
                        <div className="text-zinc-500 text-[11px] capitalize">{veh.vehicleType}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          veh.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 border border-yellow-300'
                        }`}>
                          {veh.status === 'pending' ? 'Pending Pass' : veh.status}
                        </span>

                        {veh.documents && veh.documents.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedDocument(veh.documents[0])}
                            className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold hover:border-amber-400 transition flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-amber-500" />
                            <span>RC Doc</span>
                          </button>
                        )}

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
              );
            })()}

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
              <button
                type="button"
                onClick={() => handlePrintVehiclePass(activeQRData)}
                className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-500" /> Print Windshield Sticker
              </button>

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
          reasonModal.type === 'suspend_pass' || reasonModal.type === 'revoke_qr' ? 'Suspend Vehicle Pass (Temporary Hold)' :
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
                {reasonModal.type === 'suspend_pass' || reasonModal.type === 'revoke_qr'
                  ? 'This temporarily pauses gate access for this vehicle. The resident will see this reason in their dashboard, and you can reactivate it at any time.'
                  : 'Please provide a clear reason so the resident understands the issue.'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {reasonModal.type === 'suspend_pass' || reasonModal.type === 'revoke_qr' ? 'Reason for Suspension' : 'Reason / Explanation'} <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder={reasonModal.type === 'suspend_pass' || reasonModal.type === 'revoke_qr'
                ? "e.g. Society maintenance dues pending for Q3, unauthorized parking slot, temporary rule violation..."
                : "e.g. Invalid RC document uploaded, Vehicle not allotted dedicated parking, Sold/transferred..."
              }
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
              className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50 text-white ${
                reasonModal.type === 'suspend_pass' || reasonModal.type === 'revoke_qr'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {reasonModal.submitting ? 'Processing...' : (reasonModal.type === 'suspend_pass' || reasonModal.type === 'revoke_qr' ? 'Suspend Pass' : 'Confirm Action')}
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
