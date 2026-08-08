import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const MyBids = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({ price: '', note: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMyBids();
  }, []);

  const fetchMyBids = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bids');
      console.log('My bids:', response.data);
      setBids(response.data);
    } catch (err) {
      setError('Failed to fetch your bids');
      console.error(err);
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
      alert('✅ Bid updated successfully!');
      
      setEditing(null);
      fetchMyBids();
    } catch (err) {
      alert('❌ Failed to update bid: ' + (err.response?.data?.detail || 'Unknown error'));
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to withdraw this bid?')) return;
    
    try {
      await api.delete(`/bids/${bidId}`);
      alert('✅ Bid withdrawn successfully');
      fetchMyBids();
    } catch (err) {
      alert('❌ Failed to delete bid: ' + (err.response?.data?.detail || 'Unknown error'));
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#ffc107';
      case 'selected': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const handleBidClick = (bid) => {
    // Only navigate to detail if bid is selected (to see buyer details)
    if (bid.status === 'selected') {
      navigate(`/shop/bid/${bid.id}`);
    }
    // For pending bids, stay and allow edit/delete
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>My Bids</h1>
        <div>
          <button
            onClick={() => navigate('/shop/browse')}
            style={{
              marginRight: '10px',
              padding: '8px 16px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Browse Requests
          </button>
          <button
            onClick={() => navigate('/shop/dashboard')}
            style={{
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

      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div>
        {bids.length === 0 ? (
          <p>
            You haven't placed any bids yet. 
            <button 
              onClick={() => navigate('/shop/browse')}
              style={{ marginLeft: '10px', padding: '4px 12px', cursor: 'pointer' }}
            >
              Browse Requests
            </button>
          </p>
        ) : (
          bids.map((bid) => (
            <div 
              key={bid.id} 
              style={{ 
                border: '1px solid #ccc', 
                padding: '15px', 
                margin: '10px 0', 
                borderRadius: '4px',
                borderLeft: `5px solid ${getStatusColor(bid.status)}`,
                cursor: bid.status === 'selected' ? 'pointer' : 'default',
                transition: 'box-shadow 0.2s'
              }}
              onClick={() => handleBidClick(bid)}
              onMouseEnter={(e) => {
                if (bid.status === 'selected') {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {editing === bid.id ? (
                // Edit mode
                <div onClick={(e) => e.stopPropagation()}>
                  <h4>Edit Bid</h4>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div>
                      <label style={{ display: 'block' }}>Price (₹)</label>
                      <input
                        type="number"
                        name="price"
                        value={editData.price}
                        onChange={handleEditChange}
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '150px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block' }}>Note</label>
                      <input
                        type="text"
                        name="note"
                        value={editData.note}
                        onChange={handleEditChange}
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleUpdateBid(bid.id)}
                      disabled={updating}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {updating ? 'Updating...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 5px 0' }}>
                        {bid.requests?.item_name || 'Unknown Request'}
                        {bid.status === 'selected' && (
                          <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#28a745', marginLeft: '10px' }}>
                            🎉 Click to view buyer details
                          </span>
                        )}
                      </h3>
                      <p><strong>Price:</strong> ₹{bid.price}</p>
                      <p><strong>Note:</strong> {bid.note || 'No note'}</p>
                      <p><strong>Status:</strong> <strong style={{ color: getStatusColor(bid.status) }}>{bid.status.toUpperCase()}</strong></p>
                      <p><strong>Placed:</strong> {new Date(bid.created_at).toLocaleString()}</p>
                      {bid.requests && (
                        <p><strong>Item:</strong> {bid.requests.item_name}</p>
                      )}
                    </div>
                    {bid.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditClick(bid)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#ffc107',
                            color: 'black',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBid(bid.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Withdraw
                        </button>
                      </div>
                    )}
                    {bid.status === 'selected' && (
                      <div style={{ alignSelf: 'center' }}>
                        <span style={{
                          padding: '6px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          ✅ View Details
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyBids;