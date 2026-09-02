import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Award, 
  Calendar, 
  MapPin, 
  Tag, 
  DollarSign, 
  User, 
  Phone, 
  Home, 
  Store, 
  CheckCircle, 
  Clock, 
  XCircle,
  Truck,
  Package,
  FileText,
  Sparkles,
  Heart,
  Check,
  X,
  AlertCircle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Image as ImageIcon,
  PartyPopper,
  Shield,
  ShieldCheck,
  Star
} from 'lucide-react';
import api from '../../api/client';
import { confirmDelivery, denyDelivery } from '../../api/client';
import ImageCarousel from '../../components/ImageCarousel';

const BidDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [deliveryAction, setDeliveryAction] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successSubtext, setSuccessSubtext] = useState('');
  const [deliveryResolved, setDeliveryResolved] = useState(false);
  const [reliabilityScore, setReliabilityScore] = useState(null);
  const [reliabilityLoading, setReliabilityLoading] = useState(false);
  
  // OTP Verification States
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);

  useEffect(() => {
    fetchBidDetails();
  }, [id]);

  const showSuccess = (message, subtext) => {
    setSuccessMessage(message);
    setSuccessSubtext(subtext);
    setShowSuccessPopup(true);
    setTimeout(() => {
      setShowSuccessPopup(false);
    }, 4000);
  };

  const fetchBidDetails = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching bid details for:', id);
      
      const bidResponse = await api.get(`/bids/${id}`);
      console.log('Bid response:', bidResponse.data);
      
      const requestId = bidResponse.data.request_id;
      const requestResponse = await api.get(`/requests/${requestId}`);
      console.log('Request response:', requestResponse.data);
      
      let buyerDetails = null;
      if (bidResponse.data.status === 'selected') {
        try {
          const buyerResponse = await api.get(`/bids/${id}/buyer`);
          buyerDetails = buyerResponse.data;
          console.log('Buyer details:', buyerDetails);
        } catch (err) {
          console.log('Could not fetch buyer details:', err.message);
        }
      }
      
      const combinedData = {
        bid: bidResponse.data,
        request: requestResponse.data,
        buyer: buyerDetails?.buyer || {
          name: 'Buyer',
          phone: 'N/A',
          address: 'N/A',
          pincode: 'N/A'
        },
        isSelected: bidResponse.data.status === 'selected'
      };
      
      setData(combinedData);
      
      const deliveryStatus = requestResponse.data.delivery_confirmed_by_shop;
      if (deliveryStatus === true || deliveryStatus === false) {
        setDeliveryResolved(true);
      } else {
        setDeliveryResolved(false);
      }
      
      setOtpCode('');
      setOtpError('');
      setOtpSuccess(false);

      // Fetch reliability score for the shop
      if (bidResponse.data.shop_id) {
        fetchReliabilityScore(bidResponse.data.shop_id);
      }
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.detail || 'Failed to fetch bid details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReliabilityScore = async (shopId) => {
    setReliabilityLoading(true);
    try {
      const response = await api.get(`/reliability/shop/${shopId}`);
      if (response.data) {
        setReliabilityScore(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch reliability score:', err);
      // Don't show error to user, just keep score null
    } finally {
      setReliabilityLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!window.confirm('Confirm home delivery for this request?')) return;
    
    setDeliveryAction(true);
    setDeliveryError('');
    try {
      await confirmDelivery(data.request.id);
      setDeliveryResolved(true);
      await fetchBidDetails();
      showSuccess(
        'Delivery Confirmed!',
        'You have confirmed home delivery. A verification code has been generated.'
      );
    } catch (err) {
      console.error('Confirm delivery error:', err);
      setDeliveryError(err.response?.data?.detail || 'Failed to confirm delivery');
    } finally {
      setDeliveryAction(false);
    }
  };

  const handleDenyDelivery = async () => {
    if (!window.confirm('Deny home delivery for this request? The buyer will need to choose pickup or cancel.')) return;
    
    setDeliveryAction(true);
    setDeliveryError('');
    try {
      await denyDelivery(data.request.id);
      setDeliveryResolved(true);
      await fetchBidDetails();
      showSuccess(
        'Delivery Denied',
        'You have denied home delivery. The buyer can choose pickup or cancel.'
      );
    } catch (err) {
      console.error('Deny delivery error:', err);
      setDeliveryError(err.response?.data?.detail || 'Failed to deny delivery');
    } finally {
      setDeliveryAction(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 4) {
      setOtpError('Please enter a valid 4-digit code');
      return;
    }

    setVerifyingOtp(true);
    setOtpError('');
    
    try {
      const response = await api.post(`/requests/${data.request.id}/verify-otp`, {
        code: otpCode
      });
      
      if (response.data.status === 'completed') {
        setOtpSuccess(true);
        showSuccess(
          'Transaction Verified!',
          'The transaction has been successfully completed.'
        );
        setTimeout(() => {
          fetchBidDetails();
        }, 1500);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setOtpError(err.response?.data?.detail || 'Failed to verify code');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setOtpCode(value);
    if (otpError) setOtpError('');
  };

  const getStatusConfig = (status) => {
    const styles = {
      pending: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-200', icon: <Clock size={14} />, label: 'Pending' },
      selected: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-200', icon: <CheckCircle size={14} />, label: 'Selected' },
      rejected: { bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-200', icon: <XCircle size={14} />, label: 'Rejected' },
      purchased: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-200', icon: <Package size={14} />, label: 'Purchased' },
      completed: { bg: 'bg-violet-500/10', text: 'text-violet-600', border: 'border-violet-200', icon: <CheckCircle size={14} />, label: 'Completed' },
    };
    return styles[status] || { bg: 'bg-gray-500/10', text: 'text-gray-600', border: 'border-gray-200', icon: <Clock size={14} />, label: status?.toUpperCase() || 'Unknown' };
  };

  const getReliabilityBadge = (score) => {
    if (!score || score.reliability_score === 0) return null;
    
    const value = score.reliability_score;
    let color, label, bg;
    
    if (value >= 80) {
      color = 'text-emerald-700';
      bg = 'bg-emerald-100';
      label = 'Highly Reliable';
    } else if (value >= 60) {
      color = 'text-blue-700';
      bg = 'bg-blue-100';
      label = 'Reliable';
    } else if (value >= 40) {
      color = 'text-amber-700';
      bg = 'bg-amber-100';
      label = 'Moderately Reliable';
    } else {
      color = 'text-rose-700';
      bg = 'bg-rose-100';
      label = 'Needs Improvement';
    }
    
    return { color, bg, label, value };
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
          <div className="w-6 h-6 border-2 border-[#1A1A2E] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#A0A0B0]">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0] p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-2xl p-8 text-center shadow-lg"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <XCircle size={24} className="text-rose-500" />
          </div>
          <h2 className="text-lg font-semibold text-rose-700">Error</h2>
          <p className="text-sm text-rose-600 mt-1">{error}</p>
          <Button 
            onClick={() => navigate('/shop/requests')}
            className="mt-4 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-sm px-5 py-1.5 h-auto"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!data) return null;

  const { bid, request, buyer, isSelected } = data;
  const bidStatus = getStatusConfig(bid.status);
  const requestStatus = getStatusConfig(request.status);
  const isBidSelected = bid.status === 'selected';
  const isCompleted = request.status === 'completed';
  const isOverridden = request.completed_via_override === true;
  const reliabilityBadge = getReliabilityBadge(reliabilityScore);

  const needsDeliveryConfirmation = 
    isBidSelected && 
    request.status === 'purchased' && 
    request.delivery_method === 'home_delivery' &&
    !deliveryResolved;

  const showOtpVerification = 
    isBidSelected && 
    request.status === 'purchased' && 
    request.verification_code &&
    request.status !== 'completed';

  const hasImages = request.image_urls && request.image_urls.length > 0;
  const deliveryStatus = request.delivery_confirmed_by_shop;
  const verificationAttempts = request.verification_attempts || 0;
  const maxAttempts = 5;
  const attemptsRemaining = maxAttempts - verificationAttempts;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Success Popup */}
        <AnimatePresence>
          {showSuccessPopup && (
            <motion.div
              initial={{ opacity: 0, y: -60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -60, scale: 0.9 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white shadow-2xl rounded-2xl border border-emerald-200 max-w-md w-full mx-4 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <PartyPopper size={18} className="text-white" />
                  </div>
                  <span className="font-bold text-white text-sm">{successMessage}</span>
                </div>
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="px-4 py-3 bg-white">
                <p className="text-sm text-[#4A4A5A]">{successSubtext}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-600">Processing...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                if (isCompleted) {
                  navigate('/shop/finalized-bids');
                } else {
                  navigate('/shop/my-bids');
                }
              }}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
            >
              <ArrowLeft size={14} className="mr-1.5" />
              {isCompleted ? 'Finalized Bids' : 'My Bids'}
            </Button>
            <h1 className="text-lg font-semibold text-[#1A1A2E] tracking-tight">Bid Details</h1>
          </div>
          <div className="flex items-center gap-2">
            {isBidSelected && !isCompleted && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-200">
                <Sparkles size={12} className="text-emerald-600" />
                <span className="text-[10px] font-medium text-emerald-600">Selected</span>
              </div>
            )}
            {isCompleted && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 rounded-full border border-violet-200">
                <CheckCircle size={12} className="text-violet-600" />
                <span className="text-[10px] font-medium text-violet-600">Completed</span>
              </div>
            )}
            {isOverridden && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-200">
                <ShieldCheck size={12} className="text-amber-600" />
                <span className="text-[10px] font-medium text-amber-600">Override</span>
              </div>
            )}
            {/* Reliability Badge */}
            {reliabilityBadge && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${reliabilityBadge.bg} ${reliabilityBadge.color}`}>
                <ShieldCheck size={12} />
                {reliabilityBadge.label}
                <span className="ml-0.5 text-[9px] opacity-70">({Math.round(reliabilityBadge.value)}%)</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Success Banner */}
          {isBidSelected && !isCompleted && (
            <motion.div 
              variants={itemVariants}
              className="relative overflow-hidden bg-gradient-to-r from-emerald-50/80 to-emerald-100/30 backdrop-blur-sm rounded-xl p-4 border border-emerald-200"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-emerald-200/20 blur-2xl" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Award size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-emerald-800">Congratulations!</h3>
                  <p className="text-xs text-emerald-700">Your bid has been selected by the buyer</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Completed Section */}
          {isCompleted && (
            <motion.div 
              variants={itemVariants}
              className="relative overflow-hidden bg-gradient-to-r from-violet-50/80 to-violet-100/30 backdrop-blur-sm rounded-xl p-4 border border-violet-200"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-violet-200/20 blur-2xl" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={20} className="text-violet-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-violet-800">Transaction Completed</h3>
                  <p className="text-xs text-violet-700">
                    This transaction has been successfully completed
                    {isOverridden && ' via buyer override'}
                  </p>
                  {request.completed_at && (
                    <p className="text-[10px] text-violet-600 mt-1">
                      Completed on {new Date(request.completed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              {isOverridden && (
                <div className="mt-2 ml-[52px] p-2 bg-amber-50/80 rounded-lg border border-amber-200">
                  <p className="text-[10px] text-amber-700 flex items-center gap-1.5">
                    <ShieldCheck size={12} />
                    Completed via buyer override after max OTP attempts
                  </p>
                </div>
              )}
              {request.delivery_method && (
                <div className="mt-2 ml-[52px] p-2 bg-white/50 rounded-lg border border-violet-100">
                  <p className="text-[10px] text-violet-700 flex items-center gap-1.5">
                    <Truck size={12} />
                    Delivery method: {request.delivery_method === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                    {request.delivery_address && ` · ${request.delivery_address}`}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Bid Info */}
          <motion.div 
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-sm border border-[#EEECE6]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-[#1A1A2E]/5 flex items-center justify-center">
                <DollarSign size={13} className="text-[#1A1A2E]" />
              </div>
              <h3 className="text-xs font-medium text-[#1A1A2E] uppercase tracking-wider">Bid Details</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-[#A0A0B0]">Price</p>
                <p className="text-sm font-semibold text-[#1A1A2E]">₹{bid.price}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#A0A0B0]">Status</p>
                <span className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                  ${bidStatus.bg} ${bidStatus.text}
                `}>
                  {bidStatus.icon}
                  {bidStatus.label}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-[#A0A0B0]">Placed</p>
                <p className="text-xs text-[#1A1A2E]">{new Date(bid.created_at).toLocaleDateString()}</p>
              </div>
              {bid.note && (
                <div className="col-span-2 md:col-span-3">
                  <p className="text-[10px] text-[#A0A0B0]">Note</p>
                  <p className="text-xs text-[#1A1A2E]">{bid.note}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Request Info with Images */}
          <motion.div 
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-sm border border-[#EEECE6]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package size={13} className="text-blue-500" />
              </div>
              <h3 className="text-xs font-medium text-[#1A1A2E] uppercase tracking-wider">Request Details</h3>
            </div>

            {/* Image Carousel */}
            {hasImages && (
              <div className="mb-4">
                <ImageCarousel images={request.image_urls} alt={request.item_name} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <p className="text-[10px] text-[#A0A0B0]">Item</p>
                <p className="text-sm font-medium text-[#1A1A2E]">{request.item_name}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-[#A0A0B0]">Description</p>
                <p className="text-xs text-[#A0A0B0]">{request.description || 'No description'}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#A0A0B0]">Budget</p>
                <p className="text-xs font-medium text-[#1A1A2E]">₹{request.budget_min} - ₹{request.budget_max}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#A0A0B0]">Pincode</p>
                <p className="text-xs text-[#1A1A2E] flex items-center gap-1">
                  <MapPin size={11} className="text-[#A0A0B0]" />
                  {request.pincode}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-[#A0A0B0]">Status</p>
                <span className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                  ${requestStatus.bg} ${requestStatus.text}
                `}>
                  {requestStatus.icon}
                  {requestStatus.label}
                </span>
              </div>
            </div>

            {/* Delivery Method */}
            {request.delivery_method && (
              <div className={`mt-3 p-3 rounded-lg border ${isCompleted ? 'bg-violet-50/50 border-violet-100' : 'bg-amber-50/50 border-amber-100'}`}>
                <div className="flex items-center gap-2 text-xs">
                  <Truck size={13} className={isCompleted ? 'text-violet-600' : 'text-amber-600'} />
                  <span className={isCompleted ? 'font-medium text-violet-700' : 'font-medium text-amber-700'}>
                    {request.delivery_method === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                  </span>
                  {request.delivery_address && (
                    <span className={isCompleted ? 'text-violet-600' : 'text-amber-600'}>
                      · {request.delivery_address}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Confirmation - Show when needed and not completed */}
            {!isCompleted && needsDeliveryConfirmation ? (
              <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-blue-700 mb-2">
                  Buyer requested home delivery — can you deliver?
                </p>
                {request.delivery_address && (
                  <p className="text-[10px] text-blue-600 mb-2">
                    Address: {request.delivery_address}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleConfirmDelivery}
                    disabled={deliveryAction}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-1.5 h-auto flex items-center gap-1.5"
                  >
                    {deliveryAction ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <CheckCircle size={13} />
                    )}
                    Confirm Delivery
                  </Button>
                  <Button
                    onClick={handleDenyDelivery}
                    disabled={deliveryAction}
                    variant="outline"
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs px-4 py-1.5 h-auto flex items-center gap-1.5"
                  >
                    {deliveryAction ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <XCircle size={13} />
                    )}
                    Deny Delivery
                  </Button>
                </div>
                {deliveryError && (
                  <p className="text-[10px] text-rose-600 mt-2 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {deliveryError}
                  </p>
                )}
              </div>
            ) : (
              // Show delivery status - confirmed or denied (if not completed)
              !isCompleted && (
                <>
                  {isBidSelected && request.status === 'purchased' && request.delivery_method === 'home_delivery' && deliveryStatus === true && (
                    <div className="mt-3 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                      <div className="flex items-center gap-2 text-xs text-emerald-700">
                        <ThumbsUp size={16} className="text-emerald-600" />
                        <span className="font-medium">Delivery Confirmed</span>
                      </div>
                      <p className="text-xs text-emerald-600 mt-1 ml-6">
                        You confirmed home delivery on {request.delivery_response_at ? new Date(request.delivery_response_at).toLocaleString() : 'recently'}. 
                        The buyer has been notified. Please proceed with the delivery.
                      </p>
                      <div className="mt-2 ml-6 p-2 bg-emerald-100/50 rounded-lg border border-emerald-200">
                        <p className="text-[10px] text-emerald-700 flex items-center gap-1">
                          <CheckCircle size={12} />
                          Delivery address: {request.delivery_address || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  )}

                  {isBidSelected && request.status === 'purchased' && request.delivery_method === 'home_delivery' && deliveryStatus === false && (
                    <div className="mt-3 p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                      <div className="flex items-center gap-2 text-xs text-rose-700">
                        <ThumbsDown size={16} className="text-rose-600" />
                        <span className="font-medium">Delivery Denied</span>
                      </div>
                      <p className="text-xs text-rose-600 mt-1 ml-6">
                        You denied home delivery on {request.delivery_response_at ? new Date(request.delivery_response_at).toLocaleString() : 'recently'}. 
                        Waiting for buyer to choose pickup or cancel the order.
                      </p>
                      <div className="mt-2 ml-6 p-2 bg-rose-100/50 rounded-lg border border-rose-200">
                        <p className="text-[10px] text-rose-700 flex items-center gap-1">
                          <Clock size={12} />
                          Awaiting buyer's response...
                        </p>
                      </div>
                    </div>
                  )}

                  {isBidSelected && request.status === 'purchased' && request.delivery_method === 'pickup' && (
                    <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 text-xs text-blue-700">
                        <Home size={16} className="text-blue-600" />
                        <span className="font-medium">Pickup Selected</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1 ml-6">
                        The buyer has selected pickup. No delivery confirmation needed.
                      </p>
                      {request.verification_code && (
                        <p className="text-[10px] text-violet-600 mt-1 ml-6 flex items-center gap-1">
                          <CheckCircle size={12} />
                          OTP code generated. Enter it below to complete the transaction.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )
            )}

            {/* OTP Verification Section (if not completed) */}
            {!isCompleted && showOtpVerification && (
              <div className="mt-4 p-4 bg-violet-50/80 rounded-xl border border-violet-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Shield size={14} className="text-violet-600" />
                  </div>
                  <h4 className="text-xs font-semibold text-violet-800 uppercase tracking-wider">
                    Complete Transaction
                  </h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    request.delivery_method === 'pickup' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {request.delivery_method === 'pickup' ? 'Pickup' : 'Home Delivery'}
                  </span>
                </div>
                
                <p className="text-xs text-violet-700 mb-3">
                  {request.delivery_method === 'pickup' 
                    ? 'Enter the 4-digit verification code provided by the buyer to confirm pickup and complete the transaction.'
                    : 'Enter the 4-digit verification code provided by the buyer to complete this transaction.'}
                </p>

                {request.completed_via_override ? (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-700 flex items-center gap-2">
                      <AlertCircle size={14} />
                      This transaction was completed via buyer override.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="text"
                        maxLength="4"
                        placeholder="0000"
                        value={otpCode}
                        onChange={handleOtpChange}
                        disabled={verifyingOtp || otpSuccess}
                        className="w-32 px-3 py-2 text-center text-lg font-bold tracking-[0.3em] bg-white border-2 border-violet-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-violet-200 focus:border-violet-500 transition-all disabled:opacity-50"
                      />
                      <Button
                        onClick={handleVerifyOtp}
                        disabled={otpCode.length !== 4 || verifyingOtp || otpSuccess}
                        className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-5 py-2 h-auto flex items-center gap-2"
                      >
                        {verifyingOtp ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        {verifyingOtp ? 'Verifying...' : 'Verify'}
                      </Button>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-violet-600">
                        Attempts remaining: {attemptsRemaining}
                      </span>
                      {verificationAttempts > 0 && (
                        <span className="text-[10px] text-amber-600">
                          ({verificationAttempts} used)
                        </span>
                      )}
                    </div>

                    {otpError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-rose-600 mt-2 flex items-center gap-1"
                      >
                        <AlertCircle size={12} />
                        {otpError}
                      </motion.p>
                    )}

                    {otpSuccess && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-emerald-600 mt-2 flex items-center gap-1"
                      >
                        <CheckCircle size={12} />
                        Transaction verified successfully!
                      </motion.p>
                    )}

                    {verificationAttempts >= 5 && !otpSuccess && (
                      <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-[10px] text-amber-700 flex items-center gap-1">
                          <AlertCircle size={12} />
                          Maximum attempts reached. Please contact the buyer to complete the transaction manually.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>

          {/* Buyer Contact */}
          <motion.div 
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-sm border border-[#EEECE6]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                <User size={13} className="text-emerald-500" />
              </div>
              <h3 className="text-xs font-medium text-[#1A1A2E] uppercase tracking-wider">Buyer Contact</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-[#A0A0B0]">Name</p>
                <p className="text-sm font-medium text-[#1A1A2E]">{buyer?.name || 'Buyer'}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#A0A0B0]">Phone</p>
                <p className="text-sm text-[#1A1A2E] flex items-center gap-1">
                  <Phone size={12} className="text-[#A0A0B0]" />
                  {buyer?.phone || 'N/A'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] text-[#A0A0B0]">Address</p>
                <p className="text-sm text-[#1A1A2E] flex items-start gap-1">
                  <Home size={12} className="text-[#A0A0B0] mt-0.5" />
                  {buyer?.address || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#A0A0B0]">Pincode</p>
                <p className="text-sm text-[#1A1A2E]">{buyer?.pincode || 'N/A'}</p>
              </div>
            </div>
            {!isBidSelected && !isCompleted && (
              <div className="mt-3 p-2 bg-amber-50/50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-700 flex items-center gap-1.5">
                  <Clock size={12} />
                  Contact details will be revealed once your bid is selected
                </p>
              </div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap gap-2 pt-2"
          >
            <Button 
              onClick={() => {
                if (isCompleted) {
                  navigate('/shop/finalized-bids');
                } else {
                  navigate('/shop/my-bids');
                }
              }}
              variant="outline"
              className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-4 py-1.5 h-auto"
            >
              <Package size={13} className="mr-1.5" />
              {isCompleted ? 'Finalized Bids' : 'My Bids'}
            </Button>
            <Button 
              onClick={() => navigate('/shop/browse')}
              className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto"
            >
              <Store size={13} className="mr-1.5" />
              Browse More
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default BidDetail;