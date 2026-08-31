import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  FileText, 
  Search, 
  Package, 
  CheckCircle, 
  History,
  ChevronRight,
  Store,
  LogOut,
  Clock,
  XCircle,
  Award,
  List,
  TrendingUp
} from 'lucide-react';
import api from '../../api/client';

const ShopRequestDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [stats, setStats] = useState({
    total_bids: 0,
    pending: 0,
    selected: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBidStats();
  }, []);

  const fetchBidStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bids');
      const bids = response.data || [];
      
      // Get completed bids (where request status is completed)
      const completed = bids.filter(b => b.requests?.status === 'completed').length;
      
      setStats({
        total_bids: bids.length,
        pending: bids.filter(b => b.status === 'pending').length,
        selected: bids.filter(b => b.status === 'selected' && b.requests?.status !== 'completed').length,
        completed: completed
      });
    } catch (err) {
      console.error('Failed to fetch bid stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  // KPI Cards
  const statCards = [
    { 
      key: 'total', 
      label: 'Total Bids', 
      value: stats.total_bids, 
      icon: <List size={18} className="text-[#FFBE91]" />,
      bg: 'bg-[#FFFCE1]',
      border: 'border-[#FFDDB0]',
      desc: 'All bids placed'
    },
    { 
      key: 'pending', 
      label: 'Pending', 
      value: stats.pending, 
      icon: <Clock size={18} className="text-amber-600" />,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      desc: 'Awaiting response'
    },
    { 
      key: 'selected', 
      label: 'Selected', 
      value: stats.selected, 
      icon: <CheckCircle size={18} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      desc: 'Won bids'
    },
    { 
      key: 'completed', 
      label: 'Completed', 
      value: stats.completed, 
      icon: <Award size={18} className="text-violet-600" />,
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      desc: 'Transactions done'
    },
  ];

  // Navigation items for the dashboard
  const navItems = [
    {
      id: 'browse',
      label: 'Browse Requests',
      icon: <Search size={16} />,
      path: '/shop/browse',
      color: 'bg-gradient-to-r from-[#FFBE91] to-[#FFDDB0] hover:from-[#FFA87A] hover:to-[#FFDDB0] text-[#1A1A2E]',
      description: 'Find requests to bid on'
    },
    {
      id: 'pending',
      label: 'My Bids',
      icon: <Package size={16} />,
      path: '/shop/my-bids',
      color: 'border-[#EEECE6] hover:border-[#1A1A2E] text-[#1A1A2E]',
      description: 'All your bids'
    },
    {
      id: 'finalized',
      label: 'Finalized Bids',
      icon: <CheckCircle size={16} />,
      path: '/shop/finalized-bids',
      color: 'border-[#EEECE6] hover:border-[#1A1A2E] text-[#1A1A2E]',
      description: 'Selected, rejected & completed'
    },
    {
      id: 'history',
      label: 'Bid History',
      icon: <History size={16} />,
      path: '/shop/history',
      color: 'border-[#EEECE6] hover:border-[#1A1A2E] text-[#1A1A2E]',
      description: 'Complete audit log'
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
          <div className="w-6 h-6 border-2 border-[#1A1A2E] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#A0A0B0]">Loading dashboard...</p>
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
                <FileText size={20} className="text-[#FFBE91]" />
                Request Dashboard
              </h1>
              <p className="text-xs text-[#A0A0B0] mt-0.5">
                {stats.total_bids} total bids · {stats.pending} pending · {stats.selected} selected · {stats.completed} completed
              </p>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-rose-500 hover:bg-rose-50 text-sm px-3 py-2"
          >
            <LogOut size={15} />
          </Button>
        </motion.div>

        {/* Stats Grid - 4 KPIs */}
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

        {/* Quick Actions / Info */}
        <motion.div 
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-[#EEECE6] shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[#FFBE91]" />
              <span className="text-xs font-medium text-[#1A1A2E]">Quick Actions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => navigate('/shop/browse')}
                className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-3 py-1.5 h-auto"
              >
                <Search size={13} className="mr-1.5" />
                Browse Requests
              </Button>
              <Button
                onClick={() => navigate('/shop/my-bids')}
                variant="outline"
                className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
              >
                <Package size={13} className="mr-1.5" />
                My Bids
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          variants={itemVariants}
          className="mt-4 text-center text-[10px] text-[#A0A0B0]"
        >
          <span className="flex items-center justify-center gap-1">
            <span className="text-[#FFBE91]">⚡</span>
            Browse requests to find new opportunities · Track your selected bids in Finalized Bids
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default ShopRequestDashboard;