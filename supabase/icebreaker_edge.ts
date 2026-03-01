// supabase/functions/icebreaker_generator/index.ts
// Supabase Edge Function to generate AI personalized icebreakers.
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

    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
    );

    try {
        const { match_id, sender_clerk_id, receiver_clerk_id } = await req.json();

        if (!match_id || !sender_clerk_id || !receiver_clerk_id) {
            return new Response("Missing parameters", { status: 400 });
        }

        // 1. Fetch both user's profile data to construct the AI context window
        const [senderRes, receiverRes] = await Promise.all([
            supabaseClient.from('profiles').select('*, profile_prompts(*), voice_profiles(*)').eq('clerk_id', sender_clerk_id).single(),
            supabaseClient.from('profiles').select('*, profile_prompts(*), voice_profiles(*)').eq('clerk_id', receiver_clerk_id).single()
        ]);

        const sender = senderRes.data;
        const receiver = receiverRes.data;

        if (!sender || !receiver) throw new Error("Could not find matching profiles");

        // 2. Format the profiles into an AI system instruction block
        const systemPrompt = `
      You are Align AI, the core matchmaking engine generating high-intent dating icebreakers. 
      You are tasked with generating 3 personalized icebreaker questions for User A to send to User B.
      
      User B Context (Receiver):
      Name: ${receiver.first_name}
      Bio: ${receiver.bio || "None provided"}
      Answers to prompts: ${receiver.profile_prompts?.map(p => `${p.prompt_question}: ${p.prompt_answer}`).join(" | ")}
      Voice Transcription Context: ${receiver.voice_profiles?.[0]?.transcription || "No voice profile provided."}
      
      User A Context (Sender):
      Name: ${sender.first_name}
      Bio: ${sender.bio || "None provided"}
      
      Instructions:
      Return exactly 3, distinct icebreakers that references something specific from User B's bio, prompts, or voice transcription.
      Do not sound like a robot. Write them exactly as User A would type them into a chat bubble.
      Use a JSON output array: ["icebreaker 1", "icebreaker 2", "icebreaker 3"].
    `;

        // 3. Request Generation from Grok/OpenAI model
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Cost efficient but lightning fast JSON engine
                messages: [{ role: "system", content: systemPrompt }],
                temperature: 0.8,
                response_format: { type: "json_object" }
            })
        });

        const aiData = await aiResponse.json();
        const parsedText = aiData.choices[0].message.content;

        // Attempt parsing JSON safely
        let icebreakers = [];
        try {
            const doc = JSON.parse(parsedText);
            icebreakers = Array.isArray(doc) ? doc : (doc.icebreakers || Object.values(doc));
        } catch {
            icebreakers = ["Hey, saw your profile and thought we'd connect!", "Looks like we have some shared interests!", "What is your favorite weekend activity?"];
        }

        // 4. Save to Database securely so they can be fetched without re-generating and spending credits
        const inserts = icebreakers.map(text => ({
            match_id,
            sender_clerk_id,
            receiver_clerk_id,
            icebreaker_text: text,
            generated_by: 'ai'
        }));

        const { error: insertError } = await supabaseClient.from('ai_icebreakers').insert(inserts);
        if (insertError) throw insertError;

        return new Response(JSON.stringify({ success: true, count: icebreakers.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (error) {
        console.error("AI Generation Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
