import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  History,
  ChevronRight,
  Store,
  LogOut,
  Package,
  TrendingUp,
  Users
} from 'lucide-react';
import api from '../../api/client';

const BuyerRequestDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    finalized: 0,
    total_bids: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch open requests
      const openResponse = await api.get('/requests?status=open');
      const openRequests = openResponse.data || [];
      
      // Fetch purchased requests (finalized)
      const purchasedResponse = await api.get('/requests?status=purchased');
      const purchasedRequests = purchasedResponse.data || [];
      
      // Fetch completed requests
      const completedResponse = await api.get('/requests?status=completed');
      const completedRequests = completedResponse.data || [];
      
      const finalized = purchasedRequests.length + completedRequests.length;
      
      // Fetch all requests for total
      const allResponse = await api.get('/requests?status=all');
      const allRequests = allResponse.data || [];
      
      // Calculate total bids from all requests
      let totalBids = 0;
      allRequests.forEach(req => {
        totalBids += (req.bid_count || 0);
      });
      
      setStats({
        total: allRequests.length,
        open: openRequests.length,
        finalized: finalized,
        total_bids: totalBids
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
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
      label: 'Total Requests', 
      value: stats.total, 
      icon: <FileText size={18} className="text-[#FFBE91]" />,
      bg: 'bg-[#FFFCE1]',
      border: 'border-[#FFDDB0]',
      desc: 'All your requests'
    },
    { 
      key: 'open', 
      label: 'Open Requests', 
      value: stats.open, 
      icon: <Clock size={18} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      desc: 'Awaiting bids'
    },
    { 
      key: 'finalized', 
      label: 'Finalized', 
      value: stats.finalized, 
      icon: <CheckCircle size={18} className="text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      desc: 'Selected & completed'
    },
    { 
      key: 'bids', 
      label: 'Total Bids Received', 
      value: stats.total_bids, 
      icon: <Users size={18} className="text-violet-600" />,
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      desc: 'Across all requests'
    },
  ];

  // Navigation items for the dashboard
  const navItems = [
    {
      id: 'post',
      label: 'Post Request',
      icon: <Plus size={16} />,
      path: '/buyer/post-request',
      color: 'bg-gradient-to-r from-[#FFBE91] to-[#FFDDB0] hover:from-[#FFA87A] hover:to-[#FFDDB0] text-[#1A1A2E]',
      description: 'Create a new request'
    },
    {
      id: 'open',
      label: 'My Open Requests',
      icon: <Clock size={16} />,
      path: '/buyer/my-open-requests',
      color: 'border-[#EEECE6] hover:border-[#1A1A2E] text-[#1A1A2E]',
      description: 'Active requests awaiting bids'
    },
    {
      id: 'finalized',
      label: 'Finalized Requests',
      icon: <CheckCircle size={16} />,
      path: '/buyer/purchases',
      color: 'border-[#EEECE6] hover:border-[#1A1A2E] text-[#1A1A2E]',
      description: 'Selected, delivered & completed'
    },
    {
      id: 'history',
      label: 'Request History',
      icon: <History size={16} />,
      path: '/buyer/history',
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
              onClick={() => navigate('/buyer/dashboard')}
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
                {stats.total} total requests · {stats.open} open · {stats.finalized} finalized
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

        {/* Quick Stats / Info */}
        <motion.div 
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-[#EEECE6] shadow-sm text-center"
        >
          <p className="text-xs text-[#A0A0B0]">
            💡 Post a request to get bids from shops · Track your purchases in Finalized Requests
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default BuyerRequestDashboard;