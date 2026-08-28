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

    console.log('=== CLOSE-AUCTIONS EDGE FUNCTION STARTED ===')
    const now = new Date().toISOString()

    // Get auctions that have ended but are still active
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
    let soldCount = 0
    let reserveNotMetCount = 0

    for (const auction of endedAuctions || []) {
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
        continue
      }

      const highestBid = bids && bids.length > 0 ? bids[0] : null
      const highestBidAmount = highestBid ? highestBid.bid_amount : 0
      
      // ====== CHECK RESERVE PRICE ======
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
        console.log(`Auction ${auction.id}: No bids → expired`)
      } else if (reservePrice > 0 && highestBidAmount < reservePrice) {
        // Reserve not met - expired (not sold)
        finalStatus = 'expired'
        reserveNotMetCount++
        console.log(`Auction ${auction.id}: Highest bid ${highestBidAmount} < reserve price ${reservePrice} → expired (reserve not met)`)
      } else {
        // Reserve met (or no reserve) - sold
        finalStatus = 'sold'
        soldCount++
        updateData.winning_bid_id = highestBid.id
        updateData.current_highest_bid = highestBidAmount
        updateData.current_highest_bidder = highestBid.buyer_id
        console.log(`Auction ${auction.id}: Highest bid ${highestBidAmount} → sold to ${highestBid.buyer_id}`)
      }

      // Update auction status
      updateData.status = finalStatus

      const { error: updateError } = await supabase
        .from('auctions')
        .update(updateData)
        .eq('id', auction.id)

      if (updateError) {
        console.error(`Error updating auction ${auction.id}:`, updateError)
        continue
      }

      closedCount++
      console.log(`Auction ${auction.id}: Status updated to ${finalStatus}`)
    }

    console.log(`=== SUMMARY ===`)
    console.log(`Total closed: ${closedCount}`)
    console.log(`Sold: ${soldCount}`)
    console.log(`Expired (no bids): ${expiredCount}`)
    console.log(`Expired (reserve not met): ${reserveNotMetCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Closed ${closedCount} auctions (${soldCount} sold, ${expiredCount + reserveNotMetCount} expired)`,
        closed: closedCount,
        sold: soldCount,
        expired_no_bids: expiredCount,
        expired_reserve_not_met: reserveNotMetCount
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