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
  Calendar,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  XCircle,
  Shield,
  User
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
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchAllPurchases();
  }, []);

  const fetchAllPurchases = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('=== FETCHING ALL PURCHASES ===');
      
      const purchasedResponse = await api.get('/requests?status=purchased');
      const purchasedData = purchasedResponse.data || [];
      
      let completedData = [];
      try {
        const completedResponse = await api.get('/requests?status=completed');
        completedData = completedResponse.data || [];
      } catch (err) {
        const allResponse = await api.get('/requests?status=all');
        completedData = allResponse.data.filter(r => r.status === 'completed') || [];
      }
      
      // Separate requests based on delivery_method
      const selected = [];
      const verification = [];
      
      for (const req of purchasedData) {
        // Check if delivery is confirmed or it's a pickup
        const isDeliveryConfirmed = req.delivery_confirmed_by_shop === true;
        const isPickup = req.delivery_method === 'pickup';
        const isPending = req.delivery_confirmed_by_shop === null && req.delivery_method === 'home_delivery';
        const isDenied = req.delivery_confirmed_by_shop === false;
        
        // If pickup, or home_delivery confirmed → can verify
        if (isPickup || isDeliveryConfirmed) {
          verification.push(req);
        } 
        // If home_delivery pending or denied → stay in selected tab
        else if (isPending || isDenied || !req.delivery_method) {
          selected.push(req);
        } else {
          // Fallback
          selected.push(req);
        }
      }
      
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

  // ============================================
  // Two-Way Settlement Handlers
  // ============================================
  
  const handleSwitchToPickup = async (requestId) => {
  if (!window.confirm('Switch this order to pickup? The shop cannot deliver to your address.')) return;
  
  setActionLoading(prev => ({ ...prev, [requestId]: 'pickup' }));
  try {
    // Use the dedicated switch-to-pickup endpoint
    await api.patch(`/requests/${requestId}/switch-to-pickup`);
    
    await fetchAllPurchases();
    if (selectedPurchase && selectedPurchase.id === requestId) {
      setSelectedPurchase(null);
    }
    alert('✅ Switched to pickup! You can now verify the transaction.');
  } catch (err) {
    console.error('Switch to pickup error:', err);
    const errorMsg = err.response?.data?.detail || 'Failed to switch to pickup';
    alert('❌ ' + errorMsg);
  } finally {
    setActionLoading(prev => ({ ...prev, [requestId]: false }));
  }
};


  const handleCancelOrder = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    setActionLoading(prev => ({ ...prev, [requestId]: 'cancel' }));
    try {
      await api.patch(`/requests/${requestId}`, {
        status: 'deleted'
      });
      await fetchAllPurchases();
      if (selectedPurchase && selectedPurchase.id === requestId) {
        setSelectedPurchase(null);
      }
      alert('✅ Order cancelled successfully.');
    } catch (err) {
      console.error('Cancel order error:', err);
      alert('❌ Failed to cancel order: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  // ============================================
  // Delivery Status Display
  // ============================================
  
  const getDeliveryStatusDisplay = (request) => {
    // If no delivery method set yet
    if (!request.delivery_method) {
      return {
        icon: <AlertCircle size={14} className="text-amber-600" />,
        text: 'Select delivery method',
        color: 'text-amber-600',
        bg: 'bg-amber-50/50 border-amber-100',
        showActions: false,
        canVerify: false
      };
    }
    
    // If pickup - can verify immediately
    if (request.delivery_method === 'pickup') {
      return {
        icon: <Home size={14} className="text-blue-600" />,
        text: '📍 Pickup',
        color: 'text-blue-600',
        bg: 'bg-blue-50/50 border-blue-100',
        subtext: 'You selected pickup from shop',
        showActions: false,
        canVerify: true
      };
    }
    
    // Home delivery - check shop response
    if (request.delivery_method === 'home_delivery') {
      if (request.delivery_confirmed_by_shop === true) {
        return {
          icon: <ThumbsUp size={14} className="text-emerald-600" />,
          text: '✅ Delivery Confirmed',
          color: 'text-emerald-600',
          bg: 'bg-emerald-50/50 border-emerald-100',
          subtext: `Shop confirmed delivery on ${new Date(request.delivery_response_at).toLocaleString()}`,
          showActions: false,
          canVerify: true
        };
      }
      
      if (request.delivery_confirmed_by_shop === false) {
        return {
          icon: <ThumbsDown size={14} className="text-rose-600" />,
          text: '❌ Delivery Denied',
          color: 'text-rose-600',
          bg: 'bg-rose-50/50 border-rose-100',
          subtext: 'Shop cannot deliver to your address.',
          showActions: true,
          canVerify: false,
          actionType: 'denied'
        };
      }
      
      // null/undefined = awaiting shop response
      return {
        icon: <Clock size={14} className="text-amber-600" />,
        text: '⏳ Awaiting Shop Response',
        color: 'text-amber-600',
        bg: 'bg-amber-50/50 border-amber-100',
        subtext: 'Shop is deciding whether they can deliver to your address.',
        showActions: false,
        canVerify: false
      };
    }
    
    return null;
  };

  // ============================================
  // Existing Handlers
  // ============================================

  const handleDeliverySelection = (method) => {
    setDeliveryMethod(method);
    if (method === 'delivery') {
      const address = window.prompt('Please enter your delivery address:');
      if (address) {
        setDeliveryAddress(address);
        setShowConfirmButton(true);
        alert('✅ Home Delivery selected! The shop will confirm or deny delivery.');
      } else {
        setDeliveryMethod(null);
        alert('Delivery address is required for home delivery.');
      }
    } else {
      setDeliveryAddress('Pickup from shop');
      setShowConfirmButton(true);
      alert('✅ Pickup selected! You can verify the transaction immediately.');
    }
  };

  const handleConfirmDelivery = async () => {
  if (!window.confirm('Confirm delivery method?')) return;
  
  setUpdating(true);
  try {
    console.log('Confirming delivery for:', selectedPurchase.id);
    
    const isPickup = deliveryMethod === 'pickup';
    
    // Use the dedicated delivery endpoint
    await api.patch(`/requests/${selectedPurchase.id}/delivery`, {
      delivery_method: isPickup ? 'pickup' : 'home_delivery',
      delivery_address: deliveryAddress
    });
    
    if (isPickup) {
      alert('✅ Pickup confirmed! You can now verify the transaction.');
    } else {
      alert('✅ Home Delivery selected! Waiting for shop to confirm delivery.');
    }
    
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
    // Check if verification is allowed
    const deliveryStatus = getDeliveryStatusDisplay(selectedPurchase);
    if (deliveryStatus && !deliveryStatus.canVerify) {
      alert('❌ You cannot verify this transaction yet. Please wait for the shop to confirm delivery or switch to pickup.');
      return;
    }
    
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
        label: 'Verify',
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
              <span className="text-[#FFBE91]">✦</span>
            </motion.h1>
            <p className="text-xs text-[#4A4A5A]">
              {selectedBids.length} pending · {verificationRequests.length} ready to verify · {completedRequests.length} completed
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => navigate('/buyer/dashboard')}
              variant="outline"
              className="border-[#FFDDB0] text-[#1A1A2E] hover:bg-[#FFDDB0]/30 text-sm px-4 py-2"
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Dashboard
            </Button>
            <Button 
              onClick={fetchAllPurchases}
              className="bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] text-sm px-4 py-2"
            >
              <RefreshCw size={16} className="mr-1.5" />
              Refresh
            </Button>
          </div>
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
              <span className={`
                ml-1 px-2 py-0.5 rounded-full text-[10px]
                ${activeTab === tab.id 
                  ? 'bg-[#1A1A2E]/10 text-[#1A1A2E]' 
                  : 'bg-[#FFDDB0]/30 text-[#4A4A5A]'
                }
              `}>
                {tab.count}
              </span>
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
              <div className="text-4xl mb-3">
                {activeTab === 'selected' && '📋'}
                {activeTab === 'verification' && '⏳'}
                {activeTab === 'completed' && '✅'}
              </div>
              <p className="text-[#4A4A5A] text-base">
                {activeTab === 'selected' && 'No pending orders.'}
                {activeTab === 'verification' && 'No orders ready to verify.'}
                {activeTab === 'completed' && 'No completed transactions.'}
              </p>
              <Button 
                onClick={() => navigate('/buyer/dashboard')}
                className="mt-3 bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] text-sm"
              >
                Go to Dashboard
              </Button>
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
              {currentList.map((purchase) => {
                const statusConfig = getStatusConfig(activeTab);
                const deliveryDisplay = getDeliveryStatusDisplay(purchase);
                const isLoading = actionLoading[purchase.id];
                const isVerification = activeTab === 'verification';
                
                return (
                  <motion.div
                    key={purchase.id}
                    variants={itemVariants}
                    whileHover={{ x: 4 }}
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
                        
                        {/* Delivery Status */}
                        {deliveryDisplay && (
                          <div className={`mt-2 p-2 rounded-lg border ${deliveryDisplay.bg || 'bg-gray-50/50 border-gray-100'}`}>
                            <div className="flex items-center gap-2">
                              {deliveryDisplay.icon}
                              <span className={`text-xs font-medium ${deliveryDisplay.color}`}>
                                {deliveryDisplay.text}
                              </span>
                              {isVerification && deliveryDisplay.canVerify && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                                  Ready to verify ✅
                                </span>
                              )}
                            </div>
                            {deliveryDisplay.subtext && (
                              <p className="text-[10px] text-[#4A4A5A] mt-0.5">
                                {deliveryDisplay.subtext}
                              </p>
                            )}
                            
                            {/* Action buttons for denied delivery */}
                            {deliveryDisplay.showActions && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSwitchToPickup(purchase.id);
                                  }}
                                  disabled={!!isLoading}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-auto"
                                >
                                  {isLoading === 'pickup' ? (
                                    <Loader2 size={12} className="animate-spin mr-1" />
                                  ) : (
                                    <Home size={12} className="mr-1" />
                                  )}
                                  Switch to Pickup
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelOrder(purchase.id);
                                  }}
                                  disabled={!!isLoading}
                                  variant="outline"
                                  size="sm"
                                  className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs px-3 py-1 h-auto"
                                >
                                  {isLoading === 'cancel' ? (
                                    <Loader2 size={12} className="animate-spin mr-1" />
                                  ) : (
                                    <XCircle size={12} className="mr-1" />
                                  )}
                                  Cancel Order
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

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
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-[#4A4A5A] group-hover:text-[#FFBE91] transition-colors">
                        <ChevronRight size={18} />
                      </div>
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
              <motion.button
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="flex items-center gap-1.5 text-[#4A4A5A] hover:text-[#FFBE91] transition-colors mb-4 text-sm"
              >
                <ArrowLeft size={16} />
                Back to list
              </motion.button>

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
                    {activeTab === 'selected' && 'Pending'}
                    {activeTab === 'verification' && 'Ready to Verify'}
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

                {/* Delivery Status in Detail */}
                {selectedPurchase.delivery_method && (
                  <div className="mt-4 p-4 bg-white/60 rounded-xl border border-[#FFDDB0]/30">
                    <h4 className="font-semibold text-[#1A1A2E] text-sm flex items-center gap-2 mb-2">
                      <Truck size={16} className="text-[#FFBE91]" />
                      Delivery Status
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-[#4A4A5A]">Method:</span>
                        <span className="font-medium text-[#1A1A2E] ml-1">
                          {selectedPurchase.delivery_method === 'home_delivery' ? '🏠 Home Delivery' : '📍 Pickup'}
                        </span>
                      </p>
                      
                      {selectedPurchase.delivery_method === 'home_delivery' && (
                        <>
                          {selectedPurchase.delivery_confirmed_by_shop === true && (
                            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                              <p className="text-xs text-emerald-700 flex items-center gap-1">
                                <ThumbsUp size={14} />
                                ✅ Shop confirmed delivery
                              </p>
                              {selectedPurchase.delivery_response_at && (
                                <p className="text-[10px] text-emerald-600 mt-0.5">
                                  Confirmed on: {new Date(selectedPurchase.delivery_response_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {selectedPurchase.delivery_confirmed_by_shop === false && (
                            <div className="p-2 bg-rose-50 rounded-lg border border-rose-100">
                              <p className="text-xs text-rose-700 flex items-center gap-1">
                                <ThumbsDown size={14} />
                                ❌ Shop denied delivery
                              </p>
                              <p className="text-[10px] text-rose-600 mt-0.5">
                                Please choose pickup or cancel this order.
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Button
                                  onClick={() => handleSwitchToPickup(selectedPurchase.id)}
                                  disabled={!!actionLoading[selectedPurchase.id]}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-auto"
                                >
                                  {actionLoading[selectedPurchase.id] === 'pickup' ? (
                                    <Loader2 size={12} className="animate-spin mr-1" />
                                  ) : (
                                    <Home size={12} className="mr-1" />
                                  )}
                                  Switch to Pickup
                                </Button>
                                <Button
                                  onClick={() => handleCancelOrder(selectedPurchase.id)}
                                  disabled={!!actionLoading[selectedPurchase.id]}
                                  variant="outline"
                                  size="sm"
                                  className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs px-3 py-1 h-auto"
                                >
                                  {actionLoading[selectedPurchase.id] === 'cancel' ? (
                                    <Loader2 size={12} className="animate-spin mr-1" />
                                  ) : (
                                    <XCircle size={12} className="mr-1" />
                                  )}
                                  Cancel Order
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {selectedPurchase.delivery_confirmed_by_shop === null && (
                            <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                              <p className="text-xs text-amber-700 flex items-center gap-1">
                                <Clock size={14} />
                                ⏳ Awaiting shop response
                              </p>
                              <p className="text-[10px] text-amber-600 mt-0.5">
                                The shop is deciding whether they can deliver to your address.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {selectedPurchase.delivery_method === 'pickup' && (
                        <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs text-blue-700 flex items-center gap-1">
                            <Home size={14} />
                            📍 Pickup selected
                          </p>
                          <p className="text-[10px] text-blue-600 mt-0.5">
                            You will pick up the item from the shop.
                          </p>
                        </div>
                      )}
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
                          <div className="text-[10px] text-amber-600 mt-1">⏳ Needs shop confirmation</div>
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
                          <div className="text-[10px] text-emerald-600 mt-1">✅ Instant verification</div>
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
                        <p className="text-xs text-amber-600 mt-1.5">
                          {deliveryMethod === 'delivery' 
                            ? '⏳ Waiting for shop to confirm delivery before you can verify' 
                            : '✅ You can verify immediately after confirming'}
                        </p>
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

                {/* Verification Tab - Two-Way Settlement */}
                {activeTab === 'verification' && selectedPurchase.delivery_method && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-amber-50/80 rounded-xl border-2 border-amber-200"
                  >
                    <h4 className="font-semibold text-amber-800 text-sm flex items-center gap-2 mb-2">
                      <Shield size={16} />
                      Two-Way Settlement
                    </h4>
                    
                    {/* Show settlement status */}
                    <div className="bg-white rounded-xl p-3 text-sm space-y-2">
                      {/* Shop confirmation status */}
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedPurchase.delivery_confirmed_by_shop === true ? 'bg-emerald-500' : selectedPurchase.delivery_confirmed_by_shop === false ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        <span className="text-[#4A4A5A]">Shop:</span>
                        <span className="font-medium">
                          {selectedPurchase.delivery_method === 'pickup' ? (
                            <span className="text-emerald-600">✅ Pickup confirmed</span>
                          ) : selectedPurchase.delivery_confirmed_by_shop === true ? (
                            <span className="text-emerald-600">✅ Delivery confirmed</span>
                          ) : selectedPurchase.delivery_confirmed_by_shop === false ? (
                            <span className="text-rose-600">❌ Delivery denied</span>
                          ) : (
                            <span className="text-amber-600">⏳ Awaiting confirmation</span>
                          )}
                        </span>
                      </div>
                      
                      {/* Delivery method */}
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-[#4A4A5A]" />
                        <span className="text-[#4A4A5A]">Method:</span>
                        <span className="font-medium text-[#1A1A2E]">
                          {selectedPurchase.delivery_method === 'home_delivery' ? '🏠 Home Delivery' : '📍 Pickup'}
                        </span>
                      </div>
                      
                      {/* Can verify? */}
                      <div className="mt-2 pt-2 border-t border-[#FFDDB0]/30">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getDeliveryStatusDisplay(selectedPurchase)?.canVerify ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="text-[#4A4A5A]">Status:</span>
                          <span className={`font-medium ${getDeliveryStatusDisplay(selectedPurchase)?.canVerify ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {getDeliveryStatusDisplay(selectedPurchase)?.canVerify 
                              ? '✅ Ready to verify' 
                              : '⏳ Waiting for shop confirmation'}
                          </span>
                        </div>
                        {!getDeliveryStatusDisplay(selectedPurchase)?.canVerify && (
                          <p className="text-[10px] text-amber-600 mt-1">
                            Please wait for the shop to confirm delivery before verifying.
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Verify button - only enabled if canVerify */}
                    <motion.button
                      whileHover={{ scale: getDeliveryStatusDisplay(selectedPurchase)?.canVerify ? 1.02 : 1 }}
                      whileTap={{ scale: getDeliveryStatusDisplay(selectedPurchase)?.canVerify ? 0.95 : 1 }}
                      onClick={handleVerifyTransaction}
                      disabled={updating || !getDeliveryStatusDisplay(selectedPurchase)?.canVerify}
                      className={`
                        mt-3 w-full py-2.5 rounded-lg text-sm font-medium transition-all
                        ${getDeliveryStatusDisplay(selectedPurchase)?.canVerify 
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                      `}
                    >
                      {updating ? (
                        <Loader2 size={16} className="animate-spin mx-auto" />
                      ) : getDeliveryStatusDisplay(selectedPurchase)?.canVerify ? (
                        '✅ Verify Transaction'
                      ) : (
                        '⏳ Awaiting Shop Confirmation'
                      )}
                    </motion.button>
                    {!getDeliveryStatusDisplay(selectedPurchase)?.canVerify && selectedPurchase.delivery_method === 'home_delivery' && selectedPurchase.delivery_confirmed_by_shop === null && (
                      <p className="text-[10px] text-[#4A4A5A] mt-1.5 text-center">
                        The shop will confirm or deny delivery. You'll be notified when they respond.
                      </p>
                    )}
                    {selectedPurchase.delivery_method === 'pickup' && (
                      <p className="text-[10px] text-[#4A4A5A] mt-1.5 text-center">
                        Click to verify after picking up the item from the shop.
                      </p>
                    )}
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