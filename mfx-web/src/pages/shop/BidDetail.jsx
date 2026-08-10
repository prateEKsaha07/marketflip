import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Award, 
  Calendar, 
  MapPin, 
  Tag, 
  DollarSign, 
  User, 
  Phone, 
  Home, 
  Store, 
  CheckCircle, 
  Clock, 
  XCircle,
  Truck,
  Package,
  FileText,
  Sparkles,
  Heart
} from 'lucide-react';
import api from '../../api/client';

const BidDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchBidDetails();
  }, [id]);

  const fetchBidDetails = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching bid details for:', id);
      const response = await api.get(`/bids/${id}/buyer`);
      console.log('Bid details:', response.data);
      setData(response.data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.detail || 'Failed to fetch bid details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const styles = {
      pending: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-200', icon: <Clock size={14} />, label: 'Pending' },
      selected: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-200', icon: <CheckCircle size={14} />, label: 'Selected' },
      rejected: { bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-200', icon: <XCircle size={14} />, label: 'Rejected' },
      purchased: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-200', icon: <Package size={14} />, label: 'Purchased' },
      completed: { bg: 'bg-violet-500/10', text: 'text-violet-600', border: 'border-violet-200', icon: <CheckCircle size={14} />, label: 'Completed' },
    };
    return styles[status] || { bg: 'bg-gray-500/10', text: 'text-gray-600', border: 'border-gray-200', icon: <Clock size={14} />, label: status?.toUpperCase() || 'Unknown' };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
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
          <div className="w-6 h-6 border-2 border-[#1A1A2E] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#A0A0B0]">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0] p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-2xl p-8 text-center shadow-lg"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <XCircle size={24} className="text-rose-500" />
          </div>
          <h2 className="text-lg font-semibold text-rose-700">Error</h2>
          <p className="text-sm text-rose-600 mt-1">{error}</p>
          <Button 
            onClick={() => navigate('/shop/dashboard')}
            className="mt-4 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-sm px-5 py-1.5 h-auto"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!data) return null;

  const { bid, request, buyer } = data;
  const bidStatus = getStatusConfig(bid.status);
  const requestStatus = getStatusConfig(request.status);
  const isSelected = bid.status === 'selected';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-wrap justify-between items-center gap-3 mb-6"
        >
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate('/shop/dashboard')}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
            >
              <ArrowLeft size={14} className="mr-1.5" />
              Dashboard
            </Button>
            <h1 className="text-lg font-semibold text-[#1A1A2E] tracking-tight">Bid Details</h1>
          </div>
          {isSelected && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-200">
              <Sparkles size={12} className="text-emerald-600" />
              <span className="text-[10px] font-medium text-emerald-600">Selected</span>
            </div>
          )}
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Success Banner - Only for selected bids */}
          {isSelected && (
            <motion.div 
              variants={itemVariants}
              className="relative overflow-hidden bg-gradient-to-r from-emerald-50/80 to-emerald-100/30 backdrop-blur-sm rounded-xl p-4 border border-emerald-200"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-emerald-200/20 blur-2xl" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Award size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-emerald-800">🎉 Congratulations!</h3>
                  <p className="text-xs text-emerald-700">Your bid has been selected by the buyer</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Bid Info */}
          <motion.div 
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-sm border border-[#EEECE6]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-[#1A1A2E]/5 flex items-center justify-center">
                <DollarSign size={13} className="text-[#1A1A2E]" />
              </div>
              <h3 className="text-xs font-medium text-[#1A1A2E] uppercase tracking-wider">Bid Details</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-[#A0A0B0]">Price</p>
                <p className="text-sm font-semibold text-[#1A1A2E]">₹{bid.price}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#A0A0B0]">Status</p>
                <span className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                  ${bidStatus.bg} ${bidStatus.text}
                `}>
                  {bidStatus.icon}
                  {bidStatus.label}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-[#A0A0B0]">Placed</p>
                <p className="text-xs text-[#1A1A2E]">{new Date(bid.created_at).toLocaleDateString()}</p>
              </div>
              {bid.note && (
                <div className="col-span-2 md:col-span-3">
                  <p className="text-[10px] text-[#A0A0B0]">Note</p>
                  <p className="text-xs text-[#1A1A2E]">{bid.note}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Request Info */}
          <motion.div 
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-sm border border-[#EEECE6]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package size={13} className="text-blue-500" />
              </div>
              <h3 className="text-xs font-medium text-[#1A1A2E] uppercase tracking-wider">Request Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <p className="text-[10px] text-[#A0A0B0]">Item</p>
                <p className="text-sm font-medium text-[#1A1A2E]">{request.item_name}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-[#A0A0B0]">Description</p>
                <p className="text-xs text-[#A0A0B0]">{request.description || 'No description'}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#A0A0B0]">Budget</p>
                <p className="text-xs font-medium text-[#1A1A2E]">₹{request.budget_min} - ₹{request.budget_max}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#A0A0B0]">Pincode</p>
                <p className="text-xs text-[#1A1A2E] flex items-center gap-1">
                  <MapPin size={11} className="text-[#A0A0B0]" />
                  {request.pincode}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-[#A0A0B0]">Status</p>
                <span className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                  ${requestStatus.bg} ${requestStatus.text}
                `}>
                  {requestStatus.icon}
                  {requestStatus.label}
                </span>
              </div>
            </div>

            {request.delivery_method && (
              <div className="mt-3 p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-2 text-xs">
                  <Truck size={13} className="text-amber-600" />
                  <span className="font-medium text-amber-700">
                    {request.delivery_method === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                  </span>
                  {request.delivery_address && (
                    <span className="text-amber-600">· {request.delivery_address}</span>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Buyer Contact */}
          <motion.div 
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-sm border border-[#EEECE6]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                <User size={13} className="text-emerald-500" />
              </div>
              <h3 className="text-xs font-medium text-[#1A1A2E] uppercase tracking-wider">Buyer Contact</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-[#A0A0B0]">Name</p>
                <p className="text-sm font-medium text-[#1A1A2E]">{buyer.name || 'Buyer'}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#A0A0B0]">Phone</p>
                <p className="text-sm text-[#1A1A2E] flex items-center gap-1">
                  <Phone size={12} className="text-[#A0A0B0]" />
                  {buyer.phone || 'N/A'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] text-[#A0A0B0]">Address</p>
                <p className="text-sm text-[#1A1A2E] flex items-start gap-1">
                  <Home size={12} className="text-[#A0A0B0] mt-0.5" />
                  {buyer.address || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#A0A0B0]">Pincode</p>
                <p className="text-sm text-[#1A1A2E]">{buyer.pincode || 'N/A'}</p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap gap-2 pt-2"
          >
            <Button 
              onClick={() => navigate('/shop/my-bids')}
              variant="outline"
              className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-4 py-1.5 h-auto"
            >
              <Package size={13} className="mr-1.5" />
              My Bids
            </Button>
            <Button 
              onClick={() => navigate('/shop/browse')}
              className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto"
            >
              <Store size={13} className="mr-1.5" />
              Browse More
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default BidDetail;