// supabase/functions/monetization/index.ts
// Supabase Edge Function to process Razorpay Payments and Subscriptions
// Requires setting RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Supabase Secrets

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as crypto from "https://deno.land/std@0.168.0/node/crypto.ts";

const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID") || "";
const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") { return new Response("ok", { headers: corsHeaders }); }

    const supabaseAdminClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Elevated to bypass RLS to credit securely
        { auth: { persistSession: false } }
    );

    try {
        const { action, payload } = await req.json();

        // ── 1. CREATE RAZORPAY ORDER ─────────────────────────────────────────────
        if (action === "create_order") {
            const { amount_paise, currency = "INR", clerk_id } = payload;

            const response = await fetch("https://api.razorpay.com/v1/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Basic " + btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
                },
                body: JSON.stringify({
                    amount: amount_paise,
                    currency,
                    receipt: `rcpt_${clerk_id}_${Date.now()}`
                })
            });

            const orderData = await response.json();
            return new Response(JSON.stringify(orderData), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ── 2. WEBHOOK: VERIFY PAYMENT AND CREDIT AP / SUB ──────────────────────────────
        if (action === "verify_payment") {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, clerk_id, purchase_type, ap_amount, tier } = payload;

            // Verify the Razorpay Crypto Signature ensuring payment is real
            const expectedSignature = crypto
                .createHmac("sha256", razorpayKeySecret)
                .update(razorpay_order_id + "|" + razorpay_payment_id)
                .digest("hex");

            if (expectedSignature !== razorpay_signature) {
                throw new Error("Invalid Razorpay Signature");
            }

            // If Signature matches, Credit the User via our secure RPCs
            if (purchase_type === "ap_pack") {
                const { error } = await supabaseAdminClient.rpc('credit_ap_purchase', {
                    p_clerk_id: clerk_id,
                    p_amount_paid: payload.amount_paid,
                    p_ap_amount: ap_amount,
                    p_razorpay_id: razorpay_payment_id
                });
                if (error) throw error;
            }
            else if (purchase_type === "subscription") {
                const { error } = await supabaseAdminClient.rpc('activate_subscription', {
                    p_clerk_id: clerk_id,
                    p_tier: tier,
                    p_razorpay_id: razorpay_subscription_id // Pass Razorpay Sub ID if active
                });
                if (error) throw error;
            }

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });

    } catch (error) {
        console.error("Monetization Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});
