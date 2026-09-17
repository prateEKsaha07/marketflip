import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import ModernNavbar from "../../components/ui/Navbar";
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Package, 
  Truck,
  Home,
  MapPin,
  Phone,
  Store,
  ChevronRight,
  Sparkles,
  Calendar,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  XCircle,
  Shield,
  User,
  Key,
  Eye,
  EyeOff,
  Check,
  History,
  Star,
  IndianRupee
} from 'lucide-react';
import api, { checkUserReviewed } from '../../api/client';
import ReviewModal from '../../components/review/ReviewModal';
import ReviewBadge from '../../components/review/ReviewBadge';

const MyPurchases = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedBids, setSelectedBids] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [completedRequests, setCompletedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('selected');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [showOtpCode, setShowOtpCode] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReviewTarget, setSelectedReviewTarget] = useState(null);
  const [reviewCheckStatus, setReviewCheckStatus] = useState({});
  const [reviewStats, setReviewStats] = useState({});

  useEffect(() => {
    fetchAllPurchases();
  }, []);

  const fetchAllPurchases = async () => {
    setLoading(true);
    setError('');
    try {
      const purchasedResponse = await api.get('/requests?status=purchased');
      const purchasedData = purchasedResponse.data || [];

      let completedData = [];
      try {
        const completedResponse = await api.get('/requests?status=completed');
        completedData = completedResponse.data || [];
      } catch (err) {
        const allResponse = await api.get('/requests?status=all');
        completedData = allResponse.data.filter(r => r.status === 'completed') || [];
      }

      const selected = [];
      const verification = [];

      for (const req of purchasedData) {
        const isDeliveryConfirmed = req.delivery_confirmed_by_shop === true;
        const isPickup = req.delivery_method === 'pickup';
        const isPending = req.delivery_confirmed_by_shop === null && req.delivery_method === 'home_delivery';
        const isDenied = req.delivery_confirmed_by_shop === false;

        if (isPickup || isDeliveryConfirmed) {
          verification.push(req);
        } else if (isPending || isDenied || !req.delivery_method) {
          selected.push(req);
        } else {
          selected.push(req);
        }
      }

      const selectedWithDetails = await processRequests(selected);
      const verificationWithDetails = await processRequests(verification);
      const completedWithDetails = await processRequests(completedData);

      setSelectedBids(selectedWithDetails);
      setVerificationRequests(verificationWithDetails);
      setCompletedRequests(completedWithDetails);

      for (const req of completedWithDetails) {
        if (req.selectedBid?.shop_id) {
          await checkReviewStatusForCompleted(req.id, req.selectedBid.shop_id);
        }
      }
    } catch (err) {
      setError('Failed to fetch purchases: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const processRequests = async (requests) => {
    if (!requests || requests.length === 0) return [];

    return await Promise.all(
      requests.map(async (req) => {
        try {
          const bidsResponse = await api.get(`/requests/${req.id}/bids`);
          const selectedBid = bidsResponse.data.find(b => b.status === 'selected');

          let shopDetails = null;
          if (selectedBid && selectedBid.shop_id) {
            try {
              const shopResponse = await api.get(`/auth/profiles/${selectedBid.shop_id}`);
              shopDetails = shopResponse.data;
            } catch (err) {
              shopDetails = selectedBid.profiles || null;
            }
          }

          return {
            ...req,
            selectedBid: {
              ...selectedBid,
              shop_details: shopDetails || selectedBid?.profiles || null
            }
          };
        } catch (err) {
          return { ...req, selectedBid: null };
        }
      })
    );
  };

  /* ---------- Review helpers ---------- */
  const checkReviewStatusForCompleted = async (requestId, reviewedId) => {
    try {
      const response = await checkUserReviewed('request', requestId);
      setReviewCheckStatus(prev => ({ ...prev, [requestId]: response.data }));

      if (reviewedId) {
        const statsResponse = await api.get(`/reviews/stats/${reviewedId}`);
        setReviewStats(prev => ({ ...prev, [reviewedId]: statsResponse.data }));
      }
    } catch (err) {
      // silent
    }
  };

  const handleReviewSuccess = (requestId) => {
    setReviewCheckStatus(prev => ({ ...prev, [requestId]: { has_reviewed: true } }));

    const purchase = completedRequests.find(r => r.id === requestId);
    if (purchase?.selectedBid?.shop_id) {
      api.get(`/reviews/stats/${purchase.selectedBid.shop_id}`)
        .then(res => setReviewStats(prev => ({ ...prev, [purchase.selectedBid.shop_id]: res.data })))
        .catch(() => {});
    }
  };

  /* ---------- Settlement handlers ---------- */
  const handleSwitchToPickup = async (requestId) => {
    if (!window.confirm('Switch this order to pickup? The shop cannot deliver to your address.')) return;

    setActionLoading(prev => ({ ...prev, [requestId]: 'pickup' }));
    try {
      await api.patch(`/requests/${requestId}/switch-to-pickup`);
      await fetchAllPurchases();
      if (selectedPurchase && selectedPurchase.id === requestId) setSelectedPurchase(null);
      alert('Switched to pickup. Share the OTP code with the shop to complete.');
    } catch (err) {
      alert('Failed to switch: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleCancelOrder = async (requestId) => {
    if (!window.confirm('Cancel this order?')) return;

    setActionLoading(prev => ({ ...prev, [requestId]: 'cancel' }));
    try {
      await api.patch(`/requests/${requestId}`, { status: 'deleted' });
      await fetchAllPurchases();
      if (selectedPurchase && selectedPurchase.id === requestId) setSelectedPurchase(null);
      alert('Order cancelled.');
    } catch (err) {
      alert('Failed to cancel: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  /* ---------- Delivery status display ---------- */
  const getDeliveryStatusDisplay = (request) => {
    if (!request.delivery_method) {
      return {
        icon: <AlertCircle size={11} />,
        text: 'Select delivery method',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        showActions: false
      };
    }

    if (request.delivery_method === 'pickup') {
      if (request.verification_code) {
        return {
          icon: <Key size={11} />,
          text: 'Pickup · OTP Ready',
          color: 'text-violet-600',
          bg: 'bg-violet-50',
          subtext: 'Share the OTP code with the shop',
          showActions: false,
          hasVerificationCode: true
        };
      }
      return {
        icon: <Home size={11} />,
        text: 'Pickup',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        subtext: 'You selected pickup from shop',
        showActions: false
      };
    }

    if (request.delivery_method === 'home_delivery') {
      if (request.delivery_confirmed_by_shop === true) {
        return {
          icon: <ThumbsUp size={11} />,
          text: 'Delivery Confirmed',
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          subtext: `Confirmed ${request.delivery_response_at ? new Date(request.delivery_response_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'recently'}`,
          showActions: false,
          hasVerificationCode: !!request.verification_code
        };
      }

      if (request.delivery_confirmed_by_shop === false) {
        return {
          icon: <ThumbsDown size={11} />,
          text: 'Delivery Denied',
          color: 'text-rose-600',
          bg: 'bg-rose-50',
          subtext: 'Shop cannot deliver to your address',
          showActions: true
        };
      }

      return {
        icon: <Clock size={11} />,
        text: 'Awaiting Shop Response',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        subtext: 'Shop is deciding whether they can deliver',
        showActions: false
      };
    }

    return null;
  };

  /* ---------- Delivery selection ---------- */
  const handleDeliverySelection = (method) => {
    setDeliveryMethod(method);
    if (method === 'delivery') {
      const address = window.prompt('Please enter your delivery address:');
      if (address) {
        setDeliveryAddress(address);
        setShowConfirmButton(true);
      } else {
        setDeliveryMethod(null);
        alert('Delivery address is required.');
      }
    } else {
      setDeliveryAddress('Pickup from shop');
      setShowConfirmButton(true);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!window.confirm('Confirm delivery method?')) return;

    setUpdating(true);
    try {
      const isPickup = deliveryMethod === 'pickup';
      await api.patch(`/requests/${selectedPurchase.id}/delivery`, {
        delivery_method: isPickup ? 'pickup' : 'home_delivery',
        delivery_address: deliveryAddress
      });

      setSelectedPurchase(null);
      setDeliveryMethod(null);
      setDeliveryAddress('');
      setShowConfirmButton(false);
      await fetchAllPurchases();
    } catch (err) {
      alert('Failed to confirm: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  const handleSelectPurchase = (purchase) => {
    setSelectedPurchase(purchase);
    setDeliveryMethod(null);
    setDeliveryAddress('');
    setShowConfirmButton(false);
    setShowOtpCode(false);
  };

  const handleBack = () => {
    setSelectedPurchase(null);
    setDeliveryMethod(null);
    setDeliveryAddress('');
    setShowConfirmButton(false);
    setShowOtpCode(false);
  };

  const getCurrentList = () => {
    if (activeTab === 'selected') return selectedBids;
    if (activeTab === 'verification') return verificationRequests;
    return completedRequests;
  };

  const currentList = getCurrentList();

  const tabs = [
    { id: 'selected', label: 'Selected', icon: Package, count: selectedBids.length },
    { id: 'verification', label: 'Verify', icon: Clock, count: verificationRequests.length },
    { id: 'completed', label: 'Completed', icon: CheckCircle, count: completedRequests.length },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
  };

  /* ---------- OTP code block ---------- */
  const renderOtpCodeDisplay = (purchase, isCompleted = false) => {
    if (!purchase.verification_code) return null;

    return (
      <div className={`mt-3 p-3 rounded-xl ${isCompleted ? 'bg-blue-50' : 'bg-violet-50'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Key size={12} className={isCompleted ? 'text-blue-600' : 'text-violet-600'} />
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${isCompleted ? 'text-blue-700' : 'text-violet-700'}`}>
            {isCompleted ? 'Verification Code · Archived' : 'Verification Code'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white rounded-lg py-2 px-3 text-center">
            <p className="text-base font-bold tracking-[0.4em] text-[#1A1A2E] font-mono">
              {showOtpCode ? purchase.verification_code : '••••'}
            </p>
          </div>
          <button
            onClick={() => setShowOtpCode(!showOtpCode)}
            className="p-2 bg-white rounded-lg hover:bg-[#F5F3EF] transition-colors"
          >
            {showOtpCode ? <EyeOff size={14} className="text-[#4A4A5A]" /> : <Eye size={14} className="text-[#4A4A5A]" />}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(purchase.verification_code);
              alert('Code copied');
            }}
            className="p-2 bg-white rounded-lg hover:bg-[#F5F3EF] transition-colors"
          >
            <Check size={14} className="text-violet-600" />
          </button>
        </div>
        {!isCompleted && (
          <div className="flex items-center gap-3 mt-2 text-[9px]">
            <span className="text-amber-600">
              {5 - (purchase.verification_attempts || 0)} attempts remaining
            </span>
            {(purchase.verification_attempts || 0) > 0 && (
              <span className="text-amber-600">{purchase.verification_attempts} used</span>
            )}
          </div>
        )}
        {(purchase.verification_attempts || 0) >= 5 && !isCompleted && (
          <p className="text-[9px] text-amber-700 mt-2 flex items-center gap-1">
            <AlertCircle size={10} />
            Max attempts reached. Contact support.
          </p>
        )}
        {isCompleted && purchase.completed_via_override && (
          <p className="text-[9px] text-amber-700 mt-2 flex items-center gap-1">
            <AlertCircle size={10} />
            Completed via manual override
          </p>
        )}
        {!isCompleted && (
          <p className="text-[9px] text-violet-600 mt-2">
            Share with shop to complete the transaction
          </p>
        )}
      </div>
    );
  };

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin text-[#1A1A2E]" />
          <p className="text-[11px] text-[#A0A0B0]">Loading purchases…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-3 sm:p-4 md:p-6">
      <ModernNavbar
        navItems={[
          { name: "Dashboard", path: "/buyer/dashboard", icon: "LayoutDashboard" },
          { name: "Requests", path: "/buyer/requests", icon: "FileText" },
          { name: "Auctions", path: "/buyer/auctions", icon: "Gavel" },
          { name: "Chats", path: "/buyer/chat", icon: "MessageCircle" },
          { name: "History", path: "/buyer/history", icon: "History" },
        ]}
        logo={{ src: "/Logo.png", alt: "MarketFlip", link: "/buyer/dashboard" }}
        showProfile={true}
        showLogout={true}
        showNotifications={true}
        logoutButton={{ label: "Logout", icon: "LogOut", onClick: () => {} }}
        profileButton={{ label: "Profile", path: "/buyer/profile", icon: "User" }}
      />

      <div className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {selectedPurchase ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 mb-3 -ml-1 px-2 py-1.5 text-[11px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors rounded-lg hover:bg-[#F5F3EF]"
              >
                <ArrowLeft size={12} />
                Back to purchases
              </button>

              {/* Detail Hero */}
              <div className="relative overflow-hidden rounded-2xl mb-4 p-4 sm:p-5 bg-gradient-primary bg-[length:200%_200%] animate-gradient">
                <motion.div
                  animate={{ x: [0, 20, 0], y: [0, -14, 0] }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-lightCream/70 blur-3xl pointer-events-none"
                />
                <div className="relative">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      activeTab === 'completed' ? 'bg-white/60 text-blue-700' :
                      activeTab === 'verification' ? 'bg-white/60 text-amber-700' :
                      'bg-white/60 text-emerald-700'
                    }`}>
                      {activeTab === 'selected' && <Package size={9} />}
                      {activeTab === 'verification' && <Clock size={9} />}
                      {activeTab === 'completed' && <CheckCircle size={9} />}
                      {activeTab === 'selected' && 'Pending'}
                      {activeTab === 'verification' && 'Ready to Verify'}
                      {activeTab === 'completed' && 'Completed'}
                    </span>
                    {selectedPurchase.verification_code && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/60 text-violet-700">
                        <Key size={9} />
                        OTP Ready
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-[15px] font-bold text-[#1A1A2E] truncate">
                    {selectedPurchase.item_name}
                  </h2>
                  {selectedPurchase.description && (
                    <p className="text-[10px] text-[#1A1A2E]/70 mt-0.5 line-clamp-2">
                      {selectedPurchase.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Detail body */}
              <div className="space-y-3">
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MetaBlock
                      icon={<IndianRupee size={10} />}
                      label="Budget"
                      value={`₹${selectedPurchase.budget_min?.toLocaleString('en-IN')} – ₹${selectedPurchase.budget_max?.toLocaleString('en-IN')}`}
                    />
                    <MetaBlock
                      icon={<MapPin size={10} />}
                      label="Pincode"
                      value={selectedPurchase.pincode}
                    />
                    <MetaBlock
                      icon={<Calendar size={10} />}
                      label="Posted"
                      value={new Date(selectedPurchase.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    />
                    {selectedPurchase.delivery_method && (
                      <MetaBlock
                        icon={selectedPurchase.delivery_method === 'home_delivery' ? <Home size={10} /> : <MapPin size={10} />}
                        label="Delivery"
                        value={selectedPurchase.delivery_method === 'home_delivery' ? 'Home' : 'Pickup'}
                      />
                    )}
                  </div>
                </div>

                {selectedPurchase.selectedBid && (
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-xl bg-[#FFBE91]/20 flex items-center justify-center">
                        <Store size={12} className="text-[#1A1A2E]" />
                      </div>
                      <h3 className="text-[12px] font-semibold text-[#1A1A2E]">Shop details</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                      <MetaBlock
                        icon={<Store size={10} />}
                        label="Shop"
                        value={selectedPurchase.selectedBid.shop_details?.shop_name || selectedPurchase.selectedBid.shop_name || 'Unknown'}
                      />
                      <MetaBlock
                        icon={<Phone size={10} />}
                        label="Phone"
                        value={selectedPurchase.selectedBid.shop_details?.phone || selectedPurchase.selectedBid.shop_phone || 'N/A'}
                      />
                      <MetaBlock
                        icon={<MapPin size={10} />}
                        label="Address"
                        value={selectedPurchase.selectedBid.shop_details?.address || selectedPurchase.selectedBid.shop_address || 'N/A'}
                        span={2}
                      />
                      <MetaBlock
                        icon={<IndianRupee size={10} />}
                        label="Price"
                        value={`₹${selectedPurchase.selectedBid.price?.toLocaleString('en-IN')}`}
                        accent="text-emerald-600"
                      />
                      <MetaBlock
                        icon={<Calendar size={10} />}
                        label="Selected"
                        value={new Date(selectedPurchase.selectedBid.selected_at || selectedPurchase.purchased_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'verification' &&
                 selectedPurchase.verification_code &&
                 selectedPurchase.delivery_confirmed_by_shop === true &&
                 selectedPurchase.status !== 'completed' && (
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4">
                    {renderOtpCodeDisplay(selectedPurchase, false)}
                  </div>
                )}

                {activeTab === 'completed' && selectedPurchase.verification_code && (
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4">
                    {renderOtpCodeDisplay(selectedPurchase, true)}
                  </div>
                )}

                {selectedPurchase.delivery_method && (
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-xl bg-[#CFEBFF]/50 flex items-center justify-center">
                        <Truck size={12} className="text-[#1A1A2E]" />
                      </div>
                      <h3 className="text-[12px] font-semibold text-[#1A1A2E]">Delivery status</h3>
                    </div>

                    <div className="space-y-2">
                      {selectedPurchase.delivery_method === 'home_delivery' && (
                        <>
                          {selectedPurchase.delivery_confirmed_by_shop === true && (
                            <div className="p-3 bg-emerald-50 rounded-xl">
                              <p className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
                                <ThumbsUp size={11} />
                                Shop confirmed delivery
                              </p>
                              {selectedPurchase.delivery_response_at && (
                                <p className="text-[10px] text-emerald-600 mt-0.5">
                                  Confirmed {new Date(selectedPurchase.delivery_response_at).toLocaleString('en-IN')}
                                </p>
                              )}
                            </div>
                          )}

                          {selectedPurchase.delivery_confirmed_by_shop === false && (
                            <div className="p-3 bg-rose-50 rounded-xl">
                              <p className="text-[11px] text-rose-700 flex items-center gap-1.5 font-medium">
                                <ThumbsDown size={11} />
                                Shop denied delivery
                              </p>
                              <p className="text-[10px] text-rose-600 mt-0.5">
                                Choose pickup or cancel this order.
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <button
                                  onClick={() => handleSwitchToPickup(selectedPurchase.id)}
                                  disabled={!!actionLoading[selectedPurchase.id]}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {actionLoading[selectedPurchase.id] === 'pickup' ? (
                                    <Loader2 size={10} className="animate-spin" />
                                  ) : (
                                    <Home size={10} />
                                  )}
                                  Switch to Pickup
                                </button>
                                <button
                                  onClick={() => handleCancelOrder(selectedPurchase.id)}
                                  disabled={!!actionLoading[selectedPurchase.id]}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {actionLoading[selectedPurchase.id] === 'cancel' ? (
                                    <Loader2 size={10} className="animate-spin" />
                                  ) : (
                                    <XCircle size={10} />
                                  )}
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {selectedPurchase.delivery_confirmed_by_shop === null && (
                            <div className="p-3 bg-amber-50 rounded-xl">
                              <p className="text-[11px] text-amber-700 flex items-center gap-1.5 font-medium">
                                <Clock size={11} />
                                Awaiting shop response
                              </p>
                              <p className="text-[10px] text-amber-600 mt-0.5">
                                Shop is deciding whether they can deliver.
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {selectedPurchase.delivery_method === 'pickup' && (
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <p className="text-[11px] text-blue-700 flex items-center gap-1.5 font-medium">
                            <MapPin size={11} />
                            Pickup selected
                          </p>
                          <p className="text-[10px] text-blue-600 mt-0.5">
                            Collect the item from the shop.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'selected' && !selectedPurchase.delivery_method && (
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-xl bg-[#FFBE91]/20 flex items-center justify-center">
                        <Truck size={12} className="text-[#1A1A2E]" />
                      </div>
                      <h3 className="text-[12px] font-semibold text-[#1A1A2E]">Choose delivery</h3>
                    </div>

                    {!deliveryMethod ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={() => handleDeliverySelection('delivery')}
                          className="flex items-start gap-3 p-3 rounded-xl bg-[#F8F6F0]/60 hover:bg-[#F8F6F0] transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Home size={12} className="text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium text-[#1A1A2E]">Home Delivery</p>
                            <p className="text-[10px] text-[#A0A0B0]">Shop delivers to you</p>
                            <p className="text-[9px] text-amber-600 mt-1">Needs shop confirmation</p>
                          </div>
                        </button>
                        <button
                          onClick={() => handleDeliverySelection('pickup')}
                          className="flex items-start gap-3 p-3 rounded-xl bg-[#F8F6F0]/60 hover:bg-[#F8F6F0] transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <MapPin size={12} className="text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium text-[#1A1A2E]">Pickup</p>
                            <p className="text-[10px] text-[#A0A0B0]">Collect from shop</p>
                            <p className="text-[9px] text-violet-600 mt-1">OTP auto-completes</p>
                          </div>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50 rounded-xl">
                        <p className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
                          <CheckCircle size={11} />
                          Selected: {deliveryMethod === 'delivery' ? 'Home Delivery' : 'Pickup'}
                        </p>
                        {deliveryMethod === 'delivery' && (
                          <p className="text-[10px] text-emerald-600 mt-1">{deliveryAddress}</p>
                        )}
                        <p className="text-[10px] text-amber-600 mt-1">
                          {deliveryMethod === 'delivery'
                            ? 'Waiting for shop to confirm delivery'
                            : 'OTP will auto-complete the transaction'}
                        </p>
                        <button
                          onClick={handleConfirmDelivery}
                          disabled={updating}
                          className="mt-3 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium disabled:opacity-50 transition-colors"
                        >
                          {updating ? 'Confirming…' : 'Confirm Delivery'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'verification' && selectedPurchase.delivery_method && (
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-xl bg-[#CFEBFF]/50 flex items-center justify-center">
                        <Shield size={12} className="text-[#1A1A2E]" />
                      </div>
                      <h3 className="text-[12px] font-semibold text-[#1A1A2E]">Transaction status</h3>
                    </div>
                    <div className="space-y-2 text-[11px]">
                      <StatusLine
                        label="Shop"
                        value={
                          selectedPurchase.delivery_method === 'pickup'
                            ? 'Pickup confirmed'
                            : selectedPurchase.delivery_confirmed_by_shop === true
                              ? 'Delivery confirmed'
                              : selectedPurchase.delivery_confirmed_by_shop === false
                                ? 'Delivery denied'
                                : 'Awaiting confirmation'
                        }
                        color={
                          selectedPurchase.delivery_method === 'pickup' || selectedPurchase.delivery_confirmed_by_shop === true
                            ? 'text-emerald-600'
                            : selectedPurchase.delivery_confirmed_by_shop === false
                              ? 'text-rose-600'
                              : 'text-amber-600'
                        }
                      />
                      <StatusLine
                        label="Method"
                        value={selectedPurchase.delivery_method === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                        color="text-[#1A1A2E]"
                      />
                      {selectedPurchase.verification_code && selectedPurchase.delivery_confirmed_by_shop === true && (
                        <StatusLine
                          label="Verification"
                          value="OTP Ready — share code with shop"
                          color="text-violet-600"
                        />
                      )}
                      <div className="pt-2 border-t border-dashed border-[#EEECE6]">
                        <p className="text-[10px] text-[#A0A0B0]">
                          The transaction will auto-complete when the shop enters the correct OTP code.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'completed' && (
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center">
                        <CheckCircle size={12} className="text-blue-600" />
                      </div>
                      <h3 className="text-[12px] font-semibold text-[#1A1A2E]">Transaction complete</h3>
                    </div>
                    <div className="space-y-2 text-[11px]">
                      <StatusLine label="Status" value="COMPLETED" color="text-emerald-600" />
                      <StatusLine
                        label="Delivery"
                        value={selectedPurchase.delivery_method === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                        color="text-[#1A1A2E]"
                      />
                      {selectedPurchase.delivery_method === 'home_delivery' && selectedPurchase.delivery_address && (
                        <StatusLine
                          label="Address"
                          value={selectedPurchase.delivery_address}
                          color="text-[#1A1A2E]"
                        />
                      )}
                      {selectedPurchase.completed_at && (
                        <StatusLine
                          label="Completed"
                          value={new Date(selectedPurchase.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          color="text-[#1A1A2E]"
                        />
                      )}
                      {selectedPurchase.completed_via_override && (
                        <p className="text-[10px] text-amber-600 flex items-center gap-1 pt-1">
                          <AlertCircle size={10} />
                          Completed via manual override
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'completed' && selectedPurchase.selectedBid?.shop_id && (
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      {reviewStats[selectedPurchase.selectedBid.shop_id] && (
                        <ReviewBadge
                          averageRating={reviewStats[selectedPurchase.selectedBid.shop_id].average_rating}
                          totalReviews={reviewStats[selectedPurchase.selectedBid.shop_id].total_reviews}
                          size="sm"
                        />
                      )}
                    </div>
                    <div>
                      {!reviewCheckStatus[selectedPurchase.id]?.has_reviewed ? (
                        <button
                          onClick={() => {
                            const shopName = selectedPurchase.selectedBid?.shop_details?.shop_name ||
                                           selectedPurchase.selectedBid?.shop_name ||
                                           'the shop';
                            setSelectedReviewTarget({
                              targetType: 'request',
                              targetId: selectedPurchase.id,
                              reviewedId: selectedPurchase.selectedBid?.shop_id,
                              reviewedName: shopName
                            });
                            setShowReviewModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] text-[11px] font-medium rounded-lg transition-colors"
                        >
                          <Star size={11} className="fill-[#1A1A2E]" />
                          Leave Review
                        </button>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                          <CheckCircle size={11} />
                          Reviewed
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                onClick={() => navigate('/buyer/requests')}
                className="flex items-center gap-1.5 mb-3 -ml-1 px-2 py-1.5 text-[11px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors rounded-lg hover:bg-[#F5F3EF]"
              >
                <ArrowLeft size={12} />
                Back to requests
              </button>

              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden rounded-2xl mb-4 sm:mb-5 p-4 sm:p-5 bg-gradient-primary bg-[length:200%_200%] animate-gradient"
              >
                <motion.div
                  animate={{ x: [0, 25, 0], y: [0, -18, 0] }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-lightCream/70 blur-3xl pointer-events-none"
                />
                <motion.div
                  animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-softBlue/50 blur-3xl pointer-events-none"
                />
                <div className="relative flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <motion.h1
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, duration: 0.35 }}
                      className="text-base sm:text-[15px] font-bold text-[#1A1A2E] truncate"
                    >
                      My Purchases
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.35 }}
                      className="text-[10px] text-[#1A1A2E]/70 mt-0.5"
                    >
                      {selectedBids.length} pending · {verificationRequests.length} to verify · {completedRequests.length} completed
                    </motion.p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={fetchAllPurchases}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/40 backdrop-blur-sm rounded-full flex-shrink-0 mt-0.5 hover:bg-white/60 transition-colors"
                  >
                    <RefreshCw size={11} className="text-[#1A1A2E]" />
                    <span className="text-[10px] font-medium text-[#1A1A2E]">Refresh</span>
                  </motion.button>
                </div>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="p-3 bg-rose-50 rounded-2xl flex items-start gap-2 overflow-hidden"
                  >
                    <AlertCircle size={14} className="text-rose-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium text-rose-600 flex-1">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex gap-1 p-1 bg-white/70 backdrop-blur-xl rounded-2xl mb-4 overflow-x-auto"
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium transition-all min-w-fit ${
                        active
                          ? 'bg-[#1A1A2E] text-white'
                          : 'text-[#A0A0B0] hover:text-[#4A4A5A] hover:bg-[#F8F6F0]'
                      }`}
                    >
                      <Icon size={11} />
                      <span>{tab.label}</span>
                      <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                        active ? 'bg-white/20 text-white' : 'bg-[#F8F6F0] text-[#A0A0B0]'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </motion.div>

              <AnimatePresence mode="wait">
                {currentList.length === 0 && !error && (
                  <motion.div
                    key={`empty-${activeTab}`}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 text-center"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#F8F6F0] flex items-center justify-center mx-auto mb-3">
                      {activeTab === 'selected' && <Package size={20} className="text-[#A0A0B0]" />}
                      {activeTab === 'verification' && <Clock size={20} className="text-[#A0A0B0]" />}
                      {activeTab === 'completed' && <CheckCircle size={20} className="text-[#A0A0B0]" />}
                    </div>
                    <h3 className="text-[12px] font-medium text-[#1A1A2E]">
                      {activeTab === 'selected' && 'No pending orders'}
                      {activeTab === 'verification' && 'Nothing to verify'}
                      {activeTab === 'completed' && 'No completed transactions'}
                    </h3>
                    <p className="text-[10px] text-[#A0A0B0] mt-0.5">
                      {activeTab === 'selected' && 'Selected bids will appear here'}
                      {activeTab === 'verification' && 'Orders ready for OTP will appear here'}
                      {activeTab === 'completed' && 'Finished transactions will show here'}
                    </p>
                    <button
                      onClick={() => navigate('/buyer/dashboard')}
                      className="mt-3 inline-flex items-center gap-1.5 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[11px] font-medium px-4 py-2 rounded-xl transition-colors"
                    >
                      Go to Dashboard
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {currentList.length > 0 && (
                <motion.div
                  key={`list-${activeTab}`}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2.5"
                >
                  {currentList.map((purchase) => {
                    const deliveryDisplay = getDeliveryStatusDisplay(purchase);
                    const isLoading = actionLoading[purchase.id];
                    const isVerification = activeTab === 'verification';
                    const isCompleted = activeTab === 'completed';
                    const hasOtpCode = purchase.verification_code && purchase.delivery_confirmed_by_shop === true;

                    return (
                      <motion.div
                        key={purchase.id}
                        variants={itemVariants}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.995 }}
                        onClick={() => handleSelectPurchase(purchase)}
                        className="bg-white/70 backdrop-blur-xl rounded-2xl p-3 sm:p-4 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="text-[12px] sm:text-[13px] font-semibold text-[#1A1A2E] truncate">
                                {purchase.item_name}
                              </h3>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                                isCompleted ? 'bg-blue-100 text-blue-700' :
                                isVerification ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {isCompleted && <CheckCircle size={8} />}
                                {isVerification && <Clock size={8} />}
                                {!isVerification && !isCompleted && <Package size={8} />}
                                {isCompleted ? 'Completed' : isVerification ? 'Ready' : 'Pending'}
                              </span>
                              {hasOtpCode && (isVerification || isCompleted) && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-violet-100 text-violet-700">
                                  <Key size={8} />
                                  {isCompleted ? 'Archived' : 'OTP'}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px] text-[#A0A0B0]">
                              <span className="flex items-center gap-1 font-medium text-[#1A1A2E]">
                                <IndianRupee size={9} />
                                {purchase.budget_min?.toLocaleString('en-IN')} – {purchase.budget_max?.toLocaleString('en-IN')}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin size={9} />
                                {purchase.pincode}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={9} />
                                {new Date(purchase.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>

                            {deliveryDisplay && (
                              <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] ${deliveryDisplay.bg} ${deliveryDisplay.color}`}>
                                {deliveryDisplay.icon}
                                <span className="font-medium">{deliveryDisplay.text}</span>
                                {deliveryDisplay.hasVerificationCode && (
                                  <Key size={9} className="ml-0.5" />
                                )}
                              </div>
                            )}

                            {purchase.selectedBid && (
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-[10px]">
                                <span className="flex items-center gap-1 text-[#4A4A5A]">
                                  <Store size={9} />
                                  {purchase.selectedBid.shop_details?.shop_name || purchase.selectedBid.shop_name || 'Unknown'}
                                </span>
                                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                  <IndianRupee size={9} />
                                  {purchase.selectedBid.price?.toLocaleString('en-IN')}
                                </span>
                              </div>
                            )}

                            {deliveryDisplay?.showActions && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSwitchToPickup(purchase.id);
                                  }}
                                  disabled={!!isLoading}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {isLoading === 'pickup' ? <Loader2 size={9} className="animate-spin" /> : <Home size={9} />}
                                  Switch to Pickup
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelOrder(purchase.id);
                                  }}
                                  disabled={!!isLoading}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {isLoading === 'cancel' ? <Loader2 size={9} className="animate-spin" /> : <XCircle size={9} />}
                                  Cancel
                                </button>
                              </div>
                            )}

                            {isCompleted && purchase.selectedBid?.shop_id && (
                              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-dashed border-[#EEECE6]">
                                <div className="min-w-0">
                                  {reviewStats[purchase.selectedBid.shop_id] && (
                                    <ReviewBadge
                                      averageRating={reviewStats[purchase.selectedBid.shop_id].average_rating}
                                      totalReviews={reviewStats[purchase.selectedBid.shop_id].total_reviews}
                                      size="sm"
                                    />
                                  )}
                                </div>
                                <div className="flex-shrink-0">
                                  {!reviewCheckStatus[purchase.id]?.has_reviewed ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const shopName = purchase.selectedBid?.shop_details?.shop_name ||
                                                       purchase.selectedBid?.shop_name ||
                                                       'the shop';
                                        setSelectedReviewTarget({
                                          targetType: 'request',
                                          targetId: purchase.id,
                                          reviewedId: purchase.selectedBid?.shop_id,
                                          reviewedName: shopName
                                        });
                                        setShowReviewModal(true);
                                      }}
                                      className="flex items-center gap-1 px-2 py-1 bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] text-[10px] font-medium rounded-lg transition-colors"
                                    >
                                      <Star size={9} className="fill-[#1A1A2E]" />
                                      Review
                                    </button>
                                  ) : (
                                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                                      <CheckCircle size={9} />
                                      Reviewed
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <ChevronRight size={14} className="text-[#A0A0B0] group-hover:translate-x-0.5 group-hover:text-[#1A1A2E] transition-all flex-shrink-0 mt-1" />
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedReviewTarget(null);
        }}
        targetType={selectedReviewTarget?.targetType}
        targetId={selectedReviewTarget?.targetId}
        reviewedId={selectedReviewTarget?.reviewedId}
        reviewedName={selectedReviewTarget?.reviewedName}
        onSuccess={() => {
          if (selectedReviewTarget) handleReviewSuccess(selectedReviewTarget.targetId);
        }}
      />
    </div>
  );
};

/* ---------- Small building blocks ---------- */
const MetaBlock = ({ icon, label, value, span = 1, accent = '' }) => (
  <div className={span === 2 ? 'sm:col-span-2' : ''}>
    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wide text-[#A0A0B0]">
      {icon}
      {label}
    </span>
    <p className={`text-[11px] mt-0.5 break-words ${accent || 'text-[#1A1A2E]'}`}>{value}</p>
  </div>
);

const StatusLine = ({ label, value, color = 'text-[#1A1A2E]' }) => (
  <div className="flex items-center gap-2">
    <span className="text-[#A0A0B0] text-[10px] uppercase tracking-wide min-w-[70px]">{label}</span>
    <span className={`text-[11px] font-medium ${color}`}>{value}</span>
  </div>
);

export default MyPurchases;