import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calculateAge(birthday: string | undefined): number {
    if (!birthday) return 0;
    try {
        const birthDate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    } catch {
        return 0;
    }
}

// Returns keys whose frequency meets or exceeds the threshold, sorted by frequency
function topByFrequency(freq: Record<string, number>, threshold: number): string[] {
    return Object.entries(freq)
        .filter(([, count]) => count >= threshold)
        .sort(([, a], [, b]) => b - a)
        .map(([key]) => key);
}

// ─── Internal queries ─────────────────────────────────────────────────────────
export const getLearnedPreferences = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("learned_preferences")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();
    },
});

export const getRightSwipeTargetIds = internalQuery({
    args: { fromClerkId: v.string() },
    handler: async (ctx, args) => {
        const swipes = await ctx.db
            .query("swipes")
            .withIndex("by_from", (q) => q.eq("fromClerkId", args.fromClerkId))
            .collect();
        return swipes.filter((s) => s.direction === "right").map((s) => s.toClerkId);
    },
});

// Positive date feedback targets (thumbsUp = true) — used as 2× weight signals
export const getPositiveFeedbackTargetIds = internalQuery({
    args: { fromClerkId: v.string() },
    handler: async (ctx, args) => {
        const feedback = await ctx.db
            .query("date_feedback")
            .withIndex("by_from", (q) => q.eq("fromClerkId", args.fromClerkId))
            .collect();
        return feedback.filter((f) => f.thumbsUp).map((f) => f.toClerkId);
    },
});

export const getLikedProfileData = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();
        if (!user) return null;

        const personality = await ctx.db
            .query("personality_profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        return {
            clerkId: user.clerkId,
            birthday: user.birthday,
            education: user.education,
            religion: user.religion,
            datingIntention: user.datingIntention,
            lifeStage: personality?.lifeStage,
            values: personality?.values ?? [],
        };
    },
});

// ─── Internal mutations ───────────────────────────────────────────────────────
export const upsertLearnedPreferences = internalMutation({
    args: {
        clerkId: v.string(),
        preferredAgeMin: v.optional(v.number()),
        preferredAgeMax: v.optional(v.number()),
        topEducationLevels: v.array(v.string()),
        topReligions: v.array(v.string()),
        topLifeStages: v.array(v.string()),
        topValues: v.array(v.string()),
        topDatingIntentions: v.array(v.string()),
        swipesAnalyzed: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("learned_preferences")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        const data = { ...args, lastComputedAt: Date.now() };

        if (existing) {
            await ctx.db.patch(existing._id, data);
        } else {
            await ctx.db.insert("learned_preferences", data);
        }
    },
});

// ─── Core action ─────────────────────────────────────────────────────────────
export const analyzeAndLearnPreferences = internalAction({
    args: { clerkId: v.string(), force: v.optional(v.boolean()) },
    handler: async (ctx, args) => {
        // Idempotent: skip if computed within the last 24 hours (unless forced by feedback submission)
        const existing = await ctx.runQuery(internal.ai.preferences.getLearnedPreferences, {
            clerkId: args.clerkId,
        });
        const RECOMPUTE_INTERVAL_MS = 24 * 60 * 60 * 1000;
        if (!args.force && existing && Date.now() - existing.lastComputedAt < RECOMPUTE_INTERVAL_MS) return;

        // Get right-swiped IDs and positive date feedback IDs in parallel
        const [rightSwipeIds, positiveFeedbackIds] = await Promise.all([
            ctx.runQuery(internal.ai.preferences.getRightSwipeTargetIds, { fromClerkId: args.clerkId }),
            ctx.runQuery(internal.ai.preferences.getPositiveFeedbackTargetIds, { fromClerkId: args.clerkId }),
        ]);

        // Minimum 3 right swipes to learn anything meaningful
        const MIN_SWIPES = 3;
        if (rightSwipeIds.length < MIN_SWIPES) return;

        // Profiles with a positive date feedback get 3× weight (real-world validation)
        const positiveFeedbackSet = new Set(positiveFeedbackIds);

        // Fetch profile data for each liked person
        const likedProfiles: Array<{
            clerkId: string;
            birthday?: string;
            education?: string | null;
            religion?: string | null;
            datingIntention?: string | null;
            lifeStage?: string;
            values: string[];
        }> = [];

        for (const clerkId of rightSwipeIds) {
            const data = await ctx.runQuery(internal.ai.preferences.getLikedProfileData, { clerkId });
            if (data) likedProfiles.push(data);
        }

        if (likedProfiles.length < MIN_SWIPES) return;

        // ── Aggregate trait frequencies (positive feedback = 3× weight) ───────
        const ages: number[] = [];
        const educations: Record<string, number> = {};
        const religions: Record<string, number> = {};
        const datingIntentions: Record<string, number> = {};
        const lifeStages: Record<string, number> = {};
        const values: Record<string, number> = {};

        for (const profile of likedProfiles) {
            const weight = positiveFeedbackSet.has(profile.clerkId) ? 3 : 1;

            const age = calculateAge(profile.birthday);
            // Push age `weight` times so weighted mean/stdev is correct
            if (age >= 18) {
                for (let i = 0; i < weight; i++) ages.push(age);
            }

            if (profile.education) {
                educations[profile.education] = (educations[profile.education] ?? 0) + weight;
            }
            if (profile.religion) {
                religions[profile.religion] = (religions[profile.religion] ?? 0) + weight;
            }
            if (profile.datingIntention) {
                datingIntentions[profile.datingIntention] = (datingIntentions[profile.datingIntention] ?? 0) + weight;
            }
            if (profile.lifeStage) {
                lifeStages[profile.lifeStage] = (lifeStages[profile.lifeStage] ?? 0) + weight;
            }
            for (const val of profile.values) {
                values[val] = (values[val] ?? 0) + weight;
            }
        }

        // Threshold: must appear in at least 25% of liked profiles (min 1)
        const threshold = Math.max(1, Math.floor(likedProfiles.length * 0.25));

        const topEducationLevels = topByFrequency(educations, threshold).slice(0, 3);
        const topReligions = topByFrequency(religions, threshold).slice(0, 3);
        const topDatingIntentions = topByFrequency(datingIntentions, threshold).slice(0, 3);
        const topLifeStages = topByFrequency(lifeStages, threshold).slice(0, 3);
        const topValues = topByFrequency(values, threshold).slice(0, 6);

        // Age range: mean ± 1.5 standard deviations, clamped to 18+
        let preferredAgeMin: number | undefined;
        let preferredAgeMax: number | undefined;
        if (ages.length >= 3) {
            const mean = ages.reduce((a, b) => a + b, 0) / ages.length;
            const variance = ages.reduce((acc, a) => acc + (a - mean) ** 2, 0) / ages.length;
            const stdev = Math.sqrt(variance);
            preferredAgeMin = Math.max(18, Math.round(mean - 1.5 * stdev));
            preferredAgeMax = Math.round(mean + 1.5 * stdev);
        }

        await ctx.runMutation(internal.ai.preferences.upsertLearnedPreferences, {
            clerkId: args.clerkId,
            preferredAgeMin,
            preferredAgeMax,
            topEducationLevels,
            topReligions,
            topLifeStages,
            topValues,
            topDatingIntentions,
            swipesAnalyzed: likedProfiles.length,
        });
    },
});

// ─── Public action ────────────────────────────────────────────────────────────
export const triggerPreferenceAnalysis = action({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");
        await ctx.scheduler.runAfter(0, internal.ai.preferences.analyzeAndLearnPreferences, {
            clerkId: identity.subject,
        });
    },
});
