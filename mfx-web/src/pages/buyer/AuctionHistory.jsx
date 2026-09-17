import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import ModernNavbar from "../../components/ui/Navbar";
import { 
  ArrowLeft, 
  Loader2,
  AlertCircle,
  Store,
  Sparkles,
  History,
  X
} from 'lucide-react';
import AuctionHistoryTable from '../../components/auction/AuctionHistoryTable';
import api from '../../api/client';

const BuyerAuctionHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuctionHistory();
  }, []);

  const fetchAuctionHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/auctions?status=all');
      const allAuctions = response.data || [];

      const bidsResponse = await api.get('/bids/auction-bids');
      const buyerBids = bidsResponse.data || [];
      const auctionIdsWithBids = new Set(buyerBids.map(bid => bid.auction_id));

      const buyerAuctions = allAuctions.filter(a =>
        auctionIdsWithBids.has(a.id) ||
        a.current_highest_bidder === user?.id
      );

      setAuctions(buyerAuctions);
    } catch (err) {
      setError('Failed to load auction history: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin text-[#1A1A2E]" />
          <p className="text-[11px] text-[#A0A0B0]">Loading auction history…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
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
        {/* Back */}
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

        {/* Hero — clean */}
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

          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/50 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <History size={18} className="text-[#1A1A2E]" />
            </div>
            <div className="min-w-0 flex-1">
              <motion.h1
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.35 }}
                className="text-base sm:text-[15px] font-bold text-[#1A1A2E] truncate"
              >
                Auction History
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="text-[10px] text-[#1A1A2E]/70 mt-0.5 truncate"
              >
                {auctions.length} {auctions.length === 1 ? 'auction' : 'auctions'} you've participated in
              </motion.p>
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
              <p className="text-[11px] font-medium text-rose-600 flex-1 break-words">
                {error}
              </p>
              <button
                onClick={() => setError('')}
                className="text-rose-500 hover:text-rose-700 flex-shrink-0 p-0.5"
              >
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <AuctionHistoryTable
            role="buyer"
            auctions={auctions}
            loading={loading}
            onRefresh={fetchAuctionHistory}
            title="Your Auction Activity"
            emptyMessage="You haven't participated in any auctions yet"
          />
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-5 text-center px-2"
        >
          <p className="text-[9px] text-[#A0A0B0] flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 leading-relaxed">
            <Sparkles size={9} className="text-[#FFBE91] flex-shrink-0" />
            <span>Complete audit log of auctions you've participated in</span>
          </p>
        </motion.div>
      </div>

      {/* Mobile sticky bottom bar */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 26 }}
        className="fixed bottom-0 left-0 right-0 md:hidden p-3 bg-white/90 backdrop-blur-xl border-t border-[#EEECE6] z-40"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/buyer/auctions/browse')}
          className="w-full flex items-center justify-center gap-2 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[12px] font-semibold py-2.5 rounded-xl transition-colors"
        >
          <Store size={13} />
          Browse Auctions
        </motion.button>
      </motion.div>
    </div>
  );
};

export default BuyerAuctionHistory;