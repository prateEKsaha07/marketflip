import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import ModernNavbar from "../../components/ui/Navbar";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Clock,
  Calendar,
  MapPin,
  Tag,
  ShoppingBag,
  User,
  Phone,
  Home,
  Store,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Image as ImageIcon,
  IndianRupee,
  TrendingDown,
  TrendingUp,
  Zap,
  Award,
  Truck,
  Package
} from 'lucide-react';
import api from '../../api/client';

/* ============================================================
   Image Carousel
   ============================================================ */
const ImageCarousel = ({ images, alt = 'Request image' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-video bg-[#F8F6F0] rounded-2xl flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <ImageIcon size={28} className="text-[#A0A0B0]" />
          <span className="text-[#A0A0B0] text-[11px]">No images</span>
        </div>
      </div>
    );
  }

  const goToPrevious = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goToNext = () => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <>
      <div className="relative w-full aspect-video bg-[#F8F6F0] rounded-2xl overflow-hidden group">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`${alt} ${currentIndex + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full object-contain cursor-pointer"
            onClick={() => setIsFullscreen(true)}
          />
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 -mx-1 px-1">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden transition-all ${
                index === currentIndex ? 'ring-2 ring-[#1A1A2E]' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setIsFullscreen(false)}
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 text-white hover:text-[#FFBE91] transition-colors"
            >
              <X size={24} />
            </button>
            <motion.img
              key={currentIndex}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={images[currentIndex]}
              alt={`${alt} ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ============================================================
   Countdown Timer
   ============================================================ */
const Countdown = ({ expiresAt }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!expiresAt) return null;

  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-600">
        <Clock size={10} />
        Expired
      </span>
    );
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const isUrgent = days === 0 && hours < 24;

  return (
    <motion.span
      animate={isUrgent ? { opacity: [0.7, 1, 0.7] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className={`inline-flex items-center gap-1 text-[10px] font-medium ${
        isUrgent ? 'text-rose-600' : 'text-[#4A4A5A]'
      }`}
    >
      <Clock size={10} />
      {days > 0 ? `${days}d ${hours}h left` : `${hours}h ${minutes}m left`}
    </motion.span>
  );
};

/* ============================================================
   Main Component
   ============================================================ */
const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedBidInfo, setSelectedBidInfo] = useState(null);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [bidSort, setBidSort] = useState('newest');

  useEffect(() => {
    fetchRequestDetail();
  }, [id]);

  const fetchRequestDetail = async () => {
    setLoading(true);
    setError('');
    setNotFound(false);
    try {
      const requestResponse = await api.get(`/requests/${id}`);
      setRequest(requestResponse.data);

      if (user?.role === 'buyer') {
        await fetchBids();
      }
    } catch (err) {
      console.error('Fetch request error:', err);
      if (err.response?.status === 404) {
        setNotFound(true);
        setError('Request not found');
      } else {
        setError('Failed to fetch request details');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      const response = await api.get(`/requests/${id}/bids`);
      setBids(response.data || []);
    } catch (err) {
      console.error('Failed to fetch bids:', err);
    }
  };

  const handleSelectBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to select this bid?')) return;
    setSelecting(true);
    try {
      const response = await api.patch(`/bids/${bidId}/select`);
      const data = response.data;

      setSelectedBidInfo({
        bidId: data.bid_id,
        requestId: data.request_id,
        status: data.status,
        price: data.selected_bid?.price || 'N/A',
        shopName: data.shop_contact?.name || 'Unknown',
        shopPhone: data.shop_contact?.phone || 'N/A',
        shopAddress: data.shop_contact?.address || 'N/A',
        note: data.selected_bid?.note || 'No note',
        selectedAt: data.selected_bid?.selected_at || new Date().toISOString()
      });
      setShowSuccessCard(true);
      setRequest(prev => prev ? { ...prev, status: 'purchased' } : null);
      setBids(prev => prev.map(bid =>
        bid.id === bidId
          ? { ...bid, status: 'selected' }
          : bid.status === 'pending'
            ? { ...bid, status: 'rejected' }
            : bid
      ));
    } catch (err) {
      alert('Failed to select bid: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setSelecting(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!window.confirm('Delete this request? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/requests/${id}`);
      navigate('/buyer/dashboard');
    } catch (err) {
      alert('Failed to delete request: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'open': return { bg: 'bg-emerald-50 text-emerald-700', icon: <Clock size={10} />, label: 'Open' };
      case 'purchased': return { bg: 'bg-blue-50 text-blue-700', icon: <CheckCircle size={10} />, label: 'Purchased' };
      case 'completed': return { bg: 'bg-violet-50 text-violet-700', icon: <Check size={10} />, label: 'Completed' };
      case 'expired': return { bg: 'bg-rose-50 text-rose-700', icon: <AlertCircle size={10} />, label: 'Expired' };
      default: return { bg: 'bg-[#F8F6F0] text-[#4A4A5A]', icon: <Clock size={10} />, label: status };
    }
  };

  const getBidStatusBadge = (status) => {
    switch(status) {
      case 'selected': return { bg: 'bg-emerald-100 text-emerald-700', label: 'Selected' };
      case 'rejected': return { bg: 'bg-rose-100 text-rose-700', label: 'Rejected' };
      case 'pending': return { bg: 'bg-amber-100 text-amber-700', label: 'Pending' };
      default: return { bg: 'bg-gray-100 text-gray-700', label: status };
    }
  };

  // Derived
  const lowestBid = bids.length > 0 ? Math.min(...bids.filter(b => b.status === 'pending').map(b => b.price)) : null;
  const fastestBidId = bids.length > 0 ? [...bids].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]?.id : null;

  const sortedBids = [...bids].sort((a, b) => {
    if (bidSort === 'lowest') return a.price - b.price;
    if (bidSort === 'highest') return b.price - a.price;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#1A1A2E] border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] text-[#A0A0B0]">Loading request…</p>
        </div>
      </div>
    );
  }

  /* ---------- Not found ---------- */
  if (notFound || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0] p-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={24} className="text-rose-500" />
          </div>
          <h2 className="text-base font-semibold text-[#1A1A2E]">Request not found</h2>
          <p className="text-[11px] text-[#A0A0B0] mt-1">
            {error || "This request may have been removed."}
          </p>
          <button
            onClick={() => navigate('/buyer/dashboard')}
            className="mt-4 inline-flex items-center gap-1.5 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[11px] font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <ArrowLeft size={12} />
            Back to dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  const isOwner = request.buyer_id === user?.user_id;
  const isOpen = request.status === 'open' && !showSuccessCard;
  const isPurchased = request.status === 'purchased' || showSuccessCard;
  const statusBadge = getStatusBadge(request.status);
  const hasImages = request.image_urls && request.image_urls.length > 0;
  const pendingBids = bids.filter(b => b.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-3 sm:p-4 md:p-6 pb-24 md:pb-6">
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

      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate('/buyer/requests')}
          className="flex items-center gap-1.5 mb-3 -ml-1 px-2 py-1.5 text-[11px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors rounded-lg hover:bg-[#F5F3EF]"
        >
          <ArrowLeft size={12} />
          Back to requests
        </motion.button>

        {/* Success Panel */}
        <AnimatePresence>
          {showSuccessCard && selectedBidInfo && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="relative overflow-hidden rounded-2xl mb-4 p-4 sm:p-5 bg-gradient-to-br from-emerald-50 via-emerald-50/60 to-[#F8F6F0]"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.3, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none"
              />
              <div className="relative flex items-start gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0"
                >
                  <CheckCircle size={18} className="text-emerald-600" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-bold text-emerald-800">Purchase Finalized</h3>
                  <p className="text-[11px] text-emerald-700/80 mt-0.5">
                    Your selected bid is locked in. Contact the shop to arrange delivery.
                  </p>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                    <InfoLine icon={<Store size={10} />} label="Shop" value={selectedBidInfo.shopName} />
                    <InfoLine icon={<Phone size={10} />} label="Phone" value={selectedBidInfo.shopPhone} />
                    <InfoLine icon={<MapPin size={10} />} label="Address" value={selectedBidInfo.shopAddress} span={2} />
                    <InfoLine icon={<IndianRupee size={10} />} label="Price" value={`₹${selectedBidInfo.price}`} accent="text-emerald-700" />
                    <InfoLine icon={<Calendar size={10} />} label="Selected" value={new Date(selectedBidInfo.selectedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/buyer/purchases')}
                    className="mt-3 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Package size={11} />
                    View in Purchases
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 lg:gap-6">
          {/* Left column — request details */}
          <div className="space-y-4">
            {/* Hero Card */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl p-4 sm:p-5"
            >
              {/* Status bar at top */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge.bg}`}>
                  {statusBadge.icon}
                  {statusBadge.label}
                </span>
                {request.category && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F8F6F0] text-[#4A4A5A]">
                    <Tag size={9} />
                    {request.category.replace('_', ' ')}
                  </span>
                )}
                <Countdown expiresAt={request.expires_at} />
              </div>

              {/* Title */}
              <h1 className="text-lg sm:text-xl font-bold text-[#1A1A2E] tracking-tight leading-tight">
                {request.item_name}
              </h1>

              {/* Description */}
              {request.description && (
                <p className="text-[12px] text-[#4A4A5A] mt-2 leading-relaxed">
                  {request.description}
                </p>
              )}

              {/* Budget + Meta */}
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mt-4">
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-[#A0A0B0]">Budget</p>
                  <p className="text-base sm:text-lg font-bold text-[#1A1A2E] flex items-center gap-0.5">
                    <IndianRupee size={14} className="text-[#FFBE91]" />
                    {request.budget_min?.toLocaleString('en-IN')}
                    <span className="text-[#A0A0B0] font-normal mx-1">–</span>
                    <IndianRupee size={14} className="text-[#FFBE91]" />
                    {request.budget_max?.toLocaleString('en-IN')}
                  </p>
                </div>
                {request.pincode && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-[#A0A0B0]">Location</p>
                    <p className="text-[12px] text-[#1A1A2E] flex items-center gap-1">
                      <MapPin size={11} />
                      {request.pincode}
                    </p>
                  </div>
                )}
                {request.created_at && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-[#A0A0B0]">Posted</p>
                    <p className="text-[12px] text-[#1A1A2E] flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(request.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                )}
                {request.delivery_method && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-[#A0A0B0]">Delivery</p>
                    <p className="text-[12px] text-[#1A1A2E] flex items-center gap-1">
                      {request.delivery_method === 'home_delivery' ? <Home size={11} /> : <Store size={11} />}
                      {request.delivery_method === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                    </p>
                  </div>
                )}
              </div>

              {/* Owner actions */}
              {isOwner && isOpen && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-dashed border-[#EEECE6]">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/buyer/edit-request/${id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[#4A4A5A] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] rounded-lg transition-colors"
                  >
                    <Edit size={12} />
                    Edit
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeleteRequest}
                    disabled={deleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    {deleting ? 'Deleting…' : 'Delete'}
                  </motion.button>
                </div>
              )}
            </motion.div>

            {/* Image Carousel */}
            {hasImages && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="bg-white/70 backdrop-blur-xl rounded-2xl p-3"
              >
                <ImageCarousel images={request.image_urls} alt={request.item_name} />
              </motion.div>
            )}

            {/* Delivery info if home delivery */}
            {request.delivery_method === 'home_delivery' && request.delivery_address && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="bg-white/70 backdrop-blur-xl rounded-2xl p-4"
              >
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FFBE91]/20 flex items-center justify-center flex-shrink-0">
                    <Truck size={12} className="text-[#1A1A2E]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[12px] font-semibold text-[#1A1A2E]">Delivery Address</h3>
                      {request.delivery_confirmed_by_shop && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-50 text-emerald-700">
                          <Check size={8} />
                          Confirmed by shop
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#4A4A5A] mt-0.5">{request.delivery_address}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right column — bids */}
          <div className="space-y-3">
            {/* Bids header */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FFBE91]/20 flex items-center justify-center">
                  <ShoppingBag size={12} className="text-[#1A1A2E]" />
                </div>
                <div>
                  <h2 className="text-[13px] font-semibold text-[#1A1A2E]">Bids</h2>
                  <p className="text-[10px] text-[#A0A0B0]">
                    {bids.length} {bids.length === 1 ? 'bid' : 'bids'} received
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Sort tabs */}
            {bids.length > 1 && isOwner && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex gap-1 p-1 bg-[#F8F6F0]/70 rounded-xl"
              >
                {[
                  { key: 'newest', label: 'Newest' },
                  { key: 'lowest', label: 'Lowest' },
                  { key: 'highest', label: 'Highest' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setBidSort(tab.key)}
                    className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded-lg transition-all ${
                      bidSort === tab.key
                        ? 'bg-white text-[#1A1A2E] shadow-sm'
                        : 'text-[#A0A0B0] hover:text-[#4A4A5A]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </motion.div>
            )}

            {/* Bids list */}
            {!isOwner ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#F8F6F0]/60 rounded-2xl p-4 text-center"
              >
                <p className="text-[11px] text-[#A0A0B0]">Only the buyer can view bids</p>
              </motion.div>
            ) : bids.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#F8F6F0] flex items-center justify-center mx-auto mb-2">
                  <ShoppingBag size={18} className="text-[#A0A0B0]" />
                </div>
                <h3 className="text-[12px] font-medium text-[#1A1A2E]">No bids yet</h3>
                <p className="text-[10px] text-[#A0A0B0] mt-0.5">
                  Shops in your area will start bidding soon
                </p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {sortedBids.map((bid, index) => {
                  const bidStatus = getBidStatusBadge(bid.status);
                  const isSelected = bid.status === 'selected';
                  const isRejected = bid.status === 'rejected';
                  const isPending = bid.status === 'pending';
                  const isLowest = isPending && bid.price === lowestBid && bids.length > 1;
                  const isFastest = bid.id === fastestBidId && bids.length > 1;

                  return (
                    <motion.div
                      key={bid.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index, duration: 0.3 }}
                      className={`relative overflow-hidden rounded-2xl p-3.5 transition-all ${
                        isSelected
                          ? 'bg-emerald-50 ring-1 ring-emerald-200'
                          : isRejected
                            ? 'bg-white/50 opacity-60'
                            : 'bg-white/80 backdrop-blur-xl'
                      }`}
                    >
                      {/* Highlight stripe */}
                      {isSelected && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400" />
                      )}

                      {/* Price + status */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-baseline gap-1">
                          <IndianRupee size={13} className="text-[#1A1A2E]" />
                          <span className={`text-base font-bold tracking-tight ${isSelected ? 'text-emerald-700' : 'text-[#1A1A2E]'}`}>
                            {bid.price?.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium ${bidStatus.bg}`}>
                          {bidStatus.label}
                        </span>
                      </div>

                      {/* Badges */}
                      {(isLowest || isFastest) && isPending && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {isLowest && (
                            <motion.span
                              animate={{ opacity: [0.85, 1, 0.85] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[#FFBE91]/30 text-[#1A1A2E]"
                            >
                              <TrendingDown size={8} />
                              Lowest
                            </motion.span>
                          )}
                          {isFastest && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[#CFEBFF]/60 text-[#1A1A2E]">
                              <Zap size={8} />
                              Fastest
                            </span>
                          )}
                        </div>
                      )}

                      {/* Shop */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded-full bg-[#1A1A2E] flex items-center justify-center text-[8px] font-bold text-lightCream flex-shrink-0">
                          {(bid.profiles?.shop_name || bid.shop_name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] font-medium text-[#1A1A2E] truncate">
                          {bid.profiles?.shop_name || bid.shop_name || 'Unknown Shop'}
                        </span>
                      </div>

                      {/* Note */}
                      {bid.note && (
                        <p className="text-[10px] text-[#4A4A5A] line-clamp-2 mt-1">
                          {bid.note}
                        </p>
                      )}

                      {/* Date */}
                      <p className="text-[9px] text-[#A0A0B0] mt-1.5">
                        {new Date(bid.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>

                      {/* Select action */}
                      {isOpen && isPending && (
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleSelectBid(bid.id)}
                          disabled={selecting}
                          className="mt-2.5 w-full flex items-center justify-center gap-1.5 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[11px] font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={11} />
                          {selecting ? 'Selecting…' : 'Select this bid'}
                        </motion.button>
                      )}

                      {isSelected && (
                        <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-medium text-emerald-700">
                          <Award size={10} />
                          Your selected bid
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky mobile select bar */}
      <AnimatePresence>
        {isOwner && isOpen && pendingBids.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 lg:hidden p-3 bg-white/90 backdrop-blur-xl border-t border-[#EEECE6] z-40"
          >
            <div className="flex items-center justify-between gap-3 max-w-6xl mx-auto">
              <div className="min-w-0">
                <p className="text-[10px] text-[#A0A0B0]">Best price so far</p>
                <p className="text-[13px] font-bold text-[#1A1A2E] flex items-center gap-0.5">
                  <IndianRupee size={12} className="text-[#FFBE91]" />
                  {lowestBid?.toLocaleString('en-IN') || '—'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#A0A0B0]">
                <TrendingDown size={11} />
                {pendingBids.length} {pendingBids.length === 1 ? 'bid' : 'bids'} to review
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ============================================================
   Small building block
   ============================================================ */
const InfoLine = ({ icon, label, value, span = 1, accent = '' }) => (
  <div className={span === 2 ? 'sm:col-span-2' : ''}>
    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wide text-[#A0A0B0]">
      {icon}
      {label}
    </span>
    <p className={`text-[11px] mt-0.5 break-words ${accent || 'text-[#1A1A2E]'}`}>{value}</p>
  </div>
);

export default RequestDetail;