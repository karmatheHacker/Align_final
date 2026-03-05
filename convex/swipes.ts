import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const recordSwipe = mutation({
    args: {
        toClerkId: v.string(),
        direction: v.union(v.literal("left"), v.literal("right")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const fromClerkId = identity.subject;
        if (fromClerkId === args.toClerkId) return { isMatch: false };

        // H4: Validate target user exists
        const targetUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.toClerkId))
            .first();
        if (!targetUser) return { isMatch: false };

        // Upsert: update direction if already swiped
        const existing = await ctx.db
            .query("swipes")
            .withIndex("by_pair", (q) =>
                q.eq("fromClerkId", fromClerkId).eq("toClerkId", args.toClerkId)
            )
            .first();

        if (existing) {
            // Only patch direction — preserve original createdAt
            await ctx.db.patch(existing._id, {
                direction: args.direction,
            });
            // Fall through to mutual-match check so a changed left→right swipe creates a match
        } else {
            await ctx.db.insert("swipes", {
                fromClerkId,
                toClerkId: args.toClerkId,
                direction: args.direction,
                createdAt: Date.now(),
            });
        }

        // Check for mutual right swipe → create match
        if (args.direction === "right") {
            const otherSwipe = await ctx.db
                .query("swipes")
                .withIndex("by_pair", (q) =>
                    q.eq("fromClerkId", args.toClerkId).eq("toClerkId", fromClerkId)
                )
                .first();

            if (otherSwipe?.direction === "right") {
                // Store pair in consistent sorted order
                const [u1, u2] = [fromClerkId, args.toClerkId].sort();
                const existingMatch = await ctx.db
                    .query("matches")
                    .withIndex("by_pair", (q) =>
                        q.eq("user1ClerkId", u1).eq("user2ClerkId", u2)
                    )
                    .first();

                // Guard against duplicate match creation (race condition)
                if (existingMatch) {
                    return { isMatch: true, matchId: existingMatch._id };
                }

                const matchId = await ctx.db.insert("matches", {
                    user1ClerkId: u1,
                    user2ClerkId: u2,
                    matchedAt: Date.now(),
                    icebreakersGenerated: false,
                });
                // Trigger icebreaker generation asynchronously
                await ctx.scheduler.runAfter(
                    0,
                    internal.ai.icebreakers.generateIcebreakersForMatch,
                    { matchId }
                );
                return { isMatch: true, matchId };
            }
        }

        return { isMatch: false };
    },
});

export const recordProfileView = mutation({
    args: { viewedClerkId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const viewerClerkId = identity.subject;
        if (viewerClerkId === args.viewedClerkId) return;

        // One record per pair per calendar day — use index range on viewedAt
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);

        const existing = await ctx.db
            .query("profile_views")
            .withIndex("by_pair_day", (q) =>
                q.eq("viewerClerkId", viewerClerkId)
                    .eq("viewedClerkId", args.viewedClerkId)
                    .gte("viewedAt", dayStart.getTime())
            )
            .first();

        if (!existing) {
            await ctx.db.insert("profile_views", {
                viewerClerkId,
                viewedClerkId: args.viewedClerkId,
                viewedAt: Date.now(),
            });
        }
    },
});

export const getMatchByPair = internalQuery({
    args: { u1: v.string(), u2: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("matches")
            .withIndex("by_pair", (q) =>
                q.eq("user1ClerkId", args.u1).eq("user2ClerkId", args.u2)
            )
            .first();
    },
});

export const getMatchWithUser = query({
    args: { otherClerkId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const [u1, u2] = [identity.subject, args.otherClerkId].sort();
        return await ctx.db
            .query("matches")
            .withIndex("by_pair", (q) =>
                q.eq("user1ClerkId", u1).eq("user2ClerkId", u2)
            )
            .first();
    },
});

// Returns users who right-swiped the current user and haven't matched yet
export const getPendingLikes = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const myClerkId = identity.subject;

        // Who swiped right on me?
        const inboundSwipes = await ctx.db
            .query("swipes")
            .withIndex("by_to", (q) => q.eq("toClerkId", myClerkId))
            .collect();

        const rightSwipes = inboundSwipes.filter((s) => s.direction === "right");

        // Who am I already matched with?
        const myMatches1 = await ctx.db
            .query("matches")
            .withIndex("by_user1", (q) => q.eq("user1ClerkId", myClerkId))
            .collect();
        const myMatches2 = await ctx.db
            .query("matches")
            .withIndex("by_user2", (q) => q.eq("user2ClerkId", myClerkId))
            .collect();
        const matchedClerkIds = new Set([
            ...myMatches1.map((m) => m.user2ClerkId),
            ...myMatches2.map((m) => m.user1ClerkId),
        ]);

        // Enrich and filter out already-matched
        const enriched = await Promise.all(
            rightSwipes
                .filter((s) => !matchedClerkIds.has(s.fromClerkId))
                .map(async (s) => {
                    const user = await ctx.db
                        .query("users")
                        .withIndex("by_clerkId", (q) => q.eq("clerkId", s.fromClerkId))
                        .first();
                    if (!user) return null;
                    return {
                        _id: user._id,
                        clerkId: user.clerkId,
                        name: user.firstName || user.name,
                        photos: user.photos || [],
                        swipedAt: s.createdAt,
                    };
                })
        );

        return enriched
            .filter((u): u is NonNullable<typeof u> => u !== null)
            .sort((a, b) => b.swipedAt - a.swipedAt);
    },
});

export const getMatches = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const clerkId = identity.subject;

        const asUser1 = await ctx.db
            .query("matches")
            .withIndex("by_user1", (q) => q.eq("user1ClerkId", clerkId))
            .collect();

        const asUser2 = await ctx.db
            .query("matches")
            .withIndex("by_user2", (q) => q.eq("user2ClerkId", clerkId))
            .collect();

        const allMatches = [...asUser1, ...asUser2];

        const enriched = await Promise.all(
            allMatches.map(async (match) => {
                const otherClerkId =
                    match.user1ClerkId === clerkId
                        ? match.user2ClerkId
                        : match.user1ClerkId;

                const otherUser = await ctx.db
                    .query("users")
                    .withIndex("by_clerkId", (q) => q.eq("clerkId", otherClerkId))
                    .first();

                return {
                    _id: match._id,
                    matchedAt: match.matchedAt,
                    icebreakersGenerated: match.icebreakersGenerated,
                    otherUser: otherUser
                        ? {
                              clerkId: otherUser.clerkId,
                              firstName: otherUser.firstName || otherUser.name,
                              photos: otherUser.photos || [],
                          }
                        : null,
                };
            })
        );

        return enriched.filter((m) => m.otherUser !== null);
    },
});
