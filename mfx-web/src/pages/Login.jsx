import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // For testing - show current state
  console.log('Is Authenticated:', isAuthenticated);
  console.log('User:', user);

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
        <div style={{ color: 'red', marginBottom: '10px', padding: '10px', border: '1px solid red' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div style={{ marginTop: '15px' }}>
        <p>Auth Status: {isAuthenticated ? '✅ Logged In' : '❌ Not Logged In'}</p>
        <button
          onClick={() => {
            console.log('Current user:', user);
            console.log('LocalStorage:', {
              token: localStorage.getItem('access_token'),
              role: localStorage.getItem('role'),
              user_id: localStorage.getItem('user_id')
            });
          }}
          style={{ marginRight: '10px' }}
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
        >
          Clear Storage
        </button>
      </div>
    </div>
  );
};

export default Login;