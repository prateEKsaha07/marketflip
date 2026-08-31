import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Package, 
  Search,
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  ChevronRight,
  DollarSign,
  FileText,
  Calendar,
  Store,
  AlertCircle,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import api from '../../api/client';

const FinalizedBids = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allBids, setAllBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter bids - only show selected and rejected
  const filteredBids = useMemo(() => {
    let filtered = allBids.filter(bid => 
      bid.status === 'selected' || bid.status === 'rejected'
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(bid => bid.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(bid => {
        const itemName = bid.requests?.item_name || bid.request?.item_name || bid.item_name || '';
        return itemName.toLowerCase().includes(query);
      });
    }

    filtered.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
    return filtered;
  }, [allBids, statusFilter, searchQuery]);

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/bids');
      console.log('All bids response:', response.data);
      
      let bidsData = response.data;
      if (Array.isArray(bidsData)) {
        setAllBids(bidsData);
      } else if (bidsData && typeof bidsData === 'object') {
        if (bidsData.data && Array.isArray(bidsData.data)) {
          setAllBids(bidsData.data);
        } else {
          setAllBids([]);
        }
      } else {
        setAllBids([]);
      }
    } catch (err) {
      console.error('Fetch bids error:', err);
      setError('Failed to fetch bids: ' + (err.response?.data?.detail || err.message));
      setAllBids([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch(status) {
      case 'selected': 
        return { 
          bg: 'bg-emerald-500/10', 
          text: 'text-emerald-600', 
          icon: <CheckCircle size={12} />, 
          label: 'Selected',
          borderLeft: 'border-l-emerald-500',
          dot: 'bg-emerald-500'
        };
      case 'rejected': 
        return { 
          bg: 'bg-rose-500/10', 
          text: 'text-rose-600', 
          icon: <XCircle size={12} />, 
          label: 'Rejected',
          borderLeft: 'border-l-rose-500',
          dot: 'bg-rose-500'
        };
      default: 
        return { 
          bg: 'bg-gray-500/10', 
          text: 'text-gray-600', 
          icon: <AlertCircle size={12} />, 
          label: 'Unknown',
          borderLeft: 'border-l-gray-500',
          dot: 'bg-gray-500'
        };
    }
  };

  const goToBidDetail = (bidId) => {
    console.log('Navigating to bid detail:', bidId);
    if (!bidId) {
      console.error('No bid ID provided');
      return;
    }
    navigate(`/shop/bid/${bidId}`);
  };

  const getItemName = (bid) => {
    if (bid.requests && bid.requests.item_name) {
      return bid.requests.item_name;
    }
    if (bid.request && bid.request.item_name) {
      return bid.request.item_name;
    }
    if (bid.item_name) {
      return bid.item_name;
    }
    return 'Unknown Request';
  };

  const getRequestId = (bid) => {
    if (bid.requests && bid.requests.id) {
      return bid.requests.id;
    }
    if (bid.request && bid.request.id) {
      return bid.request.id;
    }
    if (bid.request_id) {
      return bid.request_id;
    }
    return null;
  };

  // Counts for filter tabs
  const counts = {
    all: allBids.filter(b => b.status === 'selected' || b.status === 'rejected').length,
    selected: allBids.filter(b => b.status === 'selected').length,
    rejected: allBids.filter(b => b.status === 'rejected').length,
  };

  const statusTabs = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'selected', label: 'Selected', count: counts.selected },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
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

  const tabVariants = {
    inactive: { opacity: 0.6, scale: 0.95 },
    active: { opacity: 1, scale: 1 }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#1A1A2E] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#A0A0B0]">Loading finalized bids...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6"
        >
          <div>
            <h1 className="text-lg font-semibold text-[#1A1A2E] tracking-tight flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#1A1A2E]/5 flex items-center justify-center">
                <FileCheck size={14} className="text-[#1A1A2E]" />
              </span>
              Finalized Bids
            </h1>
            <p className="text-xs text-[#A0A0B0] mt-0.5">
              {counts.selected} selected · {counts.rejected} rejected
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => navigate('/shop/my-bids')}
              variant="outline"
              className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3.5 py-1.5 h-auto"
            >
              <Package size={13} className="mr-1.5" />
              Pending Bids
            </Button>
            <Button 
              onClick={() => navigate('/shop/requests')}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3.5 py-1.5 h-auto"
            >
              <ArrowLeft size={13} className="mr-1.5" />
              Request Hub
            </Button>
          </div>
        </motion.div>

        {error && (
          <div className="bg-rose-50/80 backdrop-blur-sm rounded-lg p-3 mb-4 text-rose-700 text-xs flex items-center gap-2 border border-rose-100">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Status Filter Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-1 mb-4 bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-[#EEECE6]"
        >
          {statusTabs.map((tab) => (
            <motion.button
              key={tab.id}
              variants={tabVariants}
              animate={statusFilter === tab.id ? 'active' : 'inactive'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStatusFilter(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-medium
                ${statusFilter === tab.id 
                  ? 'bg-[#FFBE91] text-[#1A1A2E] shadow-md' 
                  : 'text-[#4A4A5A] hover:text-[#1A1A2E] hover:bg-[#FFDDB0]/30'
                }
              `}
            >
              {tab.label}
              <span className={`
                ml-1 px-1.5 py-0.5 rounded-full text-[9px]
                ${statusFilter === tab.id 
                  ? 'bg-[#1A1A2E]/10 text-[#1A1A2E]' 
                  : 'bg-[#FFDDB0]/30 text-[#4A4A5A]'
                }
              `}>
                {tab.count}
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* Search */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-2 mb-4"
        >
          <div className="flex-1 min-w-[150px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
            <input
              type="text"
              placeholder="Search finalized bids..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white/80 border border-[#EEECE6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
            />
          </div>
          <Button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-2 h-auto"
          >
            Clear
          </Button>
          <Button
            onClick={fetchBids}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-2 h-auto"
          >
            <RefreshCw size={13} className="mr-1" />
            Refresh
          </Button>
        </motion.div>
        
        {/* Bids List */}
        {filteredBids.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-8 text-center shadow-lg shadow-[#1A1A2E]/5"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F5F3EF] flex items-center justify-center mx-auto mb-3">
              <FileCheck size={20} className="text-[#A0A0B0]" />
            </div>
            <h3 className="text-sm font-medium text-[#1A1A2E]">
              {statusFilter === 'all' && 'No finalized bids'}
              {statusFilter === 'selected' && 'No selected bids'}
              {statusFilter === 'rejected' && 'No rejected bids'}
            </h3>
            <p className="text-xs text-[#A0A0B0] mt-1">
              {statusFilter === 'all' ? 'Selected and rejected bids will appear here' : 'Try checking other tabs'}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredBids.map((bid) => {
              const status = getStatusConfig(bid.status);
              const isSelected = bid.status === 'selected';
              const itemName = getItemName(bid);
              const requestId = getRequestId(bid);
              
              return (
                <motion.div
                  key={bid.id}
                  variants={itemVariants}
                  className={`
                    group relative bg-white/80 backdrop-blur-xl rounded-xl p-4
                    shadow-sm shadow-[#1A1A2E]/5 hover:shadow-md hover:shadow-[#1A1A2E]/10
                    transition-all duration-300
                    border-l-3 ${status.borderLeft}
                    cursor-pointer hover:-translate-y-0.5
                  `}
                  onClick={() => goToBidDetail(bid.id)}
                >
                  <div className={`absolute inset-0 ${status.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl`} />

                  <div className="relative z-10">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          <h3 className="text-sm font-medium text-[#1A1A2E] truncate">
                            {itemName}
                          </h3>
                          <span className={`
                            inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                            ${status.bg} ${status.text}
                          `}>
                            {status.icon}
                            {status.label}
                          </span>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock size={10} />
                              Awaiting Delivery
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#A0A0B0]">
                          <span className="flex items-center gap-1 font-medium text-[#1A1A2E]">
                            <DollarSign size={12} className="text-[#A0A0B0]" />
                            ₹{bid.price}
                          </span>
                          {bid.note && (
                            <span className="flex items-center gap-1">
                              <FileText size={11} />
                              {bid.note}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(bid.updated_at || bid.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {requestId && (
                          <p className="text-[10px] text-[#A0A0B0] mt-1 flex items-center gap-1">
                            <Store size={11} />
                            Request #{requestId.slice(0, 8)}...
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToBidDetail(bid.id);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-all ${
                            isSelected 
                              ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Eye size={12} />
                          {isSelected ? 'View Details' : 'View'}
                          <ChevronRight size={12} className="transition-transform" />
                        </button>
                      </div>
                    </div>

                    {/* Progress indicator for selected */}
                    {isSelected && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-0.5 bg-[#F5F3EF] rounded-full overflow-hidden">
                          <div className="h-full w-1/2 bg-emerald-400 rounded-full" />
                        </div>
                        <span className="text-[9px] text-[#A0A0B0]">Awaiting delivery confirmation</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FinalizedBids;