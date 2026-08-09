import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const BrowseRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myBids, setMyBids] = useState([]);
  const [filters, setFilters] = useState({
    pincode: '',
    category: '',
    status: 'open'
  });
  const [activeFilters, setActiveFilters] = useState({
    pincode: '',
    category: '',
    status: 'open'
  });
  const [bidding, setBidding] = useState({
    requestId: null,
    price: '',
    note: '',
    loading: false
  });

  // Only fetch when activeFilters change
  useEffect(() => {
    fetchMyBids();
    fetchRequests();
  }, [activeFilters]);

  const fetchMyBids = async () => {
    try {
      const response = await api.get('/bids');
      setMyBids(response.data);
      console.log('My bids:', response.data);
    } catch (err) {
      console.error('Failed to fetch my bids:', err);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      
      params.append('status', activeFilters.status || 'open');
      
      if (activeFilters.pincode) params.append('pincode', activeFilters.pincode);
      if (activeFilters.category) params.append('category', activeFilters.category);
      
      console.log('Fetching requests with params:', params.toString());
      
      const response = await api.get(`/requests?${params.toString()}`);
      console.log('Requests response:', response.data);
      setRequests(response.data);
    } catch (err) {
      console.error('Fetch requests error:', err);
      setError('Failed to fetch requests: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters - copy filters to activeFilters
  const applyFilters = () => {
    setActiveFilters({ ...filters });
  };

  const handleBidChange = (e, requestId) => {
    setBidding({
      ...bidding,
      requestId: requestId,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitBid = async (requestId) => {
    if (!bidding.price || parseInt(bidding.price) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setBidding({ ...bidding, loading: true });
    
    try {
      const payload = {
        price: parseInt(bidding.price),
        note: bidding.note || ''
      };
      
      const response = await api.post(`/requests/${requestId}/bids`, payload);
      console.log('Bid placed:', response.data);
      
      alert('✅ Bid placed successfully!');
      
      setBidding({
        requestId: null,
        price: '',
        note: '',
        loading: false
      });
      
      await fetchMyBids();
      await fetchRequests();
      
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Unknown error';
      alert(`❌ Failed to place bid: ${errorMsg}`);
      console.error(err);
      setBidding({ ...bidding, loading: false });
    }
  };

  const hasPendingBid = (requestId) => {
    return myBids.some(bid => 
      bid.request_id === requestId && bid.status === 'pending'
    );
  };

  const getMyBidStatus = (requestId) => {
    const bid = myBids.find(b => b.request_id === requestId);
    return bid ? bid.status : null;
  };

  const clearFilters = () => {
    setFilters({
      pincode: '',
      category: '',
      status: 'open'
    });
    setActiveFilters({
      pincode: '',
      category: '',
      status: 'open'
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Browse Requests</h1>
        <div>
          <button 
            onClick={() => navigate('/shop/dashboard')}
            style={{ 
              marginRight: '10px', 
              padding: '8px 16px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px', 
        padding: '15px', 
        border: '1px solid #ccc', 
        borderRadius: '4px',
        flexWrap: 'wrap',
        alignItems: 'flex-end'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Pincode</label>
          <input
            type="text"
            name="pincode"
            value={filters.pincode}
            onChange={handleFilterChange}
            placeholder="e.g., 110001"
            maxLength="6"
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '120px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category</label>
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '150px' }}
          >
            <option value="">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="furniture">Furniture</option>
            <option value="books">Books</option>
            <option value="vehicles">Vehicles</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '120px' }}
          >
            <option value="open">Open</option>
            <option value="all">All</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={applyFilters}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Apply Filters
          </button>
          <button 
            onClick={clearFilters}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div>
        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p>No requests found matching your filters</p>
            <button 
              onClick={clearFilters}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          requests.map((req) => {
            const hasBid = hasPendingBid(req.id);
            const bidStatus = getMyBidStatus(req.id);
            
            return (
              <div key={req.id} style={{ 
                border: '1px solid #ccc', 
                padding: '15px', 
                margin: '10px 0', 
                borderRadius: '4px',
                backgroundColor: hasBid ? '#f8f9fa' : 'white'
              }}>
                <h3>{req.item_name}</h3>
                <p>{req.description || 'No description'}</p>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <span>💰 ₹{req.budget_min} - ₹{req.budget_max}</span>
                  <span>📍 {req.pincode}</span>
                  <span>📂 {req.category}</span>
                  <span>📅 {new Date(req.created_at).toLocaleDateString()}</span>
                </div>
                
                {req.status === 'open' && (
                  <div style={{ marginTop: '15px' }}>
                    {hasBid ? (
                      <div style={{ 
                        padding: '10px', 
                        backgroundColor: '#e9ecef', 
                        borderRadius: '4px',
                        border: '1px solid #dee2e6'
                      }}>
                        <p style={{ margin: 0, color: '#6c757d' }}>
                          ✅ You already have a <strong>{bidStatus}</strong> bid on this request
                        </p>
                        <button
                          onClick={() => navigate('/shop/my-bids')}
                          style={{
                            marginTop: '5px',
                            padding: '4px 12px',
                            backgroundColor: '#ffc107',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          View My Bids
                        </button>
                      </div>
                    ) : (
                      <div style={{ 
                        padding: '15px', 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: '4px',
                        border: '1px solid #e9ecef'
                      }}>
                        <h4>Place a Bid</h4>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Price (₹)</label>
                            <input
                              type="number"
                              name="price"
                              value={bidding.requestId === req.id ? bidding.price : ''}
                              onChange={(e) => handleBidChange(e, req.id)}
                              placeholder="Enter price"
                              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '150px' }}
                              disabled={bidding.loading}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Note</label>
                            <input
                              type="text"
                              name="note"
                              value={bidding.requestId === req.id ? bidding.note : ''}
                              onChange={(e) => handleBidChange(e, req.id)}
                              placeholder="Optional note"
                              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '200px' }}
                              disabled={bidding.loading}
                            />
                          </div>
                          <div style={{ alignSelf: 'flex-end' }}>
                            <button
                              onClick={() => handleSubmitBid(req.id)}
                              disabled={bidding.loading}
                              style={{
                                padding: '8px 20px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: bidding.loading ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {bidding.loading && bidding.requestId === req.id ? 'Placing...' : 'Bid Now'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BrowseRequests;