import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  MessageCircle,
  Lock,
  Unlock,
  Store,
  User,
  Loader2,
  RefreshCw,
  Package,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import api from '../../api/client';

const ChatList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/chat/conversations');
      console.log('Conversations response:', response.data);
      setConversations(response.data || []);
    } catch (err) {
      console.error('Fetch conversations error:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const getOtherParty = (conv) => {
    const isBuyer = user?.role === 'buyer';
    return {
      name: isBuyer ? conv.shop_name : conv.buyer_name,
      role: isBuyer ? 'Shop' : 'Buyer',
      id: isBuyer ? conv.shop_id : conv.buyer_id,
      isBuyer: isBuyer
    };
  };

  // ====== FIX: Get the correct chat path based on role ======
  const getChatPath = (conversationId) => {
    return user?.role === 'buyer' 
      ? `/buyer/chat/${conversationId}` 
      : `/shop/chat/${conversationId}`;
  };

  const getStatusColor = (locked) => {
    return locked ? 'text-amber-500' : 'text-emerald-500';
  };

  const getStatusBg = (locked) => {
    return locked ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200';
  };

  const backPath = user?.role === 'shop_owner' ? '/shop/dashboard' : '/buyer/dashboard';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#FFBE91]" />
          <p className="text-xs text-[#A0A0B0]">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F0] p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate(backPath)}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
            >
              <ArrowLeft size={14} className="mr-1.5" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-[#1A1A2E] flex items-center gap-2">
              <MessageCircle size={20} className="text-[#FFBE91]" />
              Chats
            </h1>
          </div>
          <Button
            onClick={fetchConversations}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-1.5 h-auto"
          >
            <RefreshCw size={14} />
          </Button>
        </motion.div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Chat List */}
        {conversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border border-[#EEECE6] p-12 text-center shadow-sm"
          >
            <MessageCircle size={48} className="mx-auto text-[#A0A0B0] mb-3" />
            <p className="text-[#4A4A5A]">No conversations yet.</p>
            <p className="text-xs text-[#A0A0B0] mt-1">
              {user?.role === 'buyer' 
                ? 'Chats will appear when you select a bid or win an auction.' 
                : 'Chats will appear when your bids are selected or auctions are won.'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv, index) => {
              const otherParty = getOtherParty(conv);
              const isLocked = conv.locked;
              const hasUnread = conv.unread_count > 0;
              
              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate(getChatPath(conv.id))}
                  className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer ${
                    isLocked ? 'border-[#EEECE6]' : 'border-[#FFBE91]/30'
                  } ${hasUnread ? 'bg-[#FFFCE1]/50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isLocked ? 'bg-gray-100' : 'bg-[#FFBE91]/20'
                    }`}>
                      {user?.role === 'buyer' ? (
                        <Store size={20} className={isLocked ? 'text-gray-400' : 'text-[#FFBE91]'} />
                      ) : (
                        <User size={20} className={isLocked ? 'text-gray-400' : 'text-[#FFBE91]'} />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold text-sm truncate ${isLocked ? 'text-[#4A4A5A]' : 'text-[#1A1A2E]'}`}>
                            {otherParty.name || 'User'}
                          </p>
                          <span className="text-[10px] text-[#A0A0B0] bg-[#F8F6F0] px-1.5 py-0.5 rounded-full">
                            {otherParty.role}
                          </span>
                          {conv.active_item_name && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full truncate max-w-[100px] flex items-center gap-1">
                              <Package size={10} />
                              {conv.active_item_name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {hasUnread && (
                            <span className="bg-[#FFBE91] text-[#1A1A2E] text-[9px] font-bold px-2 py-0.5 rounded-full min-w-[18px] text-center">
                              {conv.unread_count > 9 ? '9+' : conv.unread_count}
                            </span>
                          )}
                          <span className="text-[10px] text-[#A0A0B0]">
                            {formatTime(conv.last_message_at || conv.updated_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-xs truncate flex-1 ${hasUnread ? 'text-[#1A1A2E] font-medium' : 'text-[#A0A0B0]'}`}>
                          {conv.last_message || 'No messages yet'}
                        </p>
                        <div className={`flex items-center gap-1 text-[10px] ${getStatusColor(isLocked)} flex-shrink-0 ml-2 px-2 py-0.5 rounded-full ${getStatusBg(isLocked)}`}>
                          {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                          {isLocked ? 'Locked' : 'Active'}
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight size={16} className="text-[#A0A0B0] flex-shrink-0" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer Stats */}
        {conversations.length > 0 && (
          <div className="mt-4 text-center text-[10px] text-[#A0A0B0] flex items-center justify-center gap-4">
            <span>Total: {conversations.length}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Unlock size={10} className="text-emerald-500" />
              Active: {conversations.filter(c => !c.locked).length}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Lock size={10} className="text-amber-500" />
              Locked: {conversations.filter(c => c.locked).length}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MessageCircle size={10} className="text-[#FFBE91]" />
              Unread: {conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;