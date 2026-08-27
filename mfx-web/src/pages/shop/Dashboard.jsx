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
  User  // ADD THIS
} from 'lucide-react';
import api from '../../api/client';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ pending: 0, selected: 0, rejected: 0, completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shopName, setShopName] = useState('');

  useEffect(() => {
    fetchStats();
    fetchShopProfile();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/bids/stats');
      console.log('Stats:', response.data);
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchShopProfile = async () => {
    try {
      const response = await api.get(`/auth/profiles/${user?.user_id}`);
      if (response.data?.shop_name) {
        setShopName(response.data.shop_name);
      }
    } catch (err) {
      console.error('Failed to fetch shop profile:', err);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const StatCard = ({ label, count, color, icon, delay = 0 }) => {
    const isActive = count > 0;
    
    return (
      <motion.div
        variants={cardVariants}
        custom={delay}
        whileHover={{ y: -2 }}
        className={`
          bg-white rounded-xl border border-[#EEECE6] p-4 flex-1 min-w-[100px]
          ${isActive ? 'hover:shadow-md' : 'opacity-40'}
          transition-all duration-200
        `}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[#A0A0B0]">{icon}</span>
          <span className="text-xs font-medium text-[#A0A0B0] uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-2xl font-semibold" style={{ color }}>
          {count}
        </div>
      </motion.div>
    );
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
    <div className="min-h-screen bg-[#F8F6F0]">
      {/* Top Bar */}
      <div className="bg-white border-b border-[#EEECE6] px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-[#1A1A2E] flex items-center justify-center text-white font-bold text-sm">
              {shopName ? shopName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#1A1A2E]">{shopName || 'My Shop'}</h2>
              <div className="flex items-center gap-2 text-xs text-[#A0A0B0]">
                <span>ID: {user?.user_id?.slice(0, 8)}</span>
                <button
                  onClick={copyShopId}
                  className="p-0.5 hover:bg-[#F5F3EF] rounded transition-colors"
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
                {copied && <span className="text-emerald-600 text-[10px]">Copied!</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-[#A0A0B0]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Active
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6"
        >
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A2E] tracking-tight flex items-center gap-2">
              <Store size={18} className="text-[#A0A0B0]" />
              Dashboard
            </h1>
            <p className="text-sm text-[#A0A0B0]">Manage your bids and track performance</p>
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

        {/* Stats Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={15} className="text-[#A0A0B0]" />
            <h2 className="text-sm font-medium text-[#1A1A2E]">Performance Overview</h2>
            <span className="text-xs text-[#A0A0B0]">· {stats.total} total bids</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard 
              label="Total" 
              count={stats.total} 
              color="#1A1A2E" 
              icon={<PieChart size={14} />} 
              delay={0} 
            />
            <StatCard 
              label="Pending" 
              count={stats.pending} 
              color="#D4A000" 
              icon={<Clock size={14} />} 
              delay={0.1} 
            />
            <StatCard 
              label="Selected" 
              count={stats.selected} 
              color="#2D7A3A" 
              icon={<Target size={14} />} 
              delay={0.2} 
            />
            <StatCard 
              label="Rejected" 
              count={stats.rejected} 
              color="#B33A3A" 
              icon={<XCircle size={14} />} 
              delay={0.3} 
            />
            <StatCard 
              label="Completed" 
              count={stats.completed} 
              color="#2A6B9C" 
              icon={<CheckCircle size={14} />} 
              delay={0.4} 
            />
          </div>
        </motion.div>

        {/* Quick Stats Row */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div className="bg-white rounded-xl border border-[#EEECE6] p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-0.5">
              <TrendingUp size={13} className="text-[#A0A0B0]" />
              <span className="text-xs text-[#A0A0B0]">Success Rate</span>
            </div>
            <p className="text-lg font-semibold text-[#1A1A2E]">
              {stats.total > 0 ? Math.round((stats.selected / stats.total) * 100) : 0}%
            </p>
          </div>
          <div className="bg-white rounded-xl border border-[#EEECE6] p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-0.5">
              <Clock size={13} className="text-[#A0A0B0]" />
              <span className="text-xs text-[#A0A0B0]">Awaiting</span>
            </div>
            <p className="text-lg font-semibold text-[#1A1A2E]">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#EEECE6] p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-0.5">
              <Award size={13} className="text-[#A0A0B0]" />
              <span className="text-xs text-[#A0A0B0]">Conversion</span>
            </div>
            <p className="text-lg font-semibold text-[#1A1A2E]">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </p>
          </div>
          <div className="bg-white rounded-xl border border-[#EEECE6] p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-0.5">
              <Activity size={13} className="text-[#A0A0B0]" />
              <span className="text-xs text-[#A0A0B0]">Active</span>
            </div>
            <p className="text-lg font-semibold text-[#1A1A2E]">{stats.pending + stats.selected}</p>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 bg-white rounded-xl border border-[#EEECE6] p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-[#A0A0B0]" />
            <h3 className="text-sm font-medium text-[#1A1A2E]">Activity Summary</h3>
            <span className="text-[10px] text-[#A0A0B0]">Last 7 days</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#A0A0B0]">
            <div className="flex items-center gap-2">
              <Target size={13} className="text-[#2D7A3A]" />
              <span>{stats.selected} selected</span>
            </div>
            <div className="w-px h-4 bg-[#EEECE6]" />
            <div className="flex items-center gap-2">
              <CheckCircle size={13} className="text-[#2A6B9C]" />
              <span>{stats.completed} completed</span>
            </div>
            <div className="w-px h-4 bg-[#EEECE6]" />
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-[#D4A000]" />
              <span>{stats.pending} pending</span>
            </div>
            <div className="w-px h-4 bg-[#EEECE6]" />
            <div className="flex items-center gap-2">
              <XCircle size={13} className="text-[#B33A3A]" />
              <span>{stats.rejected} rejected</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;