import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Package,
  MapPin,
  DollarSign,
  Store,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
  Award,
  History,
  ShoppingBag,
  Gavel,
  Target,
  User as UserIcon,
  Heart,
  Zap,
  FileText,
  TrendingUp,
  Users,
  Phone,
  MapPinned
} from 'lucide-react';
import api from '../../api/client';

const TransactionHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [shopBids, setShopBids] = useState([]);
  const [userAuctionBids, setUserAuctionBids] = useState([]);
  const [activeSection, setActiveSection] = useState('requests');
  const [activeRequestStatus, setActiveRequestStatus] = useState('all');
  const [activeAuctionStatus, setActiveAuctionStatus] = useState('all');
  const [isShopOwner, setIsShopOwner] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const role = localStorage.getItem('role') || user?.role;
      setIsShopOwner(role === 'shop_owner');

      let requestsData = [];
      let auctionsData = [];
      let bidsData = [];

      if (role === 'shop_owner') {
        // Shop owners: fetch their bids and auctions
        try {
          // Fetch all bids placed by this shop
          const bidsResponse = await api.get('/bids/shop-bids');
          bidsData = bidsResponse.data || [];
          setShopBids(bidsData);
          
          // Use the bids data directly as requests (they contain all needed info)
          requestsData = bidsData;
        } catch (err) {
          console.log('Could not fetch shop bids:', err.message);
        }

        // Fetch shop's auctions
        try {
          const auctionsResponse = await api.get('/auctions?status=all');
          auctionsData = auctionsResponse.data || [];
        } catch (err) {
          console.log('Could not fetch auctions:', err.message);
        }
      } else {
        // Buyers: fetch their requests and auction bids
        const requestsResponse = await api.get('/requests?status=all');
        requestsData = requestsResponse.data || [];

        try {
          const bidsResponse = await api.get('/bids/auction-bids');
          const auctionBids = bidsResponse.data || [];
          
          const auctionIds = [...new Set(auctionBids.map(b => b.auction_id).filter(Boolean))];
          
          if (auctionIds.length > 0) {
            const auctionPromises = auctionIds.map(id => 
              api.get(`/auctions/${id}`).catch(() => ({ data: null }))
            );
            const auctionResponses = await Promise.all(auctionPromises);
            auctionsData = auctionResponses
              .map(res => res.data)
              .filter(Boolean);
          }
          
          setUserAuctionBids(auctionBids);
        } catch (err) {
          console.log('Could not fetch auction bids:', err.message);
        }
      }

      setRequests(requestsData);
      setAuctions(auctionsData);
    } catch (err) {
      console.error('Fetch history error:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const getRequestStatusBadge = (status) => {
    const styles = {
      open: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      purchased: { bg: 'bg-blue-100', text: 'text-blue-700' },
      completed: { bg: 'bg-violet-100', text: 'text-violet-700' },
      expired: { bg: 'bg-amber-100', text: 'text-amber-700' },
      deleted: { bg: 'bg-rose-100', text: 'text-rose-700' },
    };
    const style = styles[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${style.bg} ${style.text}`}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  const getAuctionStatusBadge = (status) => {
    const styles = {
      active: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      sold: { bg: 'bg-violet-100', text: 'text-violet-700' },
      expired: { bg: 'bg-amber-100', text: 'text-amber-700' },
      cancelled: { bg: 'bg-rose-100', text: 'text-rose-700' },
    };
    const style = styles[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${style.bg} ${style.text}`}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  const getBidStatusBadge = (bid) => {
    const status = bid.status || 'pending';
    const styles = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
      selected: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Selected' },
      rejected: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Rejected' },
      withdrawn: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Withdrawn' },
    };
    const style = styles[status] || styles.pending;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getRequestBidStatusBadge = (request) => {
    const bidCount = request.bid_count || 0;
    if (bidCount === 0) {
      return <span className="text-xs text-[#A0A0B0]">No bids</span>;
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
        <Gavel size={12} />
        {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
      </span>
    );
  };

  const getAuctionBidStatusBadge = (auction) => {
    const userBid = userAuctionBids.find(b => b.auction_id === auction.id);
    
    if (!userBid) {
      return <span className="text-xs text-[#A0A0B0]">No bid</span>;
    }
    
    if (auction.winning_bid_id === userBid.id) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
          <Award size={12} />
          Won
        </span>
      );
    }
    
    if (auction.status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
          <Zap size={12} />
          Active
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
        <Target size={12} />
        ₹{userBid.bid_amount}
      </span>
    );
  };

  const getFilteredRequests = () => {
    if (activeRequestStatus === 'all') return requests;
    return requests.filter(r => {
      if (isShopOwner) {
        // For shop owners, filter bids by status
        const status = r.status || 'pending';
        return status === activeRequestStatus;
      }
      // For buyers, filter requests by status
      return r.status === activeRequestStatus;
    });
  };

  const getFilteredAuctions = () => {
    if (activeAuctionStatus === 'all') return auctions;
    return auctions.filter(a => a.status === activeAuctionStatus);
  };

  const requestStatusTabs = [
    { id: 'all', label: 'All', count: isShopOwner ? shopBids.length : requests.length },
    { id: 'open', label: isShopOwner ? 'Pending' : 'Open', count: isShopOwner ? shopBids.filter(b => b.status === 'pending').length : requests.filter(r => r.status === 'open').length },
    { id: 'selected', label: 'Selected', count: isShopOwner ? shopBids.filter(b => b.status === 'selected').length : requests.filter(r => r.status === 'purchased').length },
    { id: 'completed', label: 'Completed', count: isShopOwner ? shopBids.filter(b => b.request?.status === 'completed' || b.request?.status === 'completed').length : requests.filter(r => r.status === 'completed').length },
    { id: 'rejected', label: 'Rejected', count: isShopOwner ? shopBids.filter(b => b.status === 'rejected').length : 0 },
  ];

  const auctionStatusTabs = [
    { id: 'all', label: 'All', count: auctions.length },
    { id: 'active', label: 'Active', count: auctions.filter(a => a.status === 'active').length },
    { id: 'sold', label: 'Sold', count: auctions.filter(a => a.status === 'sold').length },
    { id: 'expired', label: 'Expired', count: auctions.filter(a => a.status === 'expired').length },
    { id: 'cancelled', label: 'Cancelled', count: auctions.filter(a => a.status === 'cancelled').length },
  ];

  const sectionTabs = [
    { id: 'requests', label: isShopOwner ? 'Bids' : 'Requests', icon: isShopOwner ? <Gavel size={16} /> : <ShoppingBag size={16} /> },
    { id: 'auctions', label: 'Auctions', icon: <Store size={16} /> },
  ];

  const filteredRequests = getFilteredRequests();
  const filteredAuctions = getFilteredAuctions();

  const totalRequests = isShopOwner ? shopBids.length : requests.length;
  const totalAuctions = auctions.length;
  const completedRequests = isShopOwner ? shopBids.filter(b => b.request?.status === 'completed' || b.request?.status === 'completed').length : requests.filter(r => r.status === 'completed').length;
  const soldAuctions = auctions.filter(a => a.status === 'sold').length;
  
  const winningBids = auctions.filter(a => 
    a.status === 'sold' && 
    a.winning_bid_id && 
    userAuctionBids.some(b => b.id === a.winning_bid_id)
  ).length;

  const activeBids = auctions.filter(a => 
    a.status === 'active' && 
    userAuctionBids.some(b => b.auction_id === a.id)
  ).length;

  const selectedBids = isShopOwner ? shopBids.filter(b => b.status === 'selected').length : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCE1]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#FFBE91]" />
          <p className="text-xs text-[#A0A0B0]">Loading history...</p>
        </div>
      </div>
    );
  }

  const backPath = isShopOwner ? '/shop/dashboard' : '/buyer/dashboard';

  return (
    <div className="min-h-screen bg-[#F8F6F0] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap justify-between items-start md:items-center gap-3 mb-6"
        >
          <div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(backPath)}
                variant="ghost"
                className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
              >
                <ArrowLeft size={14} className="mr-1.5" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-[#1A1A2E] flex items-center gap-2">
                <FileText size={24} className="text-[#FFBE91]" />
                Transaction Report
              </h1>
            </div>
            <p className="text-xs text-[#4A4A5A] mt-1 ml-10">
              Complete transaction history and report
            </p>
          </div>
          <Button
            onClick={fetchHistory}
            className="bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] text-xs px-3 py-1.5 h-auto flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            Refresh
          </Button>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          <div className="bg-white rounded-xl p-4 border border-[#EEECE6] shadow-sm">
            <p className="text-[10px] text-[#A0A0B0] uppercase tracking-wider flex items-center gap-1">
              {isShopOwner ? <Gavel size={12} /> : <ShoppingBag size={12} />}
              {isShopOwner ? 'Total Bids' : 'Total Requests'}
            </p>
            <p className="text-2xl font-bold text-[#1A1A2E]">{totalRequests}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#EEECE6] shadow-sm">
            <p className="text-[10px] text-[#A0A0B0] uppercase tracking-wider flex items-center gap-1">
              <CheckCircle size={12} className="text-emerald-600" />
              {isShopOwner ? 'Selected' : 'Completed'}
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              {isShopOwner ? selectedBids : completedRequests}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#EEECE6] shadow-sm">
            <p className="text-[10px] text-[#A0A0B0] uppercase tracking-wider flex items-center gap-1">
              <Store size={12} />
              {isShopOwner ? 'My Auctions' : 'Auctions Bid'}
            </p>
            <p className="text-2xl font-bold text-[#1A1A2E]">{totalAuctions}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#EEECE6] shadow-sm">
            <p className="text-[10px] text-[#A0A0B0] uppercase tracking-wider flex items-center gap-1">
              <Award size={12} className="text-violet-600" />
              {isShopOwner ? 'Sold' : 'Won'}
            </p>
            <p className="text-2xl font-bold text-violet-600">
              {isShopOwner ? soldAuctions : winningBids}
            </p>
          </div>
        </motion.div>

        {/* Section Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-1 mb-4 bg-white/80 backdrop-blur-sm p-1 rounded-xl border border-[#EEECE6]"
        >
          {sectionTabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveSection(tab.id)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all text-sm font-medium
                ${activeSection === tab.id
                  ? 'bg-[#1A1A2E] text-white shadow-md'
                  : 'text-[#4A4A5A] hover:text-[#1A1A2E] hover:bg-[#F5F3EF]'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Status Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-1 mb-4"
        >
          {(activeSection === 'requests' ? requestStatusTabs : auctionStatusTabs).map((tab) => (
            <button
              key={tab.id}
              onClick={() => 
                activeSection === 'requests' 
                  ? setActiveRequestStatus(tab.id) 
                  : setActiveAuctionStatus(tab.id)
              }
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${(activeSection === 'requests' ? activeRequestStatus : activeAuctionStatus) === tab.id
                  ? 'bg-[#1A1A2E] text-white shadow-sm'
                  : 'bg-white/80 text-[#4A4A5A] hover:bg-[#F5F3EF] border border-[#EEECE6]'
                }
              `}
            >
              {tab.label}
              <span className={`
                ml-1.5 px-1.5 py-0.5 rounded-full text-[9px]
                ${(activeSection === 'requests' ? activeRequestStatus : activeAuctionStatus) === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-[#EEECE6] text-[#4A4A5A]'
                }
              `}>
                {tab.count}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Content - Report Table */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeSection === 'requests' ? (
              // ====== SHOP BIDS OR BUYER REQUESTS TABLE ======
              <>
                {filteredRequests.length === 0 ? (
                  <div className="bg-white rounded-xl border border-[#EEECE6] p-12 text-center shadow-sm">
                    {isShopOwner ? <Gavel size={48} className="mx-auto text-[#A0A0B0] mb-3" /> : <Package size={48} className="mx-auto text-[#A0A0B0] mb-3" />}
                    <p className="text-[#4A4A5A]">
                      {isShopOwner 
                        ? 'No bids placed yet. Browse requests and start bidding!'
                        : 'No requests found for this status.'
                      }
                    </p>
                    {isShopOwner && (
                      <Button
                        onClick={() => navigate('/shop/browse')}
                        className="mt-3 bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] text-sm"
                      >
                        Browse Requests
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-[#EEECE6] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#F8F6F0] border-b border-[#EEECE6]">
                            {isShopOwner ? (
                              // Shop Owner - Bids Table
                              <>
                                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Item</th>
                                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Buyer</th>
                                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">My Bid</th>
                                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Budget</th>
                                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Location</th>
                                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Status</th>
                                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Bid Date</th>
                              </>
                            ) : (
                              // Buyer - Requests Table
                              <>
                                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Item</th>
                                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Category</th>
                                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Budget</th>
                                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Location</th>
                                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Bids</th>
                                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Status</th>
                                <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Date</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {isShopOwner ? (
                            // Shop Owner - Bids Rows (using bid data directly)
                            filteredRequests.map((bid) => {
                              // The request data is in bid.requests
                              const request = bid.requests || {};
                              const buyer = request.profiles || {};
                              const bidStatus = bid.status || 'pending';
                              
                              return (
                                <tr key={bid.id} className="border-b border-[#EEECE6] hover:bg-[#F8F6F0]/50 transition-colors">
                                  <td className="px-4 py-3">
                                    <div>
                                      <p className="font-medium text-[#1A1A2E]">{request.item_name || 'N/A'}</p>
                                      <p className="text-[10px] text-[#A0A0B0] truncate max-w-[150px]">
                                        {request.description || 'No description'}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div>
                                      <p className="text-xs font-medium text-[#1A1A2E]">{buyer.full_name || buyer.name || 'Buyer'}</p>
                                      <p className="text-[10px] text-[#A0A0B0] flex items-center gap-1">
                                        <Phone size={10} className="text-[#A0A0B0]" />
                                        {buyer.phone || buyer.phone_number || 'N/A'}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-xs font-semibold text-emerald-600">
                                      ₹{bid.price ? bid.price.toLocaleString() : 'N/A'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-xs text-[#4A4A5A]">
                                      ₹{request.budget_min?.toLocaleString() || 'N/A'} - ₹{request.budget_max?.toLocaleString() || 'N/A'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-xs text-[#4A4A5A] flex items-center gap-1">
                                      <MapPinned size={12} />
                                      {request.pincode || 'N/A'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {getBidStatusBadge(bid)}
                                    {bidStatus === 'selected' && (
                                      <span className="ml-1 text-[10px] font-medium text-emerald-600">✓</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-xs text-[#4A4A5A] flex items-center gap-1">
                                      <Calendar size={12} />
                                      {bid.created_at ? new Date(bid.created_at).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      }) : 'N/A'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            // Buyer - Requests Rows
                            filteredRequests.map((request) => (
                              <tr key={request.id} className="border-b border-[#EEECE6] hover:bg-[#F8F6F0]/50 transition-colors">
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-medium text-[#1A1A2E]">{request.item_name}</p>
                                    <p className="text-[10px] text-[#A0A0B0] truncate max-w-[150px]">
                                      {request.description || 'No description'}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs capitalize text-[#4A4A5A]">
                                    {request.category || 'General'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs font-medium text-[#1A1A2E]">
                                    ₹{request.budget_min ? request.budget_min.toLocaleString() : 'N/A'} - ₹{request.budget_max ? request.budget_max.toLocaleString() : 'N/A'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs text-[#4A4A5A] flex items-center gap-1">
                                    <MapPinned size={12} />
                                    {request.pincode || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {getRequestBidStatusBadge(request)}
                                </td>
                                <td className="px-4 py-3">
                                  {getRequestStatusBadge(request.status)}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs text-[#4A4A5A] flex items-center gap-1">
                                    <Calendar size={12} />
                                    {request.created_at ? new Date(request.created_at).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    }) : 'N/A'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {/* Footer */}
                    <div className="px-4 py-3 bg-[#F8F6F0] border-t border-[#EEECE6] flex justify-between items-center">
                      <span className="text-[10px] text-[#A0A0B0]">
                        Showing {filteredRequests.length} of {isShopOwner ? shopBids.length : requests.length} records
                      </span>
                      <span className="text-[10px] text-[#A0A0B0]">
                        {isShopOwner 
                          ? `${shopBids.filter(b => b.status === 'pending').length} pending · ${shopBids.filter(b => b.status === 'selected').length} selected`
                          : `${requests.filter(r => r.status === 'open').length} open · ${requests.filter(r => r.status === 'completed').length} completed`
                        }
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // ====== AUCTIONS TABLE ======
              <>
                {filteredAuctions.length === 0 ? (
                  <div className="bg-white rounded-xl border border-[#EEECE6] p-12 text-center shadow-sm">
                    <Store size={48} className="mx-auto text-[#A0A0B0] mb-3" />
                    <p className="text-[#4A4A5A]">
                      {isShopOwner 
                        ? 'No auctions created yet. Create your first auction!'
                        : 'You haven\'t placed any auction bids yet.'
                      }
                    </p>
                    {isShopOwner && (
                      <Button
                        onClick={() => navigate('/shop/auctions/post')}
                        className="mt-3 bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] text-sm"
                      >
                        Create Auction
                      </Button>
                    )}
                    {!isShopOwner && (
                      <Button
                        onClick={() => navigate('/buyer/auctions/browse')}
                        className="mt-3 bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] text-sm"
                      >
                        Browse Auctions
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-[#EEECE6] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#F8F6F0] border-b border-[#EEECE6]">
                            <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Item</th>
                            <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Category</th>
                            <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Starting</th>
                            <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Highest</th>
                            {!isShopOwner && (
                              <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Your Bid</th>
                            )}
                            <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Bids</th>
                            <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Status</th>
                            <th className="text-left px-4 py-3 text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Ends</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAuctions.map((auction) => {
                            const userBid = userAuctionBids.find(b => b.auction_id === auction.id);
                            const isWinningBid = auction.winning_bid_id === userBid?.id;
                            
                            return (
                              <tr key={auction.id} className="border-b border-[#EEECE6] hover:bg-[#F8F6F0]/50 transition-colors">
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-medium text-[#1A1A2E]">{auction.item_name || 'N/A'}</p>
                                    <p className="text-[10px] text-[#A0A0B0] truncate max-w-[150px]">
                                      {auction.description || 'No description'}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs capitalize text-[#4A4A5A]">
                                    {auction.category || 'General'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs font-medium text-[#1A1A2E]">
                                    ₹{auction.starting_price ? auction.starting_price.toLocaleString() : 'N/A'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {auction.current_highest_bid ? (
                                    <span className="text-xs font-medium text-violet-600">
                                      ₹{typeof auction.current_highest_bid === 'number' ? auction.current_highest_bid.toLocaleString() : auction.current_highest_bid}
                                      {!isShopOwner && userBid && auction.current_highest_bid === userBid.bid_amount && (
                                        <span className="text-emerald-600 ml-1">(You)</span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-[#A0A0B0]">No bids</span>
                                  )}
                                </td>
                                {!isShopOwner && (
                                  <td className="px-4 py-3">
                                    {getAuctionBidStatusBadge(auction)}
                                  </td>
                                )}
                                <td className="px-4 py-3">
                                  <span className="text-xs text-amber-600 font-medium">
                                    {auction.bid_count || 0} bids
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {getAuctionStatusBadge(auction.status)}
                                    {!isShopOwner && isWinningBid && auction.status === 'sold' && (
                                      <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                                        <Award size={12} />
                                        Won!
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs text-[#4A4A5A] flex items-center gap-1">
                                    <Calendar size={12} />
                                    {auction.end_time ? new Date(auction.end_time).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    }) : 'N/A'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* Footer */}
                    <div className="px-4 py-3 bg-[#F8F6F0] border-t border-[#EEECE6] flex justify-between items-center">
                      <span className="text-[10px] text-[#A0A0B0]">
                        Showing {filteredAuctions.length} of {auctions.length} auctions
                      </span>
                      <span className="text-[10px] text-[#A0A0B0]">
                        {auctions.filter(a => a.status === 'active').length} active · {auctions.filter(a => a.status === 'sold').length} sold
                        {!isShopOwner && ` · ${activeBids} active bids`}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-6 flex justify-between items-center">
          <div className="flex items-center gap-2 text-[10px] text-[#A0A0B0]">
            <Sparkles size={12} className="text-[#FFBE91]" />
            Report generated from {activeSection === 'requests' ? (isShopOwner ? shopBids.length : requests.length) : auctions.length} records
          </div>
          <Button
            onClick={fetchHistory}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-1 h-auto"
          >
            <RefreshCw size={12} className="mr-1.5" />
            Refresh Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;