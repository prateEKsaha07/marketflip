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
  MapPin, 
  Calendar, 
  Clock, 
  Building,
  Briefcase,
  FileText,
  Camera,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Save,
  Tag,
  Home,
  ChevronDown,
  ChevronUp,
  Lock,
  Mail,
  Shield,
  Award,
  TrendingUp
} from 'lucide-react';
import api from '../../api/client';

const ProfileFormPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { uploadSingle, uploading, progress, error: uploadError } = useCloudinary();
  
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
    business_hours: {
      monday_friday: '',
      saturday: '',
      sunday: ''
    },
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

  // Auto-resize bio textarea
  useEffect(() => {
    const textarea = bioTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [formData.bio]);

  // Time slot options for business hours
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
        business_hours: data.business_hours || {
          monday_friday: '',
          saturday: '',
          sunday: ''
        },
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
      } else {
        return { ...prev, preferred_categories: [...current, category] };
      }
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Photo selected:', file.name, file.size);
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setPhotoUploaded(false);
      setFormData(prev => ({ ...prev, profile_photo_url: '' }));
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) {
      console.log('No photo file to upload');
      return null;
    }
    
    console.log('Uploading photo:', photoFile.name);
    try {
      const result = await uploadSingle(photoFile);
      console.log('Upload result:', result);
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
      budget_range_preference: {
        ...(prev.budget_range_preference || {}),
        min: val
      }
    }));
  };

  const handleBudgetMaxChange = (e) => {
    const val = e.target.value ? parseInt(e.target.value) : null;
    setFormData(prev => ({
      ...prev,
      budget_range_preference: {
        ...(prev.budget_range_preference || {}),
        max: val
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    console.log('=== SUBMITTING PROFILE ===');
    console.log('Photo file:', photoFile ? photoFile.name : 'None');
    console.log('Photo uploaded:', photoUploaded);
    console.log('Current profile_photo_url:', formData.profile_photo_url);
    
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
        console.log('Uploading photo before saving profile...');
        const uploadedUrl = await uploadPhoto();
        if (uploadedUrl) {
          finalPhotoUrl = uploadedUrl;
          console.log('Photo uploaded successfully:', finalPhotoUrl);
        } else {
          console.warn('Photo upload failed or returned no URL');
        }
      } else if (photoFile && photoUploaded) {
        finalPhotoUrl = formData.profile_photo_url || '';
        console.log('Photo already uploaded, using existing URL:', finalPhotoUrl);
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
      
      if (submitData.date_of_birth === '') {
        submitData.date_of_birth = null;
      }
      
      if (submitData.gender === '') {
        submitData.gender = null;
      }
      
      console.log('Submitting profile data:', submitData);
      
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

  const categories = [
    'electronics', 'furniture', 'clothing', 'books', 
    'home_kitchen', 'vehicles', 'other'
  ];

  const genderOptions = ['male', 'female', 'other', 'prefer_not_to_say'];
  const identityTypeOptions = ['pan', 'aadhaar', 'other'];

  const backPath = isShopOwner ? '/shop/profile' : '/buyer/profile';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#1A1A2E]" />
          <p className="text-xs text-[#A0A0B0]">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 mb-6"
        >
          <Button 
            onClick={() => navigate(backPath)}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A2E] flex items-center gap-2">
              <Sparkles size={18} className="text-[#FFBE91]" />
              Edit Profile
            </h1>
            <p className="text-xs text-[#A0A0B0] mt-0.5">
              Complete your profile to get better matches
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 backdrop-blur-xl rounded-xl border border-[#EEECE6] shadow-sm overflow-hidden"
        >
          <div className="h-1 bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]" />
          
          <div className="p-6">
            {/* Success/Error Messages */}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3"
              >
                <CheckCircle size={16} className="text-emerald-600" />
                <p className="text-sm text-emerald-700">{success}</p>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3"
              >
                <AlertCircle size={16} className="text-rose-600" />
                <p className="text-sm text-rose-700">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[#F8F6F0] border-2 border-[#EEECE6] flex-shrink-0">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {isShopOwner ? (
                          <Store size={28} className="text-[#A0A0B0]" />
                        ) : (
                          <User size={28} className="text-[#A0A0B0]" />
                        )}
                      </div>
                    )}
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="profile-photo"
                    />
                    <label
                      htmlFor="profile-photo"
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-[#F8F6F0] border border-[#EEECE6] rounded-lg cursor-pointer hover:bg-[#F5F3EF] transition-colors"
                    >
                      <Camera size={14} />
                      Choose Photo
                    </label>
                    {photoFile && !photoUploaded && (
                      <Button
                        type="button"
                        onClick={uploadPhoto}
                        disabled={uploading}
                        className="ml-2 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-3 py-1.5 h-auto"
                      >
                        {uploading ? <Loader2 size={12} className="animate-spin" /> : 'Upload Photo'}
                      </Button>
                    )}
                    {photoUploaded && (
                      <span className="ml-2 text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle size={12} />
                        Photo uploaded
                      </span>
                    )}
                    {uploading && (
                      <div className="mt-1 text-[10px] text-[#A0A0B0]">
                        Uploading... {progress}%
                      </div>
                    )}
                    <p className="text-[10px] text-[#A0A0B0] mt-1">
                      JPG, PNG, WEBP · Max 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="bg-[#F8F6F0]/50 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                  <User size={14} className="text-[#FFBE91]" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#A0A0B0] mb-1">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 text-sm bg-white border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                      required
                    />
                  </div>
                  
                  {isShopOwner && (
                    <div>
                      <label className="block text-xs font-medium text-[#A0A0B0] mb-1">
                        Shop Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="shop_name"
                        value={formData.shop_name}
                        onChange={handleChange}
                        placeholder="Tech Store"
                        className="w-full px-3 py-2 text-sm bg-white border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-[#A0A0B0] mb-1">
                    Bio
                  </label>
                  <textarea
                    ref={bioTextareaRef}
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder={isShopOwner ? 'Tell buyers about your shop...' : 'Tell shops about yourself...'}
                    rows={1}
                    className="w-full px-3 py-2 text-sm bg-white border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all resize-none overflow-hidden"
                    style={{ minHeight: '60px' }}
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-[#F8F6F0]/50 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                  <Phone size={14} className="text-[#FFBE91]" />
                  Contact & Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#A0A0B0] mb-1">
                      Phone <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className="w-full px-3 py-2 text-sm bg-white border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#A0A0B0] mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="110001"
                      maxLength="6"
                      className="w-full px-3 py-2 text-sm bg-white border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-[#A0A0B0] mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Main Street, City"
                    className="w-full px-3 py-2 text-sm bg-white border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                  />
                </div>
              </div>

              {/* Buyer Specific */}
              {!isShopOwner && (
                <>
                  <div className="bg-[#F8F6F0]/50 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                      <Calendar size={14} className="text-[#FFBE91]" />
                      Personal Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#A0A0B0] mb-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          name="date_of_birth"
                          value={formData.date_of_birth}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-sm bg-white border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#A0A0B0] mb-1">
                          Gender
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-sm bg-white border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all appearance-none"
                        >
                          <option value="">Select</option>
                          {genderOptions.map(g => (
                            <option key={g} value={g}>{g.replace('_', ' ').toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs font-medium text-[#A0A0B0] mb-2">
                        Preferred Categories
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                          <button
                            type="button"
                            key={cat}
                            onClick={() => handlePreferredCategoriesChange(cat)}
                            className={`px-3 py-1.5 text-xs rounded-full border-2 transition-all ${
                              (formData.preferred_categories || []).includes(cat)
                                ? 'border-[#FFBE91] bg-[#FFBE91]/10 text-[#1A1A2E]'
                                : 'border-[#EEECE6] bg-white/50 text-[#A0A0B0] hover:border-[#FFDDB0]'
                            }`}
                          >
                            {cat.replace('_', ' ').toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-[#A0A0B0] mt-1">
                        Select categories you're interested in
                      </p>
                    </div>
                  </div>

                  {/* Identity & Trust */}
                  <div className="bg-[#F8F6F0]/50 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                      <Shield size={14} className="text-[#FFBE91]" />
                      Identity & Trust
                    </h3>
                    <p className="text-[10px] text-[#A0A0B0] mb-3">
                      This helps build trust with shops. Identity number cannot be changed once set.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#A0A0B0] mb-1">
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
                          className={`w-full px-3 py-2 text-sm bg-white border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all ${profile?.identity_number ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                        {profile?.identity_number && (
                          <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                            <Lock size={10} />
                            Cannot be changed once set
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-[#A0A0B0] mb-1">
                          Identity Type
                        </label>
                        <select
                          name="identity_type"
                          value={formData.identity_type || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-sm bg-white border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all appearance-none"
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
                  <div className="bg-[#F8F6F0]/50 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                      <Home size={14} className="text-[#FFBE91]" />
                      Delivery Preferences
                    </h3>
                    
                    <div>
                      <label className="block text-xs font-medium text-[#A0A0B0] mb-1">
                        Default Delivery Address
                      </label>
                      <input
                        type="text"
                        name="delivery_address"
                        value={formData.delivery_address || ''}
                        onChange={handleChange}
                        placeholder="Enter your default delivery address"
                        className="w-full px-3 py-2 text-sm bg-white border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                      />
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-[#A0A0B0] mb-1">
                        Budget Range Preference
                      </label>
                      <p className="text-[10px] text-[#A0A0B0] mb-2">
                        This helps us suggest better prices for your requests
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <input
                            type="number"
                            value={formData.budget_range_preference?.min || ''}
                            onChange={handleBudgetMinChange}
                            placeholder="Min budget"
                            min="0"
                            className="w-full px-3 py-2 text-sm bg-white border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={formData.budget_range_preference?.max || ''}
                            onChange={handleBudgetMaxChange}
                            placeholder="Max budget"
                            min="0"
                            className="w-full px-3 py-2 text-sm bg-white border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Shop Specific */}
              {isShopOwner && (
                <>
                  <div className="bg-[#F8F6F0]/50 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                      <Store size={14} className="text-[#FFBE91]" />
                      Shop Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#A0A0B0] mb-1">
                          Years in Business
                        </label>
                        <input
                          type="number"
                          name="years_in_business"
                          value={formData.years_in_business}
                          onChange={handleChange}
                          placeholder="5"
                          min="0"
                          className="w-full px-3 py-2 text-sm bg-white border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#A0A0B0] mb-1">
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
                          className={`w-full px-3 py-2 text-sm bg-white border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all ${profile?.gst_number ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                        <p className="text-[10px] text-[#A0A0B0] mt-1">
                          {profile?.gst_number ? 'GST number cannot be changed once set' : 'Optional, helps build trust with buyers'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Business Hours */}
                  <div className="bg-[#F8F6F0]/50 rounded-lg p-4">
                    <button
                      type="button"
                      onClick={() => setExpandedHours(!expandedHours)}
                      className="flex items-center justify-between w-full text-xs font-semibold text-[#1A1A2E]"
                    >
                      <span className="flex items-center gap-2">
                        <Clock size={14} className="text-[#FFBE91]" />
                        Business Hours
                      </span>
                      {expandedHours ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {expandedHours && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 mt-3"
                      >
                        {/* Monday - Friday */}
                        <div>
                          <label className="block text-[10px] font-medium text-[#A0A0B0] mb-1">
                            Monday - Friday
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {timeSlots.map((slot) => (
                              <button
                                type="button"
                                key={`mon-fri-${slot}`}
                                onClick={() => handleBusinessHoursSelect('monday_friday', slot)}
                                className={`px-3 py-1.5 text-xs rounded-full border-2 transition-all ${
                                  formData.business_hours?.monday_friday === slot
                                    ? 'border-[#FFBE91] bg-[#FFBE91]/10 text-[#1A1A2E]'
                                    : 'border-[#EEECE6] bg-white/50 text-[#A0A0B0] hover:border-[#FFDDB0]'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                          {formData.business_hours?.monday_friday && (
                            <p className="text-[10px] text-emerald-600 mt-1">
                              ✓ Selected: {formData.business_hours.monday_friday}
                            </p>
                          )}
                        </div>

                        {/* Saturday */}
                        <div>
                          <label className="block text-[10px] font-medium text-[#A0A0B0] mb-1">
                            Saturday
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {timeSlots.map((slot) => (
                              <button
                                type="button"
                                key={`sat-${slot}`}
                                onClick={() => handleBusinessHoursSelect('saturday', slot)}
                                className={`px-3 py-1.5 text-xs rounded-full border-2 transition-all ${
                                  formData.business_hours?.saturday === slot
                                    ? 'border-[#FFBE91] bg-[#FFBE91]/10 text-[#1A1A2E]'
                                    : 'border-[#EEECE6] bg-white/50 text-[#A0A0B0] hover:border-[#FFDDB0]'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                          {formData.business_hours?.saturday && (
                            <p className="text-[10px] text-emerald-600 mt-1">
                              ✓ Selected: {formData.business_hours.saturday}
                            </p>
                          )}
                        </div>

                        {/* Sunday */}
                        <div>
                          <label className="block text-[10px] font-medium text-[#A0A0B0] mb-1">
                            Sunday
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {timeSlots.map((slot) => (
                              <button
                                type="button"
                                key={`sun-${slot}`}
                                onClick={() => handleBusinessHoursSelect('sunday', slot)}
                                className={`px-3 py-1.5 text-xs rounded-full border-2 transition-all ${
                                  formData.business_hours?.sunday === slot
                                    ? 'border-[#FFBE91] bg-[#FFBE91]/10 text-[#1A1A2E]'
                                    : 'border-[#EEECE6] bg-white/50 text-[#A0A0B0] hover:border-[#FFDDB0]'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                          {formData.business_hours?.sunday && (
                            <p className="text-[10px] text-emerald-600 mt-1">
                              ✓ Selected: {formData.business_hours.sunday}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={saving || uploading}
                className="w-full bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white py-3 h-auto flex items-center justify-center gap-2 text-sm font-semibold rounded-lg"
              >
                {saving || uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {uploading ? 'Uploading Photo...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save size={16} />
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