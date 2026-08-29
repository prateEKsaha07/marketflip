import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Package, 
  Clock, 
  Trash2, 
  LogOut,
  ShoppingBag,
  Eye,
  ArrowUpRight,
  TrendingUp,
  Calendar,
  Sparkles,
  Zap,
  Gavel,
  User,
  History,
  MessageCircle  // <-- ADD THIS
} from 'lucide-react';
import api from '../../api/client';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('open');
  const [unreadCount, setUnreadCount] = useState(0);  // <-- NEW

  useEffect(() => {
    fetchAllRequests();
    fetchUnreadCount();  // <-- NEW
  }, []);

  const fetchAllRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const statuses = ['open', 'expired', 'deleted'];
      const promises = statuses.map(status => 
        api.get(`/requests?status=${status}`).catch(() => ({ data: [] }))
      );
      
      const responses = await Promise.all(promises);
      const allData = responses.flatMap(res => res.data || []);
      
      console.log('All requests with bid counts:', allData);
      setAllRequests(allData);
    } catch (err) {
      setError('Failed to fetch requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ====== NEW: Fetch unread count ======
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/chat/unread-count');
      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
      // Don't show error to user, just keep count at 0
    }
  };

  const getFilteredRequests = () => {
    if (activeTab === 'all') {
      return allRequests;
    }
    return allRequests.filter(req => req.status === activeTab);
  };

  const filteredRequests = getFilteredRequests();

  const counts = {
    all: allRequests.length,
    open: allRequests.filter(r => r.status === 'open').length,
    expired: allRequests.filter(r => r.status === 'expired').length,
    deleted: allRequests.filter(r => r.status === 'deleted').length,
  };

  const tabs = [
    { id: 'open', label: 'Open', icon: <ShoppingBag size={14} />, count: counts.open },
    { id: 'expired', label: 'Expired', icon: <Clock size={14} />, count: counts.expired },
    { id: 'deleted', label: 'Deleted', icon: <Trash2 size={14} />, count: counts.deleted },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700', dot: 'bg-emerald-400', glow: 'shadow-emerald-100' };
      case 'expired': return { bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-700', dot: 'bg-rose-400', glow: 'shadow-rose-100' };
      case 'deleted': return { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-700', dot: 'bg-gray-400', glow: 'shadow-gray-100' };
      default: return { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-700', dot: 'bg-gray-400', glow: 'shadow-gray-100' };
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
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };

  const tabVariants = {
    inactive: { opacity: 0.6, scale: 0.95 },
    active: { opacity: 1, scale: 1 }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCE1]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-4 border-[#FFBE91] border-t-transparent rounded-full"
          />
          <motion.p 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-[#FFBE91] font-medium"
          >
            Loading your requests...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFCE1] via-[#FFDDB0]/5 to-[#CFEBFF]/5 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6"
        >
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl md:text-3xl font-bold text-[#1A1A2E] flex items-center gap-2"
            >
              Your Requests
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Sparkles size={16} className="text-[#FFBE91]" />
              </motion.span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs text-[#4A4A5A]"
            >
              {counts.open} active · {counts.expired} expired · {counts.deleted} deleted
            </motion.p>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => navigate('/buyer/post-request')}
                className="bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] shadow-lg hover:shadow-xl transition-all text-sm px-4 py-2"
              >
                <Plus size={16} className="mr-1.5" />
                New Request
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => navigate('/buyer/purchases')}
                variant="outline"
                className="border-[#CFEBFF] text-[#1A1A2E] hover:bg-[#CFEBFF]/20 hover:border-[#CFEBFF] text-sm px-4 py-2"
              >
                <Package size={16} className="mr-1.5" />
                My Purchases
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => navigate('/buyer/auctions')}
                variant="outline"
                className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] hover:border-[#D0D0D0] text-sm px-4 py-2"
              >
                <Gavel size={15} className="mr-1.5" />
                Auctions
              </Button>
            </motion.div>

            {/* ====== CHAT BUTTON WITH UNREAD BADGE ====== */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate('/buyer/chat')}
                variant="outline"
                className="border-[#CFEBFF] text-[#1A1A2E] hover:bg-[#CFEBFF]/20 hover:border-[#CFEBFF] text-sm px-4 py-2 relative"
              >
                <MessageCircle size={16} className="mr-1.5" />
                Chats
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FFBE91] text-[#1A1A2E] text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => navigate('/buyer/profile')}
                variant="ghost"
                className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
              >
                <User size={14} className="mr-1.5" />
                Profile
              </Button>
            </motion.div>
            
            {/* ====== TRANSACTION HISTORY BUTTON ====== */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate('/buyer/history')}
                variant="outline"
                className="border-[#FFDDB0] text-[#1A1A2E] hover:bg-[#FFDDB0]/30 text-xs px-4 py-2 flex items-center gap-1.5"
              >
                <History size={16} />
                History
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={handleLogout}
                variant="ghost"
                className="text-[#4A4A5A] hover:text-rose-500 hover:bg-rose-50 text-sm px-3 py-2"
              >
                <LogOut size={16} />
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-1 mb-6 bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-[#FFDDB0]/50"
        >
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              variants={tabVariants}
              animate={activeTab === tab.id ? 'active' : 'inactive'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all text-sm font-medium
                ${activeTab === tab.id 
                  ? 'bg-[#FFBE91] text-[#1A1A2E] shadow-md' 
                  : 'text-[#4A4A5A] hover:text-[#1A1A2E] hover:bg-[#FFDDB0]/30'
                }
              `}
            >
              {tab.icon}
              {tab.label}
              <motion.span 
                key={tab.count}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`
                  ml-1 px-2 py-0.5 rounded-full text-[10px]
                  ${activeTab === tab.id 
                    ? 'bg-[#1A1A2E]/10 text-[#1A1A2E]' 
                    : 'bg-[#FFDDB0]/30 text-[#4A4A5A]'
                  }
                `}
              >
                {tab.count}
              </motion.span>
            </motion.button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-4 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Request Cards */}
        <AnimatePresence mode="wait">
          {filteredRequests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#FFDDB0]/50 p-8 md:p-12 text-center"
            >
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-4xl mb-3"
              >
                📭
              </motion.div>
              <p className="text-[#4A4A5A] text-base">No {activeTab} requests found.</p>
              {activeTab === 'open' && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={() => navigate('/buyer/post-request')}
                    className="mt-3 bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] text-sm"
                  >
                    <Plus size={16} className="mr-1.5" />
                    Post your first request
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {filteredRequests.map((req, index) => {
                const isDeleted = req.status === 'deleted';
                const isExpired = req.status === 'expired';
                const isOpen = req.status === 'open';
                const statusStyle = getStatusColor(req.status);
                const bidCount = req.bid_count || 0;
                
                return (
                  <motion.div
                    key={req.id}
                    variants={itemVariants}
                    layoutId={req.id}
                    whileHover={{ y: -4, transition: { type: "spring", stiffness: 400 } }}
                    onClick={() => navigate(`/buyer/request/${req.id}`)}
                    className={`
                      group relative bg-white rounded-xl border ${statusStyle.border} ${statusStyle.bg}
                      hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden
                    `}
                  >
                    {/* Top Gradient Bar */}
                    <motion.div 
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className={`h-1 w-full ${isOpen ? 'bg-emerald-400' : isExpired ? 'bg-rose-400' : 'bg-gray-400'} origin-left`}
                    />

                    <div className="p-4">
                      {/* Header */}
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-[#1A1A2E] truncate">
                            {req.item_name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <motion.span 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.03 + 0.1 }}
                              className={`
                                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                                ${statusStyle.text} ${statusStyle.bg} border ${statusStyle.border}
                              `}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                              {req.status.toUpperCase()}
                            </motion.span>
                            {isOpen && bidCount > 0 && (
                              <motion.span 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.03 + 0.15 }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 border border-amber-200"
                              >
                                <TrendingUp size={10} />
                                {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
                              </motion.span>
                            )}
                          </div>
                        </div>
                        <motion.div 
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          className="flex-shrink-0"
                        >
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-[#4A4A5A] hover:text-[#FFBE91] hover:bg-[#FFBE91]/10 rounded-full h-8 w-8 p-0"
                          >
                            <Eye size={14} />
                          </Button>
                        </motion.div>
                      </div>

                      {/* Description */}
                      <p className="text-[#4A4A5A] text-xs line-clamp-2 mb-2 min-h-[32px]">
                        {req.description || 'No description provided'}
                      </p>

                      {/* Budget */}
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#1A1A2E] bg-white/60 rounded-lg px-2.5 py-1 mb-2">
                        <span className="text-[#FFBE91]">₹</span>
                        <span>{req.budget_min.toLocaleString()}</span>
                        <span className="text-[#4A4A5A]">—</span>
                        <span>₹{req.budget_max.toLocaleString()}</span>
                      </div>

                      {/* Footer */}
                      <div className="flex justify-between items-center text-[10px] text-[#4A4A5A] pt-2 border-t border-[#FFDDB0]/30">
                        <div className="flex items-center gap-2">
                          <span>📍 {req.pincode}</span>
                          <span className="opacity-50">·</span>
                          <span>📂 {req.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={10} />
                          <span>{new Date(req.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Click Arrow */}
                    <motion.div 
                      initial={{ opacity: 0, x: 5 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      className="absolute bottom-2 right-2"
                    >
                      <ArrowUpRight size={14} className="text-[#FFBE91]" />
                    </motion.div>

                    {/* Hover Glow Effect */}
                    <motion.div 
                      className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `radial-gradient(circle at right bottom, rgba(255,190,145,0.05) 0%, transparent 70%)`
                      }}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;