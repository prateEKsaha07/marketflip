import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyBids();
  }, []);

  const fetchMyBids = async () => {
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#ffc107';
      case 'selected': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusBadgeStyle = (status) => ({
    backgroundColor: getStatusColor(status),
    color: status === 'pending' ? 'black' : 'white',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h1>Shop Dashboard</h1>
        <div>
          <button 
            onClick={() => navigate('/shop/my-bids')}
            style={{ 
              marginRight: '10px', 
              padding: '8px 16px', 
              backgroundColor: '#ffc107', 
              color: 'black', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            📋 My Bids
          </button>
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
            🔍 Browse Requests
          </button>
          <button 
            onClick={handleLogout} 
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '4px', 
        marginBottom: '20px' 
      }}>
        <p><strong>User ID:</strong> {user?.user_id}</p>
        <p><strong>Role:</strong> {user?.role}</p>
      </div>

      <h2>My Bids</h2>
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
                border: '1px solid #e0e0e0', 
                padding: '15px', 
                margin: '10px 0', 
                borderRadius: '4px',
                backgroundColor: 'white',
                borderLeft: `5px solid ${getStatusColor(bid.status)}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 5px 0' }}>
                    {bid.requests?.item_name || 'Unknown Request'}
                  </h3>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    {bid.note || 'No note provided'}
                  </p>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px' }}>
                    <span>💰 ₹{bid.price}</span>
                    <span>📅 {new Date(bid.created_at).toLocaleDateString()}</span>
                    {bid.requests && (
                      <span>👤 Buyer: {bid.requests.buyer_id?.slice(0, 8)}...</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={getStatusBadgeStyle(bid.status)}>
                    {bid.status.toUpperCase()}
                  </span>
                  {bid.status === 'pending' && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '5px' }}>
                      <button 
                        onClick={() => navigate('/shop/my-bids')}
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          backgroundColor: '#ffc107',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Stats */}
      {bids.length > 0 && (
        <div style={{ 
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          display: 'flex',
          gap: '40px',
          flexWrap: 'wrap'
        }}>
          <div>
            <strong>Total Bids:</strong> {bids.length}
          </div>
          <div>
            <strong>Pending:</strong> {bids.filter(b => b.status === 'pending').length}
          </div>
          <div>
            <strong>Selected:</strong> {bids.filter(b => b.status === 'selected').length}
          </div>
          <div>
            <strong>Rejected:</strong> {bids.filter(b => b.status === 'rejected').length}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;