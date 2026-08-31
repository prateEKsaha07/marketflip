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
  Image as ImageIcon,
  Upload,
  X,
  Home,
  Truck,
  Clock,
  Pin
} from 'lucide-react';
import api from '../../api/client';
import { useCloudinary } from '../../hooks/useCloudinary';

const PostRequest = () => {
  const navigate = useNavigate();
  const { uploadMultiple, uploading, progress, error: uploadError, reset } = useCloudinary();
  
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    budget_min: '',
    budget_max: '',
    pincode: '',
    category: 'electronics',
    delivery_method: 'home_delivery',
    delivery_address: '',
  });
  
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [focused, setFocused] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    console.log('Files selected:', files);
    
    const validFiles = files.filter((file) => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were skipped. Allowed: jpg, png, webp, max 5MB each.');
    }

    const totalImages = imageFiles.length + validFiles.length;
    if (totalImages > 5) {
      setError('Maximum 5 images allowed.');
      return;
    }

    const previews = validFiles.map((file) => URL.createObjectURL(file));
    setImageFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...previews]);
    setError('');
    console.log('Valid files:', validFiles.length, 'Image files:', imageFiles.length + validFiles.length);
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    URL.revokeObjectURL(imagePreviews[index]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    console.log('=== SUBMITTING REQUEST ===');
    console.log('Form data:', formData);
    console.log('Image files:', imageFiles.length, 'files');

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

    if (formData.delivery_method === 'home_delivery' && !formData.delivery_address.trim()) {
      setError('Please enter a delivery address');
      setLoading(false);
      return;
    }

    try {
      let uploadedUrls = [];
      
      if (imageFiles.length > 0) {
        console.log('Uploading images to Cloudinary...');
        const results = await uploadMultiple(imageFiles);
        console.log('Upload results:', results);
        uploadedUrls = results.map((result) => result.url);
        console.log('Uploaded URLs:', uploadedUrls);
      } else {
        console.log('No images to upload');
      }

      const requestData = {
        ...formData,
        budget_min: parseInt(formData.budget_min),
        budget_max: parseInt(formData.budget_max),
        image_urls: uploadedUrls,
      };
      
      console.log('Request data being sent:', requestData);

      // FIX: Remove trailing slash
      const response = await api.post('/requests', requestData);
      console.log('Request created:', response.data);
      console.log('Image URLs in response:', response.data.image_urls);
      
      setSuccess('Request created successfully!');

      setFormData({
        item_name: '',
        description: '',
        budget_min: '',
        budget_max: '',
        pincode: '',
        category: 'electronics',
        delivery_method: 'home_delivery',
        delivery_address: '',
      });
      setImageFiles([]);
      setImagePreviews([]);

      setTimeout(() => {
        navigate('/buyer/dashboard');
      }, 1500);

    } catch (err) {
      console.error('Error:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.detail || 'Failed to create request');
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
              onClick={() => navigate('/buyer/requests')}
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
                      <option value="electronics">Electronics</option>
                      <option value="furniture">Furniture</option>
                      <option value="clothing">Clothing</option>
                      <option value="books">Books</option>
                      <option value="home_kitchen">Home & Kitchen</option>
                    </select>
                  </motion.div>
                </motion.div>

                <motion.div 
                  custom={5} variants={fieldVariants} initial="hidden" animate="visible"
                >
                  <label className="block text-xs font-semibold text-[#1A1A2E] mb-1 flex items-center gap-2">
                    <motion.div 
                      variants={iconVariants}
                      initial="initial"
                      animate="animate"
                      className="w-5 h-5 rounded-lg bg-[#FFBE91]/10 flex items-center justify-center"
                    >
                      <Truck size={12} className="text-[#FFBE91]" />
                    </motion.div>
                    Delivery Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, delivery_method: 'home_delivery' }));
                        if (error) setError('');
                      }}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-xl border-2 transition-all ${
                        formData.delivery_method === 'home_delivery'
                          ? 'border-[#FFBE91] bg-[#FFBE91]/10 text-[#1A1A2E]'
                          : 'border-[#EEECE6] bg-white/50 text-[#A0A0B0] hover:border-[#FFDDB0]'
                      }`}
                    >
                      <Home size={14} />
                      Home Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, delivery_method: 'pickup' }));
                        if (error) setError('');
                      }}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-xl border-2 transition-all ${
                        formData.delivery_method === 'pickup'
                          ? 'border-[#FFBE91] bg-[#FFBE91]/10 text-[#1A1A2E]'
                          : 'border-[#EEECE6] bg-white/50 text-[#A0A0B0] hover:border-[#FFDDB0]'
                      }`}
                    >
                      <MapPin size={14} />
                      Pickup
                    </button>
                  </div>
                </motion.div>

                {formData.delivery_method === 'home_delivery' && (
                  <motion.div 
                    custom={6} variants={fieldVariants} initial="hidden" animate="visible"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-xs font-semibold text-[#1A1A2E] mb-1 flex items-center gap-2">
                      <span>Delivery Address</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      name="delivery_address"
                      value={formData.delivery_address}
                      onChange={handleChange}
                      placeholder="Enter your full delivery address..."
                      rows={2}
                      className="w-full px-3 py-2.5 text-sm bg-[#FFFCE1]/80 border-2 border-[#FFDDB0]/50 rounded-xl text-[#1A1A2E] placeholder-[#A0A0B0] focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all resize-none"
                      required={formData.delivery_method === 'home_delivery'}
                    />
                  </motion.div>
                )}

                <motion.div 
                  custom={7} variants={fieldVariants} initial="hidden" animate="visible"
                >
                  <label className="block text-xs font-semibold text-[#1A1A2E] mb-1 flex items-center gap-2">
                    <motion.div 
                      variants={iconVariants}
                      initial="initial"
                      animate="animate"
                      className="w-5 h-5 rounded-lg bg-[#CFEBFF]/10 flex items-center justify-center"
                    >
                      <ImageIcon size={12} className="text-[#CFEBFF]" />
                    </motion.div>
                    Images (Optional, max 5)
                  </label>
                  <div className="border-2 border-dashed border-[#FFDDB0]/50 rounded-xl p-4 text-center hover:border-[#FFBE91] transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="image-upload"
                      disabled={imageFiles.length >= 5 || loading}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`cursor-pointer flex flex-col items-center gap-2 ${(loading) ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <Upload size={28} className="text-[#A0A0B0]" />
                      <span className="text-sm text-[#A0A0B0]">
                        Click to upload images (JPG, PNG, WEBP, max 5MB each)
                      </span>
                      <span className="text-xs text-[#A0A0B0]">
                        {imageFiles.length}/5 images selected
                      </span>
                    </label>
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-[#EEECE6]"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            disabled={loading}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 transition-colors disabled:opacity-50"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploading && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-[#FFBE91]" />
                        <span className="text-sm text-[#4A4A5A]">Uploading... {progress}%</span>
                      </div>
                      <div className="w-full bg-[#EEECE6] rounded-full h-2 mt-1">
                        <div
                          className="bg-[#FFBE91] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>

                <motion.div 
                  custom={8} variants={fieldVariants} initial="hidden" animate="visible"
                  className="pt-2"
                >
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="w-full bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF] hover:from-[#FFA87A] hover:via-[#FFDDB0] hover:to-[#CFEBFF] text-[#1A1A2E] py-3 text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading || uploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {uploading ? `Uploading... ${progress}%` : 'Creating...'}
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

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 pt-3 border-t border-[#FFDDB0]/30 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#A0A0B0]"
              >
                <span className="flex items-center gap-1.5">
                  <Pin size={12} className="text-[#FFBE91]" />
                  Visible to local shops
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} className="text-[#CFEBFF]" />
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