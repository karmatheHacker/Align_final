// supabase/functions/push_notifications/index.ts
// Supabase Edge Function to securely process Push Notifications (FCM / Expo)
// Triggers natively via Supabase Database Webhooks when a row is inserted in `public.notifications`

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
    const supabaseAdminClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
    );

    try {
        const { record: notification } = await req.json();

        if (!notification || !notification.clerk_id) {
            return new Response("Invalid Payload", { status: 400 });
        }

        const { clerk_id, title, body, type, data } = notification;

        // 1. Check user preferences before bothering them
        const { data: prefs } = await supabaseAdminClient
            .from('user_preferences')
            .select('push_enabled, ap_notifications, match_notifications, message_notifications')
            .eq('clerk_id', clerk_id)
            .single();

        if (prefs) {
            if (!prefs.push_enabled) return new Response("Push Disabled Globally", { status: 200 });
            if (type === 'ap_received' && !prefs.ap_notifications) return new Response("Push Disabled for AP", { status: 200 });
            if (type === 'match_created' && !prefs.match_notifications) return new Response("Push Disabled for Matches", { status: 200 });
            if (type === 'message_received' && !prefs.message_notifications) return new Response("Push Disabled for Messages", { status: 200 });
        }

        // 2. Fetch Active Push Token(s) for the recipient
        const { data: tokens } = await supabaseAdminClient
            .from('push_tokens')
            .select('push_token')
            .eq('clerk_id', clerk_id);

        if (!tokens || tokens.length === 0) {
            return new Response("No active push tokens found for user", { status: 200 });
        }

        // 3. Compile Expo Push Payloads
        const pushMessages = tokens.map(t => ({
            to: t.push_token,
            sound: 'default',
            title: title || "New Notification",
            body: body || "Open Align to view",
            badge: 1,
            data: { type, ...data },
        }));

        // 4. Send the Batch via Expo Push SDK
        const response = await fetch(EXPO_PUSH_URL, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(pushMessages)
        });

        const receipt = await response.json();
        return new Response(JSON.stringify({ success: true, receipt }), { headers: { "Content-Type": "application/json" } });

    } catch (error) {
        console.error("Push Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
