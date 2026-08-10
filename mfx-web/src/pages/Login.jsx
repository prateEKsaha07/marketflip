import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (user?.role === 'buyer') {
        navigate('/buyer/dashboard');
      } else if (user?.role === 'shop_owner') {
        navigate('/shop/dashboard');
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A1A]">
        <div className="animate-pulse text-2xl font-bold text-[#6C63FF]">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      const role = result.data.role;
      if (role === 'buyer') {
        navigate('/buyer/dashboard');
      } else if (role === 'shop_owner') {
        navigate('/shop/dashboard');
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A1A] px-4">
      <div className="max-w-md w-full bg-[#1A1A2E] p-8 rounded-xl border border-[#2A2A4A]">
        <h2 className="text-3xl font-bold text-center mb-2 text-white">Welcome Back</h2>
        <p className="text-gray-400 text-center mb-6">Login to your account</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF] transition-colors"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF] transition-colors"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6C63FF] hover:bg-[#5A52E0] text-white py-3 text-lg"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="text-[#6C63FF] hover:text-[#5A52E0] transition-colors"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;