import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { Car, Plus, QrCode, CreditCard, CheckCircle2, AlertCircle, Clock, ShieldAlert, Download, RefreshCw } from 'lucide-react';

export default function MemberDashboard() {
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vehicle Registration Modal & Form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('4wheeler');
  const [passType, setPassType] = useState('regular'); // 'regular' or 'professional'
  const [registering, setRegistering] = useState(false);

  // Batch Payment State
  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [createdOrderData, setCreatedOrderData] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // QR Vault Modal State
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

  const handleRegisterVehicle = async (e) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const res = await API.post('/member/vehicles', {
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        vehicleType,
        passType,
      });

      if (res.data.success) {
        toast.success(
          passType === 'regular'
            ? 'Vehicle registered! Regular pass is FREE and activates upon Admin approval.'
            : 'Vehicle registered for Professional Pass! Will move to payment upon Admin approval.'
        );
        setVehicleNumber('');
        setPassType('regular');
        setIsAddOpen(false);
        fetchVehicles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register vehicle.');
    } finally {
      setRegistering(false);
    }
  };

  const toggleSelectVehicle = (id) => {
    if (selectedVehicleIds.includes(id)) {
      setSelectedVehicleIds(selectedVehicleIds.filter((vId) => vId !== id));
    } else {
      setSelectedVehicleIds([...selectedVehicleIds, id]);
    }
  };

  const handleInitiateBatchPayment = async () => {
    if (selectedVehicleIds.length === 0) {
      toast.error('Please select at least one vehicle awaiting payment.');
      return;
    }

    try {
      const idempotencyKey = `idempotent_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const res = await API.post('/member/orders', {
        vehicleIds: selectedVehicleIds,
        idempotencyKey,
      });

      if (res.data.success) {
        setCreatedOrderData(res.data.data);
        setCheckoutModalOpen(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate order.');
    }
  };

  const handleExecuteCheckout = async () => {
    if (!createdOrderData) return;
    setProcessingPayment(true);

    try {
      const mockPaymentPayload = {
        event: 'order.paid',
        razorpay_order_id: createdOrderData.razorpayOrderId,
        razorpay_payment_id: `pay_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        razorpay_signature: 'mock_valid_signature',
      };

      const webhookRes = await API.post('/webhooks/razorpay', mockPaymentPayload);

      if (webhookRes.data.success) {
        toast.success('Payment verified! Vehicles activated and QR codes generated.');
        setCheckoutModalOpen(false);
        setSelectedVehicleIds([]);
        fetchVehicles();
      }
    } catch (err) {
      toast.error('Payment verification failed.');
    } finally {
      setProcessingPayment(false);
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

  const awaitingPaymentVehicles = vehicles.filter((v) => v.status === 'awaiting_payment');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Car className="w-3.5 h-3.5" /> Digital Vehicle Vault
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Registered Vehicles & Passes</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {awaitingPaymentVehicles.length > 0 && (
            <button
              onClick={handleInitiateBatchPayment}
              disabled={selectedVehicleIds.length === 0}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 font-bold text-xs hover:opacity-95 transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-40"
            >
              <CreditCard className="w-3.5 h-3.5" /> Pay & Activate ({selectedVehicleIds.length})
            </button>
          )}

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 font-bold text-xs hover:opacity-95 transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Plus className="w-3.5 h-3.5" /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Vehicles Table / Grid */}
      <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-6 bg-white/90 dark:bg-[#121214]">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-sm animate-pulse">Loading registered vehicles...</div>
        ) : vehicles.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            No vehicles registered yet. Click <span className="font-bold text-amber-600 dark:text-amber-400">"Add Vehicle"</span> to submit registration.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
              <thead className="bg-zinc-100 dark:bg-[#18181b] text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 w-12">Select</th>
                  <th className="px-6 py-4">Vehicle Number</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Pass Tier</th>
                  <th className="px-6 py-4">Approval & Access Status</th>
                  <th className="px-6 py-4 text-right">Digital Vault</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-zinc-50 dark:hover:bg-[#18181b]/50 transition">
                    <td className="px-6 py-4">
                      {v.status === 'awaiting_payment' ? (
                        <input
                          type="checkbox"
                          checked={selectedVehicleIds.includes(v.id)}
                          onChange={() => toggleSelectVehicle(v.id)}
                          className="w-4 h-4 rounded bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-amber-500 focus:ring-0 cursor-pointer"
                        />
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600 font-mono text-xs">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-zinc-900 dark:text-white text-base">
                      {v.vehicleNumber}
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-zinc-600 dark:text-zinc-300 capitalize">
                      {v.vehicleType}
                    </td>

                    <td className="px-6 py-4 text-xs">
                      {v.passType === 'professional' ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 font-bold">
                          💎 Professional (₹299)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-[#18181b] text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 font-bold">
                          🟢 Regular (Free)
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        v.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' :
                        v.status === 'awaiting_payment' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800' :
                        v.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800' :
                        'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                      }`}>
                        {v.status === 'active' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                        {v.status === 'awaiting_payment' && <CreditCard className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                        {v.status === 'pending' && <Clock className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />}
                        {v.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {v.status === 'active' ? (
                        <button
                          onClick={() => handleViewQR(v.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-xs font-bold transition inline-flex items-center gap-1.5"
                        >
                          <QrCode className="w-4 h-4" /> Access QR Pass
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                          {v.status === 'awaiting_payment' ? 'Select & Pay to Activate QR' : 'Admin Approval Pending'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Register New Vehicle */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Vehicle">
        <form onSubmit={handleRegisterVehicle} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Vehicle License Plate Number
            </label>
            <input
              type="text"
              required
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="e.g. MH02AB1234"
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-mono placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Vehicle Category Type
            </label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 transition"
            >
              <option value="4wheeler">4 Wheeler (Car / SUV)</option>
              <option value="2wheeler">2 Wheeler (Bike / Scooter)</option>
              <option value="other">Other Commercial / EV</option>
            </select>
          </div>

          {/* Pass Tier Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Choose Pass Tier
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setPassType('regular')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                  passType === 'regular'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500 text-zinc-900 dark:text-white'
                    : 'bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-zinc-900 dark:text-white">🟢 Regular Pass</span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">FREE (₹0)</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                  Instant QR generated upon Society Admin approval.
                </p>
              </div>

              <div
                onClick={() => setPassType('professional')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                  passType === 'professional'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500 text-zinc-900 dark:text-white'
                    : 'bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-zinc-900 dark:text-white">💎 Professional</span>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">₹299 Fee</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                  Premium holographic pass + printable windshield sticker.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={registering}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 font-bold text-sm hover:opacity-95 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
            >
              {registering ? 'Submitting...' : passType === 'regular' ? 'Submit for Free Regular Pass' : 'Submit for Professional Pass (₹299)'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Razorpay / Sandbox Batch Checkout Modal */}
      <Modal isOpen={checkoutModalOpen} onClose={() => setCheckoutModalOpen(false)} title="Razorpay Batch Checkout">
        {createdOrderData && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Order Reference ID:</span>
                <span className="font-mono text-zinc-900 dark:text-white font-bold">{createdOrderData.razorpayOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Total Payable Amount:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base">₹{createdOrderData.amount / 100} INR</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-500/40 text-xs text-amber-800 dark:text-amber-200">
              ⚡ Razorpay Signature Verification webhook will execute server-side to activate selected vehicles and issue encrypted QR codes.
            </div>

            <button
              onClick={handleExecuteCheckout}
              disabled={processingPayment}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 font-bold text-base hover:opacity-95 shadow-xl shadow-amber-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processingPayment ? 'Verifying Webhook Signature...' : `Pay ₹${createdOrderData.amount / 100} & Activate QR Passes`}
            </button>
          </div>
        )}
      </Modal>

      {/* Modal 3: Digital Encrypted QR Vault Pass */}
      <Modal isOpen={!!activeQRData} onClose={() => setActiveQRData(null)} title="Official Society Access QR Pass">
        {activeQRData && (
          <div className="text-center space-y-4">
            <div className="p-4 rounded-2xl bg-white max-w-[260px] mx-auto shadow-2xl border-4 border-amber-400">
              <img src={activeQRData.qrImageUrl} alt="Society QR Pass" className="w-full h-auto rounded-lg" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white font-mono">{activeQRData.vehicleNumber}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs capitalize">{activeQRData.vehicleType} Access Pass</p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-amber-600 dark:text-amber-400 break-all text-left">
              <span className="text-zinc-400 dark:text-zinc-500 uppercase font-bold block mb-1">Encrypted Payload Token:</span>
              {activeQRData.payloadEncrypted}
            </div>

            <a
              href={activeQRData.qrImageUrl}
              download={`QRParky_${activeQRData.vehicleNumber}.png`}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-zinc-950 font-bold text-sm hover:opacity-95 shadow-md shadow-amber-500/20 transition inline-flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download QR Sticker Image
            </a>
          </div>
        )}
      </Modal>

    </div>
  );
}
