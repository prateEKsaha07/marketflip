import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  XCircle, 
  MessageCircle, 
  Award,
  Truck,
  Package,
  Gavel,
  AlertCircle,
  Check,
  ChevronRight,
  Loader2
} from 'lucide-react';
import api from '../api/client';

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Click outside handler
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'delivery_confirmed': return <Truck size={16} className="text-blue-500" />;
      case 'delivery_denied': return <XCircle size={16} className="text-rose-500" />;
      case 'bid_selected': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'outbid': return <AlertCircle size={16} className="text-amber-500" />;
      case 'auction_won': return <Award size={16} className="text-amber-500" />;
      case 'auction_sold': return <Gavel size={16} className="text-blue-500" />;
      case 'new_chat_message': return <MessageCircle size={16} className="text-[#FFBE91]" />;
      case 'transaction_completed': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'delivery_method_set': return <Package size={16} className="text-blue-500" />;
      case 'switched_to_pickup': return <Truck size={16} className="text-blue-500" />;
      case 'override_completed': return <CheckCircle size={16} className="text-amber-500" />;
      default: return <Bell size={16} className="text-[#A0A0B0]" />;
    }
  };

  const getNotificationColor = (type) => {
    const colors = {
      delivery_confirmed: 'border-l-blue-500',
      delivery_denied: 'border-l-rose-500',
      bid_selected: 'border-l-emerald-500',
      outbid: 'border-l-amber-500',
      auction_won: 'border-l-amber-500',
      auction_sold: 'border-l-blue-500',
      new_chat_message: 'border-l-[#FFBE91]',
      transaction_completed: 'border-l-emerald-500',
      delivery_method_set: 'border-l-blue-500',
      switched_to_pickup: 'border-l-blue-500',
      override_completed: 'border-l-amber-500',
    };
    return colors[type] || 'border-l-gray-400';
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const formatTime = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getRole = () => {
    return localStorage.getItem('role') || 'buyer';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-[#F5F3EF] transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#FFBE91] text-[#1A1A2E] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-[#EEECE6] overflow-hidden z-50 max-h-[500px] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#EEECE6]">
              <h3 className="text-sm font-semibold text-[#1A1A2E]">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors flex items-center gap-1"
                >
                  <Check size={12} />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 size={24} className="animate-spin text-[#1A1A2E] mx-auto" />
                  <p className="text-xs text-[#A0A0B0] mt-2">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={32} className="text-[#A0A0B0] mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-[#A0A0B0]">No notifications yet</p>
                  <p className="text-xs text-[#A0A0B0]">We'll notify you when something happens</p>
                </div>
              ) : (
                <div className="divide-y divide-[#EEECE6]">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-[#F8F6F0] transition-colors cursor-pointer border-l-3 ${getNotificationColor(notification.type)} ${!notification.read ? 'bg-[#FFFCE1]' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1A1A2E]">
                            {notification.title}
                          </p>
                          <p className="text-xs text-[#A0A0B0] mt-0.5 line-clamp-2">
                            {notification.body}
                          </p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-[#A0A0B0]">
                              {formatTime(notification.created_at)}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-[#FFBE91]" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-[#EEECE6] text-center">
              <button
                onClick={() => {
                  const role = getRole();
                  navigate(role === 'buyer' ? '/buyer/notifications' : '/shop/notifications');
                  setIsOpen(false);
                }}
                className="text-xs text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors flex items-center justify-center gap-1 w-full py-1"
              >
                View all notifications
                <ChevronRight size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;