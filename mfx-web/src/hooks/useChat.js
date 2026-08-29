import { useEffect, useState } from 'react';
import { useAuth, supabase } from '../context/AuthContext';

export const useChat = (conversationId) => {
  const [newMessage, setNewMessage] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // If no conversation ID, user, or supabase client, don't subscribe
    if (!conversationId || !user || !supabase) {
      return;
    }

    console.log(`Subscribing to conversation: ${conversationId}`);

    // Create a channel for this conversation
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          // Only add messages sent by other users (not the current user)
          // Own messages are already added via the API
          if (payload.new.sender_id !== user.id) {
            console.log('New message received via realtime:', payload.new);
            setNewMessage(payload.new);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true);
          console.log(`Successfully subscribed to conversation: ${conversationId}`);
        } else {
          console.log(`Subscription status for ${conversationId}: ${status}`);
        }
      });

    // Cleanup on unmount or conversation change
    return () => {
      console.log(`Unsubscribing from conversation: ${conversationId}`);
      supabase.removeChannel(channel);
      setIsSubscribed(false);
      setNewMessage(null);
    };
  }, [conversationId, user]);

  return { newMessage, isSubscribed };
};

export default useChat;