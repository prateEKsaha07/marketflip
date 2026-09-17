import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import ModernNavbar from "../../components/ui/Navbar";
import { 
  ArrowLeft, 
  FileText, 
  Package, 
  Clock, 
  AlertCircle,
  Search,
  IndianRupee,
  Eye,
  ChevronRight,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Calendar,
  Store,
  CheckCircle
} from 'lucide-react';
import api from '../../api/client';

const MyOpenRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [error, setError] = useState('');

  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(r => 
        r.item_name.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query))
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }

    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return filtered;
  }, [requests, searchQuery, categoryFilter]);

  useEffect(() => {
    fetchOpenRequests();
  }, []);

  const fetchOpenRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/requests?status=open');
      setRequests(response.data || []);
    } catch (err) {
      console.error('Fetch requests error:', err);
      setError('Failed to load requests: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
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
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin text-[#1A1A2E]" />
          <p className="text-[11px] text-[#A0A0B0]">Loading your requests...</p>
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
          onClick: () => {}
        }}
        profileButton={{
          label: "Profile",
          path: "/buyer/profile",
          icon: "User"
        }}
      />

      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate('/buyer/requests')}
          className="flex items-center gap-1.5 mb-3 -ml-1 px-2 py-1.5 text-[11px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors rounded-lg hover:bg-[#F5F3EF]"
        >
          <ArrowLeft size={12} />
          Back to requests
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
                <Clock size={14} className="flex-shrink-0" />
                <span className="truncate">My Open Requests</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="text-[10px] text-[#1A1A2E]/70 mt-0.5 truncate"
              >
                {requests.length} open {requests.length === 1 ? 'request' : 'requests'} awaiting bids
              </motion.p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/buyer/post-request')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A2E] text-white text-[11px] font-medium rounded-full flex-shrink-0 mt-0.5 hover:bg-[#2A2A3E] transition-colors"
            >
              <Plus size={11} />
              New
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

        {/* Search & Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-4"
        >
          <div className="flex-1 min-w-[140px] relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
            <input
              type="text"
              placeholder="Search open requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-[11px] bg-[#F8F6F0]/60 border-0 rounded-xl text-[#1A1A2E] placeholder-[#A0A0B0] focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/40 focus:bg-white transition-all"
            />
          </div>
          <div className="w-36 sm:w-40">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-[11px] bg-[#F8F6F0]/60 border-0 rounded-xl text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/40 focus:bg-white transition-all appearance-none"
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
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('');
            }}
            className="px-3 py-2 text-[11px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors rounded-xl hover:bg-[#F5F3EF]"
          >
            Clear
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={fetchOpenRequests}
            className="flex items-center gap-1 px-3 py-2 text-[11px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors rounded-xl hover:bg-[#F5F3EF]"
          >
            <RefreshCw size={12} />
            Refresh
          </motion.button>
        </motion.div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#F5F3EF] flex items-center justify-center mx-auto mb-3">
              <Clock size={20} className="text-[#A0A0B0]" />
            </div>
            <h3 className="text-[13px] font-medium text-[#1A1A2E]">No open requests</h3>
            <p className="text-[11px] text-[#A0A0B0] mt-1">Post a new request to get started</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/buyer/post-request')}
              className="mt-3 inline-flex items-center gap-1.5 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[11px] font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={12} />
              Post Request
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2.5"
          >
            {filteredRequests.map((request) => {
              const firstImage = request.image_urls && request.image_urls.length > 0 
                ? request.image_urls[0] 
                : null;
              const bidCount = request.bid_count || 0;

              return (
                <motion.div
                  key={request.id}
                  variants={itemVariants}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.995 }}
                  className="bg-white/70 backdrop-blur-xl rounded-2xl p-3 sm:p-4 hover:bg-white/90 transition-all group cursor-pointer"
                  onClick={() => navigate(`/buyer/request/${request.id}`)}
                >
                  <div className="flex items-center gap-3">
                    {/* Image */}
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={request.item_name}
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
                          {request.item_name}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle size={8} />
                          Open
                        </span>
                        {bidCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-50 text-amber-700">
                            <Store size={8} />
                            {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
                          </span>
                        )}
                      </div>
                      
                      {request.description && (
                        <p className="text-[10px] sm:text-[11px] text-[#4A4A5A] line-clamp-1 mt-0.5">
                          {request.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px] text-[#A0A0B0]">
                        <span className="flex items-center gap-1 font-medium text-[#1A1A2E]">
                          <IndianRupee size={10} />
                          {request.budget_min?.toLocaleString('en-IN')} – {request.budget_max?.toLocaleString('en-IN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />
                          {request.pincode}
                        </span>
                        <span className="hidden sm:flex items-center gap-1">
                          <FileText size={10} />
                          {request.category || 'Uncategorized'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(request.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronRight size={14} className="text-[#A0A0B0] group-hover:translate-x-0.5 group-hover:text-[#1A1A2E] transition-all flex-shrink-0" />
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
          className="mt-4 mb-4 text-center"
        >
          <p className="text-[9px] text-[#A0A0B0]">
            Open requests are actively accepting bids from shops
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default MyOpenRequests;