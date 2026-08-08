import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const BidDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchBidDetails();
  }, [id]);

  const fetchBidDetails = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching bid details for:', id);
      const response = await api.get(`/bids/${id}/buyer`);
      console.log('Bid details:', response.data);
      setData(response.data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.detail || 'Failed to fetch bid details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#ffc107', color: 'black', label: 'PENDING' },
      selected: { bg: '#28a745', color: 'white', label: 'SELECTED ✅' },
      rejected: { bg: '#dc3545', color: 'white', label: 'REJECTED' },
      purchased: { bg: '#17a2b8', color: 'white', label: 'PURCHASED' },
      completed: { bg: '#007bff', color: 'white', label: 'COMPLETED ✅' },
    };
    return styles[status] || { bg: '#6c757d', color: 'white', label: status.toUpperCase() };
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading bid details...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '50px auto', textAlign: 'center' }}>
        <h2 style={{ color: '#dc3545' }}>Error</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate('/shop/dashboard')}
          style={{
            padding: '10px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { bid, request, buyer } = data;
  const bidStatus = getStatusBadge(bid.status);
  const requestStatus = getStatusBadge(request.status);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Bid Details</h1>
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

      {/* Success Banner */}
      {bid.status === 'selected' && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '2px solid #28a745',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#155724', margin: '0' }}>🎉 Congratulations!</h2>
          <p style={{ color: '#155724', margin: '5px 0 0 0' }}>Your bid has been selected!</p>
        </div>
      )}

      {/* Bid Info */}
      <div style={{
        border: '1px solid #ccc',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        backgroundColor: 'white'
      }}>
        <h3>💰 Bid Details</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <p><strong>Price:</strong> ₹{bid.price}</p>
          <p><strong>Note:</strong> {bid.note || 'No note'}</p>
          <p><strong>Status:</strong> <span style={{
            backgroundColor: bidStatus.bg,
            color: bidStatus.color,
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>{bidStatus.label}</span></p>
          <p><strong>Placed:</strong> {new Date(bid.created_at).toLocaleDateString()}</p>
          {bid.selected_at && (
            <p><strong>Selected:</strong> {new Date(bid.selected_at).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      {/* Request Info */}
      <div style={{
        border: '1px solid #17a2b8',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        backgroundColor: '#f0f8ff'
      }}>
        <h3>📋 Request Details</h3>
        <p><strong>Item:</strong> {request.item_name}</p>
        <p><strong>Description:</strong> {request.description || 'No description'}</p>
        <p><strong>Budget:</strong> ₹{request.budget_min} - ₹{request.budget_max}</p>
        <p><strong>Pincode:</strong> {request.pincode}</p>
        <p><strong>Status:</strong> <span style={{
          backgroundColor: requestStatus.bg,
          color: requestStatus.color,
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>{requestStatus.label}</span></p>

        {request.delivery_method && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#fff3cd',
            borderRadius: '4px',
            border: '1px solid #ffc107'
          }}>
            <p><strong>Delivery Method:</strong> {request.delivery_method === 'home_delivery' ? '🏠 Home Delivery' : '📍 Pickup'}</p>
            {request.delivery_address && (
              <p><strong>Delivery Address:</strong> {request.delivery_address}</p>
            )}
          </div>
        )}

        {request.completed_at && (
          <p style={{ color: '#007bff', marginTop: '10px' }}>
            ✅ <strong>Completed:</strong> {new Date(request.completed_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Buyer Contact */}
      <div style={{
        border: '1px solid #28a745',
        padding: '20px',
        borderRadius: '8px',
        backgroundColor: '#f8fff8'
      }}>
        <h3>👤 Buyer Contact</h3>
        <p><strong>Name:</strong> {buyer.name || 'Buyer'}</p>
        <p><strong>Phone:</strong> {buyer.phone || 'N/A'}</p>
        <p><strong>Address:</strong> {buyer.address || 'N/A'}</p>
        <p><strong>Pincode:</strong> {buyer.pincode || 'N/A'}</p>
      </div>
    </div>
  );
};

export default BidDetail;