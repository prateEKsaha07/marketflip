import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Store,
  ChevronRight,
  Sparkles,
  Zap,
  Shield,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import api from '../../api/client';

const MyPurchases = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedBids, setSelectedBids] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [completedRequests, setCompletedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('selected');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAllPurchases();
  }, []);

  const fetchAllPurchases = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('=== FETCHING ALL PURCHASES ===');
      console.log('User ID:', user?.user_id);
      
      const purchasedResponse = await api.get('/requests?status=purchased');
      const purchasedData = purchasedResponse.data || [];
      console.log('Purchased data:', purchasedData);
      
      let completedData = [];
      try {
        const completedResponse = await api.get('/requests?status=completed');
        completedData = completedResponse.data || [];
      } catch (err) {
        console.warn('Could not fetch completed requests:', err.message);
        const allResponse = await api.get('/requests?status=all');
        completedData = allResponse.data.filter(r => r.status === 'completed') || [];
      }
      console.log('Completed data:', completedData);
      
      const selected = [];
      const verification = [];
      
      for (const req of purchasedData) {
        if (req.delivery_method && req.delivery_method !== '') {
          console.log(`Request ${req.id} has delivery_method: ${req.delivery_method} → Moving to Verification`);
          verification.push(req);
        } else {
          console.log(`Request ${req.id} has no delivery_method → Moving to Selected`);
          selected.push(req);
        }
      }
      
      console.log('Selected (no delivery):', selected.length);
      console.log('Verification (has delivery):', verification.length);
      console.log('Completed:', completedData.length);
      
      const selectedWithDetails = await processRequests(selected);
      const verificationWithDetails = await processRequests(verification);
      const completedWithDetails = await processRequests(completedData);
      
      setSelectedBids(selectedWithDetails);
      setVerificationRequests(verificationWithDetails);
      setCompletedRequests(completedWithDetails);
      
    } catch (err) {
      console.error('Fetch purchases error:', err);
      setError('Failed to fetch purchases: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const processRequests = async (requests) => {
    if (!requests || requests.length === 0) return [];
    
    return await Promise.all(
      requests.map(async (req) => {
        try {
          const bidsResponse = await api.get(`/requests/${req.id}/bids`);
          const selectedBid = bidsResponse.data.find(b => b.status === 'selected');
          
          let shopDetails = null;
          if (selectedBid && selectedBid.shop_id) {
            try {
              const shopResponse = await api.get(`/auth/profiles/${selectedBid.shop_id}`);
              shopDetails = shopResponse.data;
            } catch (err) {
              console.error(`Failed to fetch shop details:`, err);
              shopDetails = selectedBid.profiles || null;
            }
          }
          
          return {
            ...req,
            selectedBid: {
              ...selectedBid,
              shop_details: shopDetails || selectedBid?.profiles || null
            }
          };
        } catch (err) {
          console.error(`Failed to fetch bids for ${req.id}:`, err);
          return { ...req, selectedBid: null };
        }
      })
    );
  };

  const handleDeliverySelection = (method) => {
    setDeliveryMethod(method);
    if (method === 'delivery') {
      const address = window.prompt('Please enter your delivery address:');
      if (address) {
        setDeliveryAddress(address);
        setShowConfirmButton(true);
        alert('✅ Home Delivery selected! Click "Confirm Delivery" to proceed.');
      } else {
        setDeliveryMethod(null);
        alert('Delivery address is required for home delivery.');
      }
    } else {
      setDeliveryAddress('Pickup from shop');
      setShowConfirmButton(true);
      alert('✅ Pickup selected! Click "Confirm Delivery" to proceed.');
    }
  };

  const handleConfirmDelivery = async () => {
    if (!window.confirm('Confirm delivery method? This will move the request to verification.')) return;
    
    setUpdating(true);
    try {
      console.log('Confirming delivery for:', selectedPurchase.id);
      
      await api.patch(`/requests/${selectedPurchase.id}/delivery`, {
        delivery_method: deliveryMethod === 'delivery' ? 'home_delivery' : 'pickup',
        delivery_address: deliveryAddress
      });
      
      alert('✅ Delivery method confirmed! Request moved to Verification.');
      
      setSelectedPurchase(null);
      setDeliveryMethod(null);
      setDeliveryAddress('');
      setShowConfirmButton(false);
      
      await fetchAllPurchases();
      
    } catch (err) {
      console.error('Confirm delivery error:', err);
      alert('❌ Failed to confirm delivery: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  const handleVerifyTransaction = async () => {
    if (!window.confirm('Have you received the product and completed the transaction?')) return;
    
    setUpdating(true);
    try {
      console.log('Verifying transaction for:', selectedPurchase.id);
      
      await api.patch(`/requests/${selectedPurchase.id}/verify`);
      
      alert('🎉 Transaction verified successfully! The order is now complete.');
      
      setSelectedPurchase(null);
      setDeliveryMethod(null);
      setDeliveryAddress('');
      setShowConfirmButton(false);
      
      await fetchAllPurchases();
      
    } catch (err) {
      console.error('Verify transaction error:', err);
      alert('❌ Failed to verify transaction: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  const handleSelectPurchase = (purchase) => {
    console.log('=== SELECTING PURCHASE ===');
    console.log('Purchase:', purchase);
    console.log('Active tab:', activeTab);
    console.log('Has delivery_method:', purchase.delivery_method);
    setSelectedPurchase(purchase);
    setDeliveryMethod(null);
    setDeliveryAddress('');
    setShowConfirmButton(false);
  };

  const handleBack = () => {
    setSelectedPurchase(null);
    setDeliveryMethod(null);
    setDeliveryAddress('');
    setShowConfirmButton(false);
  };

  const getCurrentList = () => {
    if (activeTab === 'selected') return selectedBids;
    if (activeTab === 'verification') return verificationRequests;
    return completedRequests;
  };

  const currentList = getCurrentList();

  const tabs = [
    { id: 'selected', label: 'Selected', icon: <Package size={14} />, count: selectedBids.length },
    { id: 'verification', label: 'Verify', icon: <Clock size={14} />, count: verificationRequests.length },
    { id: 'completed', label: 'Completed', icon: <CheckCircle size={14} />, count: completedRequests.length },
  ];

  const tabVariants = {
    inactive: { opacity: 0.6, scale: 0.95 },
    active: { opacity: 1, scale: 1 }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };

  const getStatusConfig = (tab) => {
    switch(tab) {
      case 'selected': return { 
        bg: 'bg-emerald-50', 
        border: 'border-emerald-200', 
        icon: <Package size={14} className="text-emerald-600" />,
        label: 'Selected',
        color: 'emerald'
      };
      case 'verification': return { 
        bg: 'bg-amber-50', 
        border: 'border-amber-200', 
        icon: <Clock size={14} className="text-amber-600" />,
        label: 'Verifying',
        color: 'amber'
      };
      case 'completed': return { 
        bg: 'bg-blue-50', 
        border: 'border-blue-200', 
        icon: <CheckCircle size={14} className="text-blue-600" />,
        label: 'Completed',
        color: 'blue'
      };
      default: return { 
        bg: 'bg-gray-50', 
        border: 'border-gray-200', 
        icon: <Package size={14} className="text-gray-600" />,
        label: 'Unknown',
        color: 'gray'
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCE1]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-4 border-[#FFBE91] border-t-transparent rounded-full"
          />
          <motion.p 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-[#FFBE91] font-medium"
          >
            Loading your purchases...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFCE1] via-[#FFDDB0]/5 to-[#CFEBFF]/5 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6"
        >
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl md:text-3xl font-bold text-[#1A1A2E] flex items-center gap-2"
            >
              My Purchases
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Sparkles size={16} className="text-[#FFBE91]" />
              </motion.span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs text-[#4A4A5A]"
            >
              {selectedBids.length} selected · {verificationRequests.length} verifying · {completedRequests.length} completed
            </motion.p>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => navigate('/buyer/dashboard')}
                variant="outline"
                className="border-[#FFDDB0] text-[#1A1A2E] hover:bg-[#FFDDB0]/30 text-sm px-4 py-2"
              >
                <ArrowLeft size={16} className="mr-1.5" />
                Dashboard
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={fetchAllPurchases}
                className="bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] text-sm px-4 py-2"
              >
                <RefreshCw size={16} className="mr-1.5" />
                Refresh
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-4 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-1 mb-6 bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-[#FFDDB0]/50"
        >
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              variants={tabVariants}
              animate={activeTab === tab.id ? 'active' : 'inactive'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all text-sm font-medium
                ${activeTab === tab.id 
                  ? 'bg-[#FFBE91] text-[#1A1A2E] shadow-md' 
                  : 'text-[#4A4A5A] hover:text-[#1A1A2E] hover:bg-[#FFDDB0]/30'
                }
              `}
            >
              {tab.icon}
              {tab.label}
              <motion.span 
                key={tab.count}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`
                  ml-1 px-2 py-0.5 rounded-full text-[10px]
                  ${activeTab === tab.id 
                    ? 'bg-[#1A1A2E]/10 text-[#1A1A2E]' 
                    : 'bg-[#FFDDB0]/30 text-[#4A4A5A]'
                  }
                `}
              >
                {tab.count}
              </motion.span>
            </motion.button>
          ))}
        </motion.div>

        {/* List View */}
        <AnimatePresence mode="wait">
          {!selectedPurchase && currentList.length === 0 && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#FFDDB0]/50 p-8 md:p-12 text-center"
            >
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-4xl mb-3"
              >
                {activeTab === 'selected' && '📋'}
                {activeTab === 'verification' && '⏳'}
                {activeTab === 'completed' && '✅'}
              </motion.div>
              <p className="text-[#4A4A5A] text-base">
                {activeTab === 'selected' && 'No selected bids yet.'}
                {activeTab === 'verification' && 'No requests in verification.'}
                {activeTab === 'completed' && 'No completed transactions.'}
              </p>
              <p className="text-[#A0A0B0] text-xs mt-1">
                {activeTab === 'selected' && 'Select a bid to start the process.'}
                {activeTab === 'verification' && 'Requests with confirmed delivery will appear here.'}
                {activeTab === 'completed' && 'Completed transactions will appear here once verified.'}
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} className="mt-3">
                <Button 
                  onClick={() => navigate('/buyer/dashboard')}
                  className="bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] text-sm"
                >
                  Go to Dashboard
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* List Items */}
          {!selectedPurchase && currentList.length > 0 && (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {currentList.map((purchase, index) => {
                const statusConfig = getStatusConfig(activeTab);
                const isSelected = activeTab === 'selected';
                const isVerification = activeTab === 'verification';
                const isCompleted = activeTab === 'completed';
                
                return (
                  <motion.div
                    key={purchase.id}
                    variants={itemVariants}
                    layoutId={purchase.id}
                    whileHover={{ x: 4, transition: { type: "spring", stiffness: 400 } }}
                    onClick={() => handleSelectPurchase(purchase)}
                    className={`
                      group bg-white/80 backdrop-blur-sm rounded-xl border ${statusConfig.border}
                      hover:shadow-lg transition-all cursor-pointer p-4
                    `}
                  >
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-[#1A1A2E]">
                            {purchase.item_name}
                          </h3>
                          <span className={`
                            inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium
                            ${activeTab === 'completed' ? 'bg-blue-100 text-blue-700' : 
                              activeTab === 'verification' ? 'bg-amber-100 text-amber-700' : 
                              'bg-emerald-100 text-emerald-700'}
                          `}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-[#4A4A5A] text-xs mt-0.5 line-clamp-1">
                          {purchase.description || 'No description'}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#4A4A5A]">
                          <span>💰 ₹{purchase.budget_min.toLocaleString()} - ₹{purchase.budget_max.toLocaleString()}</span>
                          <span>📍 {purchase.pincode}</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(purchase.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {purchase.selectedBid && (
                          <div className="mt-2 p-2 bg-white/60 rounded-lg border border-[#FFDDB0]/30">
                            <p className="text-xs">
                              <span className="font-medium text-[#1A1A2E]">Shop:</span> 
                              <span className="text-[#4A4A5A] ml-1">
                                {purchase.selectedBid.shop_details?.shop_name || purchase.selectedBid.shop_name || 'Unknown'}
                              </span>
                              <span className="mx-2 text-[#D0D0D0]">|</span>
                              <span className="font-medium text-[#1A1A2E]">Price:</span>
                              <span className="text-emerald-600 font-medium ml-1">₹{purchase.selectedBid.price}</span>
                            </p>
                            {isVerification && purchase.delivery_method && (
                              <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                                {purchase.delivery_method === 'home_delivery' ? <Home size={10} /> : <Truck size={10} />}
                                {purchase.delivery_method === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                              </p>
                            )}
                            {isCompleted && purchase.completed_at && (
                              <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                                <CheckCircle size={10} />
                                Completed: {new Date(purchase.completed_at).toLocaleDateString()}
                              </p>
                            )}
                            {isSelected && !purchase.delivery_method && (
                              <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                                <AlertCircle size={10} />
                                Select delivery method
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <motion.div 
                        whileHover={{ x: 4 }}
                        className="flex-shrink-0 text-[#4A4A5A] group-hover:text-[#FFBE91] transition-colors"
                      >
                        <ChevronRight size={18} />
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail View */}
        <AnimatePresence mode="wait">
          {selectedPurchase && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Back Button */}
              <motion.button
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="flex items-center gap-1.5 text-[#4A4A5A] hover:text-[#FFBE91] transition-colors mb-4 text-sm"
              >
                <ArrowLeft size={16} />
                Back to list
              </motion.button>

              {/* Purchase Detail */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#FFDDB0]/50 p-5 md:p-6 shadow-lg">
                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1A2E]">{selectedPurchase.item_name}</h2>
                    <p className="text-xs text-[#4A4A5A] mt-0.5">
                      {selectedPurchase.description || 'No description'}
                    </p>
                  </div>
                  <span className={`
                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                    ${activeTab === 'completed' ? 'bg-blue-100 text-blue-700' : 
                      activeTab === 'verification' ? 'bg-amber-100 text-amber-700' : 
                      'bg-emerald-100 text-emerald-700'}
                  `}>
                    {activeTab === 'selected' && <Package size={12} />}
                    {activeTab === 'verification' && <Clock size={12} />}
                    {activeTab === 'completed' && <CheckCircle size={12} />}
                    {activeTab === 'selected' && 'Selected'}
                    {activeTab === 'verification' && 'Verifying'}
                    {activeTab === 'completed' && 'Completed'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[#4A4A5A]">Budget</p>
                    <p className="font-medium text-[#1A1A2E]">
                      ₹{selectedPurchase.budget_min.toLocaleString()} - ₹{selectedPurchase.budget_max.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#4A4A5A]">Pincode</p>
                    <p className="font-medium text-[#1A1A2E] flex items-center gap-1">
                      <MapPin size={14} className="text-[#4A4A5A]" />
                      {selectedPurchase.pincode}
                    </p>
                  </div>
                </div>

                {selectedPurchase.selectedBid && (
                  <div className="mt-4 p-4 bg-[#FFFCE1]/50 rounded-xl border border-[#FFDDB0]/30">
                    <h4 className="font-semibold text-[#1A1A2E] text-sm flex items-center gap-2 mb-2">
                      <Store size={16} className="text-[#FFBE91]" />
                      Shop Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <p><span className="text-[#4A4A5A]">Shop:</span> <span className="font-medium text-[#1A1A2E]">{selectedPurchase.selectedBid.shop_details?.shop_name || selectedPurchase.selectedBid.shop_name || 'Unknown'}</span></p>
                      <p><span className="text-[#4A4A5A]">Phone:</span> <span className="font-medium text-[#1A1A2E]">{selectedPurchase.selectedBid.shop_details?.phone || selectedPurchase.selectedBid.shop_phone || 'N/A'}</span></p>
                      <p className="sm:col-span-2"><span className="text-[#4A4A5A]">Address:</span> <span className="font-medium text-[#1A1A2E]">{selectedPurchase.selectedBid.shop_details?.address || selectedPurchase.selectedBid.shop_address || 'N/A'}</span></p>
                      <p><span className="text-[#4A4A5A]">Price:</span> <span className="font-medium text-emerald-600">₹{selectedPurchase.selectedBid.price}</span></p>
                      <p><span className="text-[#4A4A5A]">Selected:</span> <span className="font-medium text-[#1A1A2E]">{new Date(selectedPurchase.selectedBid.selected_at || selectedPurchase.purchased_at).toLocaleDateString()}</span></p>
                    </div>
                  </div>
                )}

                {/* Delivery Options - Selected Tab */}
                {activeTab === 'selected' && !selectedPurchase.delivery_method && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-amber-50/80 rounded-xl border-2 border-amber-200"
                  >
                    <h4 className="font-semibold text-amber-800 text-sm flex items-center gap-2 mb-3">
                      <Truck size={16} />
                      Select Delivery Method
                    </h4>
                    
                    {!deliveryMethod ? (
                      <div className="flex flex-wrap gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeliverySelection('delivery')}
                          className="flex-1 min-w-[120px] p-3 bg-white rounded-xl border-2 border-emerald-200 hover:border-emerald-400 transition-all text-center"
                        >
                          <div className="text-2xl mb-1">🏠</div>
                          <div className="text-sm font-medium text-[#1A1A2E]">Home Delivery</div>
                          <div className="text-[10px] text-[#4A4A5A]">Shop delivers to you</div>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeliverySelection('pickup')}
                          className="flex-1 min-w-[120px] p-3 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all text-center"
                        >
                          <div className="text-2xl mb-1">📍</div>
                          <div className="text-sm font-medium text-[#1A1A2E]">Pickup</div>
                          <div className="text-[10px] text-[#4A4A5A]">Collect from shop</div>
                        </motion.button>
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-white rounded-xl border-2 border-emerald-200 text-center"
                      >
                        <p className="text-sm font-medium text-[#1A1A2E]">
                          ✅ You selected <strong>{deliveryMethod === 'delivery' ? 'Home Delivery' : 'Pickup'}</strong>
                        </p>
                        {deliveryMethod === 'delivery' && (
                          <p className="text-xs text-[#4A4A5A] mt-1">📍 {deliveryAddress}</p>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleConfirmDelivery}
                          disabled={updating}
                          className="mt-3 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          {updating ? 'Confirming...' : 'Confirm Delivery →'}
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Verification Tab */}
                {activeTab === 'verification' && selectedPurchase.delivery_method && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-amber-50/80 rounded-xl border-2 border-amber-200"
                  >
                    <h4 className="font-semibold text-amber-800 text-sm flex items-center gap-2 mb-2">
                      <Clock size={16} />
                      Awaiting Verification
                    </h4>
                    <div className="bg-white rounded-xl p-3 text-sm">
                      <p className="flex items-center gap-2">
                        <span className="text-[#4A4A5A]">Delivery Method:</span>
                        <span className="font-medium text-[#1A1A2E]">
                          {selectedPurchase.delivery_method === 'home_delivery' ? '🏠 Home Delivery' : '📍 Pickup'}
                        </span>
                      </p>
                      {selectedPurchase.delivery_method === 'home_delivery' && (
                        <p className="flex items-center gap-2 mt-1">
                          <span className="text-[#4A4A5A]">Address:</span>
                          <span className="font-medium text-[#1A1A2E]">{selectedPurchase.delivery_address}</span>
                        </p>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleVerifyTransaction}
                      disabled={updating}
                      className="mt-3 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
                    >
                      {updating ? 'Verifying...' : '✅ Verify Transaction'}
                    </motion.button>
                    <p className="text-[10px] text-[#4A4A5A] mt-1.5 text-center">
                      Click after receiving the product
                    </p>
                  </motion.div>
                )}

                {/* Completed Tab */}
                {activeTab === 'completed' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-blue-50/80 rounded-xl border-2 border-blue-200"
                  >
                    <h4 className="font-semibold text-blue-800 text-sm flex items-center gap-2 mb-2">
                      <CheckCircle size={16} />
                      Transaction Complete
                    </h4>
                    <div className="bg-white rounded-xl p-3 text-sm space-y-1">
                      <p><span className="text-[#4A4A5A]">Status:</span> <span className="font-medium text-emerald-600">✅ COMPLETED</span></p>
                      <p><span className="text-[#4A4A5A]">Delivery:</span> <span className="font-medium text-[#1A1A2E]">{selectedPurchase.delivery_method === 'home_delivery' ? '🏠 Home Delivery' : '📍 Pickup'}</span></p>
                      {selectedPurchase.delivery_method === 'home_delivery' && selectedPurchase.delivery_address && (
                        <p><span className="text-[#4A4A5A]">Address:</span> <span className="font-medium text-[#1A1A2E]">{selectedPurchase.delivery_address}</span></p>
                      )}
                      <p><span className="text-[#4A4A5A]">Completed:</span> <span className="font-medium text-[#1A1A2E]">{new Date(selectedPurchase.completed_at).toLocaleDateString()}</span></p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyPurchases;