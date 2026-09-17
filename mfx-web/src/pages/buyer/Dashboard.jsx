import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import ModernNavbar from "../../components/ui/Navbar";
import { 
  Gavel,
  User,
  History,
  MessageCircle,
  FileText,
  Sparkles,
  Package,
  TrendingUp,
  Copy,
  Check,
  Mail,
  MapPin,
  Calendar,
  Phone,
  ShieldCheck,
  Bookmark
} from 'lucide-react';
import api from '../../api/client';
import SavedSearchesList from '../../components/SavedSearchesList';
import AIAssistant from "../../components/ai-assistant";

const AnimatedGreeting = ({ prefix, name }) => {
  const chars = prefix.split('');

  return (
    <h1 className="text-base md:text-lg font-semibold text-[#1A1A2E] tracking-tight leading-normal flex items-baseline flex-wrap overflow-visible">
      {/* Typing prefix */}
      <span className="inline-flex">
        {chars.map((char, i) => (
          <motion.span
            key={`${char}-${i}`}
            initial={{ opacity: 0, y: 3, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              delay: 0.2 + i * 0.022,
              duration: 0.16,
              ease: 'easeOut',
            }}
            className="inline-block"
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </span>

      {/* Name — appears after typing finishes, stays static */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: 0.2 + chars.length * 0.022 + 0.12,
          duration: 0.3,
          ease: 'easeOut',
        }}
        className="ml-1 font-bold text-[#1A1A2E]"
      >
        {name}
      </motion.span>
    </h1>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [greeting, setGreeting] = useState('');

  // Fetch user data on mount
  useEffect(() => {
    fetchProfile();
    generateGreeting();
  }, []);

  const generateGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good Evening';
    if (hour < 12) timeGreeting = 'Good Morning';
    else if (hour < 17) timeGreeting = 'Good Afternoon';

    const greetings = [
      'Welcome back',
      // 'Great to see you',
      // 'Happy to have you here',
      // 'Ready to explore',
      // "Let's find something amazing",
    ];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    setGreeting(`${timeGreeting}`);
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/auth/profiles/${user?.user_id}`);
      if (response.data) {
        setProfile(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const copyUserId = async () => {
    if (user?.user_id) {
      await navigator.clipboard.writeText(user.user_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getInitials = () => {
    const name = profile?.full_name || user?.email?.split('@')[0] || 'User';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getFullName = () => {
    return profile?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const navItems = [
    {
      id: 'requests',
      label: 'Request Dashboard',
      icon: <FileText size={20} />,
      path: '/buyer/requests',
      color: 'bg-gradient-to-br from-[#FFBE91] to-[#FFDDB0] hover:from-[#FFA87A] hover:to-[#FFDDB0] text-[#1A1A2E]',
      description: 'Manage your requests & purchases',
    },
    {
      id: 'auctions',
      label: 'Auction Dashboard',
      icon: <Gavel size={20} />,
      path: '/buyer/auctions',
      color: 'bg-gradient-to-br from-[#CFEBFF] to-[#E8F4FD] hover:from-[#B8DCF0] hover:to-[#E8F4FD] text-[#1A1A2E]',
      description: 'Browse & bid on auctions',
    },
    {
      id: 'chat',
      label: 'Chats',
      icon: <MessageCircle size={20} />,
      path: '/buyer/chat',
      color: 'bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] hover:from-[#C8E6C9] hover:to-[#E8F5E9] text-[#1A1A2E]',
      description: 'Messages with shops',
    },
    {
      id: 'history',
      label: 'Transaction History',
      icon: <History size={20} />,
      path: '/buyer/history',
      color: 'bg-gradient-to-br from-[#F5F3EF] to-[#EEECE6] hover:from-[#E8E5DF] hover:to-[#EEECE6] text-[#1A1A2E]',
      description: 'Complete audit log',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-4 md:p-6">
      <ModernNavbar
        navItems={[
          { name: 'Dashboard', path: '/buyer/dashboard', icon: 'LayoutDashboard' },
          { name: 'Requests', path: '/buyer/requests', icon: 'FileText' },
          { name: 'Auctions', path: '/buyer/auctions', icon: 'Gavel' },
          { name: 'Chats', path: '/buyer/chat', icon: 'MessageCircle' },
          { name: 'History', path: '/buyer/history', icon: 'History' },
        ]}
        logo={{
          src: '/Logo.png',
          alt: 'MarketFlip',
          link: '/buyer/dashboard',
        }}
        showProfile={true}
        showLogout={true}
        showNotifications={true}
        logoutButton={{
          label: 'Logout',
          icon: 'LogOut',
          onClick: handleLogout,
        }}
        profileButton={{
          label: 'Profile',
          path: '/buyer/profile',
          icon: 'User',
        }}
      />

      <div className="max-w-6xl mx-auto">
        {/* Header with User Profile — Editorial Ribbon */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden mb-8 py-5"
        >
          <div className="absolute inset-0 bg-gradient-primary bg-[length:200%_200%] animate-gradient opacity-90 rounded-3xl" />
          <div className="absolute -top-24 right-0 w-72 h-72 rounded-full bg-lightCream/70 blur-3xl animate-float pointer-events-none" />
          <div className="absolute -bottom-28 -left-10 w-72 h-72 rounded-full bg-softBlue/50 blur-3xl animate-pulse-slow pointer-events-none" />

          <div className="relative px-6 md:px-8 flex flex-col md:flex-row items-start md:items-center gap-5">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
              className="flex-shrink-0 relative"
            >
              <motion.div
                animate={{ scale: [1, 1.12, 1], opacity: [0.55, 0.2, 0.55] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-3 rounded-full bg-lightCream/80 blur-lg"
              />
              <div className="relative">
                {profile?.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={getFullName()}
                    className="relative rounded-full object-cover ring-4 ring-lightCream/60"
                    style={{ width: '64px', height: '64px' }}
                  />
                ) : (
                  <div
                    className="relative rounded-full bg-[#1A1A2E] flex items-center justify-center text-lightCream font-bold text-xl ring-4 ring-lightCream/60"
                    style={{ width: '64px', height: '64px' }}
                  >
                    {getInitials()}
                  </div>
                )}
              </div>
            </motion.div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              {/* Animated greeting — key on greeting so it replays once when ready */}
              <AnimatedGreeting
                key={greeting}
                prefix={`${greeting},`}
                name={getFullName().split(' ')[0]}
              />

              {/* Email + verification */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.4 }}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-[#1A1A2E]/70"
              >
                <span className="flex items-center gap-1.5">
                  <Mail size={12} />
                  {user?.email}
                </span>
                <span className="w-1 h-1 rounded-full bg-[#1A1A2E]/30" />
                <motion.span
                  animate={{ opacity: [0.75, 1, 0.75] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex items-center gap-1 font-medium text-[#1A1A2E]"
                >
                  <ShieldCheck
                    size={12}
                    className={
                      profile?.is_verified ? 'text-emerald-600' : 'text-[#1A1A2E]/60'
                    }
                  />
                  {profile?.is_verified ? 'Verified Buyer' : 'Buyer'}
                </motion.span>
              </motion.div>

              {/* Meta row */}
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.55, duration: 0.4 }}
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-[11px] text-[#1A1A2E]/65"
              >
                <button
                  onClick={copyUserId}
                  className="flex items-center gap-1.5 hover:text-[#1A1A2E] transition-colors group"
                >
                  <span className="font-mono tracking-tight">
                    {user?.user_id?.slice(0, 8)}
                  </span>
                  {copied ? (
                    <Check size={11} className="text-emerald-600" />
                  ) : (
                    <Copy
                      size={11}
                      className="opacity-50 group-hover:opacity-100 transition-opacity"
                    />
                  )}
                </button>

                {profile?.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={10} />
                    {profile.phone}
                  </span>
                )}

                {profile?.pincode && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={10} />
                    {profile.pincode}
                  </span>
                )}

                {profile?.created_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={10} />
                    Joined{' '}
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
        >
          {navItems.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => navigate(item.path)}
                variant="outline"
                className={`w-full py-6 h-auto flex flex-col items-center justify-center gap-2 ${item.color} transition-all shadow-sm hover:shadow-md border-0`}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="text-[10px] text-[#A0A0B0]">{item.description}</span>
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* Saved Searches */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-[#EEECE6] shadow-sm mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bookmark size={16} className="text-[#FFBE91]" />
              <h3 className="text-sm font-medium text-[#1A1A2E]">Saved Searches</h3>
            </div>
            <span className="text-[10px] text-[#A0A0B0]">
              Quick access to your saved searches
            </span>
          </div>
          <SavedSearchesList limit={3} showViewAll />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-[#EEECE6] shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[#FFBE91]" />
              <span className="text-xs font-medium text-[#1A1A2E]">Quick Actions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => navigate('/buyer/post-request')}
                className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-3 py-1.5 h-auto"
              >
                <FileText size={13} className="mr-1.5" />
                Post Request
              </Button>
              <Button
                onClick={() => navigate('/buyer/auctions/browse')}
                variant="outline"
                className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
              >
                <Gavel size={13} className="mr-1.5" />
                Browse Auctions
              </Button>
              <Button
                onClick={() => navigate('/buyer/purchases')}
                variant="outline"
                className="border-[#CFEBFF] text-[#1A1A2E] hover:bg-[#CFEBFF]/20 text-xs px-3 py-1.5 h-auto"
              >
                <Package size={13} className="mr-1.5" />
                My Purchases
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center text-[10px] text-[#A0A0B0]"
        >
          <span className="flex items-center justify-center gap-1">
            <Sparkles size={10} className="text-[#FFBE91]" />
            MarketFlip · Your marketplace for requests and auctions
          </span>
        </motion.div>
      </div>

      <AIAssistant />
    </div>
  );
};

export default Dashboard;