import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Gavel, 
  Package, 
  Clock, 
  MapPin, 
  DollarSign,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Sparkles,
  Eye,
  Flag
} from 'lucide-react';
import api from '../../api/client';
import ReportModal from '../../components/ReportModal';

const BrowseAuctions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    pincode: '',
    category: '',
    status: 'active'
  });
  const [activeFilters, setActiveFilters] = useState({
    pincode: '',
    category: '',
    status: 'active'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('ending_soon');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  const sortOptions = [
    { value: 'ending_soon', label: 'Ending Soon' },
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'most_bids', label: 'Most Bids' },
  ];

  useEffect(() => {
    fetchAuctions();
  }, [activeFilters, sortBy]);

  const fetchAuctions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('status', activeFilters.status || 'active');
      params.append('sort', sortBy);
      if (activeFilters.pincode) params.append('pincode', activeFilters.pincode);
      if (activeFilters.category) params.append('category', activeFilters.category);
      
      const response = await api.get(`/auctions?${params.toString()}`);
      setAuctions(response.data || []);
    } catch (err) {
      console.error('Fetch auctions error:', err);
      setError('Failed to load auctions');
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

  const clearFilters = () => {
    setFilters({
      pincode: '',
      category: '',
      status: 'active'
    });
    setActiveFilters({
      pincode: '',
      category: '',
      status: 'active'
    });
    setSortBy('ending_soon');
    setShowFilters(false);
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
    
    if (days > 0) return `${days}d ${hours}h`;
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

  const handleReport = (auction, e) => {
    e.stopPropagation();
    setReportTarget(auction);
    setShowReportModal(true);
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
          <Loader2 size={24} className="animate-spin text-[#1A1A2E]" />
          <p className="text-xs text-[#A0A0B0]">Loading auctions...</p>
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
                <Gavel size={20} className="text-[#FFBE91]" />
                Browse Auctions
              </h1>
              <p className="text-xs text-[#A0A0B0] mt-0.5">
                {auctions.length} active auctions found
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white/80 border border-[#EEECE6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/20 appearance-none pr-8"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A0A0B0] pointer-events-none" />
            </div>

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
              onClick={() => navigate('/buyer/dashboard')}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
            >
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
                      <option value="furniture">Furniture</option>
                      <option value="clothing">Clothing</option>
                      <option value="books">Books</option>
                      <option value="home_kitchen">Home & Kitchen</option>
                      <option value="vehicles">Vehicles</option>
                      <option value="other">Other</option>
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
        
        {/* Auctions Grid */}
        {auctions.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-8 text-center shadow-sm border border-[#EEECE6]"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F5F3EF] flex items-center justify-center mx-auto mb-3">
              <Gavel size={20} className="text-[#A0A0B0]" />
            </div>
            <h3 className="text-sm font-medium text-[#1A1A2E]">No auctions found</h3>
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {auctions.map((auction) => {
              const firstImage = auction.image_urls && auction.image_urls.length > 0 
                ? auction.image_urls[0] 
                : null;
              const timeLeft = getTimeLeft(auction.end_time);
              const endingSoon = isEndingSoon(auction.end_time);
              const isActive = auction.status === 'active';
              const currentPrice = auction.current_highest_bid || auction.starting_price;
              
              return (
                <motion.div
                  key={auction.id}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  className="group bg-white rounded-xl border border-[#EEECE6] overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/buyer/auctions/${auction.id}`)}
                >
                  {/* Image */}
                  <div className="relative">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={auction.item_name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-[#F8F6F0] flex items-center justify-center">
                        <Package size={32} className="text-[#A0A0B0]" />
                      </div>
                    )}
                    {isActive && endingSoon && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-rose-500 text-white text-[10px] font-medium rounded-full">
                        Ending Soon!
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] font-medium rounded-full flex items-center gap-1">
                        <Clock size={10} />
                        {timeLeft}
                      </div>
                    )}
                    {/* Report Button */}
                    <button
                      onClick={(e) => handleReport(auction, e)}
                      className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/40 text-white/70 hover:bg-black/60 hover:text-white transition-colors"
                      title="Report"
                    >
                      <Flag size={14} />
                    </button>
                  </div>

                  <div className="p-3">
                    <h3 className="text-sm font-medium text-[#1A1A2E] truncate">
                      {auction.item_name}
                    </h3>
                    {auction.description && (
                      <p className="text-xs text-[#A0A0B0] line-clamp-1 mt-0.5">
                        {auction.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <p className="text-[10px] text-[#A0A0B0]">Current Bid</p>
                        <p className="text-sm font-bold text-[#1A1A2E]">
                          ₹{currentPrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#A0A0B0]">Bids</p>
                        <p className="text-xs font-medium text-[#1A1A2E]">
                          {auction.bid_count || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#EEECE6]">
                      <div className="flex items-center gap-1 text-[10px] text-[#A0A0B0]">
                        <MapPin size={10} />
                        {auction.pincode}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#FFBE91] hover:text-[#FFA87A] text-xs px-2 py-0.5 h-auto group-hover:translate-x-0.5 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/buyer/auctions/${auction.id}`);
                        }}
                      >
                        Bid Now →
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportTarget(null);
        }}
        targetType="auction"
        targetId={reportTarget?.id}
        targetName={reportTarget?.item_name}
        onSuccess={() => {
          // Refresh auctions to hide flagged item
          fetchAuctions();
        }}
      />
    </div>
  );
};

export default BrowseAuctions;