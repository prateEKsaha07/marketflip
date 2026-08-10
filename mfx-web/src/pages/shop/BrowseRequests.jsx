import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  DollarSign, 
  MapPin, 
  Calendar, 
  Tag, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api from '../../api/client';

const BrowseRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myBids, setMyBids] = useState([]);
  const [filters, setFilters] = useState({
    pincode: '',
    category: '',
    status: 'open'
  });
  const [activeFilters, setActiveFilters] = useState({
    pincode: '',
    category: '',
    status: 'open'
  });
  const [bidding, setBidding] = useState({
    requestId: null,
    price: '',
    note: '',
    loading: false,
    pricePercent: 50
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedBid, setExpandedBid] = useState(null);
  const sliderRef = useRef(null);

  useEffect(() => {
    fetchMyBids();
    fetchRequests();
  }, [activeFilters]);

  const fetchMyBids = async () => {
    try {
      const response = await api.get('/bids');
      setMyBids(response.data);
    } catch (err) {
      console.error('Failed to fetch my bids:', err);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('status', activeFilters.status || 'open');
      if (activeFilters.pincode) params.append('pincode', activeFilters.pincode);
      if (activeFilters.category) params.append('category', activeFilters.category);
      
      const response = await api.get(`/requests?${params.toString()}`);
      setRequests(response.data);
    } catch (err) {
      setError('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setActiveFilters({ ...filters });
    setShowFilters(false);
  };

  const handlePriceChange = (e, req) => {
    const percent = parseInt(e.target.value);
    const priceRange = req.budget_max - req.budget_min;
    const price = Math.round(req.budget_min + (priceRange * percent / 100));
    
    setBidding({
      ...bidding,
      requestId: req.id,
      price: price,
      pricePercent: percent
    });
  };

  const handleBidInputChange = (e, req) => {
    const value = parseInt(e.target.value);
    if (isNaN(value)) {
      setBidding({
        ...bidding,
        requestId: req.id,
        price: req.budget_min,
        pricePercent: 0
      });
      return;
    }
    const clampedValue = Math.min(Math.max(value, req.budget_min), req.budget_max);
    const priceRange = req.budget_max - req.budget_min;
    const percent = priceRange === 0 ? 50 : Math.round(((clampedValue - req.budget_min) / priceRange) * 100);
    
    setBidding({
      ...bidding,
      requestId: req.id,
      price: clampedValue,
      pricePercent: Math.min(Math.max(percent, 0), 100)
    });
  };

  const handleNoteChange = (e, requestId) => {
    setBidding({
      ...bidding,
      requestId: requestId,
      note: e.target.value
    });
  };

  const handleSubmitBid = async (requestId) => {
    if (!bidding.price || parseInt(bidding.price) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setBidding({ ...bidding, loading: true });
    
    try {
      const payload = {
        price: parseInt(bidding.price),
        note: bidding.note || ''
      };
      
      await api.post(`/requests/${requestId}/bids`, payload);
      alert('Bid placed successfully!');
      
      setBidding({
        requestId: null,
        price: '',
        note: '',
        loading: false,
        pricePercent: 50
      });
      setExpandedBid(null);
      
      await fetchMyBids();
      await fetchRequests();
      
    } catch (err) {
      alert('Failed to place bid: ' + (err.response?.data?.detail || 'Unknown error'));
      setBidding({ ...bidding, loading: false });
    }
  };

  const toggleBidForm = (requestId) => {
    if (expandedBid === requestId) {
      setExpandedBid(null);
      setBidding({
        requestId: null,
        price: '',
        note: '',
        loading: false,
        pricePercent: 50
      });
    } else {
      const req = requests.find(r => r.id === requestId);
      setExpandedBid(requestId);
      setBidding({
        ...bidding,
        requestId: requestId,
        price: req?.budget_min || 0,
        pricePercent: 0,
        note: ''
      });
    }
  };

  const hasPendingBid = (requestId) => {
    return myBids.some(bid => 
      bid.request_id === requestId && bid.status === 'pending'
    );
  };

  const getMyBidStatus = (requestId) => {
    const bid = myBids.find(b => b.request_id === requestId);
    return bid ? bid.status : null;
  };

  const clearFilters = () => {
    setFilters({
      pincode: '',
      category: '',
      status: 'open'
    });
    setActiveFilters({
      pincode: '',
      category: '',
      status: 'open'
    });
    setShowFilters(false);
  };

  const getPriceColor = (price, min, max) => {
    const range = max - min;
    if (range === 0) return 'text-emerald-600';
    const percent = ((price - min) / range) * 100;
    if (percent <= 33) return 'text-emerald-600';
    if (percent <= 66) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getPriceBadge = (price, min, max) => {
    const range = max - min;
    if (range === 0) return 'Good Deal';
    const percent = ((price - min) / range) * 100;
    if (percent <= 33) return 'Good Deal';
    if (percent <= 66) return 'Fair Price';
    return 'Premium';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-wrap justify-between items-center gap-3 mb-6"
        >
          <div>
            <h1 className="text-lg font-semibold text-[#1A1A2E] tracking-tight flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#1A1A2E]/5 flex items-center justify-center">
                <Search size={14} className="text-[#1A1A2E]" />
              </span>
              Browse Requests
            </h1>
            <p className="text-xs text-[#A0A0B0] mt-0.5">{requests.length} requests found</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
            >
              <Filter size={13} className="mr-1.5" />
              Filters
              {(filters.pincode || filters.category) && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A2E] ml-1" />
              )}
            </Button>
            <Button 
              onClick={() => navigate('/shop/dashboard')}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
            >
              <ArrowLeft size={13} className="mr-1.5" />
              Dashboard
            </Button>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-sm border border-[#EEECE6]">
                <div className="flex flex-wrap gap-3 items-end">
                  <div>
                    <label className="block text-[10px] font-medium text-[#A0A0B0] mb-1">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={filters.pincode}
                      onChange={handleFilterChange}
                      placeholder="110001"
                      maxLength="6"
                      className="w-28 px-3 py-1.5 text-xs bg-[#F8F6F0] border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-[#A0A0B0] mb-1">Category</label>
                    <select
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      className="w-32 px-3 py-1.5 text-xs bg-[#F8F6F0] border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/10 transition-all appearance-none"
                    >
                      <option value="">All</option>
                      <option value="electronics">Electronics</option>
                      <option value="clothing">Clothing</option>
                      <option value="furniture">Furniture</option>
                      <option value="books">Books</option>
                      <option value="vehicles">Vehicles</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-[#A0A0B0] mb-1">Status</label>
                    <select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="w-24 px-3 py-1.5 text-xs bg-[#F8F6F0] border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/10 transition-all appearance-none"
                    >
                      <option value="open">Open</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={applyFilters}
                      className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto"
                    >
                      Apply
                    </Button>
                    <Button 
                      onClick={clearFilters}
                      variant="ghost"
                      className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-1.5 h-auto"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="bg-rose-50/80 backdrop-blur-sm rounded-lg p-3 mb-4 text-rose-700 text-xs flex items-center gap-2 border border-rose-100">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
        
        {/* Requests List */}
        {requests.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-8 text-center shadow-sm border border-[#EEECE6]"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F5F3EF] flex items-center justify-center mx-auto mb-3">
              <Search size={20} className="text-[#A0A0B0]" />
            </div>
            <h3 className="text-sm font-medium text-[#1A1A2E]">No requests found</h3>
            <p className="text-xs text-[#A0A0B0] mt-1">Try adjusting your filters</p>
            <Button 
              onClick={clearFilters}
              className="mt-3 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto"
            >
              Clear Filters
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {requests.map((req) => {
              const hasBid = hasPendingBid(req.id);
              const bidStatus = getMyBidStatus(req.id);
              const isOpen = req.status === 'open';
              const isPurchased = req.status === 'purchased';
              const isCompleted = req.status === 'completed';
              const isExpanded = expandedBid === req.id;
              const isBidding = bidding.requestId === req.id;
              
              return (
                <motion.div
                  key={req.id}
                  variants={itemVariants}
                  className={`
                    bg-white/80 backdrop-blur-xl rounded-xl shadow-sm border border-[#EEECE6]
                    transition-all duration-300 overflow-hidden
                    ${hasBid ? 'border-l-3 border-l-amber-500' : ''}
                    ${isExpanded ? 'ring-2 ring-[#1A1A2E]/5 shadow-md' : ''}
                  `}
                >
                  {/* Request Header - Always Visible */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-[#F8F6F0]/50 transition-colors"
                    onClick={() => isOpen && !hasBid && toggleBidForm(req.id)}
                  >
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-[#1A1A2E]">
                            {req.item_name}
                          </h3>
                          {isOpen && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600">
                              <Clock size={10} />
                              Open
                            </span>
                          )}
                          {isPurchased && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600">
                              <CheckCircle size={10} />
                              Purchased
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/10 text-violet-600">
                              <CheckCircle size={10} />
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#A0A0B0] line-clamp-1">
                          {req.description || 'No description'}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#A0A0B0]">
                          <span className="flex items-center gap-1 font-medium text-[#1A1A2E]">
                            <DollarSign size={12} />
                            ₹{req.budget_min.toLocaleString()} - ₹{req.budget_max.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={11} />
                            {req.pincode}
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag size={11} />
                            {req.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {isOpen && !hasBid && (
                        <div className="flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#A0A0B0] hover:text-[#1A1A2E] p-1 h-auto"
                            onClick={(e) => { e.stopPropagation(); toggleBidForm(req.id); }}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Messages */}
                  {isPurchased && (
                    <div className="px-4 pb-3">
                      <div className="p-2.5 bg-amber-50/80 rounded-lg border border-amber-100">
                        <p className="text-xs text-amber-700 flex items-center gap-1.5">
                          <Lock size={12} />
                          This request has been purchased
                        </p>
                      </div>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="px-4 pb-3">
                      <div className="p-2.5 bg-violet-50/80 rounded-lg border border-violet-100">
                        <p className="text-xs text-violet-700 flex items-center gap-1.5">
                          <CheckCircle size={12} />
                          Transaction completed
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Bid Form - Expandable */}
                  {isOpen && !hasBid && isExpanded && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-[#EEECE6]">
                          <div className="p-3 bg-[#F8F6F0] rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                              {/* Price Slider */}
                              <div className="md:col-span-2">
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[10px] font-medium text-[#A0A0B0]">Your Bid Price</label>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-semibold ${getPriceColor(
                                      isBidding ? parseInt(bidding.price) : req.budget_min,
                                      req.budget_min,
                                      req.budget_max
                                    )}`}>
                                      ₹{isBidding ? parseInt(bidding.price).toLocaleString() : req.budget_min.toLocaleString()}
                                    </span>
                                    {isBidding && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/80 text-[#A0A0B0] border border-[#EEECE6]">
                                        {getPriceBadge(
                                          parseInt(bidding.price),
                                          req.budget_min,
                                          req.budget_max
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={isBidding ? bidding.pricePercent : 0}
                                  onChange={(e) => handlePriceChange(e, req)}
                                  className="w-full h-1.5 bg-[#EEECE6] rounded-full appearance-none cursor-pointer accent-[#1A1A2E] transition-all"
                                  style={{
                                    background: `linear-gradient(to right, #1A1A2E 0%, #1A1A2E ${isBidding ? bidding.pricePercent : 0}%, #EEECE6 ${isBidding ? bidding.pricePercent : 0}%, #EEECE6 100%)`
                                  }}
                                />
                                <div className="flex justify-between text-[9px] text-[#A0A0B0] mt-0.5">
                                  <span>₹{req.budget_min.toLocaleString()}</span>
                                  <span>₹{req.budget_max.toLocaleString()}</span>
                                </div>
                                {isBidding && (
                                  <div className="mt-1.5 flex items-center gap-2">
                                    <span className="text-[10px] text-[#A0A0B0]">Exact price:</span>
                                    <input
                                      type="number"
                                      value={bidding.price}
                                      onChange={(e) => handleBidInputChange(e, req)}
                                      className="w-28 px-2 py-0.5 text-xs bg-white border border-[#EEECE6] rounded focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/10 transition-all"
                                    />
                                    <span className="text-[10px] text-[#A0A0B0]">
                                      {bidding.pricePercent}% of budget
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Note */}
                              <div>
                                <label className="block text-[10px] font-medium text-[#A0A0B0] mb-1">Note (optional)</label>
                                <input
                                  type="text"
                                  name="note"
                                  value={isBidding ? bidding.note : ''}
                                  onChange={(e) => handleNoteChange(e, req.id)}
                                  placeholder="Add a note..."
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#EEECE6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/10 transition-all"
                                />
                              </div>

                              {/* Bid Button */}
                              <div className="md:col-span-3 flex justify-end">
                                <Button
                                  onClick={() => handleSubmitBid(req.id)}
                                  disabled={bidding.loading}
                                  className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-6 py-1.5 h-auto"
                                >
                                  {bidding.loading ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    'Place Bid'
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}

                  {/* Already Bid */}
                  {hasBid && (
                    <div className="px-4 pb-3">
                      <div className="flex items-center justify-between p-2.5 bg-amber-50/80 rounded-lg border border-amber-100">
                        <p className="text-xs text-amber-700 flex items-center gap-1.5">
                          <CheckCircle size={12} />
                          You already have a <strong>{bidStatus}</strong> bid on this request
                        </p>
                        <Button
                          onClick={() => navigate('/shop/my-bids')}
                          variant="ghost"
                          className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-100/50 px-3 py-1 h-auto"
                        >
                          View My Bids
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BrowseRequests;