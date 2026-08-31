import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Edit2, 
  Loader2, 
  AlertCircle, 
  Lock, 
  User, 
  Store, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Shield, 
  Award, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  ArrowLeft, 
  LogOut,
  Copy,
  Check,
  Building2,
  Package,
  DollarSign,
  Star,
  FileText
} from 'lucide-react';
import api from '../../api/client';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/auth/profiles/${user?.user_id}`);
      console.log('=== PROFILE DATA ===', response.data);
      setProfile(response.data);
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const copyUserId = async () => {
    if (user?.user_id) {
      await navigator.clipboard.writeText(user.user_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Back to main Dashboard
  const backPath = profile?.role === 'shop_owner' ? '/shop/dashboard' : '/buyer/dashboard';
  const editPath = profile?.role === 'shop_owner' ? '/shop/profile/edit' : '/buyer/profile/edit';

  const getInitials = () => {
    const name = profile?.shop_name || profile?.full_name || user?.email?.split('@')[0] || 'User';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getFullName = () => {
    return profile?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getShopName = () => {
    return profile?.shop_name || null;
  };

  const getGSTStatus = () => {
    return profile?.gst_number || null;
  };

  const isShopOwner = profile?.role === 'shop_owner';

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
            className="mt-4 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
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
              <ArrowLeft size={14} className="mr-1.5" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-[#1A1A2E] flex items-center gap-2">
                <User size={20} className="text-[#FFBE91]" />
                {isShopOwner ? 'Shop Profile' : 'My Profile'}
              </h1>
              <p className="text-xs text-[#A0A0B0] mt-0.5">
                Manage your personal information
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => navigate(editPath)}
              className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-4 py-1.5 h-auto flex items-center gap-1.5"
            >
              <Edit2 size={14} />
              Edit Profile
            </Button>
            <Button 
              onClick={handleLogout}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-rose-500 hover:bg-rose-50 text-xs px-3 py-1.5 h-auto"
            >
              <LogOut size={14} />
            </Button>
          </div>
        </motion.div>

        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-xl border border-[#EEECE6] shadow-sm overflow-hidden"
        >
          {/* Cover / Header Section */}
          <div className="bg-gradient-to-r from-[#FFBE91]/20 via-[#FFDDB0]/20 to-[#CFEBFF]/20 px-6 py-8 border-b border-[#EEECE6]">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {profile?.profile_photo_url ? (
                  <img 
                    src={profile.profile_photo_url} 
                    alt={getFullName()}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFBE91] to-[#FFDDB0] flex items-center justify-center text-[#1A1A2E] font-bold text-2xl shadow-lg">
                    {getInitials()}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h2 className="text-xl font-bold text-[#1A1A2E]">
                    {isShopOwner ? getShopName() || getFullName() : getFullName()}
                  </h2>
                  {profile?.is_verified && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-medium">
                      <Shield size={10} />
                      Verified
                    </span>
                  )}
                  <span className="text-xs text-[#A0A0B0] bg-[#F5F3EF] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Shield size={10} />
                    {isShopOwner ? 'Shop Owner' : 'Buyer'}
                  </span>
                </div>
                <p className="text-sm text-[#A0A0B0] flex items-center justify-center md:justify-start gap-2">
                  <Mail size={14} />
                  {user?.email}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1 text-xs text-[#A0A0B0]">
                  <div className="flex items-center gap-1">
                    <span>ID: {user?.user_id?.slice(0, 8)}</span>
                    <button
                      onClick={copyUserId}
                      className="p-0.5 hover:bg-[#F5F3EF] rounded transition-colors"
                    >
                      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                    {copied && <span className="text-emerald-600 text-[10px]">Copied!</span>}
                  </div>
                  {profile?.phone && (
                    <>
                      <span className="w-px h-3 bg-[#EEECE6]" />
                      <span className="flex items-center gap-1">
                        <Phone size={11} />
                        {profile.phone}
                      </span>
                    </>
                  )}
                  {profile?.pincode && (
                    <>
                      <span className="w-px h-3 bg-[#EEECE6]" />
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {profile.pincode}
                      </span>
                    </>
                  )}
                  {profile?.created_at && (
                    <>
                      <span className="w-px h-3 bg-[#EEECE6]" />
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        Joined {new Date(profile.created_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                  {isShopOwner && profile?.years_in_business && (
                    <>
                      <span className="w-px h-3 bg-[#EEECE6]" />
                      <span className="flex items-center gap-1">
                        <Briefcase size={11} />
                        {profile.years_in_business} years
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Action */}
              <div className="flex-shrink-0">
                <Button 
                  onClick={() => navigate(editPath)}
                  variant="outline"
                  className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-4 py-1.5 h-auto"
                >
                  <Edit2 size={13} className="mr-1.5" />
                  Edit
                </Button>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-6">
            {/* Basic Info */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-3 flex items-center gap-2">
                <User size={14} />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#F8F6F0] rounded-lg p-3">
                  <p className="text-[10px] text-[#A0A0B0]">Full Name</p>
                  <p className="text-sm font-medium text-[#1A1A2E]">{profile.full_name || 'Not provided'}</p>
                </div>
                <div className="bg-[#F8F6F0] rounded-lg p-3">
                  <p className="text-[10px] text-[#A0A0B0]">Role</p>
                  <p className="text-sm font-medium text-[#1A1A2E] capitalize">{profile.role}</p>
                </div>
                <div className="bg-[#F8F6F0] rounded-lg p-3">
                  <p className="text-[10px] text-[#A0A0B0]">Phone</p>
                  <p className="text-sm font-medium text-[#1A1A2E]">{profile.phone || 'Not provided'}</p>
                </div>
                <div className="bg-[#F8F6F0] rounded-lg p-3">
                  <p className="text-[10px] text-[#A0A0B0]">Pincode</p>
                  <p className="text-sm font-medium text-[#1A1A2E]">{profile.pincode || 'Not provided'}</p>
                </div>
                <div className="bg-[#F8F6F0] rounded-lg p-3 md:col-span-2">
                  <p className="text-[10px] text-[#A0A0B0]">Address</p>
                  <p className="text-sm font-medium text-[#1A1A2E]">{profile.address || 'Not provided'}</p>
                </div>
                {profile.bio && (
                  <div className="bg-[#F8F6F0] rounded-lg p-3 md:col-span-2">
                    <p className="text-[10px] text-[#A0A0B0]">Bio</p>
                    <p className="text-sm font-medium text-[#1A1A2E]">{profile.bio}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Buyer Specific Fields */}
            {!isShopOwner && (
              <>
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Shield size={14} />
                    Identity & Trust
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#F8F6F0] rounded-lg p-3">
                      <p className="text-[10px] text-[#A0A0B0]">Identity Number</p>
                      <p className="text-sm font-medium text-[#1A1A2E] flex items-center gap-2">
                        {profile.identity_number || 'Not provided'}
                        {profile.identity_number && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                            <Lock size={10} />
                            Locked
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="bg-[#F8F6F0] rounded-lg p-3">
                      <p className="text-[10px] text-[#A0A0B0]">Identity Type</p>
                      <p className="text-sm font-medium text-[#1A1A2E]">{profile.identity_type ? profile.identity_type.toUpperCase() : 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Package size={14} />
                    Delivery Preferences
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-[#F8F6F0] rounded-lg p-3">
                      <p className="text-[10px] text-[#A0A0B0]">Default Delivery Address</p>
                      <p className="text-sm font-medium text-[#1A1A2E]">{profile.delivery_address || 'Not provided'}</p>
                    </div>
                    <div className="bg-[#F8F6F0] rounded-lg p-3">
                      <p className="text-[10px] text-[#A0A0B0]">Budget Range Preference</p>
                      <p className="text-sm font-medium text-[#1A1A2E]">
                        {profile.budget_range_preference?.min && profile.budget_range_preference?.max
                          ? `₹${profile.budget_range_preference.min.toLocaleString()} - ₹${profile.budget_range_preference.max.toLocaleString()}`
                          : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Shop Specific Fields */}
            {isShopOwner && (
              <>
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Store size={14} />
                    Shop Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#F8F6F0] rounded-lg p-3">
                      <p className="text-[10px] text-[#A0A0B0]">Shop Name</p>
                      <p className="text-sm font-medium text-[#1A1A2E]">{profile.shop_name || 'Not provided'}</p>
                    </div>
                    <div className="bg-[#F8F6F0] rounded-lg p-3">
                      <p className="text-[10px] text-[#A0A0B0]">Years in Business</p>
                      <p className="text-sm font-medium text-[#1A1A2E]">{profile.years_in_business ? `${profile.years_in_business} years` : 'Not provided'}</p>
                    </div>
                    <div className="bg-[#F8F6F0] rounded-lg p-3 md:col-span-2">
                      <p className="text-[10px] text-[#A0A0B0]">GST Number</p>
                      <p className="text-sm font-medium text-[#1A1A2E] flex items-center gap-2">
                        {profile.gst_number || 'Not provided'}
                        {profile.gst_number && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                            <Lock size={10} />
                            Locked
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {profile.business_hours && (
                  <div>
                    <h3 className="text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Clock size={14} />
                      Business Hours
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {profile.business_hours.monday_friday && (
                        <div className="bg-[#F8F6F0] rounded-lg p-3 flex justify-between">
                          <span className="text-sm text-[#4A4A5A]">Mon - Fri</span>
                          <span className="text-sm font-medium text-[#1A1A2E]">{profile.business_hours.monday_friday}</span>
                        </div>
                      )}
                      {profile.business_hours.saturday && (
                        <div className="bg-[#F8F6F0] rounded-lg p-3 flex justify-between">
                          <span className="text-sm text-[#4A4A5A]">Saturday</span>
                          <span className="text-sm font-medium text-[#1A1A2E]">{profile.business_hours.saturday}</span>
                        </div>
                      )}
                      {profile.business_hours.sunday && (
                        <div className="bg-[#F8F6F0] rounded-lg p-3 flex justify-between">
                          <span className="text-sm text-[#4A4A5A]">Sunday</span>
                          <span className="text-sm font-medium text-[#1A1A2E]">{profile.business_hours.sunday}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#EEECE6] bg-[#F8F6F0]/50 flex justify-between items-center">
            <span className="text-[9px] text-[#A0A0B0]">
              <Sparkles size={10} className="inline mr-1 text-[#FFBE91]" />
              Profile last updated: {new Date().toLocaleDateString()}
            </span>
            <Button
              onClick={() => navigate(editPath)}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-1 h-auto"
            >
              <Edit2 size={12} className="mr-1.5" />
              Edit Profile
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;