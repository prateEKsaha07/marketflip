import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import ModernNavbar from "../../components/ui/Navbar";
import { 
  ArrowLeft, 
  Gavel, 
  Package, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  MapPin,
  Tag,
  Store,
  Award,
  Sparkles,
  Home,
  Truck,
  Zap,
  Send,
  Key,
  Copy,
  ShieldCheck,
  Eye,
  EyeOff,
  Flag,
  IndianRupee,
  Calendar,
  TrendingDown,
  Crown,
  Timer,
  Lock
} from 'lucide-react';
import api from '../../api/client';
import ImageCarousel from '../../components/ImageCarousel';
import ReportModal from '../../components/ReportModal';
import FraudWarning from '../../components/ml/FraudWarning';

/* ---------- Meta block ---------- */
const MetaBlock = ({ icon: Icon, label, value, span = 1 }) => (
  <div className={span === 2 ? 'col-span-2' : ''}>
    <p className="text-[9px] uppercase tracking-wide text-[#A0A0B0] mb-0.5 flex items-center gap-1">
      <Icon size={9} />
      {label}
    </p>
    <p className="text-[11px] text-[#1A1A2E] truncate">{value}</p>
  </div>
);

/* ---------- Bid Price Trend Chart ---------- */
const BidPriceChart = ({ bids, startingPrice }) => {
  const points = useMemo(() => {
    if (!bids || bids.length === 0) {
      return startingPrice ? [{ price: startingPrice, label: 'Start' }] : [];
    }

    const sorted = [...bids].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    return [
      { price: startingPrice || sorted[0]?.bid_amount || 0, label: 'Start' },
      ...sorted.map((b, i) => ({
        price: b.bid_amount,
        label: `Bid ${i + 1}`,
        time: b.created_at,
      })),
    ];
  }, [bids, startingPrice]);

  if (points.length < 2) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-xl bg-[#FFBE91]/20 flex items-center justify-center">
            <TrendingUp size={12} className="text-[#1A1A2E]" />
          </div>
          <h3 className="text-[12px] font-semibold text-[#1A1A2E]">Price Trend</h3>
        </div>
        <p className="text-[10px] text-[#A0A0B0] text-center py-4">
          Not enough bids to show a trend yet
        </p>
      </div>
    );
  }

  const W = 300;
  const H = 120;
  const PAD_X = 8;
  const PAD_Y = 16;

  const prices = points.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const coords = points.map((p, i) => {
    const x = PAD_X + (i / (points.length - 1)) * (W - PAD_X * 2);
    const y = H - PAD_Y - ((p.price - minPrice) / priceRange) * (H - PAD_Y * 2);
    return { x, y, price: p.price, label: p.label };
  });

  const linePath = coords
    .map((c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`))
    .join(' ');

  const areaPath =
    linePath +
    ` L ${coords[coords.length - 1].x} ${H} L ${coords[0].x} ${H} Z`;

  const trendUp = points[points.length - 1].price > points[0].price;
  const trendColor = trendUp ? '#10b981' : '#e11d48';
  const gradientId = `trend-${trendUp ? 'up' : 'down'}`;

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#FFBE91]/20 flex items-center justify-center">
            <TrendingUp size={12} className="text-[#1A1A2E]" />
          </div>
          <div>
            <h3 className="text-[12px] font-semibold text-[#1A1A2E]">Price Trend</h3>
            <p className="text-[9px] text-[#A0A0B0]">
              {points.length - 1} {points.length - 1 === 1 ? 'bid' : 'bids'}
            </p>
          </div>
        </div>
        <div className={`text-[10px] font-semibold flex items-center gap-0.5 ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
          <TrendingUp size={11} className={trendUp ? '' : 'rotate-180'} />
          {trendUp ? 'Rising' : 'Falling'}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trendColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#${gradientId})`} />

        <motion.path
          d={linePath}
          fill="none"
          stroke={trendColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {coords.map((c, i) => {
          const isLast = i === coords.length - 1;
          const isFirst = i === 0;
          return (
            <g key={i}>
              {!isFirst && !isLast && (
                <circle cx={c.x} cy={c.y} r="2.5" fill="white" stroke={trendColor} strokeWidth="1.5" />
              )}
              {isFirst && (
                <circle cx={c.x} cy={c.y} r="3" fill="#A0A0B0" />
              )}
              {isLast && (
                <motion.g
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9, type: 'spring', stiffness: 300 }}
                >
                  <circle cx={c.x} cy={c.y} r="5" fill={trendColor} opacity="0.25" />
                  <circle cx={c.x} cy={c.y} r="3" fill={trendColor} />
                </motion.g>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-between mt-1.5 text-[9px]">
        <span className="text-[#A0A0B0] flex items-center gap-0.5">
          <IndianRupee size={8} />
          {minPrice.toLocaleString('en-IN')}
        </span>
        <span className={`font-semibold flex items-center gap-0.5 ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
          <IndianRupee size={8} />
          {maxPrice.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
};

/* ---------- Countdown Timer ---------- */
const CountdownTimer = ({ endTime, status }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== 'active') return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const diff = endTime ? new Date(endTime).getTime() - now : 0;
  const ended = diff <= 0;

  if (ended) {
    return (
      <div className="bg-rose-50 rounded-xl p-3 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <Lock size={12} className="text-rose-600" />
          <p className="text-[11px] font-semibold text-rose-700">Auction ended</p>
        </div>
        <p className="text-[10px] text-rose-600">Bidding is closed for this auction</p>
      </div>
    );
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const urgent = days === 0 && hours < 6;
  const critical = days === 0 && hours < 1;

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className={`rounded-xl p-3 ${
      critical
        ? 'bg-rose-50'
        : urgent
          ? 'bg-amber-50'
          : 'bg-emerald-50'
    }`}>
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <motion.div
          animate={urgent ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Timer size={12} className={critical ? 'text-rose-600' : urgent ? 'text-amber-600' : 'text-emerald-600'} />
        </motion.div>
        <p className={`text-[11px] font-semibold ${
          critical ? 'text-rose-700' : urgent ? 'text-amber-700' : 'text-emerald-700'
        }`}>
          {critical ? 'Ending very soon' : urgent ? 'Ending soon' : 'Time remaining'}
        </p>
      </div>

      <div className="flex items-center justify-center gap-1">
        {days > 0 && (
          <>
            <TimeUnit value={pad(days)} label="d" color={
              critical ? 'bg-rose-100 text-rose-700' : urgent ? 'bg-amber-100 text-amber-700' : 'bg-white text-[#1A1A2E]'
            } />
            <TimeUnit value={pad(hours)} label="h" color={
              critical ? 'bg-rose-100 text-rose-700' : urgent ? 'bg-amber-100 text-amber-700' : 'bg-white text-[#1A1A2E]'
            } />
          </>
        )}
        {days === 0 && (
          <TimeUnit value={pad(hours)} label="h" color={
            critical ? 'bg-rose-100 text-rose-700' : urgent ? 'bg-amber-100 text-amber-700' : 'bg-white text-[#1A1A2E]'
          } />
        )}
        <TimeUnit value={pad(minutes)} label="m" color={
          critical ? 'bg-rose-100 text-rose-700' : urgent ? 'bg-amber-100 text-amber-700' : 'bg-white text-[#1A1A2E]'
        } />
        <TimeUnit value={pad(seconds)} label="s" color={
          critical ? 'bg-rose-100 text-rose-700' : urgent ? 'bg-amber-100 text-amber-700' : 'bg-white text-[#1A1A2E]'
        } />
      </div>
    </div>
  );
};

const TimeUnit = ({ value, label, color }) => (
  <div className="flex items-baseline gap-0.5">
    <span className={`px-1.5 py-0.5 rounded-lg font-mono font-bold text-[13px] ${color}`}>
      {value}
    </span>
    <span className="text-[9px] text-[#A0A0B0] font-medium">{label}</span>
  </div>
);

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [placingBid, setPlacingBid] = useState(false);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState(false);
  const [otpCopied, setOtpCopied] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const [fraudData, setFraudData] = useState(null);

  // 🔑 ALL HOOKS MUST BE ABOVE ANY CONDITIONAL RETURN

  useEffect(() => {
    fetchAuctionDetail();
  }, [id]);

  /* ---------- Buyer participation status ---------- */
  const buyerBidStatus = useMemo(() => {
    if (!auction?.bids || !user?.user_id) return { participating: false };
    const myBids = auction.bids.filter(b => b.buyer_id === user.user_id);
    if (myBids.length === 0) return { participating: false };

    const sorted = [...auction.bids].sort((a, b) => b.bid_amount - a.bid_amount);
    const topBid = sorted[0];
    const isWinning = topBid?.buyer_id === user.user_id;

    const myHighest = Math.max(...myBids.map(b => b.bid_amount));
    const outbidAmount = topBid?.bid_amount - myHighest;

    return {
      participating: true,
      isWinning,
      myHighest,
      topBid: topBid?.bid_amount,
      outbidBy: outbidAmount > 0 ? outbidAmount : 0,
      bidCount: myBids.length
    };
  }, [auction?.bids, user?.user_id]);

  /* ---------- Quick bid chip amounts ---------- */
  const chipIncrements = useMemo(() => {
    const currentPrice = auction?.current_highest_bid || auction?.starting_price || 0;
    if (currentPrice < 1000) return [50, 100, 250, 500];
    if (currentPrice < 10000) return [100, 500, 1000, 2000];
    if (currentPrice < 100000) return [500, 1000, 2500, 5000];
    return [1000, 2500, 5000, 10000];
  }, [auction?.current_highest_bid, auction?.starting_price]);

  const fetchAuctionDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/auctions/${id}`);
      setAuction(response.data);

      const currentPrice = response.data.current_highest_bid || response.data.starting_price;
      setBidAmount((currentPrice + 100).toString());

      await checkFraud(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load auction details');
    } finally {
      setLoading(false);
    }
  };

  const checkFraud = async (auctionData) => {
    try {
      const bidData = {
        price: auctionData.current_highest_bid || auctionData.starting_price,
        created_at: auctionData.created_at,
        shop_id: auctionData.shop_id,
        category: auctionData.category,
        budget_min: auctionData.starting_price,
        budget_max: auctionData.starting_price * 2,
      };

      const response = await api.post('/ml/detect-fraud', bidData);
      setFraudData(response.data);
    } catch (err) {
      // silent
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();

    // Hard block: cannot bid if auction ended
    if (auction?.status !== 'active') {
      setBidError('Bidding is closed — this auction has ended');
      return;
    }

    const amount = parseInt(bidAmount);

    if (!amount || amount <= 0) {
      setBidError('Please enter a valid bid amount');
      return;
    }

    const currentPrice = auction.current_highest_bid || auction.starting_price;
    if (amount <= currentPrice) {
      setBidError(`Bid must be higher than ₹${currentPrice.toLocaleString('en-IN')}`);
      return;
    }

    setPlacingBid(true);
    setBidError('');
    try {
      await api.post(`/auctions/${id}/bids`, { bid_amount: amount });
      setBidSuccess(true);
      setTimeout(() => setBidSuccess(false), 3000);
      await fetchAuctionDetail();
    } catch (err) {
      setBidError(err.response?.data?.detail || 'Failed to place bid');
    } finally {
      setPlacingBid(false);
    }
  };

  const handleCopyOtp = (code) => {
    navigator.clipboard.writeText(code);
    setOtpCopied(true);
    setTimeout(() => setOtpCopied(false), 2000);
  };

  const handleOverrideComplete = async () => {
    if (!window.confirm('Override completion? This will mark the transaction as complete.')) return;

    try {
      await api.patch(`/auctions/${id}/override-complete`);
      await fetchAuctionDetail();
    } catch (err) {
      setError('Failed to override: ' + (err.response?.data?.detail || err.message));
    }
  };

  /* =====================================================
     CONDITIONAL RETURNS (after all hooks)
     ===================================================== */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin text-[#1A1A2E]" />
          <p className="text-[11px] text-[#A0A0B0]">Loading auction…</p>
        </div>
      </div>
    );
  }

  if (error || !auction) {
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
          <h2 className="text-base font-semibold text-[#1A1A2E]">Auction not found</h2>
          <p className="text-[11px] text-[#A0A0B0] mt-1">{error || 'This auction may have been removed.'}</p>
          <button
            onClick={() => navigate('/buyer/auctions/browse')}
            className="mt-4 inline-flex items-center gap-1.5 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[11px] font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <ArrowLeft size={12} />
            Browse Auctions
          </button>
        </motion.div>
      </div>
    );
  }

  /* ---------- Everything below runs when auction is loaded ---------- */

  const getStatusInfo = (status) => {
    switch(status) {
      case 'active':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Active', dot: 'bg-emerald-500', icon: CheckCircle };
      case 'sold':
        return { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Awaiting Delivery', dot: 'bg-blue-500', icon: Truck };
      case 'completed':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed', dot: 'bg-emerald-500', icon: CheckCircle };
      case 'expired':
        return { bg: 'bg-rose-50', text: 'text-rose-700', label: 'Expired', dot: 'bg-rose-500', icon: XCircle };
      case 'cancelled':
        return { bg: 'bg-[#F8F6F0]', text: 'text-[#4A4A5A]', label: 'Cancelled', dot: 'bg-[#A0A0B0]', icon: AlertCircle };
      default:
        return { bg: 'bg-[#F8F6F0]', text: 'text-[#4A4A5A]', label: status, dot: 'bg-[#A0A0B0]', icon: AlertCircle };
    }
  };

  const getDeliveryInfo = (method) => {
    if (method === 'home_delivery') return { label: 'Home Delivery', icon: Home };
    if (method === 'pickup') return { label: 'Pickup', icon: Truck };
    return { label: 'Not specified', icon: null };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isWinner = auction.current_highest_bidder === user?.user_id;
  const isBuyer = user?.role === 'buyer';

  const status = getStatusInfo(auction.status);
  const StatusIcon = status.icon;
  const isActive = auction.status === 'active';
  const isSold = auction.status === 'sold';
  const isCompleted = auction.status === 'completed';
  const isOverridden = auction.completed_via_override === true;
  const deliveryInfo = getDeliveryInfo(auction.delivery_method);
  const DeliveryIcon = deliveryInfo.icon;
  const hasImages = auction.image_urls && auction.image_urls.length > 0;
  const currentPrice = auction.current_highest_bid || auction.starting_price;
  const minBid = currentPrice + 100;
  const hasOtp = auction.verification_code !== null && auction.verification_code !== undefined;
  const otpCode = auction.verification_code || '';
  const attempts = auction.verification_attempts || 0;
  const maxAttempts = 5;
  const attemptsRemaining = maxAttempts - attempts;
  const showOtpSection = isSold && isWinner && isBuyer && (auction.delivery_confirmed_by_shop === true || auction.delivery_method === 'pickup');

  const isFraud = fraudData?.is_fraud === true;
  const fraudConfidence = fraudData?.confidence || 0;
  const riskFactors = fraudData?.risk_factors || [];

  // Has the auction truly ended?
  const auctionEnded =
    auction.status !== 'active' ||
    (auction.end_time && new Date(auction.end_time).getTime() <= Date.now());

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  };

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

      <div className="max-w-6xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            if (isActive) navigate('/buyer/auctions/browse');
            else if (isWinner) navigate('/buyer/my-won-auctions');
            else navigate('/buyer/auction-history');
          }}
          className="flex items-center gap-1.5 mb-3 -ml-1 px-2 py-1.5 text-[11px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors rounded-lg hover:bg-[#F5F3EF]"
        >
          <ArrowLeft size={12} />
          {isActive ? 'Browse auctions' : isWinner ? 'My won auctions' : 'Auction history'}
        </motion.button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl mb-4 sm:mb-5 p-4 sm:p-5 bg-gradient-primary bg-[length:200%_200%] animate-gradient"
        >
          <motion.div
            animate={{ x: [0, 25, 0], y: [0, -18, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-lightCream/70 blur-3xl pointer-events-none"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-softBlue/50 blur-3xl pointer-events-none"
          />

          <div className="relative flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text}`}>
                  <StatusIcon size={9} />
                  {status.label}
                </span>
                {isOverridden && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700">
                    <ShieldCheck size={9} />
                    Override
                  </span>
                )}

                {isActive && buyerBidStatus.participating && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      buyerBidStatus.isWinning
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {buyerBidStatus.isWinning ? (
                      <>
                        <Crown size={9} />
                        You're winning
                      </>
                    ) : (
                      <>
                        <TrendingDown size={9} />
                        Outbid
                      </>
                    )}
                  </motion.span>
                )}
              </div>
              <motion.h1
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.35 }}
                className="text-base sm:text-[15px] font-bold text-[#1A1A2E] truncate"
              >
                {auction.item_name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="text-[10px] text-[#1A1A2E]/70 mt-0.5 truncate"
              >
                {auction.shop_name || 'Shop'} · {auction.pincode}
              </motion.p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowReportModal(true)}
              className="p-1.5 rounded-lg bg-white/40 backdrop-blur-sm text-rose-500 hover:bg-white/60 transition-colors flex-shrink-0 mt-0.5"
              title="Report"
            >
              <Flag size={12} />
            </motion.button>
          </div>
        </motion.div>

        {/* Fraud Warning */}
        <AnimatePresence>
          {isFraud && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <FraudWarning
                isFraud={isFraud}
                confidence={fraudConfidence}
                riskFactors={riskFactors}
                showDetails={true}
                onReport={() => setShowReportModal(true)}
                onDismiss={() => setFraudData(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 lg:gap-6"
        >
          {/* Left column */}
          <div className="space-y-4">
            <motion.div
              variants={itemVariants}
              className="bg-white/70 backdrop-blur-xl rounded-2xl p-3"
            >
              {hasImages ? (
                <ImageCarousel images={auction.image_urls} alt={auction.item_name} />
              ) : (
                <div className="w-full aspect-square bg-[#F8F6F0] rounded-xl flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package size={28} className="text-[#A0A0B0]" />
                    <span className="text-[11px] text-[#A0A0B0]">No images available</span>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white/70 backdrop-blur-xl rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-[#FFBE91]/20 flex items-center justify-center">
                  <Tag size={12} className="text-[#1A1A2E]" />
                </div>
                <h2 className="text-[12px] font-semibold text-[#1A1A2E]">Details</h2>
              </div>

              {auction.description && (
                <p className="text-[11px] text-[#4A4A5A] leading-relaxed mb-3">
                  {auction.description}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MetaBlock icon={Tag} label="Category" value={auction.category?.replace('_', ' ') || 'Uncategorized'} />
                <MetaBlock icon={MapPin} label="Location" value={auction.pincode || 'N/A'} />
                {DeliveryIcon && (
                  <MetaBlock icon={DeliveryIcon} label="Delivery" value={deliveryInfo.label} />
                )}
                <MetaBlock icon={Store} label="Shop" value={auction.shop_name || 'Unknown'} span={2} />
                <MetaBlock icon={Calendar} label="Ends At" value={formatDate(auction.end_time)} span={2} />
                {auction.delivery_address && (
                  <MetaBlock icon={MapPin} label="Delivery Address" value={auction.delivery_address} span={2} />
                )}
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white/70 backdrop-blur-xl rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#CFEBFF]/50 flex items-center justify-center">
                    <TrendingUp size={12} className="text-[#1A1A2E]" />
                  </div>
                  <h2 className="text-[12px] font-semibold text-[#1A1A2E]">Bid History</h2>
                </div>
                <span className="text-[10px] text-[#A0A0B0]">{auction.bid_count || 0} bids</span>
              </div>

              {!auction.bids || auction.bids.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-10 h-10 rounded-xl bg-[#F8F6F0] flex items-center justify-center mx-auto mb-2">
                    <Gavel size={16} className="text-[#A0A0B0]" />
                  </div>
                  <p className="text-[11px] text-[#A0A0B0]">No bids yet</p>
                  {isActive && <p className="text-[10px] text-[#A0A0B0] mt-0.5">Be the first to bid!</p>}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {auction.bids.map((bid, index) => {
                    const isHighest = index === 0;
                    const isAuctionWinner = auction.winning_bid_id === bid.id;
                    const isYourBid = bid.buyer_id === user?.user_id;

                    return (
                      <motion.div
                        key={bid.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.03 * index, duration: 0.25 }}
                        className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
                          isAuctionWinner
                            ? 'bg-emerald-50'
                            : isYourBid
                              ? 'bg-[#FFBE91]/10'
                              : isHighest
                                ? 'bg-[#F8F6F0]'
                                : 'hover:bg-[#F8F6F0]/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-[#1A1A2E] flex items-center justify-center text-[9px] font-bold text-lightCream flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-[#1A1A2E] truncate">
                              {bid.buyer_name || 'Anonymous'}
                              {isYourBid && <span className="ml-1 text-[9px] text-[#FFBE91]">(You)</span>}
                            </p>
                            <p className="text-[9px] text-[#A0A0B0]">
                              {formatDate(bid.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className={`text-[11px] font-semibold flex items-center justify-end gap-0.5 ${
                            isAuctionWinner ? 'text-emerald-600' : isYourBid ? 'text-[#B8860B]' : 'text-[#1A1A2E]'
                          }`}>
                            <IndianRupee size={9} />
                            {bid.bid_amount?.toLocaleString('en-IN')}
                          </p>
                          {isAuctionWinner && (
                            <span className="text-[8px] text-emerald-600 font-semibold flex items-center justify-end gap-0.5">
                              <Award size={8} />
                              Winner
                            </span>
                          )}
                          {isHighest && !isAuctionWinner && (
                            <span className="text-[8px] text-blue-600 font-medium">Highest</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-3 lg:sticky lg:top-6 lg:self-start">
            {/* Countdown Clock (only when active) */}
            {isActive && (
              <motion.div variants={itemVariants}>
                <CountdownTimer endTime={auction.end_time} status={auction.status} />
              </motion.div>
            )}

            {/* Price card */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl p-4"
            >
              <div className="space-y-3">
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-[#A0A0B0] mb-0.5">
                    {isActive ? 'Current Bid' : 'Final Price'}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <IndianRupee size={18} className="text-[#FFBE91]" />
                    <span className="text-2xl font-bold text-[#1A1A2E] tracking-tight">
                      {currentPrice?.toLocaleString('en-IN')}
                    </span>
                    {isWinner && (
                      <span className="ml-1 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-dashed border-[#EEECE6]">
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-[#A0A0B0]">Starting</p>
                    <p className="text-[11px] font-medium text-[#1A1A2E] flex items-center gap-0.5">
                      <IndianRupee size={9} />
                      {auction.starting_price?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-[#A0A0B0]">Total Bids</p>
                    <p className="text-[11px] font-medium text-[#1A1A2E]">{auction.bid_count || 0}</p>
                  </div>
                  {isActive && (
                    <>
                      <div>
                        <p className="text-[9px] uppercase tracking-wide text-[#A0A0B0]">Ends In</p>
                        <p className="text-[11px] font-medium text-[#1A1A2E] flex items-center gap-0.5">
                          <Timer size={9} />
                          Live above
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wide text-[#A0A0B0]">Ends At</p>
                        <p className="text-[10px] text-[#4A4A5A]">{formatDate(auction.end_time)}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Buyer participation block */}
              {isActive && buyerBidStatus.participating && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-3 p-3 rounded-xl ${
                    buyerBidStatus.isWinning
                      ? 'bg-emerald-50'
                      : 'bg-amber-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {buyerBidStatus.isWinning ? (
                      <>
                        <Crown size={12} className="text-emerald-600" />
                        <p className="text-[11px] font-semibold text-emerald-700">You're the highest bidder</p>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={12} className="text-amber-600" />
                        <p className="text-[11px] font-semibold text-amber-700">You've been outbid</p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={buyerBidStatus.isWinning ? 'text-emerald-600' : 'text-amber-600'}>
                      Your highest: ₹{buyerBidStatus.myHighest?.toLocaleString('en-IN')}
                    </span>
                    {!buyerBidStatus.isWinning && buyerBidStatus.outbidBy > 0 && (
                      <span className="text-amber-600 font-medium">
                        +₹{buyerBidStatus.outbidBy.toLocaleString('en-IN')} to lead
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {isSold && isWinner && (
                <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Award size={12} className="text-blue-600" />
                    <p className="text-[11px] font-semibold text-blue-700">You won this auction</p>
                  </div>
                  <p className="text-[10px] text-blue-600">
                    {auction.delivery_confirmed_by_shop === true
                      ? 'Shop confirmed delivery'
                      : auction.delivery_confirmed_by_shop === false
                        ? 'Switch to pickup to proceed'
                        : 'Awaiting shop delivery confirmation'}
                  </p>
                </div>
              )}

              {isSold && !isWinner && (
                <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Award size={12} className="text-blue-600" />
                    <p className="text-[11px] font-semibold text-blue-700">Auction ended</p>
                  </div>
                  <p className="text-[10px] text-blue-600">Sold for ₹{currentPrice?.toLocaleString('en-IN')}</p>
                </div>
              )}

              {isCompleted && isWinner && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle size={12} className="text-emerald-600" />
                    <p className="text-[11px] font-semibold text-emerald-700">Transaction completed</p>
                  </div>
                  {isOverridden && (
                    <p className="text-[10px] text-amber-600 flex items-center gap-1">
                      <ShieldCheck size={10} />
                      Via override
                    </p>
                  )}
                </div>
              )}

              {auction.status === 'expired' && (
                <div className="mt-3 p-3 bg-rose-50 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <XCircle size={12} className="text-rose-600" />
                    <p className="text-[11px] font-semibold text-rose-700">Expired — no bids</p>
                  </div>
                </div>
              )}

              {auction.status === 'cancelled' && (
                <div className="mt-3 p-3 bg-[#F8F6F0] rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle size={12} className="text-[#A0A0B0]" />
                    <p className="text-[11px] font-semibold text-[#4A4A5A]">Cancelled by shop</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Price Trend Chart */}
            <motion.div variants={itemVariants}>
              <BidPriceChart
                bids={auction.bids}
                currentPrice={currentPrice}
                startingPrice={auction.starting_price}
              />
            </motion.div>

            {/* Bid area — active or locked */}
            <motion.div
              variants={itemVariants}
              className="bg-white/70 backdrop-blur-xl rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                  auctionEnded ? 'bg-[#F8F6F0]' : 'bg-[#FFBE91]/20'
                }`}>
                  {auctionEnded ? (
                    <Lock size={12} className="text-[#A0A0B0]" />
                  ) : (
                    <Gavel size={12} className="text-[#1A1A2E]" />
                  )}
                </div>
                <h3 className="text-[12px] font-semibold text-[#1A1A2E]">
                  {auctionEnded ? 'Bidding closed' : 'Place your bid'}
                </h3>
              </div>

              {auctionEnded ? (
                <div className="bg-rose-50 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center mx-auto mb-2">
                    <Lock size={16} className="text-rose-600" />
                  </div>
                  <p className="text-[12px] font-semibold text-rose-700">This auction has ended</p>
                  <p className="text-[10px] text-rose-600 mt-1">
                    You can no longer place bids on this item
                  </p>
                  {auction.end_time && (
                    <p className="text-[9px] text-rose-500 mt-2">
                      Ended on {formatDate(auction.end_time)}
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handlePlaceBid}>
                  <div className="relative">
                    <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => {
                        setBidAmount(e.target.value);
                        setBidError('');
                      }}
                      min={minBid}
                      className="w-full pl-8 pr-3 py-2.5 text-[13px] bg-[#F8F6F0]/60 border-0 rounded-xl text-[#1A1A2E] placeholder-[#A0A0B0] focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/40 focus:bg-white transition-all"
                      placeholder="Enter amount"
                      required
                    />
                  </div>

                  {/* Quick bid chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {chipIncrements.map((inc) => {
                      const amount = currentPrice + inc;
                      const isSelected = parseInt(bidAmount) === amount;
                      return (
                        <motion.button
                          key={inc}
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setBidAmount(String(amount));
                            setBidError('');
                          }}
                          className={`px-2.5 py-1 text-[10px] font-medium rounded-full transition-all ${
                            isSelected
                              ? 'bg-[#1A1A2E] text-white'
                              : 'bg-[#F8F6F0] text-[#4A4A5A] hover:bg-[#FFBE91]/20'
                          }`}
                        >
                          +₹{inc.toLocaleString('en-IN')}
                        </motion.button>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-[#A0A0B0] mt-1.5">
                    Must be higher than ₹{currentPrice?.toLocaleString('en-IN')}
                  </p>

                  <AnimatePresence>
                    {bidError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] text-rose-600 mt-1.5 flex items-center gap-1"
                      >
                        <AlertCircle size={10} />
                        {bidError}
                      </motion.p>
                    )}
                    {bidSuccess && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] text-emerald-600 mt-1.5 flex items-center gap-1"
                      >
                        <CheckCircle size={10} />
                        Bid placed successfully!
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="submit"
                    disabled={placingBid}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-3 bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF] bg-[length:200%_200%] animate-gradient text-[#1A1A2E] py-2.5 text-[12px] font-semibold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {placingBid ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Placing…
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        Place Bid
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </motion.div>

            {/* OTP section */}
            {showOtpSection && hasOtp && (
              <motion.div
                variants={itemVariants}
                className="bg-white/70 backdrop-blur-xl rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-xl bg-[#CFEBFF]/50 flex items-center justify-center">
                    <Key size={12} className="text-[#1A1A2E]" />
                  </div>
                  <h3 className="text-[12px] font-semibold text-[#1A1A2E]">Your OTP Code</h3>
                </div>

                <div className="bg-violet-50 rounded-xl p-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="font-mono text-base font-bold text-[#1A1A2E] tracking-[0.4em]">
                      {otpVisible ? otpCode : '••••••'}
                    </div>
                    <button
                      onClick={() => setOtpVisible(!otpVisible)}
                      className="p-1.5 rounded-lg bg-white hover:bg-[#F5F3EF] transition-colors"
                    >
                      {otpVisible ? <EyeOff size={13} className="text-[#4A4A5A]" /> : <Eye size={13} className="text-[#4A4A5A]" />}
                    </button>
                    <button
                      onClick={() => handleCopyOtp(otpCode)}
                      className="p-1.5 rounded-lg bg-white hover:bg-[#F5F3EF] transition-colors flex items-center gap-1"
                    >
                      {otpCopied ? <CheckCircle size={13} className="text-emerald-600" /> : <Copy size={13} className="text-violet-600" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#A0A0B0] mt-2">
                  <span>{Math.max(0, attemptsRemaining)} of {maxAttempts} attempts remaining</span>
                  {DeliveryIcon && (
                    <span className="flex items-center gap-1">
                      <DeliveryIcon size={10} />
                      {deliveryInfo.label}
                    </span>
                  )}
                </div>

                {attempts >= maxAttempts && (
                  <div className="mt-3 p-2.5 bg-amber-50 rounded-xl">
                    <p className="text-[10px] text-amber-700 flex items-center gap-1 mb-2">
                      <AlertCircle size={10} />
                      Max attempts reached
                    </p>
                    <button
                      onClick={handleOverrideComplete}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-medium py-1.5 rounded-lg transition-colors"
                    >
                      Override Completion
                    </button>
                  </div>
                )}

                <p className="text-[9px] text-[#A0A0B0] mt-2 text-center">
                  Share this code with the shop to complete the transaction
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-5 text-center"
        >
          <p className="text-[9px] text-[#A0A0B0] flex items-center justify-center gap-1">
            <Sparkles size={9} className="text-[#FFBE91]" />
            Auction ID: {auction.id?.slice(0, 8)}
          </p>
        </motion.div>
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="auction"
        targetId={auction?.id}
        targetName={auction?.item_name}
        onSuccess={() => {}}
      />
    </div>
  );
};

export default AuctionDetail;