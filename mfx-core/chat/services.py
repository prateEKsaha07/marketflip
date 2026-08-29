from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ChatService:
    def __init__(self, supabase_admin: Client, supabase_anon: Client):
        self.supabase_admin = supabase_admin
        self.supabase_anon = supabase_anon
    
    def get_or_create_conversation(
        self, 
        buyer_id: str, 
        shop_id: str
    ) -> Dict[str, Any]:
        """
        Get or create a conversation pair.
        Returns the conversation object.
        """
        try:
            print(f"\n{'='*50}")
            print(f"🔍 GET_OR_CREATE_CONVERSATION CALLED")
            print(f"   Buyer ID: {buyer_id}")
            print(f"   Shop ID: {shop_id}")
            print(f"{'='*50}\n")
            
            # Check if conversation exists
            print("1. Checking if conversation exists...")
            response = self.supabase_admin.table("conversations") \
                .select("*") \
                .eq("buyer_id", buyer_id) \
                .eq("shop_id", shop_id) \
                .execute()
            
            print(f"   Response data: {response.data}")
            
            if response.data:
                conv = response.data[0]
                print(f"   ✅ Found existing conversation: {conv['id']}")
                print(f"   Current state: locked={conv.get('locked', 'N/A')}, active_source_type={conv.get('active_source_type', 'N/A')}")
                logger.info(f"Found existing conversation: {conv['id']}")
                return conv
            
            # Create new conversation
            print("2. No conversation found. Creating new one...")
            data = {
                "buyer_id": buyer_id,
                "shop_id": shop_id,
                "locked": True
            }
            print(f"   Insert data: {data}")
            
            result = self.supabase_admin.table("conversations") \
                .insert(data) \
                .execute()
            
            print(f"   Result: {result.data}")
            
            if not result.data:
                raise Exception("Failed to create conversation")
            
            conv = result.data[0]
            print(f"   ✅ Created new conversation: {conv['id']}")
            logger.info(f"Created new conversation: {conv['id']}")
            return conv
            
        except Exception as e:
            print(f"❌ Error in get_or_create_conversation: {e}")
            import traceback
            traceback.print_exc()
            logger.error(f"Error getting/creating conversation: {str(e)}")
            raise
    
    def unlock_conversation(
        self,
        conversation_id: str,
        source_type: str,
        source_id: str
    ) -> Dict[str, Any]:
        """
        Unlock a conversation and set active source.
        """
        try:
            print(f"\n{'='*50}")
            print(f"🔓 UNLOCK_CONVERSATION CALLED")
            print(f"   Conversation ID: {conversation_id}")
            print(f"   Source Type: {source_type}")
            print(f"   Source ID: {source_id}")
            print(f"{'='*50}\n")
            
            # Update conversation
            update_data = {
                "locked": False,
                "active_source_type": source_type,
                "active_source_id": source_id,
                "updated_at": datetime.utcnow().isoformat()
            }
            print(f"   Update data: {update_data}")
            
            response = self.supabase_admin.table("conversations") \
                .update(update_data) \
                .eq("id", conversation_id) \
                .execute()
            
            print(f"   Response: {response.data}")
            
            if not response.data:
                raise Exception("Failed to unlock conversation")
            
            conv = response.data[0]
            print(f"   ✅ Unlocked conversation {conversation_id}")
            print(f"   New state: locked={conv.get('locked', 'N/A')}, active_source_type={conv.get('active_source_type', 'N/A')}")
            
            logger.info(f"Unlocked conversation {conversation_id} with source {source_type}/{source_id}")
            return conv
            
        except Exception as e:
            print(f"❌ Error unlocking conversation: {e}")
            import traceback
            traceback.print_exc()
            logger.error(f"Error unlocking conversation: {str(e)}")
            raise
    
    def lock_conversation(self, conversation_id: str) -> Dict[str, Any]:
        """
        Lock a conversation after transaction completion.
        Keeps the active_source fields for reference.
        """
        try:
            print(f"\n{'='*50}")
            print(f"🔒 LOCK_CONVERSATION CALLED")
            print(f"   Conversation ID: {conversation_id}")
            print(f"{'='*50}\n")
            
            response = self.supabase_admin.table("conversations") \
                .update({
                    "locked": True,
                    "updated_at": datetime.utcnow().isoformat()
                }) \
                .eq("id", conversation_id) \
                .execute()
            
            if not response.data:
                raise Exception("Failed to lock conversation")
            
            conv = response.data[0]
            print(f"   ✅ Locked conversation {conversation_id}")
            
            logger.info(f"Locked conversation {conversation_id}")
            return conv
            
        except Exception as e:
            print(f"❌ Error locking conversation: {e}")
            import traceback
            traceback.print_exc()
            logger.error(f"Error locking conversation: {str(e)}")
            raise
    
    def send_message(
        self,
        conversation_id: str,
        sender_id: str,
        content: str
    ) -> Dict[str, Any]:
        """
        Send a message in a conversation.
        """
        try:
            print(f"\n{'='*50}")
            print(f"💬 SEND_MESSAGE CALLED")
            print(f"   Conversation ID: {conversation_id}")
            print(f"   Sender ID: {sender_id}")
            print(f"   Content: {content[:50]}...")
            print(f"{'='*50}\n")
            
            # Check if conversation is locked
            conv_response = self.supabase_admin.table("conversations") \
                .select("locked") \
                .eq("id", conversation_id) \
                .execute()
            
            if not conv_response.data:
                raise ValueError("Conversation not found")
            
            if conv_response.data[0].get("locked", True):
                raise ValueError("Conversation is locked")
            
            # Insert message
            data = {
                "conversation_id": conversation_id,
                "sender_id": sender_id,
                "content": content,
                "is_read": False
            }
            
            response = self.supabase_admin.table("messages") \
                .insert(data) \
                .execute()
            
            if not response.data:
                raise Exception("Failed to send message")
            
            # Update conversation updated_at
            self.supabase_admin.table("conversations") \
                .update({"updated_at": datetime.utcnow().isoformat()}) \
                .eq("id", conversation_id) \
                .execute()
            
            logger.info(f"Message sent in conversation {conversation_id}")
            return response.data[0]
            
        except Exception as e:
            print(f"❌ Error sending message: {e}")
            import traceback
            traceback.print_exc()
            logger.error(f"Error sending message: {str(e)}")
            raise
    
    def get_conversations_for_user(
        self,
        user_id: str,
        role: str
    ) -> List[Dict[str, Any]]:
        """
        Get all conversations for a user with enriched data.
        """
        try:
            print(f"\n{'='*50}")
            print(f"📋 GET_CONVERSATIONS_FOR_USER")
            print(f"   User ID: {user_id}")
            print(f"   Role: {role}")
            print(f"{'='*50}\n")
            
            # Build query based on role
            if role == "buyer":
                field = "buyer_id"
            else:
                field = "shop_id"
            
            print(f"   Querying by field: {field}")
            
            response = self.supabase_admin.table("conversations") \
                .select("*") \
                .eq(field, user_id) \
                .order("updated_at", desc=True) \
                .execute()
            
            conversations = response.data if response.data else []
            print(f"   Found {len(conversations)} conversations")
            
            # Enrich with additional data
            for conv in conversations:
                # Get other party name
                if role == "buyer":
                    other_id = conv.get("shop_id")
                    profile_response = self.supabase_admin.table("profiles") \
                        .select("shop_name") \
                        .eq("id", other_id) \
                        .execute()
                    if profile_response.data:
                        conv["shop_name"] = profile_response.data[0].get("shop_name")
                else:
                    other_id = conv.get("buyer_id")
                    profile_response = self.supabase_admin.table("profiles") \
                        .select("full_name") \
                        .eq("id", other_id) \
                        .execute()
                    if profile_response.data:
                        conv["buyer_name"] = profile_response.data[0].get("full_name")
                
                # Get last message
                msg_response = self.supabase_admin.table("messages") \
                    .select("content, created_at") \
                    .eq("conversation_id", conv["id"]) \
                    .order("created_at", desc=True) \
                    .limit(1) \
                    .execute()
                
                if msg_response.data:
                    conv["last_message"] = msg_response.data[0].get("content")
                    conv["last_message_at"] = msg_response.data[0].get("created_at")
                
                # Get unread count (messages not sent by current user)
                unread_response = self.supabase_admin.table("messages") \
                    .select("id", count="exact") \
                    .eq("conversation_id", conv["id"]) \
                    .eq("is_read", False) \
                    .neq("sender_id", user_id) \
                    .execute()
                
                conv["unread_count"] = len(unread_response.data) if unread_response.data else 0
                
                # Get active source details
                if conv.get("active_source_id") and conv.get("active_source_type"):
                    source_type = conv["active_source_type"]
                    source_id = conv["active_source_id"]
                    
                    if source_type == "request":
                        src_response = self.supabase_admin.table("requests") \
                            .select("item_name, budget_min, budget_max, image_urls") \
                            .eq("id", source_id) \
                            .execute()
                    else:
                        src_response = self.supabase_admin.table("auctions") \
                            .select("item_name, starting_price, image_urls") \
                            .eq("id", source_id) \
                            .execute()
                    
                    if src_response.data:
                        conv["active_item_name"] = src_response.data[0].get("item_name")
                        if source_type == "request":
                            conv["active_item_price"] = src_response.data[0].get("budget_max")
                        else:
                            conv["active_item_price"] = src_response.data[0].get("starting_price")
                        
                        images = src_response.data[0].get("image_urls")
                        if images and isinstance(images, list) and len(images) > 0:
                            conv["active_item_image"] = images[0]
            
            return conversations
            
        except Exception as e:
            print(f"❌ Error getting conversations: {e}")
            import traceback
            traceback.print_exc()
            logger.error(f"Error getting conversations: {str(e)}")
            raise
    
    def get_messages(
        self,
        conversation_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get messages for a conversation.
        """
        try:
            response = self.supabase_admin.table("messages") \
                .select("*") \
                .eq("conversation_id", conversation_id) \
                .order("created_at", desc=True) \
                .range(offset, offset + limit - 1) \
                .execute()
            
            messages = response.data if response.data else []
            
            # Reverse to get chronological order
            messages.reverse()
            
            # Enrich with sender names
            for msg in messages:
                sender_response = self.supabase_admin.table("profiles") \
                    .select("full_name, role") \
                    .eq("id", msg["sender_id"]) \
                    .execute()
                
                if sender_response.data:
                    msg["sender_name"] = sender_response.data[0].get("full_name")
                    msg["sender_role"] = sender_response.data[0].get("role")
            
            return messages
            
        except Exception as e:
            logger.error(f"Error getting messages: {str(e)}")
            raise
    
    def mark_messages_read(
        self,
        conversation_id: str,
        user_id: str
    ) -> int:
        """
        Mark all messages in a conversation as read for a user.
        Returns the number of messages marked as read.
        """
        try:
            response = self.supabase_admin.table("messages") \
                .update({
                    "is_read": True,
                    "read_at": datetime.utcnow().isoformat()
                }) \
                .eq("conversation_id", conversation_id) \
                .neq("sender_id", user_id) \
                .eq("is_read", False) \
                .execute()
            
            count = len(response.data) if response.data else 0
            if count > 0:
                logger.info(f"Marked {count} messages as read in conversation {conversation_id}")
            
            return count
            
        except Exception as e:
            logger.error(f"Error marking messages read: {str(e)}")
            raise
    
    def get_unread_count(self, user_id: str, role: str) -> int:
        """
        Get total unread message count for a user across all conversations.
        """
        try:
            conversations = self.get_conversations_for_user(user_id, role)
            total_unread = sum(conv.get("unread_count", 0) for conv in conversations)
            return total_unread
            
        except Exception as e:
            logger.error(f"Error getting unread count: {str(e)}")
            return 0