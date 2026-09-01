import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Eye,
  Loader2,
  TrendingUp,
  Calendar,
  MapPin,
  Tag,
  Store,
  User,
  Award,
  Trash2,
  ChevronRight,
  Sparkles,
  Home,
  Truck,
  Key,
  RotateCcw,
  ShieldCheck,
  Flag
} from 'lucide-react';
import api from '../../api/client';
import ImageCarousel from '../../components/ImageCarousel';
import ReportModal from '../../components/ReportModal';

const AuctionDetailShop = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [auction, setAuction] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [relisting, setRelisting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    fetchAuctionDetail();
  }, [id]);

  const fetchAuctionDetail = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      console.log('Fetching auction detail for:', id);
      const response = await api.get(`/auctions/${id}`);
      console.log('Auction detail:', response.data);
      setAuction(response.data);
    } catch (err) {
      console.error('Fetch auction error:', err);
      setError(err.response?.data?.detail || 'Failed to load auction details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAuction = async () => {
    if (!window.confirm('Are you sure you want to cancel this auction?')) return;
    
    setCancelling(true);
    try {
      await api.delete(`/auctions/${id}`);
      await fetchAuctionDetail();
    } catch (err) {
      console.error('Cancel auction error:', err);
      alert('Failed to cancel auction: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmDelivery = async () => {
    setActionLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await api.patch(`/auctions/${id}/delivery/confirm`);
      if (response.data?.verification_code) {
        setSuccessMessage(`Delivery confirmed! OTP: ${response.data.verification_code}`);
      } else {
        setSuccessMessage('Delivery confirmed successfully!');
      }
      await fetchAuctionDetail();
    } catch (err) {
      console.error('Confirm delivery error:', err);
      setError('Failed to confirm delivery: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDenyDelivery = async () => {
    if (!window.confirm('Are you sure you want to deny delivery? The buyer can switch to pickup.')) return;
    
    setActionLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await api.patch(`/auctions/${id}/delivery/deny`);
      setSuccessMessage('Delivery denied. Buyer can switch to pickup.');
      await fetchAuctionDetail();
    } catch (err) {
      console.error('Deny delivery error:', err);
      setError('Failed to deny delivery: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpInput.length !== 6) {
      setOtpError('Please enter a 6-digit OTP');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccessMessage('');
    setOtpError('');
    
    try {
      const response = await api.post(`/auctions/${id}/verify-otp`, { 
        verification_code: otpInput 
      });
      
      if (response.data.completed) {
        setSuccessMessage('OTP verified! Transaction completed.');
        setOtpInput('');
        await fetchAuctionDetail();
      } else {
        const remaining = response.data.max_attempts - response.data.verification_attempts;
        setOtpError(`Invalid OTP. ${remaining} attempts remaining.`);
        await fetchAuctionDetail();
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setOtpError(err.response?.data?.detail || 'Failed to verify OTP');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelist = async () => {
    if (!window.confirm('Relist this auction? A new auction will be created with the same details.')) return;
    
    setRelisting(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await api.post(`/auctions/${id}/relist`);
      setSuccessMessage(`Auction relisted! New auction created.`);
      setTimeout(() => {
        navigate(`/shop/auctions/${response.data.new_auction_id}`);
      }, 1500);
    } catch (err) {
      console.error('Relist error:', err);
      setError('Failed to relist: ' + (err.response?.data?.detail || err.message));
    } finally {
      setRelisting(false);
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
          label: 'Sold - Awaiting Delivery', 
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
            onClick={() => navigate('/shop/auctions/my')}
            className="mt-4 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-sm px-5 py-1.5 h-auto"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Back to My Auctions
          </Button>
        </div>
      </div>
    );
  }

  const status = getStatusBadge(auction.status);
  const isActive = auction.status === 'active';
  const isSold = auction.status === 'sold';
  const isCompleted = auction.status === 'completed';
  const isCancelled = auction.status === 'cancelled';
  const isOverridden = auction.completed_via_override === true;
  const deliveryInfo = getDeliveryMethodLabel(auction.delivery_method);
  const hasImages = auction.image_urls && auction.image_urls.length > 0;
  const timeLeft = getTimeLeft(auction.end_time);
  const hasOtp = auction.verification_code !== null && auction.verification_code !== undefined;
  const attempts = auction.verification_attempts || 0;
  const maxAttempts = 5;
  const attemptsRemaining = maxAttempts - attempts;

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
                  navigate('/shop/auctions/my');
                } else {
                  navigate('/shop/finalized-auctions');
                }
              }}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
            >
              <ArrowLeft size={14} className="mr-1.5" />
              {isActive ? 'My Auctions' : 'Finalized Auctions'}
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
            {isActive && (
              <Button
                onClick={handleCancelAuction}
                disabled={cancelling}
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs px-4 py-1.5 h-auto"
              >
                {cancelling ? (
                  <Loader2 size={13} className="animate-spin mr-1.5" />
                ) : (
                  <Trash2 size={13} className="mr-1.5" />
                )}
                {cancelling ? 'Cancelling...' : 'Cancel Auction'}
              </Button>
            )}
            {isCancelled && (
              <Button
                onClick={handleRelist}
                disabled={relisting}
                className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto flex items-center gap-1.5"
              >
                {relisting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <RotateCcw size={13} />
                )}
                Relist
              </Button>
            )}
          </div>
        </motion.div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-emerald-50/80 backdrop-blur-sm rounded-lg p-3 mb-4 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-100">
            <CheckCircle size={14} />
            {successMessage}
            <button 
              onClick={() => setSuccessMessage('')}
              className="ml-auto text-emerald-500 hover:text-emerald-700"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="bg-rose-50/80 backdrop-blur-sm rounded-lg p-3 mb-4 text-rose-700 text-xs flex items-center gap-2 border border-rose-100">
            <AlertCircle size={14} />
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-auto text-rose-500 hover:text-rose-700"
            >
              ×
            </button>
          </div>
        )}

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
                  <p className="text-[10px] text-[#A0A0B0]">Pincode</p>
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
                {auction.delivery_address && (
                  <div className="col-span-2 sm:col-span-3">
                    <p className="text-[10px] text-[#A0A0B0]">Delivery Address</p>
                    <p className="text-xs text-[#4A4A5A]">{auction.delivery_address}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Info & Bids */}
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
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <Clock size={12} />
                    {timeLeft}
                  </span>
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
                  <p className={`font-semibold ${auction.current_highest_bid ? 'text-emerald-600' : 'text-[#A0A0B0]'}`}>
                    {auction.current_highest_bid ? `₹${auction.current_highest_bid.toLocaleString()}` : 'No bids yet'}
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

              {/* ====== PHASE 5B: Post-Sale Delivery/OTP Section ====== */}
              {isSold && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  {/* Delivery Status */}
                  <div className="bg-blue-50/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700">Delivery Status</span>
                      </div>
                      {auction.delivery_confirmed_by_shop === true ? (
                        <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                          <CheckCircle size={12} />
                          Confirmed
                        </span>
                      ) : auction.delivery_confirmed_by_shop === false ? (
                        <span className="text-rose-600 text-xs font-medium flex items-center gap-1">
                          <XCircle size={12} />
                          Denied
                        </span>
                      ) : (
                        <span className="text-amber-600 text-xs font-medium flex items-center gap-1">
                          <Clock size={12} />
                          Awaiting
                        </span>
                      )}
                    </div>
                    {auction.delivery_method && (
                      <p className="text-xs text-blue-600 mt-1">
                        Method: {auction.delivery_method === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                      </p>
                    )}
                    {auction.delivery_address && (
                      <p className="text-xs text-[#4A4A5A] mt-0.5">
                        Address: {auction.delivery_address}
                      </p>
                    )}
                  </div>

                  {/* Confirm/Deny Buttons - Only if not confirmed */}
                  {auction.delivery_confirmed_by_shop !== true && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={handleConfirmDelivery}
                        disabled={actionLoading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 h-auto flex items-center justify-center gap-1.5"
                      >
                        {actionLoading ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <CheckCircle size={13} />
                        )}
                        Confirm Delivery
                      </Button>
                      <Button
                        onClick={handleDenyDelivery}
                        disabled={actionLoading}
                        variant="outline"
                        className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs px-3 py-1.5 h-auto"
                      >
                        Deny
                      </Button>
                    </div>
                  )}

                  {/* OTP Section - Only if delivery confirmed or pickup */}
                  {(auction.delivery_confirmed_by_shop === true || auction.delivery_method === 'pickup') && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-[#4A4A5A] flex items-center gap-1.5">
                            <Key size={13} className="text-[#A0A0B0]" />
                            Enter 6-digit OTP
                          </label>
                          {hasOtp && (
                            <span className="text-[10px] text-[#A0A0B0]">
                              Attempts remaining: {Math.max(0, attemptsRemaining)}
                            </span>
                          )}
                        </div>
                        {attempts >= maxAttempts && (
                          <div className="text-[10px] text-rose-600 flex items-center gap-1">
                            <AlertCircle size={12} />
                            Max attempts reached - Buyer can override
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={otpInput}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setOtpInput(val);
                              setOtpError('');
                            }}
                            disabled={actionLoading || attempts >= maxAttempts || !hasOtp}
                            className={`
                              flex-1 px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/20 transition-all
                              ${otpError ? 'border-rose-400 focus:border-rose-400' : 'border-[#EEECE6] focus:border-[#FFBE91]'}
                              ${(actionLoading || attempts >= maxAttempts || !hasOtp) ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                          />
                          <Button
                            onClick={handleVerifyOtp}
                            disabled={actionLoading || attempts >= maxAttempts || !hasOtp || otpInput.length !== 6}
                            className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto flex items-center gap-1.5"
                          >
                            {actionLoading ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Key size={13} />
                            )}
                            Verify
                          </Button>
                        </div>
                        {otpError && (
                          <p className="text-[10px] text-rose-600">{otpError}</p>
                        )}
                        {!hasOtp && auction.delivery_method === 'home_delivery' && (
                          <p className="text-[10px] text-amber-600">
                            Confirm delivery first to generate OTP
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Completed Section */}
              {isCompleted && (
                <div className="mt-3 pt-3 border-t border-emerald-200 bg-emerald-50/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-700">Transaction Completed</p>
                  </div>
                  {isOverridden && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <ShieldCheck size={12} />
                      Completed via buyer override
                    </p>
                  )}
                  {auction.closed_at && (
                    <p className="text-[10px] text-emerald-500 mt-0.5">
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
                  {auction.closed_at && (
                    <p className="text-[10px] text-rose-500 mt-0.5">
                      Closed: {formatDate(auction.closed_at)}
                    </p>
                  )}
                </div>
              )}

              {auction.status === 'cancelled' && (
                <div className="mt-3 pt-3 border-t border-gray-200 bg-gray-50/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-gray-600" />
                    <p className="text-sm font-semibold text-gray-700">Cancelled</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    This auction was cancelled by the shop owner
                  </p>
                  <Button
                    onClick={handleRelist}
                    disabled={relisting}
                    className="mt-2 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-3 py-1 h-auto flex items-center gap-1.5"
                  >
                    {relisting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RotateCcw size={12} />
                    )}
                    Relist Auction
                  </Button>
                </div>
              )}
            </div>

            {/* Bids History */}
            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-[#EEECE6] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[#1A1A2E] flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#FFBE91]" />
                  Bid History
                </h3>
                <span className="text-xs text-[#A0A0B0]">{auction.bid_count || 0} bids</span>
              </div>

              {!auction.bids || auction.bids.length === 0 ? (
                <div className="text-center py-6">
                  <Package size={24} className="text-[#A0A0B0] mx-auto mb-2" />
                  <p className="text-sm text-[#A0A0B0]">No bids yet</p>
                  <p className="text-xs text-[#A0A0B0] mt-0.5">Be the first to bid!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {auction.bids.map((bid, index) => {
                    const isHighest = index === 0;
                    const isWinner = auction.winning_bid_id === bid.id;
                    
                    return (
                      <div 
                        key={bid.id}
                        className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                          isWinner 
                            ? 'bg-emerald-50 border border-emerald-200' 
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
                            </p>
                            <p className="text-[10px] text-[#A0A0B0]">
                              {formatDate(bid.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-semibold ${isWinner ? 'text-emerald-600' : 'text-[#1A1A2E]'}`}>
                            ₹{bid.bid_amount.toLocaleString()}
                          </p>
                          {isWinner && (
                            <span className="text-[9px] text-emerald-600 font-medium">🏆 Winner</span>
                          )}
                          {isHighest && !isWinner && (
                            <span className="text-[9px] text-blue-600 font-medium">Highest</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-[10px] text-[#A0A0B0]"
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

export default AuctionDetailShop;