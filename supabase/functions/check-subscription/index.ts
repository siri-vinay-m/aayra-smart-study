
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    // Get current subscription status using the database function
    const { data: subscriptionStatus, error: statusError } = await supabaseClient
      .rpc('get_user_subscription_status', { user_id_param: user.id });

    if (statusError) {
      console.error('Error getting subscription status:', statusError);
      throw new Error(`Failed to get subscription status: ${statusError.message}`);
    }

    if (!subscriptionStatus || subscriptionStatus.length === 0) {
      // If no subscription found, create a free trial for the user
      const { data: freePlan } = await supabaseClient
        .from('subscriptionplans')
        .select('planid')
        .eq('planname', 'free')
        .single();

      if (freePlan) {
        await supabaseClient
          .from('usersubscriptions')
          .insert({
            userid: user.id,
            planid: freePlan.planid,
            status: 'active',
            startdate: new Date().toISOString(),
            enddate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
          });

        // Get the updated status
        const { data: newStatus } = await supabaseClient
          .rpc('get_user_subscription_status', { user_id_param: user.id });

        if (newStatus && newStatus.length > 0) {
          const status = newStatus[0];
          return new Response(JSON.stringify({
            subscribed: status.plan_name === 'premium',
            subscription_plan: status.plan_name,
            subscription_status: status.status,
            subscription_start_date: status.start_date,
            subscription_end_date: status.end_date,
            days_remaining: status.days_remaining,
            sessions_per_day: status.sessions_per_day,
            sessions_per_week: status.sessions_per_week,
            ads_enabled: status.ads_enabled,
            is_trial: status.is_trial
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    }

    const status = subscriptionStatus[0];
    
    // If user has Stripe subscription, verify it's still active
    if (status.plan_name === 'premium') {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2023-10-16",
      });

      // Check if customer exists in Stripe
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      
      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        
        // Check for active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 1,
        });

        if (subscriptions.data.length === 0) {
          // No active Stripe subscription, but user has premium in database
          // This means subscription was cancelled, so we need to expire it
          await supabaseClient.rpc('check_and_update_expired_subscriptions');
          
          // Get updated status
          const { data: updatedStatus } = await supabaseClient
            .rpc('get_user_subscription_status', { user_id_param: user.id });
          
          if (updatedStatus && updatedStatus.length > 0) {
            const newStatus = updatedStatus[0];
            return new Response(JSON.stringify({
              subscribed: false,
              subscription_plan: newStatus.plan_name,
              subscription_status: newStatus.status,
              subscription_start_date: newStatus.start_date,
              subscription_end_date: newStatus.end_date,
              days_remaining: newStatus.days_remaining,
              sessions_per_day: newStatus.sessions_per_day,
              sessions_per_week: newStatus.sessions_per_week,
              ads_enabled: newStatus.ads_enabled,
              is_trial: newStatus.is_trial
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          }
        }
      }
    }

    // Update user record with current subscription info
    await supabaseClient.from("users").upsert({
      userid: user.id,
      email: user.email,
      displayname: user.user_metadata?.display_name || 'User',
      studentcategory: user.user_metadata?.student_category || 'college',
      passwordhash: '',
      emailverified: user.email_confirmed_at ? true : false,
      subscription_plan: status.plan_name,
      subscription_start_date: status.start_date,
      subscription_end_date: status.end_date,
    }, { onConflict: 'userid' });

    return new Response(JSON.stringify({
      subscribed: status.plan_name === 'premium',
      subscription_plan: status.plan_name,
      subscription_status: status.status,
      subscription_start_date: status.start_date,
      subscription_end_date: status.end_date,
      days_remaining: status.days_remaining,
      sessions_per_day: status.sessions_per_day,
      sessions_per_week: status.sessions_per_week,
      ads_enabled: status.ads_enabled,
      is_trial: status.is_trial
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error in check-subscription:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
