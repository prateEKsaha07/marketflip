import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Package, 
  Search,
  Edit, 
  Trash2, 
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
  Pencil,
  Save,
  Loader2,
  FileCheck,
  History,
  Award,
  List
} from 'lucide-react';
import api from '../../api/client';

const MyBids = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allBids, setAllBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({ price: '', note: '' });
  const [updating, setUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter bids based on selected status
  const filteredBids = useMemo(() => {
    if (statusFilter === 'all') {
      return allBids;
    } else if (statusFilter === 'selected') {
      return allBids.filter(bid => bid.status === 'selected' && bid.requests?.status !== 'completed');
    } else if (statusFilter === 'rejected') {
      return allBids.filter(bid => bid.status === 'rejected');
    } else if (statusFilter === 'completed') {
      // A bid is "completed" when the associated request is completed
      return allBids.filter(bid => bid.requests?.status === 'completed');
    }
    return allBids;
  }, [allBids, statusFilter]);

  useEffect(() => {
    fetchMyBids();
  }, []);

  const fetchMyBids = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/bids');
      console.log('My bids response:', response.data);
      
      let bidsData = response.data;
      if (Array.isArray(bidsData)) {
        // Log each bid to see the structure
        bidsData.forEach((bid, index) => {
          console.log(`Bid ${index}:`, {
            id: bid.id,
            status: bid.status,
            'requests?.status': bid.requests?.status,
            'request?.status': bid.request?.status,
            requests: bid.requests,
            request: bid.request
          });
        });
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
      setError('Failed to fetch your bids: ' + (err.response?.data?.detail || err.message));
      setAllBids([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (bid) => {
    setEditing(bid.id);
    setEditData({
      price: bid.price,
      note: bid.note || ''
    });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleUpdateBid = async (bidId) => {
    if (!editData.price || parseInt(editData.price) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setUpdating(true);
    try {
      const payload = {
        price: parseInt(editData.price),
        note: editData.note
      };
      
      await api.patch(`/bids/${bidId}`, payload);
      alert('Bid updated successfully');
      
      setEditing(null);
      fetchMyBids();
    } catch (err) {
      alert('Failed to update bid: ' + (err.response?.data?.detail || 'Unknown error'));
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to withdraw this bid?')) return;
    
    try {
      await api.delete(`/bids/${bidId}`);
      alert('Bid withdrawn successfully');
      fetchMyBids();
    } catch (err) {
      alert('Failed to delete bid: ' + (err.response?.data?.detail || 'Unknown error'));
      console.error(err);
    }
  };

  const getStatusConfig = (status) => {
    switch(status) {
      case 'pending': 
        return { 
          color: '#D4A000', 
          bg: 'bg-amber-500/10', 
          text: 'text-amber-600', 
          icon: <Clock size={12} />, 
          label: 'Pending',
          borderLeft: 'border-l-amber-500'
        };
      case 'selected': 
        return { 
          color: '#2D7A3A', 
          bg: 'bg-emerald-500/10', 
          text: 'text-emerald-600', 
          icon: <CheckCircle size={12} />, 
          label: 'Selected',
          borderLeft: 'border-l-emerald-500'
        };
      case 'rejected': 
        return { 
          color: '#B33A3A', 
          bg: 'bg-rose-500/10', 
          text: 'text-rose-600', 
          icon: <XCircle size={12} />, 
          label: 'Rejected',
          borderLeft: 'border-l-rose-500'
        };
      case 'completed': 
        return { 
          color: '#7C3AED', 
          bg: 'bg-violet-500/10', 
          text: 'text-violet-600', 
          icon: <Award size={12} />, 
          label: 'Completed',
          borderLeft: 'border-l-violet-500'
        };
      default: 
        return { 
          color: '#6c757d', 
          bg: 'bg-gray-500/10', 
          text: 'text-gray-600', 
          icon: <AlertCircle size={12} />, 
          label: 'Unknown',
          borderLeft: 'border-l-gray-500'
        };
    }
  };

  // Get the actual status for display (bid status vs request status)
  const getDisplayStatus = (bid) => {
    // Check both possible property names
    const requestStatus = bid.requests?.status || bid.request?.status;
    if (bid.status === 'selected' && requestStatus === 'completed') {
      return 'completed';
    }
    return bid.status;
  };

  const goToBidDetail = (bidId) => {
    console.log('=== goToBidDetail called ===');
    console.log('Bid ID:', bidId);
    
    if (!bidId) {
      console.error('No bid ID provided');
      return;
    }
    
    const url = `/shop/bid/${bidId}`;
    console.log('Navigating to:', url);
    navigate(url);
  };

  const handleCardClick = (bid) => {
    console.log('=== Card clicked ===');
    console.log('Bid:', bid);
    console.log('Bid status:', bid.status);
    console.log('Bid ID:', bid.id);
    
    goToBidDetail(bid.id);
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
    all: allBids.length,
    selected: allBids.filter(b => {
      const reqStatus = b.requests?.status || b.request?.status;
      return b.status === 'selected' && reqStatus !== 'completed';
    }).length,
    rejected: allBids.filter(b => b.status === 'rejected').length,
    completed: allBids.filter(b => {
      const reqStatus = b.requests?.status || b.request?.status;
      return reqStatus === 'completed';
    }).length,
  };

  const statusTabs = [
    { id: 'all', label: 'All', count: counts.all, icon: <List size={13} /> },
    { id: 'selected', label: 'Selected', count: counts.selected, icon: <CheckCircle size={13} /> },
    { id: 'rejected', label: 'Rejected', count: counts.rejected, icon: <XCircle size={13} /> },
    { id: 'completed', label: 'Completed', count: counts.completed, icon: <Award size={13} /> },
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
          <p className="text-xs text-[#A0A0B0]">Loading...</p>
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
                <Package size={14} className="text-[#1A1A2E]" />
              </span>
              My Bids
            </h1>
            <p className="text-xs text-[#A0A0B0] mt-0.5">
              {counts.all} total · {counts.selected} selected · {counts.rejected} rejected · {counts.completed} completed
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => navigate('/shop/finalized-bids')}
              variant="outline"
              className="border-[#FFDDB0] text-[#1A1A2E] hover:bg-[#FFDDB0]/30 text-xs px-3.5 py-1.5 h-auto"
            >
              <FileCheck size={13} className="mr-1.5" />
              Finalized Bids
            </Button>
            <Button 
              onClick={() => navigate('/shop/browse')}
              className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-3.5 py-1.5 shadow-sm hover:shadow transition-all h-auto"
            >
              <Search size={13} className="mr-1.5" />
              Browse
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
              {tab.icon}
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
        
        {/* Bids List */}
        {filteredBids.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-8 text-center shadow-lg shadow-[#1A1A2E]/5"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F5F3EF] flex items-center justify-center mx-auto mb-3">
              {statusFilter === 'all' && <List size={20} className="text-[#A0A0B0]" />}
              {statusFilter === 'selected' && <CheckCircle size={20} className="text-[#A0A0B0]" />}
              {statusFilter === 'rejected' && <XCircle size={20} className="text-[#A0A0B0]" />}
              {statusFilter === 'completed' && <Award size={20} className="text-[#A0A0B0]" />}
            </div>
            <h3 className="text-sm font-medium text-[#1A1A2E]">
              {statusFilter === 'all' && 'No bids placed yet'}
              {statusFilter === 'selected' && 'No selected bids'}
              {statusFilter === 'rejected' && 'No rejected bids'}
              {statusFilter === 'completed' && 'No completed bids'}
            </h3>
            <p className="text-xs text-[#A0A0B0] mt-1">
              {statusFilter === 'all' ? 'Start bidding on requests to see them here' : 'Try checking other tabs'}
            </p>
            {statusFilter === 'all' && (
              <Button 
                onClick={() => navigate('/shop/browse')}
                className="mt-3 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-5 py-1.5 h-auto"
              >
                <Search size={13} className="mr-1.5" />
                Browse Requests
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredBids.map((bid) => {
              const displayStatus = getDisplayStatus(bid);
              const status = getStatusConfig(displayStatus);
              const isEditing = editing === bid.id;
              const isSelected = bid.status === 'selected' && (bid.requests?.status || bid.request?.status) !== 'completed';
              const isPending = bid.status === 'pending';
              const isCompleted = (bid.requests?.status || bid.request?.status) === 'completed';
              const isRejected = bid.status === 'rejected';
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
                  onClick={() => handleCardClick(bid)}
                >
                  <div className={`absolute inset-0 ${status.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl`} />

                  {isEditing ? (
                    <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
                          <Pencil size={12} className="text-amber-600" />
                        </div>
                        <h4 className="text-xs font-medium text-[#1A1A2E]">Edit Bid</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-medium text-[#A0A0B0] mb-1">Price (₹)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0] text-xs">₹</span>
                            <input
                              type="number"
                              name="price"
                              value={editData.price}
                              onChange={handleEditChange}
                              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/80 backdrop-blur-sm border-0 rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/10 transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-[#A0A0B0] mb-1">Note</label>
                          <input
                            type="text"
                            name="note"
                            value={editData.note}
                            onChange={handleEditChange}
                            className="w-full px-3 py-1.5 text-xs bg-white/80 backdrop-blur-sm border-0 rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)] focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/10 transition-all"
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleUpdateBid(bid.id)}
                          disabled={updating}
                          className="px-4 py-1.5 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-sm hover:shadow"
                        >
                          {updating ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          {updating ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="px-4 py-1.5 bg-[#F5F3EF] hover:bg-[#EEECE6] text-[#1A1A2E] text-xs rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
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
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                                <Clock size={10} />
                                Pending
                              </span>
                            )}
                            {isCompleted && (bid.requests?.completed_via_override || bid.request?.completed_via_override) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                                <AlertCircle size={10} />
                                Override
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
                              {new Date(bid.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {requestId && (
                            <p className="text-[10px] text-[#A0A0B0] mt-1 flex items-center gap-1">
                              <Store size={11} />
                              Request #{requestId.slice(0, 8)}...
                            </p>
                          )}
                          {isCompleted && (bid.requests?.completed_at || bid.request?.completed_at) && (
                            <p className="text-[10px] text-violet-600 mt-0.5 flex items-center gap-1">
                              <CheckCircle size={10} />
                              Completed on {new Date(bid.requests?.completed_at || bid.request?.completed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isPending && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditClick(bid); }}
                                className="p-1.5 rounded-lg hover:bg-[#F5F3EF] text-[#A0A0B0] hover:text-[#1A1A2E] transition-all"
                                title="Edit bid"
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteBid(bid.id); }}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-[#A0A0B0] hover:text-rose-500 transition-all"
                                title="Withdraw bid"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                          {(isSelected || isCompleted || isRejected) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('View Details button clicked for bid:', bid.id);
                                goToBidDetail(bid.id);
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-all ${
                                isSelected 
                                  ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20'
                                  : isCompleted
                                  ? 'bg-violet-500/10 text-violet-700 hover:bg-violet-500/20'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              <Eye size={12} />
                              View Details
                              <ChevronRight size={12} className="transition-transform" />
                            </button>
                          )}
                        </div>
                      </div>

                      {isPending && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-0.5 bg-[#F5F3EF] rounded-full overflow-hidden">
                            <div className="h-full w-1/3 bg-amber-400 rounded-full animate-pulse" />
                          </div>
                          <span className="text-[9px] text-[#A0A0B0]">Awaiting response</span>
                        </div>
                      )}

                      {isSelected && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-0.5 bg-[#F5F3EF] rounded-full overflow-hidden">
                            <div className="h-full w-1/2 bg-emerald-400 rounded-full" />
                          </div>
                          <span className="text-[9px] text-emerald-600">Awaiting delivery</span>
                        </div>
                      )}

                      {isCompleted && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-0.5 bg-violet-200 rounded-full overflow-hidden">
                            <div className="h-full w-full bg-violet-400 rounded-full" />
                          </div>
                          <span className="text-[9px] text-violet-600">Completed</span>
                        </div>
                      )}

                      {isRejected && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-0.5 bg-rose-200 rounded-full overflow-hidden">
                            <div className="h-full w-full bg-rose-400 rounded-full" />
                          </div>
                          <span className="text-[9px] text-rose-600">Rejected</span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyBids;