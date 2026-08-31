// supabase/functions/close-auctions/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Backend API URL - uses the deployed backend URL
const API_URL = Deno.env.get('MARKETFLIP_API_URL') || 'https://marketflip.onrender.com'

// ====== HELPER: Retry with exponential backoff ======
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 3) {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

// ====== HELPER: Warm up backend ======
async function warmUpBackend() {
  try {
    console.log('Warming up backend...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    await fetch(`${API_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('Backend warm-up complete');
  } catch (error) {
    console.log('Backend warm-up failed (continuing anyway):', error.message);
  }
}

// ====== HELPER: Direct chat unlock (fallback) ======
async function unlockChatDirectly(supabase: any, auction: any, winnerBuyerId: string) {
  try {
    console.log(`Attempting direct chat unlock for auction ${auction.id}`);
    
    // 1. Get or create conversation
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('buyer_id', winnerBuyerId)
      .eq('shop_id', auction.shop_id)
      .maybeSingle();

    let conversationId: string;
    
    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          buyer_id: winnerBuyerId,
          shop_id: auction.shop_id,
          locked: true
        })
        .select()
        .single();
      
      if (createError) throw createError;
      conversationId = newConversation.id;
    }

    // 2. Check if transaction already exists
    const { data: existingTx } = await supabase
      .from('conversation_active_transactions')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('source_type', 'auction')
      .eq('source_id', auction.id)
      .maybeSingle();

    if (!existingTx) {
      // 3. Insert active transaction
      await supabase
        .from('conversation_active_transactions')
        .insert({
          conversation_id: conversationId,
          source_type: 'auction',
          source_id: auction.id,
          item_name: auction.item_name,
          status: 'active'
        });
    }

    // 4. Unlock conversation
    await supabase
      .from('conversations')
      .update({ locked: false })
      .eq('id', conversationId);

    console.log(`Direct chat unlock successful for auction ${auction.id}`);
    return true;
  } catch (error) {
    console.error(`Direct chat unlock failed for auction ${auction.id}:`, error);
    return false;
  }
}

// ====== HELPER: Log auction close event ======
async function logAuctionCloseEvent(supabase: any, auctionId: string, status: string, error?: string) {
  try {
    // Check if table exists, if not, just log
    const { data: tableExists } = await supabase
      .from('auction_close_events')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    if (tableExists !== undefined) {
      await supabase
        .from('auction_close_events')
        .insert({
          auction_id: auctionId,
          status: status,
          error: error || null,
          processed_at: new Date().toISOString()
        });
    }
  } catch (logError) {
    // Table might not exist yet, just log
    console.log(`[Event Log] Auction ${auctionId}: ${status}${error ? ' - ' + error : ''}`);
  }
}

