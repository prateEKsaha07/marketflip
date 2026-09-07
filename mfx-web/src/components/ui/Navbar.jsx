import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  User,
  LogOut,
  Bell,
  Settings,
  LayoutDashboard,
  FileText,
  Gavel,
  MessageCircle,
  History,
  Home,
  Info,
  Mail,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

// Icon mapping - directly map icon names to components
const iconMap = {
  LayoutDashboard: LayoutDashboard,
  FileText: FileText,
  Gavel: Gavel,
  MessageCircle: MessageCircle,
  History: History,
  User: User,
  LogOut: LogOut,
  Bell: Bell,
  Settings: Settings,
  Home: Home,
  Info: Info,
  Mail: Mail,
  Package: Package,
  ShoppingBag: ShoppingBag,
  TrendingUp: TrendingUp,
  Users: Users,
};

// Dynamic icon component
const IconComponent = ({ name, size, className }) => {
  const Icon = iconMap[name];
  if (!Icon) {
    console.warn(`Icon "${name}" not found, using default`);
    return null;
  }
  return <Icon size={size} className={className} />;
};

const ModernNavbar = ({
  // Navigation items configuration
  navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
    { name: "Requests", path: "/requests", icon: "FileText" },
    { name: "Auctions", path: "/auctions", icon: "Gavel" },
    { name: "Chats", path: "/chat", icon: "MessageCircle" },
    { name: "History", path: "/history", icon: "History" },
  ],
  
  // Logo configuration
  logo = {
    src: "/Logo.png",
    alt: "MarketFlip",
    link: "/dashboard",
    height: "h-6"
  },
  
  // Toggle buttons
  showProfile = true,
  showLogout = true,
  showNotifications = true,
  showSettings = true,
  
  // Custom button configurations
  profileButton = {
    label: "Profile",
    path: "/profile",
    icon: "User"
  },
  
  logoutButton = {
    label: "Logout",
    icon: "LogOut",
    onClick: null
  },
  
  notificationButton = {
    showBadge: true,
    badgeColor: "bg-[#FFBE91]"
  },
  
  settingsButton = {
    label: "Settings",
    icon: "Settings"
  },
  
  // Custom styling
  className = "",
  containerClassName = "",
  
  // Branding
  brandName = "MarketFlip",
}) => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  
  // Notification states
  const [unreadCount, setUnreadCount] = useState(2);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Dummy notifications for UI testing
  const dummyNotifications = [
    {
      id: 1,
      type: 'bid',
      title: 'New bid on your item',
      description: 'Someone bid ₹2,450 on your item',
      time: '5 minutes ago',
      read: false,
      icon: 'Gavel'
    },
    {
      id: 2,
      type: 'request',
      title: 'Request updated',
      description: 'Request #1234 status changed to purchased',
      time: '2 hours ago',
      read: false,
      icon: 'FileText'
    },
    {
      id: 3,
      type: 'message',
      title: 'New message',
      description: 'You have 3 unread messages',
      time: '4 hours ago',
      read: true,
      icon: 'MessageCircle'
    }
  ];

  // Load dummy notifications on mount
  useEffect(() => {
    setNotifications(dummyNotifications);
    const unread = dummyNotifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, []);

  // Close notifications on route change
  useEffect(() => {
    setIsNotificationsOpen(false);
  }, [location]);

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === notificationId && !n.read) {
          return { ...n, read: true };
        }
        return n;
      })
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'bid':
      case 'Gavel':
        return <Gavel size={14} className="text-blue-500" />;
      case 'request':
      case 'FileText':
        return <FileText size={14} className="text-purple-500" />;
      case 'message':
      case 'MessageCircle':
        return <MessageCircle size={14} className="text-green-500" />;
      case 'auction':
        return <Gavel size={14} className="text-amber-500" />;
      case 'order':
      case 'Package':
        return <Package size={14} className="text-violet-500" />;
      default:
        return <Bell size={14} className="text-gray-500" />;
    }
  };

  // Handle logout
  const handleLogout = () => {
    if (logoutButton.onClick) {
      logoutButton.onClick();
    }
  };

  // Handle settings click with coming soon
  const handleSettingsClick = (e) => {
    e.preventDefault();
    setShowComingSoon(true);
    setTimeout(() => {
      setShowComingSoon(false);
    }, 2500);
  };

  // Calculate current index and active index
  const currentIndex = navItems.findIndex((item) => location.pathname === item.path);
  const activeIndex = hoveredIndex !== null ? hoveredIndex : currentIndex;

  return (
    <>
      {/* Coming Soon Toast Notification - Top */}
      <AnimatePresence>
        {showComingSoon && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 bg-gradient-to-r from-[#FFBE91] to-[#FFDDB0] rounded-lg shadow-2xl border border-white/50 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2.5">
              <Settings size={16} className="text-[#1A1A2E]" />
              <span className="text-sm font-medium text-[#1A1A2E]">
                Settings feature is coming soon
              </span>
              <button
                onClick={() => setShowComingSoon(false)}
                className="p-0.5 hover:bg-[#1A1A2E]/10 rounded-full transition-colors"
              >
                <X size={14} className="text-[#1A1A2E]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-white/30 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-[#FFDDB0]/20"
            : "bg-white/15 backdrop-blur-md shadow-sm border-b border-[#FFDDB0]/10"
        } ${className}`}
      >
        <div className={`max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 ${containerClassName}`}>
          <div className="flex items-center justify-between h-10 lg:h-11">
            {/* Logo */}
            <Link 
              to={logo.link || "/"} 
              className="flex items-center shrink-0 group"
            >
              <motion.img 
                src={logo.src} 
                alt={logo.alt || brandName} 
                className={`${logo.height || 'h-6'} w-auto object-contain transition-transform duration-300 group-hover:scale-105`}
                whileHover={{ rotate: [-1, 1, -1, 0], transition: { duration: 0.5 } }}
              />
            </Link>

            {/* Desktop Navigation */}
            <div 
              className="hidden md:flex items-center bg-white/20 backdrop-blur-sm p-0.5 rounded-full relative border border-[#FFDDB0]/20"
              style={{ height: '32px' }}
            >
              {/* Rolling Pill - Active indicator */}
              <motion.div
                className="absolute bg-gradient-to-r from-[#FFBE91] to-[#FFDDB0] rounded-full shadow-lg shadow-[#FFBE91]/25"
                style={{
                  height: 'calc(100% - 6px)',
                  top: 3,
                  left: 3,
                }}
                animate={{
                  x: activeIndex >= 0 ? activeIndex * (100 / navItems.length) : 0,
                  width: `calc(${100 / navItems.length}% - 6px)`,
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 35,
                  mass: 0.8,
                }}
              />

              {navItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                const isHovered = hoveredIndex === index;
                const isActiveOrHovered = isActive || isHovered;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative z-10 flex-1"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <motion.div
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-300 text-center flex items-center justify-center gap-1.5 cursor-pointer relative ${
                        isActiveOrHovered
                          ? "text-[#1A1A2E]"
                          : "text-[#5A4A42] hover:text-[#1A1A2E]"
                      }`}
                      whileHover={{ 
                        scale: 1.05,
                        transition: { type: "spring", stiffness: 400, damping: 25 }
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconComponent 
                        name={item.icon} 
                        size={12}
                        className={`transition-all duration-300 ${
                          isActiveOrHovered ? "text-[#1A1A2E]" : "text-[#8A7A6A]"
                        }`}
                      />
                      <span className="relative">
                        {item.name}
                      </span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1">
              {/* Notification Bell with Dropdown */}
              {showNotifications && (
                <div className="relative">
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: [0, 5, -5, 0] }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="p-1.5 rounded-full hover:bg-white/20 transition-all duration-300 relative"
                  >
                    <Bell size={15} className="text-[#5A4A42] hover:text-[#1A1A2E] transition-colors duration-300" />
                    {unreadCount > 0 && (
                      <motion.span 
                        className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#FFBE91] text-[#1A1A2E] text-[9px] font-bold rounded-full flex items-center justify-center px-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </motion.button>

                  {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-40"
                          onClick={() => setIsNotificationsOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ type: "spring", damping: 25, stiffness: 300 }}
                          className="absolute right-0 mt-1 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50"
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between px-4 py-3 border-b border-[#EEECE6]">
                            <h3 className="text-sm font-semibold text-[#1A1A2E]">Notifications</h3>
                            <div className="flex items-center gap-2">
                              {unreadCount > 0 && (
                                <button
                                  onClick={markAllAsRead}
                                  className="text-[10px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors"
                                >
                                  Mark all read
                                </button>
                              )}
                              <button
                                onClick={() => setIsNotificationsOpen(false)}
                                className="p-0.5 hover:bg-[#F5F3EF] rounded-full transition-colors"
                              >
                                <X size={14} className="text-[#A0A0B0]" />
                              </button>
                            </div>
                          </div>

                          {/* Notification List */}
                          <div className="max-h-72 overflow-y-auto">
                            {notificationsLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="w-5 h-5 border-2 border-[#FFBE91] border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : notifications.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-8 px-4">
                                <Bell size={24} className="text-[#A0A0B0] mb-2" />
                                <p className="text-sm text-[#A0A0B0]">No notifications</p>
                                <p className="text-[10px] text-[#A0A0B0]">You're all caught up!</p>
                              </div>
                            ) : (
                              notifications.map((notification) => (
                                <motion.div
                                  key={notification.id}
                                  whileHover={{ x: 4 }}
                                  onClick={() => {
                                    if (!notification.read) {
                                      markAsRead(notification.id);
                                    }
                                  }}
                                  className={`flex items-start gap-3 px-4 py-3 hover:bg-[#F8F6F0] transition-colors cursor-pointer ${
                                    !notification.read ? 'bg-[#FFFCE1]' : ''
                                  } border-b border-[#EEECE6] last:border-0`}
                                >
                                  <div className="flex-shrink-0 mt-0.5">
                                    {getNotificationIcon(notification.type || notification.icon)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-[#1A1A2E]">
                                      {notification.title}
                                    </p>
                                    <p className="text-[10px] text-[#A0A0B0]">
                                      {notification.description}
                                    </p>
                                    <p className="text-[9px] text-[#A0A0B0] mt-0.5">
                                      {notification.time || 'Just now'}
                                    </p>
                                  </div>
                                  {!notification.read && (
                                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#FFBE91] mt-1.5" />
                                  )}
                                </motion.div>
                              ))
                            )}
                          </div>

                          {/* Footer */}
                          {notifications.length > 0 && (
                            <div className="px-4 py-2 border-t border-[#EEECE6] text-center">
                              <button
                                onClick={() => {
                                  setIsNotificationsOpen(false);
                                }}
                                className="text-[10px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors"
                              >
                                View all notifications
                              </button>
                            </div>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Settings Button - Icon Only */}
              {showSettings && (
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: [0, 5, -5, 0] }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSettingsClick}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-all duration-300 relative"
                  title="Settings (Coming Soon)"
                >
                  <Settings size={15} className="text-[#5A4A42] hover:text-[#1A1A2E] transition-colors duration-300" />
                </motion.button>
              )}

              {/* Profile Button */}
              {showProfile && (
                <Link to={profileButton.path || "/profile"}>
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/40 backdrop-blur-sm border border-[#FFDDB0]/20 text-[#1A1A2E] text-[11px] font-medium hover:bg-white/60 hover:shadow-md transition-all duration-300"
                  >
                    <IconComponent name={profileButton.icon || "User"} size={12} className="text-[#5A4A42]" />
                    <span>{profileButton.label || "Profile"}</span>
                  </motion.button>
                </Link>
              )}

              {/* Logout Button */}
              {showLogout && (
                <motion.button 
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/30 backdrop-blur-sm border border-[#FFDDB0]/15 text-[#1A1A2E] text-[11px] font-medium hover:bg-white/50 hover:shadow-lg transition-all duration-300"
                >
                  <IconComponent name={logoutButton.icon || "LogOut"} size={12} className="text-[#5A4A42]" />
                  <span>{logoutButton.label || "Logout"}</span>
                </motion.button>
              )}

              {/* Mobile Menu Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1.5 rounded-full hover:bg-white/20 transition-colors duration-300"
              >
                {isMobileMenuOpen ? <X size={18} className="text-[#1A1A2E]" /> : <Menu size={18} className="text-[#1A1A2E]" />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <motion.div 
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-64 bg-white/95 backdrop-blur-xl shadow-2xl p-5 pt-14 border-l border-[#FFDDB0]/20"
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path}>
                      <motion.div
                        whileHover={{ x: 6, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-sm ${
                          isActive
                            ? "bg-gradient-to-r from-[#FFBE91] to-[#FFDDB0] text-[#1A1A2E] shadow-lg shadow-[#FFBE91]/20"
                            : "text-[#5A4A42] hover:bg-[#F8F6F0] hover:text-[#1A1A2E]"
                        }`}
                      >
                        <IconComponent name={item.icon} size={16} />
                        <span className="font-medium">{item.name}</span>
                        {isActive && (
                          <motion.div 
                            layoutId="mobile-active"
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1A1A2E]"
                          />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}

                {/* Mobile Settings */}
                {showSettings && (
                  <motion.div
                    whileHover={{ x: 6, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSettingsClick}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-sm cursor-pointer text-[#5A4A42] hover:bg-[#F8F6F0] hover:text-[#1A1A2E]"
                  >
                    <IconComponent name={settingsButton.icon || "Settings"} size={16} />
                    <span className="font-medium">{settingsButton.label || "Settings"}</span>
                    <span className="ml-auto text-[8px] bg-[#FFBE91]/20 text-[#FFBE91] px-1.5 py-0.5 rounded-full font-medium">
                      Soon
                    </span>
                  </motion.div>
                )}
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="border-t border-[#EEECE6] pt-4 pb-4 space-y-2"
              >
                {showProfile && (
                  <Link to={profileButton.path || "/profile"}>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F8F6F0] border border-[#EEECE6] text-[#1A1A2E] text-sm font-medium hover:bg-[#EEECE6] transition-all duration-300"
                    >
                      <IconComponent name={profileButton.icon || "User"} size={15} />
                      <span>{profileButton.label || "Profile"}</span>
                    </motion.button>
                  </Link>
                )}
                {showLogout && (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1A2E] text-white text-sm font-medium shadow-lg shadow-[#1A1A2E]/10 hover:shadow-xl transition-all duration-300"
                  >
                    <IconComponent name={logoutButton.icon || "LogOut"} size={15} />
                    <span>{logoutButton.label || "Logout"}</span>
                  </motion.button>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="h-10 lg:h-11" />
    </>
  );
};

export default ModernNavbar;