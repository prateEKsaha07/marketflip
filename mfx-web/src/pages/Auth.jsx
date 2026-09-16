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
  FileText,
  Gavel,
  Shield,
  ArrowRight,
  ArrowLeft,
  Phone,
  MapPin,
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
    const currentStep = signupSteps[signupStep];

    for (const field of currentStep.fields) {
      if (!signupData[field] || signupData[field].trim() === '') {
        setError(`Please fill in ${field.replace('_', ' ')}`);
        return;
      }
    }

    if (
      currentStep.fields.includes('password') &&
      signupData.password !== signupData.confirmPassword
    ) {
      setError('Passwords do not match');
      return;
    }

    if (
      currentStep.fields.includes('pincode') &&
      signupData.pincode.length !== 6
    ) {
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

  // ===== Motion variants =====
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 30 : -30,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    },
    exit: (direction) => ({
      x: direction < 0 ? 30 : -30,
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeIn' },
    }),
  };

  const buttonHover = {
    scale: 1.02,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  };

  // ===== Input styling (borderless, soft blend) =====
  const inputClass =
    'w-full pl-10 pr-10 py-2.5 text-sm bg-white/60 rounded-lg ' +
    'text-[#1A1A2E] placeholder:text-[#A0A0B0] ' +
    'focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FFBE91]/40 ' +
    'transition-all duration-300';

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
        className="space-y-3.5 py-1"
      >
        {/* Progress Indicator */}
        <div className="flex items-center gap-1.5 mb-4">
          {signupSteps.map((_, index) => (
            <motion.div
              key={index}
              className="flex-1 h-0.5 rounded-full"
              animate={{
                backgroundColor:
                  index <= signupStep ? '#1A1A2E' : 'rgba(238,236,230,0.6)',
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* Step Header */}
        <motion.div
          className="flex items-center gap-2 mb-4"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <span className="text-[#A0A0B0]">{step.icon}</span>
          <div>
            <h3 className="text-sm font-medium text-[#1A1A2E]">{step.title}</h3>
            <p className="text-[10px] text-[#A0A0B0]">{step.description}</p>
          </div>
          <span className="ml-auto text-[10px] text-[#A0A0B0]">
            {signupStep + 1}/{signupSteps.length}
          </span>
        </motion.div>

        {step.fields.includes('email') && (
          <motion.div
            className="relative px-1"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
          >
            <Mail
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] z-10 pointer-events-none"
            />
            <input
              type="email"
              name="email"
              value={signupData.email}
              onChange={handleSignupChange}
              placeholder="Email address"
              className={inputClass}
              required
            />
          </motion.div>
        )}

        {step.fields.includes('password') && (
          <>
            <motion.div
              className="relative px-1"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <Lock
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] z-10 pointer-events-none"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={signupData.password}
                onChange={handleSignupChange}
                placeholder="Password"
                className={inputClass}
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors z-10"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </motion.div>

            <motion.div
              className="relative px-1"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <Lock
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] z-10 pointer-events-none"
              />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={signupData.confirmPassword}
                onChange={handleSignupChange}
                placeholder="Confirm password"
                className={inputClass}
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors z-10"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={14} />
                ) : (
                  <Eye size={14} />
                )}
              </button>
            </motion.div>
          </>
        )}

        {step.fields.includes('role') && (
          <motion.div
            className="flex gap-1.5 bg-white/60 rounded-lg p-1 relative mx-1"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
          >
            <button
              type="button"
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-300 relative z-10 ${
                signupData.role === 'buyer'
                  ? 'text-[#1A1A2E]'
                  : 'text-[#A0A0B0] hover:text-[#1A1A2E]'
              }`}
              onClick={() => setSignupData({ ...signupData, role: 'buyer' })}
            >
              Buyer
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-300 relative z-10 ${
                signupData.role === 'shop_owner'
                  ? 'text-[#1A1A2E]'
                  : 'text-[#A0A0B0] hover:text-[#1A1A2E]'
              }`}
              onClick={() =>
                setSignupData({ ...signupData, role: 'shop_owner' })
              }
            >
              Shop Owner
            </button>
            <motion.div
              className="absolute top-1 bottom-1 rounded-md bg-white shadow-sm"
              animate={{
                left: signupData.role === 'buyer' ? '4px' : '50%',
                right: signupData.role === 'buyer' ? '50%' : '4px',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          </motion.div>
        )}

        {step.fields.includes('shop_name') &&
          signupData.role === 'shop_owner' && (
            <motion.div
              className="relative px-1"
              initial={{ opacity: 0, height: 0, x: -8 }}
              animate={{ opacity: 1, height: 'auto', x: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <Store
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] z-10 pointer-events-none"
              />
              <input
                type="text"
                name="shop_name"
                value={signupData.shop_name}
                onChange={handleSignupChange}
                placeholder="Shop name"
                className={inputClass}
                required={signupData.role === 'shop_owner'}
              />
            </motion.div>
          )}

        {step.fields.includes('address') && (
          <motion.div
            className="relative px-1"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
          >
            <Home
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] z-10 pointer-events-none"
            />
            <input
              type="text"
              name="address"
              value={signupData.address}
              onChange={handleSignupChange}
              placeholder="Address"
              className={inputClass}
              required
            />
          </motion.div>
        )}

        {step.fields.includes('pincode') && (
          <motion.div
            className="relative px-1"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <MapPin
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] z-10 pointer-events-none"
            />
            <input
              type="text"
              name="pincode"
              value={signupData.pincode}
              onChange={handleSignupChange}
              placeholder="Pincode"
              maxLength="6"
              className={inputClass}
              required
            />
          </motion.div>
        )}

        {step.fields.includes('phone') && (
          <motion.div
            className="relative px-1"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <Phone
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] z-10 pointer-events-none"
            />
            <input
              type="tel"
              name="phone"
              value={signupData.phone}
              onChange={handleSignupChange}
              placeholder="Phone number"
              className={inputClass}
              required
            />
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-2 pt-3 px-1">
          {signupStep > 0 && (
            <motion.button
              whileHover={buttonHover}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handlePrevStep}
              className="flex-1 py-2.5 text-sm font-medium bg-white/60 hover:bg-white text-[#1A1A2E] rounded-lg transition-all duration-300"
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
              className={`${
                signupStep > 0 ? 'flex-1' : 'w-full'
              } py-2.5 text-sm font-medium bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white rounded-lg transition-all duration-300 shadow-lg shadow-[#1A1A2E]/10 hover:shadow-xl hover:shadow-[#1A1A2E]/20`}
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
              className="w-full py-2.5 text-sm font-medium bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white rounded-lg transition-all duration-300 shadow-lg shadow-[#1A1A2E]/10 hover:shadow-xl hover:shadow-[#1A1A2E]/20 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background blobs */}
      <motion.div
        className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#FFBE91]/15 blur-3xl pointer-events-none"
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-[#CFEBFF]/15 blur-3xl pointer-events-none"
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-[#FFDDB0]/10 blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

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
        className="relative flex w-full max-w-4xl min-h-[560px] bg-white/50 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-[#1A1A2E]/5 overflow-hidden"
      >
        {/* Left Side - Brand (Hidden on Signup) */}
        <AnimatePresence mode="wait">
          {isSignIn && (
            <motion.div
              key="brand"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="hidden md:flex w-[38%] relative overflow-hidden bg-gradient-to-br from-[#1A1A2E] via-[#2A2A3E] to-[#1A1A2E] p-8 flex-col justify-center flex-shrink-0"
            >
              <motion.div
                className="absolute top-10 right-10 w-32 h-32 rounded-full bg-[#FFBE91]/10 blur-2xl"
                animate={{
                  x: [0, 20, -10, 0],
                  y: [0, -20, 10, 0],
                  scale: [1, 1.15, 0.95, 1],
                }}
                transition={{
                  duration: 16,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className="absolute bottom-10 left-10 w-24 h-24 rounded-full bg-[#CFEBFF]/10 blur-2xl"
                animate={{
                  x: [0, -15, 15, 0],
                  y: [0, 15, -10, 0],
                  scale: [1, 0.9, 1.1, 1],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 2,
                }}
              />
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[#FFDDB0]/8 blur-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{
                  duration: 14,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1,
                }}
              />

              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 mb-2"
                >
                  <motion.div
                    animate={{
                      rotate: [0, 10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <Sparkles size={18} className="text-[#FFBE91]" />
                  </motion.div>
                  <h1 className="text-xl font-semibold text-white">
                    MarketFlip
                  </h1>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-white/60 mb-6"
                >
                  Where buyers set the price.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2.5"
                >
                  {[
                    {
                      icon: <FileText size={14} className="text-[#FFBE91]" />,
                      text: 'Post requests or start auctions',
                    },
                    {
                      icon: <Gavel size={14} className="text-[#FFDDB0]" />,
                      text: 'Let shops compete for you',
                    },
                    {
                      icon: <Shield size={14} className="text-[#CFEBFF]" />,
                      text: 'Every handoff verified',
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.4 + i * 0.1,
                        duration: 0.4,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="flex items-center gap-2.5 text-sm text-white/70"
                    >
                      {item.icon}
                      <span>{item.text}</span>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-6 pt-4 border-t border-white/10"
                >
                  <span className="text-xs text-white/40">
                    Join the community
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Side - Forms */}
        <div className="flex-1 p-6 md:p-10 flex flex-col min-w-0">
          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex bg-white/40 backdrop-blur-sm rounded-lg p-1 mb-6 w-full max-w-[200px] relative"
          >
            <button
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-300 relative z-10 ${
                isSignIn
                  ? 'text-[#1A1A2E]'
                  : 'text-[#A0A0B0] hover:text-[#1A1A2E]'
              }`}
              onClick={() => {
                setIsSignIn(true);
                setError('');
                setSignupStep(0);
              }}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-300 relative z-10 ${
                !isSignIn
                  ? 'text-[#1A1A2E]'
                  : 'text-[#A0A0B0] hover:text-[#1A1A2E]'
              }`}
              onClick={() => {
                setIsSignIn(false);
                setError('');
                setSignupStep(0);
              }}
            >
              Sign Up
            </button>
            <motion.div
              className="absolute top-1 bottom-1 rounded-md bg-white shadow-sm"
              animate={{
                left: isSignIn ? '4px' : '50%',
                right: isSignIn ? '50%' : '4px',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          </motion.div>

          {/* Form Container */}
          <div className="flex-1 min-w-0 relative px-1">
            <AnimatePresence mode="wait" custom={isSignIn ? 1 : -1}>
              {isSignIn ? (
                <motion.div
                  key="signin"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0 px-2"
                >
                  <div>
                    <motion.h2
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="text-base font-semibold text-[#1A1A2E]"
                    >
                      Welcome Back
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-xs text-[#A0A0B0] mb-4"
                    >
                      Sign in to your account
                    </motion.p>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -4 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -4 }}
                          className="bg-rose-50/60 backdrop-blur-sm rounded-lg p-2.5 mb-3 text-rose-700 text-xs flex items-center gap-2 overflow-hidden"
                        >
                          <span className="w-1 h-1 rounded-full bg-rose-400" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                      <motion.div
                        className="relative"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.3 }}
                      >
                        <Mail
                          size={14}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] z-10 pointer-events-none"
                        />
                        <input
                          type="email"
                          name="email"
                          value={loginData.email}
                          onChange={handleLoginChange}
                          placeholder="Email address"
                          className={inputClass}
                          required
                        />
                      </motion.div>

                      <motion.div
                        className="relative"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        <Lock
                          size={14}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] z-10 pointer-events-none"
                        />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={loginData.password}
                          onChange={handleLoginChange}
                          placeholder="Password"
                          className={inputClass}
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors z-10"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                      </motion.div>

                      <motion.button
                        whileHover={buttonHover}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full py-2.5 text-sm font-medium bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white rounded-lg transition-all duration-300 shadow-lg shadow-[#1A1A2E]/10 hover:shadow-xl hover:shadow-[#1A1A2E]/20 disabled:opacity-50"
                        disabled={loading}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.3 }}
                      >
                        {loading ? 'Signing in...' : 'Sign In'}
                      </motion.button>
                    </form>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-center text-xs text-[#A0A0B0] mt-4"
                    >
                      Don't have an account?{' '}
                      <button
                        type="button"
                        className="text-[#1A1A2E] font-medium hover:underline transition-all"
                        onClick={() => {
                          setIsSignIn(false);
                          setError('');
                          setSignupStep(0);
                        }}
                      >
                        Sign Up
                      </button>
                    </motion.p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  custom={-1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0 px-2"
                >
                  <div>
                    <h2 className="text-base font-semibold text-[#1A1A2E]">
                      Create Account
                    </h2>
                    <p className="text-xs text-[#A0A0B0] mb-3">
                      Join MarketFlip today
                    </p>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -4 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -4 }}
                          className="bg-rose-50/60 backdrop-blur-sm rounded-lg p-2.5 mb-3 text-rose-700 text-xs flex items-center gap-2 overflow-hidden"
                        >
                          <span className="w-1 h-1 rounded-full bg-rose-400" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form
                      onSubmit={handleSignupSubmit}
                      className="max-h-[380px] overflow-y-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                      {renderSignupFields()}
                    </form>

                    <div className="mt-3 text-[10px] text-[#A0A0B0] text-center leading-relaxed pt-3">
                      By creating an account, you agree to our{' '}
                      <Link
                        to="/privacy"
                        className="text-[#FFBE91] hover:underline transition-colors"
                      >
                        Privacy Policy
                      </Link>{' '}
                      and{' '}
                      <Link
                        to="/terms"
                        className="text-[#FFBE91] hover:underline transition-colors"
                      >
                        Terms of Service
                      </Link>
                    </div>

                    <p className="text-center text-xs text-[#A0A0B0] mt-2">
                      Already have an account?{' '}
                      <button
                        type="button"
                        className="text-[#1A1A2E] font-medium hover:underline transition-all"
                        onClick={() => {
                          setIsSignIn(true);
                          setError('');
                          setSignupStep(0);
                        }}
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