import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRequestDetail();
  }, [id]);

  const fetchRequestDetail = async () => {
    try {
      const requestResponse = await api.get(`/requests/${id}`);
      console.log('Request detail:', requestResponse.data);
      setRequest(requestResponse.data);

      if (user?.role === 'buyer') {
        await fetchBids();
      }

    } catch (err) {
      setError('Failed to fetch request details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      const response = await api.get(`/requests/${id}/bids`);
      console.log('Bids:', response.data);
      setBids(response.data);
    } catch (err) {
      console.error('Failed to fetch bids:', err);
    }
  };

  const handleSelectBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to select this bid?')) return;
    
    setSelecting(true);
    try {
      console.log('Selecting bid:', bidId);
      // ✅ CORRECT URL - /bids/{bid_id}/select
      const response = await api.patch(`/bids/${bidId}/select`);
      console.log('Bid selected:', response.data);
      alert('✅ Bid selected successfully! The request is now purchased.');
      await fetchRequestDetail();
    } catch (err) {
      console.error('Select bid error:', err);
      const errorMsg = err.response?.data?.detail || 'Unknown error';
      alert(`❌ Failed to select bid: ${errorMsg}`);
    } finally {
      setSelecting(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    
    setDeleting(true);
    try {
      await api.delete(`/requests/${id}`);
      alert('✅ Request deleted successfully');
      navigate('/buyer/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Unknown error';
      alert(`❌ Failed to delete request: ${errorMsg}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!request) return <div>Request not found</div>;

  const isOwner = request.buyer_id === user?.user_id;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Request Details</h1>
        <button 
          onClick={() => navigate('/buyer/dashboard')}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Back to Dashboard
        </button>
      </div>

      {/* Debug Info */}
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '10px', 
        marginBottom: '15px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <p><strong>Debug Info:</strong></p>
        <p>User ID: {user?.user_id}</p>
        <p>User Role: {user?.role}</p>
        <p>Request Buyer ID: {request.buyer_id}</p>
        <p>Is Owner: {isOwner ? 'Yes' : 'No'}</p>
        <p>Request Status: {request.status}</p>
        <p>Total Bids: {bids.length}</p>
      </div>

      {/* Request Info */}
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '4px', marginBottom: '20px' }}>
        <h2>{request.item_name}</h2>
        <p><strong>Description:</strong> {request.description || 'No description'}</p>
        <p><strong>Budget:</strong> ₹{request.budget_min} - ₹{request.budget_max}</p>
        <p><strong>Pincode:</strong> {request.pincode}</p>
        <p><strong>Category:</strong> {request.category}</p>
        <p><strong>Status:</strong> <strong style={{ color: request.status === 'open' ? '#28a745' : '#dc3545' }}>{request.status.toUpperCase()}</strong></p>
        <p><strong>Created:</strong> {new Date(request.created_at).toLocaleDateString()}</p>
        <p><strong>Expires:</strong> {new Date(request.expires_at).toLocaleDateString()}</p>

        {isOwner && request.status === 'open' && (
          <button
            onClick={handleDeleteRequest}
            disabled={deleting}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {deleting ? 'Deleting...' : 'Delete Request'}
          </button>
        )}
      </div>

      {/* Bids Section */}
      <h3>Bids ({bids.length || 0})</h3>
      
      {!isOwner ? (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#fff3cd', 
          borderRadius: '4px',
          border: '1px solid #ffc107'
        }}>
          <p>Only the buyer can view bids on this request</p>
        </div>
      ) : bids.length === 0 ? (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#e9ecef', 
          borderRadius: '4px',
          border: '1px solid #dee2e6'
        }}>
          <p>No bids yet. Wait for shop owners to bid on your request.</p>
        </div>
      ) : (
        bids.map((bid) => (
          <div key={bid.id} style={{ 
            border: '1px solid #ddd', 
            padding: '15px', 
            margin: '10px 0', 
            borderRadius: '4px',
            backgroundColor: bid.status === 'selected' ? '#d4edda' : 
                           bid.status === 'rejected' ? '#f8d7da' : 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <p><strong>Price:</strong> ₹{bid.price}</p>
                <p><strong>Shop:</strong> {bid.profiles?.shop_name || bid.shop_name || 'Unknown Shop'}</p>
                <p><strong>Note:</strong> {bid.note || 'No note'}</p>
                <p><strong>Status:</strong> <strong style={{ 
                  color: bid.status === 'selected' ? '#28a745' : 
                         bid.status === 'rejected' ? '#dc3545' : '#ffc107'
                }}>{bid.status.toUpperCase()}</strong></p>
                <p><strong>Placed:</strong> {new Date(bid.created_at).toLocaleDateString()}</p>
                <p><strong>Bid ID:</strong> <code>{bid.id}</code></p>
              </div>
              {request.status === 'open' && bid.status === 'pending' && (
                <button
                  onClick={() => handleSelectBid(bid.id)}
                  disabled={selecting}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {selecting ? 'Selecting...' : '✅ Select Bid'}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RequestDetail;