import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
      
      // Fetch all completed requests
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
            // Get bids for this request
            const bidsResponse = await api.get(`/requests/${req.id}/bids`);
            const selectedBid = bidsResponse.data.find(b => b.status === 'selected');
            
            // Get buyer details
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
    if (method === 'home_delivery') return '🏠 Home Delivery';
    if (method === 'pickup') return '📍 Pickup';
    return 'N/A';
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading transactions...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>✅ Completed Transactions</h1>
        <div>
          <button
            onClick={fetchCompletedTransactions}
            style={{
              marginRight: '10px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => navigate('/shop/dashboard')}
            style={{
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
        </div>
      </div>

      {error && (
        <div style={{
          color: 'red',
          padding: '10px',
          border: '1px solid red',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {transactions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h2 style={{ color: '#6c757d' }}>📭 No Completed Transactions</h2>
          <p style={{ color: '#6c757d', marginTop: '10px' }}>
            When a buyer verifies a transaction, it will appear here.
          </p>
        </div>
      ) : (
        transactions.map((txn) => (
          <div
            key={txn.id}
            style={{
              border: '1px solid #28a745',
              padding: '20px',
              margin: '15px 0',
              borderRadius: '8px',
              backgroundColor: '#f8fff8',
              borderLeft: '5px solid #28a745'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 10px 0' }}>{txn.item_name}</h3>
                <p><strong>Price:</strong> ₹{txn.selectedBid?.price || 'N/A'}</p>
                <p><strong>Delivery:</strong> {getDeliveryLabel(txn.delivery_method)}</p>
                <p><strong>Completed:</strong> {txn.completed_at ? new Date(txn.completed_at).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Status:</strong> <span style={{ color: '#28a745', fontWeight: 'bold' }}>✅ COMPLETED</span></p>
              </div>
              
              <div style={{
                padding: '15px',
                backgroundColor: '#f0f8ff',
                borderRadius: '8px',
                border: '1px solid #007bff',
                minWidth: '200px',
                marginTop: '10px'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#004085' }}>👤 Buyer</h4>
                <p style={{ margin: '5px 0' }}><strong>Name:</strong> {txn.buyer?.shop_name || 'Buyer'}</p>
                <p style={{ margin: '5px 0' }}><strong>Phone:</strong> {txn.buyer?.phone || 'N/A'}</p>
                <p style={{ margin: '5px 0' }}><strong>Address:</strong> {txn.buyer?.address || 'N/A'}</p>
                <p style={{ margin: '5px 0' }}><strong>Pincode:</strong> {txn.buyer?.pincode || 'N/A'}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CompletedTransactions;