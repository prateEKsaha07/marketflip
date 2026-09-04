import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Store, 
  User, 
  Home, 
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Star,
  ArrowRight,
  ArrowLeft,
  Check,
  Phone,
  MapPin
} from 'lucide-react';
import api from '../api/client';

const Auth = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSignIn, setIsSignIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupStep, setSignupStep] = useState(0);
  
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

  // Signup steps configuration
  const signupSteps = [
    {
      title: 'Email & Password',
      description: 'Create your account credentials',
      fields: ['email', 'password', 'confirmPassword'],
      icon: <Lock size={16} />,
    },
    {
      title: 'Role & Shop',
      description: 'Tell us about your role',
      fields: ['role', 'shop_name'],
      icon: <Store size={16} />,
    },
    {
      title: 'Contact Details',
      description: 'Where can we reach you?',
      fields: ['address', 'pincode', 'phone'],
      icon: <User size={16} />,
    },
  ];

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

  const handleNextStep = () => {
    // Validate current step fields
    const currentStep = signupSteps[signupStep];
    let hasError = false;

    for (const field of currentStep.fields) {
      if (!signupData[field] || signupData[field].trim() === '') {
        setError(`Please fill in ${field.replace('_', ' ')}`);
        hasError = true;
        return;
      }
    }

    // Special validation for password
    if (currentStep.fields.includes('password') && signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (currentStep.fields.includes('pincode') && signupData.pincode.length !== 6) {
      setError('Pincode must be 6 digits');
      return;
    }

    setError('');
    setSignupStep(signupStep + 1);
  };

  const handlePrevStep = () => {
    setSignupStep(signupStep - 1);
    setError('');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 30 : -30,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: (direction) => ({
      x: direction < 0 ? 30 : -30,
      opacity: 0,
      transition: { duration: 0.2, ease: "easeIn" }
    })
  };

  const buttonHover = {
    scale: 1.02,
    transition: { type: "spring", stiffness: 400, damping: 25 }
  };

  const inputFocus = {
    scale: 1.01,
    transition: { duration: 0.2 }
  };

  const renderSignupFields = () => {
    const step = signupSteps[signupStep];
    
    return (
      <motion.div
        key={signupStep}
        custom={1}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="space-y-3"
      >
        {/* Progress Indicator */}
        <div className="flex items-center gap-1.5 mb-4">
          {signupSteps.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-0.5 rounded-full transition-all ${
                index <= signupStep ? 'bg-[#1A1A2E]' : 'bg-[#EEECE6]'
              }`}
            />
          ))}
        </div>

        {/* Step Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#A0A0B0]">{step.icon}</span>
          <div>
            <h3 className="text-sm font-medium text-[#1A1A2E]">{step.title}</h3>
            <p className="text-[10px] text-[#A0A0B0]">{step.description}</p>
          </div>
          <span className="ml-auto text-[10px] text-[#A0A0B0]">
            {signupStep + 1}/{signupSteps.length}
          </span>
        </div>

        {step.fields.includes('email') && (
          <motion.div 
            className="relative"
            whileHover="hover"
            variants={inputFocus}
          >
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
            <input
              type="email"
              name="email"
              value={signupData.email}
              onChange={handleSignupChange}
              placeholder="Email address"
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#F8F6F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/10 transition-all"
              required
            />
          </motion.div>
        )}

        {step.fields.includes('password') && (
          <>
            <motion.div 
              className="relative"
              whileHover="hover"
              variants={inputFocus}
            >
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={signupData.password}
                onChange={handleSignupChange}
                placeholder="Password"
                className="w-full pl-9 pr-9 py-2 text-sm bg-[#F8F6F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/10 transition-all"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </motion.div>

            <motion.div 
              className="relative"
              whileHover="hover"
              variants={inputFocus}
            >
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={signupData.confirmPassword}
                onChange={handleSignupChange}
                placeholder="Confirm password"
                className="w-full pl-9 pr-9 py-2 text-sm bg-[#F8F6F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/10 transition-all"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </motion.div>
          </>
        )}

        {step.fields.includes('role') && (
          <div className="flex gap-1.5 bg-[#F8F6F0] rounded-lg p-0.5">
            <button
              type="button"
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                signupData.role === 'buyer' ? 'bg-white shadow-sm text-[#1A1A2E]' : 'text-[#A0A0B0] hover:text-[#1A1A2E]'
              }`}
              onClick={() => setSignupData({ ...signupData, role: 'buyer' })}
            >
              Buyer
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                signupData.role === 'shop_owner' ? 'bg-white shadow-sm text-[#1A1A2E]' : 'text-[#A0A0B0] hover:text-[#1A1A2E]'
              }`}
              onClick={() => setSignupData({ ...signupData, role: 'shop_owner' })}
            >
              Shop Owner
            </button>
          </div>
        )}

        {step.fields.includes('shop_name') && signupData.role === 'shop_owner' && (
          <motion.div 
            className="relative"
            whileHover="hover"
            variants={inputFocus}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <Store size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
            <input
              type="text"
              name="shop_name"
              value={signupData.shop_name}
              onChange={handleSignupChange}
              placeholder="Shop name"
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#F8F6F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/10 transition-all"
              required={signupData.role === 'shop_owner'}
            />
          </motion.div>
        )}

        {step.fields.includes('address') && (
          <motion.div 
            className="relative"
            whileHover="hover"
            variants={inputFocus}
          >
            <Home size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
            <input
              type="text"
              name="address"
              value={signupData.address}
              onChange={handleSignupChange}
              placeholder="Address"
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#F8F6F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/10 transition-all"
              required
            />
          </motion.div>
        )}

        {step.fields.includes('pincode') && (
          <motion.div 
            className="relative"
            whileHover="hover"
            variants={inputFocus}
          >
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
            <input
              type="text"
              name="pincode"
              value={signupData.pincode}
              onChange={handleSignupChange}
              placeholder="Pincode"
              maxLength="6"
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#F8F6F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/10 transition-all"
              required
            />
          </motion.div>
        )}

        {step.fields.includes('phone') && (
          <motion.div 
            className="relative"
            whileHover="hover"
            variants={inputFocus}
          >
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
            <input
              type="tel"
              name="phone"
              value={signupData.phone}
              onChange={handleSignupChange}
              placeholder="Phone number"
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#F8F6F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/10 transition-all"
              required
            />
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-2 pt-2">
          {signupStep > 0 && (
            <motion.button
              whileHover={buttonHover}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handlePrevStep}
              className="flex-1 py-2 text-sm font-medium bg-[#F8F6F0] hover:bg-[#EEECE6] text-[#1A1A2E] rounded-lg transition-all"
            >
              <ArrowLeft size={16} className="inline mr-1.5" />
              Back
            </motion.button>
          )}
          {signupStep < signupSteps.length - 1 ? (
            <motion.button
              whileHover={buttonHover}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleNextStep}
              className={`${signupStep > 0 ? 'flex-1' : 'w-full'} py-2 text-sm font-medium bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white rounded-lg transition-all`}
            >
              Next
              <ArrowRight size={16} className="inline ml-1.5" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={buttonHover}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-2 text-sm font-medium bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] flex items-center justify-center p-4">
      {/* Back Button */}
      <motion.button 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ x: -3 }}
        onClick={() => navigate('/')} 
        className="fixed top-4 left-4 md:top-6 md:left-6 z-50 flex items-center gap-1.5 text-xs text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors"
      >
        <Home size={14} />
        <span>Back</span>
      </motion.button>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex w-full max-w-4xl min-h-[560px] bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Left Side - Brand (Hidden on Signup) */}
        <AnimatePresence mode="wait">
          {isSignIn && (
            <motion.div 
              key="brand"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="hidden md:flex w-[38%] relative overflow-hidden bg-gradient-to-br from-[#1A1A2E] via-[#2A2A3E] to-[#1A1A2E] p-8 flex-col justify-center flex-shrink-0"
            >
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute bottom-10 left-10 w-24 h-24 rounded-full bg-white/5" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-white/5" />
              </div>
              
              <div className="relative z-10">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 mb-2"
                >
                  <Sparkles size={18} className="text-[#FFBE91]" />
                  <h1 className="text-xl font-semibold text-white">MarketFlip</h1>
                </motion.div>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-white/60 mb-6"
                >
                  Flip How You Buy.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2.5"
                >
                  <div className="flex items-center gap-2.5 text-sm text-white/70">
                    <ShoppingBag size={14} className="text-[#FFBE91]" />
                    <span>Post what you need</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-white/70">
                    <TrendingUp size={14} className="text-[#FFDDB0]" />
                    <span>Sellers compete</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-white/70">
                    <Star size={14} className="text-[#CFEBFF]" />
                    <span>Choose the best deal</span>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 pt-4 border-t border-white/10"
                >
                  <span className="text-xs text-white/40">Join the community</span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Side - Forms */}
        <div className="flex-1 p-6 md:p-8 flex flex-col">
          {/* Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex bg-[#F8F6F0] rounded-lg p-0.5 mb-5 w-full max-w-[200px]"
          >
            <button
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                isSignIn ? 'bg-white shadow-sm text-[#1A1A2E]' : 'text-[#A0A0B0] hover:text-[#1A1A2E]'
              }`}
              onClick={() => { setIsSignIn(true); setError(''); setSignupStep(0); }}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                !isSignIn ? 'bg-white shadow-sm text-[#1A1A2E]' : 'text-[#A0A0B0] hover:text-[#1A1A2E]'
              }`}
              onClick={() => { setIsSignIn(false); setError(''); setSignupStep(0); }}
            >
              Sign Up
            </button>
          </motion.div>

          {/* Form Container */}
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait" custom={isSignIn ? 1 : -1}>
              {isSignIn ? (
                // Sign In Form
                <motion.div
                  key="signin"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0"
                >
                  <div>
                    <h2 className="text-base font-semibold text-[#1A1A2E]">Welcome Back</h2>
                    <p className="text-xs text-[#A0A0B0] mb-4">Sign in to your account</p>

                    {error && (
                      <div className="bg-rose-50/80 backdrop-blur-sm rounded-lg p-2.5 mb-3 text-rose-700 text-xs flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-rose-400" />
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="space-y-3">
                      <motion.div 
                        className="relative"
                        whileHover="hover"
                        variants={inputFocus}
                      >
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
                        <input
                          type="email"
                          name="email"
                          value={loginData.email}
                          onChange={handleLoginChange}
                          placeholder="Email address"
                          className="w-full pl-9 pr-3 py-2 text-sm bg-[#F8F6F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/10 transition-all"
                          required
                        />
                      </motion.div>

                      <motion.div 
                        className="relative"
                        whileHover="hover"
                        variants={inputFocus}
                      >
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={loginData.password}
                          onChange={handleLoginChange}
                          placeholder="Password"
                          className="w-full pl-9 pr-9 py-2 text-sm bg-[#F8F6F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/10 transition-all"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </motion.div>

                      <motion.button 
                        whileHover={buttonHover}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        className="w-full py-2 text-sm font-medium bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white rounded-lg transition-all disabled:opacity-50"
                        disabled={loading}
                      >
                        {loading ? 'Signing in...' : 'Sign In'}
                      </motion.button>
                    </form>

                    <p className="text-center text-xs text-[#A0A0B0] mt-4">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        className="text-[#1A1A2E] font-medium hover:underline transition-all"
                        onClick={() => { setIsSignIn(false); setError(''); setSignupStep(0); }}
                      >
                        Sign Up
                      </button>
                    </p>
                  </div>
                </motion.div>
              ) : (
                // Sign Up Form - Progressive
                <motion.div
                  key="signup"
                  custom={-1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0"
                >
                  <div>
                    <h2 className="text-base font-semibold text-[#1A1A2E]">Create Account</h2>
                    <p className="text-xs text-[#A0A0B0] mb-3">Join MarketFlip today</p>

                    {error && (
                      <div className="bg-rose-50/80 backdrop-blur-sm rounded-lg p-2.5 mb-3 text-rose-700 text-xs flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-rose-400" />
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSignupSubmit} className="max-h-[380px] overflow-y-auto pr-1">
                      {renderSignupFields()}
                    </form>

                    {/* ====== LEGAL DISCLAIMER - ADDED ====== */}
                    <div className="mt-3 text-[10px] text-[#A0A0B0] text-center leading-relaxed border-t border-[#EEECE6] pt-3">
                      By creating an account, you agree to our{' '}
                      <Link to="/privacy" className="text-[#FFBE91] hover:underline transition-colors">
                        Privacy Policy
                      </Link>
                      {' '}and{' '}
                      <Link to="/terms" className="text-[#FFBE91] hover:underline transition-colors">
                        Terms of Service
                      </Link>
                    </div>

                    <p className="text-center text-xs text-[#A0A0B0] mt-2">
                      Already have an account?{' '}
                      <button
                        type="button"
                        className="text-[#1A1A2E] font-medium hover:underline transition-all"
                        onClick={() => { setIsSignIn(true); setError(''); setSignupStep(0); }}
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;