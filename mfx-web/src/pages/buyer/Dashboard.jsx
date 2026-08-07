import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('open');

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const fetchAllRequests = async () => {
    try {
      console.log('Fetching requests for user:', user?.user_id);
      
      // Try without any status filter first
      const response = await api.get('/requests?status=open');
      console.log('Open requests response:', response.data);
      
      // If open requests work, fetch all statuses
      if (response.data) {
        const statuses = ['open', 'purchased', 'expired', 'deleted'];
        const allData = [];
        
        for (const status of statuses) {
          try {
            const res = await api.get(`/requests?status=${status}`);
            if (res.data && res.data.length > 0) {
              allData.push(...res.data);
            }
          } catch (e) {
            console.log(`No ${status} requests found`);
          }
        }
        
        console.log('All requests combined:', allData);
        setAllRequests(allData);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError('Failed to fetch requests: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter requests by status
  const getFilteredRequests = () => {
    if (activeTab === 'all') {
      return allRequests;
    }
    return allRequests.filter(req => req.status === activeTab);
  };

  const filteredRequests = getFilteredRequests();

  // Count requests by status
  const counts = {
    all: allRequests.length,
    open: allRequests.filter(r => r.status === 'open').length,
    purchased: allRequests.filter(r => r.status === 'purchased').length,
    expired: allRequests.filter(r => r.status === 'expired').length,
    deleted: allRequests.filter(r => r.status === 'deleted').length,
  };

  const tabs = [
    { id: 'open', label: 'Open', icon: '📋', count: counts.open },
    { id: 'purchased', label: 'Completed', icon: '✅', count: counts.purchased },
    { id: 'expired', label: 'Expired', icon: '⏰', count: counts.expired },
    { id: 'deleted', label: 'Deleted', icon: '🗑️', count: counts.deleted },
  ];

  const getStatusBadgeStyle = (status) => {
    switch(status) {
      case 'open': return { backgroundColor: '#28a745', color: 'white' };
      case 'purchased': return { backgroundColor: '#17a2b8', color: 'white' };
      case 'expired': return { backgroundColor: '#dc3545', color: 'white' };
      case 'deleted': return { backgroundColor: '#6c757d', color: 'white' };
      default: return { backgroundColor: '#6c757d', color: 'white' };
    }
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

      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div>
        {filteredRequests.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6c757d', padding: '40px 0' }}>
            No {activeTab} requests found.
            {activeTab === 'open' && (
              <button 
                onClick={() => navigate('/buyer/post-request')}
                style={{ marginLeft: '10px', padding: '4px 12px', cursor: 'pointer' }}
              >
                Post your first request!
              </button>
            )}
          </p>
        ) : (
          filteredRequests.map((req) => {
            const isPurchased = req.status === 'purchased';
            
            return (
              <div 
                key={req.id} 
                style={{ 
                  border: `1px solid ${isPurchased ? '#28a745' : '#e0e0e0'}`,
                  padding: '15px', 
                  margin: '10px 0', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                  backgroundColor: isPurchased ? '#f8fff8' : 'white'
                }}
                onClick={() => navigate(`/buyer/request/${req.id}`)}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: '0 0 5px 0' }}>{req.item_name}</h3>
                  <span style={{ 
                    backgroundColor: getStatusBadgeStyle(req.status).backgroundColor,
                    color: getStatusBadgeStyle(req.status).color,
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
                
                {isPurchased && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#d4edda',
                    borderRadius: '4px',
                    border: '1px solid #28a745'
                  }}>
                    <p style={{ margin: '0', fontSize: '14px' }}>
                      <strong>✅ Purchase Finalized</strong>
                    </p>
                  </div>
                )}
                
                <p style={{ fontSize: '12px', color: '#999', margin: '5px 0 0 0' }}>
                  {isPurchased ? 'Click to view purchase details' : 'Click to view details and bids'}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Dashboard;