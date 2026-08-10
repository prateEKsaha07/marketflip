import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import api from '../api/client';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer',
    shop_name: '',
    address: '',
    pincode: '',
    phone: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.pincode.length !== 6 || !/^\d{6}$/.test(formData.pincode)) {
      setError('Pincode must be 6 digits');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        address: formData.address,
        pincode: formData.pincode,
        phone: formData.phone
      };

      if (formData.role === 'shop_owner') {
        payload.shop_name = formData.shop_name;
      }

      await api.post('/auth/signup', payload);

      const loginResult = await login(formData.email, formData.password);
      
      if (loginResult.success) {
        if (formData.role === 'buyer') {
          navigate('/buyer/dashboard');
        } else {
          navigate('/shop/dashboard');
        }
      } else {
        setError('Account created but login failed. Please login manually.');
        navigate('/login');
      }

    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Role Selection
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A1A] px-4">
        <div className="max-w-md w-full bg-[#1A1A2E] p-8 rounded-xl border border-[#2A2A4A] text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400 mb-8">Choose your role</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => handleRoleSelect('buyer')}
              className="flex-1 p-6 bg-[#0A0A1A] border-2 border-[#2A2A4A] rounded-xl hover:border-[#6C63FF] transition-colors"
            >
              <div className="text-4xl mb-2">🛒</div>
              <div className="text-white font-semibold">Buyer</div>
              <div className="text-sm text-gray-400">I want to buy</div>
            </button>
            
            <button
              onClick={() => handleRoleSelect('shop_owner')}
              className="flex-1 p-6 bg-[#0A0A1A] border-2 border-[#2A2A4A] rounded-xl hover:border-[#6C63FF] transition-colors"
            >
              <div className="text-4xl mb-2">🏪</div>
              <div className="text-white font-semibold">Shop Owner</div>
              <div className="text-sm text-gray-400">I want to sell</div>
            </button>
          </div>

          <p className="mt-6 text-gray-400">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[#6C63FF] hover:text-[#5A52E0] transition-colors"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Signup Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A1A] px-4 py-8">
      <div className="max-w-md w-full bg-[#1A1A2E] p-8 rounded-xl border border-[#2A2A4A]">
        <button
          onClick={() => setStep(1)}
          className="text-gray-400 hover:text-white transition-colors mb-4"
        >
          ← Back
        </button>

        <h2 className="text-2xl font-bold text-white mb-2">
          Create {formData.role === 'buyer' ? 'Buyer' : 'Shop Owner'} Account
        </h2>
        <p className="text-gray-400 mb-6">Fill in your details</p>

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
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF] transition-colors"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 6 characters"
              className="w-full px-4 py-3 bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF] transition-colors"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className="w-full px-4 py-3 bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF] transition-colors"
              required
            />
          </div>

          {formData.role === 'shop_owner' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Shop Name</label>
              <input
                type="text"
                name="shop_name"
                value={formData.shop_name}
                onChange={handleChange}
                placeholder="Enter shop name"
                className="w-full px-4 py-3 bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF] transition-colors"
                required
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your address"
              className="w-full px-4 py-3 bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF] transition-colors"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Pincode</label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="6-digit pincode"
              maxLength="6"
              className="w-full px-4 py-3 bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF] transition-colors"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              className="w-full px-4 py-3 bg-[#0A0A1A] border border-[#2A2A4A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#6C63FF] transition-colors"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6C63FF] hover:bg-[#5A52E0] text-white py-3 text-lg"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Signup;