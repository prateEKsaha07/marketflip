import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  FileText, 
  Package, 
  Clock, 
  AlertCircle,
  Search,
  DollarSign,
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
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#1A1A2E]" />
          <p className="text-xs text-[#A0A0B0]">Loading your requests...</p>
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
              onClick={() => navigate('/buyer/requests')}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
            >
              <ArrowLeft size={14} className="mr-1.5" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-[#1A1A2E] flex items-center gap-2">
                <Clock size={20} className="text-[#FFBE91]" />
                My Open Requests
              </h1>
              <p className="text-xs text-[#A0A0B0] mt-0.5">
                {requests.length} open requests awaiting bids
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/buyer/post-request')}
            className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto flex items-center gap-1.5"
          >
            <Plus size={14} />
            New Request
          </Button>
        </motion.div>

        {error && (
          <div className="bg-rose-50/80 backdrop-blur-sm rounded-lg p-3 mb-4 text-rose-700 text-xs flex items-center gap-2 border border-rose-100">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Search & Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-4"
        >
          <div className="flex-1 min-w-[150px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
            <input
              type="text"
              placeholder="Search open requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white/80 border border-[#EEECE6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
            />
          </div>
          <div className="w-40">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/80 border border-[#EEECE6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all appearance-none"
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
          <Button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('');
            }}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-2 h-auto"
          >
            Clear
          </Button>
          <Button
            onClick={fetchOpenRequests}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-2 h-auto"
          >
            <RefreshCw size={13} className="mr-1" />
            Refresh
          </Button>
        </motion.div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-8 text-center shadow-sm border border-[#EEECE6]"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F5F3EF] flex items-center justify-center mx-auto mb-3">
              <Clock size={20} className="text-[#A0A0B0]" />
            </div>
            <h3 className="text-sm font-medium text-[#1A1A2E]">No open requests</h3>
            <p className="text-xs text-[#A0A0B0] mt-1">Post a new request to get started</p>
            <Button 
              onClick={() => navigate('/buyer/post-request')}
              className="mt-3 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto"
            >
              <Plus size={13} className="mr-1.5" />
              Post Request
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
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
                  className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-[#EEECE6] hover:shadow-md transition-all group cursor-pointer"
                  onClick={() => navigate(`/buyer/request/${request.id}`)}
                >
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Image */}
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={request.item_name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-[#F8F6F0] flex items-center justify-center flex-shrink-0">
                        <Package size={24} className="text-[#A0A0B0]" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-medium text-[#1A1A2E]">
                          {request.item_name}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle size={10} />
                          Open
                        </span>
                        {bidCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Store size={10} />
                            {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
                          </span>
                        )}
                      </div>
                      
                      {request.description && (
                        <p className="text-xs text-[#4A4A5A] line-clamp-1 mt-0.5">
                          {request.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#A0A0B0]">
                        <span className="flex items-center gap-1 font-medium text-[#1A1A2E]">
                          <DollarSign size={11} />
                          ₹{request.budget_min.toLocaleString()} - ₹{request.budget_max.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />
                          {request.pincode}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText size={11} />
                          {request.category || 'Uncategorized'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-1 h-auto"
                      >
                        <Eye size={13} className="mr-1" />
                        View
                      </Button>
                      <ChevronRight size={16} className="text-[#A0A0B0] group-hover:translate-x-1 transition-transform" />
                    </div>
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
          className="mt-4 text-center text-[10px] text-[#A0A0B0]"
        >
          <span className="flex items-center justify-center gap-1">
            <span className="text-[#FFBE91]">⚡</span>
            Open requests are actively accepting bids from shops
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default MyOpenRequests;