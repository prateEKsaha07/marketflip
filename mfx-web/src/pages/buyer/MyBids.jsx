import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import ModernNavbar from "../../components/ui/Navbar";
import { 
  ArrowLeft, 
  Gavel, 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle,
  Search,
  Eye,
  ChevronRight,
  Loader2,
  TrendingUp,
  MapPin,
  Store,
  Award,
  RefreshCw,
  IndianRupee,
  X,
  Crown,
  Sparkles
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
      const response = await api.get('/auctions?status=all');
      const allAuctions = response.data || [];

      const bidsResponse = await api.get('/bids/auction-bids');
      const userBids = bidsResponse.data || [];

      const auctionIdsWithBids = new Set(userBids.map(b => b.auction_id));

      let myBidAuctions = allAuctions.filter(a => auctionIdsWithBids.has(a.id));

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
        else if (isSold && isWinner) statusLabel = 'Won — Awaiting Delivery';
        else if (isSold && !isWinner) statusLabel = 'Sold — Not Won';
        else if (isExpired && isWinner) statusLabel = 'Won — Expired';
        else if (isExpired && !isWinner) statusLabel = 'Expired';
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
      setError('Failed to load your bids: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (bid) => {
    if (bid.auction_status === 'active') {
      return { cls: 'bg-emerald-50 text-emerald-700', label: 'Bidding', icon: Clock };
    }
    if (bid.auction_status === 'sold' && bid.is_winner) {
      return { cls: 'bg-blue-50 text-blue-700', label: 'Won', icon: Award };
    }
    if (bid.auction_status === 'sold' && !bid.is_winner) {
      return { cls: 'bg-[#F8F6F0] text-[#4A4A5A]', label: 'Lost', icon: XCircle };
    }
    if (bid.auction_status === 'completed' && bid.is_winner) {
      return { cls: 'bg-emerald-50 text-emerald-700', label: 'Completed', icon: CheckCircle };
    }
    if (bid.auction_status === 'expired') {
      return { cls: 'bg-rose-50 text-rose-700', label: 'Expired', icon: XCircle };
    }
    if (bid.auction_status === 'cancelled') {
      return { cls: 'bg-[#F8F6F0] text-[#4A4A5A]', label: 'Cancelled', icon: AlertCircle };
    }
    return { cls: 'bg-[#F8F6F0] text-[#4A4A5A]', label: bid.auction_status, icon: AlertCircle };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  };

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
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin text-[#1A1A2E]" />
          <p className="text-[11px] text-[#A0A0B0]">Loading your bids…</p>
        </div>
      </div>
    );
  }

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

      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate('/buyer/auctions')}
          className="flex items-center gap-1.5 mb-3 -ml-1 px-2 py-1.5 text-[11px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors rounded-lg hover:bg-[#F5F3EF]"
        >
          <ArrowLeft size={12} />
          Back to auctions
        </motion.button>

        {/* Animated Hero */}
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
              <motion.h1
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.35 }}
                className="text-base sm:text-[15px] font-bold text-[#1A1A2E] flex items-center gap-2"
              >
                <TrendingUp size={14} className="flex-shrink-0" />
                <span className="truncate">My Bids</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="text-[10px] text-[#1A1A2E]/70 mt-0.5 truncate"
              >
                {counts.all} total · {counts.active} bidding · {counts.won} won
              </motion.p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={fetchMyBids}
                className="p-1.5 rounded-lg bg-white/40 backdrop-blur-sm hover:bg-white/60 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={12} className="text-[#1A1A2E]" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/buyer/auctions/browse')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A2E] text-white text-[11px] font-medium rounded-full hover:bg-[#2A2A3E] transition-colors"
              >
                <Store size={11} />
                Browse
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="p-3 bg-rose-50 rounded-2xl flex items-start gap-2 overflow-hidden"
            >
              <AlertCircle size={14} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-rose-600 flex-1">{error}</p>
              <button
                onClick={() => setError('')}
                className="text-rose-500 hover:text-rose-700 flex-shrink-0"
              >
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status tabs */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-1 p-1 bg-white/70 backdrop-blur-xl rounded-2xl mb-3 overflow-x-auto"
        >
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium transition-all min-w-fit ${
                  active
                    ? 'bg-[#1A1A2E] text-white'
                    : 'text-[#A0A0B0] hover:text-[#4A4A5A] hover:bg-[#F8F6F0]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                  active ? 'bg-white/20 text-white' : 'bg-[#F8F6F0] text-[#A0A0B0]'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2 mb-4"
        >
          <div className="flex-1 relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
            <input
              type="text"
              placeholder="Search your bids…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-[11px] bg-white/70 backdrop-blur-xl border-0 rounded-full text-[#1A1A2E] placeholder-[#A0A0B0] focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/40 transition-all"
            />
          </div>
          {(searchQuery || statusFilter !== 'all') && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-[10px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors px-2 whitespace-nowrap"
            >
              Clear
            </motion.button>
          )}
        </motion.div>

        {/* Bids list */}
        {filteredBids.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#F8F6F0] flex items-center justify-center mx-auto mb-3">
              <Gavel size={20} className="text-[#A0A0B0]" />
            </div>
            <h3 className="text-[12px] font-medium text-[#1A1A2E]">No bids found</h3>
            <p className="text-[10px] text-[#A0A0B0] mt-0.5">
              {statusFilter === 'all'
                ? "You haven't placed any bids yet"
                : `No ${statusFilter} bids`}
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/buyer/auctions/browse')}
              className="mt-3 inline-flex items-center gap-1.5 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[11px] font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <Store size={11} />
              Browse Auctions
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2.5"
          >
            {filteredBids.map((bid) => {
              const status = getStatusBadge(bid);
              const StatusIcon = status.icon;
              const firstImage = bid.image_urls && bid.image_urls.length > 0 ? bid.image_urls[0] : null;
              const isWon = bid.is_winner && ['sold', 'completed'].includes(bid.auction_status);
              const isActive = bid.auction_status === 'active';
              const isOutbid = isActive && !bid.is_winner;

              return (
                <motion.div
                  key={bid.id}
                  variants={itemVariants}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => {
                    if (isWon && bid.auction_status === 'sold') {
                      navigate('/buyer/my-won-auctions');
                    } else {
                      navigate(`/buyer/auctions/${bid.id}`);
                    }
                  }}
                  className={`bg-white/70 backdrop-blur-xl rounded-2xl p-3 sm:p-4 transition-all cursor-pointer group ${
                    isWon ? 'ring-1 ring-emerald-100' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Image */}
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={bid.item_name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#F8F6F0] flex items-center justify-center flex-shrink-0">
                        <Package size={20} className="text-[#A0A0B0]" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-[12px] sm:text-[13px] font-semibold text-[#1A1A2E] truncate">
                          {bid.item_name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${status.cls}`}>
                          <StatusIcon size={8} />
                          {status.label}
                        </span>
                        {isActive && bid.is_winner && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                            <Crown size={8} />
                            Winning
                          </span>
                        )}
                        {isOutbid && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-800">
                            Outbid
                          </span>
                        )}
                      </div>

                      {/* Bid info */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px]">
                        <span className="flex items-center gap-0.5 font-medium text-[#1A1A2E]">
                          <IndianRupee size={9} className="text-[#FFBE91]" />
                          Your bid: {bid.user_bid_amount?.toLocaleString('en-IN')}
                        </span>
                        <span className="flex items-center gap-0.5 text-[#4A4A5A]">
                          <IndianRupee size={9} />
                          Current: {(bid.current_highest_bid || bid.starting_price)?.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[9px] text-[#A0A0B0]">
                        <span className="flex items-center gap-0.5">
                          <Store size={9} />
                          {bid.shop_name || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <MapPin size={9} />
                          {bid.pincode}
                        </span>
                        {isActive && bid.end_time && (
                          <span className="flex items-center gap-0.5 text-emerald-600">
                            <Clock size={9} />
                            Ends {new Date(bid.end_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronRight size={14} className="text-[#A0A0B0] group-hover:translate-x-0.5 group-hover:text-[#1A1A2E] transition-all flex-shrink-0 mt-1" />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-5 text-center"
        >
          <p className="text-[9px] text-[#A0A0B0] flex items-center justify-center gap-1">
            <Sparkles size={9} className="text-[#FFBE91]" />
            All auctions you've bid on · Won auctions appear in "My Won Auctions"
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default BuyerMyBids;