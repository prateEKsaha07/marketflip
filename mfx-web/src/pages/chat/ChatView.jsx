import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Send,
  Lock,
  Unlock,
  Store,
  User,
  Loader2,
  CheckCircle,
  Clock,
  Package,
  DollarSign,
  Image as ImageIcon,
  Sparkles,
  ChevronDown,
  MessageCircle,
  Lock as LockIcon,
  Unlock as UnlockIcon
} from 'lucide-react';
import api from '../../api/client';
import { useChat } from '../../hooks/useChat';

const ChatView = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { newMessage: realtimeMessage, isSubscribed } = useChat(conversationId);
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showProductDetails, setShowProductDetails] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    fetchConversationAndMessages();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle realtime messages
  useEffect(() => {
    if (realtimeMessage) {
      setMessages(prev => [...prev, realtimeMessage]);
    }
  }, [realtimeMessage]);

  const fetchConversationAndMessages = async () => {
    setLoading(true);
    setError('');
    try {
      // Get conversations list to find this one
      const convResponse = await api.get('/chat/conversations');
      const conv = convResponse.data.find(c => c.id === conversationId);
      setConversation(conv);

      // Get messages
      const msgResponse = await api.get(`/chat/conversations/${conversationId}/messages`);
      console.log('Messages received:', msgResponse.data);
      setMessages(msgResponse.data || []);
    } catch (err) {
      console.error('Fetch chat error:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || conversation?.locked) return;

    setSending(true);
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
        content: newMessage.trim()
      });
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (err) {
      console.error('Send message error:', err);
      setError(err.response?.data?.detail || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getOtherParty = () => {
    if (!conversation) return { name: 'User', role: '' };
    const isBuyer = user?.role === 'buyer';
    return {
      name: isBuyer ? conversation.shop_name : conversation.buyer_name,
      role: isBuyer ? 'Shop' : 'Buyer',
      isBuyer: isBuyer
    };
  };

  // ====== FIX: Properly check if the current user owns the message ======
  const isOwner = (message) => {
    if (!message || !user) {
      console.log('isOwner: No message or user');
      return false;
    }
    
    const senderId = String(message.sender_id);
    const userId = String(user.id);
    const userIdAlt = String(user.user_id); // Alternative field name
    
    console.log('isOwner check:');
    console.log('  message.sender_id:', message.sender_id, 'type:', typeof message.sender_id);
    console.log('  user.id:', user.id, 'type:', typeof user.id);
    console.log('  user.user_id:', user.user_id, 'type:', typeof user.user_id);
    console.log('  Match (id):', senderId === userId);
    console.log('  Match (user_id):', senderId === userIdAlt);
    
    // Try both possible ID fields
    return senderId === userId || senderId === userIdAlt;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#FFBE91]" />
          <p className="text-xs text-[#A0A0B0]">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F0] p-4">
        <div className="bg-white rounded-xl border border-[#EEECE6] p-8 text-center shadow-sm">
          <p className="text-[#4A4A5A]">Conversation not found</p>
          <Button
            onClick={() => navigate(user?.role === 'shop_owner' ? '/shop/chat' : '/buyer/chat')}
            className="mt-4 bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] text-sm"
          >
            Back to Chats
          </Button>
        </div>
      </div>
    );
  }

  const otherParty = getOtherParty();
  const isLocked = conversation.locked;
  const backPath = user?.role === 'shop_owner' ? '/shop/chat' : '/buyer/chat';
  const hasActiveProduct = conversation.active_item_name;

  return (
    <div className="min-h-screen bg-[#F8F6F0] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#EEECE6] sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate(backPath)}
              variant="ghost"
              className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-2 py-1.5 h-auto flex-shrink-0"
            >
              <ArrowLeft size={18} />
            </Button>
            
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isLocked ? 'bg-gray-100' : 'bg-[#FFBE91]/20'}`}>
              {user?.role === 'buyer' ? (
                <Store size={18} className={isLocked ? 'text-gray-400' : 'text-[#FFBE91]'} />
              ) : (
                <User size={18} className={isLocked ? 'text-gray-400' : 'text-[#FFBE91]'} />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[#1A1A2E] truncate">
                  {otherParty.name || 'User'}
                </p>
                <span className="text-[10px] text-[#A0A0B0] bg-[#F8F6F0] px-1.5 py-0.5 rounded-full flex-shrink-0">
                  {otherParty.role}
                </span>
                <div className={`flex items-center gap-1 text-[10px] ${isLocked ? 'text-amber-500' : 'text-emerald-500'} flex-shrink-0`}>
                  {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                </div>
              </div>
              {hasActiveProduct && (
                <button
                  onClick={() => setShowProductDetails(!showProductDetails)}
                  className="text-[10px] text-blue-600 truncate flex items-center gap-1 hover:underline focus:outline-none"
                >
                  <Package size={10} />
                  {conversation.active_item_name}
                  {conversation.active_item_price && ` · ₹${conversation.active_item_price}`}
                  <ChevronDown size={12} className={`transition-transform ${showProductDetails ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
            
            {isLocked && (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200 flex-shrink-0">
                Read-only
              </span>
            )}
          </div>

          {/* Pinned Product Details (Expandable) */}
          <AnimatePresence>
            {showProductDetails && hasActiveProduct && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 pt-3 border-t border-[#EEECE6]"
              >
                <div className="bg-[#F8F6F0] rounded-xl p-3 flex items-center gap-3">
                  {conversation.active_item_image ? (
                    <img
                      src={conversation.active_item_image}
                      alt={conversation.active_item_name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#FFBE91]/20 flex items-center justify-center">
                      <Package size={20} className="text-[#FFBE91]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1A1A2E] text-sm truncate">
                      {conversation.active_item_name}
                    </p>
                    {conversation.active_item_price && (
                      <p className="text-xs text-emerald-600 font-medium">
                        ₹{conversation.active_item_price.toLocaleString()}
                      </p>
                    )}
                    <p className="text-[10px] text-[#A0A0B0]">
                      {conversation.active_source_type === 'request' ? 'Request' : 'Auction'}
                      {isLocked ? ' (Completed)' : ' (Active)'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full"
      >
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#FFBE91]/20 flex items-center justify-center mx-auto mb-3">
                <MessageCircle size={24} className="text-[#FFBE91]" />
              </div>
              <p className="text-[#4A4A5A] text-sm">No messages yet</p>
              {!isLocked && (
                <p className="text-xs text-[#A0A0B0] mt-1">Start the conversation!</p>
              )}
              {isLocked && (
                <p className="text-xs text-amber-600 mt-1">This conversation is locked</p>
              )}
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const showDate = index === 0 || formatDate(msg.created_at) !== formatDate(messages[index - 1].created_at);
                const owned = isOwner(msg);
                
                // Debug log for each message
                console.log(`Message ${index}: sender_id=${msg.sender_id}, owned=${owned}`);
                
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center my-3">
                        <span className="text-[10px] text-[#A0A0B0] bg-white px-3 py-1 rounded-full border border-[#EEECE6] shadow-sm">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                    )}
                    {/* Messages align to right for owner, left for others */}
                    <div className={`flex ${owned ? 'justify-end' : 'justify-start'} mb-1`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        owned 
                          ? 'bg-[#FFBE91] text-[#1A1A2E]' 
                          : 'bg-white border border-[#EEECE6] text-[#1A1A2E] shadow-sm'
                      }`}>
                        <p className="text-sm break-words">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-0.5 ${owned ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[9px] opacity-70">{formatTime(msg.created_at)}</span>
                          {owned && (
                            <span className="text-[9px]">
                              {msg.is_read ? (
                                <CheckCircle size={10} className="text-emerald-500" />
                              ) : (
                                <Clock size={10} className="text-[#A0A0B0]" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input */}
      <div className={`bg-white border-t border-[#EEECE6] p-4 ${isLocked ? 'opacity-60' : ''}`}>
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isLocked ? 'Conversation is locked' : 'Type a message...'}
              disabled={isLocked || sending}
              className="flex-1 px-4 py-2.5 text-sm bg-[#F8F6F0] border-2 border-[#EEECE6] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all disabled:opacity-50"
              maxLength={2000}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || isLocked || sending}
              className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white px-4 py-2.5 h-auto flex items-center gap-1.5 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </Button>
          </form>
          <p className="text-[9px] text-[#A0A0B0] mt-1.5 text-center flex items-center justify-center gap-1">
            {isLocked ? (
              <>
                <LockIcon size={10} className="text-amber-500" />
                This conversation is locked. It will unlock when you start a new transaction.
              </>
            ) : (
              <>
                <UnlockIcon size={10} className="text-emerald-500" />
                Messages are private between you and {otherParty.name}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatView;