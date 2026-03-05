import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, query } from "../_generated/server";
import { internal } from "../_generated/api";

// ─── Week boundary helpers ────────────────────────────────────────────────────
function getCurrentWeekStart(): number {
    const now = new Date();
    const day = now.getUTCDay(); // 0=Sunday, 1=Monday...
    const daysToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + daysToMonday);
    monday.setUTCHours(0, 0, 0, 0);
    return monday.getTime();
}

function getPrevWeekStart(weekStart: number): number {
    return weekStart - 7 * 24 * 60 * 60 * 1000;
}

// ─── Groq helper (analysis model) ────────────────────────────────────────────
async function callGroqAnalysis(systemPrompt: string, userPrompt: string): Promise<string> {
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
            temperature: 0.4,
            max_tokens: 500,
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
export const getUserForInsight = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();
    },
});

export const getWeeklyProfileViews = internalQuery({
    args: { clerkId: v.string(), weekStart: v.number(), weekEnd: v.number() },
    handler: async (ctx, args) => {
        const views = await ctx.db
            .query("profile_views")
            .withIndex("by_viewed_time", (q) =>
                q.eq("viewedClerkId", args.clerkId)
                    .gte("viewedAt", args.weekStart)
                    .lt("viewedAt", args.weekEnd)
            )
            .collect();
        return views.length;
    },
});

export const getWeeklyLikesReceived = internalQuery({
    args: { clerkId: v.string(), weekStart: v.number(), weekEnd: v.number() },
    handler: async (ctx, args) => {
        const swipes = await ctx.db
            .query("swipes")
            .withIndex("by_to_time", (q) =>
                q.eq("toClerkId", args.clerkId)
                    .gte("createdAt", args.weekStart)
                    .lt("createdAt", args.weekEnd)
            )
            .filter((q) => q.eq(q.field("direction"), "right"))
            .collect();
        return swipes.length;
    },
});

export const getWeeklyMatchesMade = internalQuery({
    args: { clerkId: v.string(), weekStart: v.number(), weekEnd: v.number() },
    handler: async (ctx, args) => {
        const [asUser1, asUser2] = await Promise.all([
            ctx.db
                .query("matches")
                .withIndex("by_user1_time", (q) =>
                    q.eq("user1ClerkId", args.clerkId)
                        .gte("matchedAt", args.weekStart)
                        .lt("matchedAt", args.weekEnd)
                )
                .collect(),
            ctx.db
                .query("matches")
                .withIndex("by_user2_time", (q) =>
                    q.eq("user2ClerkId", args.clerkId)
                        .gte("matchedAt", args.weekStart)
                        .lt("matchedAt", args.weekEnd)
                )
                .collect(),
        ]);
        return asUser1.length + asUser2.length;
    },
});

export const getStoredWeekInsight = internalQuery({
    args: { clerkId: v.string(), weekStart: v.number() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("weekly_insights")
            .withIndex("by_clerk_week", (q) =>
                q.eq("clerkId", args.clerkId).eq("weekStart", args.weekStart)
            )
            .first();
    },
});

export const getAllOnboardedForInsights = internalQuery({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("onboardingCompleted"), true))
            .collect();
    },
});

// ─── Internal mutations ───────────────────────────────────────────────────────
export const upsertWeeklyInsight = internalMutation({
    args: {
        clerkId: v.string(),
        weekStart: v.number(),
        profileViews: v.number(),
        likesReceived: v.number(),
        matchesMade: v.number(),
        prevProfileViews: v.number(),
        prevLikesReceived: v.number(),
        prevMatchesMade: v.number(),
        whatsWorking: v.string(),
        recommendation: v.string(),
        aimQualityNote: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("weekly_insights")
            .withIndex("by_clerk_week", (q) =>
                q.eq("clerkId", args.clerkId).eq("weekStart", args.weekStart)
            )
            .first();

        const data = { ...args, generatedAt: Date.now() };

        if (existing) {
            await ctx.db.patch(existing._id, data);
        } else {
            await ctx.db.insert("weekly_insights", data);
        }
    },
});

