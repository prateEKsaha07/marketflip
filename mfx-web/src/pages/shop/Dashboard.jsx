import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ pending: 0, selected: 0, rejected: 0, completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/bids/stats');
      console.log('Stats:', response.data);
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const StatCard = ({ label, count, color, icon }) => (
    <div
      style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: `1px solid ${color}`,
        borderLeft: `5px solid ${color}`,
        flex: 1,
        minWidth: '100px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ fontSize: '28px', textAlign: 'center' }}>{icon}</div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', color: color }}>
        {count}
      </div>
      <div style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
        {label}
      </div>
    </div>
  );

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
  onClick={() => navigate('/shop/completed')}
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
  ✅ Completed
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
        <p><strong>Shop:</strong> {user?.user_id}</p>
        <p><strong>Role:</strong> {user?.role}</p>
      </div>

      {/* Stats Cards - KPIs */}
      <div style={{ marginBottom: '20px' }}>
        <h2>📊 Your Bids</h2>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '15px' }}>
          <StatCard label="Total" count={stats.total} color="#6c757d" icon="📊" />
          <StatCard label="Pending" count={stats.pending} color="#ffc107" icon="⏳" />
          <StatCard label="Selected" count={stats.selected} color="#28a745" icon="🎉" />
          <StatCard label="Rejected" count={stats.rejected} color="#dc3545" icon="❌" />
          <StatCard label="Completed" count={stats.completed} color="#007bff" icon="✅" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;