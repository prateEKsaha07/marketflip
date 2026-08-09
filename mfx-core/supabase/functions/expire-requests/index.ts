import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async () => {
  try {
    console.log("🔄 Running expire-requests cron job...");

    // Get current time
    const now = new Date().toISOString();

    // Update requests where expires_at < NOW() and status = 'open'
    const { data, error } = await supabase
      .from("requests")
      .update({ status: "expired" })
      .eq("status", "open")
      .lt("expires_at", now)
      .select();

    if (error) {
      console.error("❌ Error expiring requests:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500 }
      );
    }

    console.log(`✅ Expired ${data?.length || 0} requests`);
    return new Response(
      JSON.stringify({
        success: true,
        expired_count: data?.length || 0,
        expired_ids: data?.map((r: any) => r.id) || [],
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500 }
    );
  }
});