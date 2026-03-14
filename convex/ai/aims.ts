import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, mutation, query } from "../_generated/server";
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
            temperature: 0.7,
            max_tokens: 150,
        }),
        signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
    if (!response.ok) {
        throw new Error(`Groq error ${response.status}`);
    }
    const data: any = await response.json();
    return data.choices[0].message.content.trim();
}

// ─── Preference match bonus (Phase 10) ───────────────────────────────────────
function computePreferenceBonus(candidate: any, candidatePersonality: any, prefs: any): number {
    let bonus = 0;

    // Age preference (±5 pts)
    const age = calculateAge(candidate.birthday);
    if (prefs.preferredAgeMin != null && prefs.preferredAgeMax != null && age >= 18) {
        if (age >= prefs.preferredAgeMin && age <= prefs.preferredAgeMax) bonus += 5;
    }

    // Religion match (+4)
    if (candidate.religion && prefs.topReligions.includes(candidate.religion)) bonus += 4;

    // Education match (+3)
    if (candidate.education && prefs.topEducationLevels.includes(candidate.education)) bonus += 3;

    // Dating intention match (+5)
    if (candidate.datingIntention && prefs.topDatingIntentions.includes(candidate.datingIntention)) bonus += 5;

    // Life stage match via personality (+3)
    if (candidatePersonality.lifeStage && prefs.topLifeStages.includes(candidatePersonality.lifeStage)) bonus += 3;

    // Values overlap — up to 5 pts (2 per shared value, capped)
    const valueOverlap = candidatePersonality.values.filter((v: string) =>
        prefs.topValues.includes(v)
    ).length;
    bonus += Math.min(5, valueOverlap * 2);

    return bonus; // practical max ~25, typical 0-12
}

// ─── Adaptive weighting (Phase 10 integration) ────────────────────────────────
function getAdaptiveWeights(accountAgeMs: number): { profileWeight: number; behaviorWeight: number } {
    const days = accountAgeMs / (1000 * 60 * 60 * 24);
    if (days < 14) {
        return { profileWeight: 1.0, behaviorWeight: 0.0 };
    } else if (days < 30) {
        return { profileWeight: 0.7, behaviorWeight: 0.3 };
    } else {
        return { profileWeight: 0.4, behaviorWeight: 0.6 };
    }
}

function calculateAge(birthday: string | null | undefined): number {
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

// ─── Internal queries ─────────────────────────────────────────────────────────
export const getUserForAIMs = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();
    },
});

export const getAllCandidates = internalQuery({
    args: { targetGender: v.string(), excludeClerkIds: v.array(v.string()) },
    handler: async (ctx, args) => {
        const users = await ctx.db
            .query("users")
            .filter((q) =>
                q.and(
                    q.eq(q.field("gender"), args.targetGender),
                    q.eq(q.field("onboardingCompleted"), true)
                )
            )
            .collect();
        const excludeSet = new Set(args.excludeClerkIds);
        return users.filter((u) => !excludeSet.has(u.clerkId));
    },
});

export const getSwipedClerkIds = internalQuery({
    args: { fromClerkId: v.string() },
    handler: async (ctx, args) => {
        const swipes = await ctx.db
            .query("swipes")
            .withIndex("by_from", (q) => q.eq("fromClerkId", args.fromClerkId))
            .collect();
        return swipes.map((s) => s.toClerkId);
    },
});

export const getMatchedClerkIds = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const [asUser1, asUser2] = await Promise.all([
            ctx.db
                .query("matches")
                .withIndex("by_user1", (q) => q.eq("user1ClerkId", args.clerkId))
                .collect(),
            ctx.db
                .query("matches")
                .withIndex("by_user2", (q) => q.eq("user2ClerkId", args.clerkId))
                .collect(),
        ]);
        return [
            ...asUser1.map((m) => m.user2ClerkId),
            ...asUser2.map((m) => m.user1ClerkId),
        ];
    },
});

export const getPersonalityProfileForAIM = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("personality_profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();
    },
});

export const getCachedCompatibilityForAIM = internalQuery({
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

export const getIncomingRightSwipes = internalQuery({
    args: { toClerkId: v.string() },
    handler: async (ctx, args) => {
        const swipes = await ctx.db
            .query("swipes")
            .withIndex("by_to", (q) => q.eq("toClerkId", args.toClerkId))
            .collect();
        return swipes.filter((s) => s.direction === "right").map((s) => s.fromClerkId);
    },
});

export const getRecentProfileViewers = internalQuery({
    args: { viewedClerkId: v.string() },
    handler: async (ctx, args) => {
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const views = await ctx.db
            .query("profile_views")
            .withIndex("by_viewed", (q) => q.eq("viewedClerkId", args.viewedClerkId))
            .collect();
        return views.filter((v) => v.viewedAt > cutoff).map((v) => v.viewerClerkId);
    },
});

export const getActiveUsersLast7Days = internalQuery({
    args: {},
    handler: async (ctx) => {
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const allUsers = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("onboardingCompleted"), true))
            .collect();
        return allUsers.filter((u) => (u.updatedAt ?? u.createdAt) >= cutoff);
    },
});

// ─── Internal mutations ───────────────────────────────────────────────────────
export const clearUnseenAIMs = internalMutation({
    args: { ownerClerkId: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("ai_matches")
            .withIndex("by_owner", (q) => q.eq("ownerClerkId", args.ownerClerkId))
            .collect();
        for (const aim of existing) {
            if (!aim.shown) {
                await ctx.db.delete(aim._id);
            }
        }
    },
});

export const insertAIM = internalMutation({
    args: {
        ownerClerkId: v.string(),
        targetClerkId: v.string(),
        compatibilityScore: v.number(),
        explanation: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        await ctx.db.insert("ai_matches", {
            ownerClerkId: args.ownerClerkId,
            targetClerkId: args.targetClerkId,
            compatibilityScore: args.compatibilityScore,
            explanation: args.explanation,
            shown: false,
            createdAt: now,
            expiresAt: now + 24 * 60 * 60 * 1000,
        });
    },
});

