import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";

// ─── Groq helper ─────────────────────────────────────────────────────────────
async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 1000,
            response_format: { type: "json_object" },
        }),
        signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
    if (!response.ok) {
        throw new Error(`Groq error ${response.status}`);
    }
    const data: any = await response.json();
    return data.choices[0].message.content;
}

// ─── Internal queries ─────────────────────────────────────────────────────────
export const getUserForPersonality = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();
    },
});

export const getPersonalityProfile = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("personality_profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();
    },
});

export const getAllOnboardedUsers = internalQuery({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("onboardingCompleted"), true))
            .collect();
    },
});

// ─── Internal mutations ───────────────────────────────────────────────────────
export const upsertPersonalityProfile = internalMutation({
    args: {
        clerkId: v.string(),
        values: v.array(v.string()),
        communicationStyle: v.string(),
        lifeStage: v.string(),
        humor: v.string(),
        emotionalAvailability: v.number(),
        interestVector: v.array(v.string()),
        profileVersion: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("personality_profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        const data = {
            clerkId: args.clerkId,
            values: args.values,
            communicationStyle: args.communicationStyle,
            lifeStage: args.lifeStage,
            humor: args.humor,
            emotionalAvailability: args.emotionalAvailability,
            interestVector: args.interestVector,
            lastComputedAt: Date.now(),
            profileVersion: args.profileVersion,
        };

        if (existing) {
            await ctx.db.patch(existing._id, data);
        } else {
            await ctx.db.insert("personality_profiles", data);
        }
    },
});

// ─── Core action ─────────────────────────────────────────────────────────────
export const computePersonalityProfile = internalAction({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(
            internal.ai.personality.getUserForPersonality,
            { clerkId: args.clerkId }
        );
        if (!user) return;

        // Version key: use updatedAt so any profile edit triggers recompute
        const profileVersion = user.updatedAt || user.createdAt;

        // Skip if already up to date
        const existing = await ctx.runQuery(
            internal.ai.personality.getPersonalityProfile,
            { clerkId: args.clerkId }
        );
        if (existing && existing.profileVersion === profileVersion) return;

        // Build the three data sources
        const publicBio = user.publicBio || "";
        const privateBio = user.aiBio || "";
        const promptsText =
            user.prompts
                ?.map((p: any) => `Question: ${p.question}\nAnswer: ${p.answer}`)
                .join("\n") || "None";

        const systemPrompt =
            `You are analyzing a dating app user's profile to extract a structured personality profile.

You have access to three inputs:
1. Public Bio (how they present themselves to the world)
2. Matchmaking Bio (what they honestly want inside the app — this is 2x more important than the public bio, treat it as the ground truth of who they are)
3. All prompt answers (specific questions they answered about themselves)

Analyze all three carefully and return ONLY a JSON object with these exact fields:

{
  "values": ["value1", "value2", "value3"],
  "communicationStyle": "",
  "lifeStage": "",
  "humor": "",
  "emotionalAvailability": 0,
  "interestVector": ["interest1", "interest2"],
  "relationshipReadiness": 0,
  "lifestyleOrientation": "",
  "dealbreakers": []
}

values: top 3-5 core life values, inferred from language not just stated
communicationStyle: one of: expressive-emotional / intellectual-analytical / witty-playful / reserved-thoughtful / direct-assertive
lifeStage: one of: career-first / actively-seeking-commitment / open-and-exploring / ready-for-marriage / focused-on-personal-growth
humor: one of: dry / warm / playful / none / sarcastic
emotionalAvailability: 0-100: how emotionally ready and open they appear
interestVector: specific interest keywords, be precise not generic
relationshipReadiness: 0-100: how ready are they for a serious relationship right now
lifestyleOrientation: one of: homebodied / socially-active / adventure-driven / career-absorbed / family-centered / spiritually-oriented
dealbreakers: any hard preferences or non-negotiables explicitly or strongly implied

Return only the JSON object. No explanation. No markdown.`;

        const userPrompt =
            `Public Bio: ${publicBio || "None"}
Matchmaking Bio (2x weight): ${privateBio || "None"}
Prompt Answers:
${promptsText}

Additional context:
Name: ${user.firstName || user.name}
Dating Intention: ${user.datingIntention || "None"}
Relationship Type: ${user.relationshipType || "None"}
Religion: ${user.religion || "None"}
Children: ${user.children || "None"}
Drinking: ${user.drinking || "None"}
Tobacco: ${user.tobacco || "None"}`;

        let parsed: any;
        try {
            const raw = await callGroq(systemPrompt, userPrompt);
            parsed = JSON.parse(raw);
        } catch (err) {
            // Groq/parse error — use fallback personality defaults
            // Fallback defaults — unknown, not high
            parsed = {
                values: [],
                communicationStyle: "unknown",
                lifeStage: "unknown",
                humor: "none",
                emotionalAvailability: 50,
                interestVector: [],
                relationshipReadiness: 50,
                lifestyleOrientation: "unknown",
                dealbreakers: [],
            };
        }

        const result = {
            values: Array.isArray(parsed.values)
                ? parsed.values.slice(0, 7).map(String)
                : [],
            communicationStyle:
                typeof parsed.communicationStyle === "string"
                    ? parsed.communicationStyle
                    : "unknown",
            lifeStage:
                typeof parsed.lifeStage === "string"
                    ? parsed.lifeStage
                    : "unknown",
            humor:
                typeof parsed.humor === "string" ? parsed.humor : "none",
            emotionalAvailability: Math.min(
                100,
                Math.max(0, Number(parsed.emotionalAvailability) || 50)
            ),
            interestVector: Array.isArray(parsed.interestVector)
                ? parsed.interestVector.slice(0, 12).map(String)
                : [],
        };

        await ctx.runMutation(internal.ai.personality.upsertPersonalityProfile, {
            clerkId: args.clerkId,
            ...result,
            profileVersion,
        });
    },
});

// ─── Daily stale-profile sweep ────────────────────────────────────────────────
export const recomputeStaleProfiles = internalAction({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.runQuery(
            internal.ai.personality.getAllOnboardedUsers,
            {}
        );

        for (const user of users) {
            const profileVersion = user.updatedAt || user.createdAt;
            const existing = await ctx.runQuery(
                internal.ai.personality.getPersonalityProfile,
                { clerkId: user.clerkId }
            );

            if (!existing || existing.profileVersion !== profileVersion) {
                // Schedule each compute individually so failures are isolated
                await ctx.scheduler.runAfter(
                    0,
                    internal.ai.personality.computePersonalityProfile,
                    { clerkId: user.clerkId }
                );
            }
        }
    },
});

// ─── Public action (client-triggered recompute) ───────────────────────────────
export const triggerPersonalityCompute = action({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");
        await ctx.scheduler.runAfter(
            0,
            internal.ai.personality.computePersonalityProfile,
            { clerkId: identity.subject }
        );
    },
});
