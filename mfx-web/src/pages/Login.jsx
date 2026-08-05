import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (user?.role === 'buyer') {
        navigate('/buyer/dashboard');
      } else if (user?.role === 'shop_owner') {
        navigate('/shop/dashboard');
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{ 
        maxWidth: '400px', 
        margin: '50px auto', 
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  // If already authenticated, don't render login form
  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      console.log('Login successful!', result.data);
      const role = result.data.role;
      if (role === 'buyer') {
        navigate('/buyer/dashboard');
      } else if (role === 'shop_owner') {
        navigate('/shop/dashboard');
      }
    } else {
      setError(result.error);
      console.error('Login error:', result.error);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Login</h2>
      <p>Test credentials:</p>
      <ul>
        <li>Buyer: buyer_test@example.com / TestPass123!</li>
        <li>Shop: shop_owner@example.com / TestPass123!</li>
      </ul>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              fontSize: '14px'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              fontSize: '14px'
            }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p>
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/signup')}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '14px'
            }}
          >
            Sign up here
          </button>
        </p>
      </div>

      {/* Debug Section - Remove in production */}
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <p><strong>Debug Info:</strong></p>
        <p>Auth Status: {isAuthenticated ? '✅ Logged In' : '❌ Not Logged In'}</p>
        <p>Loading: {authLoading ? '⏳ Checking...' : '✅ Done'}</p>
        <button
          onClick={() => {
            console.log('Current user:', user);
            console.log('LocalStorage:', {
              token: localStorage.getItem('access_token'),
              role: localStorage.getItem('role'),
              user_id: localStorage.getItem('user_id')
            });
          }}
          style={{ 
            marginRight: '10px',
            padding: '4px 12px',
            cursor: 'pointer'
          }}
        >
          Log User
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('role');
            localStorage.removeItem('user_id');
            window.location.reload();
          }}
          style={{
            padding: '4px 12px',
            cursor: 'pointer',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Clear Storage
        </button>
      </div>
    </div>
  );
};

export default Login;