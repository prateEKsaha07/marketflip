import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import ModernNavbar from "../../components/ui/Navbar";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Package,
  MapPin,
  Store,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Award,
  History,
  ShoppingBag,
  Gavel,
  Zap,
  FileText,
  Phone,
  IndianRupee,
  ChevronRight
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

      if (role === 'shop_owner') {
        try {
          const bidsResponse = await api.get('/bids/shop-bids');
          const bidsData = bidsResponse.data || [];
          setShopBids(bidsData);
          requestsData = bidsData;
        } catch (err) {
          // silent
        }

        try {
          const auctionsResponse = await api.get('/auctions?status=all');
          auctionsData = auctionsResponse.data || [];
        } catch (err) {
          // silent
        }
      } else {
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
            auctionsData = auctionResponses.map(res => res.data).filter(Boolean);
          }

          setUserAuctionBids(auctionBids);
        } catch (err) {
          // silent
        }
      }

      setRequests(requestsData);
      setAuctions(auctionsData);
    } catch (err) {
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Status style helpers ---------- */
  const requestStatusStyles = {
    open: 'bg-emerald-50 text-emerald-700',
    purchased: 'bg-blue-50 text-blue-700',
    completed: 'bg-violet-50 text-violet-700',
    expired: 'bg-amber-50 text-amber-700',
    deleted: 'bg-rose-50 text-rose-700',
  };

  const auctionStatusStyles = {
    active: 'bg-emerald-50 text-emerald-700',
    sold: 'bg-violet-50 text-violet-700',
    expired: 'bg-amber-50 text-amber-700',
    cancelled: 'bg-rose-50 text-rose-700',
  };

  const bidStatusStyles = {
    pending: { cls: 'bg-amber-50 text-amber-700', label: 'Pending' },
    selected: { cls: 'bg-emerald-50 text-emerald-700', label: 'Selected' },
    rejected: { cls: 'bg-rose-50 text-rose-700', label: 'Rejected' },
    withdrawn: { cls: 'bg-[#F8F6F0] text-[#4A4A5A]', label: 'Withdrawn' },
  };

  const StatusPill = ({ children, cls = '' }) => (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${cls}`}>
      {children}
    </span>
  );

  const getFilteredRequests = () => {
    if (activeRequestStatus === 'all') return requests;
    return requests.filter(r => {
      if (isShopOwner) {
        const status = r.status || 'pending';
        return status === activeRequestStatus;
      }
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
    { id: 'completed', label: 'Completed', count: isShopOwner ? shopBids.filter(b => b.request?.status === 'completed').length : requests.filter(r => r.status === 'completed').length },
    ...(isShopOwner ? [{ id: 'rejected', label: 'Rejected', count: shopBids.filter(b => b.status === 'rejected').length }] : []),
  ];

  const auctionStatusTabs = [
    { id: 'all', label: 'All', count: auctions.length },
    { id: 'active', label: 'Active', count: auctions.filter(a => a.status === 'active').length },
    { id: 'sold', label: 'Sold', count: auctions.filter(a => a.status === 'sold').length },
    { id: 'expired', label: 'Expired', count: auctions.filter(a => a.status === 'expired').length },
    { id: 'cancelled', label: 'Cancelled', count: auctions.filter(a => a.status === 'cancelled').length },
  ];

  const sectionTabs = [
    { id: 'requests', label: isShopOwner ? 'Bids' : 'Requests', icon: isShopOwner ? Gavel : ShoppingBag },
    { id: 'auctions', label: 'Auctions', icon: Store },
  ];

  const filteredRequests = getFilteredRequests();
  const filteredAuctions = getFilteredAuctions();

  const totalRequests = isShopOwner ? shopBids.length : requests.length;
  const totalAuctions = auctions.length;
  const completedRequests = isShopOwner ? shopBids.filter(b => b.request?.status === 'completed').length : requests.filter(r => r.status === 'completed').length;
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

  const stats = isShopOwner
    ? [
        { label: 'Total Bids', value: totalRequests, icon: Gavel, tint: 'text-[#1A1A2E]' },
        { label: 'Selected', value: selectedBids, icon: CheckCircle, tint: 'text-emerald-600' },
        { label: 'My Auctions', value: totalAuctions, icon: Store, tint: 'text-[#1A1A2E]' },
        { label: 'Sold', value: soldAuctions, icon: Award, tint: 'text-violet-600' },
      ]
    : [
        { label: 'Requests', value: totalRequests, icon: ShoppingBag, tint: 'text-[#1A1A2E]' },
        { label: 'Completed', value: completedRequests, icon: CheckCircle, tint: 'text-emerald-600' },
        { label: 'Auctions Bid', value: totalAuctions, icon: Store, tint: 'text-[#1A1A2E]' },
        { label: 'Won', value: winningBids, icon: Award, tint: 'text-violet-600' },
      ];

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin text-[#1A1A2E]" />
          <p className="text-[11px] text-[#A0A0B0]">Loading history…</p>
        </div>
      </div>
    );
  }

  const backPath = isShopOwner ? '/shop/dashboard' : '/buyer/dashboard';
  const currentTabs = activeSection === 'requests' ? requestStatusTabs : auctionStatusTabs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-3 sm:p-4 md:p-6">
      <ModernNavbar
        navItems={isShopOwner ? [
          { name: "Dashboard", path: "/shop/dashboard", icon: "LayoutDashboard" },
          { name: "Requests", path: "/shop/requests", icon: "FileText" },
          { name: "Auctions", path: "/shop/auctions", icon: "Gavel" },
          { name: "Chats", path: "/shop/chat", icon: "MessageCircle" },
          { name: "History", path: "/shop/history", icon: "History" },
        ] : [
          { name: "Dashboard", path: "/buyer/dashboard", icon: "LayoutDashboard" },
          { name: "Requests", path: "/buyer/requests", icon: "FileText" },
          { name: "Auctions", path: "/buyer/auctions", icon: "Gavel" },
          { name: "Chats", path: "/buyer/chat", icon: "MessageCircle" },
          { name: "History", path: "/buyer/history", icon: "History" },
        ]}
        logo={{
          src: "/Logo.png",
          alt: "MarketFlip",
          link: isShopOwner ? "/shop/dashboard" : "/buyer/dashboard",
        }}
        showProfile={true}
        showLogout={true}
        showNotifications={true}
        logoutButton={{ label: "Logout", icon: "LogOut", onClick: () => {} }}
        profileButton={{
          label: "Profile",
          path: isShopOwner ? "/shop/profile" : "/buyer/profile",
          icon: "User"
        }}
      />

      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate(backPath)}
          className="flex items-center gap-1.5 mb-3 -ml-1 px-2 py-1.5 text-[11px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors rounded-lg hover:bg-[#F5F3EF]"
        >
          <ArrowLeft size={12} />
          Back
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
                <FileText size={14} className="flex-shrink-0" />
                <span className="truncate">Transaction History</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="text-[10px] text-[#1A1A2E]/70 mt-0.5 truncate"
              >
                {isShopOwner ? 'Your bids & auctions' : 'Your requests & auction bids'}
              </motion.p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={fetchHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/40 backdrop-blur-sm rounded-full flex-shrink-0 mt-0.5 hover:bg-white/60 transition-colors"
            >
              <RefreshCw size={11} className="text-[#1A1A2E]" />
              <span className="text-[10px] font-medium text-[#1A1A2E]">Refresh</span>
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

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="grid grid-cols-4 gap-2 sm:gap-3 mb-4"
        >
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white/70 backdrop-blur-xl rounded-xl p-2.5 sm:p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={10} className={s.tint} />
                  <span className="text-[9px] uppercase tracking-wide text-[#A0A0B0] truncate">{s.label}</span>
                </div>
                <p className={`text-base sm:text-lg font-bold ${s.tint} leading-none`}>{s.value}</p>
              </div>
            );
          })}
        </motion.div>

        {/* Section tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-1 p-1 bg-white/70 backdrop-blur-xl rounded-2xl mb-3"
        >
          {sectionTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium transition-all ${
                  active ? 'bg-[#1A1A2E] text-white' : 'text-[#A0A0B0] hover:text-[#4A4A5A] hover:bg-[#F8F6F0]'
                }`}
              >
                <Icon size={11} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Status tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1"
        >
          {currentTabs.map((tab) => {
            const active = (activeSection === 'requests' ? activeRequestStatus : activeAuctionStatus) === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  activeSection === 'requests'
                    ? setActiveRequestStatus(tab.id)
                    : setActiveAuctionStatus(tab.id)
                }
                className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium transition-all ${
                  active
                    ? 'bg-[#1A1A2E] text-white'
                    : 'bg-white/70 text-[#4A4A5A] hover:bg-[#F8F6F0]'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                  active ? 'bg-white/20 text-white' : 'bg-[#EEECE6] text-[#A0A0B0]'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeSection}-${activeSection === 'requests' ? activeRequestStatus : activeAuctionStatus}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {activeSection === 'requests' ? (
              <>
                {filteredRequests.length === 0 ? (
                  <EmptyState
                    icon={isShopOwner ? Gavel : Package}
                    title={isShopOwner ? 'No bids placed yet' : 'No requests found'}
                    subtitle={isShopOwner ? 'Browse requests and start bidding' : 'Try a different status filter'}
                    action={isShopOwner && (
                      <button
                        onClick={() => navigate('/shop/browse')}
                        className="mt-3 inline-flex items-center gap-1.5 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[11px] font-medium px-4 py-2 rounded-xl transition-colors"
                      >
                        Browse Requests
                      </button>
                    )}
                  />
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden lg:block bg-white/70 backdrop-blur-xl rounded-2xl overflow-hidden">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="bg-[#F8F6F0]/60">
                            {isShopOwner ? (
                              <>
                                <Th>Item</Th>
                                <Th>Buyer</Th>
                                <Th>My Bid</Th>
                                <Th>Budget</Th>
                                <Th>Location</Th>
                                <Th>Status</Th>
                                <Th>Date</Th>
                              </>
                            ) : (
                              <>
                                <Th>Item</Th>
                                <Th>Category</Th>
                                <Th>Budget</Th>
                                <Th>Location</Th>
                                <Th>Bids</Th>
                                <Th>Status</Th>
                                <Th>Date</Th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {isShopOwner
                            ? filteredRequests.map((bid) => {
                                const request = bid.requests || {};
                                const buyer = request.profiles || {};
                                const bs = bidStatusStyles[bid.status] || bidStatusStyles.pending;
                                return (
                                  <tr key={bid.id} className="hover:bg-[#F8F6F0]/40 transition-colors">
                                    <Td>
                                      <div className="min-w-0 max-w-[200px]">
                                        <p className="font-medium text-[#1A1A2E] truncate">{request.item_name || 'N/A'}</p>
                                        <p className="text-[10px] text-[#A0A0B0] truncate">{request.description || 'No description'}</p>
                                      </div>
                                    </Td>
                                    <Td>
                                      <p className="text-[11px] font-medium text-[#1A1A2E]">{buyer.full_name || buyer.name || 'Buyer'}</p>
                                      <p className="text-[10px] text-[#A0A0B0] flex items-center gap-1">
                                        <Phone size={9} />
                                        {buyer.phone || buyer.phone_number || 'N/A'}
                                      </p>
                                    </Td>
                                    <Td>
                                      <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                                        <IndianRupee size={10} />
                                        {bid.price ? bid.price.toLocaleString('en-IN') : 'N/A'}
                                      </span>
                                    </Td>
                                    <Td>
                                      <span className="text-[11px] text-[#4A4A5A] flex items-center gap-0.5">
                                        <IndianRupee size={9} />
                                        {request.budget_min?.toLocaleString('en-IN') || 'N/A'} – {request.budget_max?.toLocaleString('en-IN') || 'N/A'}
                                      </span>
                                    </Td>
                                    <Td>
                                      <span className="text-[11px] text-[#4A4A5A] flex items-center gap-1">
                                        <MapPin size={10} />
                                        {request.pincode || 'N/A'}
                                      </span>
                                    </Td>
                                    <Td>
                                      <StatusPill cls={bs.cls}>{bs.label}</StatusPill>
                                    </Td>
                                    <Td>
                                      <span className="text-[11px] text-[#4A4A5A] flex items-center gap-1">
                                        <Calendar size={10} />
                                        {bid.created_at ? new Date(bid.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                      </span>
                                    </Td>
                                  </tr>
                                );
                              })
                            : filteredRequests.map((request) => {
                                const bidCount = request.bid_count || 0;
                                return (
                                  <tr key={request.id} className="hover:bg-[#F8F6F0]/40 transition-colors">
                                    <Td>
                                      <div className="min-w-0 max-w-[200px]">
                                        <p className="font-medium text-[#1A1A2E] truncate">{request.item_name}</p>
                                        <p className="text-[10px] text-[#A0A0B0] truncate">{request.description || 'No description'}</p>
                                      </div>
                                    </Td>
                                    <Td>
                                      <span className="text-[11px] capitalize text-[#4A4A5A]">{request.category || 'General'}</span>
                                    </Td>
                                    <Td>
                                      <span className="text-[11px] font-medium text-[#1A1A2E] flex items-center gap-0.5">
                                        <IndianRupee size={9} />
                                        {request.budget_min?.toLocaleString('en-IN') || 'N/A'} – {request.budget_max?.toLocaleString('en-IN') || 'N/A'}
                                      </span>
                                    </Td>
                                    <Td>
                                      <span className="text-[11px] text-[#4A4A5A] flex items-center gap-1">
                                        <MapPin size={10} />
                                        {request.pincode || 'N/A'}
                                      </span>
                                    </Td>
                                    <Td>
                                      {bidCount === 0 ? (
                                        <span className="text-[10px] text-[#A0A0B0]">No bids</span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600">
                                          <Gavel size={10} />
                                          {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
                                        </span>
                                      )}
                                    </Td>
                                    <Td>
                                      <StatusPill cls={requestStatusStyles[request.status] || 'bg-[#F8F6F0] text-[#4A4A5A]'}>
                                        {request.status?.toUpperCase() || 'UNKNOWN'}
                                      </StatusPill>
                                    </Td>
                                    <Td>
                                      <span className="text-[11px] text-[#4A4A5A] flex items-center gap-1">
                                        <Calendar size={10} />
                                        {request.created_at ? new Date(request.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                      </span>
                                    </Td>
                                  </tr>
                                );
                              })}
                        </tbody>
                      </table>
                      <TableFooter
                        label={`Showing ${filteredRequests.length} of ${isShopOwner ? shopBids.length : requests.length} records`}
                        right={
                          isShopOwner
                            ? `${shopBids.filter(b => b.status === 'pending').length} pending · ${shopBids.filter(b => b.status === 'selected').length} selected`
                            : `${requests.filter(r => r.status === 'open').length} open · ${requests.filter(r => r.status === 'completed').length} completed`
                        }
                      />
                    </div>

                    {/* Mobile cards */}
                    <div className="lg:hidden space-y-2.5">
                      {isShopOwner
                        ? filteredRequests.map((bid) => {
                            const request = bid.requests || {};
                            const buyer = request.profiles || {};
                            const bs = bidStatusStyles[bid.status] || bidStatusStyles.pending;
                            return (
                              <motion.div
                                key={bid.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/70 backdrop-blur-xl rounded-2xl p-3.5"
                              >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <p className="text-[12px] font-semibold text-[#1A1A2E] truncate flex-1 min-w-0">{request.item_name || 'N/A'}</p>
                                  <StatusPill cls={bs.cls}>{bs.label}</StatusPill>
                                </div>
                                {request.description && (
                                  <p className="text-[10px] text-[#A0A0B0] line-clamp-1 mb-2">{request.description}</p>
                                )}
                                <div className="space-y-1.5 text-[10px]">
                                  <Row icon={Phone} label={buyer.full_name || buyer.name || 'Buyer'} sub={buyer.phone || buyer.phone_number} />
                                  <Row icon={IndianRupee} label={`My bid: ₹${bid.price?.toLocaleString('en-IN') || 'N/A'}`} accent="text-emerald-600 font-medium" />
                                  <Row icon={MapPin} label={`${request.pincode || 'N/A'} · Budget ₹${request.budget_min?.toLocaleString('en-IN') || '?'}–₹${request.budget_max?.toLocaleString('en-IN') || '?'}`} />
                                  <Row icon={Calendar} label={bid.created_at ? new Date(bid.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'} />
                                </div>
                              </motion.div>
                            );
                          })
                        : filteredRequests.map((request) => {
                            const bidCount = request.bid_count || 0;
                            return (
                              <motion.div
                                key={request.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/70 backdrop-blur-xl rounded-2xl p-3.5"
                              >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <p className="text-[12px] font-semibold text-[#1A1A2E] truncate flex-1 min-w-0">{request.item_name}</p>
                                  <StatusPill cls={requestStatusStyles[request.status] || 'bg-[#F8F6F0] text-[#4A4A5A]'}>
                                    {request.status?.toUpperCase() || 'UNKNOWN'}
                                  </StatusPill>
                                </div>
                                {request.description && (
                                  <p className="text-[10px] text-[#A0A0B0] line-clamp-1 mb-2">{request.description}</p>
                                )}
                                <div className="space-y-1.5 text-[10px]">
                                  <Row icon={IndianRupee} label={`₹${request.budget_min?.toLocaleString('en-IN') || '?'} – ₹${request.budget_max?.toLocaleString('en-IN') || '?'}`} />
                                  <Row icon={MapPin} label={`${request.pincode || 'N/A'} · ${request.category || 'General'}`} />
                                  <Row
                                    icon={Gavel}
                                    label={bidCount === 0 ? 'No bids yet' : `${bidCount} ${bidCount === 1 ? 'bid' : 'bids'}`}
                                    accent={bidCount > 0 ? 'text-amber-600 font-medium' : ''}
                                  />
                                  <Row icon={Calendar} label={request.created_at ? new Date(request.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'} />
                                </div>
                              </motion.div>
                            );
                          })}
                    </div>

                    {/* Mobile footer */}
                    <div className="lg:hidden mt-3 text-center">
                      <p className="text-[10px] text-[#A0A0B0]">
                        {filteredRequests.length} of {isShopOwner ? shopBids.length : requests.length} records
                      </p>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {filteredAuctions.length === 0 ? (
                  <EmptyState
                    icon={Store}
                    title={isShopOwner ? 'No auctions created yet' : "You haven't placed any auction bids yet"}
                    action={
                      isShopOwner ? (
                        <button
                          onClick={() => navigate('/shop/auctions/post')}
                          className="mt-3 inline-flex items-center gap-1.5 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[11px] font-medium px-4 py-2 rounded-xl transition-colors"
                        >
                          Create Auction
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/buyer/auctions/browse')}
                          className="mt-3 inline-flex items-center gap-1.5 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[11px] font-medium px-4 py-2 rounded-xl transition-colors"
                        >
                          Browse Auctions
                        </button>
                      )
                    }
                  />
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden lg:block bg-white/70 backdrop-blur-xl rounded-2xl overflow-hidden">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="bg-[#F8F6F0]/60">
                            <Th>Item</Th>
                            <Th>Category</Th>
                            <Th>Starting</Th>
                            <Th>Highest</Th>
                            {!isShopOwner && <Th>Your Bid</Th>}
                            <Th>Bids</Th>
                            <Th>Status</Th>
                            <Th>Ends</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAuctions.map((auction) => {
                            const userBid = userAuctionBids.find(b => b.auction_id === auction.id);
                            const isWinningBid = auction.winning_bid_id === userBid?.id;
                            return (
                              <tr key={auction.id} className="hover:bg-[#F8F6F0]/40 transition-colors">
                                <Td>
                                  <div className="min-w-0 max-w-[200px]">
                                    <p className="font-medium text-[#1A1A2E] truncate">{auction.item_name || 'N/A'}</p>
                                    <p className="text-[10px] text-[#A0A0B0] truncate">{auction.description || 'No description'}</p>
                                  </div>
                                </Td>
                                <Td>
                                  <span className="text-[11px] capitalize text-[#4A4A5A]">{auction.category || 'General'}</span>
                                </Td>
                                <Td>
                                  <span className="text-[11px] font-medium text-[#1A1A2E] flex items-center gap-0.5">
                                    <IndianRupee size={9} />
                                    {auction.starting_price?.toLocaleString('en-IN') || 'N/A'}
                                  </span>
                                </Td>
                                <Td>
                                  {auction.current_highest_bid ? (
                                    <span className="text-[11px] font-medium text-violet-600 flex items-center gap-0.5">
                                      <IndianRupee size={9} />
                                      {typeof auction.current_highest_bid === 'number'
                                        ? auction.current_highest_bid.toLocaleString('en-IN')
                                        : auction.current_highest_bid}
                                      {!isShopOwner && userBid && auction.current_highest_bid === userBid.bid_amount && (
                                        <span className="text-emerald-600 ml-1">(You)</span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-[#A0A0B0]">No bids</span>
                                  )}
                                </Td>
                                {!isShopOwner && (
                                  <Td>
                                    {!userBid ? (
                                      <span className="text-[10px] text-[#A0A0B0]">No bid</span>
                                    ) : isWinningBid ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                                        <Award size={10} />
                                        Won
                                      </span>
                                    ) : auction.status === 'active' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600">
                                        <Zap size={10} />
                                        Active
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#4A4A5A]">
                                        <IndianRupee size={9} />
                                        {userBid.bid_amount?.toLocaleString('en-IN')}
                                      </span>
                                    )}
                                  </Td>
                                )}
                                <Td>
                                  <span className="text-[10px] text-amber-600 font-medium">{auction.bid_count || 0} bids</span>
                                </Td>
                                <Td>
                                  <StatusPill cls={auctionStatusStyles[auction.status] || 'bg-[#F8F6F0] text-[#4A4A5A]'}>
                                    {auction.status?.toUpperCase() || 'UNKNOWN'}
                                  </StatusPill>
                                </Td>
                                <Td>
                                  <span className="text-[11px] text-[#4A4A5A] flex items-center gap-1">
                                    <Calendar size={10} />
                                    {auction.end_time ? new Date(auction.end_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                  </span>
                                </Td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <TableFooter
                        label={`Showing ${filteredAuctions.length} of ${auctions.length} auctions`}
                        right={`${auctions.filter(a => a.status === 'active').length} active · ${auctions.filter(a => a.status === 'sold').length} sold${!isShopOwner ? ` · ${activeBids} active bids` : ''}`}
                      />
                    </div>

                    {/* Mobile cards */}
                    <div className="lg:hidden space-y-2.5">
                      {filteredAuctions.map((auction) => {
                        const userBid = userAuctionBids.find(b => b.auction_id === auction.id);
                        const isWinningBid = auction.winning_bid_id === userBid?.id;
                        return (
                          <motion.div
                            key={auction.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/70 backdrop-blur-xl rounded-2xl p-3.5"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <p className="text-[12px] font-semibold text-[#1A1A2E] truncate flex-1 min-w-0">{auction.item_name || 'N/A'}</p>
                              <StatusPill cls={auctionStatusStyles[auction.status] || 'bg-[#F8F6F0] text-[#4A4A5A]'}>
                                {auction.status?.toUpperCase() || 'UNKNOWN'}
                              </StatusPill>
                            </div>
                            {auction.description && (
                              <p className="text-[10px] text-[#A0A0B0] line-clamp-1 mb-2">{auction.description}</p>
                            )}
                            <div className="space-y-1.5 text-[10px]">
                              <Row icon={IndianRupee} label={`Starting ₹${auction.starting_price?.toLocaleString('en-IN') || 'N/A'}`} />
                              {auction.current_highest_bid && (
                                <Row
                                  icon={IndianRupee}
                                  label={`Highest ₹${typeof auction.current_highest_bid === 'number' ? auction.current_highest_bid.toLocaleString('en-IN') : auction.current_highest_bid}${!isShopOwner && userBid && auction.current_highest_bid === userBid.bid_amount ? ' (You)' : ''}`}
                                  accent="text-violet-600 font-medium"
                                />
                              )}
                              {!isShopOwner && userBid && (
                                isWinningBid ? (
                                  <Row icon={Award} label="You won this auction" accent="text-emerald-600 font-medium" />
                                ) : auction.status === 'active' ? (
                                  <Row icon={Zap} label={`Your bid ₹${userBid.bid_amount?.toLocaleString('en-IN')} · Active`} accent="text-blue-600 font-medium" />
                                ) : (
                                  <Row icon={IndianRupee} label={`Your bid ₹${userBid.bid_amount?.toLocaleString('en-IN')}`} />
                                )
                              )}
                              <Row icon={Gavel} label={`${auction.bid_count || 0} ${auction.bid_count === 1 ? 'bid' : 'bids'}`} accent="text-amber-600" />
                              <Row icon={Calendar} label={auction.end_time ? new Date(auction.end_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'} />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="lg:hidden mt-3 text-center">
                      <p className="text-[10px] text-[#A0A0B0]">
                        {filteredAuctions.length} of {auctions.length} auctions
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-5 text-center"
        >
          <p className="text-[9px] text-[#A0A0B0] flex items-center justify-center gap-1">
            <Sparkles size={9} className="text-[#FFBE91]" />
            Report generated from {activeSection === 'requests' ? (isShopOwner ? shopBids.length : requests.length) : auctions.length} records
          </p>
        </motion.div>
      </div>
    </div>
  );
};

/* ---------- Small building blocks ---------- */
const Th = ({ children }) => (
  <th className="text-left px-3 py-2.5 text-[9px] font-semibold text-[#A0A0B0] uppercase tracking-wider">
    {children}
  </th>
);

const Td = ({ children }) => (
  <td className="px-3 py-3 align-top">
    {children}
  </td>
);

const TableFooter = ({ label, right }) => (
  <div className="px-4 py-2.5 bg-[#F8F6F0]/60 flex flex-wrap justify-between items-center gap-2">
    <span className="text-[10px] text-[#A0A0B0]">{label}</span>
    <span className="text-[10px] text-[#A0A0B0]">{right}</span>
  </div>
);

const Row = ({ icon: Icon, label, sub, accent = '' }) => (
  <div className="flex items-start gap-1.5">
    <Icon size={10} className={`text-[#A0A0B0] flex-shrink-0 mt-0.5 ${accent ? 'text-current' : ''}`} />
    <span className={`min-w-0 flex-1 truncate ${accent || 'text-[#4A4A5A]'}`}>{label}</span>
    {sub && <span className="text-[#A0A0B0]">{sub}</span>}
  </div>
);

const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 text-center"
  >
    <div className="w-12 h-12 rounded-2xl bg-[#F8F6F0] flex items-center justify-center mx-auto mb-3">
      <Icon size={20} className="text-[#A0A0B0]" />
    </div>
    <h3 className="text-[12px] font-medium text-[#1A1A2E]">{title}</h3>
    {subtitle && <p className="text-[10px] text-[#A0A0B0] mt-0.5">{subtitle}</p>}
    {action}
  </motion.div>
);

export default TransactionHistory;