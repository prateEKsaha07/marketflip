import React, { useEffect, useState } from 'react';
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
  AlertCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  Eye,
  ChevronRight,
  Loader2,
  Sparkles,
  Store,
  Users,
  Award,
  Search,
  LogOut,
  Plus,
  Heart,
  History,
  Trophy
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
      // Get active auctions
      const auctionsResponse = await api.get('/auctions?status=active');
      const auctions = auctionsResponse.data || [];
      
      // Get user's bids
      let myBids = [];
      let wonAuctions = [];
      try {
        const bidsResponse = await api.get('/bids/auction-bids');
        myBids = bidsResponse.data || [];
        // Filter won auctions (bids that are selected/won)
        wonAuctions = myBids.filter(b => b.status === 'selected');
      } catch (err) {
        console.log('No bids yet');
      }
      
      setStats({
        active_auctions: auctions.length,
        my_bids: myBids.length,
        won_auctions: wonAuctions.length,
        total_bids: myBids.reduce((sum, b) => sum + (b.bid_count || 0), 0)
      });
      
      // Get recent auctions (last 5)
      const sorted = [...auctions].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setRecentAuctions(sorted.slice(0, 5));
      
    } catch (err) {
      console.error('Fetch auction data error:', err);
      setError('Failed to load auction data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const statCards = [
    { 
      key: 'active', 
      label: 'Active Auctions', 
      value: stats.active_auctions, 
      icon: <Gavel size={18} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      desc: 'Available to bid on'
    },
    { 
      key: 'bids', 
      label: 'Your Bids', 
      value: stats.my_bids, 
      icon: <TrendingUp size={18} className="text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      desc: 'Auctions you bid on'
    },
    { 
      key: 'won', 
      label: 'Won Auctions', 
      value: stats.won_auctions, 
      icon: <Trophy size={18} className="text-[#FFBE91]" />,
      bg: 'bg-[#FFFCE1]',
      border: 'border-[#FFDDB0]',
      desc: 'You won these!'
    },
    { 
      key: 'total_bids', 
      label: 'Total Bids Placed', 
      value: stats.total_bids, 
      icon: <Users size={18} className="text-violet-600" />,
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      desc: 'Across all auctions'
    },
  ];

  // Navigation items for the dashboard
  const navItems = [
    {
      id: 'browse',
      label: 'Browse Auctions',
      icon: <Search size={16} />,
      path: '/buyer/auctions/browse',
      color: 'bg-gradient-to-r from-[#FFBE91] to-[#FFDDB0] hover:from-[#FFA87A] hover:to-[#FFDDB0] text-[#1A1A2E]',
      description: 'Discover items to bid on'
    },
    {
      id: 'my_bids',
      label: 'My Bids',
      icon: <TrendingUp size={16} />,
      path: '/buyer/my-bids',
      color: 'border-[#EEECE6] hover:border-[#1A1A2E] text-[#1A1A2E]',
      description: 'Active auctions you bid on'
    },
    {
      id: 'won',
      label: 'My Won Auctions',
      icon: <Trophy size={16} />,
      path: '/buyer/my-won-auctions',
      color: 'border-[#EEECE6] hover:border-[#1A1A2E] text-[#1A1A2E]',
      description: 'Auctions you won (delivery + OTP)'
    },
    {
      id: 'history',
      label: 'Auction History',
      icon: <History size={16} />,
      path: '/buyer/auction-history',
      color: 'border-[#EEECE6] hover:border-[#1A1A2E] text-[#1A1A2E]',
      description: 'Complete audit log of all activity'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.06 }
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

  const getTimeLeft = (endTime) => {
    if (!endTime) return 'Ended';
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff < 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Ending soon';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#1A1A2E]" />
          <p className="text-xs text-[#A0A0B0]">Loading auction dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6"
      >
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A2E] tracking-tight flex items-center gap-2">
            <Gavel size={18} className="text-[#A0A0B0]" />
            Auction Dashboard
          </h1>
          <p className="text-sm text-[#A0A0B0]">Discover and bid on amazing items</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => navigate('/buyer/auctions/browse')}
            className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-sm px-4 py-2"
          >
            <Search size={15} className="mr-1.5" />
            Browse Auctions
          </Button>
          <Button 
            onClick={() => navigate('/buyer/dashboard')}
            variant="outline"
            className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] hover:border-[#D0D0D0] text-sm px-4 py-2"
          >
            <ArrowLeft size={15} className="mr-1.5" />
            Dashboard
          </Button>
          <Button 
            onClick={handleLogout}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-rose-500 hover:bg-rose-50 text-sm px-3 py-2"
          >
            <LogOut size={15} />
          </Button>
        </div>
      </motion.div>

      {error && (
        <div className="bg-rose-50/80 backdrop-blur-sm rounded-lg p-3 mb-4 text-rose-700 text-xs flex items-center gap-2 border border-rose-100">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
      >
        {statCards.map((stat) => (
          <motion.div
            key={stat.key}
            variants={itemVariants}
            className={`bg-white/80 backdrop-blur-xl rounded-xl p-4 border ${stat.border} shadow-sm hover:shadow-md transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                {stat.icon}
              </div>
              <span className="text-xl font-bold text-[#1A1A2E]">{stat.value}</span>
            </div>
            <p className="text-xs font-medium text-[#1A1A2E] mt-1">{stat.label}</p>
            <p className="text-[10px] text-[#A0A0B0]">{stat.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Navigation Grid - 4 cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
      >
        {navItems.map((item) => (
          <motion.div
            key={item.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => navigate(item.path)}
              variant="outline"
              className={`w-full py-4 h-auto flex flex-col items-center justify-center gap-2 ${item.color} transition-all shadow-sm hover:shadow-md`}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <span className="text-[10px] text-[#A0A0B0]">{item.description}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Auctions */}
      <motion.div 
        variants={itemVariants}
        className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-[#EEECE6] shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#FFBE91]" />
            <h3 className="text-sm font-medium text-[#1A1A2E]">Live Auctions</h3>
          </div>
          <Button
            variant="ghost"
            className="text-xs text-[#A0A0B0] hover:text-[#1A1A2E] px-2 py-0.5 h-auto"
            onClick={() => navigate('/buyer/auctions/browse')}
          >
            View All
          </Button>
        </div>

        {recentAuctions.length === 0 ? (
          <div className="text-center py-8">
            <Gavel size={32} className="text-[#A0A0B0] mx-auto mb-2" />
            <p className="text-sm text-[#A0A0B0]">No active auctions</p>
            <p className="text-xs text-[#A0A0B0] mt-0.5">Check back later for new items</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentAuctions.map((auction) => {
              const firstImage = auction.image_urls && auction.image_urls.length > 0 
                ? auction.image_urls[0] 
                : null;
              const timeLeft = getTimeLeft(auction.end_time);
              
              return (
                <div
                  key={auction.id}
                  className="group bg-white rounded-lg border border-[#EEECE6] overflow-hidden hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/buyer/auctions/${auction.id}`)}
                >
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={auction.item_name}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-40 bg-[#F8F6F0] flex items-center justify-center">
                      <Package size={32} className="text-[#A0A0B0]" />
                    </div>
                  )}
                  
                  <div className="p-3">
                    <h4 className="text-sm font-medium text-[#1A1A2E] truncate">
                      {auction.item_name}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-semibold text-[#1A1A2E]">
                        ₹{auction.current_highest_bid || auction.starting_price}
                      </span>
                      <span className={`text-[10px] font-medium ${
                        timeLeft === 'Ending soon' ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {timeLeft}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#EEECE6]">
                      <span className="text-[10px] text-[#A0A0B0]">
                        {auction.bid_count || 0} bids
                      </span>
                      <span className="text-[10px] text-[#FFBE91] group-hover:translate-x-1 transition-transform">
                        Bid Now →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Footer Note */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-center text-[10px] text-[#A0A0B0]"
      >
        <span className="flex items-center justify-center gap-1">
          <Sparkles size={10} className="text-[#FFBE91]" />
          Highest bid wins · Auctions auto-close at end time · Track won auctions in My Won Auctions
        </span>
      </motion.div>
    </div>
  );
};

export default BuyerAuctionDashboard;