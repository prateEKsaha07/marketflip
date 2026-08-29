import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LogOut,
  Package,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  TrendingUp,
  Award,
  Copy,
  Check,
  PieChart,
  Users,
  Target,
  Store,
  Activity,
  Zap,
  ShoppingBag,
  Eye,
  MessageSquare,
  Gavel,
  User,
  Sparkles,
  Rocket,
  Building2,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
  Star,
  Briefcase,
  Shield,
  Clock as ClockIcon,
  Smile,
  History
} from 'lucide-react';
import api from '../../api/client';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedGST, setCopiedGST] = useState(false);
  const [profile, setProfile] = useState(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    fetchShopProfile();
    generateGreeting();
  }, []);

  const generateGreeting = () => {
    const greetings = [
      'Good to see you again',
      'Welcome back',
      'Happy to have you here',
      'Great to have you back',
      'Welcome to your dashboard',
      'Good to see you',
      'Welcome back to your workspace',
      'Ready for a productive day',
      'Glad to have you here',
      'Welcome to your business hub'
    ];
    
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    setGreeting(randomGreeting);
  };

  const fetchShopProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/auth/profiles/${user?.user_id}`);
      if (response.data) {
        setProfile(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch shop profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const copyShopId = async () => {
    if (user?.user_id) {
      await navigator.clipboard.writeText(user.user_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyGSTNumber = async () => {
    if (profile?.gst_number) {
      await navigator.clipboard.writeText(profile.gst_number);
      setCopiedGST(true);
      setTimeout(() => setCopiedGST(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#1A1A2E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#A0A0B0]">Loading...</p>
        </div>
      </div>
    );
  }

  const getFullName = () => {
    if (profile?.full_name) return profile.full_name;
    return 'User';
  };

  const getShopName = () => {
    if (profile?.shop_name) return profile.shop_name;
    return null;
  };

  const getInitials = () => {
    const name = getShopName() || getFullName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getGSTStatus = () => {
    if (profile?.gst_number) {
      return profile.gst_number;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0]">
      {/* Top Bar */}
      <div className="bg-white border-b border-[#EEECE6] px-6 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {profile?.profile_photo_url ? (
              <img 
                src={profile.profile_photo_url} 
                alt={getFullName()}
                className="w-9 h-9 rounded-xl object-cover border border-[#EEECE6]"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#1A1A2E] flex items-center justify-center text-white font-bold text-sm">
                {getInitials()}
              </div>
            )}
            <div>
              <h2 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2">
                {getShopName() || getFullName()}
                {profile?.is_verified && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-medium">
                    <Shield size={10} />
                    Verified
                  </span>
                )}
                {!getShopName() && (
                  <span className="text-xs font-normal text-[#A0A0B0]">
                    (Add shop name)
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#A0A0B0] flex-wrap">
                <span>ID: {user?.user_id?.slice(0, 8)}</span>
                <button
                  onClick={copyShopId}
                  className="p-0.5 hover:bg-[#F5F3EF] rounded transition-colors"
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
                {copied && <span className="text-emerald-600 text-[10px]">Copied!</span>}
                <span className="w-px h-3 bg-[#EEECE6]" />
                {getGSTStatus() ? (
                  <>
                    <span>GST: {getGSTStatus()}</span>
                    <button
                      onClick={copyGSTNumber}
                      className="p-0.5 hover:bg-[#F5F3EF] rounded transition-colors"
                    >
                      {copiedGST ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                    {copiedGST && <span className="text-emerald-600 text-[10px]">Copied!</span>}
                  </>
                ) : (
                  <>
                    <span>GST: Not added</span>
                    <button 
                      onClick={() => navigate('/shop/profile')}
                      className="text-emerald-600 hover:text-emerald-700 text-[10px] font-medium underline-offset-2 hover:underline"
                    >
                      Add GST
                    </button>
                  </>
                )}
                {profile?.phone && (
                  <>
                    <span className="w-px h-3 bg-[#EEECE6]" />
                    <Phone size={12} />
                    <span>{profile.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-[#A0A0B0] bg-[#F8F6F0] px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Active
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header with Greeting */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6"
        >
          <div>
            <h1 className="text-lg font-medium text-[#1A1A2E] tracking-tight flex items-center gap-2">
              <Smile size={18} className="text-[#A0A0B0]" />
              {greeting}, {getFullName().split(' ')[0]}
            </h1>
            <p className="text-sm text-[#A0A0B0] flex items-center gap-2 flex-wrap">
              <Store size={14} className="text-[#A0A0B0]" />
              <span>{getShopName() || 'No shop name set'}</span>
              {profile?.role && (
                <>
                  <span className="text-[#D0D0D0]">·</span>
                  <span className="text-xs bg-[#F8F6F0] px-2 py-0.5 rounded-full text-[#1A1A2E]">
                    {profile.role}
                  </span>
                </>
              )}
              {profile?.years_in_business && (
                <>
                  <span className="text-[#D0D0D0]">·</span>
                  <span className="text-xs text-[#A0A0B0] flex items-center gap-1">
                    <Briefcase size={12} />
                    {profile.years_in_business} years
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => navigate('/shop/profile')}
              variant="outline"
              className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] hover:border-[#D0D0D0] text-sm px-4 py-2"
            >
              <User size={15} className="mr-1.5" />
              Profile
            </Button>
            <Button 
              onClick={() => navigate('/shop/my-bids')}
              variant="outline"
              className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] hover:border-[#D0D0D0] text-sm px-4 py-2"
            >
              <Package size={15} className="mr-1.5" />
              My Bids
            </Button>
            <Button 
              onClick={() => navigate('/shop/browse')}
              className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-sm px-4 py-2"
            >
              <Search size={15} className="mr-1.5" />
              Browse
            </Button>
            <Button 
              onClick={() => navigate('/shop/auctions')}
              variant="outline"
              className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] hover:border-[#D0D0D0] text-sm px-4 py-2"
            >
              <Gavel size={15} className="mr-1.5" />
              Auctions
            </Button>

            <Button
              onClick={() => navigate('/shop/history')}
              variant="outline"
              className="border-[#FFDDB0] text-[#1A1A2E] hover:bg-[#FFDDB0]/30 text-xs px-4 py-2"
            >
              <History size={16} className="mr-1.5" />
                Transaction History
            </Button>

            <Button 
              onClick={() => navigate('/shop/completed')}
              variant="outline"
              className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] hover:border-[#D0D0D0] text-sm px-4 py-2"
            >
              <CheckCircle size={15} className="mr-1.5" />
              Completed
            </Button>
            <Button 
              onClick={handleLogout}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-rose-500 hover:bg-rose-50 text-sm px-3 py-2"
            >
              <LogOut size={15} />
            </Button>
          </div>
        </motion.div>

        {/* Coming Soon Section with Image - Warmer & Lighter */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <div className="bg-gradient-to-br from-[#FDF6ED] via-[#F8EDE0] to-[#F5E8D8] rounded-2xl p-8 text-center border border-[#E8DCC8] min-h-[450px] flex flex-col items-center justify-center shadow-sm">
            <h3 className="text-3xl font-bold text-[#2A1F1A] mb-6">
              More Updates Soon
            </h3>
            
            <img 
              src="/shop_dsb.png" 
              alt="Coming Soon" 
              className="max-w-full h-auto max-h-[250px] object-contain rounded-lg"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;