import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Search,
  DollarSign,
  Eye,
  ChevronRight,
  Loader2,
  TrendingUp,
  MapPin,
  Store,
  Award,
  RefreshCw
} from 'lucide-react';
import api from '../../api/client';

const BuyerMyBids = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  const filteredBids = useMemo(() => {
    let filtered = [...bids];

    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(b => b.auction_status === 'active');
      } else if (statusFilter === 'won') {
        filtered = filtered.filter(b => b.is_winner === true);
      } else if (statusFilter === 'lost') {
        filtered = filtered.filter(b => b.is_winner === false && b.auction_status !== 'active');
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(b => 
        b.item_name.toLowerCase().includes(query) ||
        (b.description && b.description.toLowerCase().includes(query))
      );
    }

    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return filtered;
  }, [bids, statusFilter, searchQuery]);

  useEffect(() => {
    fetchMyBids();
  }, []);

  const fetchMyBids = async () => {
    setLoading(true);
    setError('');
    try {
      // Get all auctions
      const response = await api.get('/auctions?status=all');
      const allAuctions = response.data || [];
      
      // Get user's bids
      const bidsResponse = await api.get('/bids/auction-bids');
      const userBids = bidsResponse.data || [];
      
      // Get all auction IDs the user bid on
      const auctionIdsWithBids = new Set(userBids.map(b => b.auction_id));
      
      // Filter to only auctions the user bid on
      let myBidAuctions = allAuctions.filter(a => auctionIdsWithBids.has(a.id));
      
      // Enhance with bid info
      myBidAuctions = myBidAuctions.map(auction => {
        const userBid = userBids.find(b => b.auction_id === auction.id);
        const isWinner = auction.current_highest_bidder === user?.user_id;
        const isActive = auction.status === 'active';
        const isSold = auction.status === 'sold';
        const isCompleted = auction.status === 'completed';
        const isExpired = auction.status === 'expired';
        const isCancelled = auction.status === 'cancelled';
        
        let statusLabel = 'Bidding';
        if (isCompleted) statusLabel = 'Completed';
        else if (isSold && isWinner) statusLabel = 'Won - Awaiting Delivery';
        else if (isSold && !isWinner) statusLabel = 'Sold - Not Won';
        else if (isExpired && isWinner) statusLabel = 'Won - Expired';
        else if (isExpired && !isWinner) statusLabel = 'Expired - Not Won';
        else if (isCancelled) statusLabel = 'Cancelled';
        else if (isActive) statusLabel = 'Bidding';
        
        return {
          ...auction,
          user_bid_amount: userBid?.bid_amount || 0,
          is_winner: isWinner,
          status_label: statusLabel,
          auction_status: auction.status
        };
      });
      
      setBids(myBidAuctions);
    } catch (err) {
      console.error('Fetch bids error:', err);
      setError('Failed to load your bids: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (bid) => {
    if (bid.auction_status === 'active') {
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Bidding', icon: <Clock size={12} /> };
    }
    if (bid.auction_status === 'sold' && bid.is_winner) {
      return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Won! 🏆', icon: <Award size={12} /> };
    }
    if (bid.auction_status === 'sold' && !bid.is_winner) {
      return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Lost', icon: <XCircle size={12} /> };
    }
    if (bid.auction_status === 'completed' && bid.is_winner) {
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed ✅', icon: <CheckCircle size={12} /> };
    }
    if (bid.auction_status === 'expired') {
      return { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Expired', icon: <XCircle size={12} /> };
    }
    if (bid.auction_status === 'cancelled') {
      return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Cancelled', icon: <AlertCircle size={12} /> };
    }
    return { bg: 'bg-gray-100', text: 'text-gray-700', label: bid.auction_status, icon: <AlertCircle size={12} /> };
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

  // Counts for filter tabs
  const counts = {
    all: bids.length,
    active: bids.filter(b => b.auction_status === 'active').length,
    won: bids.filter(b => b.is_winner && b.auction_status !== 'completed').length,
    lost: bids.filter(b => !b.is_winner && b.auction_status !== 'active' && b.auction_status !== 'completed').length,
  };

  const statusTabs = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'active', label: 'Bidding', count: counts.active },
    { id: 'won', label: 'Won', count: counts.won },
    { id: 'lost', label: 'Lost', count: counts.lost },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#1A1A2E]" />
          <p className="text-xs text-[#A0A0B0]">Loading your bids...</p>
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
                <TrendingUp size={20} className="text-[#FFBE91]" />
                My Bids
              </h1>
              <p className="text-xs text-[#A0A0B0] mt-0.5">
                {bids.length} total bids · {counts.active} active
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/buyer/auctions/browse')}
            className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto flex items-center gap-1.5"
          >
            <Store size={14} />
            Browse Auctions
          </Button>
        </motion.div>

        {error && (
          <div className="bg-rose-50/80 backdrop-blur-sm rounded-lg p-3 mb-4 text-rose-700 text-xs flex items-center gap-2 border border-rose-100">
            <AlertCircle size={14} />
            {error}
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

        {/* Search */}
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
              placeholder="Search your bids..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white/80 border border-[#EEECE6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
            />
          </div>
          <Button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-2 h-auto"
          >
            Clear
          </Button>
          <Button
            onClick={fetchMyBids}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-2 h-auto"
          >
            <RefreshCw size={13} className="mr-1" />
            Refresh
          </Button>
        </motion.div>

        {/* Bids List */}
        {filteredBids.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-8 text-center shadow-sm border border-[#EEECE6]"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F5F3EF] flex items-center justify-center mx-auto mb-3">
              <Gavel size={20} className="text-[#A0A0B0]" />
            </div>
            <h3 className="text-sm font-medium text-[#1A1A2E]">No bids found</h3>
            <p className="text-xs text-[#A0A0B0] mt-1">
              {statusFilter === 'all' ? 'You haven\'t placed any bids yet' : `No ${statusFilter} bids`}
            </p>
            <Button 
              onClick={() => navigate('/buyer/auctions/browse')}
              className="mt-3 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto"
            >
              Browse Auctions
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredBids.map((bid) => {
              const status = getStatusBadge(bid);
              const firstImage = bid.image_urls && bid.image_urls.length > 0 
                ? bid.image_urls[0] 
                : null;
              const isWon = bid.is_winner && ['sold', 'completed'].includes(bid.auction_status);
              
              // Determine detail path
              let detailPath = `/buyer/auctions/${bid.id}`;
              if (isWon && bid.auction_status === 'sold') {
                detailPath = `/buyer/my-won-auctions`;
              }

              return (
                <motion.div
                  key={bid.id}
                  variants={itemVariants}
                  className={`bg-white/80 backdrop-blur-xl rounded-xl p-4 border ${
                    isWon ? 'border-emerald-200' : 'border-[#EEECE6]'
                  } hover:shadow-md transition-all group`}
                >
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Image */}
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={bid.item_name}
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
                          {bid.item_name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text}`}>
                          {status.icon}
                          {status.label}
                        </span>
                        {isWon && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
                            <Award size={12} />
                            Won!
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#A0A0B0]">
                        <span className="flex items-center gap-1">
                          <DollarSign size={11} />
                          Your Bid: ₹{bid.user_bid_amount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Gavel size={11} />
                          Current: ₹{bid.current_highest_bid || bid.starting_price}
                        </span>
                        <span className="flex items-center gap-1">
                          <Store size={11} />
                          {bid.shop_name || 'Unknown Shop'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />
                          {bid.pincode}
                        </span>
                      </div>

                      {bid.auction_status === 'active' && bid.end_time && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600">
                          <Clock size={10} />
                          Ends: {new Date(bid.end_time).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      <Button
                        onClick={() => {
                          if (isWon && bid.auction_status === 'sold') {
                            navigate('/buyer/my-won-auctions');
                          } else {
                            navigate(`/buyer/auctions/${bid.id}`);
                          }
                        }}
                        variant="ghost"
                        className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-1 h-auto"
                      >
                        <Eye size={13} className="mr-1" />
                        View
                      </Button>
                      {isWon && bid.auction_status === 'sold' && (
                        <Button
                          onClick={() => navigate('/buyer/my-won-auctions')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 h-auto"
                        >
                          <Award size={13} className="mr-1" />
                          Complete Delivery
                        </Button>
                      )}
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
            Shows all auctions you've bid on · Track your won auctions in "My Won Auctions"
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default BuyerMyBids;