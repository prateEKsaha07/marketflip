import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Plus, 
  Loader2,
  ShoppingBag,
  FileText,
  DollarSign,
  MapPin,
  Layers,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Link2,
  Image as ImageIcon
} from 'lucide-react';
import api from '../../api/client';

const PostRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    budget_min: '',
    budget_max: '',
    pincode: '',
    category: 'electronics',
    reference_url: '',
    reference_image: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [focused, setFocused] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (parseInt(formData.budget_min) > parseInt(formData.budget_max)) {
      setError('Min budget cannot be greater than max budget');
      setLoading(false);
      return;
    }

    if (formData.pincode.length !== 6 || !/^\d{6}$/.test(formData.pincode)) {
      setError('Please enter a valid 6-digit pincode');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        budget_min: parseInt(formData.budget_min),
        budget_max: parseInt(formData.budget_max),
        reference_url: formData.reference_url || null,
        reference_image: formData.reference_image || null
      };
      
      const response = await api.post('/requests', payload);
      console.log('Request created:', response.data);
      setSuccess('✅ Request created successfully!');
      
      setFormData({
        item_name: '',
        description: '',
        budget_min: '',
        budget_max: '',
        pincode: '',
        category: 'electronics',
        reference_url: '',
        reference_image: ''
      });
      
      setTimeout(() => {
        navigate('/buyer/dashboard');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputVariants = {
    focus: { scale: 1.01, transition: { duration: 0.2 } },
    blur: { scale: 1, transition: { duration: 0.2 } }
  };

  const iconVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
    hover: { scale: 1.1, rotate: 5, transition: { duration: 0.2 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const fieldVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({ 
      opacity: 1, 
      x: 0,
      transition: { delay: i * 0.08, duration: 0.4 }
    })
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFCE1] via-[#FFDDB0]/10 to-[#CFEBFF]/10 p-4 md:p-6">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-5"
        >
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/buyer/dashboard')}
              className="p-2 rounded-xl hover:bg-[#FFBE91]/10 text-[#4A4A5A] hover:text-[#FFBE91] transition-all"
            >
              <ArrowLeft size={18} />
            </motion.button>
            <div>
              <h1 className="text-xl font-bold text-[#1A1A2E]">Post Request</h1>
              <p className="text-xs text-[#4A4A5A]">Get the best deals from local shops</p>
            </div>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#FFBE91]/10 rounded-full border border-[#FFBE91]/20"
          >
            <Sparkles size={12} className="text-[#FFBE91]" />
            <span className="text-[10px] font-medium text-[#FFBE91]">Flip How You Buy</span>
          </motion.div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-xl overflow-hidden">
            <motion.div 
              className="h-1 bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            
            <CardContent className="p-5 md:p-6">
              {/* Success Message */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-xl flex items-center gap-3 overflow-hidden"
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"
                    >
                      <CheckCircle size={16} className="text-emerald-600" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-medium text-emerald-700">{success}</p>
                      <p className="text-[10px] text-emerald-600/70">Redirecting...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 bg-gradient-to-r from-rose-50 to-rose-100/50 border border-rose-200 rounded-xl flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle size={16} className="text-rose-600" />
                    </div>
                    <p className="text-sm font-medium text-rose-600">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Item Name */}
                <motion.div 
                  custom={0} variants={fieldVariants} initial="hidden" animate="visible"
                  onFocus={() => setFocused('item')}
                  onBlur={() => setFocused(null)}
                >
                  <label className="block text-xs font-semibold text-[#1A1A2E] mb-1 flex items-center gap-2">
                    <motion.div 
                      variants={iconVariants}
                      initial="initial"
                      animate={focused === 'item' ? 'hover' : 'animate'}
                      className="w-5 h-5 rounded-lg bg-[#FFBE91]/10 flex items-center justify-center"
                    >
                      <ShoppingBag size={12} className="text-[#FFBE91]" />
                    </motion.div>
                    What are you looking for? <span className="text-rose-400">*</span>
                  </label>
                  <motion.div variants={inputVariants} animate={focused === 'item' ? 'focus' : 'blur'}>
                    <input
                      type="text"
                      name="item_name"
                      value={formData.item_name}
                      onChange={handleChange}
                      placeholder="e.g., iPhone 15 Pro"
                      className="w-full px-3 py-2.5 text-sm bg-[#FFFCE1]/80 border-2 border-[#FFDDB0]/50 rounded-xl text-[#1A1A2E] placeholder-[#A0A0B0] focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                      required
                    />
                  </motion.div>
                  <p className="text-[10px] text-[#A0A0B0] mt-1">Be specific to get better offers</p>
                </motion.div>

                {/* Description */}
                <motion.div 
                  custom={1} variants={fieldVariants} initial="hidden" animate="visible"
                  onFocus={() => setFocused('desc')}
                  onBlur={() => setFocused(null)}
                >
                  <label className="block text-xs font-semibold text-[#1A1A2E] mb-1 flex items-center gap-2">
                    <motion.div 
                      variants={iconVariants}
                      initial="initial"
                      animate={focused === 'desc' ? 'hover' : 'animate'}
                      className="w-5 h-5 rounded-lg bg-[#FFDDB0]/10 flex items-center justify-center"
                    >
                      <FileText size={12} className="text-[#FFDDB0]" />
                    </motion.div>
                    Description
                  </label>
                  <motion.div variants={inputVariants} animate={focused === 'desc' ? 'focus' : 'blur'}>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe what you're looking for..."
                      rows={2}
                      className="w-full px-3 py-2.5 text-sm bg-[#FFFCE1]/80 border-2 border-[#FFDDB0]/50 rounded-xl text-[#1A1A2E] placeholder-[#A0A0B0] focus:outline-none focus:ring-4 focus:ring-[#FFDDB0]/20 focus:border-[#FFDDB0] transition-all resize-none"
                    />
                  </motion.div>
                </motion.div>

                {/* Budget */}
                <motion.div 
                  custom={2} variants={fieldVariants} initial="hidden" animate="visible"
                  className="grid grid-cols-2 gap-3"
                >
                  <div onFocus={() => setFocused('min')} onBlur={() => setFocused(null)}>
                    <label className="block text-xs font-semibold text-[#1A1A2E] mb-1 flex items-center gap-2">
                      <motion.div 
                        variants={iconVariants}
                        initial="initial"
                        animate={focused === 'min' ? 'hover' : 'animate'}
                        className="w-5 h-5 rounded-lg bg-[#FFBE91]/10 flex items-center justify-center"
                      >
                        <DollarSign size={12} className="text-[#FFBE91]" />
                      </motion.div>
                      Min <span className="text-rose-400">*</span>
                    </label>
                    <motion.div variants={inputVariants} animate={focused === 'min' ? 'focus' : 'blur'}>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A5A] text-xs font-medium">₹</span>
                        <input
                          type="number"
                          name="budget_min"
                          value={formData.budget_min}
                          onChange={handleChange}
                          placeholder="80000"
                          className="w-full pl-6 pr-3 py-2.5 text-sm bg-[#FFFCE1]/80 border-2 border-[#FFDDB0]/50 rounded-xl text-[#1A1A2E] placeholder-[#A0A0B0] focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                          required
                          min="0"
                        />
                      </div>
                    </motion.div>
                  </div>
                  <div onFocus={() => setFocused('max')} onBlur={() => setFocused(null)}>
                    <label className="block text-xs font-semibold text-[#1A1A2E] mb-1 flex items-center gap-2">
                      <motion.div 
                        variants={iconVariants}
                        initial="initial"
                        animate={focused === 'max' ? 'hover' : 'animate'}
                        className="w-5 h-5 rounded-lg bg-[#CFEBFF]/10 flex items-center justify-center"
                      >
                        <DollarSign size={12} className="text-[#CFEBFF]" />
                      </motion.div>
                      Max <span className="text-rose-400">*</span>
                    </label>
                    <motion.div variants={inputVariants} animate={focused === 'max' ? 'focus' : 'blur'}>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A5A] text-xs font-medium">₹</span>
                        <input
                          type="number"
                          name="budget_max"
                          value={formData.budget_max}
                          onChange={handleChange}
                          placeholder="100000"
                          className="w-full pl-6 pr-3 py-2.5 text-sm bg-[#FFFCE1]/80 border-2 border-[#FFDDB0]/50 rounded-xl text-[#1A1A2E] placeholder-[#A0A0B0] focus:outline-none focus:ring-4 focus:ring-[#CFEBFF]/20 focus:border-[#CFEBFF] transition-all"
                          required
                          min="0"
                        />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Pincode */}
                <motion.div 
                  custom={3} variants={fieldVariants} initial="hidden" animate="visible"
                  onFocus={() => setFocused('pin')}
                  onBlur={() => setFocused(null)}
                >
                  <label className="block text-xs font-semibold text-[#1A1A2E] mb-1 flex items-center gap-2">
                    <motion.div 
                      variants={iconVariants}
                      initial="initial"
                      animate={focused === 'pin' ? 'hover' : 'animate'}
                      className="w-5 h-5 rounded-lg bg-[#FFBE91]/10 flex items-center justify-center"
                    >
                      <MapPin size={12} className="text-[#FFBE91]" />
                    </motion.div>
                    Your Location <span className="text-rose-400">*</span>
                  </label>
                  <motion.div variants={inputVariants} animate={focused === 'pin' ? 'focus' : 'blur'}>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="Enter 6-digit pincode"
                      maxLength="6"
                      className="w-full px-3 py-2.5 text-sm bg-[#FFFCE1]/80 border-2 border-[#FFDDB0]/50 rounded-xl text-[#1A1A2E] placeholder-[#A0A0B0] focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                      required
                    />
                  </motion.div>
                  <p className="text-[10px] text-[#A0A0B0] mt-1">Shop owners in your area will see your request</p>
                </motion.div>

                {/* Category */}
                <motion.div 
                  custom={4} variants={fieldVariants} initial="hidden" animate="visible"
                  onFocus={() => setFocused('cat')}
                  onBlur={() => setFocused(null)}
                >
                  <label className="block text-xs font-semibold text-[#1A1A2E] mb-1 flex items-center gap-2">
                    <motion.div 
                      variants={iconVariants}
                      initial="initial"
                      animate={focused === 'cat' ? 'hover' : 'animate'}
                      className="w-5 h-5 rounded-lg bg-[#FFDDB0]/10 flex items-center justify-center"
                    >
                      <Layers size={12} className="text-[#FFDDB0]" />
                    </motion.div>
                    Category
                  </label>
                  <motion.div variants={inputVariants} animate={focused === 'cat' ? 'focus' : 'blur'}>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 text-sm bg-[#FFFCE1]/80 border-2 border-[#FFDDB0]/50 rounded-xl text-[#1A1A2E] focus:outline-none focus:ring-4 focus:ring-[#FFDDB0]/20 focus:border-[#FFDDB0] transition-all appearance-none"
                    >
                      <option value="electronics">📱 Electronics</option>
                      <option value="clothing">👕 Clothing</option>
                      <option value="furniture">🪑 Furniture</option>
                      <option value="books">📚 Books</option>
                      <option value="vehicles">🚗 Vehicles</option>
                      <option value="other">📦 Other</option>
                    </select>
                  </motion.div>
                </motion.div>

                {/* Reference URL - NEW */}
                <motion.div 
                  custom={5} variants={fieldVariants} initial="hidden" animate="visible"
                  onFocus={() => setFocused('ref')}
                  onBlur={() => setFocused(null)}
                >
                  <label className="block text-xs font-semibold text-[#1A1A2E] mb-1 flex items-center gap-2">
                    <motion.div 
                      variants={iconVariants}
                      initial="initial"
                      animate={focused === 'ref' ? 'hover' : 'animate'}
                      className="w-5 h-5 rounded-lg bg-[#CFEBFF]/10 flex items-center justify-center"
                    >
                      <Link2 size={12} className="text-[#CFEBFF]" />
                    </motion.div>
                    Reference URL
                  </label>
                  <motion.div variants={inputVariants} animate={focused === 'ref' ? 'focus' : 'blur'}>
                    <input
                      type="url"
                      name="reference_url"
                      value={formData.reference_url}
                      onChange={handleChange}
                      placeholder="https://example.com/product"
                      className="w-full px-3 py-2.5 text-sm bg-[#FFFCE1]/80 border-2 border-[#FFDDB0]/50 rounded-xl text-[#1A1A2E] placeholder-[#A0A0B0] focus:outline-none focus:ring-4 focus:ring-[#CFEBFF]/20 focus:border-[#CFEBFF] transition-all"
                    />
                  </motion.div>
                  <p className="text-[10px] text-[#A0A0B0] mt-1">Link to product for reference</p>
                </motion.div>

                {/* Reference Image - NEW */}
                <motion.div 
                  custom={6} variants={fieldVariants} initial="hidden" animate="visible"
                  onFocus={() => setFocused('img')}
                  onBlur={() => setFocused(null)}
                >
                  <label className="block text-xs font-semibold text-[#1A1A2E] mb-1 flex items-center gap-2">
                    <motion.div 
                      variants={iconVariants}
                      initial="initial"
                      animate={focused === 'img' ? 'hover' : 'animate'}
                      className="w-5 h-5 rounded-lg bg-[#FFBE91]/10 flex items-center justify-center"
                    >
                      <ImageIcon size={12} className="text-[#FFBE91]" />
                    </motion.div>
                    Reference Image URL
                  </label>
                  <motion.div variants={inputVariants} animate={focused === 'img' ? 'focus' : 'blur'}>
                    <input
                      type="url"
                      name="reference_image"
                      value={formData.reference_image}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2.5 text-sm bg-[#FFFCE1]/80 border-2 border-[#FFDDB0]/50 rounded-xl text-[#1A1A2E] placeholder-[#A0A0B0] focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                    />
                  </motion.div>
                  <p className="text-[10px] text-[#A0A0B0] mt-1">Image URL for reference</p>
                </motion.div>

                {/* Submit Button */}
                <motion.div 
                  custom={7} variants={fieldVariants} initial="hidden" animate="visible"
                  className="pt-2"
                >
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF] hover:from-[#FFA87A] hover:via-[#FFDDB0] hover:to-[#CFEBFF] text-[#1A1A2E] py-3 text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Post Request
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </motion.div>
              </form>

              {/* Footer */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 pt-3 border-t border-[#FFDDB0]/30 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#A0A0B0]"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-[#FFBE91]">📌</span>
                  Visible to local shops
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[#CFEBFF]">⏳</span>
                  Expires in 7 days
                </span>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PostRequest;