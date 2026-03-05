import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, query } from "../_generated/server";
import { internal } from "../_generated/api";

// ─── Groq helper (copy model, JSON mode) ─────────────────────────────────────
async function callGroqJson(systemPrompt: string, userPrompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.8,
            max_tokens: 400,
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
export const getMatchById = internalQuery({
    args: { matchId: v.id("matches") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.matchId);
    },
});

export const getUserForIcebreaker = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();
    },
});

export const getPersonalityForIcebreaker = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("personality_profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();
    },
});

// ─── Internal mutations ───────────────────────────────────────────────────────
export const markIcebreakersGenerated = internalMutation({
    args: { matchId: v.id("matches") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.matchId, { icebreakersGenerated: true });
    },
});

export const storeIcebreakers = internalMutation({
    args: {
        matchId: v.id("matches"),
        generatedForClerkId: v.string(),
        option1: v.string(),
        option2: v.string(),
        option3: v.string(),
        bonus: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("icebreakers", {
            matchId: args.matchId,
            generatedForClerkId: args.generatedForClerkId,
            option1: args.option1,
            option2: args.option2,
            option3: args.option3,
            bonus: args.bonus,
            createdAt: Date.now(),
        });
    },
});

// ─── Core action ─────────────────────────────────────────────────────────────
export const generateIcebreakersForMatch = internalAction({
    args: { matchId: v.id("matches") },
    handler: async (ctx, args) => {
        const match = await ctx.runQuery(internal.ai.icebreakers.getMatchById, {
            matchId: args.matchId,
        });
        if (!match || match.icebreakersGenerated) return;

        const [user1, user2, p1, p2] = await Promise.all([
            ctx.runQuery(internal.ai.icebreakers.getUserForIcebreaker, { clerkId: match.user1ClerkId }),
            ctx.runQuery(internal.ai.icebreakers.getUserForIcebreaker, { clerkId: match.user2ClerkId }),
            ctx.runQuery(internal.ai.icebreakers.getPersonalityForIcebreaker, { clerkId: match.user1ClerkId }),
            ctx.runQuery(internal.ai.icebreakers.getPersonalityForIcebreaker, { clerkId: match.user2ClerkId }),
        ]);
        if (!user1 || !user2) return;

        const name1 = user1.firstName || user1.name;
        const name2 = user2.firstName || user2.name;

        // Find shared interests (substring match for fuzzy overlap)
        const interests1 = p1?.interestVector ?? [];
        const interests2 = p2?.interestVector ?? [];
        const sharedInterests = interests1.filter((i: string) =>
            interests2.some(
                (j: string) =>
                    i.toLowerCase() === j.toLowerCase() ||
                    i.toLowerCase().includes(j.toLowerCase()) ||
                    j.toLowerCase().includes(i.toLowerCase())
            )
        );

        const sharedValues = p1 && p2
            ? p1.values.filter((v: string) => p2.values.includes(v))
            : [];

        const contextA =
            `Person A (${name1}): ` +
            `values: ${p1?.values.slice(0, 4).join(", ") || "unknown"}, ` +
            `interests: ${interests1.slice(0, 5).join(", ") || "unknown"}, ` +
            `life stage: ${p1?.lifeStage || "unknown"}, ` +
            `humor: ${p1?.humor || "unknown"}.`;

        const contextB =
            `Person B (${name2}): ` +
            `values: ${p2?.values.slice(0, 4).join(", ") || "unknown"}, ` +
            `interests: ${interests2.slice(0, 5).join(", ") || "unknown"}, ` +
            `life stage: ${p2?.lifeStage || "unknown"}, ` +
            `humor: ${p2?.humor || "unknown"}.`;

        const sharedCtx = [
            sharedValues.length ? `Shared values: ${sharedValues.join(", ")}.` : "",
            sharedInterests.length ? `Shared interests: ${sharedInterests.join(", ")}.` : "",
        ]
            .filter(Boolean)
            .join(" ");

        const systemPrompt =
            "You are a witty, warm matchmaker for an Indian dating app called Align. " +
            "Generate conversation-starter icebreakers for two people who just matched. " +
            "Icebreakers must feel natural, playful, and specific — never generic. " +
            "Keep each one short (1-2 sentences). The bonus should be a slightly deeper, more personal question. " +
            "Respond with valid JSON only, no commentary.";

        const userPrompt =
            `${contextA}\n${contextB}` +
            (sharedCtx ? `\n${sharedCtx}` : "") +
            `\n\nGenerate 3 fun icebreakers and 1 bonus deeper question that either person could send. ` +
            `Return a JSON object with keys: "option1", "option2", "option3", "bonus".`;

        const fallback = {
            option1: "What's something you've been really looking forward to lately?",
            option2: "If you could be anywhere in the world right now, where would it be?",
            option3: "What's the last thing that genuinely made you laugh?",
            bonus: "What's something people are usually surprised to find out about you?",
        };

        let parsed: typeof fallback = fallback;
        try {
            const raw = await callGroqJson(systemPrompt, userPrompt);
            const data = JSON.parse(raw);
            parsed = {
                option1: typeof data.option1 === "string" && data.option1.trim() ? data.option1.trim() : fallback.option1,
                option2: typeof data.option2 === "string" && data.option2.trim() ? data.option2.trim() : fallback.option2,
                option3: typeof data.option3 === "string" && data.option3.trim() ? data.option3.trim() : fallback.option3,
                bonus: typeof data.bonus === "string" && data.bonus.trim() ? data.bonus.trim() : fallback.bonus,
            };
        } catch {
            // fallback already set
        }

        // Store the same set for both users (each fetches via their own clerkId)
        await Promise.all([
            ctx.runMutation(internal.ai.icebreakers.storeIcebreakers, {
                matchId: args.matchId,
                generatedForClerkId: match.user1ClerkId,
                ...parsed,
            }),
            ctx.runMutation(internal.ai.icebreakers.storeIcebreakers, {
                matchId: args.matchId,
                generatedForClerkId: match.user2ClerkId,
                ...parsed,
            }),
        ]);

        await ctx.runMutation(internal.ai.icebreakers.markIcebreakersGenerated, {
            matchId: args.matchId,
        });
    },
});

// ─── Public API ───────────────────────────────────────────────────────────────
export const getMyIcebreakerForMatch = query({
    args: { matchId: v.id("matches") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("icebreakers")
            .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
            .filter((q) => q.eq(q.field("generatedForClerkId"), identity.subject))
            .first();
    },
});

export const triggerIcebreakerGeneration = action({
    args: { matchId: v.id("matches") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Verify the caller is one of the two users in this match
        const match = await ctx.runQuery(internal.ai.icebreakers.getMatchById, {
            matchId: args.matchId,
        });
        if (!match) throw new Error("Match not found");
        if (match.user1ClerkId !== identity.subject && match.user2ClerkId !== identity.subject) {
            throw new Error("Not authorized for this match");
        }

        await ctx.scheduler.runAfter(
            0,
            internal.ai.icebreakers.generateIcebreakersForMatch,
            { matchId: args.matchId }
        );
    },
});
