import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Clock, 
  Sparkles, 
  ArrowLeft, 
  LogOut,
  Copy,
  Check,
  Package,
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

  const backPath = profile?.role === 'shop_owner' ? '/shop/dashboard' : '/buyer/dashboard';
  const editPath = profile?.role === 'shop_owner' ? '/shop/profile/edit' : '/buyer/profile/edit';

  const getInitials = () => {
    const name = profile?.shop_name || profile?.full_name || user?.email?.split('@')[0] || 'User';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getFullName = () => {
    return profile?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getShopName = () => profile?.shop_name || null;
  const isShopOwner = profile?.role === 'shop_owner';

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0] p-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 text-center max-w-sm w-full"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={18} className="text-rose-500" />
          </div>
          <h2 className="text-sm font-semibold text-rose-700">Error</h2>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
          <Button 
            onClick={() => navigate(backPath)} 
            className="mt-3 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-3 py-1.5 h-auto"
          >
            <ArrowLeft size={12} className="mr-1.5" />
            Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-3 sm:p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Top Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-between items-center gap-2 mb-4 sm:mb-5"
        >
          <button
            onClick={() => navigate(backPath)}
            className="flex items-center gap-1.5 text-[11px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors py-1.5 -ml-1 px-1"
          >
            <ArrowLeft size={12} />
            Back
          </button>
          <div className="flex items-center gap-1.5">
            <Button 
              onClick={() => navigate(editPath)}
              className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-[11px] px-3 py-1.5 h-auto flex items-center gap-1.5"
            >
              <Edit2 size={11} />
              Edit
            </Button>
            <Button 
              onClick={handleLogout}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-rose-500 hover:bg-rose-50 text-[11px] px-2 py-1.5 h-auto"
            >
              <LogOut size={12} />
            </Button>
          </div>
        </motion.div>

        {/* Profile Hero */}
        <motion.div 
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative overflow-hidden mb-5 sm:mb-6 py-4 sm:py-5 rounded-2xl"
        >
          <div className="absolute inset-0 bg-gradient-primary bg-[length:200%_200%] animate-gradient opacity-90" />
          <div className="absolute -top-20 right-0 w-56 h-56 rounded-full bg-lightCream/70 blur-3xl animate-float pointer-events-none" />
          <div className="absolute -bottom-24 -left-8 w-56 h-56 rounded-full bg-softBlue/50 blur-3xl animate-pulse-slow pointer-events-none" />

          <div className="relative px-4 sm:px-5 md:px-6 flex items-center gap-3 sm:gap-4">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
              className="flex-shrink-0 relative"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-2 rounded-full bg-lightCream/80 blur-md"
              />
              <div className="relative">
                {profile?.profile_photo_url ? (
                  <img 
                    src={profile.profile_photo_url} 
                    alt={getFullName()}
                    className="relative rounded-full object-cover ring-2 ring-lightCream/70 w-12 h-12 sm:w-14 sm:h-14"
                  />
                ) : (
                  <div className="relative rounded-full bg-[#1A1A2E] flex items-center justify-center text-lightCream font-bold text-sm sm:text-base ring-2 ring-lightCream/70 w-12 h-12 sm:w-14 sm:h-14">
                    {getInitials()}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.35 }}
                className="flex flex-wrap items-center gap-1.5 mb-1"
              >
                <h1 className="text-[13px] sm:text-sm md:text-base font-bold text-[#1A1A2E] tracking-tight truncate">
                  {isShopOwner ? getShopName() || getFullName() : getFullName()}
                </h1>
                {profile?.is_verified && (
                  <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                    <Shield size={8} />
                    Verified
                  </span>
                )}
                <span className="text-[9px] font-medium text-[#1A1A2E] bg-lightCream/70 px-1.5 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm flex-shrink-0">
                  {isShopOwner ? 'Shop Owner' : 'Buyer'}
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.35 }}
                className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[#1A1A2E]/70"
              >
                <span className="flex items-center gap-1 min-w-0 max-w-full">
                  <Mail size={10} className="flex-shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </span>
                <span className="hidden sm:inline w-0.5 h-0.5 rounded-full bg-[#1A1A2E]/30" />
                <button
                  onClick={copyUserId}
                  className="flex items-center gap-1 hover:text-[#1A1A2E] transition-colors"
                >
                  <span className="font-mono">{user?.user_id?.slice(0, 8)}</span>
                  {copied ? (
                    <Check size={9} className="text-emerald-600" />
                  ) : (
                    <Copy size={9} className="opacity-50" />
                  )}
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-4 sm:space-y-5">
          <Section title="Basic Information" icon={<User size={11} />}>
            <Field label="Full Name" value={profile.full_name} />
            <Field label="Role" value={profile.role} capitalize />
            <Field label="Phone" value={profile.phone} />
            <Field label="Pincode" value={profile.pincode} />
            <Field label="Address" value={profile.address} span={2} />
            {profile.bio && <Field label="Bio" value={profile.bio} span={2} />}
          </Section>

          {!isShopOwner && (
            <>
              <Section title="Identity & Trust" icon={<Shield size={11} />}>
                <Field 
                  label="Identity Number" 
                  value={profile.identity_number} 
                  badge={profile.identity_number ? 'Locked' : null}
                />
                <Field 
                  label="Identity Type" 
                  value={profile.identity_type ? profile.identity_type.toUpperCase() : null} 
                />
              </Section>

              <Section title="Delivery Preferences" icon={<Package size={11} />}>
                <Field label="Default Delivery Address" value={profile.delivery_address} span={2} />
                <Field 
                  label="Budget Range" 
                  value={
                    profile.budget_range_preference?.min && profile.budget_range_preference?.max
                      ? `₹${profile.budget_range_preference.min.toLocaleString()} – ₹${profile.budget_range_preference.max.toLocaleString()}`
                      : null
                  } 
                  span={2}
                />
              </Section>
            </>
          )}

          {isShopOwner && (
            <>
              <Section title="Shop Details" icon={<Store size={11} />}>
                <Field label="Shop Name" value={profile.shop_name} />
                <Field label="Years in Business" value={profile.years_in_business ? `${profile.years_in_business} years` : null} />
                <Field 
                  label="GST Number" 
                  value={profile.gst_number} 
                  badge={profile.gst_number ? 'Locked' : null}
                  span={2}
                />
              </Section>

              {profile.business_hours && (
                <Section title="Business Hours" icon={<Clock size={11} />}>
                  {profile.business_hours.monday_friday && (
                    <BusinessHourRow label="Mon – Fri" value={profile.business_hours.monday_friday} />
                  )}
                  {profile.business_hours.saturday && (
                    <BusinessHourRow label="Saturday" value={profile.business_hours.saturday} />
                  )}
                  {profile.business_hours.sunday && (
                    <BusinessHourRow label="Sunday" value={profile.business_hours.sunday} />
                  )}
                </Section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between items-center gap-2 pb-4"
        >
          <span className="text-[9px] text-[#A0A0B0] flex items-center gap-1">
            <Sparkles size={9} className="text-[#FFBE91]" />
            MarketFlip · Profile
          </span>
          <div className="flex items-center gap-2.5 text-[9px] text-[#A0A0B0]">
            <Link to="/privacy" className="hover:text-[#1A1A2E] transition-colors py-1">
              Privacy
            </Link>
            <span className="text-[#EEECE6]">·</span>
            <Link to="/terms" className="hover:text-[#1A1A2E] transition-colors py-1">
              Terms
            </Link>
            <span className="text-[#EEECE6]">·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* ---------- Building blocks ---------- */

const Section = ({ title, icon, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
  >
    <div className="flex items-center gap-1.5 mb-2.5 px-1">
      <span className="text-[#FFBE91]">{icon}</span>
      <h3 className="text-[9px] font-semibold text-[#A0A0B0] uppercase tracking-[0.08em]">
        {title}
      </h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 px-1">
      {children}
    </div>
  </motion.section>
);

const Field = ({ label, value, span = 1, capitalize = false, badge = null }) => (
  <motion.div
    initial={{ opacity: 0, y: 3 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className={span === 2 ? 'md:col-span-2' : ''}
  >
    <p className="text-[9px] uppercase tracking-[0.06em] text-[#A0A0B0] mb-0.5">
      {label}
    </p>
    <p className={`text-[12px] text-[#1A1A2E] ${capitalize ? 'capitalize' : ''} flex flex-wrap items-center gap-1.5 break-words`}>
      {value || <span className="text-[#A0A0B0] italic text-[11px]">Not provided</span>}
      {badge && (
        <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0">
          <Lock size={8} />
          {badge}
        </span>
      )}
    </p>
  </motion.div>
);

const BusinessHourRow = ({ label, value }) => (
  <motion.div
    initial={{ opacity: 0, x: -3 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.25 }}
    className="md:col-span-2 flex justify-between items-center gap-3 py-1.5 border-b border-dashed border-[#EEECE6] last:border-0"
  >
    <span className="text-[11px] text-[#A0A0B0] flex-shrink-0">{label}</span>
    <span className="text-[12px] font-medium text-[#1A1A2E] text-right truncate">{value}</span>
  </motion.div>
);

export default Profile;