// ─── Core action ─────────────────────────────────────────────────────────────
export const generateWeeklyInsightForUser = internalAction({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(internal.ai.weeklyInsights.getUserForInsight, {
            clerkId: args.clerkId,
        });
        if (!user || !user.onboardingCompleted) return;

        // M7: Skip users with no personality profile — not enough data for meaningful insights
        const personality = await ctx.runQuery(internal.ai.aims.getPersonalityProfileForAIM, {
            clerkId: args.clerkId,
        });
        if (!personality) return;

        const weekStart = getCurrentWeekStart();
        const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
        const prevWeekStart = getPrevWeekStart(weekStart);

        // Idempotent: skip if already generated this week
        const existing = await ctx.runQuery(internal.ai.weeklyInsights.getStoredWeekInsight, {
            clerkId: args.clerkId,
            weekStart,
        });
        if (existing) return;

        // Fetch current week metrics in parallel
        const [profileViews, likesReceived, matchesMade] = await Promise.all([
            ctx.runQuery(internal.ai.weeklyInsights.getWeeklyProfileViews, {
                clerkId: args.clerkId,
                weekStart,
                weekEnd,
            }),
            ctx.runQuery(internal.ai.weeklyInsights.getWeeklyLikesReceived, {
                clerkId: args.clerkId,
                weekStart,
                weekEnd,
            }),
            ctx.runQuery(internal.ai.weeklyInsights.getWeeklyMatchesMade, {
                clerkId: args.clerkId,
                weekStart,
                weekEnd,
            }),
        ]);

        // Previous week: use stored insight if it exists, else compute from raw data
        const prevStored = await ctx.runQuery(internal.ai.weeklyInsights.getStoredWeekInsight, {
            clerkId: args.clerkId,
            weekStart: prevWeekStart,
        });

        let prevProfileViews: number;
        let prevLikesReceived: number;
        let prevMatchesMade: number;

        if (prevStored) {
            prevProfileViews = prevStored.profileViews;
            prevLikesReceived = prevStored.likesReceived;
            prevMatchesMade = prevStored.matchesMade;
        } else {
            [prevProfileViews, prevLikesReceived, prevMatchesMade] = await Promise.all([
                ctx.runQuery(internal.ai.weeklyInsights.getWeeklyProfileViews, {
                    clerkId: args.clerkId,
                    weekStart: prevWeekStart,
                    weekEnd: weekStart,
                }),
                ctx.runQuery(internal.ai.weeklyInsights.getWeeklyLikesReceived, {
                    clerkId: args.clerkId,
                    weekStart: prevWeekStart,
                    weekEnd: weekStart,
                }),
                ctx.runQuery(internal.ai.weeklyInsights.getWeeklyMatchesMade, {
                    clerkId: args.clerkId,
                    weekStart: prevWeekStart,
                    weekEnd: weekStart,
                }),
            ]);
        }

        const name = user.firstName || user.name;
        const trend = (curr: number, prev: number) =>
            prev === 0 ? (curr > 0 ? "up" : "flat") : curr > prev ? "up" : curr < prev ? "down" : "flat";

        const viewsTrend = profileViews - prevProfileViews;
        const likesTrend = likesReceived - prevLikesReceived;
        const matchesTrend = matchesMade - prevMatchesMade;

        const systemPrompt =
            "You are a data-driven dating coach for Align, an Indian dating app. " +
            "Analyse a user's weekly activity and return warm, specific, and actionable insights. " +
            "Always respond with valid JSON only — no extra text, no markdown.";

        const userPrompt =
            `User: ${name}.\n\n` +
            `This week's stats:\n` +
            `- Profile views: ${profileViews} (${viewsTrend >= 0 ? "+" : ""}${viewsTrend} vs last week, trend: ${trend(profileViews, prevProfileViews)})\n` +
            `- Likes received: ${likesReceived} (${likesTrend >= 0 ? "+" : ""}${likesTrend} vs last week, trend: ${trend(likesReceived, prevLikesReceived)})\n` +
            `- Matches made: ${matchesMade} (${matchesTrend >= 0 ? "+" : ""}${matchesTrend} vs last week, trend: ${trend(matchesMade, prevMatchesMade)})\n\n` +
            `Return a JSON object with exactly these three fields:\n` +
            `- "whatsWorking": 1-2 sentences about what's going well. Reference the actual numbers.\n` +
            `- "recommendation": 1-2 sentences with the single most impactful action to improve next week. ` +
            `Be specific (e.g. add a photo, update bio, send more messages). ` +
            `If views are low, suggest profile improvements. If likes are low despite views, suggest bio/photo changes. ` +
            `If matches are low despite likes, encourage more engagement.\n` +
            `- "aimQualityNote": 1 encouraging sentence about how their activity level helps improve their AI match quality.\n\n` +
            `Return only the JSON object.`;

        const fallback = {
            whatsWorking: "You're on Align and every week of activity helps the AI understand you better.",
            recommendation: "Try adding a fresh photo or updating a prompt answer to boost your profile views this week.",
            aimQualityNote: "The more you engage, the smarter your AI-suggested matches become.",
        };

        let parsed: typeof fallback = fallback;
        try {
            const raw = await callGroqAnalysis(systemPrompt, userPrompt);
            const data = JSON.parse(raw);
            parsed = {
                whatsWorking:
                    typeof data.whatsWorking === "string" && data.whatsWorking.trim()
                        ? data.whatsWorking.trim()
                        : fallback.whatsWorking,
                recommendation:
                    typeof data.recommendation === "string" && data.recommendation.trim()
                        ? data.recommendation.trim()
                        : fallback.recommendation,
                aimQualityNote:
                    typeof data.aimQualityNote === "string" && data.aimQualityNote.trim()
                        ? data.aimQualityNote.trim()
                        : fallback.aimQualityNote,
            };
        } catch {
            // fallback already set
        }

        await ctx.runMutation(internal.ai.weeklyInsights.upsertWeeklyInsight, {
            clerkId: args.clerkId,
            weekStart,
            profileViews,
            likesReceived,
            matchesMade,
            prevProfileViews,
            prevLikesReceived,
            prevMatchesMade,
            ...parsed,
        });
    },
});

// ─── Weekly sweep: generate insights for all onboarded users ──────────────────
export const generateWeeklyInsightsForAll = internalAction({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.runQuery(
            internal.ai.weeklyInsights.getAllOnboardedForInsights,
            {}
        );
        // Stagger by 3s per user to avoid a Groq burst
        for (let i = 0; i < users.length; i++) {
            await ctx.scheduler.runAfter(
                i * 3000,
                internal.ai.weeklyInsights.generateWeeklyInsightForUser,
                { clerkId: users[i].clerkId }
            );
        }
    },
});

// ─── Public API ───────────────────────────────────────────────────────────────
export const getMyLatestWeeklyInsight = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("weekly_insights")
            .withIndex("by_clerk_week", (q) => q.eq("clerkId", identity.subject))
            .order("desc")
            .first();
    },
});

export const triggerWeeklyInsight = action({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");
        await ctx.scheduler.runAfter(
            0,
            internal.ai.weeklyInsights.generateWeeklyInsightForUser,
            { clerkId: identity.subject }
        );
    },
});
