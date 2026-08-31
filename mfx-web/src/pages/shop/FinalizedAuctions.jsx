import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle,
  Search,
  DollarSign,
  Eye,
  ChevronRight,
  Loader2,
  TrendingUp,
  MapPin,
  Truck,
  Store,
  RotateCcw,
  Key,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import api from '../../api/client';

const FinalizedAuctions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [otpInputs, setOtpInputs] = useState({});
  const [otpErrors, setOtpErrors] = useState({});
  const [relisting, setRelisting] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const filteredAuctions = useMemo(() => {
    let filtered = [...auctions];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(a => 
        a.item_name.toLowerCase().includes(query) ||
        (a.description && a.description.toLowerCase().includes(query))
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(a => a.category === categoryFilter);
    }

    filtered.sort((a, b) => new Date(b.closed_at || b.created_at) - new Date(a.closed_at || a.created_at));
    return filtered;
  }, [auctions, statusFilter, searchQuery, categoryFilter]);

  useEffect(() => {
    fetchFinalizedAuctions();
  }, []);

  const fetchFinalizedAuctions = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch sold, completed, and cancelled auctions
      const response = await api.get('/auctions?status=all');
      const allAuctions = response.data || [];
      const finalized = allAuctions.filter(a => 
        ['sold', 'completed', 'cancelled'].includes(a.status)
      );
      setAuctions(finalized);
    } catch (err) {
      console.error('Fetch finalized auctions error:', err);
      setError('Failed to load finalized auctions: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async (auctionId) => {
    setActionLoading(auctionId);
    setError('');
    setSuccessMessage('');
    try {
      const response = await api.patch(`/auctions/${auctionId}/delivery/confirm`);
      if (response.data?.verification_code) {
        setSuccessMessage(`Delivery confirmed! OTP: ${response.data.verification_code}`);
      } else {
        setSuccessMessage('Delivery confirmed successfully!');
      }
      await fetchFinalizedAuctions();
    } catch (err) {
      console.error('Confirm delivery error:', err);
      setError('Failed to confirm delivery: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDenyDelivery = async (auctionId) => {
    if (!window.confirm('Are you sure you want to deny delivery? The buyer can switch to pickup.')) return;
    
    setActionLoading(auctionId);
    setError('');
    setSuccessMessage('');
    try {
      await api.patch(`/auctions/${auctionId}/delivery/deny`);
      setSuccessMessage('Delivery denied. Buyer can switch to pickup.');
      await fetchFinalizedAuctions();
    } catch (err) {
      console.error('Deny delivery error:', err);
      setError('Failed to deny delivery: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyOtp = async (auctionId) => {
    const code = otpInputs[auctionId] || '';
    if (code.length !== 6) {
      setOtpErrors({ ...otpErrors, [auctionId]: 'Please enter a 6-digit OTP' });
      return;
    }

    setActionLoading(auctionId);
    setError('');
    setSuccessMessage('');
    setOtpErrors({ ...otpErrors, [auctionId]: '' });
    
    try {
      const response = await api.post(`/auctions/${auctionId}/verify-otp`, { 
        verification_code: code 
      });
      
      if (response.data.completed) {
        setSuccessMessage('OTP verified! Transaction completed.');
        setOtpInputs({ ...otpInputs, [auctionId]: '' });
        await fetchFinalizedAuctions();
      } else {
        const remaining = response.data.max_attempts - response.data.verification_attempts;
        setOtpErrors({ 
          ...otpErrors, 
          [auctionId]: `Invalid OTP. ${remaining} attempts remaining.` 
        });
        // Update attempts display
        await fetchFinalizedAuctions();
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setOtpErrors({ 
        ...otpErrors, 
        [auctionId]: err.response?.data?.detail || 'Failed to verify OTP' 
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRelist = async (auctionId) => {
    if (!window.confirm('Relist this auction? A new auction will be created with the same details.')) return;
    
    setRelisting(auctionId);
    setError('');
    setSuccessMessage('');
    try {
      const response = await api.post(`/auctions/${auctionId}/relist`);
      setSuccessMessage(`Auction relisted! New auction ID: ${response.data.new_auction_id}`);
      await fetchFinalizedAuctions();
      // Navigate to the new auction
      setTimeout(() => {
        navigate(`/shop/auctions/${response.data.new_auction_id}`);
      }, 1500);
    } catch (err) {
      console.error('Relist error:', err);
      setError('Failed to relist: ' + (err.response?.data?.detail || err.message));
    } finally {
      setRelisting(null);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'sold': 
        return { 
          bg: 'bg-blue-100', 
          text: 'text-blue-700', 
          label: 'Sold - Awaiting Delivery', 
          icon: <Truck size={12} />,
          dot: 'bg-blue-500'
        };
      case 'completed': 
        return { 
          bg: 'bg-emerald-100', 
          text: 'text-emerald-700', 
          label: 'Completed', 
          icon: <CheckCircle size={12} />,
          dot: 'bg-emerald-500'
        };
      case 'cancelled': 
        return { 
          bg: 'bg-gray-100', 
          text: 'text-gray-700', 
          label: 'Cancelled', 
          icon: <XCircle size={12} />,
          dot: 'bg-gray-500'
        };
      default: 
        return { 
          bg: 'bg-gray-100', 
          text: 'text-gray-700', 
          label: status, 
          icon: <AlertCircle size={12} />,
          dot: 'bg-gray-500'
        };
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  // Get counts for filter tabs
  const counts = {
    all: auctions.length,
    sold: auctions.filter(a => a.status === 'sold').length,
    completed: auctions.filter(a => a.status === 'completed').length,
    cancelled: auctions.filter(a => a.status === 'cancelled').length,
  };

  const statusTabs = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'sold', label: 'Sold', count: counts.sold },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#1A1A2E]" />
          <p className="text-xs text-[#A0A0B0]">Loading finalized auctions...</p>
        </div>
      </div>
    );
  }

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
              onClick={() => navigate('/shop/auctions')}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
            >
              <ArrowLeft size={14} className="mr-1.5" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-[#1A1A2E] flex items-center gap-2">
                <Package size={20} className="text-[#FFBE91]" />
                Finalized Auctions
              </h1>
              <p className="text-xs text-[#A0A0B0] mt-0.5">
                {auctions.length} finalized auctions · {counts.sold} awaiting action
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/shop/auctions/post')}
            className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto flex items-center gap-1.5"
          >
            <Package size={14} />
            Create Auction
          </Button>
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

        {/* Status Filter Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-1 mb-4 bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-[#EEECE6]"
        >
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-medium
                ${statusFilter === tab.id 
                  ? 'bg-[#FFBE91] text-[#1A1A2E] shadow-md' 
                  : 'text-[#4A4A5A] hover:text-[#1A1A2E] hover:bg-[#FFDDB0]/30'
                }
              `}
            >
              {tab.label}
              <span className={`
                ml-1 px-1.5 py-0.5 rounded-full text-[9px]
                ${statusFilter === tab.id 
                  ? 'bg-[#1A1A2E]/10 text-[#1A1A2E]' 
                  : 'bg-[#FFDDB0]/30 text-[#4A4A5A]'
                }
              `}>
                {tab.count}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Search & Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-2 mb-4"
        >
          <div className="flex-1 min-w-[150px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
            <input
              type="text"
              placeholder="Search finalized auctions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white/80 border border-[#EEECE6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
            />
          </div>
          <div className="w-40">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/80 border border-[#EEECE6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all appearance-none"
            >
              <option value="">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="furniture">Furniture</option>
              <option value="clothing">Clothing</option>
              <option value="books">Books</option>
              <option value="home_kitchen">Home & Kitchen</option>
              <option value="vehicles">Vehicles</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('');
              setStatusFilter('all');
            }}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-2 h-auto"
          >
            Clear
          </Button>
          <Button
            onClick={fetchFinalizedAuctions}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-2 h-auto"
          >
            <RefreshCw size={13} className="mr-1" />
            Refresh
          </Button>
        </motion.div>

        {/* Auctions List */}
        {filteredAuctions.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-8 text-center shadow-sm border border-[#EEECE6]"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F5F3EF] flex items-center justify-center mx-auto mb-3">
              <Package size={20} className="text-[#A0A0B0]" />
            </div>
            <h3 className="text-sm font-medium text-[#1A1A2E]">No finalized auctions</h3>
            <p className="text-xs text-[#A0A0B0] mt-1">
              {statusFilter === 'all' ? 'Your finalized auctions will appear here' : `No ${statusFilter} auctions`}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredAuctions.map((auction) => {
              const status = getStatusBadge(auction.status);
              const firstImage = auction.image_urls && auction.image_urls.length > 0 
                ? auction.image_urls[0] 
                : null;
              const isSold = auction.status === 'sold';
              const isCompleted = auction.status === 'completed';
              const isCancelled = auction.status === 'cancelled';
              const isActionLoading = actionLoading === auction.id;
              const isRelisting = relisting === auction.id;
              const hasOtp = auction.verification_code !== null && auction.verification_code !== undefined;
              const attempts = auction.verification_attempts || 0;
              const maxAttempts = 5;
              const attemptsRemaining = maxAttempts - attempts;
              const isOverridden = auction.completed_via_override === true;
              const otpValue = otpInputs[auction.id] || '';
              const otpError = otpErrors[auction.id] || '';

              return (
                <motion.div
                  key={auction.id}
                  variants={itemVariants}
                  className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-[#EEECE6] hover:shadow-md transition-all"
                >
                  <div className="flex flex-col gap-4">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-start gap-3">
                      {/* Image */}
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={auction.item_name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-[#F8F6F0] flex items-center justify-center flex-shrink-0">
                          <Package size={24} className="text-[#A0A0B0]" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium text-[#1A1A2E]">
                            {auction.item_name}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text}`}>
                            {status.icon}
                            {status.label}
                          </span>
                          {isOverridden && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                              <ShieldCheck size={12} />
                              Override
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#A0A0B0]">
                          <span className="flex items-center gap-1">
                            <DollarSign size={11} />
                            {isCompleted ? 'Sold for' : 'Price'}: ₹{(auction.current_highest_bid || auction.starting_price).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={11} />
                            {auction.pincode}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package size={11} />
                            {auction.bid_count || 0} bids
                          </span>
                          {auction.delivery_method && (
                            <span className="flex items-center gap-1 text-[#4A4A5A]">
                              <Truck size={11} />
                              {auction.delivery_method === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 text-[10px] text-[#A0A0B0]">
                          Closed: {new Date(auction.closed_at || auction.created_at).toLocaleString()}
                        </div>
                      </div>

                      {/* View Button */}
                      <Button
                        onClick={() => navigate(`/shop/auctions/${auction.id}`)}
                        variant="ghost"
                        className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-1 h-auto flex-shrink-0"
                      >
                        <Eye size={13} className="mr-1" />
                        View
                      </Button>
                    </div>

                    {/* Action Section - Only for Sold auctions */}
                    {isSold && (
                      <div className="border-t border-[#EEECE6] pt-3 mt-1">
                        <div className="flex flex-wrap items-start gap-4">
                          {/* Delivery Status */}
                          <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2 text-xs text-[#4A4A5A]">
                              <Truck size={14} className="text-[#A0A0B0]" />
                              <span className="font-medium">Delivery Status:</span>
                              {auction.delivery_confirmed_by_shop === true ? (
                                <span className="text-emerald-600 font-medium">Confirmed</span>
                              ) : auction.delivery_confirmed_by_shop === false ? (
                                <span className="text-rose-600 font-medium">Denied</span>
                              ) : (
                                <span className="text-amber-600 font-medium">Awaiting Confirmation</span>
                              )}
                            </div>
                            {auction.delivery_address && (
                              <div className="mt-1 text-[10px] text-[#A0A0B0]">
                                Address: {auction.delivery_address}
                              </div>
                            )}
                            {auction.delivery_method === 'pickup' && (
                              <div className="mt-1 text-[10px] text-blue-600">
                                Pickup selected by buyer
                              </div>
                            )}
                          </div>

                          {/* Confirm/Deny Buttons - Only if not confirmed */}
                          {auction.delivery_confirmed_by_shop !== true && (
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                onClick={() => handleConfirmDelivery(auction.id)}
                                disabled={isActionLoading}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 h-auto flex items-center gap-1.5"
                              >
                                {isActionLoading ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <CheckCircle size={13} />
                                )}
                                Confirm Delivery
                              </Button>
                              <Button
                                onClick={() => handleDenyDelivery(auction.id)}
                                disabled={isActionLoading}
                                variant="ghost"
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs px-3 py-1.5 h-auto"
                              >
                                Deny
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* OTP Section - Only if delivery confirmed or pickup */}
                        {(auction.delivery_confirmed_by_shop === true || auction.delivery_method === 'pickup') && (
                          <div className="mt-3 border-t border-[#EEECE6] pt-3">
                            <div className="flex flex-wrap items-end gap-3">
                              <div className="flex-1 min-w-[150px]">
                                <label className="text-[10px] text-[#A0A0B0] block mb-1">
                                  Enter 6-digit OTP
                                  {hasOtp && (
                                    <span className="ml-2 text-[#A0A0B0]">
                                      (Attempts remaining: {Math.max(0, attemptsRemaining)})
                                    </span>
                                  )}
                                  {attempts >= maxAttempts && (
                                    <span className="ml-2 text-rose-600 font-medium">
                                      Max attempts reached - Buyer can override
                                    </span>
                                  )}
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={otpValue}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, '');
                                      setOtpInputs({ ...otpInputs, [auction.id]: val });
                                      setOtpErrors({ ...otpErrors, [auction.id]: '' });
                                    }}
                                    disabled={isActionLoading || attempts >= maxAttempts || !hasOtp}
                                    className={`
                                      w-32 px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/20 transition-all
                                      ${otpError ? 'border-rose-400 focus:border-rose-400' : 'border-[#EEECE6] focus:border-[#FFBE91]'}
                                      ${(isActionLoading || attempts >= maxAttempts || !hasOtp) ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                  />
                                  <Button
                                    onClick={() => handleVerifyOtp(auction.id)}
                                    disabled={isActionLoading || attempts >= maxAttempts || !hasOtp || otpValue.length !== 6}
                                    className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-3 py-1.5 h-auto flex items-center gap-1.5"
                                  >
                                    {isActionLoading ? (
                                      <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                      <Key size={13} />
                                    )}
                                    Verify
                                  </Button>
                                </div>
                                {otpError && (
                                  <p className="mt-1 text-[10px] text-rose-600">{otpError}</p>
                                )}
                                {!hasOtp && auction.delivery_method === 'home_delivery' && (
                                  <p className="mt-1 text-[10px] text-amber-600">
                                    Confirm delivery first to generate OTP
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Completed Section */}
                    {isCompleted && (
                      <div className="border-t border-[#EEECE6] pt-3 mt-1">
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle size={14} />
                            Transaction completed
                          </span>
                          {isOverridden && (
                            <span className="flex items-center gap-1.5 text-amber-600">
                              <ShieldCheck size={14} />
                              Completed via buyer override
                            </span>
                          )}
                          {auction.delivery_method && (
                            <span className="text-[#A0A0B0]">
                              Delivery: {auction.delivery_method === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cancelled Section - Show Relist Button */}
                    {isCancelled && (
                      <div className="border-t border-[#EEECE6] pt-3 mt-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs text-[#A0A0B0] flex items-center gap-1.5">
                            <XCircle size={14} className="text-gray-400" />
                            Auction cancelled
                          </span>
                          <Button
                            onClick={() => handleRelist(auction.id)}
                            disabled={isRelisting}
                            className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-3 py-1.5 h-auto flex items-center gap-1.5"
                          >
                            {isRelisting ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <RotateCcw size={13} />
                            )}
                            Relist
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Footer Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center text-[10px] text-[#A0A0B0]"
        >
          <span className="flex items-center justify-center gap-1">
            <span className="text-[#FFBE91]">📦</span>
            Finalized auctions show post-sale status · Sold auctions require delivery confirmation and OTP verification
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default FinalizedAuctions;