import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Gavel, 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle,
  DollarSign,
  Loader2,
  TrendingUp,
  Calendar,
  MapPin,
  Tag,
  Store,
  User,
  Award,
  ChevronRight,
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
  Flag
} from 'lucide-react';
import api from '../../api/client';
import ImageCarousel from '../../components/ImageCarousel';
import ReportModal from '../../components/ReportModal';

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

  useEffect(() => {
    fetchAuctionDetail();
  }, [id]);

  const fetchAuctionDetail = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching auction detail for:', id);
      const response = await api.get(`/auctions/${id}`);
      console.log('Auction detail:', response.data);
      setAuction(response.data);
      
      // Set initial bid amount to current highest + 100
      const currentPrice = response.data.current_highest_bid || response.data.starting_price;
      setBidAmount((currentPrice + 100).toString());
    } catch (err) {
      console.error('Fetch auction error:', err);
      setError(err.response?.data?.detail || 'Failed to load auction details');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    const amount = parseInt(bidAmount);
    
    if (!amount || amount <= 0) {
      setBidError('Please enter a valid bid amount');
      return;
    }
    
    const currentPrice = auction.current_highest_bid || auction.starting_price;
    if (amount <= currentPrice) {
      setBidError(`Bid must be higher than current bid (₹${currentPrice.toLocaleString()})`);
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
      console.error('Place bid error:', err);
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
      console.error('Override error:', err);
      setError('Failed to override: ' + (err.response?.data?.detail || err.message));
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': 
        return { 
          bg: 'bg-emerald-100', 
          text: 'text-emerald-700', 
          label: 'Active', 
          icon: <CheckCircle size={14} />,
          dot: 'bg-emerald-500'
        };
      case 'sold': 
        return { 
          bg: 'bg-blue-100', 
          text: 'text-blue-700', 
          label: 'Awaiting Delivery', 
          icon: <Truck size={14} />,
          dot: 'bg-blue-500'
        };
      case 'completed': 
        return { 
          bg: 'bg-emerald-100', 
          text: 'text-emerald-700', 
          label: 'Completed', 
          icon: <CheckCircle size={14} />,
          dot: 'bg-emerald-500'
        };
      case 'expired': 
        return { 
          bg: 'bg-rose-100', 
          text: 'text-rose-700', 
          label: 'Expired', 
          icon: <XCircle size={14} />,
          dot: 'bg-rose-500'
        };
      case 'cancelled': 
        return { 
          bg: 'bg-gray-100', 
          text: 'text-gray-700', 
          label: 'Cancelled', 
          icon: <AlertCircle size={14} />,
          dot: 'bg-gray-500'
        };
      default: 
        return { 
          bg: 'bg-gray-100', 
          text: 'text-gray-700', 
          label: status, 
          icon: <AlertCircle size={14} />,
          dot: 'bg-gray-500'
        };
    }
  };

  const getDeliveryMethodLabel = (method) => {
    if (method === 'home_delivery') {
      return { label: 'Home Delivery', icon: <Home size={14} /> };
    }
    if (method === 'pickup') {
      return { label: 'Pickup', icon: <Truck size={14} /> };
    }
    return { label: 'Not specified', icon: null };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getTimeLeft = (endTime) => {
    if (!endTime) return 'Ended';
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff < 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const isEndingSoon = (endTime) => {
    if (!endTime) return false;
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    return diff > 0 && diff < 60 * 60 * 1000 * 24;
  };

  // Check if user is the winner
  const isWinner = auction?.current_highest_bidder === user?.user_id;
  const isBuyer = user?.role === 'buyer';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#1A1A2E]" />
          <p className="text-xs text-[#A0A0B0]">Loading auction details...</p>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0] p-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 text-center shadow-lg max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-rose-500" />
          </div>
          <h2 className="text-lg font-semibold text-rose-700">Error</h2>
          <p className="text-sm text-rose-600 mt-1">{error || 'Auction not found'}</p>
          <Button 
            onClick={() => navigate('/buyer/auctions/browse')}
            className="mt-4 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-sm px-5 py-1.5 h-auto"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Browse Auctions
          </Button>
        </div>
      </div>
    );
  }

  const status = getStatusBadge(auction.status);
  const isActive = auction.status === 'active';
  const isSold = auction.status === 'sold';
  const isCompleted = auction.status === 'completed';
  const isOverridden = auction.completed_via_override === true;
  const deliveryInfo = getDeliveryMethodLabel(auction.delivery_method);
  const hasImages = auction.image_urls && auction.image_urls.length > 0;
  const timeLeft = getTimeLeft(auction.end_time);
  const endingSoon = isEndingSoon(auction.end_time);
  const currentPrice = auction.current_highest_bid || auction.starting_price;
  const minBid = currentPrice + 100;
  const hasOtp = auction.verification_code !== null && auction.verification_code !== undefined;
  const otpCode = auction.verification_code || '';
  const attempts = auction.verification_attempts || 0;
  const maxAttempts = 5;
  const attemptsRemaining = maxAttempts - attempts;
  const showOtpSection = isSold && isWinner && isBuyer && (auction.delivery_confirmed_by_shop === true || auction.delivery_method === 'pickup');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-wrap justify-between items-center gap-3 mb-6"
        >
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => {
                if (isActive) {
                  navigate('/buyer/auctions/browse');
                } else if (isWinner) {
                  navigate('/buyer/my-won-auctions');
                } else {
                  navigate('/buyer/auction-history');
                }
              }}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
            >
              <ArrowLeft size={14} className="mr-1.5" />
              {isActive ? 'Browse' : isWinner ? 'My Won Auctions' : 'Auction History'}
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-[#1A1A2E] flex items-center gap-2">
                <Gavel size={20} className="text-[#FFBE91]" />
                Auction Details
              </h1>
              <p className="text-xs text-[#A0A0B0] mt-0.5">
                {auction.item_name}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Report Button */}
            <Button
              onClick={() => setShowReportModal(true)}
              variant="outline"
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs px-3 py-1.5 h-auto"
            >
              <Flag size={13} className="mr-1.5" />
              Report
            </Button>
            <Button 
              onClick={() => navigate('/buyer/auctions/browse')}
              variant="outline"
              className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-4 py-1.5 h-auto"
            >
              Browse More
            </Button>
            <Button 
              onClick={() => navigate('/buyer/dashboard')}
              className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto"
            >
              Dashboard
            </Button>
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Left Column - Images */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-2"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-[#EEECE6] shadow-sm">
              {hasImages ? (
                <ImageCarousel images={auction.image_urls} alt={auction.item_name} />
              ) : (
                <div className="w-full h-64 bg-[#F8F6F0] rounded-xl flex items-center justify-center border border-[#EEECE6]">
                  <div className="flex flex-col items-center gap-2">
                    <Package size={40} className="text-[#A0A0B0]" />
                    <span className="text-sm text-[#A0A0B0]">No images available</span>
                  </div>
                </div>
              )}
            </div>

            {/* Item Details */}
            <motion.div 
              variants={itemVariants}
              className="mt-4 bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-[#EEECE6] shadow-sm"
            >
              <h2 className="text-lg font-semibold text-[#1A1A2E]">{auction.item_name}</h2>
              {auction.description && (
                <p className="text-sm text-[#4A4A5A] mt-1">{auction.description}</p>
              )}
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-[#EEECE6]">
                <div>
                  <p className="text-[10px] text-[#A0A0B0]">Category</p>
                  <p className="text-xs font-medium text-[#1A1A2E] flex items-center gap-1">
                    <Tag size={12} className="text-[#A0A0B0]" />
                    {auction.category || 'Uncategorized'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A0A0B0]">Location</p>
                  <p className="text-xs font-medium text-[#1A1A2E] flex items-center gap-1">
                    <MapPin size={12} className="text-[#A0A0B0]" />
                    {auction.pincode}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A0A0B0]">Delivery</p>
                  <p className="text-xs font-medium text-[#1A1A2E] flex items-center gap-1">
                    {deliveryInfo.icon}
                    {deliveryInfo.label}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-[10px] text-[#A0A0B0]">Shop</p>
                  <p className="text-xs font-medium text-[#1A1A2E] flex items-center gap-1">
                    <Store size={12} className="text-[#A0A0B0]" />
                    {auction.shop_name || 'Unknown Shop'}
                  </p>
                </div>
                {auction.delivery_address && (
                  <div className="col-span-2 sm:col-span-3">
                    <p className="text-[10px] text-[#A0A0B0]">Delivery Address</p>
                    <p className="text-xs text-[#4A4A5A]">{auction.delivery_address}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Info & Bidding */}
          <motion.div 
            variants={itemVariants}
            className="space-y-4"
          >
            {/* Status Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-[#EEECE6] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                  <span className={`text-sm font-medium ${status.text}`}>{status.label}</span>
                </div>
                {isActive && (
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium ${endingSoon ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {timeLeft}
                    </span>
                    {endingSoon && <Zap size={12} className="text-rose-600" />}
                  </div>
                )}
                {isOverridden && (
                  <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                    <ShieldCheck size={12} />
                    Override
                  </span>
                )}
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-[#A0A0B0]">Starting Price</p>
                  <p className="font-semibold text-[#1A1A2E]">₹{auction.starting_price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A0A0B0]">Current Bid</p>
                  <p className={`font-semibold ${isWinner ? 'text-emerald-600' : 'text-emerald-600'}`}>
                    ₹{currentPrice.toLocaleString()}
                    {isWinner && <span className="ml-1 text-[10px] text-emerald-600 font-medium">(You)</span>}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#EEECE6] grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-[#A0A0B0]">Total Bids</p>
                  <p className="font-medium text-[#1A1A2E]">{auction.bid_count || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A0A0B0]">Created</p>
                  <p className="font-medium text-[#1A1A2E] text-xs">{formatDate(auction.created_at)}</p>
                </div>
              </div>

              {isActive && (
                <div className="mt-3 pt-3 border-t border-[#EEECE6]">
                  <p className="text-[10px] text-[#A0A0B0]">Ends At</p>
                  <p className="text-xs font-medium text-[#1A1A2E]">{formatDate(auction.end_time)}</p>
                </div>
              )}

              {isSold && isWinner && (
                <div className="mt-3 pt-3 border-t border-blue-200 bg-blue-50/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-blue-600" />
                    <p className="text-sm font-semibold text-blue-700">You Won This Auction!</p>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Won for ₹{currentPrice.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-blue-500 mt-0.5">
                    {auction.delivery_confirmed_by_shop === true ? 'Shop confirmed delivery' : 
                     auction.delivery_confirmed_by_shop === false ? 'Shop denied delivery - Switch to pickup option available' :
                     'Awaiting shop delivery confirmation'}
                  </p>
                  {auction.closed_at && (
                    <p className="text-[10px] text-blue-500 mt-0.5">
                      Closed: {formatDate(auction.closed_at)}
                    </p>
                  )}
                </div>
              )}

              {isSold && !isWinner && (
                <div className="mt-3 pt-3 border-t border-blue-200 bg-blue-50/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-blue-600" />
                    <p className="text-sm font-semibold text-blue-700">Auction Ended</p>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Sold for ₹{currentPrice.toLocaleString()}
                  </p>
                  {auction.closed_at && (
                    <p className="text-[10px] text-blue-500 mt-0.5">
                      Closed: {formatDate(auction.closed_at)}
                    </p>
                  )}
                </div>
              )}

              {auction.status === 'expired' && (
                <div className="mt-3 pt-3 border-t border-rose-200 bg-rose-50/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <XCircle size={16} className="text-rose-600" />
                    <p className="text-sm font-semibold text-rose-700">Expired</p>
                  </div>
                  <p className="text-xs text-rose-600 mt-1">
                    No bids were placed on this auction
                  </p>
                </div>
              )}

              {auction.status === 'cancelled' && (
                <div className="mt-3 pt-3 border-t border-gray-200 bg-gray-50/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-gray-600" />
                    <p className="text-sm font-semibold text-gray-700">Cancelled</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    This auction was cancelled by the shop
                  </p>
                </div>
              )}

              {isCompleted && isWinner && (
                <div className="mt-3 pt-3 border-t border-emerald-200 bg-emerald-50/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-700">Transaction Completed</p>
                  </div>
                  {isOverridden && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <ShieldCheck size={12} />
                      Completed via override
                    </p>
                  )}
                  {auction.closed_at && (
                    <p className="text-[10px] text-emerald-500 mt-0.5">
                      Closed: {formatDate(auction.closed_at)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* OTP Display for Won Auctions */}
            {showOtpSection && hasOtp && (
              <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-blue-200 shadow-sm">
                <h3 className="text-sm font-medium text-[#1A1A2E] mb-3 flex items-center gap-2">
                  <Key size={14} className="text-[#FFBE91]" />
                  Your OTP Code
                </h3>
                
                <div className="bg-[#F8F6F0] rounded-lg p-4 text-center border border-[#EEECE6]">
                  <div className="flex items-center justify-center gap-3">
                    <div className="font-mono text-2xl font-bold text-[#1A1A2E] tracking-widest select-all">
                      {otpVisible ? otpCode : '••••••'}
                    </div>
                    <Button
                      onClick={() => setOtpVisible(!otpVisible)}
                      variant="ghost"
                      className="text-[#A0A0B0] hover:text-[#1A1A2E] px-2 py-1 h-auto"
                    >
                      {otpVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Button
                      onClick={() => handleCopyOtp(otpCode)}
                      variant="ghost"
                      className="text-[#A0A0B0] hover:text-[#1A1A2E] px-2 py-1 h-auto flex items-center gap-1"
                    >
                      {otpCopied ? (
                        <CheckCircle size={16} className="text-emerald-500" />
                      ) : (
                        <Copy size={16} />
                      )}
                      {otpCopied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-[#A0A0B0]">
                  <span>Attempts remaining: {Math.max(0, attemptsRemaining)} of {maxAttempts}</span>
                  {auction.delivery_method && (
                    <span className="flex items-center gap-1">
                      {auction.delivery_method === 'home_delivery' ? <Home size={12} /> : <Truck size={12} />}
                      {auction.delivery_method === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                    </span>
                  )}
                </div>

                {attempts >= maxAttempts && (
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-amber-600 flex items-center gap-1">
                        <AlertCircle size={12} />
                        Max attempts reached. You can override.
                      </span>
                      <Button
                        onClick={handleOverrideComplete}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1 h-auto"
                      >
                        Override Completion
                      </Button>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-[#A0A0B0] mt-2 text-center">
                  Share this OTP with the shop to complete the transaction
                </p>
              </div>
            )}

            {/* Place Bid Card - Only for Active auctions */}
            {isActive && (
              <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-emerald-200 shadow-sm">
                <h3 className="text-sm font-medium text-[#1A1A2E] mb-3 flex items-center gap-2">
                  <Gavel size={14} className="text-[#FFBE91]" />
                  Place Your Bid
                </h3>
                
                <form onSubmit={handlePlaceBid}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0] text-sm font-medium">₹</span>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => {
                        setBidAmount(e.target.value);
                        setBidError('');
                      }}
                      min={minBid}
                      className="w-full pl-7 pr-3 py-2.5 text-sm bg-[#F8F6F0] border-2 border-[#EEECE6] rounded-lg text-[#1A1A2E] focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  
                  <p className="text-[10px] text-[#A0A0B0] mt-1.5">
                    ⚡ Must be higher than ₹{currentPrice.toLocaleString()}
                  </p>
                  
                  {bidError && (
                    <p className="text-[10px] text-rose-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {bidError}
                    </p>
                  )}
                  
                  {bidSuccess && (
                    <p className="text-[10px] text-emerald-600 mt-1.5 flex items-center gap-1">
                      <CheckCircle size={12} />
                      Bid placed successfully!
                    </p>
                  )}
                  
                  <Button
                    type="submit"
                    disabled={placingBid || !isActive}
                    className="w-full mt-3 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-sm py-2 h-auto disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {placingBid ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Placing Bid...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Place Bid
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Bid History - Full Width */}
        <motion.div 
          variants={itemVariants}
          className="mt-6 bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-[#EEECE6] shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#1A1A2E] flex items-center gap-2">
              <TrendingUp size={14} className="text-[#FFBE91]" />
              Bid History
            </h3>
            <span className="text-xs text-[#A0A0B0]">{auction.bid_count || 0} bids</span>
          </div>

          {!auction.bids || auction.bids.length === 0 ? (
            <div className="text-center py-6">
              <Gavel size={24} className="text-[#A0A0B0] mx-auto mb-2" />
              <p className="text-sm text-[#A0A0B0]">No bids yet</p>
              <p className="text-xs text-[#A0A0B0] mt-0.5">Be the first to bid!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {auction.bids.map((bid, index) => {
                const isHighest = index === 0;
                const isWinner = auction.winning_bid_id === bid.id;
                const isYourBid = bid.buyer_id === user?.user_id;
                
                return (
                  <div 
                    key={bid.id}
                    className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                      isWinner 
                        ? 'bg-emerald-50 border border-emerald-200' 
                        : isYourBid 
                        ? 'bg-[#FFFCE1] border border-[#FFDDB0]'
                        : isHighest 
                        ? 'bg-[#F8F6F0]' 
                        : 'hover:bg-[#F8F6F0]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1A1A2E]/5 flex items-center justify-center text-[10px] font-medium text-[#1A1A2E]">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#1A1A2E]">
                          {bid.buyer_name || 'Anonymous Buyer'}
                          {isYourBid && (
                            <span className="ml-1 text-[10px] text-[#FFBE91] font-medium">(You)</span>
                          )}
                        </p>
                        <p className="text-[10px] text-[#A0A0B0]">
                          {formatDate(bid.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-semibold ${isWinner ? 'text-emerald-600' : isYourBid ? 'text-[#FFBE91]' : 'text-[#1A1A2E]'}`}>
                        ₹{bid.bid_amount.toLocaleString()}
                      </p>
                      {isWinner && (
                        <span className="text-[9px] text-emerald-600 font-medium">🏆 Winner</span>
                      )}
                      {isHighest && !isWinner && (
                        <span className="text-[9px] text-blue-600 font-medium">Highest</span>
                      )}
                      {isYourBid && !isWinner && !isHighest && (
                        <span className="text-[9px] text-[#FFBE91] font-medium">Your Bid</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center text-[10px] text-[#A0A0B0]"
        >
          <span className="flex items-center justify-center gap-1">
            <Sparkles size={10} className="text-[#FFBE91]" />
            Auction ID: {auction.id.slice(0, 8)}...
          </span>
        </motion.div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="auction"
        targetId={auction?.id}
        targetName={auction?.item_name}
        onSuccess={() => {
          // Optionally refresh or navigate
        }}
      />
    </div>
  );
};

export default AuctionDetail;