// ====== MAIN HANDLER ======
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('=== CLOSE-AUCTIONS EDGE FUNCTION STARTED ===')
    console.log(`API URL: ${API_URL}`)
    
    // Warm up backend (non-blocking)
    await warmUpBackend().catch(() => {})

    const now = new Date().toISOString()

    // Get auctions that have ended but are still active (limit to 50 per run)
    const { data: endedAuctions, error: fetchError } = await supabase
      .from('auctions')
      .select('*')
      .eq('status', 'active')
      .lt('end_time', now)
      .limit(50)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${endedAuctions?.length || 0} ended auctions to process`)

    let closedCount = 0
    let expiredCount = 0
    let soldCount = 0
    let reserveNotMetCount = 0
    let chatUnlockSuccessCount = 0
    let chatUnlockFallbackCount = 0
    let chatUnlockFailedCount = 0

    // Process auctions in batches with concurrency control
    const BATCH_SIZE = 5
    const endedAuctionsList = endedAuctions || []
    
    for (let i = 0; i < endedAuctionsList.length; i += BATCH_SIZE) {
      const batch = endedAuctionsList.slice(i, i + BATCH_SIZE)
      
      const batchPromises = batch.map(async (auction) => {
        try {
          console.log(`Processing auction: ${auction.id} - ${auction.item_name}`)

          // Get highest bid for this auction
          const { data: bids, error: bidError } = await supabase
            .from('auction_bids')
            .select('*')
            .eq('auction_id', auction.id)
            .order('bid_amount', { ascending: false })
            .limit(1)

          if (bidError) {
            console.error(`Error fetching bids for auction ${auction.id}:`, bidError)
            await logAuctionCloseEvent(supabase, auction.id, 'error', bidError.message)
            return
          }

          const highestBid = bids && bids.length > 0 ? bids[0] : null
          const highestBidAmount = highestBid ? highestBid.bid_amount : 0
          const reservePrice = auction.reserve_price || 0

          // Determine final status
          let finalStatus: string
          let updateData: any = {
            closed_at: now
          }

          if (!highestBid) {
            // No bids - expired
            finalStatus = 'expired'
            expiredCount++
            console.log(`Auction ${auction.id}: No bids -> expired`)
          } else if (reservePrice > 0 && highestBidAmount < reservePrice) {
            // Reserve not met - expired (not sold)
            finalStatus = 'expired'
            reserveNotMetCount++
            console.log(`Auction ${auction.id}: Highest bid ${highestBidAmount} < reserve ${reservePrice} -> expired (reserve not met)`)
          } else {
            // Reserve met (or no reserve) - sold
            finalStatus = 'sold'
            soldCount++
            updateData.winning_bid_id = highestBid.id
            updateData.current_highest_bid = highestBidAmount
            updateData.current_highest_bidder = highestBid.buyer_id
            console.log(`Auction ${auction.id}: Sold to ${highestBid.buyer_id} for ${highestBidAmount}`)

            // ====== UNLOCK CHAT (with retry + fallback) ======
            let chatUnlocked = false
            
            // Try backend API first (with retry)
            try {
              const response = await fetchWithRetry(
                `${API_URL}/auctions/${auction.id}/close-with-winner`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`
                  },
                  body: JSON.stringify({
                    winner_buyer_id: highestBid.buyer_id
                  })
                },
                2 // 2 retries (total 3 attempts)
              )

              if (response.ok) {
                chatUnlocked = true
                chatUnlockSuccessCount++
                console.log(`Chat unlocked via API for auction ${auction.id}`)
              } else {
                const errorText = await response.text()
                console.error(`API chat unlock failed: ${response.status} - ${errorText}`)
              }
            } catch (err) {
              console.log(`API chat unlock error: ${err.message}, trying fallback...`)
            }

            // Fallback: direct Supabase unlock if API failed
            if (!chatUnlocked) {
              chatUnlocked = await unlockChatDirectly(supabase, auction, highestBid.buyer_id)
              if (chatUnlocked) {
                chatUnlockFallbackCount++
                console.log(`Chat unlocked via fallback for auction ${auction.id}`)
              } else {
                chatUnlockFailedCount++
                console.error(`Failed to unlock chat for auction ${auction.id} via both methods`)
              }
            }
          }

          // Update auction status
          updateData.status = finalStatus

          const { error: updateError } = await supabase
            .from('auctions')
            .update(updateData)
            .eq('id', auction.id)

          if (updateError) {
            console.error(`Error updating auction ${auction.id}:`, updateError)
            await logAuctionCloseEvent(supabase, auction.id, 'error', updateError.message)
            return
          }

          closedCount++
          await logAuctionCloseEvent(supabase, auction.id, finalStatus)
          console.log(`Auction ${auction.id}: Status updated to ${finalStatus}`)
        } catch (error) {
          console.error(`Error processing auction ${auction.id}:`, error)
          await logAuctionCloseEvent(supabase, auction.id, 'error', error.message)
        }
      })

      // Wait for all auctions in this batch to complete
      await Promise.allSettled(batchPromises)
      
      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < endedAuctionsList.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`=== SUMMARY ===`)
    console.log(`Total closed: ${closedCount}`)
    console.log(`Sold: ${soldCount}`)
    console.log(`Expired (no bids): ${expiredCount}`)
    console.log(`Expired (reserve not met): ${reserveNotMetCount}`)
    console.log(`Chat unlock via API: ${chatUnlockSuccessCount}`)
    console.log(`Chat unlock via fallback: ${chatUnlockFallbackCount}`)
    console.log(`Chat unlock failed: ${chatUnlockFailedCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Closed ${closedCount} auctions (${soldCount} sold, ${expiredCount + reserveNotMetCount} expired)`,
        closed: closedCount,
        sold: soldCount,
        expired_no_bids: expiredCount,
        expired_reserve_not_met: reserveNotMetCount,
        chat_unlock_api: chatUnlockSuccessCount,
        chat_unlock_fallback: chatUnlockFallbackCount,
        chat_unlock_failed: chatUnlockFailedCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in close-auctions function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
}, { timeoutMs: 60000 }) // 60 second timeout