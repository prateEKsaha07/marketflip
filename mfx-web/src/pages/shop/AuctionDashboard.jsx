import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Gavel, 
  Plus, 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  MapPin,
  DollarSign,
  Eye,
  ChevronRight,
  Loader2,
  Sparkles,
  Store,
  Users,
  Award,
  History,
  FileCheck
} from 'lucide-react';
import api from '../../api/client';

const AuctionDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    sold: 0,
    completed: 0,
    expired: 0,
    cancelled: 0,
    total: 0,
    total_bids: 0,
    total_revenue: 0
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
      const response = await api.get('/auctions?status=all');
      const auctions = response.data || [];
      
      // Calculate stats
      const activeAuctions = auctions.filter(a => a.status === 'active');
      const soldAuctions = auctions.filter(a => a.status === 'sold');
      const completedAuctions = auctions.filter(a => a.status === 'completed');
      
      const statsData = {
        active: activeAuctions.length,
        sold: soldAuctions.length,
        completed: completedAuctions.length,
        expired: auctions.filter(a => a.status === 'expired').length,
        cancelled: auctions.filter(a => a.status === 'cancelled').length,
        total: auctions.length,
        total_bids: auctions.reduce((sum, a) => sum + (a.bid_count || 0), 0),
        total_revenue: [...soldAuctions, ...completedAuctions].reduce((sum, a) => sum + (a.current_highest_bid || a.starting_price || 0), 0)
      };
      setStats(statsData);
      
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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': 
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active', icon: <CheckCircle size={12} /> };
      case 'sold': 
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sold', icon: <Package size={12} /> };
      case 'completed': 
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed', icon: <CheckCircle size={12} /> };
      case 'expired': 
        return { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Expired', icon: <XCircle size={12} /> };
      case 'cancelled': 
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Cancelled', icon: <AlertCircle size={12} /> };
      default: 
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: status, icon: <AlertCircle size={12} /> };
    }
  };

  const statCards = [
    { 
      key: 'active', 
      label: 'Active Auctions', 
      value: stats.active, 
      icon: <CheckCircle size={18} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      desc: 'Live and accepting bids'
    },
    { 
      key: 'sold', 
      label: 'Sold / Completed', 
      value: stats.sold + stats.completed, 
      icon: <Award size={18} className="text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      desc: 'Successfully finalized'
    },
    { 
      key: 'revenue', 
      label: 'Total Revenue', 
      value: `₹${stats.total_revenue.toLocaleString()}`, 
      icon: <DollarSign size={18} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      desc: 'From sold/completed auctions'
    },
    { 
      key: 'bids', 
      label: 'Total Bids', 
      value: stats.total_bids, 
      icon: <Users size={18} className="text-[#FFBE91]" />,
      bg: 'bg-[#FFFCE1]',
      border: 'border-[#FFDDB0]',
      desc: 'Across all auctions'
    },
  ];

  // Navigation items for the dashboard
  const navItems = [
    {
      id: 'post',
      label: 'Post Auction',
      icon: <Plus size={16} />,
      path: '/shop/auctions/post',
      color: 'bg-gradient-to-r from-[#FFBE91] to-[#FFDDB0] hover:from-[#FFA87A] hover:to-[#FFDDB0] text-[#1A1A2E]',
      description: 'Create a new auction listing'
    },
    {
      id: 'active',
      label: 'Active Auctions',
      icon: <Clock size={16} />,
      path: '/shop/auctions/my',
      color: 'border-[#EEECE6] hover:border-[#1A1A2E] text-[#1A1A2E]',
      description: 'Manage active bidding auctions'
    },
    {
      id: 'finalized',
      label: 'Finalized Auctions',
      icon: <FileCheck size={16} />,
      path: '/shop/finalized-auctions',
      color: 'border-[#EEECE6] hover:border-[#1A1A2E] text-[#1A1A2E]',
      description: 'Sold, completed & cancelled auctions'
    },
    {
      id: 'history',
      label: 'Auction History',
      icon: <History size={16} />,
      path: '/shop/auction-history',
      color: 'border-[#EEECE6] hover:border-[#1A1A2E] text-[#1A1A2E]',
      description: 'Complete audit log of all auctions'
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
              onClick={() => navigate('/shop/dashboard')}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
            >
              <ArrowLeft size={14} className="mr-1.5" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-[#1A1A2E] flex items-center gap-2">
                <Gavel size={20} className="text-[#FFBE91]" />
                Auction Dashboard
              </h1>
              <p className="text-xs text-[#A0A0B0] mt-0.5">
                {stats.total} total auctions · {stats.total_bids} total bids placed · ₹{stats.total_revenue.toLocaleString()} revenue
              </p>
            </div>
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
              <h3 className="text-sm font-medium text-[#1A1A2E]">Recent Auctions</h3>
            </div>
            {recentAuctions.length > 0 && (
              <Button
                variant="ghost"
                className="text-xs text-[#A0A0B0] hover:text-[#1A1A2E] px-2 py-0.5 h-auto"
                onClick={() => navigate('/shop/auction-history')}
              >
                View All
              </Button>
            )}
          </div>

          {recentAuctions.length === 0 ? (
            <div className="text-center py-8">
              <Gavel size={32} className="text-[#A0A0B0] mx-auto mb-2" />
              <p className="text-sm text-[#A0A0B0]">No auctions yet</p>
              <p className="text-xs text-[#A0A0B0] mt-0.5">Create your first auction to get started</p>
              <Button
                onClick={() => navigate('/shop/auctions/post')}
                className="mt-3 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto"
              >
                <Plus size={13} className="mr-1.5" />
                Create Auction
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAuctions.map((auction) => {
                const status = getStatusBadge(auction.status);
                const firstImage = auction.image_urls && auction.image_urls.length > 0 
                  ? auction.image_urls[0] 
                  : null;
                
                // Determine detail path based on status
                const detailPath = ['active'].includes(auction.status)
                  ? `/shop/auctions/${auction.id}`
                  : `/shop/auctions/${auction.id}`;
                
                return (
                  <div
                    key={auction.id}
                    className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-lg border border-[#EEECE6] hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(detailPath)}
                  >
                    {/* Image */}
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={auction.item_name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#F8F6F0] flex items-center justify-center flex-shrink-0">
                        <Package size={18} className="text-[#A0A0B0]" />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-[#1A1A2E] truncate">
                          {auction.item_name}
                        </h4>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${status.bg} ${status.text}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#A0A0B0]">
                        <span className="flex items-center gap-1">
                          <DollarSign size={10} />
                          Current: ₹{auction.current_highest_bid || auction.starting_price}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={10} />
                          {auction.bid_count || 0} bids
                        </span>
                        {auction.status === 'active' && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Clock size={10} />
                            Ends: {new Date(auction.end_time).toLocaleDateString()}
                          </span>
                        )}
                        {['sold', 'completed'].includes(auction.status) && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <CheckCircle size={10} />
                            {auction.delivery_method === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight size={16} className="text-[#A0A0B0] group-hover:translate-x-1 transition-transform" />
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Footer Note */}
        <motion.div 
          variants={itemVariants}
          className="mt-4 text-center text-[10px] text-[#A0A0B0]"
        >
          <span className="flex items-center justify-center gap-1">
            <Sparkles size={10} className="text-[#FFBE91]" />
            Auctions auto-close at end time · Highest bid wins · Manage post-sale flow in Finalized Auctions
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default AuctionDashboard;