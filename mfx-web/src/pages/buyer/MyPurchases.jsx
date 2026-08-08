import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const MyPurchases = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState(null);
  const [showVerifyButton, setShowVerifyButton] = useState(false);
  const [transactionVerified, setTransactionVerified] = useState(false);

  // Fetch purchases when component mounts
  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching purchases for user:', user?.user_id);
      
      // Fetch all requests with status 'purchased'
      const response = await api.get('/requests?status=purchased');
      console.log('Purchases response:', response.data);
      
      if (!response.data || response.data.length === 0) {
        console.log('No purchases found');
        setPurchases([]);
        setLoading(false);
        return;
      }
      
      // For each purchase, fetch the selected bid with shop details
      const purchasesWithDetails = await Promise.all(
        response.data.map(async (req) => {
          try {
            const bidsResponse = await api.get(`/requests/${req.id}/bids`);
            const selectedBid = bidsResponse.data.find(b => b.status === 'selected');
            
            let shopDetails = null;
            if (selectedBid && selectedBid.shop_id) {
              try {
                // Try to fetch shop profile
                const shopResponse = await api.get(`/auth/profiles/${selectedBid.shop_id}`);
                shopDetails = shopResponse.data;
                console.log('Shop details fetched:', shopDetails);
              } catch (err) {
                console.error(`Failed to fetch shop details for ${selectedBid.shop_id}:`, err);
                // Fallback: use profiles from bid response
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
      
      console.log('Purchases with details:', purchasesWithDetails);
      setPurchases(purchasesWithDetails);
    } catch (err) {
      console.error('Fetch purchases error:', err);
      setError('Failed to fetch purchases: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverySelection = (method) => {
    setDeliveryMethod(method);
    setShowVerifyButton(true);
    alert(`✅ ${method === 'delivery' ? 'Home Delivery' : 'Pickup'} selected! Click "Verify Transaction" once completed.`);
  };

  const handleVerifyTransaction = async () => {
    if (!window.confirm('Have you received the product and completed the transaction?')) return;
    
    try {
      // Update request status to 'completed'
      await api.patch(`/requests/${selectedPurchase.id}`, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        delivery_method: deliveryMethod
      });
      
      setTransactionVerified(true);
      alert('🎉 Transaction verified successfully! The order is now complete.');
      
      // Refresh purchases
      fetchPurchases();
      setSelectedPurchase(null);
      setShowDeliveryOptions(false);
      setShowVerifyButton(false);
      setDeliveryMethod(null);
      setTransactionVerified(false);
      
    } catch (err) {
      alert('❌ Failed to verify transaction: ' + (err.response?.data?.detail || 'Unknown error'));
      console.error(err);
    }
  };

  const handleSelectPurchase = (purchase) => {
    setSelectedPurchase(purchase);
    setShowDeliveryOptions(true);
    setShowVerifyButton(false);
    setDeliveryMethod(null);
    setTransactionVerified(false);
  };

  const handleBack = () => {
    setSelectedPurchase(null);
    setShowDeliveryOptions(false);
    setShowVerifyButton(false);
    setDeliveryMethod(null);
    setTransactionVerified(false);
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
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
            onClick={fetchPurchases}
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

      {purchases.length === 0 && !error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h2 style={{ color: '#6c757d' }}>📦 No Purchases Yet</h2>
          <p style={{ color: '#6c757d', margin: '20px 0' }}>
            When you select a bid, it will appear here.
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

      {/* Purchase Detail View */}
      {selectedPurchase ? (
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

          {/* Delivery Options */}
          {showDeliveryOptions && !deliveryMethod && !transactionVerified && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '2px solid #ffc107',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>📦 Delivery Options</h3>
              <p style={{ color: '#856404', marginBottom: '15px' }}>
                Select how you would like to receive the product:
              </p>
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
            </div>
          )}

          {/* Verify Transaction Button */}
          {showVerifyButton && !transactionVerified && (
            <div style={{
              backgroundColor: '#e8f5e9',
              border: '2px solid #4caf50',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
                ✅ You have selected <strong>{deliveryMethod === 'delivery' ? 'Home Delivery' : 'Pickup'}</strong>
              </p>
              <button
                onClick={handleVerifyTransaction}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                ✅ Verify Transaction
              </button>
              <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>
                Click this after you have received the product and completed the transaction
              </p>
            </div>
          )}

          {/* Transaction Complete */}
          {transactionVerified && (
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
                <p><strong>Completed On:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong>Delivery Method:</strong> {deliveryMethod === 'delivery' ? '🏠 Home Delivery' : '📍 Pickup'}</p>
              </div>
              <button
                onClick={handleBack}
                style={{
                  marginTop: '15px',
                  padding: '10px 24px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Back to Purchases
              </button>
            </div>
          )}
        </div>
      ) : (
        // Purchases List View
        purchases.length > 0 && (
          <div>
            {purchases.map((purchase) => (
              <div 
                key={purchase.id} 
                style={{ 
                  border: '1px solid #28a745',
                  padding: '15px', 
                  margin: '10px 0', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                  backgroundColor: '#f8fff8'
                }}
                onClick={() => handleSelectPurchase(purchase)}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: '0 0 5px 0' }}>{purchase.item_name}</h3>
                  <span style={{ 
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    PURCHASED
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
                    border: '1px solid #28a745'
                  }}>
                    <p style={{ margin: '0', fontSize: '14px' }}>
                      <strong>Selected Shop:</strong> {purchase.selectedBid.shop_details?.shop_name || purchase.selectedBid.shop_name || 'Unknown'} • 
                      <strong> Price:</strong> ₹{purchase.selectedBid.price}
                    </p>
                    {purchase.selectedBid.shop_details?.phone && (
                      <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}>
                        📞 {purchase.selectedBid.shop_details.phone}
                      </p>
                    )}
                    {purchase.selectedBid.shop_details?.address && (
                      <p style={{ margin: '2px 0 0 0', fontSize: '13px' }}>
                        📍 {purchase.selectedBid.shop_details.address}
                      </p>
                    )}
                  </div>
                )}
                <p style={{ fontSize: '12px', color: '#999', margin: '5px 0 0 0' }}>
                  Click to manage delivery and verify transaction
                </p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default MyPurchases;