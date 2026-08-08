import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
    { id: 'selected', label: 'Selected Bids', icon: '📋', count: selectedBids.length },
    { id: 'verification', label: 'Verification', icon: '⏳', count: verificationRequests.length },
    { id: 'completed', label: 'Completed ✅', icon: '✅', count: completedRequests.length },
  ];

  if (loading) {
    return (
      <div style={{ 
        maxWidth: '900px', 
        margin: '0 auto',
        textAlign: 'center',
        paddingTop: '50px'
      }}>
        <h2>Loading your purchases...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>My Purchases</h1>
        <div>
          <button 
            onClick={() => navigate('/buyer/dashboard')}
            style={{ 
              marginRight: '10px',
              padding: '8px 16px', 
              cursor: 'pointer',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Back to Dashboard
          </button>
          <button 
            onClick={fetchAllPurchases}
            style={{ 
              padding: '8px 16px', 
              cursor: 'pointer',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: '20px', 
          padding: '10px', 
          border: '1px solid red', 
          borderRadius: '4px' 
        }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        borderBottom: '1px solid #dee2e6',
        flexWrap: 'wrap'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === tab.id ? '#007bff' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#495057',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #007bff' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              borderRadius: '4px 4px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {tab.icon} {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* List View */}
      {!selectedPurchase && currentList.length === 0 && !error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h2 style={{ color: '#6c757d' }}>
            {activeTab === 'selected' && '📋 No Selected Bids'}
            {activeTab === 'verification' && '⏳ No Requests in Verification'}
            {activeTab === 'completed' && '✅ No Completed Transactions'}
          </h2>
          <p style={{ color: '#6c757d', margin: '20px 0' }}>
            {activeTab === 'selected' && 'When you select a bid, it will appear here.'}
            {activeTab === 'verification' && 'Requests with confirmed delivery will appear here.'}
            {activeTab === 'completed' && 'Completed transactions will appear here once verified.'}
          </p>
          <button
            onClick={() => navigate('/buyer/dashboard')}
            style={{
              padding: '10px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Go to Dashboard
          </button>
        </div>
      )}

      {/* List View - Items */}
      {!selectedPurchase && currentList.length > 0 && (
        <div>
          {currentList.map((purchase) => (
            <div 
              key={purchase.id} 
              style={{ 
                border: `1px solid ${activeTab === 'completed' ? '#007bff' : activeTab === 'verification' ? '#ffc107' : '#28a745'}`,
                padding: '15px', 
                margin: '10px 0', 
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
                backgroundColor: activeTab === 'completed' ? '#f0f8ff' : activeTab === 'verification' ? '#fffdf0' : '#f8fff8'
              }}
              onClick={() => handleSelectPurchase(purchase)}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 5px 0' }}>{purchase.item_name}</h3>
                <span style={{ 
                  backgroundColor: activeTab === 'completed' ? '#007bff' : activeTab === 'verification' ? '#ffc107' : '#28a745',
                  color: activeTab === 'verification' ? 'black' : 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {activeTab === 'selected' && 'SELECTED'}
                  {activeTab === 'verification' && 'VERIFYING'}
                  {activeTab === 'completed' && '✅ COMPLETED'}
                </span>
              </div>
              <p style={{ margin: '5px 0', color: '#666' }}>{purchase.description || 'No description'}</p>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px' }}>
                <span>💰 ₹{purchase.budget_min} - ₹{purchase.budget_max}</span>
                <span>📍 {purchase.pincode}</span>
                <span>📅 {new Date(purchase.created_at).toLocaleDateString()}</span>
              </div>
              {purchase.selectedBid && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  border: `1px solid ${activeTab === 'completed' ? '#007bff' : activeTab === 'verification' ? '#ffc107' : '#28a745'}`
                }}>
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    <strong>Shop:</strong> {purchase.selectedBid.shop_details?.shop_name || purchase.selectedBid.shop_name || 'Unknown'} • 
                    <strong> Price:</strong> ₹{purchase.selectedBid.price}
                  </p>
                  {purchase.selectedBid.shop_details?.phone && (
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}>
                      📞 {purchase.selectedBid.shop_details.phone}
                    </p>
                  )}
                  {activeTab === 'verification' && purchase.delivery_method && (
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#856404' }}>
                      🚚 {purchase.delivery_method === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                    </p>
                  )}
                  {activeTab === 'completed' && purchase.completed_at && (
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#007bff' }}>
                      ✅ Completed: {new Date(purchase.completed_at).toLocaleDateString()}
                    </p>
                  )}
                  {activeTab === 'selected' && !purchase.delivery_method && (
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#856404' }}>
                      ⏳ Delivery method not selected yet
                    </p>
                  )}
                </div>
              )}
              <p style={{ fontSize: '12px', color: '#999', margin: '5px 0 0 0' }}>
                {activeTab === 'selected' && 'Click to select delivery method'}
                {activeTab === 'verification' && 'Click to view and verify transaction'}
                {activeTab === 'completed' && 'Click to view transaction details'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Detail View */}
      {selectedPurchase && (
        <div>
          <button
            onClick={handleBack}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              marginBottom: '20px'
            }}
          >
            ← Back to Purchases
          </button>

          <div style={{
            border: '1px solid #28a745',
            padding: '20px',
            borderRadius: '8px',
            backgroundColor: '#f8fff8',
            marginBottom: '20px'
          }}>
            <h2>{selectedPurchase.item_name}</h2>
            <p><strong>Description:</strong> {selectedPurchase.description || 'No description'}</p>
            <p><strong>Budget:</strong> ₹{selectedPurchase.budget_min} - ₹{selectedPurchase.budget_max}</p>
            <p><strong>Pincode:</strong> {selectedPurchase.pincode}</p>
            
            {selectedPurchase.selectedBid && (
              <div style={{
                marginTop: '15px',
                padding: '15px',
                backgroundColor: 'white',
                borderRadius: '4px',
                border: '1px solid #28a745'
              }}>
                <h3 style={{ margin: '0 0 10px 0' }}>✅ Shop Details</h3>
                
                <p><strong>Shop:</strong> {selectedPurchase.selectedBid.shop_details?.shop_name || selectedPurchase.selectedBid.shop_name || 'Unknown'}</p>
                <p><strong>Phone:</strong> {selectedPurchase.selectedBid.shop_details?.phone || selectedPurchase.selectedBid.shop_phone || 'N/A'}</p>
                <p><strong>Address:</strong> {selectedPurchase.selectedBid.shop_details?.address || selectedPurchase.selectedBid.shop_address || 'N/A'}</p>
                
                <hr style={{ margin: '10px 0' }} />
                
                <p><strong>Price:</strong> ₹{selectedPurchase.selectedBid.price}</p>
                <p><strong>Note:</strong> {selectedPurchase.selectedBid.note || 'No note'}</p>
                <p><strong>Selected On:</strong> {new Date(selectedPurchase.selectedBid.selected_at || selectedPurchase.purchased_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {/* Selected Bids Tab - Show Delivery Options */}
          {activeTab === 'selected' && !selectedPurchase.delivery_method && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '2px solid #ffc107',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>📦 Select Delivery Method</h3>
              <p style={{ color: '#856404', marginBottom: '15px' }}>
                Choose how you would like to receive the product:
              </p>
              
              {!deliveryMethod ? (
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleDeliverySelection('delivery')}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      flex: 1,
                      minWidth: '150px'
                    }}
                  >
                    🏠 Home Delivery
                    <br />
                    <span style={{ fontSize: '12px', fontWeight: 'normal' }}>Shop will deliver to your address</span>
                  </button>
                  <button
                    onClick={() => handleDeliverySelection('pickup')}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      flex: 1,
                      minWidth: '150px'
                    }}
                  >
                    📍 Pickup
                    <br />
                    <span style={{ fontSize: '12px', fontWeight: 'normal' }}>You will collect from shop</span>
                  </button>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#e8f5e9',
                  border: '2px solid #4caf50',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
                    ✅ You have selected <strong>{deliveryMethod === 'delivery' ? 'Home Delivery' : 'Pickup'}</strong>
                  </p>
                  {deliveryMethod === 'delivery' && (
                    <p style={{ fontSize: '14px', color: '#666', margin: '5px 0 15px 0' }}>
                      📍 Delivering to: {deliveryAddress}
                    </p>
                  )}
                  <button
                    onClick={handleConfirmDelivery}
                    disabled={updating}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: updating ? 'not-allowed' : 'pointer',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}
                  >
                    {updating ? 'Processing...' : '✅ Confirm Delivery'}
                  </button>
                  <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>
                    Click to confirm and move to Verification
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Verification Tab - Show Delivery Details + Verify Button */}
          {activeTab === 'verification' && selectedPurchase.delivery_method && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '2px solid #ffc107',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>📋 Verification Details</h3>
              
              <div style={{ 
                backgroundColor: 'white', 
                padding: '15px', 
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                <p><strong>Delivery Method:</strong> {selectedPurchase.delivery_method === 'home_delivery' ? '🏠 Home Delivery' : '📍 Pickup'}</p>
                {selectedPurchase.delivery_method === 'home_delivery' && selectedPurchase.delivery_address && (
                  <p><strong>Delivery Address:</strong> {selectedPurchase.delivery_address}</p>
                )}
                <p><strong>Status:</strong> <span style={{ color: '#ffc107', fontWeight: 'bold' }}>AWAITING VERIFICATION</span></p>
              </div>
              
              <button
                onClick={handleVerifyTransaction}
                disabled={updating}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
                {updating ? 'Processing...' : '✅ Verify Transaction'}
              </button>
              <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                Click this after you have received the product and completed the transaction
              </p>
            </div>
          )}

          {/* Completed Tab - Show Final Details */}
          {activeTab === 'completed' && (
            <div style={{
              backgroundColor: '#cce5ff',
              border: '2px solid #007bff',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h2 style={{ color: '#004085', margin: '0 0 10px 0' }}>✅ Transaction Complete!</h2>
              <p style={{ color: '#004085', marginBottom: '15px' }}>
                You have successfully completed the transaction with {selectedPurchase.selectedBid?.shop_details?.shop_name || selectedPurchase.selectedBid?.shop_name || 'the shop'}.
              </p>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '15px', 
                borderRadius: '4px',
                border: '1px solid #007bff'
              }}>
                <p><strong>Status:</strong> <span style={{ color: '#28a745', fontWeight: 'bold' }}>COMPLETED</span></p>
                <p><strong>Delivery Method:</strong> {selectedPurchase.delivery_method === 'home_delivery' ? '🏠 Home Delivery' : '📍 Pickup'}</p>
                {selectedPurchase.delivery_method === 'home_delivery' && selectedPurchase.delivery_address && (
                  <p><strong>Delivery Address:</strong> {selectedPurchase.delivery_address}</p>
                )}
                <p><strong>Completed On:</strong> {new Date(selectedPurchase.completed_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyPurchases;