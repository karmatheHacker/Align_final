import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";

// ─── Groq helper (copy model) ─────────────────────────────────────────────────
async function callGroqCopy(systemPrompt: string, userPrompt: string): Promise<string> {
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
            temperature: 0.5,
            max_tokens: 350,
        }),
        signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
    if (!response.ok) {
        throw new Error(`Groq error ${response.status}`);
    }
    const data: any = await response.json();
    return data.choices[0].message.content.trim();
}

// ─── Internal queries ─────────────────────────────────────────────────────────
export const getCachedScoreForInsights = internalQuery({
    args: { clerkId1: v.string(), clerkId2: v.string() },
    handler: async (ctx, args) => {
        const [u1, u2] = [args.clerkId1, args.clerkId2].sort();
        return await ctx.db
            .query("compatibility_scores")
            .withIndex("by_pair", (q) =>
                q.eq("user1ClerkId", u1).eq("user2ClerkId", u2)
            )
            .first();
    },
});

export const getBothPersonalityProfilesForInsights = internalQuery({
    args: { clerkId1: v.string(), clerkId2: v.string() },
    handler: async (ctx, args) => {
        const [p1, p2] = await Promise.all([
            ctx.db
                .query("personality_profiles")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId1))
                .first(),
            ctx.db
                .query("personality_profiles")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId2))
                .first(),
        ]);
        return { p1, p2 };
    },
});

export const getBothUsersForInsights = internalQuery({
    args: { clerkId1: v.string(), clerkId2: v.string() },
    handler: async (ctx, args) => {
        const [u1, u2] = await Promise.all([
            ctx.db
                .query("users")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId1))
                .first(),
            ctx.db
                .query("users")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId2))
                .first(),
        ]);
        return { u1, u2 };
    },
});

// ─── Internal mutations ───────────────────────────────────────────────────────
export const patchInsightsJson = internalMutation({
    args: { clerkId1: v.string(), clerkId2: v.string(), insightsJson: v.string() },
    handler: async (ctx, args) => {
        const [u1, u2] = [args.clerkId1, args.clerkId2].sort();
        const row = await ctx.db
            .query("compatibility_scores")
            .withIndex("by_pair", (q) =>
                q.eq("user1ClerkId", u1).eq("user2ClerkId", u2)
            )
            .first();
        if (row) {
            await ctx.db.patch(row._id, { insightsJson: args.insightsJson });
        }
    },
});

