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
  Copy,
  Check,
  Store,
  Gavel,
  User,
  Sparkles,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Shield,
  Smile,
  History,
  MessageCircle,
  FileText,
  Award,
  TrendingUp,
  Mail,
  ShoppingBag,
  List,
  Bookmark
} from 'lucide-react';
import api from '../../api/client';
import NotificationDropdown from '../../components/NotificationDropdown';
import SavedSearchesList from '../../components/SavedSearchesList';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedGST, setCopiedGST] = useState(false);
  const [profile, setProfile] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({
    total_bids: 0,
    pending: 0,
    selected: 0,
    completed: 0
  });

  useEffect(() => {
    fetchShopProfile();
    generateGreeting();
    fetchUnreadCount();
    fetchBidStats();
  }, []);

  const generateGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good Evening';
    if (hour < 12) timeGreeting = 'Good Morning';
    else if (hour < 17) timeGreeting = 'Good Afternoon';
    
    const greetings = [
      'Welcome back',
      'Great to see you',
      'Happy to have you here',
      'Ready to grow your business',
      'Let\'s find new opportunities'
    ];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    setGreeting(`${timeGreeting}, ${randomGreeting}`);
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

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/chat/unread-count');
      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const fetchBidStats = async () => {
    try {
      const response = await api.get('/bids');
      const bids = response.data || [];
      
      console.log('=== BID STATS DATA ===', bids);
      
      // Log each bid to see structure
      bids.forEach((bid, index) => {
        console.log(`Bid ${index}:`, {
          status: bid.status,
          request_status: bid.requests?.status || bid.request?.status || 'N/A',
          request: bid.requests || bid.request || 'N/A'
        });
      });
      
      // Calculate stats - handle both 'requests' and 'request' property names
      const total = bids.length;
      const pending = bids.filter(b => b.status === 'pending').length;
      
      // Selected bids are those with status 'selected' AND request is NOT completed
      const selected = bids.filter(b => {
        if (b.status !== 'selected') return false;
        const reqStatus = b.requests?.status || b.request?.status;
        return reqStatus !== 'completed';
      }).length;
      
      // Completed bids are those where the request is completed
      const completed = bids.filter(b => {
        const reqStatus = b.requests?.status || b.request?.status;
        return reqStatus === 'completed';
      }).length;
      
      setStats({
        total_bids: total,
        pending: pending,
        selected: selected,
        completed: completed
      });
      
      console.log('Stats calculated:', { total, pending, selected, completed });
    } catch (err) {
      console.error('Failed to fetch bid stats:', err);
      // Keep default values (all 0)
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

  // Stats Cards
  const statCards = [
    { 
      key: 'total', 
      label: 'Total Bids', 
      value: stats.total_bids, 
      icon: <List size={18} className="text-[#FFBE91]" />,
      bg: 'bg-[#FFFCE1]',
      border: 'border-[#FFDDB0]',
      desc: 'All bids placed'
    },
    { 
      key: 'pending', 
      label: 'Pending', 
      value: stats.pending, 
      icon: <Clock size={18} className="text-amber-600" />,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      desc: 'Awaiting response'
    },
    { 
      key: 'selected', 
      label: 'Selected', 
      value: stats.selected, 
      icon: <CheckCircle size={18} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      desc: 'Won bids'
    },
    { 
      key: 'completed', 
      label: 'Completed', 
      value: stats.completed, 
      icon: <Award size={18} className="text-violet-600" />,
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      desc: 'Transactions done'
    },
  ];

  // Navigation cards
  const navItems = [
    {
      id: 'requests',
      label: 'Request Hub',
      icon: <FileText size={20} />,
      path: '/shop/requests',
      color: 'bg-gradient-to-br from-[#FFBE91] to-[#FFDDB0] hover:from-[#FFA87A] hover:to-[#FFDDB0] text-[#1A1A2E]',
      description: 'Manage bids & requests'
    },
    {
      id: 'auctions',
      label: 'Auction Dashboard',
      icon: <Gavel size={20} />,
      path: '/shop/auctions',
      color: 'bg-gradient-to-br from-[#CFEBFF] to-[#E8F4FD] hover:from-[#B8DCF0] hover:to-[#E8F4FD] text-[#1A1A2E]',
      description: 'Manage your auctions'
    },
    {
      id: 'chat',
      label: 'Chats',
      icon: <MessageCircle size={20} />,
      path: '/shop/chat',
      color: 'bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] hover:from-[#C8E6C9] hover:to-[#E8F5E9] text-[#1A1A2E]',
      description: 'Messages with buyers'
    },
    {
      id: 'history',
      label: 'Transaction History',
      icon: <History size={20} />,
      path: '/shop/history',
      color: 'bg-gradient-to-br from-[#F5F3EF] to-[#EEECE6] hover:from-[#E8E5DF] hover:to-[#EEECE6] text-[#1A1A2E]',
      description: 'Complete audit log'
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with User Profile */}
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-[#EEECE6] shadow-sm mb-6"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile?.profile_photo_url ? (
                <img 
                  src={profile.profile_photo_url} 
                  alt={getFullName()}
                  className="w-16 h-16 rounded-xl object-cover border border-[#EEECE6]"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#FFBE91] to-[#FFDDB0] flex items-center justify-center text-[#1A1A2E] font-bold text-xl">
                  {getInitials()}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-[#1A1A2E]">
                  {greeting}, {getShopName() || getFullName().split(' ')[0]}
                </h1>
                <span className="text-xs text-[#A0A0B0] bg-[#F5F3EF] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Shield size={10} />
                  {profile?.role || 'Shop Owner'}
                </span>
                {profile?.is_verified && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-medium">
                    <Shield size={10} />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-[#A0A0B0] flex items-center gap-2">
                <Mail size={14} />
                {user?.email}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#A0A0B0]">
                <div className="flex items-center gap-1">
                  <span>ID: {user?.user_id?.slice(0, 8)}</span>
                  <button
                    onClick={copyShopId}
                    className="p-0.5 hover:bg-[#F5F3EF] rounded transition-colors"
                  >
                    {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                  {copied && <span className="text-emerald-600 text-[10px]">Copied!</span>}
                </div>
                {getGSTStatus() && (
                  <>
                    <span className="w-px h-3 bg-[#EEECE6]" />
                    <span>GST: {getGSTStatus()}</span>
                    <button
                      onClick={copyGSTNumber}
                      className="p-0.5 hover:bg-[#F5F3EF] rounded transition-colors"
                    >
                      {copiedGST ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                    {copiedGST && <span className="text-emerald-600 text-[10px]">Copied!</span>}
                  </>
                )}
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
                {profile?.years_in_business && (
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

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              {/* Notification Dropdown */}
              <NotificationDropdown />

              {unreadCount > 0 && (
                <div className="bg-[#FFBE91] text-[#1A1A2E] px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                  <MessageCircle size={14} />
                  {unreadCount} unread
                </div>
              )}
              <Button 
                onClick={() => navigate('/shop/profile')}
                variant="outline"
                className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] text-sm px-3 py-1.5 h-auto"
              >
                <User size={14} className="mr-1.5" />
                Profile
              </Button>
              <Button 
                onClick={handleLogout}
                variant="ghost"
                className="text-[#A0A0B0] hover:text-rose-500 hover:bg-rose-50 text-sm px-3 py-1.5 h-auto"
              >
                <LogOut size={14} />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid - 4 KPIs */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          {statCards.map((stat) => (
            <motion.div
              key={stat.key}
              variants={itemVariants}
              className={`bg-white/80 backdrop-blur-xl rounded-xl p-4 border ${stat.border} shadow-sm hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  {stat.icon}
                </div>
                <span className="text-xl font-bold text-[#1A1A2E]">{stat.value}</span>
              </div>
              <p className="text-xs font-medium text-[#1A1A2E] mt-1">{stat.label}</p>
              <p className="text-[10px] text-[#A0A0B0]">{stat.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Navigation Grid - 4 cards */}
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

        {/* Saved Searches Section */}
        <motion.div 
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-[#EEECE6] shadow-sm mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bookmark size={16} className="text-[#FFBE91]" />
              <h3 className="text-sm font-medium text-[#1A1A2E]">Saved Searches</h3>
            </div>
            <span className="text-[10px] text-[#A0A0B0]">Quick access to your saved searches</span>
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
                onClick={() => navigate('/shop/browse')}
                className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-xs px-3 py-1.5 h-auto"
              >
                <Search size={13} className="mr-1.5" />
                Browse Requests
              </Button>
              <Button
                onClick={() => navigate('/shop/my-bids')}
                variant="outline"
                className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
              >
                <Package size={13} className="mr-1.5" />
                My Bids
              </Button>
              <Button
                onClick={() => navigate('/shop/auctions/post')}
                variant="outline"
                className="border-[#CFEBFF] text-[#1A1A2E] hover:bg-[#CFEBFF]/20 text-xs px-3 py-1.5 h-auto"
              >
                <Gavel size={13} className="mr-1.5" />
                Create Auction
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
    </div>
  );
};

export default Dashboard;