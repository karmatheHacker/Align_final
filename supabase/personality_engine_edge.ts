// supabase/functions/personality_engine/index.ts
// Supabase Edge Function to generate Personality Vectors and Compatibility Predictions.
// Evaluates behaviors, conversations, and transcripts using GPT-4o-mini logic.
// Requires setting OPENAI_API_KEY in Supabase Edge Secrets.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") { return new Response("ok", { headers: corsHeaders }); }

    const supabaseAdminClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Service role to access protected vector records
        { auth: { persistSession: false } }
    );

    try {
        const { action, payload } = await req.json();

        // ── ACTION 1: Generate & Store Personality Matrix ───────────────────
        if (action === "update_personality_vector") {
            const { clerk_id } = payload;

            const { data: userProfile } = await supabaseAdminClient
                .from('profiles').select('*, profile_prompts(*), voice_profiles(*), behavioral_signals(*)').eq('clerk_id', clerk_id).single();

            const analysisPrompt = `
        Analyze the following dating user's profile, prompts, voice transcriptions, and raw behavioral interaction flags.
        Compute a generalized AI Personality Vector scoring them strictly between 0.0 to 1.0 (Low to High metrics).
        
        Variables required in the output JSON format:
        {
           "introversion": float,
           "adventurousness": float,
           "emotional_openness": float,
           "communication_style": float,
           "relationship_intent_seriousness": float,
           "humor_type": float,
           "spontaneity": float
        }
        
        Data: ${JSON.stringify(userProfile)}
      `;

            const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "system", content: analysisPrompt }],
                    temperature: 0.5,
                    response_format: { type: "json_object" }
                })
            });

            const aiData = await aiResponse.json();
            const parsedVector = JSON.parse(aiData.choices[0].message.content);

            // Upsert the generated Matrix into DB safely
            await supabaseAdminClient.from('personality_vectors').upsert({
                clerk_id,
                vector: parsedVector,
                confidence_score: 0.85,
                last_updated: new Date().toISOString()
            }, { onConflict: 'clerk_id' });

            return new Response(JSON.stringify({ success: true, vector: parsedVector }), { headers: corsHeaders });
        }

        // ── ACTION 2: Run Live Compatibility Prediction Model ───────────────
        if (action === "predict_compatibility") {
            const { user1_clerk_id, user2_clerk_id } = payload;

            const [p1, p2] = await Promise.all([
                supabaseAdminClient.from('personality_vectors').select('*').eq('clerk_id', user1_clerk_id).single(),
                supabaseAdminClient.from('personality_vectors').select('*').eq('clerk_id', user2_clerk_id).single()
            ]);

            if (!p1.data || !p2.data) throw new Error("Missing personality vector matrices to map compatibility.");

            const predictionPrompt = `
        You are Align's Match Predictor. Compare these two personality matrices natively.
        Assign a final predicted_success_score between 1 and 100 on long term compatibility viability.
        
        User 1 Matrix: ${JSON.stringify(p1.data.vector)}
        User 2 Matrix: ${JSON.stringify(p2.data.vector)}
        
        Return JSON schema only exactly: { "predicted_success_score": number, "confidence_score": number }
      `;

            const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "system", content: predictionPrompt }],
                    response_format: { type: "json_object" }
                })
            });

            const aiData = await aiResponse.json();
            const scores = JSON.parse(aiData.choices[0].message.content);

            // Order parameters correctly so indexing constraints pass A < B sorting
            const finalUser1 = user1_clerk_id < user2_clerk_id ? user1_clerk_id : user2_clerk_id;
            const finalUser2 = user1_clerk_id < user2_clerk_id ? user2_clerk_id : user1_clerk_id;

            await supabaseAdminClient.from('compatibility_predictions').upsert({
                user1_clerk_id: finalUser1,
                user2_clerk_id: finalUser2,
                predicted_success_score: scores.predicted_success_score,
                confidence_score: scores.confidence_score,
                calculated_at: new Date().toISOString()
            }, { onConflict: 'user1_clerk_id,user2_clerk_id' });

            return new Response(JSON.stringify({ success: true, scores }), { headers: corsHeaders });
        }

        return new Response(JSON.stringify({ error: "Invalid Advanced AI payload action" }), { status: 400, headers: corsHeaders });

    } catch (error) {
        console.error("AI Personality Engine Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
