import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ModernNavbar from "../../components/ui/Navbar";
import { 
  ArrowLeft, 
  Loader2,
  ShoppingBag,
  FileText,
  IndianRupee,
  MapPin,
  Layers,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowRight,
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
  const { uploadMultiple, uploading, progress } = useCloudinary();
  
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
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
    if (validFiles.length === files.length) setError('');
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
        const results = await uploadMultiple(imageFiles);
        uploadedUrls = results.map((result) => result.url);
      }

      const requestData = {
        ...formData,
        budget_min: parseInt(formData.budget_min),
        budget_max: parseInt(formData.budget_max),
        image_urls: uploadedUrls,
      };
      
      await api.post('/requests', requestData);
      
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

      setTimeout(() => navigate('/buyer/dashboard'), 1500);

    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.detail || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'electronics', label: 'Electronics', icon: ShoppingBag },
    { value: 'furniture', label: 'Furniture', icon: Home },
    { value: 'clothing', label: 'Clothing', icon: Layers },
    { value: 'books', label: 'Books', icon: FileText },
    { value: 'home_kitchen', label: 'Home & Kitchen', icon: Pin },
  ];

  const inputClass = "w-full px-3.5 py-2.5 text-[13px] sm:text-[13px] bg-[#F8F6F0]/60 border-0 rounded-xl text-[#1A1A2E] placeholder-[#A0A0B0] focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/40 focus:bg-white transition-all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-3 sm:p-4 md:p-6">
      <ModernNavbar
        navItems={[
          { name: "Dashboard", path: "/buyer/dashboard", icon: "LayoutDashboard" },
          { name: "Requests", path: "/buyer/requests", icon: "FileText" },
          { name: "Auctions", path: "/buyer/auctions", icon: "Gavel" },
          { name: "Chats", path: "/buyer/chat", icon: "MessageCircle" },
          { name: "History", path: "/buyer/history", icon: "History" },
        ]}
        logo={{ src: "/Logo.png", alt: "MarketFlip", link: "/buyer/dashboard" }}
        showProfile={true}
        showLogout={true}
        showNotifications={true}
        logoutButton={{ label: "Logout", icon: "LogOut", onClick: () => {} }}
        profileButton={{ label: "Profile", path: "/buyer/profile", icon: "User" }}
      />

      <div className="max-w-xl mx-auto pt-3 sm:pt-4">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate('/buyer/requests')}
          className="flex items-center gap-1.5 mb-3 -ml-1 px-2 py-1.5 text-[11px] sm:text-[11px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors rounded-lg hover:bg-[#F5F3EF]"
        >
          <ArrowLeft size={12} />
          Back to requests
        </motion.button>

        {/* Animated Hero */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl mb-4 sm:mb-5 p-4 sm:p-5 bg-gradient-primary bg-[length:200%_200%] animate-gradient"
        >
          <motion.div
            animate={{ x: [0, 25, 0], y: [0, -18, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-lightCream/70 blur-3xl pointer-events-none"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-softBlue/50 blur-3xl pointer-events-none"
          />

          <div className="relative flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <motion.h1
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.35 }}
                className="text-base sm:text-[15px] font-bold text-[#1A1A2E] truncate"
              >
                Post a Request
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="text-[10px] sm:text-[10px] text-[#1A1A2E]/70 mt-0.5 truncate"
              >
                Get the best deals from local shops
              </motion.p>
            </div>
            <motion.div
              animate={{ opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/40 backdrop-blur-sm rounded-full flex-shrink-0 mt-0.5"
            >
              <Sparkles size={10} className="text-[#1A1A2E]" />
              <span className="text-[9px] font-medium text-[#1A1A2E]">Flip How You Buy</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Success / Error */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="p-3 bg-emerald-50 rounded-2xl flex items-start gap-2 overflow-hidden"
            >
              <CheckCircle size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-[11px] font-medium text-emerald-700">{success}</p>
                <p className="text-[9px] sm:text-[9px] text-emerald-600/70">Redirecting...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="p-3 bg-rose-50 rounded-2xl flex items-start gap-2 overflow-hidden"
            >
              <AlertCircle size={14} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] sm:text-[11px] font-medium text-rose-600 flex-1">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* ---- Section 1: What ---- */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
            className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl p-4 sm:p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-[#FFBE91]/20 flex items-center justify-center">
                <ShoppingBag size={12} className="text-[#1A1A2E]" />
              </div>
              <h2 className="text-[12px] sm:text-[12px] font-semibold text-[#1A1A2E]">
                What are you looking for?
              </h2>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                name="item_name"
                value={formData.item_name}
                onChange={handleChange}
                placeholder="e.g., iPhone 15 Pro"
                className={inputClass}
                required
              />

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add details — condition, model, preferred brand..."
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>
          </motion.section>

          {/* ---- Section 2: Budget ---- */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl p-4 sm:p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-[#CFEBFF]/50 flex items-center justify-center">
                <IndianRupee size={12} className="text-[#1A1A2E]" />
              </div>
              <h2 className="text-[12px] sm:text-[12px] font-semibold text-[#1A1A2E]">
                Your budget range
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-[10px] sm:text-[10px] text-[#A0A0B0] mb-1 ml-1">Minimum</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A5A] text-xs font-medium">₹</span>
                  <input
                    type="number"
                    name="budget_min"
                    value={formData.budget_min}
                    onChange={handleChange}
                    placeholder="80000"
                    className={`${inputClass} pl-6`}
                    required
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] sm:text-[10px] text-[#A0A0B0] mb-1 ml-1">Maximum</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A5A] text-xs font-medium">₹</span>
                  <input
                    type="number"
                    name="budget_max"
                    value={formData.budget_max}
                    onChange={handleChange}
                    placeholder="100000"
                    className={`${inputClass} pl-6`}
                    required
                    min="0"
                  />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {formData.budget_min && formData.budget_max && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-2.5 text-[10px] sm:text-[10px] text-[#A0A0B0] ml-1"
                >
                  ₹{parseInt(formData.budget_min).toLocaleString('en-IN')} – ₹{parseInt(formData.budget_max).toLocaleString('en-IN')}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.section>

          {/* ---- Section 3: Location & Category ---- */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl p-4 sm:p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-[#FFDDB0]/50 flex items-center justify-center">
                <MapPin size={12} className="text-[#1A1A2E]" />
              </div>
              <h2 className="text-[12px] sm:text-[12px] font-semibold text-[#1A1A2E]">
                Location & category
              </h2>
            </div>

            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="6-digit pincode"
              maxLength="6"
              className={`${inputClass} mb-3`}
              required
            />

            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const active = formData.category === cat.value;
                const Icon = cat.icon;
                return (
                  <motion.button
                    key={cat.value}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                    className={`px-2.5 py-1.5 text-[10px] sm:text-[10px] rounded-full transition-all flex items-center gap-1.5 ${
                      active
                        ? 'bg-[#1A1A2E] text-white font-medium'
                        : 'bg-[#F8F6F0] text-[#4A4A5A] hover:bg-[#EEECE6]'
                    }`}
                  >
                    <Icon size={10} />
                    <span>{cat.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>

          {/* ---- Section 4: Delivery ---- */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl p-4 sm:p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-[#FFBE91]/20 flex items-center justify-center">
                <Truck size={12} className="text-[#1A1A2E]" />
              </div>
              <h2 className="text-[12px] sm:text-[12px] font-semibold text-[#1A1A2E]">
                Delivery method
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'home_delivery', label: 'Home Delivery', icon: Home },
                { value: 'pickup', label: 'Self Pickup', icon: MapPin },
              ].map(({ value, label, icon: Icon }) => {
                const active = formData.delivery_method === value;
                return (
                  <motion.button
                    key={value}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, delivery_method: value }));
                      if (error) setError('');
                    }}
                    className={`relative flex items-center justify-center gap-1.5 px-3 py-3 text-[11px] sm:text-[11px] rounded-xl transition-all ${
                      active
                        ? 'bg-[#1A1A2E] text-white font-medium'
                        : 'bg-[#F8F6F0] text-[#4A4A5A] hover:bg-[#EEECE6]'
                    }`}
                  >
                    <Icon size={12} />
                    {label}
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {formData.delivery_method === 'home_delivery' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <textarea
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleChange}
                    placeholder="Enter your full delivery address..."
                    rows={2}
                    className={`${inputClass} resize-none`}
                    required={formData.delivery_method === 'home_delivery'}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* ---- Section 5: Images ---- */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl p-4 sm:p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-[#CFEBFF]/50 flex items-center justify-center">
                <ImageIcon size={12} className="text-[#1A1A2E]" />
              </div>
              <h2 className="text-[12px] sm:text-[12px] font-semibold text-[#1A1A2E]">
                Reference images
              </h2>
              <span className="text-[9px] sm:text-[9px] text-[#A0A0B0] ml-auto">Optional · max 5</span>
            </div>

            <div className="rounded-xl bg-[#F8F6F0]/60 p-3.5 sm:p-4 text-center hover:bg-[#F8F6F0] transition-colors">
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
                className={`cursor-pointer flex flex-col items-center gap-1.5 ${(loading || imageFiles.length >= 5) ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Upload size={18} className="text-[#A0A0B0]" />
                <span className="text-[11px] sm:text-[11px] text-[#4A4A5A] font-medium">
                  Tap to upload
                </span>
                <span className="text-[9px] sm:text-[9px] text-[#A0A0B0]">
                  {imageFiles.length}/5 · JPG, PNG, WEBP
                </span>
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-3">
                {imagePreviews.map((preview, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="relative aspect-square"
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={loading}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <X size={10} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {uploading && (
              <div className="mt-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Loader2 size={11} className="animate-spin text-[#FFBE91]" />
                  <span className="text-[10px] sm:text-[10px] text-[#4A4A5A]">Uploading… {progress}%</span>
                </div>
                <div className="w-full bg-[#EEECE6] rounded-full h-1 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-[#FFBE91] to-[#FFDDB0] h-1 rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </motion.section>

          {/* ---- Submit ---- */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="pt-1"
          >
            <motion.button
              type="submit"
              disabled={loading || uploading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF] bg-[length:200%_200%] animate-gradient text-[#1A1A2E] py-3 text-[12px] sm:text-[12px] font-semibold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading || uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {uploading ? `Uploading… ${progress}%` : 'Creating...'}
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  Post Request
                  <ArrowRight size={12} />
                </>
              )}
            </motion.button>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[9px] sm:text-[9px] text-[#A0A0B0]">
              <span className="flex items-center gap-1">
                <Pin size={9} className="text-[#FFBE91]" />
                Visible to local shops
              </span>
              <span className="flex items-center gap-1">
                <Clock size={9} className="text-[#5BA8D9]" />
                Expires in 7 days
              </span>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default PostRequest;