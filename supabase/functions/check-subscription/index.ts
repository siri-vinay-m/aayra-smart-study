
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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      // No customer found, ensure user is on free plan
      await supabaseClient.from("users").upsert({
        userid: user.id,
        email: user.email,
        displayname: user.user_metadata?.display_name || 'User',
        studentcategory: user.user_metadata?.student_category || 'college',
        passwordhash: '',
        emailverified: user.email_confirmed_at ? true : false,
        subscription_plan: 'free',
      }, { onConflict: 'userid' });
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_plan: 'free' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    
    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionPlan = 'free';
    let subscriptionEndDate = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionPlan = 'premium';
      subscriptionEndDate = new Date(subscription.current_period_end * 1000).toISOString();
      
      // Update user with premium status
      await supabaseClient.from("users").upsert({
        userid: user.id,
        email: user.email,
        displayname: user.user_metadata?.display_name || 'User',
        studentcategory: user.user_metadata?.student_category || 'college',
        passwordhash: '',
        emailverified: user.email_confirmed_at ? true : false,
        subscription_plan: 'premium',
        subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_end_date: subscriptionEndDate,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
      }, { onConflict: 'userid' });
    } else {
      // Update user to free plan
      await supabaseClient.from("users").upsert({
        userid: user.id,
        email: user.email,
        displayname: user.user_metadata?.display_name || 'User',
        studentcategory: user.user_metadata?.student_category || 'college',
        passwordhash: '',
        emailverified: user.email_confirmed_at ? true : false,
        subscription_plan: 'free',
        stripe_customer_id: customerId,
      }, { onConflict: 'userid' });
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_plan: subscriptionPlan,
      subscription_end_date: subscriptionEndDate
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
