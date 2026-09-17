import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import LoadingAnimation from '../../components/ui/LoadingAnimation';
import ModernNavbar from "../../components/ui/Navbar";
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  History,
  Package,
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
      const [openResponse, purchasedResponse, completedResponse, allResponse] = await Promise.all([
        api.get('/requests?status=open'),
        api.get('/requests?status=purchased'),
        api.get('/requests?status=completed'),
        api.get('/requests?status=all'),
      ]);

      const openRequests = openResponse.data || [];
      const purchasedRequests = purchasedResponse.data || [];
      const completedRequests = completedResponse.data || [];
      const allRequests = allResponse.data || [];

      const finalized = purchasedRequests.length + completedRequests.length;
      let totalBids = 0;
      allRequests.forEach(req => {
        totalBids += (req.bid_count || 0);
      });

      setStats({
        total: allRequests.length,
        open: openRequests.length,
        finalized,
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

  const statCards = [
    { 
      key: 'total', 
      label: 'Total', 
      value: stats.total, 
      icon: <FileText size={15} />,
      accent: 'text-[#FFBE91]',
      bg: 'bg-[#FFBE91]/10',
      desc: 'Requests'
    },
    { 
      key: 'open', 
      label: 'Open', 
      value: stats.open, 
      icon: <Clock size={15} />,
      accent: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
      desc: 'Awaiting bids'
    },
    { 
      key: 'finalized', 
      label: 'Finalized', 
      value: stats.finalized, 
      icon: <CheckCircle size={15} />,
      accent: 'text-blue-600',
      bg: 'bg-blue-500/10',
      desc: 'Completed'
    },
    { 
      key: 'bids', 
      label: 'Bids', 
      value: stats.total_bids, 
      icon: <Users size={15} />,
      accent: 'text-violet-600',
      bg: 'bg-violet-500/10',
      desc: 'Received'
    },
  ];

  const navItems = [
    {
      id: 'post',
      label: 'Post Request',
      icon: <Plus size={16} />,
      path: '/buyer/post-request',
      primary: true,
      description: 'Create a new request'
    },
    {
      id: 'open',
      label: 'Open Requests',
      icon: <Clock size={16} />,
      path: '/buyer/my-open-requests',
      description: 'Awaiting bids'
    },
    {
      id: 'finalized',
      label: 'Finalized',
      icon: <CheckCircle size={16} />,
      path: '/buyer/purchases',
      description: 'Selected & completed'
    },
    {
      id: 'history',
      label: 'History',
      icon: <History size={16} />,
      path: '/buyer/history',
      description: 'Full audit log'
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
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  if (loading) {
    return <LoadingAnimation />;
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
        logo={{
          src: "/Logo.png",
          alt: "MarketFlip",
          link: "/buyer/dashboard",
        }}
        showProfile={true}
        showLogout={true}
        showNotifications={true}
        logoutButton={{
          label: "Logout",
          icon: "LogOut",
          onClick: handleLogout
        }}
        profileButton={{
          label: "Profile",
          path: "/buyer/profile",
          icon: "User"
        }}
      />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-2 sm:gap-3 mb-4 sm:mb-6"
        >
          <Button 
            onClick={() => navigate('/buyer/dashboard')}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-[11px] px-2 sm:px-3 py-1.5 h-auto flex-shrink-0 -ml-1 sm:ml-0"
          >
            <ArrowLeft size={13} className="mr-1 sm:mr-1.5" />
            Back
          </Button>
          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="text-base sm:text-lg font-semibold text-[#1A1A2E] flex items-center gap-1.5">
              <FileText size={16} className="text-[#FFBE91] flex-shrink-0" />
              <span className="truncate">Request Dashboard</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-[#A0A0B0] mt-0.5">
              {stats.total} total · {stats.open} open · {stats.finalized} finalized
            </p>
          </div>
        </motion.div>

        {/* Stats — compact pill-style on mobile, cards on desktop */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6"
        >
          {statCards.map((stat) => (
            <motion.div
              key={stat.key}
              variants={itemVariants}
              className="bg-white/70 backdrop-blur-xl rounded-xl p-2.5 sm:p-3.5 transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-1.5 sm:gap-0">
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${stat.bg} flex items-center justify-center ${stat.accent} flex-shrink-0`}>
                  {stat.icon}
                </div>
                <span className="text-lg sm:text-xl font-bold text-[#1A1A2E] leading-none">{stat.value}</span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-[#1A1A2E] mt-1.5 sm:mt-1 truncate">
                {stat.label}
              </p>
              <p className="text-[9px] text-[#A0A0B0] hidden sm:block">{stat.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Primary CTA — Post Request */}
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/buyer/post-request')}
          className="w-full mb-4 sm:mb-5 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFBE91] to-[#FFDDB0] p-4 sm:p-5 flex items-center justify-between group shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/40 blur-2xl pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Plus size={18} className="text-[#1A1A2E]" />
            </div>
            <div className="text-left">
              <p className="text-[13px] sm:text-sm font-semibold text-[#1A1A2E]">Post a new request</p>
              <p className="text-[10px] sm:text-[11px] text-[#1A1A2E]/60">Get bids from shops</p>
            </div>
          </div>
          <div className="relative text-[#1A1A2E]/50 group-hover:text-[#1A1A2E] group-hover:translate-x-0.5 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </motion.button>

        {/* Navigation Row — compact list, not cards */}
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
            {navItems.filter(i => !i.primary).map((item) => (
              <motion.button
                key={item.id}
                variants={itemVariants}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className="bg-white/70 backdrop-blur-xl rounded-xl p-3 flex items-center gap-3 text-left transition-all hover:bg-white/90 group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#F8F6F0] flex items-center justify-center text-[#1A1A2E] flex-shrink-0 group-hover:bg-[#FFBE91]/20 transition-colors">
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] sm:text-[13px] font-medium text-[#1A1A2E] truncate">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-[#A0A0B0] truncate">
                    {item.description}
                  </p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#A0A0B0] flex-shrink-0 group-hover:text-[#1A1A2E] group-hover:translate-x-0.5 transition-all">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Footer Hint */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <p className="text-[10px] text-[#A0A0B0]">
            Post a request to receive bids · Track purchases in Finalized
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default BuyerRequestDashboard;