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
  Key,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Home,
  Building2
} from 'lucide-react';
import api from '../../api/client';

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

  // Get user's won auctions from all auctions
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
    fetchWonAuctions();
  }, []);

  const fetchWonAuctions = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all auctions and filter for won ones
      const response = await api.get('/auctions?status=all');
      const allAuctions = response.data || [];
      
      // Filter auctions where current user is the winner (current_highest_bidder)
      const won = allAuctions.filter(a => 
        a.current_highest_bidder === user?.id && 
        ['sold', 'completed'].includes(a.status)
      );
      setAuctions(won);
    } catch (err) {
      console.error('Fetch won auctions error:', err);
      setError('Failed to load won auctions: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSetDeliveryMethod = async (auctionId) => {
    const method = deliveryMethods[auctionId] || '';
    const address = deliveryAddresses[auctionId] || '';

    if (!method) {
      setError('Please select a delivery method');
      return;
    }

    if (method === 'home_delivery' && !address.trim()) {
      setError('Please enter your delivery address');
      return;
    }

    setActionLoading(auctionId);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await api.patch(`/auctions/${auctionId}/delivery`, {
        delivery_method: method,
        delivery_address: method === 'home_delivery' ? address : null
      });
      
      if (response.data.verification_code) {
        setSuccessMessage(`Delivery method set! OTP: ${response.data.verification_code}`);
      } else {
        setSuccessMessage('Delivery method set successfully!');
      }
      await fetchWonAuctions();
    } catch (err) {
      console.error('Set delivery method error:', err);
      setError('Failed to set delivery method: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSwitchToPickup = async (auctionId) => {
    if (!window.confirm('Switch to pickup? The shop will need to verify the OTP in person.')) return;
    
    setActionLoading(auctionId);
    setError('');
    setSuccessMessage('');
    try {
      const response = await api.patch(`/auctions/${auctionId}/switch-to-pickup`);
      if (response.data.verification_code) {
        setSuccessMessage(`Switched to pickup! OTP: ${response.data.verification_code}`);
      }
      await fetchWonAuctions();
    } catch (err) {
      console.error('Switch to pickup error:', err);
      setError('Failed to switch to pickup: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyOtp = (auctionId, code) => {
    navigator.clipboard.writeText(code);
    setOtpCopied({ ...otpCopied, [auctionId]: true });
    setTimeout(() => {
      setOtpCopied({ ...otpCopied, [auctionId]: false });
    }, 2000);
  };

  const toggleOtpVisibility = (auctionId) => {
    setOtpVisible({ ...otpVisible, [auctionId]: !otpVisible[auctionId] });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'sold': 
        return { 
          bg: 'bg-blue-100', 
          text: 'text-blue-700', 
          label: 'Awaiting Delivery', 
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
  };

  const statusTabs = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'sold', label: 'Awaiting Delivery', count: counts.sold },
    { id: 'completed', label: 'Completed', count: counts.completed },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#1A1A2E]" />
          <p className="text-xs text-[#A0A0B0]">Loading your won auctions...</p>
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
              onClick={() => navigate('/buyer/auctions')}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
            >
              <ArrowLeft size={14} className="mr-1.5" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-[#1A1A2E] flex items-center gap-2">
                <Trophy size={20} className="text-[#FFBE91]" />
                My Won Auctions
              </h1>
              <p className="text-xs text-[#A0A0B0] mt-0.5">
                {auctions.length} won auctions · {counts.sold} awaiting delivery
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/buyer/browse-auctions')}
            className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto flex items-center gap-1.5"
          >
            <Store size={14} />
            Browse More
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
              placeholder="Search won auctions..."
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
            onClick={fetchWonAuctions}
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
              <Trophy size={20} className="text-[#A0A0B0]" />
            </div>
            <h3 className="text-sm font-medium text-[#1A1A2E]">No won auctions</h3>
            <p className="text-xs text-[#A0A0B0] mt-1">
              {statusFilter === 'all' ? 'Your won auctions will appear here' : `No ${statusFilter} auctions`}
            </p>
            <Button 
              onClick={() => navigate('/buyer/browse-auctions')}
              className="mt-3 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto"
            >
              <Store size={13} className="mr-1.5" />
              Browse Auctions
            </Button>
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
              const isActionLoading = actionLoading === auction.id;
              const hasOtp = auction.verification_code !== null && auction.verification_code !== undefined;
              const otpCode = auction.verification_code || '';
              const attempts = auction.verification_attempts || 0;
              const maxAttempts = 5;
              const attemptsRemaining = maxAttempts - attempts;
              const isOverridden = auction.completed_via_override === true;
              const isOtpVisible = otpVisible[auction.id] || false;
              const isOtpCopied = otpCopied[auction.id] || false;
              const deliveryMethod = deliveryMethods[auction.id] || auction.delivery_method || '';
              const deliveryAddress = deliveryAddresses[auction.id] || auction.delivery_address || '';

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
                            Won for: ₹{(auction.current_highest_bid || auction.starting_price).toLocaleString()}
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
                          Won on: {new Date(auction.closed_at || auction.created_at).toLocaleString()}
                        </div>
                      </div>

                      {/* View Button */}
                      <Button
                        onClick={() => navigate(`/buyer/auctions/${auction.id}`)}
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
                        {/* Delivery Method Selection - Only if not set */}
                        {!auction.delivery_method ? (
                          <div className="space-y-3">
                            <div className="text-xs text-[#4A4A5A] font-medium">
                              Set your delivery preference:
                            </div>
                            <div className="flex flex-wrap gap-4">
                              <label className="flex items-center gap-2 text-xs cursor-pointer">
                                <input
                                  type="radio"
                                  name={`delivery-${auction.id}`}
                                  value="home_delivery"
                                  checked={deliveryMethods[auction.id] === 'home_delivery'}
                                  onChange={(e) => {
                                    setDeliveryMethods({ ...deliveryMethods, [auction.id]: e.target.value });
                                    setError('');
                                  }}
                                  className="accent-[#1A1A2E]"
                                />
                                <Home size={14} className="text-[#4A4A5A]" />
                                Home Delivery
                              </label>
                              <label className="flex items-center gap-2 text-xs cursor-pointer">
                                <input
                                  type="radio"
                                  name={`delivery-${auction.id}`}
                                  value="pickup"
                                  checked={deliveryMethods[auction.id] === 'pickup'}
                                  onChange={(e) => {
                                    setDeliveryMethods({ ...deliveryMethods, [auction.id]: e.target.value });
                                    setError('');
                                  }}
                                  className="accent-[#1A1A2E]"
                                />
                                <Building2 size={14} className="text-[#4A4A5A]" />
                                Pickup
                              </label>
                            </div>

                            {deliveryMethods[auction.id] === 'home_delivery' && (
                              <div className="mt-2">
                                <label className="text-[10px] text-[#A0A0B0] block mb-1">
                                  Delivery Address *
                                </label>
                                <textarea
                                  value={deliveryAddresses[auction.id] || ''}
                                  onChange={(e) => setDeliveryAddresses({ ...deliveryAddresses, [auction.id]: e.target.value })}
                                  placeholder="Enter your full delivery address"
                                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#EEECE6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all resize-none"
                                  rows={2}
                                />
                              </div>
                            )}

                            <Button
                              onClick={() => handleSetDeliveryMethod(auction.id)}
                              disabled={isActionLoading}
                              className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto flex items-center gap-1.5"
                            >
                              {isActionLoading ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Truck size={13} />
                              )}
                              Set Delivery Method
                            </Button>
                          </div>
                        ) : (
                          /* Delivery Method Set - Show OTP or Status */
                          <div>
                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex items-center gap-2 text-xs text-[#4A4A5A]">
                                <Truck size={14} className="text-[#A0A0B0]" />
                                <span className="font-medium">Delivery Method:</span>
                                <span className="text-[#1A1A2E]">
                                  {auction.delivery_method === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                                </span>
                              </div>

                              {/* Show delivery status */}
                              {auction.delivery_confirmed_by_shop === true && (
                                <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                                  <CheckCircle size={12} />
                                  Confirmed by Shop
                                </span>
                              )}
                              {auction.delivery_confirmed_by_shop === false && (
                                <span className="text-rose-600 text-xs font-medium flex items-center gap-1">
                                  <XCircle size={12} />
                                  Denied by Shop
                                </span>
                              )}

                              {/* Show Switch to Pickup button if denied */}
                              {auction.delivery_confirmed_by_shop === false && auction.delivery_method === 'home_delivery' && (
                                <Button
                                  onClick={() => handleSwitchToPickup(auction.id)}
                                  disabled={isActionLoading}
                                  variant="ghost"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs px-3 py-1 h-auto"
                                >
                                  {isActionLoading ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Building2 size={13} className="mr-1" />
                                  )}
                                  Switch to Pickup
                                </Button>
                              )}
                            </div>

                            {/* OTP Display - Only if delivery confirmed or pickup */}
                            {(auction.delivery_confirmed_by_shop === true || auction.delivery_method === 'pickup') && hasOtp && (
                              <div className="mt-3 border-t border-[#EEECE6] pt-3">
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <Key size={14} className="text-[#A0A0B0]" />
                                    <span className="text-xs text-[#4A4A5A] font-medium">OTP Code:</span>
                                    <div 
                                      className="font-mono text-lg font-bold text-[#1A1A2E] bg-[#F8F6F0] px-3 py-1 rounded-lg select-all"
                                    >
                                      {isOtpVisible ? otpCode : '••••••'}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <Button
                                      onClick={() => toggleOtpVisibility(auction.id)}
                                      variant="ghost"
                                      className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-2 py-1 h-auto"
                                    >
                                      {isOtpVisible ? 'Hide' : 'Show'}
                                    </Button>
                                    <Button
                                      onClick={() => handleCopyOtp(auction.id, otpCode)}
                                      variant="ghost"
                                      className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-2 py-1 h-auto flex items-center gap-1"
                                    >
                                      {isOtpCopied ? (
                                        <Check size={13} className="text-emerald-500" />
                                      ) : (
                                        <Copy size={13} />
                                      )}
                                      {isOtpCopied ? 'Copied!' : 'Copy'}
                                    </Button>
                                  </div>

                                  <div className="text-[10px] text-[#A0A0B0]">
                                    Attempts remaining: {Math.max(0, attemptsRemaining)}
                                  </div>
                                  {attempts >= maxAttempts && (
                                    <div className="text-[10px] text-amber-600 flex items-center gap-1">
                                      <AlertTriangle size={12} />
                                      Max attempts reached. You can override if needed.
                                      <Button
                                        onClick={async () => {
                                          if (window.confirm('Override completion? This will mark the transaction as complete.')) {
                                            setActionLoading(auction.id);
                                            try {
                                              await api.patch(`/auctions/${auction.id}/override-complete`);
                                              setSuccessMessage('Transaction completed via override!');
                                              await fetchWonAuctions();
                                            } catch (err) {
                                              setError('Failed to override: ' + (err.response?.data?.detail || err.message));
                                            } finally {
                                              setActionLoading(null);
                                            }
                                          }
                                        }}
                                        disabled={isActionLoading}
                                        className="text-amber-600 hover:text-amber-700 text-xs underline"
                                      >
                                        {isActionLoading ? <Loader2 size={12} className="animate-spin" /> : 'Override'}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
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
                              Completed via override
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
            <span className="text-[#FFBE91]">🏆</span>
            Won auctions require delivery method selection · Keep your OTP code safe for handoff
          </span>
        </motion.div>
      </div>
    </div>
  );
};

// Trophy icon (since it's not imported from lucide-react)
const Trophy = ({ size = 20, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export default MyWonAuctions;