// ─── Core AIM generation action ───────────────────────────────────────────────
export const generateAIMsForUser = internalAction({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(internal.ai.aims.getUserForAIMs, {
            clerkId: args.clerkId,
        });
        if (!user || !user.onboardingCompleted || !user.gender) return;

        const myPersonality = await ctx.runQuery(
            internal.ai.aims.getPersonalityProfileForAIM,
            { clerkId: args.clerkId }
        );
        if (!myPersonality) return;

        const targetGender = user.gender === "man" ? "woman" : "man";
        const accountAgeMs = Date.now() - (user.createdAt ?? Date.now());
        const { profileWeight, behaviorWeight } = getAdaptiveWeights(accountAgeMs);

        // Exclusion list: already swiped + already matched + self
        const [swipedIds, matchedIds] = await Promise.all([
            ctx.runQuery(internal.ai.aims.getSwipedClerkIds, { fromClerkId: args.clerkId }),
            ctx.runQuery(internal.ai.aims.getMatchedClerkIds, { clerkId: args.clerkId }),
        ]);
        const excludeIds = [...new Set([...swipedIds, ...matchedIds, args.clerkId])];

        const candidates = await ctx.runQuery(internal.ai.aims.getAllCandidates, {
            targetGender,
            excludeClerkIds: excludeIds,
        });
        if (candidates.length === 0) return;

        // Behavioral signals + learned preferences (fetched in parallel)
        const [incomingRightSwipes, recentViewers, learnedPrefs] = await Promise.all([
            ctx.runQuery(internal.ai.aims.getIncomingRightSwipes, { toClerkId: args.clerkId }),
            ctx.runQuery(internal.ai.aims.getRecentProfileViewers, { viewedClerkId: args.clerkId }),
            ctx.runQuery(internal.ai.preferences.getLearnedPreferences, { clerkId: args.clerkId }),
        ]);
        const incomingRightSwipeSet = new Set(incomingRightSwipes);
        const recentViewerSet = new Set(recentViewers);

        // H2: Batch-fetch all candidate personalities and compat scores in parallel
        const [personalityResults, compatResults] = await Promise.all([
            Promise.all(candidates.map((c) =>
                ctx.runQuery(internal.ai.aims.getPersonalityProfileForAIM, { clerkId: c.clerkId })
            )),
            Promise.all(candidates.map((c) =>
                ctx.runQuery(internal.ai.aims.getCachedCompatibilityForAIM, {
                    clerkId1: args.clerkId,
                    clerkId2: c.clerkId,
                })
            )),
        ]);
        const personalityMap = new Map<string, NonNullable<(typeof personalityResults)[0]>>();
        const compatMap = new Map<string, NonNullable<(typeof compatResults)[0]>>();
        for (let i = 0; i < candidates.length; i++) {
            if (personalityResults[i]) personalityMap.set(candidates[i].clerkId, personalityResults[i]!);
            if (compatResults[i]) compatMap.set(candidates[i].clerkId, compatResults[i]!);
        }

        // Score each candidate
        const scored: Array<{
            clerkId: string;
            score: number;
            compatScore: number;
            name: string;
            photos: string[];
            personalityValues: string[];
            personalityCommunication: string;
            personalityLifeStage: string;
            personalityHumor: string;
            personalityInterests: string[];
        }> = [];

        for (const candidate of candidates) {
            const candidatePersonality = personalityMap.get(candidate.clerkId);
            if (!candidatePersonality) continue;

            const cached = compatMap.get(candidate.clerkId);

            // Stale if candidate's profile OR personality was updated after the score was computed
            const candidateProfileVersion = candidate.updatedAt ?? candidate.createdAt;
            const personalityVersion = candidatePersonality.lastComputedAt ?? 0;
            const latestVersion = Math.max(candidateProfileVersion ?? 0, personalityVersion);
            const scoreIsFresh = cached && cached.computedAt >= latestVersion;
            let compatScore = scoreIsFresh ? cached!.totalScore : 50;

            // Schedule (re)compute whenever score is missing or stale
            if (!scoreIsFresh) {
                await ctx.scheduler.runAfter(
                    0,
                    internal.ai.compatibility.computeCompatibilityScore,
                    { user1ClerkId: args.clerkId, user2ClerkId: candidate.clerkId }
                );
            }

            // Behavioral score (0–100)
            let behaviorScore = 40; // baseline
            if (incomingRightSwipeSet.has(candidate.clerkId)) behaviorScore += 40;
            if (recentViewerSet.has(candidate.clerkId)) behaviorScore += 20;
            behaviorScore = Math.min(100, behaviorScore);

            // Preference match bonus from learned behavioral patterns (0–25 pts)
            const preferenceBonus = learnedPrefs
                ? computePreferenceBonus(candidate, candidatePersonality, learnedPrefs)
                : 0;

            const finalScore = Math.min(
                100,
                profileWeight * compatScore + behaviorWeight * behaviorScore + preferenceBonus
            );

            scored.push({
                clerkId: candidate.clerkId,
                score: finalScore,
                compatScore,
                name: candidate.firstName || candidate.name,
                photos: candidate.photos || [],
                personalityValues: candidatePersonality.values,
                personalityCommunication: candidatePersonality.communicationStyle,
                personalityLifeStage: candidatePersonality.lifeStage,
                personalityHumor: candidatePersonality.humor,
                personalityInterests: candidatePersonality.interestVector,
            });
        }

        if (scored.length === 0) return;

        scored.sort((a, b) => b.score - a.score);

        // Score distribution logging
        const allScores = scored.map(s => s.compatScore);
        const minScore = Math.min(...allScores);
        const maxScore = Math.max(...allScores);
        const avgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
        // AIM scoring complete: scored.length candidates processed

        const top2 = scored.slice(0, 2);

        const systemPrompt =
            "You are a warm, insightful matchmaker for Align, an Indian dating app. " +
            "Write a concise 2-sentence explanation of why two people would be a great match. " +
            "Be genuine and specific — reference shared values, communication style, or life goals. " +
            "Never use generic phrases like 'you have a lot in common'. " +
            "Write in second person addressed to the first person ('You both...' or 'Your...').";

        // Clear previous unseen AIMs before inserting fresh ones
        await ctx.runMutation(internal.ai.aims.clearUnseenAIMs, { ownerClerkId: args.clerkId });

        for (const pick of top2) {
            const userPrompt =
                `Person A (the user): values: ${myPersonality.values.join(", ")}, ` +
                `communication: ${myPersonality.communicationStyle}, life stage: ${myPersonality.lifeStage}, ` +
                `humor: ${myPersonality.humor}, interests: ${myPersonality.interestVector.slice(0, 5).join(", ")}.\n\n` +
                `Person B (potential match): ${pick.name}, values: ${pick.personalityValues.join(", ")}, ` +
                `communication: ${pick.personalityCommunication}, life stage: ${pick.personalityLifeStage}, ` +
                `humor: ${pick.personalityHumor}, interests: ${pick.personalityInterests.slice(0, 5).join(", ")}.\n\n` +
                `Compatibility score: ${Math.round(pick.compatScore)}%. ` +
                `Write exactly 2 sentences explaining why Person A and Person B would be a great match.`;

            let explanation: string;
            try {
                const raw = await callGroqCopy(systemPrompt, userPrompt);
                // Clamp to 2 sentences
                const sentences = raw.split(/(?<=[.!?])\s+/).filter(Boolean);
                explanation = sentences.slice(0, 2).join(" ");
                if (explanation && !explanation.match(/[.!?]$/)) explanation += ".";
            } catch {
                explanation = `You share ${Math.round(pick.compatScore)}% compatibility — your values and outlook on life align beautifully.`;
            }

            await ctx.runMutation(internal.ai.aims.insertAIM, {
                ownerClerkId: args.clerkId,
                targetClerkId: pick.clerkId,
                compatibilityScore: Math.round(pick.compatScore), // pure score, not inflated by behavioral bonus
                explanation,
            });
        }

        // Refresh preference learning after each AIM cycle (idempotent — 24h cooldown inside)
        await ctx.scheduler.runAfter(0, internal.ai.preferences.analyzeAndLearnPreferences, {
            clerkId: args.clerkId,
        });
    },
});

