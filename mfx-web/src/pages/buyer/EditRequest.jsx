import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  ShoppingBag,
  FileText,
  IndianRupee,
  MapPin,
  Layers,
  Link2,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Sparkles,
  X,
  Home,
  Store
} from 'lucide-react';
import api from '../../api/client';

const EditRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const response = await api.get(`/requests/${id}`);
      const req = response.data;
      
      if (req.buyer_id !== user?.user_id) {
        setError("You don't have permission to edit this request");
        setLoading(false);
        return;
      }
      
      if (req.status !== 'open') {
        setError('Only open requests can be edited');
        setLoading(false);
        return;
      }
      
      setFormData({
        item_name: req.item_name || '',
        description: req.description || '',
        budget_min: req.budget_min || '',
        budget_max: req.budget_max || '',
        pincode: req.pincode || '',
        category: req.category || 'electronics',
        reference_url: req.reference_url || '',
        reference_image: req.reference_image || ''
      });
    } catch (err) {
      setError('Failed to fetch request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    if (parseInt(formData.budget_min) > parseInt(formData.budget_max)) {
      setError('Min budget cannot be greater than max budget');
      setSubmitting(false);
      return;
    }

    if (formData.pincode.length !== 6 || !/^\d{6}$/.test(formData.pincode)) {
      setError('Please enter a valid 6-digit pincode');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        item_name: formData.item_name,
        description: formData.description,
        budget_min: parseInt(formData.budget_min),
        budget_max: parseInt(formData.budget_max),
        pincode: formData.pincode,
        category: formData.category,
        reference_url: formData.reference_url || null,
        reference_image: formData.reference_image || null
      };

      await api.patch(`/requests/${id}`, payload);
      
      setSuccess('Request updated successfully!');
      
      setTimeout(() => {
        navigate('/buyer/dashboard');
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update request');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { value: 'electronics', label: 'Electronics', icon: ShoppingBag },
    { value: 'furniture', label: 'Furniture', icon: Home },
    { value: 'clothing', label: 'Clothing', icon: Layers },
    { value: 'books', label: 'Books', icon: FileText },
    { value: 'vehicles', label: 'Vehicles', icon: MapPin },
    { value: 'other', label: 'Other', icon: Layers },
  ];

  const inputClass = "w-full px-3.5 py-2.5 text-[13px] bg-[#F8F6F0]/60 border-0 rounded-xl text-[#1A1A2E] placeholder-[#A0A0B0] focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/40 focus:bg-white transition-all";

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin text-[#1A1A2E]" />
          <p className="text-[11px] text-[#A0A0B0]">Loading request…</p>
        </div>
      </div>
    );
  }

  /* ---------- Error / Permission ---------- */
  if (error && !formData.item_name) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0] p-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={24} className="text-rose-500" />
          </div>
          <h2 className="text-base font-semibold text-[#1A1A2E]">Cannot edit</h2>
          <p className="text-[11px] text-[#A0A0B0] mt-1">{error}</p>
          <button
            onClick={() => navigate('/buyer/requests')}
            className="mt-4 inline-flex items-center gap-1.5 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[11px] font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <ArrowLeft size={12} />
            Back to requests
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-3 sm:p-4 md:p-6">
      <div className="max-w-xl mx-auto pt-3 sm:pt-4">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate('/buyer/requests')}
          className="flex items-center gap-1.5 mb-3 -ml-1 px-2 py-1.5 text-[11px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors rounded-lg hover:bg-[#F5F3EF]"
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
                Edit Request
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="text-[10px] text-[#1A1A2E]/70 mt-0.5 truncate"
              >
                Updating #{id?.slice(0, 8)} · changes go live instantly
              </motion.p>
            </div>
            <motion.div
              animate={{ opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/40 backdrop-blur-sm rounded-full flex-shrink-0 mt-0.5"
            >
              <Sparkles size={10} className="text-[#1A1A2E]" />
              <span className="text-[9px] font-medium text-[#1A1A2E]">Edit Mode</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Success */}
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
                <p className="text-[11px] font-medium text-emerald-700">{success}</p>
                <p className="text-[9px] text-emerald-600/70">Redirecting…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error (inline) */}
        <AnimatePresence>
          {error && formData.item_name && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="p-3 bg-rose-50 rounded-2xl flex items-start gap-2 overflow-hidden"
            >
              <AlertCircle size={14} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-rose-600 flex-1">{error}</p>
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
              <h2 className="text-[12px] font-semibold text-[#1A1A2E]">
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
              <h2 className="text-[12px] font-semibold text-[#1A1A2E]">
                Your budget range
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-[10px] text-[#A0A0B0] mb-1 ml-1">Minimum</label>
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
                <label className="block text-[10px] text-[#A0A0B0] mb-1 ml-1">Maximum</label>
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
                  className="mt-2.5 text-[10px] text-[#A0A0B0] ml-1"
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
              <h2 className="text-[12px] font-semibold text-[#1A1A2E]">
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
                    className={`px-2.5 py-1.5 text-[10px] rounded-full transition-all flex items-center gap-1.5 ${
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

          {/* ---- Section 4: References ---- */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl p-4 sm:p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-[#CFEBFF]/50 flex items-center justify-center">
                <Link2 size={12} className="text-[#1A1A2E]" />
              </div>
              <h2 className="text-[12px] font-semibold text-[#1A1A2E]">
                Reference links
              </h2>
              <span className="text-[9px] text-[#A0A0B0] ml-auto">Optional</span>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Link2 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0] pointer-events-none" />
                <input
                  type="url"
                  name="reference_url"
                  value={formData.reference_url}
                  onChange={handleChange}
                  placeholder="Product link (https://...)"
                  className={`${inputClass} pl-8`}
                />
              </div>

              <div className="relative">
                <ImageIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0] pointer-events-none" />
                <input
                  type="url"
                  name="reference_image"
                  value={formData.reference_image}
                  onChange={handleChange}
                  placeholder="Image URL (https://...)"
                  className={`${inputClass} pl-8`}
                />
              </div>

              {/* Preview if image URL present */}
              <AnimatePresence>
                {formData.reference_image && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl bg-[#F8F6F0]/60 p-2 mt-1">
                      <img
                        src={formData.reference_image}
                        alt="Reference preview"
                        className="w-full max-h-40 object-contain rounded-lg"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* ---- Submit ---- */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className="pt-1"
          >
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF] bg-[length:200%_200%] animate-gradient text-[#1A1A2E] py-3 text-[12px] font-semibold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Updating…
                </>
              ) : (
                <>
                  <Save size={12} />
                  Update Request
                </>
              )}
            </motion.button>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[9px] text-[#A0A0B0]">
              <span className="flex items-center gap-1">
                <Sparkles size={9} className="text-[#FFBE91]" />
                Changes go live instantly
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle size={9} className="text-[#5BA8D9]" />
                Only open requests can be edited
              </span>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default EditRequest;