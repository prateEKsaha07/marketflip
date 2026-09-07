// components/ui/ModernNavbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Menu,
  X,
  User,
  LogOut,
  Bell,
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
  Settings,
  Users
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
  Home: Home,
  Info: Info,
  Mail: Mail,
  Package: Package,
  ShoppingBag: ShoppingBag,
  TrendingUp: TrendingUp,
  Settings: Settings,
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
    height: "h-5"
  },
  
  // Toggle buttons
  showProfile = true,
  showLogout = true,
  showNotifications = true,
  
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const currentIndex = navItems.findIndex((item) => location.pathname === item.path);
  const activeIndex = hoveredIndex !== null ? hoveredIndex : currentIndex;

  // Handle logout
  const handleLogout = () => {
    if (logoutButton.onClick) {
      logoutButton.onClick();
    }
  };

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-white/80 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-white/20"
            : "bg-transparent"
        } ${className}`}
      >
        <div className={`max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 ${containerClassName}`}>
          <div className="flex items-center justify-between h-12 lg:h-14">
            {/* Logo */}
            <Link 
              to={logo.link || "/"} 
              className="flex items-center gap-1.5 shrink-0 group"
            >
              <motion.img 
                src={logo.src} 
                alt={logo.alt || brandName} 
                className={`${logo.height || 'h-5'} w-auto object-contain transition-transform duration-300 group-hover:scale-105`}
                whileHover={{ rotate: [-1, 1, -1, 0], transition: { duration: 0.5 } }}
              />
            </Link>

            {/* Desktop Navigation */}
            <div 
              className="hidden md:flex items-center bg-[#F8F6F0]/40 backdrop-blur-sm p-0.5 rounded-full relative"
              style={{ height: '32px' }}
            >
              {/* Rolling Pill */}
              <motion.div
                className="absolute bg-white/90 backdrop-blur-sm rounded-full shadow-lg shadow-black/5 border border-white/50"
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
                    className="relative z-10"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <motion.div
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-300 text-center flex items-center justify-center gap-1.5 cursor-pointer relative ${
                        isActiveOrHovered
                          ? "text-[#1A1A2E]"
                          : "text-[#A0A0B0] hover:text-[#1A1A2E]"
                      }`}
                      whileHover={{ 
                        scale: 1.05,
                        transition: { type: "spring", stiffness: 400, damping: 25 }
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.span
                        animate={{
                          scale: isActiveOrHovered ? 1 : 0.9,
                          rotate: isActiveOrHovered ? [0, 5, -5, 0] : 0,
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <IconComponent 
                          name={item.icon} 
                          size={13}
                          className={`transition-all duration-300 ${
                            isActiveOrHovered ? "text-[#FFBE91]" : "text-[#A0A0B0]"
                          }`}
                        />
                      </motion.span>
                      <span className="relative">
                        {item.name}
                        {!isActive && (
                          <motion.span
                            className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] bg-gradient-to-r from-[#FFBE91] to-[#FFDDB0] rounded-full"
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ 
                              scaleX: isHovered ? 1 : 0,
                              opacity: isHovered ? 1 : 0
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          />
                        )}
                      </span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Right Side Actions - Toggleable */}
            <div className="flex items-center gap-1.5">
              {/* Notification Bell - Toggleable */}
              {showNotifications && (
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: [0, 5, -5, 0] }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-full hover:bg-white/50 transition-all duration-300 relative"
                >
                  <Bell size={15} className="text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors duration-300" />
                  {notificationButton.showBadge && (
                    <motion.span 
                      className={`absolute top-1 right-1 w-1.5 h-1.5 ${notificationButton.badgeColor || 'bg-[#FFBE91]'} rounded-full`}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.button>
              )}

              {/* Profile Button - Toggleable */}
              {showProfile && (
                <Link to={profileButton.path || "/profile"}>
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-white/50 text-[#1A1A2E] text-[11px] font-medium hover:bg-white/90 hover:shadow-md transition-all duration-300"
                  >
                    <IconComponent name={profileButton.icon || "User"} size={12} />
                    <span>{profileButton.label || "Profile"}</span>
                  </motion.button>
                </Link>
              )}

              {/* Logout Button - Toggleable */}
              {showLogout && (
                <motion.button 
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A1A2E]/90 backdrop-blur-sm text-white text-[11px] font-medium hover:bg-[#1A1A2E] hover:shadow-lg transition-all duration-300 shadow-md shadow-[#1A1A2E]/10"
                >
                  <IconComponent name={logoutButton.icon || "LogOut"} size={12} />
                  <span>{logoutButton.label || "Logout"}</span>
                </motion.button>
              )}

              {/* Mobile Menu Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1.5 rounded-full hover:bg-white/50 transition-colors duration-300"
              >
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
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
            className="absolute right-0 top-0 h-full w-64 bg-white/95 backdrop-blur-xl shadow-2xl p-5 pt-14"
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
                            : "text-[#A0A0B0] hover:bg-[#F8F6F0] hover:text-[#1A1A2E]"
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

      <div className="h-12 lg:h-14" />
    </>
  );
};

export default ModernNavbar;