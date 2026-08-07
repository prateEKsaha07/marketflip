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
  const [selectedBidInfo, setSelectedBidInfo] = useState(null);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchRequestDetail();
  }, [id]);

  const fetchRequestDetail = async () => {
    setLoading(true);
    setError('');
    setNotFound(false);
    
    try {
      const requestResponse = await api.get(`/requests/${id}`);
      console.log('Request detail:', requestResponse.data);
      setRequest(requestResponse.data);

      if (user?.role === 'buyer') {
        await fetchBids();
      }
    } catch (err) {
      console.error('Fetch request error:', err);
      if (err.response?.status === 404) {
        setNotFound(true);
        setError('Request not found. It may have been deleted or never existed.');
      } else {
        setError('Failed to fetch request details: ' + (err.response?.data?.detail || err.message));
      }
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
      const response = await api.patch(`/bids/${bidId}/select`);
      console.log('Bid selected response:', response.data);
      
      const data = response.data;
      
      setSelectedBidInfo({
        bidId: data.bid_id,
        requestId: data.request_id,
        status: data.status,
        price: data.selected_bid?.price || 'N/A',
        shopName: data.shop_contact?.name || 'Unknown',
        shopPhone: data.shop_contact?.phone || 'N/A',
        shopAddress: data.shop_contact?.address || 'N/A',
        note: data.selected_bid?.note || 'No note',
        selectedAt: data.selected_bid?.selected_at || new Date().toISOString()
      });
      setShowSuccessCard(true);
      
      // Update the request status locally without fetching again
      setRequest(prev => prev ? { ...prev, status: 'purchased' } : null);
      
      // Update the bid status locally
      setBids(prev => prev.map(bid => 
        bid.id === bidId 
          ? { ...bid, status: 'selected' }
          : bid.status === 'pending' 
            ? { ...bid, status: 'rejected' }
            : bid
      ));
      
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

  // Show loading state
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading request details...</h2>
      </div>
    );
  }

  // Show 404/not found state
  if (notFound || error) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '50px auto', textAlign: 'center' }}>
        <h1 style={{ color: '#dc3545' }}>Request Not Found</h1>
        <p style={{ color: '#666', margin: '20px 0' }}>
          The request you're looking for doesn't exist or has been removed.
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
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!request) return null;

  const isOwner = request.buyer_id === user?.user_id;
  const isPurchased = request.status === 'purchased' || showSuccessCard;

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

      {/* Success Card */}
      {showSuccessCard && selectedBidInfo && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '2px solid #28a745',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#155724', margin: '0 0 10px 0' }}>🎉 Purchase Finalized!</h2>
          <p style={{ color: '#155724', marginBottom: '15px' }}>
            Your bid has been selected successfully. The request is now marked as purchased.
          </p>
          
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '4px',
            border: '1px solid #28a745'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Shop Contact Details</h3>
            <p><strong>Shop:</strong> {selectedBidInfo.shopName}</p>
            <p><strong>Phone:</strong> {selectedBidInfo.shopPhone}</p>
            <p><strong>Address:</strong> {selectedBidInfo.shopAddress}</p>
            <hr style={{ margin: '10px 0' }} />
            <p><strong>Selected Price:</strong> ₹{selectedBidInfo.price}</p>
            <p><strong>Note:</strong> {selectedBidInfo.note}</p>
            <p><strong>Selected On:</strong> {new Date(selectedBidInfo.selectedAt).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      {/* Request Info */}
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '4px', marginBottom: '20px' }}>
        <h2>{request.item_name}</h2>
        <p><strong>Description:</strong> {request.description || 'No description'}</p>
        <p><strong>Budget:</strong> ₹{request.budget_min} - ₹{request.budget_max}</p>
        <p><strong>Pincode:</strong> {request.pincode}</p>
        <p><strong>Category:</strong> {request.category}</p>
        <p><strong>Status:</strong> <strong style={{ color: isPurchased ? '#28a745' : '#ffc107' }}>
          {isPurchased ? 'PURCHASED' : request.status.toUpperCase()}
        </strong></p>
        <p><strong>Created:</strong> {new Date(request.created_at).toLocaleDateString()}</p>
        <p><strong>Expires:</strong> {new Date(request.expires_at).toLocaleDateString()}</p>

        {isOwner && request.status === 'open' && !showSuccessCard && (
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
              </div>
              {request.status === 'open' && bid.status === 'pending' && !showSuccessCard && (
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
              {bid.status === 'selected' && (
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: '#28a745', 
                  color: 'white', 
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}>
                  Selected ✓
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RequestDetail;