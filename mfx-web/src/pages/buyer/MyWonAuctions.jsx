import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import ModernNavbar from "../../components/ui/Navbar";
import { 
  ArrowLeft, 
  Package, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Search,
  Eye,
  EyeOff,
  ChevronRight,
  Loader2,
  MapPin,
  Truck,
  Store,
  Key,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Home,
  Building2,
  Star,
  IndianRupee,
  Trophy,
  Sparkles,
  X
} from 'lucide-react';
import api from '../../api/client';
import ReviewModal from '../../components/review/ReviewModal';
import ReviewBadge from '../../components/review/ReviewBadge';
import { checkUserReviewed } from '../../api/client';

/* ---------- Small building blocks ---------- */
const StatusPill = ({ status }) => {
  const config = (() => {
    switch (status) {
      case 'sold':
        return { cls: 'bg-blue-50 text-blue-700', label: 'Awaiting delivery', Icon: Truck };
      case 'completed':
        return { cls: 'bg-emerald-50 text-emerald-700', label: 'Completed', Icon: CheckCircle };
      default:
        return { cls: 'bg-[#F8F6F0] text-[#4A4A5A]', label: status, Icon: AlertCircle };
    }
  })();
  const { cls, label, Icon } = config;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${cls}`}>
      <Icon size={8} />
      {label}
    </span>
  );
};

const MetaLine = ({ icon: Icon, children, accent = '' }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] ${accent || 'text-[#A0A0B0]'}`}>
    <Icon size={9} className="flex-shrink-0" />
    <span className="truncate">{children}</span>
  </span>
);

