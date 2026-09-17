import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useCloudinary } from '../../hooks/useCloudinary';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  User, 
  Store, 
  Phone, 
  Calendar, 
  Clock, 
  Camera, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Save, 
  Home, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Shield
} from 'lucide-react';
import api from '../../api/client';

const ProfileFormPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { uploadSingle, uploading, progress } = useCloudinary();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isShopOwner, setIsShopOwner] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedHours, setExpandedHours] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    phone: '',
    address: '',
    pincode: '',
    profile_photo_url: '',
    date_of_birth: '',
    gender: '',
    preferred_categories: [],
    shop_name: '',
    business_hours: { monday_friday: '', saturday: '', sunday: '' },
    years_in_business: '',
    gst_number: '',
    identity_number: '',
    identity_type: '',
    delivery_address: '',
    budget_range_preference: { min: null, max: null },
    notification_preferences: {}
  });
  
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const bioTextareaRef = useRef(null);

  useEffect(() => {
    const textarea = bioTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [formData.bio]);

  const timeSlots = [
    'Closed',
    '9:00 AM - 6:00 PM',
    '10:00 AM - 6:00 PM',
    '10:00 AM - 8:00 PM',
    '9:00 AM - 9:00 PM',
    '10:00 AM - 4:00 PM',
    '8:00 AM - 8:00 PM',
    '11:00 AM - 7:00 PM',
    '9:00 AM - 5:00 PM',
    '10:00 AM - 10:00 PM',
    'Custom'
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/auth/profiles/${user?.user_id}`);
      const data = response.data;
      setProfile(data);
      setIsShopOwner(data?.role === 'shop_owner');
      
      setFormData({
        full_name: data.full_name || '',
        bio: data.bio || '',
        phone: data.phone || '',
        address: data.address || '',
        pincode: data.pincode || '',
        profile_photo_url: data.profile_photo_url || '',
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
        preferred_categories: data.preferred_categories || [],
        shop_name: data.shop_name || '',
        business_hours: data.business_hours || { monday_friday: '', saturday: '', sunday: '' },
        years_in_business: data.years_in_business || '',
        gst_number: data.gst_number || '',
        identity_number: data.identity_number || '',
        identity_type: data.identity_type || '',
        delivery_address: data.delivery_address || '',
        budget_range_preference: data.budget_range_preference || { min: null, max: null },
        notification_preferences: data.notification_preferences || {}
      });
      
      if (data.profile_photo_url) {
        setPhotoPreview(data.profile_photo_url);
        setPhotoUploaded(true);
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleBusinessHoursSelect = (day, value) => {
    setFormData(prev => ({
      ...prev,
      business_hours: { ...prev.business_hours, [day]: value }
    }));
    if (error) setError('');
  };

  const handlePreferredCategoriesChange = (category) => {
    setFormData(prev => {
      const current = prev.preferred_categories || [];
      if (current.includes(category)) {
        return { ...prev, preferred_categories: current.filter(c => c !== category) };
      }
      return { ...prev, preferred_categories: [...current, category] };
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setPhotoUploaded(false);
      setFormData(prev => ({ ...prev, profile_photo_url: '' }));
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return null;
    try {
      const result = await uploadSingle(photoFile);
      if (result && result.url) {
        setPhotoUploaded(true);
        setFormData(prev => ({ ...prev, profile_photo_url: result.url }));
        setSuccess('Photo uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
        return result.url;
      }
      return null;
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload photo: ' + (err.message || 'Unknown error'));
      return null;
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoUploaded(false);
    setFormData(prev => ({ ...prev, profile_photo_url: '' }));
  };

  const handleBudgetMinChange = (e) => {
    const val = e.target.value ? parseInt(e.target.value) : null;
    setFormData(prev => ({
      ...prev,
      budget_range_preference: { ...(prev.budget_range_preference || {}), min: val }
    }));
  };

  const handleBudgetMaxChange = (e) => {
    const val = e.target.value ? parseInt(e.target.value) : null;
    setFormData(prev => ({
      ...prev,
      budget_range_preference: { ...(prev.budget_range_preference || {}), max: val }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      setSaving(false);
      return;
    }
    
    if (isShopOwner && !formData.shop_name.trim()) {
      setError('Shop name is required');
      setSaving(false);
      return;
    }
    
    try {
      let finalPhotoUrl = formData.profile_photo_url || '';
      
      if (photoFile && !photoUploaded) {
        const uploadedUrl = await uploadPhoto();
        if (uploadedUrl) finalPhotoUrl = uploadedUrl;
      }
      
      const submitData = {
        full_name: formData.full_name,
        bio: formData.bio || '',
        phone: formData.phone,
        address: formData.address || '',
        pincode: formData.pincode || '',
        profile_photo_url: finalPhotoUrl || '',
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        preferred_categories: formData.preferred_categories || [],
        shop_name: formData.shop_name || '',
        business_hours: formData.business_hours || {},
        years_in_business: formData.years_in_business ? parseInt(formData.years_in_business) : null,
        gst_number: formData.gst_number || '',
      };

      if (!isShopOwner) {
        submitData.identity_number = formData.identity_number || '';
        submitData.identity_type = formData.identity_type || '';
        submitData.delivery_address = formData.delivery_address || '';
        submitData.budget_range_preference = formData.budget_range_preference || null;
      }
      
      if (submitData.date_of_birth === '') submitData.date_of_birth = null;
      if (submitData.gender === '') submitData.gender = null;
      
      await api.patch(`/auth/profiles/${user?.user_id}`, submitData);
      setSuccess('Profile updated successfully!');
      
      setTimeout(() => {
        navigate(isShopOwner ? '/shop/profile' : '/buyer/profile');
      }, 1500);
      
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const categories = ['electronics', 'furniture', 'clothing', 'books', 'home_kitchen', 'vehicles', 'other'];
  const genderOptions = ['male', 'female', 'other', 'prefer_not_to_say'];
  const identityTypeOptions = ['pan', 'aadhaar', 'other'];
  const backPath = isShopOwner ? '/shop/profile' : '/buyer/profile';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin text-[#1A1A2E]" />
          <p className="text-[11px] text-[#A0A0B0]">Loading profile...</p>
        </div>
      </div>
    );
  }

  /* ---------- Shared input styling ---------- */
  const inputClass = "w-full px-3 py-2 text-[13px] sm:text-sm bg-white border border-[#EEECE6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/30 focus:border-[#FFBE91] transition-all";
  const selectClass = `${inputClass} appearance-none`;
  const labelClass = "block text-[11px] sm:text-xs font-medium text-[#A0A0B0] mb-1";
  const sectionTitleClass = "text-[11px] sm:text-xs font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2";
  const sectionWrapperClass = "bg-[#F8F6F0]/50 rounded-xl p-3 sm:p-4";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-3 sm:p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-2 sm:gap-3 mb-4 sm:mb-6"
        >
          <Button 
            onClick={() => navigate(backPath)}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-[11px] px-2 sm:px-3 py-1.5 h-auto flex-shrink-0 -ml-1 sm:ml-0"
          >
            <ArrowLeft size={13} className="mr-1 sm:mr-1.5" />
            Back
          </Button>
          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="text-base sm:text-lg font-semibold text-[#1A1A2E] flex items-center gap-1.5 truncate">
              <Sparkles size={15} className="text-[#FFBE91] flex-shrink-0" />
              Edit Profile
            </h1>
            <p className="text-[10px] sm:text-xs text-[#A0A0B0] mt-0.5 truncate">
              Complete your profile to get better matches
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 backdrop-blur-xl rounded-xl shadow-sm overflow-hidden"
        >
          <div className="h-0.5 bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]" />
          
          <div className="p-3 sm:p-5 md:p-6">
            {/* Success/Error Messages */}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-3 p-2.5 bg-emerald-50 rounded-lg flex items-start gap-2"
              >
                <CheckCircle size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] sm:text-xs text-emerald-700 flex-1">{success}</p>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-3 p-2.5 bg-rose-50 rounded-lg flex items-start gap-2"
              >
                <AlertCircle size={14} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] sm:text-xs text-rose-700 flex-1">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Profile Photo */}
              <div>
                <label className={labelClass}>Profile Photo</label>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-[#F8F6F0] flex-shrink-0">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {isShopOwner ? (
                          <Store size={22} className="text-[#A0A0B0]" />
                        ) : (
                          <User size={22} className="text-[#A0A0B0]" />
                        )}
                      </div>
                    )}
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute top-0 right-0 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 transition-colors"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="profile-photo"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="profile-photo"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-[#F8F6F0] rounded-lg cursor-pointer hover:bg-[#F5F3EF] transition-colors"
                      >
                        <Camera size={12} />
                        Choose Photo
                      </label>
                      {photoFile && !photoUploaded && (
                        <Button
                          type="button"
                          onClick={uploadPhoto}
                          disabled={uploading}
                          className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[11px] px-3 py-1.5 h-auto"
                        >
                          {uploading ? <Loader2 size={11} className="animate-spin" /> : 'Upload'}
                        </Button>
                      )}
                      {photoUploaded && (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                          <CheckCircle size={10} />
                          Uploaded
                        </span>
                      )}
                    </div>
                    {uploading && (
                      <div className="mt-1 text-[10px] text-[#A0A0B0]">Uploading… {progress}%</div>
                    )}
                    <p className="text-[10px] text-[#A0A0B0] mt-1">JPG, PNG, WEBP · Max 5MB</p>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className={sectionWrapperClass}>
                <h3 className={sectionTitleClass}>
                  <User size={13} className="text-[#FFBE91]" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className={labelClass}>
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={inputClass}
                      required
                    />
                  </div>
                  
                  {isShopOwner && (
                    <div>
                      <label className={labelClass}>
                        Shop Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="shop_name"
                        value={formData.shop_name}
                        onChange={handleChange}
                        placeholder="Tech Store"
                        className={inputClass}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="mt-3 sm:mt-4">
                  <label className={labelClass}>Bio</label>
                  <textarea
                    ref={bioTextareaRef}
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder={isShopOwner ? 'Tell buyers about your shop...' : 'Tell shops about yourself...'}
                    rows={1}
                    className={`${inputClass} resize-none overflow-hidden`}
                    style={{ minHeight: '56px' }}
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className={sectionWrapperClass}>
                <h3 className={sectionTitleClass}>
                  <Phone size={13} className="text-[#FFBE91]" />
                  Contact & Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className={labelClass}>
                      Phone <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="110001"
                      maxLength="6"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="mt-3 sm:mt-4">
                  <label className={labelClass}>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main Street, City"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Buyer Specific */}
              {!isShopOwner && (
                <>
                  <div className={sectionWrapperClass}>
                    <h3 className={sectionTitleClass}>
                      <Calendar size={13} className="text-[#FFBE91]" />
                      Personal Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className={labelClass}>Date of Birth</label>
                        <input
                          type="date"
                          name="date_of_birth"
                          value={formData.date_of_birth}
                          onChange={handleChange}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Gender</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="">Select</option>
                          {genderOptions.map(g => (
                            <option key={g} value={g}>{g.replace('_', ' ').toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-4">
                      <label className="block text-[11px] sm:text-xs font-medium text-[#A0A0B0] mb-2">
                        Preferred Categories
                      </label>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {categories.map(cat => (
                          <button
                            type="button"
                            key={cat}
                            onClick={() => handlePreferredCategoriesChange(cat)}
                            className={`px-2.5 py-1 text-[10px] sm:text-[11px] rounded-full transition-all ${
                              (formData.preferred_categories || []).includes(cat)
                                ? 'bg-[#FFBE91] text-[#1A1A2E] font-medium'
                                : 'bg-white text-[#A0A0B0] hover:bg-[#F5F3EF]'
                            }`}
                          >
                            {cat.replace('_', ' ').toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Identity & Trust */}
                  <div className={sectionWrapperClass}>
                    <h3 className={sectionTitleClass}>
                      <Shield size={13} className="text-[#FFBE91]" />
                      Identity & Trust
                    </h3>
                    <p className="text-[10px] text-[#A0A0B0] mb-3">
                      Helps build trust with shops. Identity number cannot be changed once set.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className={labelClass}>
                          Identity Number
                          {profile?.identity_number && (
                            <span className="text-[10px] text-amber-600 ml-2">(Locked)</span>
                          )}
                        </label>
                        <input
                          type="text"
                          name="identity_number"
                          value={formData.identity_number || ''}
                          onChange={handleChange}
                          placeholder="PAN/Aadhaar/Other ID"
                          disabled={!!profile?.identity_number}
                          className={`${inputClass} ${profile?.identity_number ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                        {profile?.identity_number && (
                          <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                            <Lock size={9} />
                            Cannot be changed once set
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className={labelClass}>Identity Type</label>
                        <select
                          name="identity_type"
                          value={formData.identity_type || ''}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="">Select type</option>
                          {identityTypeOptions.map(type => (
                            <option key={type} value={type}>{type.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Preferences */}
                  <div className={sectionWrapperClass}>
                    <h3 className={sectionTitleClass}>
                      <Home size={13} className="text-[#FFBE91]" />
                      Delivery Preferences
                    </h3>
                    
                    <div>
                      <label className={labelClass}>Default Delivery Address</label>
                      <input
                        type="text"
                        name="delivery_address"
                        value={formData.delivery_address || ''}
                        onChange={handleChange}
                        placeholder="Enter your default delivery address"
                        className={inputClass}
                      />
                    </div>
                    
                    <div className="mt-3 sm:mt-4">
                      <label className={labelClass}>Budget Range Preference</label>
                      <p className="text-[10px] text-[#A0A0B0] mb-2">
                        Helps us suggest better prices for your requests
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <input
                          type="number"
                          value={formData.budget_range_preference?.min || ''}
                          onChange={handleBudgetMinChange}
                          placeholder="Min"
                          min="0"
                          className={inputClass}
                        />
                        <input
                          type="number"
                          value={formData.budget_range_preference?.max || ''}
                          onChange={handleBudgetMaxChange}
                          placeholder="Max"
                          min="0"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Shop Specific */}
              {isShopOwner && (
                <>
                  <div className={sectionWrapperClass}>
                    <h3 className={sectionTitleClass}>
                      <Store size={13} className="text-[#FFBE91]" />
                      Shop Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className={labelClass}>Years in Business</label>
                        <input
                          type="number"
                          name="years_in_business"
                          value={formData.years_in_business}
                          onChange={handleChange}
                          placeholder="5"
                          min="0"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          GST Number
                          {profile?.gst_number && (
                            <span className="text-[10px] text-amber-600 ml-2">(Locked)</span>
                          )}
                        </label>
                        <input
                          type="text"
                          name="gst_number"
                          value={formData.gst_number || ''}
                          onChange={handleChange}
                          placeholder="22ABCDE1234F1Z5"
                          disabled={!!profile?.gst_number}
                          className={`${inputClass} ${profile?.gst_number ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                        <p className="text-[10px] text-[#A0A0B0] mt-1">
                          {profile?.gst_number ? 'GST number cannot be changed once set' : 'Optional, helps build trust with buyers'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Business Hours */}
                  <div className={sectionWrapperClass}>
                    <button
                      type="button"
                      onClick={() => setExpandedHours(!expandedHours)}
                      className="flex items-center justify-between w-full text-[11px] sm:text-xs font-semibold text-[#1A1A2E]"
                    >
                      <span className="flex items-center gap-2">
                        <Clock size={13} className="text-[#FFBE91]" />
                        Business Hours
                      </span>
                      {expandedHours ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>

                    {expandedHours && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3 mt-3 overflow-hidden"
                      >
                        {['monday_friday', 'saturday', 'sunday'].map((day) => (
                          <div key={day}>
                            <label className="block text-[10px] font-medium text-[#A0A0B0] mb-1.5">
                              {day === 'monday_friday' ? 'Monday – Friday' : day.charAt(0).toUpperCase() + day.slice(1)}
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {timeSlots.map((slot) => (
                                <button
                                  type="button"
                                  key={`${day}-${slot}`}
                                  onClick={() => handleBusinessHoursSelect(day, slot)}
                                  className={`px-2.5 py-1 text-[10px] sm:text-[11px] rounded-full transition-all ${
                                    formData.business_hours?.[day] === slot
                                      ? 'bg-[#FFBE91] text-[#1A1A2E] font-medium'
                                      : 'bg-white text-[#A0A0B0] hover:bg-[#F5F3EF]'
                                  }`}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={saving || uploading}
                className="w-full bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white py-2.5 sm:py-3 h-auto flex items-center justify-center gap-2 text-[13px] sm:text-sm font-semibold rounded-lg"
              >
                {saving || uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {uploading ? 'Uploading Photo...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save Profile
                  </>
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileFormPage;