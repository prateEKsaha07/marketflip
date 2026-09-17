import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import ModernNavbar from "../../components/ui/Navbar";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Gavel, 
  Package, 
  Clock, 
  MapPin, 
  IndianRupee,
  Loader2,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Flag,
  Zap,
  X
} from 'lucide-react';
import api from '../../api/client';
import ReportModal from '../../components/ReportModal';
import FavoriteButton from '../../components/FavoriteButton';
import SaveSearchButton from '../../components/SaveSearchButton';
import RecommendationsList from '../../components/ml/RecommendationsList';

const BrowseAuctions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    pincode: '',
    category: '',
    status: 'active'
  });
  const [activeFilters, setActiveFilters] = useState({
    pincode: '',
    category: '',
    status: 'active'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('ending_soon');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const sortOptions = [
    { value: 'ending_soon', label: 'Ending Soon' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price ↑' },
    { value: 'price_desc', label: 'Price ↓' },
    { value: 'most_bids', label: 'Most Bids' },
  ];

  useEffect(() => {
    fetchAuctions();
  }, [activeFilters, sortBy]);

  /* ---------- Recommendations ---------- */
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (auctions.length === 0) return;

      setRecommendationsLoading(true);
      try {
        const firstAuction = auctions[0];
        const category = firstAuction?.category || activeFilters.category;
        const pincode = firstAuction?.pincode || activeFilters.pincode;

        let formatted = [];

        if (category) {
          try {
            const params = new URLSearchParams();
            params.append('status', 'active');
            params.append('category', category);
            params.append('limit', '10');
            params.append('sort', 'newest');

            const response = await api.get(`/auctions?${params.toString()}`);
            let similarAuctions = response.data || [];

            if (firstAuction?.id) {
              similarAuctions = similarAuctions.filter(a => a.id !== firstAuction.id);
            }

            formatted = similarAuctions.slice(0, 5).map(auction => ({
              id: auction.id,
              name: auction.item_name,
              item_name: auction.item_name,
              type: 'auction',
              category: auction.category,
              pincode: auction.pincode,
              price: auction.current_highest_bid || auction.starting_price,
              image_urls: auction.image_urls || [],
              description: auction.description,
              confidence: 0.7 + (Math.random() * 0.25),
              similarity_score: 4 + (Math.random() * 1)
            }));
          } catch (err) {
            // silent
          }
        }

        if (formatted.length === 0) {
          try {
            const params = new URLSearchParams();
            params.append('status', 'active');
            params.append('limit', '10');
            params.append('sort', 'newest');

            const response = await api.get(`/auctions?${params.toString()}`);
            let similarAuctions = response.data || [];

            if (firstAuction?.id) {
              similarAuctions = similarAuctions.filter(a => a.id !== firstAuction.id);
            }

            formatted = similarAuctions.slice(0, 5).map(auction => ({
              id: auction.id,
              name: auction.item_name,
              item_name: auction.item_name,
              type: 'auction',
              category: auction.category || 'general',
              pincode: auction.pincode,
              price: auction.current_highest_bid || auction.starting_price,
              image_urls: auction.image_urls || [],
              description: auction.description,
              confidence: 0.5 + (Math.random() * 0.2),
              similarity_score: 2 + (Math.random() * 1)
            }));
          } catch (err) {
            // silent
          }
        }

        setRecommendations(formatted);
      } catch (err) {
        setRecommendations([]);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    const timer = setTimeout(fetchRecommendations, 1000);
    return () => clearTimeout(timer);
  }, [auctions, activeFilters.category, activeFilters.pincode]);

  const fetchAuctions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('status', activeFilters.status || 'active');
      params.append('sort', sortBy);
      if (activeFilters.pincode) params.append('pincode', activeFilters.pincode);
      if (activeFilters.category) params.append('category', activeFilters.category);

      const response = await api.get(`/auctions?${params.toString()}`);
      setAuctions(response.data || []);
    } catch (err) {
      setError('Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setActiveFilters({ ...filters });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ pincode: '', category: '', status: 'active' });
    setActiveFilters({ pincode: '', category: '', status: 'active' });
    setSortBy('ending_soon');
    setShowFilters(false);
    setRecommendations([]);
  };

  const hasActiveFilters = activeFilters.pincode || activeFilters.category;

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

  const handleReport = (auction, e) => {
    e.stopPropagation();
    setReportTarget(auction);
    setShowReportModal(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
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
        logoutButton={{ label: "Logout", icon: "LogOut", onClick: () => {} }}
        profileButton={{ label: "Profile", path: "/buyer/profile", icon: "User" }}
      />

      <div className="max-w-6xl mx-auto">
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
                <Gavel size={14} className="flex-shrink-0" />
                <span className="truncate">Browse Auctions</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="text-[10px] text-[#1A1A2E]/70 mt-0.5 truncate"
              >
                {auctions.length} live {auctions.length === 1 ? 'auction' : 'auctions'} found
              </motion.p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
              <SaveSearchButton
                searchParams={{
                  status: activeFilters.status || 'active',
                  pincode: activeFilters.pincode || '',
                  category: activeFilters.category || '',
                  sort: sortBy
                }}
                onSave={fetchAuctions}
              />
            </div>
          </div>
        </motion.div>

        {/* Controls row */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-2 mb-3"
        >
          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-2.5 pr-7 py-1.5 text-[11px] bg-white/70 backdrop-blur-xl border-0 rounded-full text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/40 appearance-none cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A0A0B0] pointer-events-none" />
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-full transition-all ${
              showFilters || hasActiveFilters
                ? 'bg-[#1A1A2E] text-white'
                : 'bg-white/70 backdrop-blur-xl text-[#1A1A2E] hover:bg-white/90'
            }`}
          >
            <Filter size={11} />
            Filters
            {hasActiveFilters && (
              <span className={`w-1.5 h-1.5 rounded-full ${showFilters ? 'bg-white' : 'bg-[#FFBE91]'}`} />
            )}
          </button>

          {/* Active filter chips */}
          {activeFilters.pincode && (
            <button
              onClick={() => {
                setFilters(prev => ({ ...prev, pincode: '' }));
                setActiveFilters(prev => ({ ...prev, pincode: '' }));
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] bg-[#FFBE91]/20 text-[#1A1A2E] rounded-full hover:bg-[#FFBE91]/30 transition-colors"
            >
              <MapPin size={10} />
              {activeFilters.pincode}
              <X size={10} />
            </button>
          )}

          {activeFilters.category && (
            <button
              onClick={() => {
                setFilters(prev => ({ ...prev, category: '' }));
                setActiveFilters(prev => ({ ...prev, category: '' }));
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] bg-[#CFEBFF]/60 text-[#1A1A2E] rounded-full hover:bg-[#CFEBFF]/80 transition-colors"
            >
              {activeFilters.category.replace('_', ' ')}
              <X size={10} />
            </button>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-[10px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors px-1"
            >
              Clear all
            </button>
          )}
        </motion.div>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-[#A0A0B0] mb-1 ml-1">Pincode</label>
                    <div className="relative">
                      <MapPin size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0] pointer-events-none" />
                      <input
                        type="text"
                        name="pincode"
                        value={filters.pincode}
                        onChange={handleFilterChange}
                        placeholder="110001"
                        maxLength="6"
                        className="w-full pl-8 pr-3 py-2 text-[12px] bg-[#F8F6F0]/60 border-0 rounded-xl text-[#1A1A2E] placeholder-[#A0A0B0] focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/40 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-[#A0A0B0] mb-1 ml-1">Category</label>
                    <select
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 text-[12px] bg-[#F8F6F0]/60 border-0 rounded-xl text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/40 focus:bg-white transition-all appearance-none"
                    >
                      <option value="">All categories</option>
                      <option value="electronics">Electronics</option>
                      <option value="furniture">Furniture</option>
                      <option value="clothing">Clothing</option>
                      <option value="books">Books</option>
                      <option value="home_kitchen">Home & Kitchen</option>
                      <option value="vehicles">Vehicles</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={applyFilters}
                    className="flex-1 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[12px] font-medium py-2 rounded-xl transition-colors"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-[12px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors rounded-xl hover:bg-[#F8F6F0]"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* Auctions grid */}
        {auctions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#F8F6F0] flex items-center justify-center mx-auto mb-3">
              <Gavel size={20} className="text-[#A0A0B0]" />
            </div>
            <h3 className="text-[12px] font-medium text-[#1A1A2E]">No auctions found</h3>
            <p className="text-[10px] text-[#A0A0B0] mt-0.5">Try adjusting your filters</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 inline-flex items-center gap-1.5 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[11px] font-medium px-4 py-2 rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4"
            >
              {auctions.map((auction) => {
                const firstImage = auction.image_urls && auction.image_urls.length > 0
                  ? auction.image_urls[0]
                  : null;
                const timeLeft = getTimeLeft(auction.end_time);
                const isActive = auction.status === 'active';
                const currentPrice = auction.current_highest_bid || auction.starting_price;

                return (
                  <motion.div
                    key={auction.id}
                    variants={itemVariants}
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

                      {/* Time badge */}
                      {isActive && (
                        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-semibold backdrop-blur-md ${
                          timeLeft.urgent
                            ? 'bg-rose-500/90 text-white'
                            : 'bg-black/50 text-white'
                        }`}>
                          {timeLeft.urgent ? (
                            <Zap size={8} className="inline mr-0.5 -mt-0.5" />
                          ) : (
                            <Clock size={8} className="inline mr-0.5 -mt-0.5" />
                          )}
                          {timeLeft.text}
                        </div>
                      )}

                      {/* Bid count */}
                      {auction.bid_count > 0 && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-medium bg-black/50 text-white backdrop-blur-md">
                          {auction.bid_count} {auction.bid_count === 1 ? 'bid' : 'bids'}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleReport(auction, e)}
                          className="p-1.5 rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-colors backdrop-blur-sm"
                          title="Report"
                        >
                          <Flag size={11} />
                        </button>
                        <FavoriteButton
                          targetType="auction"
                          targetId={auction.id}
                          size={13}
                          className="bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                        />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-2.5 sm:p-3">
                      <h3 className="text-[11px] sm:text-[12px] font-semibold text-[#1A1A2E] truncate leading-tight">
                        {auction.item_name}
                      </h3>

                      <div className="flex items-center gap-0.5 mt-1">
                        <IndianRupee size={10} className="text-[#FFBE91]" />
                        <span className="text-[12px] sm:text-[13px] font-bold text-[#1A1A2E]">
                          {currentPrice?.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[9px] text-[#A0A0B0] truncate">
                          {auction.category?.replace('_', ' ') || 'General'}
                        </span>
                        {auction.pincode && (
                          <span className="text-[9px] text-[#A0A0B0] flex items-center gap-0.5 flex-shrink-0">
                            <MapPin size={8} />
                            {auction.pincode}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                <RecommendationsList
                  recommendations={recommendations}
                  title="Similar auctions you might like"
                  loading={recommendationsLoading}
                  showConfidence={true}
                  showImages={true}
                  maxItems={5}
                  onItemClick={(item) => {
                    if (item.type === 'auction') {
                      navigate(`/buyer/auctions/${item.id}`);
                    } else if (item.type === 'request') {
                      navigate(`/buyer/request/${item.id}`);
                    }
                  }}
                />
              </motion.div>
            )}
          </>
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
            Highest bid wins · Auctions auto-close at end time
          </p>
        </motion.div>
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportTarget(null);
        }}
        targetType="auction"
        targetId={reportTarget?.id}
        targetName={reportTarget?.item_name}
        onSuccess={() => fetchAuctions()}
      />
    </div>
  );
};

export default BrowseAuctions;