const MyWonAuctions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [otpCopied, setOtpCopied] = useState({});
  const [otpVisible, setOtpVisible] = useState({});
  const [deliveryAddresses, setDeliveryAddresses] = useState({});
  const [deliveryMethods, setDeliveryMethods] = useState({});

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReviewTarget, setSelectedReviewTarget] = useState(null);
  const [reviewCheckStatus, setReviewCheckStatus] = useState({});
  const [reviewStats, setReviewStats] = useState({});

  // Ref map for auto-focusing the address textarea per auction
  const addressRefs = useRef({});

  const filteredAuctions = useMemo(() => {
    let filtered = [...auctions];
    if (statusFilter !== 'all') filtered = filtered.filter(a => a.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(a =>
        a.item_name.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q))
      );
    }
    if (categoryFilter) filtered = filtered.filter(a => a.category === categoryFilter);
    filtered.sort((a, b) => new Date(b.closed_at || b.created_at) - new Date(a.closed_at || a.created_at));
    return filtered;
  }, [auctions, statusFilter, searchQuery, categoryFilter]);

  useEffect(() => { fetchWonAuctions(); }, []);

  const fetchWonAuctions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/auctions?status=all');
      const allAuctions = response.data || [];
      const won = allAuctions.filter(a =>
        a.current_highest_bidder === user?.id &&
        ['sold', 'completed'].includes(a.status)
      );
      setAuctions(won);
      for (const auction of won) {
        if (auction.status === 'completed' && auction.shop_id) {
          await checkReviewStatusForCompleted(auction.id, auction.shop_id);
        }
      }
    } catch (err) {
      setError('Failed to load won auctions: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const checkReviewStatusForCompleted = async (auctionId, reviewedId) => {
    try {
      const response = await checkUserReviewed('auction', auctionId);
      setReviewCheckStatus(prev => ({ ...prev, [auctionId]: response.data }));
      if (reviewedId) {
        const statsResponse = await api.get(`/reviews/stats/${reviewedId}`);
        setReviewStats(prev => ({ ...prev, [reviewedId]: statsResponse.data }));
      }
    } catch (err) {}
  };

  const handleReviewSuccess = (auctionId) => {
    setReviewCheckStatus(prev => ({ ...prev, [auctionId]: { has_reviewed: true } }));
    const auction = auctions.find(a => a.id === auctionId);
    if (auction?.shop_id) {
      api.get(`/reviews/stats/${auction.shop_id}`)
        .then(res => setReviewStats(prev => ({ ...prev, [auction.shop_id]: res.data })))
        .catch(() => {});
    }
  };

  const handleSelectDeliveryMethod = (auctionId, method) => {
    setDeliveryMethods(prev => ({ ...prev, [auctionId]: method }));
    setError('');

    if (method === 'home_delivery') {
      setTimeout(() => {
        addressRefs.current[auctionId]?.focus();
      }, 220);
    }
  };

  const handleSetDeliveryMethod = async (auctionId) => {
    const method = deliveryMethods[auctionId] || '';
    const address = deliveryAddresses[auctionId] || '';
    if (!method) { setError('Please select a delivery method'); return; }
    if (method === 'home_delivery' && !address.trim()) {
      setError('Please enter your delivery address'); return;
    }
    setActionLoading(auctionId);
    setError(''); setSuccessMessage('');
    try {
      const response = await api.patch(`/auctions/${auctionId}/delivery`, {
        delivery_method: method,
        delivery_address: method === 'home_delivery' ? address : null
      });
      setSuccessMessage(response.data.verification_code
        ? `Delivery set · OTP: ${response.data.verification_code}`
        : 'Delivery method set');
      await fetchWonAuctions();
    } catch (err) {
      setError('Failed to set delivery method: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSwitchToPickup = async (auctionId) => {
    if (!window.confirm('Switch to pickup? The shop will verify the OTP in person.')) return;
    setActionLoading(auctionId);
    setError(''); setSuccessMessage('');
    try {
      const response = await api.patch(`/auctions/${auctionId}/switch-to-pickup`);
      if (response.data.verification_code) {
        setSuccessMessage(`Switched to pickup · OTP: ${response.data.verification_code}`);
      }
      await fetchWonAuctions();
    } catch (err) {
      setError('Failed to switch to pickup: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleOverrideComplete = async (auctionId) => {
    if (!window.confirm('Override completion? This will mark the transaction as complete.')) return;
    setActionLoading(auctionId);
    try {
      await api.patch(`/auctions/${auctionId}/override-complete`);
      setSuccessMessage('Transaction completed via override');
      await fetchWonAuctions();
    } catch (err) {
      setError('Failed to override: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyOtp = (auctionId, code) => {
    navigator.clipboard.writeText(code);
    setOtpCopied(prev => ({ ...prev, [auctionId]: true }));
    setTimeout(() => setOtpCopied(prev => ({ ...prev, [auctionId]: false })), 2000);
  };

  const toggleOtpVisibility = (auctionId) => {
    setOtpVisible(prev => ({ ...prev, [auctionId]: !prev[auctionId] }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  };

  const counts = {
    all: auctions.length,
    sold: auctions.filter(a => a.status === 'sold').length,
    completed: auctions.filter(a => a.status === 'completed').length,
  };

  const statusTabs = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'sold', label: 'Awaiting', count: counts.sold },
    { id: 'completed', label: 'Completed', count: counts.completed },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin text-[#1A1A2E]" />
          <p className="text-[11px] text-[#A0A0B0]">Loading won auctions…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
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

      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate('/buyer/auctions')}
          className="flex items-center gap-1.5 mb-3 -ml-1 px-2 py-1.5 text-[11px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors rounded-lg hover:bg-[#F5F3EF]"
        >
          <ArrowLeft size={12} />
          Back to auctions
        </motion.button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl mb-3 sm:mb-4 p-4 bg-gradient-primary bg-[length:200%_200%] animate-gradient"
        >
          <motion.div
            animate={{ x: [0, 25, 0], y: [0, -18, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-lightCream/70 blur-3xl pointer-events-none"
          />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/50 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Trophy size={18} className="text-[#1A1A2E]" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[15px] font-bold text-[#1A1A2E] truncate">Won Auctions</h1>
              <p className="text-[10px] text-[#1A1A2E]/70 mt-0.5 truncate">
                {counts.all} won · {counts.sold} awaiting · {counts.completed} completed
              </p>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 10 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="p-2.5 bg-emerald-50 rounded-2xl flex items-start gap-2 overflow-hidden"
            >
              <CheckCircle size={13} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-emerald-700 flex-1 break-words">
                {successMessage}
              </p>
              <button onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-700 flex-shrink-0 p-0.5">
                <X size={11} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 10 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="p-2.5 bg-rose-50 rounded-2xl flex items-start gap-2 overflow-hidden"
            >
              <AlertCircle size={13} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-rose-600 flex-1 break-words">{error}</p>
              <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 flex-shrink-0 p-0.5">
                <X size={11} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs + search inline */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-2 mb-3"
        >
          <div className="flex gap-1 p-1 bg-white/70 backdrop-blur-xl rounded-2xl overflow-x-auto flex-shrink-0">
            {statusTabs.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all min-w-fit ${
                    active ? 'bg-[#1A1A2E] text-white' : 'text-[#A0A0B0] hover:text-[#4A4A5A]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                    active ? 'bg-white/20 text-white' : 'bg-[#F8F6F0] text-[#A0A0B0]'
                  }`}>{tab.count}</span>
                </button>
              );
            })}
          </div>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
              <input
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-[11px] bg-white/70 backdrop-blur-xl border-0 rounded-full text-[#1A1A2E] placeholder-[#A0A0B0] focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/40 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A0A0B0]">
                  <X size={10} />
                </button>
              )}
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-[10px] bg-white/70 backdrop-blur-xl border-0 rounded-full text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/40 appearance-none max-w-[110px]"
            >
              <option value="">All</option>
              <option value="electronics">Electronics</option>
              <option value="furniture">Furniture</option>
              <option value="clothing">Clothing</option>
              <option value="books">Books</option>
              <option value="home_kitchen">Home & Kitchen</option>
              <option value="vehicles">Vehicles</option>
              <option value="other">Other</option>
            </select>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={fetchWonAuctions}
              className="p-1.5 text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors rounded-full hover:bg-[#F5F3EF] flex-shrink-0"
            >
              <RefreshCw size={12} />
            </motion.button>
          </div>
        </motion.div>

        {/* List */}
        {filteredAuctions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#F8F6F0] flex items-center justify-center mx-auto mb-3">
              <Trophy size={20} className="text-[#A0A0B0]" />
            </div>
            <h3 className="text-[12px] font-medium text-[#1A1A2E]">No won auctions</h3>
            <p className="text-[10px] text-[#A0A0B0] mt-0.5">
              {statusFilter === 'all' ? 'Your won auctions will appear here' : `No ${statusFilter} auctions`}
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/buyer/auctions/browse')}
              className="mt-3 inline-flex items-center gap-1.5 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[11px] font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <Store size={11} />
              Browse Auctions
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2.5"
          >
            {filteredAuctions.map((auction) => {
              const firstImage = auction.image_urls?.[0];
              const isSold = auction.status === 'sold';
              const isCompleted = auction.status === 'completed';
              const isActionLoading = actionLoading === auction.id;
              const hasOtp = auction.verification_code !== null && auction.verification_code !== undefined;
              const otpCode = auction.verification_code || '';
              const attempts = auction.verification_attempts || 0;
              const maxAttempts = 5;
              const attemptsRemaining = maxAttempts - attempts;
              const isOverridden = auction.completed_via_override === true;
              const isOtpVisible = otpVisible[auction.id] || false;
              const isOtpCopied = otpCopied[auction.id] || false;
              const selectedDelivery = deliveryMethods[auction.id] || '';

              return (
                <motion.div
                  key={auction.id}
                  variants={itemVariants}
                  className="bg-white/70 backdrop-blur-xl rounded-2xl"
                >
                  {/* Top row */}
                  <div
                    className="p-3 flex items-start gap-3 cursor-pointer active:bg-[#F8F6F0]/60 transition-colors rounded-t-2xl"
                    onClick={() => navigate(`/buyer/auctions/${auction.id}`)}
                  >
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={auction.item_name}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#F8F6F0] flex items-center justify-center flex-shrink-0">
                        <Package size={18} className="text-[#A0A0B0]" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-[12px] font-semibold text-[#1A1A2E] truncate">
                          {auction.item_name}
                        </h3>
                        <StatusPill status={auction.status} />
                        {isOverridden && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-50 text-amber-700">
                            <ShieldCheck size={8} />
                            Override
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
                        <MetaLine icon={IndianRupee} accent="text-emerald-600 font-semibold">
                          {(auction.current_highest_bid || auction.starting_price)?.toLocaleString('en-IN')}
                        </MetaLine>
                        {auction.pincode && <MetaLine icon={MapPin}>{auction.pincode}</MetaLine>}
                        {auction.delivery_method && (
                          <MetaLine icon={Truck}>
                            {auction.delivery_method === 'home_delivery' ? 'Home' : 'Pickup'}
                          </MetaLine>
                        )}
                      </div>

                      <p className="text-[9px] text-[#A0A0B0] mt-1">
                        Won {new Date(auction.closed_at || auction.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <ChevronRight size={14} className="text-[#A0A0B0] flex-shrink-0 mt-1" />
                  </div>

                  {/* Action bar for sold */}
                  {isSold && (
                    <div className="px-3 pb-3">
                      {!auction.delivery_method ? (
                        <div className="bg-[#F8F6F0]/70 rounded-xl p-3 space-y-3">
                          <p className="text-[10px] font-medium text-[#4A4A5A]">
                            Set delivery method
                          </p>

                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { value: 'home_delivery', label: 'Home Delivery', icon: Home },
                              { value: 'pickup', label: 'Pickup', icon: Building2 },
                            ].map(({ value, label, icon: Icon }) => {
                              const active = selectedDelivery === value;
                              return (
                                <motion.button
                                  key={value}
                                  type="button"
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => handleSelectDeliveryMethod(auction.id, value)}
                                  className={`flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] rounded-lg transition-all ${
                                    active
                                      ? 'bg-[#1A1A2E] text-white font-medium'
                                      : 'bg-white text-[#4A4A5A] hover:bg-white/90'
                                  }`}
                                >
                                  <Icon size={11} />
                                  {label}
                                </motion.button>
                              );
                            })}
                          </div>

                          {/* Address input — no clipping */}
                          <AnimatePresence initial={false}>
                            {selectedDelivery === 'home_delivery' && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                className="overflow-hidden"
                              >
                                <div className="pt-1">
                                  <label className="block text-[9px] uppercase tracking-wide text-[#A0A0B0] mb-1.5 ml-0.5">
                                    Delivery address
                                  </label>
                                  <textarea
                                    ref={(el) => {
                                      if (el) addressRefs.current[auction.id] = el;
                                    }}
                                    value={deliveryAddresses[auction.id] || ''}
                                    onChange={(e) =>
                                      setDeliveryAddresses(prev => ({ ...prev, [auction.id]: e.target.value }))
                                    }
                                    placeholder="House / street / landmark / city"
                                    className="block w-full box-border px-3 py-2.5 text-[11px] leading-relaxed bg-white border-0 rounded-lg text-[#1A1A2E] placeholder-[#A0A0B0] focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/40 focus:ring-inset resize-none"
                                    rows={3}
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleSetDeliveryMethod(auction.id)}
                            disabled={isActionLoading}
                            className="w-full flex items-center justify-center gap-1.5 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[11px] font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isActionLoading ? <Loader2 size={12} className="animate-spin" /> : <Truck size={11} />}
                            Confirm delivery method
                          </motion.button>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                            <span className="flex items-center gap-1 text-[#4A4A5A]">
                              <Truck size={10} />
                              <span className="font-medium text-[#1A1A2E]">
                                {auction.delivery_method === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                              </span>
                            </span>
                            {auction.delivery_confirmed_by_shop === true && (
                              <span className="text-emerald-600 font-medium flex items-center gap-1">
                                <CheckCircle size={9} />
                                Confirmed
                              </span>
                            )}
                            {auction.delivery_confirmed_by_shop === false && (
                              <span className="text-rose-600 font-medium flex items-center gap-1">
                                <XCircle size={9} />
                                Denied
                              </span>
                            )}
                          </div>

                          {auction.delivery_confirmed_by_shop === false && auction.delivery_method === 'home_delivery' && (
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleSwitchToPickup(auction.id)}
                              disabled={isActionLoading}
                              className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isActionLoading ? <Loader2 size={12} className="animate-spin" /> : <Building2 size={11} />}
                              Switch to Pickup
                            </motion.button>
                          )}

                          {(auction.delivery_confirmed_by_shop === true || auction.delivery_method === 'pickup') && hasOtp && (
                            <div className="bg-violet-50/80 rounded-xl p-2.5">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Key size={10} className="text-violet-600" />
                                <span className="text-[9px] font-semibold uppercase tracking-wider text-violet-700">
                                  OTP
                                </span>
                                <span className="text-[9px] text-[#A0A0B0] ml-auto">
                                  {Math.max(0, attemptsRemaining)} attempts left
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 bg-white rounded-lg py-1.5 px-3">
                                  <p className="text-[15px] font-bold tracking-[0.35em] text-[#1A1A2E] font-mono text-center">
                                    {isOtpVisible ? otpCode : '••••••'}
                                  </p>
                                </div>
                                <button
                                  onClick={() => toggleOtpVisibility(auction.id)}
                                  className="p-2 bg-white rounded-lg hover:bg-[#F5F3EF] transition-colors"
                                  aria-label="Toggle OTP visibility"
                                >
                                  {isOtpVisible ? <EyeOff size={12} className="text-[#4A4A5A]" /> : <Eye size={12} className="text-[#4A4A5A]" />}
                                </button>
                                <button
                                  onClick={() => handleCopyOtp(auction.id, otpCode)}
                                  className="p-2 bg-white rounded-lg hover:bg-[#F5F3EF] transition-colors"
                                  aria-label="Copy OTP"
                                >
                                  {isOtpCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} className="text-violet-600" />}
                                </button>
                              </div>

                              {attempts >= maxAttempts && (
                                <div className="mt-2 pt-2 border-t border-violet-100">
                                  <p className="text-[9px] text-amber-700 flex items-center gap-1 mb-1.5">
                                    <AlertTriangle size={9} />
                                    Max attempts reached
                                  </p>
                                  <button
                                    onClick={() => handleOverrideComplete(auction.id)}
                                    disabled={isActionLoading}
                                    className="w-full bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-medium py-1.5 rounded-lg transition-colors"
                                  >
                                    {isActionLoading ? <Loader2 size={10} className="animate-spin inline" /> : 'Override Completion'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Completed strip */}
                  {isCompleted && (
                    <div className="px-3 pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50/60 rounded-xl p-2.5">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle size={10} />
                            Completed
                          </span>
                          {isOverridden && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <ShieldCheck size={9} />
                              Override
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {auction.shop_id && reviewStats[auction.shop_id] && (
                            <ReviewBadge
                              averageRating={reviewStats[auction.shop_id].average_rating}
                              totalReviews={reviewStats[auction.shop_id].total_reviews}
                              size="sm"
                            />
                          )}

                          {!reviewCheckStatus[auction.id]?.has_reviewed ? (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const shopName = auction.shop_name || auction.shop?.shop_name || 'the shop';
                                setSelectedReviewTarget({
                                  targetType: 'auction',
                                  targetId: auction.id,
                                  reviewedId: auction.shop_id,
                                  reviewedName: shopName
                                });
                                setShowReviewModal(true);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] text-[10px] font-medium rounded-full transition-colors"
                            >
                              <Star size={9} className="fill-[#1A1A2E]" />
                              Review
                            </motion.button>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                              <CheckCircle size={9} />
                              Reviewed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-5 text-center px-2"
        >
          <p className="text-[9px] text-[#A0A0B0] flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 leading-relaxed">
            <Sparkles size={9} className="text-[#FFBE91] flex-shrink-0" />
            <span>Set delivery method and share OTP with shop to complete</span>
          </p>
        </motion.div>
      </div>

      {/* Mobile sticky CTA */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 26 }}
        className="fixed bottom-0 left-0 right-0 md:hidden p-3 bg-white/90 backdrop-blur-xl border-t border-[#EEECE6] z-40"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/buyer/auctions/browse')}
          className="w-full flex items-center justify-center gap-2 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[12px] font-semibold py-2.5 rounded-xl transition-colors"
        >
          <Store size={13} />
          Browse More Auctions
        </motion.button>
      </motion.div>

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

export default MyWonAuctions;