import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import ModernNavbar from "../../components/ui/Navbar";
import { 
  ArrowLeft, 
  Gavel, 
  Package, 
  Clock, 
  AlertCircle,
  TrendingUp,
  IndianRupee,
  ChevronRight,
  Loader2,
  Sparkles,
  Store,
  Users,
  Trophy,
  Search,
  History,
  Zap
} from 'lucide-react';
import api from '../../api/client';

const BuyerAuctionDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active_auctions: 0,
    my_bids: 0,
    won_auctions: 0,
    total_bids: 0
  });
  const [recentAuctions, setRecentAuctions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuctionData();
  }, []);

  const fetchAuctionData = async () => {
    setLoading(true);
    setError('');
    try {
      const auctionsResponse = await api.get('/auctions?status=active');
      const auctions = auctionsResponse.data || [];
      
      let myBids = [];
      let wonAuctions = [];
      try {
        const bidsResponse = await api.get('/bids/auction-bids');
        myBids = bidsResponse.data || [];
        wonAuctions = myBids.filter(b => b.status === 'selected');
      } catch (err) {
        // no bids yet
      }
      
      setStats({
        active_auctions: auctions.length,
        my_bids: myBids.length,
        won_auctions: wonAuctions.length,
        total_bids: myBids.reduce((sum, b) => sum + (b.bid_count || 0), 0)
      });
      
      const sorted = [...auctions].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setRecentAuctions(sorted.slice(0, 6));
      
    } catch (err) {
      setError('Failed to load auction data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  /* ---------- Stat tiles ---------- */
  const statCards = [
    { 
      key: 'active', 
      label: 'Live', 
      value: stats.active_auctions, 
      icon: Gavel,
      tint: 'text-emerald-600',
      bg: 'bg-emerald-100'
    },
    { 
      key: 'bids', 
      label: 'My Bids', 
      value: stats.my_bids, 
      icon: TrendingUp,
      tint: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    { 
      key: 'won', 
      label: 'Won', 
      value: stats.won_auctions, 
      icon: Trophy,
      tint: 'text-[#B8860B]',
      bg: 'bg-[#FFBE91]/30'
    },
    { 
      key: 'total_bids', 
      label: 'Bids Placed', 
      value: stats.total_bids, 
      icon: Users,
      tint: 'text-violet-600',
      bg: 'bg-violet-100'
    },
  ];

  /* ---------- Nav items ---------- */
  const navItems = [
    {
      id: 'browse',
      label: 'Browse Auctions',
      icon: Search,
      path: '/buyer/auctions/browse',
      description: 'Discover items to bid on',
      primary: true
    },
    {
      id: 'my_bids',
      label: 'My Bids',
      icon: TrendingUp,
      path: '/buyer/my-bids',
      description: 'Active auctions you bid on'
    },
    {
      id: 'won',
      label: 'Won Auctions',
      icon: Trophy,
      path: '/buyer/my-won-auctions',
      description: 'Won items + delivery'
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      path: '/buyer/auction-history',
      description: 'Complete audit log'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  /* ---------- Time left ---------- */
  const getTimeLeft = (endTime) => {
    if (!endTime) return { text: 'Ended', urgent: false };
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff < 0) return { text: 'Ended', urgent: false };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    const urgent = days === 0 && hours < 6;
    
    if (days > 0) return { text: `${days}d ${hours}h`, urgent };
    if (hours > 0) return { text: `${hours}h ${minutes}m`, urgent };
    return { text: `${minutes}m`, urgent: true };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin text-[#1A1A2E]" />
          <p className="text-[11px] text-[#A0A0B0]">Loading auctions…</p>
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
        logoutButton={{ label: "Logout", icon: "LogOut", onClick: handleLogout }}
        profileButton={{ label: "Profile", path: "/buyer/profile", icon: "User" }}
      />

      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate('/buyer/dashboard')}
          className="flex items-center gap-1.5 mb-3 -ml-1 px-2 py-1.5 text-[11px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors rounded-lg hover:bg-[#F5F3EF]"
        >
          <ArrowLeft size={12} />
          Back to dashboard
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
                <Gavel size={14} className="flex-shrink-0" />
                <span className="truncate">Auction Dashboard</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="text-[10px] text-[#1A1A2E]/70 mt-0.5 truncate"
              >
                {stats.active_auctions} live auctions · {stats.my_bids} bids placed
              </motion.p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/buyer/auctions/browse')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A2E] text-white text-[11px] font-medium rounded-full flex-shrink-0 mt-0.5 hover:bg-[#2A2A3E] transition-colors"
            >
              <Search size={11} />
              Browse
            </motion.button>
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-4 gap-2 sm:gap-3 mb-4"
        >
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.key}
                variants={itemVariants}
                className="bg-white/70 backdrop-blur-xl rounded-xl p-2.5 sm:p-3.5"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-1.5 sm:gap-0 mb-1">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={12} className={stat.tint} />
                  </div>
                  <span className={`text-base sm:text-lg font-bold leading-none ${stat.tint}`}>
                    {stat.value}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] font-medium text-[#1A1A2E] truncate">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-5"
        >
          <div className="flex items-center gap-1.5 mb-2.5 px-1">
            <span className="text-[10px] font-semibold text-[#A0A0B0] uppercase tracking-[0.08em]">
              Manage
            </span>
            <div className="flex-1 h-px bg-[#EEECE6]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {navItems.filter(i => !i.primary).map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  variants={itemVariants}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(item.path)}
                  className="bg-white/70 backdrop-blur-xl rounded-xl p-3 flex items-center gap-3 text-left transition-all hover:bg-white/90 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#F8F6F0] flex items-center justify-center text-[#1A1A2E] flex-shrink-0 group-hover:bg-[#FFBE91]/20 transition-colors">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] sm:text-[13px] font-medium text-[#1A1A2E] truncate">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-[#A0A0B0] truncate">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-[#A0A0B0] flex-shrink-0 group-hover:text-[#1A1A2E] group-hover:translate-x-0.5 transition-all" />
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Live Auctions */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-[#A0A0B0] uppercase tracking-[0.08em]">
                Live Auctions
              </span>
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <button
              onClick={() => navigate('/buyer/auctions/browse')}
              className="text-[10px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors flex items-center gap-0.5"
            >
              View all
              <ChevronRight size={11} />
            </button>
          </div>

          {recentAuctions.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#F8F6F0] flex items-center justify-center mx-auto mb-3">
                <Gavel size={20} className="text-[#A0A0B0]" />
              </div>
              <h3 className="text-[12px] font-medium text-[#1A1A2E]">No live auctions</h3>
              <p className="text-[10px] text-[#A0A0B0] mt-0.5">Check back soon for new items</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3">
              {recentAuctions.map((auction, index) => {
                const firstImage = auction.image_urls && auction.image_urls.length > 0 
                  ? auction.image_urls[0] 
                  : null;
                const timeLeft = getTimeLeft(auction.end_time);
                const currentPrice = auction.current_highest_bid || auction.starting_price;
                
                return (
                  <motion.div
                    key={auction.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index, duration: 0.3 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/buyer/auctions/${auction.id}`)}
                    className="group bg-white/70 backdrop-blur-xl rounded-2xl overflow-hidden cursor-pointer transition-all hover:bg-white/90"
                  >
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={auction.item_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#F8F6F0] flex items-center justify-center">
                          <Package size={24} className="text-[#A0A0B0]" />
                        </div>
                      )}
                      
                      {/* Time badge overlay */}
                      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-semibold backdrop-blur-md ${
                        timeLeft.urgent 
                          ? 'bg-rose-500/90 text-white' 
                          : 'bg-black/50 text-white'
                      }`}>
                        {timeLeft.urgent ? <Zap size={8} className="inline mr-0.5 -mt-0.5" /> : <Clock size={8} className="inline mr-0.5 -mt-0.5" />}
                        {timeLeft.text}
                      </div>

                      {/* Bid count overlay */}
                      {auction.bid_count > 0 && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-medium bg-black/50 text-white backdrop-blur-md">
                          {auction.bid_count} {auction.bid_count === 1 ? 'bid' : 'bids'}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2.5 sm:p-3">
                      <h4 className="text-[11px] sm:text-[12px] font-semibold text-[#1A1A2E] truncate leading-tight">
                        {auction.item_name}
                      </h4>
                      <div className="flex items-center gap-0.5 mt-1">
                        <IndianRupee size={10} className="text-[#FFBE91]" />
                        <span className="text-[12px] sm:text-[13px] font-bold text-[#1A1A2E]">
                          {currentPrice?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[9px] text-[#A0A0B0] mt-0.5 truncate">
                        {auction.category || 'General'}
                      </p>
                    </div>
                  </motion.div>
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
          className="mt-5 text-center"
        >
          <p className="text-[9px] text-[#A0A0B0] flex items-center justify-center gap-1">
            <Sparkles size={9} className="text-[#FFBE91]" />
            Highest bid wins · Auctions auto-close at end time
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default BuyerAuctionDashboard;