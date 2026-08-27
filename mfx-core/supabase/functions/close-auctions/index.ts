// supabase/functions/close-auctions/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get auctions that have ended but are still active
    const now = new Date().toISOString()
    
    const { data: endedAuctions, error: fetchError } = await supabase
      .from('auctions')
      .select('*')
      .eq('status', 'active')
      .lt('end_time', now)

    if (fetchError) {
      throw fetchError
    }

    let closedCount = 0
    let expiredCount = 0

    for (const auction of endedAuctions || []) {
      // Get highest bid for this auction
      const { data: bids, error: bidError } = await supabase
        .from('auction_bids')
        .select('*')
        .eq('auction_id', auction.id)
        .order('bid_amount', { ascending: false })
        .limit(1)

      if (bidError) {
        console.error(`Error fetching bids for auction ${auction.id}:`, bidError)
        continue
      }

      const highestBid = bids && bids.length > 0 ? bids[0] : null

      // Update auction status
      const updateData: any = {
        status: highestBid ? 'sold' : 'expired',
        closed_at: now
      }

      if (highestBid) {
        updateData.winning_bid_id = highestBid.id
        updateData.current_highest_bid = highestBid.bid_amount
      }

      const { error: updateError } = await supabase
        .from('auctions')
        .update(updateData)
        .eq('id', auction.id)

      if (updateError) {
        console.error(`Error updating auction ${auction.id}:`, updateError)
        continue
      }

      if (highestBid) {
        closedCount++
      } else {
        expiredCount++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Closed ${closedCount} auctions, expired ${expiredCount} auctions`,
        closed: closedCount,
        expired: expiredCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in close-auctions function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})