// ─── Core action ─────────────────────────────────────────────────────────────
export const generateCompatibilityInsights = internalAction({
    args: { clerkId1: v.string(), clerkId2: v.string() },
    handler: async (ctx, args) => {
        // Ensure compatibility score exists first
        let score = await ctx.runQuery(internal.ai.insights.getCachedScoreForInsights, {
            clerkId1: args.clerkId1,
            clerkId2: args.clerkId2,
        });

        if (!score) {
            // Compute the score synchronously, then re-fetch
            await ctx.runAction(internal.ai.compatibility.computeCompatibilityScore, {
                user1ClerkId: args.clerkId1,
                user2ClerkId: args.clerkId2,
            });
            score = await ctx.runQuery(internal.ai.insights.getCachedScoreForInsights, {
                clerkId1: args.clerkId1,
                clerkId2: args.clerkId2,
            });
        }

        if (!score) return; // Still no score — nothing to work with

        // Skip regeneration if insights already exist and score hasn't changed
        if (score.insightsJson) {
            try {
                const cached = JSON.parse(score.insightsJson);
                if (cached.scoredAt === score.computedAt) return;
            } catch {
                // Corrupted JSON — regenerate
            }
        }

        const { p1, p2 } = await ctx.runQuery(
            internal.ai.insights.getBothPersonalityProfilesForInsights,
            { clerkId1: args.clerkId1, clerkId2: args.clerkId2 }
        );

        const { u1, u2 } = await ctx.runQuery(
            internal.ai.insights.getBothUsersForInsights,
            { clerkId1: args.clerkId1, clerkId2: args.clerkId2 }
        );

        const name1 = u1?.firstName || u1?.name || "Person A";
        const name2 = u2?.firstName || u2?.name || "Person B";

        // Build score narrative context
        const dimensions = [
            { label: "Values alignment", score: score.valuesScore, weight: "20%" },
            { label: "Communication styles", score: score.communicationScore, weight: "15%" },
            { label: "Life stage", score: score.lifeStageScore, weight: "20%" },
            { label: "Lifestyle compatibility", score: score.lifestyleScore, weight: "10%" },
            { label: "Relationship goals", score: score.goalsScore, weight: "15%" },
            { label: "Shared interests", score: score.interestsScore, weight: "10%" },
            { label: "Emotional availability", score: score.emotionalScore, weight: "5%" },
            { label: "Sense of humor", score: score.humorScore, weight: "5%" },
        ];

        const topStrengths = [...dimensions]
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((d) => `${d.label} (${Math.round(d.score)}%)`)
            .join(", ");

        const areasToNavigate = [...dimensions]
            .sort((a, b) => a.score - b.score)
            .slice(0, 2)
            .filter((d) => d.score < 65)
            .map((d) => `${d.label} (${Math.round(d.score)}%)`)
            .join(", ");

        const profileContext =
            `Person A (${name1}): values: ${p1?.values.join(", ") || "unknown"}, ` +
            `communication: ${p1?.communicationStyle || "unknown"}, ` +
            `life stage: ${p1?.lifeStage || "unknown"}, ` +
            `humor: ${p1?.humor || "unknown"}, ` +
            `interests: ${p1?.interestVector.slice(0, 5).join(", ") || "unknown"}.\n` +
            `Person B (${name2}): values: ${p2?.values.join(", ") || "unknown"}, ` +
            `communication: ${p2?.communicationStyle || "unknown"}, ` +
            `life stage: ${p2?.lifeStage || "unknown"}, ` +
            `humor: ${p2?.humor || "unknown"}, ` +
            `interests: ${p2?.interestVector.slice(0, 5).join(", ") || "unknown"}.`;

        const systemPrompt =
            "You are an insightful relationship counsellor for Align, an Indian dating app. " +
            "Write warm, honest, and specific compatibility insights for two matched users. " +
            "Be encouraging but honest. Reference their actual traits and scores. " +
            "Write in second person addressed to Person A ('You and [name]...'). " +
            "Keep it to 2-3 short paragraphs. Never be generic or use clichés.";

        const userPrompt =
            `${profileContext}\n\n` +
            `Overall compatibility: ${Math.round(score.totalScore)}%.\n` +
            `Top strengths: ${topStrengths}.\n` +
            (areasToNavigate ? `Areas to navigate: ${areasToNavigate}.\n` : "") +
            `\nWrite 2-3 paragraphs of compatibility insights for Person A about their match with Person B.`;

        let narrative: string;
        try {
            narrative = await callGroqCopy(systemPrompt, userPrompt);
        } catch {
            narrative =
                `You and ${name2} share a ${Math.round(score.totalScore)}% compatibility based on your values, goals, and personalities. ` +
                `Your strongest areas of alignment are ${topStrengths}.` +
                (areasToNavigate
                    ? ` Like any pairing, there are dimensions worth exploring together: ${areasToNavigate}.`
                    : "");
        }

        const insightsPayload = {
            narrative,
            totalScore: Math.round(score.totalScore),
            dimensions: dimensions.map((d) => ({
                label: d.label,
                score: Math.round(d.score),
                weight: d.weight,
            })),
            topStrengths: topStrengths.split(", "),
            areasToNavigate: areasToNavigate ? areasToNavigate.split(", ") : [],
            scoredAt: score.computedAt,
            generatedAt: Date.now(),
        };

        await ctx.runMutation(internal.ai.insights.patchInsightsJson, {
            clerkId1: args.clerkId1,
            clerkId2: args.clerkId2,
            insightsJson: JSON.stringify(insightsPayload),
        });
    },
});

// ─── Public action (cache-first) ─────────────────────────────────────────────
export const getCompatibilityInsights = action({
    args: { otherClerkId: v.string() },
    handler: async (ctx, args): Promise<any> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const myClerkId = identity.subject;

        // Only allow insight generation between matched users
        const [u1, u2] = [myClerkId, args.otherClerkId].sort();
        const match = await ctx.runQuery(internal.swipes.getMatchByPair, { u1, u2 });
        if (!match) return null;

        const score = await ctx.runQuery(internal.ai.insights.getCachedScoreForInsights, {
            clerkId1: myClerkId,
            clerkId2: args.otherClerkId,
        });

        // Return cached insights if fresh
        if (score?.insightsJson) {
            try {
                const cached = JSON.parse(score.insightsJson);
                if (cached.scoredAt === score.computedAt) {
                    return cached;
                }
            } catch {
                // Fall through to regenerate
            }
        }

        // Generate async; client should poll or re-query after a moment
        await ctx.scheduler.runAfter(0, internal.ai.insights.generateCompatibilityInsights, {
            clerkId1: myClerkId,
            clerkId2: args.otherClerkId,
        });

        // Return partial data while insights generate
        if (score) {
            return {
                narrative: null,
                totalScore: Math.round(score.totalScore),
                dimensions: [
                    { label: "Values alignment", score: Math.round(score.valuesScore), weight: "20%" },
                    { label: "Communication styles", score: Math.round(score.communicationScore), weight: "15%" },
                    { label: "Life stage", score: Math.round(score.lifeStageScore), weight: "20%" },
                    { label: "Lifestyle compatibility", score: Math.round(score.lifestyleScore), weight: "10%" },
                    { label: "Relationship goals", score: Math.round(score.goalsScore), weight: "15%" },
                    { label: "Shared interests", score: Math.round(score.interestsScore), weight: "10%" },
                    { label: "Emotional availability", score: Math.round(score.emotionalScore), weight: "5%" },
                    { label: "Sense of humor", score: Math.round(score.humorScore), weight: "5%" },
                ],
                generating: true,
            };
        }

        return null;
    },
});
