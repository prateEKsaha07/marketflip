import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Store, User, Home, ArrowRight, Sparkles } from 'lucide-react';
import api from '../api/client';

const Auth = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSignIn, setIsSignIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer',
    shop_name: '',
    address: '',
    pincode: '',
    phone: '',
  });

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(loginData.email, loginData.password);

    if (result.success) {
      const role = result.data.role;
      if (role === 'buyer') navigate('/buyer/dashboard');
      else if (role === 'shop_owner') navigate('/shop/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (signupData.pincode.length !== 6 || !/^\d{6}$/.test(signupData.pincode)) {
      setError('Pincode must be 6 digits');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: signupData.email,
        password: signupData.password,
        role: signupData.role,
        address: signupData.address,
        pincode: signupData.pincode,
        phone: signupData.phone,
      };

      if (signupData.role === 'shop_owner') {
        payload.shop_name = signupData.shop_name;
      }

      await api.post('/auth/signup', payload);

      const loginResult = await login(signupData.email, signupData.password);
      
      if (loginResult.success) {
        if (signupData.role === 'buyer') navigate('/buyer/dashboard');
        else navigate('/shop/dashboard');
      } else {
        setError('Account created. Please login.');
      }

    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Back Button */}
      <button onClick={() => navigate('/')} className="auth-back-btn-fixed">
        <Home size={18} />
        <span>Back</span>
      </button>

      <div className="auth-card">
        {/* Left Side - Modern Animated */}
        <div className="auth-left">
          <div className="auth-left-bg" />
          
          {/* Floating Orbs */}
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
          <div className="auth-orb auth-orb-3" />
          
          <div className="auth-left-content">
            <div className="auth-brand">
              <Sparkles className="auth-brand-icon" size={28} />
              <h1>MarketFlip</h1>
            </div>
            
            <p className="auth-left-tagline">Flip How You Buy.</p>
            
            <div className="auth-features">
              <div className="auth-feature">
                <span>🛒</span>
                <span>Post what you need</span>
              </div>
              <div className="auth-feature">
                <span>💰</span>
                <span>Sellers compete</span>
              </div>
              <div className="auth-feature">
                <span>⭐</span>
                <span>Choose the best deal</span>
              </div>
            </div>

            <div className="auth-left-footer">
              <span>✨ Join the community</span>
            </div>
          </div>
        </div>

        {/* Right Side - Forms */}
        <div className="auth-right">
          {/* Toggle */}
          <div className="auth-toggle">
            <button
              className={isSignIn ? 'active' : ''}
              onClick={() => { setIsSignIn(true); setError(''); }}
            >
              Sign In
            </button>
            <button
              className={!isSignIn ? 'active' : ''}
              onClick={() => { setIsSignIn(false); setError(''); }}
            >
              Sign Up
            </button>
          </div>

          {/* Form Container with Slide Animation */}
          <div className="auth-form-wrapper">
            {/* Sign In Form */}
            <div className={`auth-form-slide ${isSignIn ? 'active-in' : 'active-out'}`}>
              <div className="auth-form-inner">
                <h2>Welcome Back</h2>
                <p className="auth-desc">Sign in to your account</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleLoginSubmit}>
                  <div className="auth-field">
                    <Mail className="auth-icon" />
                    <input
                      type="email"
                      name="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      placeholder="Email address"
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <Lock className="auth-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <button type="submit" className="auth-submit" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                <p className="auth-footer-text">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => { setIsSignIn(false); setError(''); }}
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </div>

            {/* Sign Up Form */}
            <div className={`auth-form-slide ${!isSignIn ? 'active-in' : 'active-out'}`}>
              <div className="auth-form-inner">
                <h2>Create Account</h2>
                <p className="auth-desc">Join MarketFlip today</p>

                {error && <div className="auth-error">{error}</div>}

                <div className="auth-role-select">
                  <button
                    type="button"
                    className={signupData.role === 'buyer' ? 'active' : ''}
                    onClick={() => setSignupData({ ...signupData, role: 'buyer' })}
                  >
                    🛒 Buyer
                  </button>
                  <button
                    type="button"
                    className={signupData.role === 'shop_owner' ? 'active' : ''}
                    onClick={() => setSignupData({ ...signupData, role: 'shop_owner' })}
                  >
                    🏪 Shop Owner
                  </button>
                </div>

                <form onSubmit={handleSignupSubmit} className="auth-signup-form">
                  <div className="auth-field">
                    <Mail className="auth-icon" />
                    <input
                      type="email"
                      name="email"
                      value={signupData.email}
                      onChange={handleSignupChange}
                      placeholder="Email address"
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <Lock className="auth-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={signupData.password}
                      onChange={handleSignupChange}
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="auth-field">
                    <Lock className="auth-icon" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={signupData.confirmPassword}
                      onChange={handleSignupChange}
                      placeholder="Confirm password"
                      required
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {signupData.role === 'shop_owner' && (
                    <div className="auth-field">
                      <Store className="auth-icon" />
                      <input
                        type="text"
                        name="shop_name"
                        value={signupData.shop_name}
                        onChange={handleSignupChange}
                        placeholder="Shop name"
                        required
                      />
                    </div>
                  )}

                  <div className="auth-field">
                    <User className="auth-icon" />
                    <input
                      type="text"
                      name="address"
                      value={signupData.address}
                      onChange={handleSignupChange}
                      placeholder="Address"
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <User className="auth-icon" />
                    <input
                      type="text"
                      name="pincode"
                      value={signupData.pincode}
                      onChange={handleSignupChange}
                      placeholder="Pincode"
                      maxLength="6"
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <User className="auth-icon" />
                    <input
                      type="tel"
                      name="phone"
                      value={signupData.phone}
                      onChange={handleSignupChange}
                      placeholder="Phone number"
                      required
                    />
                  </div>

                  <button type="submit" className="auth-submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </form>

                <p className="auth-footer-text">
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => { setIsSignIn(true); setError(''); }}
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;