import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Package, 
  Truck,
  Home,
  MapPin,
  Phone,
  User,
  DollarSign,
  Calendar,
  Store,
  Award,
  TrendingUp,
  Users,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import api from '../../api/client';

const CompletedTransactions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCompletedTransactions();
  }, []);

  const fetchCompletedTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching completed transactions...');
      
      const response = await api.get('/requests?status=completed');
      const completedRequests = response.data || [];
      console.log('Completed requests:', completedRequests);

      if (completedRequests.length === 0) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      const transactionsWithDetails = await Promise.all(
        completedRequests.map(async (req) => {
          try {
            const bidsResponse = await api.get(`/requests/${req.id}/bids`);
            const selectedBid = bidsResponse.data.find(b => b.status === 'selected');
            
            let buyerInfo = null;
            try {
              const buyerResponse = await api.get(`/auth/profiles/${req.buyer_id}`);
              buyerInfo = buyerResponse.data;
            } catch (err) {
              console.error('Failed to fetch buyer:', err);
              buyerInfo = { 
                shop_name: 'Buyer', 
                phone: 'N/A', 
                address: 'N/A',
                pincode: 'N/A'
              };
            }
            
            return {
              ...req,
              selectedBid: selectedBid || { price: 'N/A' },
              buyer: buyerInfo
            };
          } catch (err) {
            console.error(`Failed to fetch bids for ${req.id}:`, err);
            return {
              ...req,
              selectedBid: { price: 'N/A' },
              buyer: { shop_name: 'Buyer', phone: 'N/A', address: 'N/A', pincode: 'N/A' }
            };
          }
        })
      );

      setTransactions(transactionsWithDetails);
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch completed transactions');
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryLabel = (method) => {
    if (method === 'home_delivery') return 'Home Delivery';
    if (method === 'pickup') return 'Pickup';
    return 'N/A';
  };

  const getDeliveryIcon = (method) => {
    if (method === 'home_delivery') return <Home size={13} className="text-emerald-600" />;
    if (method === 'pickup') return <Truck size={13} className="text-blue-600" />;
    return null;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.06 }
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

  const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#EEECE6] p-3 text-center flex-1 min-w-[80px]">
      <div className="flex items-center justify-center gap-1.5 mb-0.5">
        <span className="text-[#A0A0B0]">{icon}</span>
        <span className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );

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

  // Calculate stats
  const totalCompleted = transactions.length;
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.selectedBid?.price || 0), 0);
  const avgPrice = totalCompleted > 0 ? Math.round(totalRevenue / totalCompleted) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-wrap justify-between items-center gap-3 mb-6"
        >
          <div>
            <h1 className="text-lg font-semibold text-[#1A1A2E] tracking-tight flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle size={14} className="text-emerald-600" />
              </span>
              Completed Transactions
            </h1>
            <p className="text-xs text-[#A0A0B0] mt-0.5">{totalCompleted} completed · ₹{totalRevenue.toLocaleString()} total</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={fetchCompletedTransactions}
              variant="outline"
              className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
            >
              <RefreshCw size={13} className="mr-1.5" />
              Refresh
            </Button>
            <Button 
              onClick={() => navigate('/shop/dashboard')}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
            >
              <ArrowLeft size={13} className="mr-1.5" />
              Dashboard
            </Button>
          </div>
        </motion.div>

        {/* Stats Row */}
        {totalCompleted > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-2 mb-4"
          >
            <StatCard 
              label="Completed" 
              value={totalCompleted} 
              icon={<CheckCircle size={13} />}
              color="text-emerald-600"
            />
            <StatCard 
              label="Revenue" 
              value={`₹${totalRevenue.toLocaleString()}`} 
              icon={<DollarSign size={13} />}
              color="text-[#1A1A2E]"
            />
            <StatCard 
              label="Avg Price" 
              value={`₹${avgPrice.toLocaleString()}`} 
              icon={<TrendingUp size={13} />}
              color="text-blue-600"
            />
          </motion.div>
        )}

        {error && (
          <div className="bg-rose-50/80 backdrop-blur-sm rounded-lg p-3 mb-4 text-rose-700 text-xs flex items-center gap-2 border border-rose-100">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-8 text-center shadow-sm border border-[#EEECE6]"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F5F3EF] flex items-center justify-center mx-auto mb-3">
              <Package size={20} className="text-[#A0A0B0]" />
            </div>
            <h3 className="text-sm font-medium text-[#1A1A2E]">No completed transactions</h3>
            <p className="text-xs text-[#A0A0B0] mt-1">When a buyer verifies a transaction, it will appear here</p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {transactions.map((txn) => (
              <motion.div
                key={txn.id}
                variants={itemVariants}
                className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-sm border border-[#EEECE6] hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-[#1A1A2E]">
                        {txn.item_name}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600">
                        <CheckCircle size={10} />
                        Completed
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#A0A0B0]">
                      <span className="flex items-center gap-1 font-medium text-[#1A1A2E]">
                        <DollarSign size={12} />
                        ₹{txn.selectedBid?.price || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        {getDeliveryIcon(txn.delivery_method)}
                        {getDeliveryLabel(txn.delivery_method)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {txn.completed_at ? new Date(txn.completed_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buyer Info */}
                <div className="mt-3 p-3 bg-[#F8F6F0] rounded-lg">
                  <div className="flex items-center gap-2 mb-1.5">
                    <User size={13} className="text-[#A0A0B0]" />
                    <span className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Buyer</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
                    <p className="text-[#1A1A2E] flex items-center gap-1.5">
                      <Store size={12} className="text-[#A0A0B0]" />
                      <span className="font-medium">{txn.buyer?.shop_name || 'Buyer'}</span>
                    </p>
                    <p className="text-[#1A1A2E] flex items-center gap-1.5">
                      <Phone size={12} className="text-[#A0A0B0]" />
                      {txn.buyer?.phone || 'N/A'}
                    </p>
                    <p className="text-[#1A1A2E] flex items-center gap-1.5 sm:col-span-2">
                      <MapPin size={12} className="text-[#A0A0B0]" />
                      {txn.buyer?.address || 'N/A'}
                    </p>
                    {txn.buyer?.pincode && (
                      <p className="text-[#1A1A2E] flex items-center gap-1.5">
                        <MapPin size={12} className="text-[#A0A0B0]" />
                        {txn.buyer.pincode}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CompletedTransactions;