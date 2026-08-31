import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Search,
  Filter,
  DollarSign,
  Eye,
  ChevronRight,
  Loader2,
  TrendingUp,
  Calendar,
  MapPin,
  Plus,
  Trash2
} from 'lucide-react';
import api from '../../api/client';

const MyAuctions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(null);

  // Filter auctions locally (only active auctions are fetched anyway)
  const filteredAuctions = useMemo(() => {
    let filtered = [...auctions];

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

    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return filtered;
  }, [auctions, searchQuery, categoryFilter]);

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    setLoading(true);
    setError('');
    try {
      // Only fetch active auctions
      const response = await api.get('/auctions?status=active');
      setAuctions(response.data || []);
    } catch (err) {
      console.error('Fetch auctions error:', err);
      setError('Failed to load auctions: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAuction = async (auctionId) => {
    if (!window.confirm('Are you sure you want to cancel this auction?')) return;
    
    setCancelling(auctionId);
    try {
      await api.delete(`/auctions/${auctionId}`);
      await fetchAuctions();
    } catch (err) {
      console.error('Cancel auction error:', err);
      alert('Failed to cancel auction: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setCancelling(null);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': 
        return { 
          bg: 'bg-emerald-100', 
          text: 'text-emerald-700', 
          label: 'Active', 
          icon: <CheckCircle size={12} />,
          dot: 'bg-emerald-500'
        };
      case 'sold': 
        return { 
          bg: 'bg-blue-100', 
          text: 'text-blue-700', 
          label: 'Sold', 
          icon: <Package size={12} />,
          dot: 'bg-blue-500'
        };
      case 'expired': 
        return { 
          bg: 'bg-rose-100', 
          text: 'text-rose-700', 
          label: 'Expired', 
          icon: <XCircle size={12} />,
          dot: 'bg-rose-500'
        };
      case 'cancelled': 
        return { 
          bg: 'bg-gray-100', 
          text: 'text-gray-700', 
          label: 'Cancelled', 
          icon: <AlertCircle size={12} />,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#1A1A2E]" />
          <p className="text-xs text-[#A0A0B0]">Loading your active auctions...</p>
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
                <Gavel size={20} className="text-[#FFBE91]" />
                Active Auctions
              </h1>
              <p className="text-xs text-[#A0A0B0] mt-0.5">
                {auctions.length} active auctions · Bidding in progress
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/shop/auctions/post')}
            className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto flex items-center gap-1.5"
          >
            <Plus size={14} />
            Create Auction
          </Button>
        </motion.div>

        {error && (
          <div className="bg-rose-50/80 backdrop-blur-sm rounded-lg p-3 mb-4 text-rose-700 text-xs flex items-center gap-2 border border-rose-100">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Search & Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-4"
        >
          <div className="flex-1 min-w-[150px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
            <input
              type="text"
              placeholder="Search active auctions..."
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
            }}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-2 h-auto"
          >
            Clear
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
              <Gavel size={20} className="text-[#A0A0B0]" />
            </div>
            <h3 className="text-sm font-medium text-[#1A1A2E]">No active auctions</h3>
            <p className="text-xs text-[#A0A0B0] mt-1">Create a new auction to get started</p>
            <Button 
              onClick={() => navigate('/shop/auctions/post')}
              className="mt-3 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto"
            >
              <Plus size={13} className="mr-1.5" />
              Create Auction
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredAuctions.map((auction) => {
              const status = getStatusBadge(auction.status);
              const firstImage = auction.image_urls && auction.image_urls.length > 0 
                ? auction.image_urls[0] 
                : null;
              const isCancelling = cancelling === auction.id;

              return (
                <motion.div
                  key={auction.id}
                  variants={itemVariants}
                  className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-[#EEECE6] hover:shadow-md transition-all group"
                >
                  <div className="flex flex-wrap items-center gap-4">
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
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#A0A0B0]">
                        <span className="flex items-center gap-1">
                          <DollarSign size={11} />
                          Starting: ₹{auction.starting_price.toLocaleString()}
                        </span>
                        {auction.current_highest_bid && (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <TrendingUp size={11} />
                            Current: ₹{auction.current_highest_bid.toLocaleString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Package size={11} />
                          {auction.bid_count || 0} bids
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />
                          {auction.pincode}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600">
                        <Clock size={10} />
                        Ends: {new Date(auction.end_time).toLocaleString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      <Button
                        onClick={() => navigate(`/shop/auctions/${auction.id}`)}
                        variant="ghost"
                        className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-1 h-auto"
                      >
                        <Eye size={13} className="mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleCancelAuction(auction.id)}
                        disabled={isCancelling}
                        variant="ghost"
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 text-xs px-3 py-1 h-auto"
                      >
                        {isCancelling ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} className="mr-1" />
                        )}
                        {isCancelling ? '' : 'Cancel'}
                      </Button>
                      <ChevronRight size={16} className="text-[#A0A0B0] group-hover:translate-x-1 transition-transform" />
                    </div>
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
            <span className="text-[#FFBE91]">⚡</span>
            Active auctions auto-close at end time · Highest bid wins
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default MyAuctions;