// ─── Daily sweep: generate AIMs for all active users ─────────────────────────
export const generateDailyAIMs = internalAction({
    args: {},
    handler: async (ctx) => {
        const activeUsers = await ctx.runQuery(
            internal.ai.aims.getActiveUsersLast7Days,
            {}
        );
        // Stagger by 2s per user to avoid rate-limiting Groq with a simultaneous burst
        for (let i = 0; i < activeUsers.length; i++) {
            await ctx.scheduler.runAfter(
                i * 2000,
                internal.ai.aims.generateAIMsForUser,
                { clerkId: activeUsers[i].clerkId }
            );
        }
    },
});

// ─── Public queries & mutations ───────────────────────────────────────────────
export const getMyAIMs = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const now = Date.now();
        const aims = await ctx.db
            .query("ai_matches")
            .withIndex("by_owner", (q) => q.eq("ownerClerkId", identity.subject))
            .filter((q) => q.gte(q.field("expiresAt"), now))
            .collect();

        const enriched = await Promise.all(
            aims.map(async (aim) => {
                const target = await ctx.db
                    .query("users")
                    .withIndex("by_clerkId", (q) => q.eq("clerkId", aim.targetClerkId))
                    .first();
                if (!target) return null;
                return {
                    _id: aim._id,
                    targetClerkId: aim.targetClerkId,
                    targetUserId: target._id,
                    compatibilityScore: aim.compatibilityScore,
                    explanation: aim.explanation,
                    shown: aim.shown,
                    expiresAt: aim.expiresAt,
                    target: {
                        firstName: target.firstName || target.name,
                        photos: target.photos || [],
                        location: target.location || "Nearby",
                        age: calculateAge(target.birthday),
                    },
                };
            })
        );

        return enriched.filter((a): a is NonNullable<typeof a> => a !== null);
    },
});

export const markAIMShown = mutation({
    args: { aimId: v.id("ai_matches") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const aim = await ctx.db.get(args.aimId);
        if (!aim || aim.ownerClerkId !== identity.subject) {
            throw new Error("AIM not found or unauthorized");
        }

        await ctx.db.patch(aim._id, { shown: true });
    },
});

export const getMostRecentAIM = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("ai_matches")
            .withIndex("by_owner", (q) => q.eq("ownerClerkId", args.clerkId))
            .order("desc")
            .first();
    },
});

// ─── Cleanup: delete expired AIM records ─────────────────────────────────────
export const pruneExpiredAIMs = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const expired = await ctx.db
            .query("ai_matches")
            .filter((q) => q.lt(q.field("expiresAt"), now))
            .collect();
        for (const aim of expired) {
            await ctx.db.delete(aim._id);
        }
    },
});

// ─── Client-triggered regeneration ───────────────────────────────────────────
export const triggerAIMGeneration = action({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // M9: Cooldown — skip if AIMs were generated within the last hour
        const recentAIM = await ctx.runQuery(internal.ai.aims.getMostRecentAIM, {
            clerkId: identity.subject,
        });
        const ONE_HOUR = 60 * 60 * 1000;
        if (recentAIM && Date.now() - recentAIM.createdAt < ONE_HOUR) return;

        await ctx.scheduler.runAfter(0, internal.ai.aims.generateAIMsForUser, {
            clerkId: identity.subject,
        });
    },
});
