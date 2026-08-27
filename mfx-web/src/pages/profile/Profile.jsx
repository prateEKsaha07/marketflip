import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Store, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Building,
  Briefcase,
  Mail,
  Edit2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Award,
  FileText,
  Home,
  Tag,
  Loader2,
  Star,
  StarHalf,
  Star as StarEmpty,
  ThumbsUp,
  Shield,
  Package,
  Truck,
  Mail as MailIcon
} from 'lucide-react';
import api from '../../api/client';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isShopOwner, setIsShopOwner] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/auth/profiles/${user?.user_id}`);
      setProfile(response.data);
      setIsShopOwner(response.data?.role === 'shop_owner');
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getEmptyFields = () => {
    if (!profile) return [];
    const empty = [];
    const fields = isShopOwner ? shopFields : buyerFields;
    
    for (const [key, label] of Object.entries(fields)) {
      const value = profile[key];
      if (value === null || value === undefined || value === '' || 
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === 'object' && Object.keys(value).length === 0)) {
        empty.push({ key, label });
      }
    }
    return empty;
  };

  const buyerFields = {
    full_name: 'Full Name',
    bio: 'Bio',
    phone: 'Phone',
    address: 'Address',
    pincode: 'Pincode',
    profile_photo_url: 'Profile Photo',
    date_of_birth: 'Date of Birth',
    gender: 'Gender',
    preferred_categories: 'Preferred Categories'
  };

  const shopFields = {
    full_name: 'Full Name',
    shop_name: 'Shop Name',
    bio: 'Bio',
    phone: 'Phone',
    address: 'Address',
    pincode: 'Pincode',
    profile_photo_url: 'Profile Photo',
    business_hours: 'Business Hours',
    years_in_business: 'Years in Business',
    gst_number: 'GST Number'
  };

  const fields = isShopOwner ? shopFields : buyerFields;
  const emptyFields = getEmptyFields();
  const completionPercentage = Math.round(
    ((Object.keys(fields).length - emptyFields.length) / Object.keys(fields).length) * 100
  );

  const formatValue = (key, value) => {
    if (value === null || value === undefined || value === '') return 'Not provided';
    
    if (key === 'preferred_categories' && Array.isArray(value)) {
      return value.length > 0 ? value.join(', ').toUpperCase() : 'Not provided';
    }
    
    if (key === 'business_hours' && typeof value === 'object') {
      const hours = value;
      const parts = [];
      if (hours.monday_friday) parts.push(`Mon-Fri: ${hours.monday_friday}`);
      if (hours.saturday) parts.push(`Sat: ${hours.saturday}`);
      if (hours.sunday) parts.push(`Sun: ${hours.sunday}`);
      return parts.length > 0 ? parts.join(' | ') : 'Not provided';
    }
    
    if (key === 'gender') {
      return value.replace('_', ' ').toUpperCase();
    }
    
    if (key === 'profile_photo_url') {
      return value ? 'Uploaded' : 'Not provided';
    }
    
    if (key === 'is_verified') {
      return value ? 'Verified' : 'Not verified';
    }
    
    return value;
  };

  // Dummy data for right column
  const dummyProducts = [
    'Smartphones', 'Laptops', 'Tablets', 'Headphones', 
    'Speakers', 'Smartwatches', 'Accessories'
  ];

  const dummyReviews = [
    { id: 1, name: 'Amit Sharma', rating: 5, comment: 'Great service! Very responsive and professional.', date: '2 days ago' },
    { id: 2, name: 'Priya Patel', rating: 4, comment: 'Good quality products. Would recommend.', date: '1 week ago' },
    { id: 3, name: 'Rahul Verma', rating: 5, comment: 'Excellent experience. Fast delivery and good pricing.', date: '2 weeks ago' },
  ];

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<Star key={i} size={14} className="fill-amber-400 text-amber-400" />);
      } else if (i - 0.5 <= rating) {
        stars.push(<StarHalf key={i} size={14} className="fill-amber-400 text-amber-400" />);
      } else {
        stars.push(<StarEmpty key={i} size={14} className="text-amber-300" />);
      }
    }
    return stars;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatGender = (gender) => {
    if (!gender) return 'Not provided';
    return gender.replace('_', ' ').toUpperCase();
  };

  const formatCategories = (categories) => {
    if (!categories || categories.length === 0) return 'Not provided';
    return categories.map(c => c.toUpperCase()).join(', ');
  };

  const backPath = isShopOwner ? '/shop/dashboard' : '/buyer/dashboard';

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0] p-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 text-center shadow-lg max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-rose-500" />
          </div>
          <h2 className="text-lg font-semibold text-rose-700">Error</h2>
          <p className="text-sm text-rose-600 mt-1">{error}</p>
          <Button 
            onClick={() => navigate(backPath)}
            className="mt-4 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-sm px-5 py-1.5 h-auto"
          >
            Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-wrap justify-between items-center gap-3 mb-6"
        >
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate(backPath)}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
            >
              ← Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-[#1A1A2E]">
                {isShopOwner ? 'Shop Profile' : 'My Profile'}
              </h1>
              <p className="text-xs text-[#A0A0B0] mt-0.5">
                {completionPercentage}% complete · {emptyFields.length} fields remaining
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate(isShopOwner ? '/shop/profile/edit' : '/buyer/profile/edit')}
            className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-2 h-auto flex items-center gap-2"
          >
            <Edit2 size={14} />
            Edit Profile
          </Button>
        </motion.div>

        {/* Main Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl border border-[#EEECE6] shadow-sm overflow-hidden"
        >
          <div className="h-1 bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]" />
          
          <div className="p-6 md:p-8">
            {/* Profile Header - Centered layout */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 pb-6 border-b border-[#EEECE6]">
              {/* Avatar */}
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[#F8F6F0] border-2 border-[#EEECE6] flex-shrink-0">
                {profile.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FFBE91]/20 to-[#CFEBFF]/20">
                    {isShopOwner ? (
                      <Store size={32} className="text-[#A0A0B0]" />
                    ) : (
                      <User size={32} className="text-[#A0A0B0]" />
                    )}
                  </div>
                )}
                {profile.is_verified && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-white">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                )}
              </div>

              {/* Name and Bio - Centered with photo */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h2 className="text-xl font-bold text-[#1A1A2E]">
                    {profile.full_name || 'User'}
                  </h2>
                  {isShopOwner && profile.shop_name && (
                    <span className="text-sm text-[#A0A0B0]">· {profile.shop_name}</span>
                  )}
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    isShopOwner ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isShopOwner ? <Store size={10} /> : <User size={10} />}
                    {isShopOwner ? 'Shop' : 'Buyer'}
                  </span>
                  {profile.is_verified && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-medium">
                      <CheckCircle size={10} />
                      Verified
                    </span>
                  )}
                </div>
                
                {/* Bio moved here - only one bio now */}
                {profile.bio && (
                  <p className="text-sm text-[#4A4A5A] mt-2 max-w-2xl mx-auto md:mx-0 leading-relaxed">
                    {profile.bio}
                  </p>
                )}

                {/* Progress Bar */}
                <div className="mt-3 flex items-center justify-center md:justify-start gap-3">
                  <div className="flex-1 max-w-xs">
                    <div className="w-full h-1.5 bg-[#EEECE6] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-[#FFBE91] to-[#CFEBFF] rounded-full"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#A0A0B0]">
                    {completionPercentage}% complete
                  </span>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - 2/3 width - All Data */}
              <div className="lg:col-span-2 space-y-6">
                {/* Empty Fields Warning */}
                {emptyFields.length > 0 && (
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/50">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-amber-700">
                          Complete your profile to get better matches
                        </p>
                        <p className="text-[10px] text-amber-600 mt-0.5">
                          Missing: {emptyFields.map(f => f.label).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!isShopOwner && (
                    <>
                      <div className="p-3 bg-[#F8F6F0]/50 rounded-xl">
                        <p className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Full Name</p>
                        <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">{profile.full_name || 'Not provided'}</p>
                      </div>
                      <div className="p-3 bg-[#F8F6F0]/50 rounded-xl">
                        <p className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Phone</p>
                        <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">{profile.phone || 'Not provided'}</p>
                      </div>
                      <div className="p-3 bg-[#F8F6F0]/50 rounded-xl">
                        <p className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Address</p>
                        <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">{profile.address || 'Not provided'}</p>
                      </div>
                      <div className="p-3 bg-[#F8F6F0]/50 rounded-xl">
                        <p className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Pincode</p>
                        <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">{profile.pincode || 'Not provided'}</p>
                      </div>
                      <div className="p-3 bg-[#F8F6F0]/50 rounded-xl">
                        <p className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Date of Birth</p>
                        <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">{formatDate(profile.date_of_birth)}</p>
                      </div>
                      <div className="p-3 bg-[#F8F6F0]/50 rounded-xl">
                        <p className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Gender</p>
                        <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">{formatGender(profile.gender)}</p>
                      </div>
                      <div className="md:col-span-2 p-3 bg-[#F8F6F0]/50 rounded-xl">
                        <p className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Preferred Categories</p>
                        <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">{formatCategories(profile.preferred_categories)}</p>
                      </div>
                    </>
                  )}

                  {isShopOwner && (
                    <>
                      <div className="p-3 bg-[#F8F6F0]/50 rounded-xl">
                        <p className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Full Name</p>
                        <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">{profile.full_name || 'Not provided'}</p>
                      </div>
                      <div className="p-3 bg-[#F8F6F0]/50 rounded-xl">
                        <p className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Shop Name</p>
                        <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">{profile.shop_name || 'Not provided'}</p>
                      </div>
                      <div className="p-3 bg-[#F8F6F0]/50 rounded-xl">
                        <p className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Phone</p>
                        <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">{profile.phone || 'Not provided'}</p>
                      </div>
                      <div className="p-3 bg-[#F8F6F0]/50 rounded-xl">
                        <p className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Address</p>
                        <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">{profile.address || 'Not provided'}</p>
                      </div>
                      <div className="p-3 bg-[#F8F6F0]/50 rounded-xl">
                        <p className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Pincode</p>
                        <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">{profile.pincode || 'Not provided'}</p>
                      </div>
                      <div className="p-3 bg-[#F8F6F0]/50 rounded-xl">
                        <p className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Years in Business</p>
                        <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">{profile.years_in_business ? `${profile.years_in_business} years` : 'Not provided'}</p>
                      </div>
                      <div className="p-3 bg-[#F8F6F0]/50 rounded-xl">
                        <p className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">GST Number</p>
                        <p className="text-sm font-medium text-[#1A1A2E] mt-0.5">{profile.gst_number || 'Not provided'}</p>
                      </div>
                      <div className="md:col-span-2 p-3 bg-[#F8F6F0]/50 rounded-xl">
                        <p className="text-[10px] font-medium text-[#A0A0B0] uppercase tracking-wider">Business Hours</p>
                        <div className="mt-1 space-y-1">
                          {profile.business_hours?.monday_friday && (
                            <p className="text-sm font-medium text-[#1A1A2E]">Mon-Fri: {profile.business_hours.monday_friday}</p>
                          )}
                          {profile.business_hours?.saturday && (
                            <p className="text-sm font-medium text-[#1A1A2E]">Sat: {profile.business_hours.saturday}</p>
                          )}
                          {profile.business_hours?.sunday && (
                            <p className="text-sm font-medium text-[#1A1A2E]">Sun: {profile.business_hours.sunday}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Shop Stats (if shop owner) */}
                {isShopOwner && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-blue-50/50 rounded-xl text-center">
                      <p className="text-[10px] text-[#A0A0B0]">Total Transactions</p>
                      <p className="text-lg font-bold text-[#1A1A2E]">{profile.total_transactions || 0}</p>
                    </div>
                    <div className="p-3 bg-emerald-50/50 rounded-xl text-center">
                      <p className="text-[10px] text-[#A0A0B0]">Completed</p>
                      <p className="text-lg font-bold text-[#1A1A2E]">{profile.completed_transactions || 0}</p>
                    </div>
                    <div className="p-3 bg-amber-50/50 rounded-xl text-center">
                      <p className="text-[10px] text-[#A0A0B0]">Avg Response</p>
                      <p className="text-lg font-bold text-[#1A1A2E]">{profile.avg_response_time_minutes ? `${profile.avg_response_time_minutes}m` : 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - 1/3 width - Dummy Data */}
              <div className="space-y-4">
                {/* What We Sell */}
                {isShopOwner && (
                  <div className="bg-[#F8F6F0]/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package size={16} className="text-[#FFBE91]" />
                      <h3 className="text-xs font-semibold text-[#1A1A2E]">What We Sell</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {dummyProducts.map((product, index) => (
                        <span key={index} className="px-2 py-1 bg-white text-[10px] font-medium text-[#4A4A5A] rounded-full border border-[#EEECE6]">
                          {product}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Known For */}
                {isShopOwner && (
                  <div className="bg-[#F8F6F0]/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield size={16} className="text-[#FFBE91]" />
                      <h3 className="text-xs font-semibold text-[#1A1A2E]">Known For</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="flex items-center gap-1 px-2 py-1 bg-white text-[10px] font-medium text-emerald-600 rounded-full border border-emerald-200">
                        <ThumbsUp size={10} />
                        Quality Products
                      </span>
                      <span className="flex items-center gap-1 px-2 py-1 bg-white text-[10px] font-medium text-blue-600 rounded-full border border-blue-200">
                        <Truck size={10} />
                        Fast Delivery
                      </span>
                      <span className="flex items-center gap-1 px-2 py-1 bg-white text-[10px] font-medium text-amber-600 rounded-full border border-amber-200">
                        <Award size={10} />
                        Trusted Seller
                      </span>
                    </div>
                  </div>
                )}

                {/* Reviews */}
                <div className="bg-[#F8F6F0]/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-amber-400 fill-amber-400" />
                      <h3 className="text-xs font-semibold text-[#1A1A2E]">Reviews</h3>
                      <span className="text-[10px] text-[#A0A0B0]">(Coming soon)</span>
                    </div>
                    <span className="text-[10px] text-[#A0A0B0]">{dummyReviews.length} reviews</span>
                  </div>
                  <div className="space-y-2">
                    {dummyReviews.map((review) => (
                      <div key={review.id} className="flex items-start gap-2 p-2 bg-white rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-[#EEECE6] flex items-center justify-center flex-shrink-0">
                          <User size={12} className="text-[#A0A0B0]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="text-[10px] font-medium text-[#1A1A2E]">{review.name}</span>
                            <span className="text-[9px] text-[#A0A0B0]">{review.date}</span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {renderStars(review.rating)}
                          </div>
                          <p className="text-[10px] text-[#4A4A5A] mt-0.5 line-clamp-1">{review.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Details */}
                <div className="bg-[#F8F6F0]/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Phone size={16} className="text-[#FFBE91]" />
                    <h3 className="text-xs font-semibold text-[#1A1A2E]">Contact Details</h3>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-[#4A4A5A] flex items-center gap-2">
                      <Phone size={12} className="text-[#A0A0B0]" />
                      {profile.phone || 'Not provided'}
                    </p>
                    <p className="text-xs text-[#4A4A5A] flex items-center gap-2">
                      <Home size={12} className="text-[#A0A0B0]" />
                      {profile.address || 'Not provided'}
                    </p>
                    <p className="text-xs text-[#4A4A5A] flex items-center gap-2">
                      <MapPin size={12} className="text-[#A0A0B0]" />
                      {profile.pincode || 'Not provided'}
                    </p>
                    {isShopOwner && profile.gst_number && (
                      <p className="text-xs text-[#4A4A5A] flex items-center gap-2">
                        <Building size={12} className="text-[#A0A0B0]" />
                        GST: {profile.gst_number}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-6 pt-4 border-t border-[#EEECE6] flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2 text-[10px] text-[#A0A0B0]">
                <Sparkles size={12} className="text-[#FFBE91]" />
                {completionPercentage === 100 ? 'Profile complete! 🎉' : `${emptyFields.length} fields remaining`}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => navigate(isShopOwner ? '/shop/profile/edit' : '/buyer/profile/edit')}
                  variant="outline"
                  className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-4 py-1.5 h-auto"
                >
                  <Edit2 size={13} className="mr-1.5" />
                  Edit Profile
                </Button>
                <Button
                  onClick={() => navigate(backPath)}
                  variant="ghost"
                  className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-4 py-1.5 h-auto"
                >
                  Dashboard
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;