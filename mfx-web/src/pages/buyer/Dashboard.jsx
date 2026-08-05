import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/requests?status=open');
      console.log('Requests:', response.data);
      setRequests(response.data);
    } catch (err) {
      setError('Failed to fetch requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
        <h1>Buyer Dashboard</h1>
        <div>
          <button 
            onClick={() => navigate('/buyer/post-request')}
            style={{ 
              marginRight: '10px', 
              padding: '8px 16px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            + Post Request
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

      <h2>Your Requests</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div>
        {requests.length === 0 ? (
          <p>No open requests found. <button onClick={() => navigate('/buyer/post-request')}>Post your first request!</button></p>
        ) : (
          requests.map((req) => (
            <div 
              key={req.id} 
              style={{ 
                border: '1px solid #e0e0e0', 
                padding: '15px', 
                margin: '10px 0', 
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
                backgroundColor: 'white'
              }}
              onClick={() => navigate(`/buyer/request/${req.id}`)}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 5px 0' }}>{req.item_name}</h3>
                <span style={{ 
                  backgroundColor: req.status === 'open' ? '#28a745' : '#6c757d',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {req.status.toUpperCase()}
                </span>
              </div>
              <p style={{ margin: '5px 0', color: '#666' }}>{req.description || 'No description'}</p>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px' }}>
                <span>💰 ₹{req.budget_min} - ₹{req.budget_max}</span>
                <span>📍 {req.pincode}</span>
                <span>📂 {req.category}</span>
                <span>📅 {new Date(req.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ fontSize: '12px', color: '#999', margin: '5px 0 0 0' }}>Click to view details and bids</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;