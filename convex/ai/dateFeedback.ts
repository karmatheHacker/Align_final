import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";

// ─── Submit feedback ──────────────────────────────────────────────────────────
export const submitDateFeedback = mutation({
    args: {
        toClerkId: v.string(),
        thumbsUp: v.boolean(),
        whatWorked: v.optional(v.string()),
        whatDidnt: v.optional(v.string()),
        continuing: v.optional(v.union(v.literal("yes"), v.literal("no"), v.literal("maybe"))),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const fromClerkId = identity.subject;
        if (fromClerkId === args.toClerkId) throw new Error("Cannot submit feedback about yourself");

        // Verify the two users actually matched before accepting feedback
        const [u1, u2] = [fromClerkId, args.toClerkId].sort();
        const match = await ctx.db
            .query("matches")
            .withIndex("by_pair", (q) =>
                q.eq("user1ClerkId", u1).eq("user2ClerkId", u2)
            )
            .first();
        if (!match) throw new Error("No match found with this user");

        // Upsert: one feedback entry per ordered pair (from → to)
        const existing = await ctx.db
            .query("date_feedback")
            .withIndex("by_pair", (q) =>
                q.eq("fromClerkId", fromClerkId).eq("toClerkId", args.toClerkId)
            )
            .first();

        const data = {
            fromClerkId,
            toClerkId: args.toClerkId,
            thumbsUp: args.thumbsUp,
            whatWorked: args.whatWorked,
            whatDidnt: args.whatDidnt,
            continuing: args.continuing,
            createdAt: Date.now(),
        };

        if (existing) {
            await ctx.db.patch(existing._id, data);
        } else {
            await ctx.db.insert("date_feedback", data);
        }

        // Force preference re-analysis to incorporate this real-world signal immediately
        // (bypasses the 24h cooldown since a date outcome is high-value new data)
        await ctx.scheduler.runAfter(
            0,
            internal.ai.preferences.analyzeAndLearnPreferences,
            { clerkId: fromClerkId, force: true }
        );

        return { success: true };
    },
});

// ─── Queries ──────────────────────────────────────────────────────────────────
export const getMySubmittedFeedback = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const feedback = await ctx.db
            .query("date_feedback")
            .withIndex("by_from", (q) => q.eq("fromClerkId", identity.subject))
            .collect();

        const enriched = await Promise.all(
            feedback.map(async (f) => {
                const target = await ctx.db
                    .query("users")
                    .withIndex("by_clerkId", (q) => q.eq("clerkId", f.toClerkId))
                    .first();
                return {
                    _id: f._id,
                    toClerkId: f.toClerkId,
                    thumbsUp: f.thumbsUp,
                    whatWorked: f.whatWorked,
                    whatDidnt: f.whatDidnt,
                    continuing: f.continuing,
                    createdAt: f.createdAt,
                    targetName: target?.firstName || target?.name || "Unknown",
                    targetPhoto: target?.photos?.[0] ?? null,
                };
            })
        );

        return enriched.sort((a, b) => b.createdAt - a.createdAt);
    },
});

export const getFeedbackForMatch = query({
    args: { otherClerkId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("date_feedback")
            .withIndex("by_pair", (q) =>
                q.eq("fromClerkId", identity.subject).eq("toClerkId", args.otherClerkId)
            )
            .first();
    },
});

// Returns matches where current user hasn't submitted feedback yet
// (used to surface the "How did your date go?" prompt in the UI)
export const getMatchesAwaitingFeedback = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const clerkId = identity.subject;

        // Get all matches
        const [asUser1, asUser2] = await Promise.all([
            ctx.db
                .query("matches")
                .withIndex("by_user1", (q) => q.eq("user1ClerkId", clerkId))
                .collect(),
            ctx.db
                .query("matches")
                .withIndex("by_user2", (q) => q.eq("user2ClerkId", clerkId))
                .collect(),
        ]);
        const allMatches = [...asUser1, ...asUser2];

        // Get all feedback I've already submitted
        const submittedFeedback = await ctx.db
            .query("date_feedback")
            .withIndex("by_from", (q) => q.eq("fromClerkId", clerkId))
            .collect();
        const feedbackGivenTo = new Set(submittedFeedback.map((f) => f.toClerkId));

        // Filter matches with no feedback yet and that are at least 24h old
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const awaiting = allMatches.filter((m) => {
            const otherClerkId = m.user1ClerkId === clerkId ? m.user2ClerkId : m.user1ClerkId;
            return m.matchedAt < cutoff && !feedbackGivenTo.has(otherClerkId);
        });

        // Enrich with other user's basic info
        const enriched = await Promise.all(
            awaiting.map(async (m) => {
                const otherClerkId = m.user1ClerkId === clerkId ? m.user2ClerkId : m.user1ClerkId;
                const other = await ctx.db
                    .query("users")
                    .withIndex("by_clerkId", (q) => q.eq("clerkId", otherClerkId))
                    .first();
                if (!other) return null;
                return {
                    matchId: m._id,
                    matchedAt: m.matchedAt,
                    otherClerkId,
                    otherName: other.firstName || other.name,
                    otherPhoto: other.photos?.[0] ?? null,
                };
            })
        );

        return enriched.filter((e): e is NonNullable<typeof e> => e !== null);
    },
});
