import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Package, 
  Loader2,
  AlertCircle,
  RefreshCw,
  Store
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
      // Fetch all auctions
      const response = await api.get('/auctions?status=all');
      const allAuctions = response.data || [];
      
      // Filter to auctions where buyer has bid or won
      // Get all auction IDs where buyer has placed a bid
      const bidsResponse = await api.get('/bids/auction-bids');
      const buyerBids = bidsResponse.data || [];
      const auctionIdsWithBids = new Set(buyerBids.map(bid => bid.auction_id));
      
      // Also include auctions where buyer is the winner (current_highest_bidder)
      const buyerAuctions = allAuctions.filter(a => 
        auctionIdsWithBids.has(a.id) || 
        a.current_highest_bidder === user?.id
      );
      
      setAuctions(buyerAuctions);
    } catch (err) {
      console.error('Fetch auction history error:', err);
      setError('Failed to load auction history: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#1A1A2E]" />
          <p className="text-xs text-[#A0A0B0]">Loading auction history...</p>
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
              onClick={() => navigate('/buyer/auctions')}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
            >
              <ArrowLeft size={14} className="mr-1.5" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-[#1A1A2E] flex items-center gap-2">
                <Package size={20} className="text-[#FFBE91]" />
                Auction History
              </h1>
              <p className="text-xs text-[#A0A0B0] mt-0.5">
                Complete record of auctions you've participated in
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/buyer/browse-auctions')}
            className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto flex items-center gap-1.5"
          >
            <Store size={14} />
            Browse Auctions
          </Button>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-50/80 backdrop-blur-sm rounded-lg p-3 mb-4 text-rose-700 text-xs flex items-center gap-2 border border-rose-100">
            <AlertCircle size={14} />
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-auto text-rose-500 hover:text-rose-700"
            >
              ×
            </button>
          </div>
        )}

        {/* History Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
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

        {/* Footer Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center text-[10px] text-[#A0A0B0]"
        >
          <span className="flex items-center justify-center gap-1">
            <span className="text-[#FFBE91]">📋</span>
            Complete audit log of all auctions you've bid on or won · Click the eye icon to view details
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default BuyerAuctionHistory;