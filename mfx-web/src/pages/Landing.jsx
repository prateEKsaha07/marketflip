import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // If already logged in, redirect to appropriate dashboard
  if (isAuthenticated) {
    if (user?.role === 'buyer') {
      navigate('/buyer/dashboard');
    } else if (user?.role === 'shop_owner') {
      navigate('/shop/dashboard');
    }
    return null;
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '100px auto', 
      padding: '40px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '10px' }}>MarketFlip</h1>
      <p style={{ fontSize: '20px', color: '#666', marginBottom: '30px' }}>
        Find or sell products in your area
      </p>
      
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '12px 40px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
        <button
          onClick={() => navigate('/signup')}
          style={{
            padding: '12px 40px',
            fontSize: '16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default Landing;