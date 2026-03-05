import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";

// ─── Scoring helpers (fallback when Groq fails) ──────────────────────────────

function scoreValues(v1: string[], v2: string[]): number {
    if (!v1.length && !v2.length) return 50; // both unknown
    if (!v1.length || !v2.length) return 55; // one unknown
    const set2 = new Set(v2);
    const intersection = v1.filter((x) => set2.has(x));
    const union = new Set([...v1, ...v2]);
    const jaccard = intersection.length / union.size;
    const base = Math.round(jaccard * 90 + 10); // scale 10-100
    const topBonus = v1[0] && v1[0] === v2[0] ? 10 : 0;
    return Math.min(100, base + topBonus);
}

function scoreCommunication(s1: string, s2: string): number {
    if (s1 === "unknown" || s2 === "unknown") return 55;
    if (s1 === s2) return 90;
    const COMM_COMPAT: Record<string, Record<string, number>> = {
        "expressive-emotional": { "witty-playful": 75, "intellectual-analytical": 55, "reserved-thoughtful": 45, "direct-assertive": 60 },
        "intellectual-analytical": { "reserved-thoughtful": 80, "witty-playful": 60, "direct-assertive": 70, "expressive-emotional": 55 },
        "witty-playful": { "expressive-emotional": 75, "direct-assertive": 55, "reserved-thoughtful": 45, "intellectual-analytical": 60 },
        "reserved-thoughtful": { "intellectual-analytical": 80, "direct-assertive": 40, "witty-playful": 45, "expressive-emotional": 45 },
        "direct-assertive": { "intellectual-analytical": 70, "expressive-emotional": 60, "witty-playful": 55, "reserved-thoughtful": 40 },
        // Legacy style names for backward compatibility
        "expressive": { "warm": 80, "earnest": 70, "witty": 65, "reserved": 45, "analytical": 50, "sarcastic": 40, "playful": 70, "dry": 45 },
        "reserved": { "analytical": 75, "earnest": 65, "warm": 60, "expressive": 45, "witty": 50, "sarcastic": 55, "playful": 45, "dry": 60 },
        "witty": { "playful": 80, "dry": 70, "sarcastic": 60, "expressive": 65, "warm": 65, "reserved": 50, "analytical": 55, "earnest": 55 },
        "earnest": { "warm": 80, "expressive": 70, "reserved": 65, "analytical": 60, "witty": 55, "dry": 40, "sarcastic": 35, "playful": 60 },
        "analytical": { "reserved": 75, "earnest": 60, "witty": 55, "warm": 50, "expressive": 50, "sarcastic": 55, "dry": 65, "playful": 45 },
        "warm": { "expressive": 80, "earnest": 80, "playful": 75, "witty": 65, "reserved": 60, "analytical": 50, "dry": 50, "sarcastic": 40 },
        "sarcastic": { "dry": 70, "witty": 65, "reserved": 55, "analytical": 55, "earnest": 35, "warm": 40, "expressive": 40, "playful": 55 },
        "playful": { "witty": 80, "warm": 75, "expressive": 70, "earnest": 60, "dry": 55, "reserved": 45, "analytical": 45, "sarcastic": 55 },
        "dry": { "sarcastic": 70, "witty": 70, "analytical": 65, "reserved": 60, "warm": 50, "earnest": 40, "expressive": 45, "playful": 55 },
    };
    return COMM_COMPAT[s1]?.[s2] ?? COMM_COMPAT[s2]?.[s1] ?? 60;
}

function scoreLifeStage(ls1: string, ls2: string): number {
    if (ls1 === "unknown" || ls2 === "unknown") return 55;
    if (ls1 === ls2) return 92;
    const LIFE_STAGE_COMPAT: Record<string, Record<string, number>> = {
        "career-first": { "actively-seeking-commitment": 45, "open-and-exploring": 65, "ready-for-marriage": 30, "focused-on-personal-growth": 72 },
        "actively-seeking-commitment": { "ready-for-marriage": 85, "open-and-exploring": 50, "career-first": 45, "focused-on-personal-growth": 55 },
        "open-and-exploring": { "focused-on-personal-growth": 72, "career-first": 65, "actively-seeking-commitment": 50, "ready-for-marriage": 40 },
        "ready-for-marriage": { "actively-seeking-commitment": 85, "focused-on-personal-growth": 45, "career-first": 30, "open-and-exploring": 40 },
        "focused-on-personal-growth": { "open-and-exploring": 72, "career-first": 72, "actively-seeking-commitment": 55, "ready-for-marriage": 45 },
        // Legacy stage names
        "career-focused": { "ready-to-commit": 45, "exploratory": 65, "transitioning": 60, "family-oriented": 35, "settled": 50 },
        "ready-to-commit": { "career-focused": 45, "family-oriented": 80, "transitioning": 65, "settled": 70, "exploratory": 55 },
        "exploratory": { "career-focused": 65, "transitioning": 70, "ready-to-commit": 55, "settled": 40, "family-oriented": 25 },
        "family-oriented": { "ready-to-commit": 80, "settled": 75, "transitioning": 55, "career-focused": 35, "exploratory": 25 },
        "settled": { "family-oriented": 75, "ready-to-commit": 70, "transitioning": 60, "career-focused": 50, "exploratory": 40 },
        "transitioning": { "exploratory": 70, "ready-to-commit": 65, "settled": 60, "career-focused": 60, "family-oriented": 55 },
    };
    return LIFE_STAGE_COMPAT[ls1]?.[ls2] ?? LIFE_STAGE_COMPAT[ls2]?.[ls1] ?? 55;
}

function scoreLifestyle(u1: any, u2: any): number {
    let score = 100;

    // Religion mismatch
    if (u1.religion && u2.religion) {
        const r1 = u1.religion.toLowerCase();
        const r2 = u2.religion.toLowerCase();
        const nonReligious = ["agnostic", "atheist", "none", "no religion", "not religious", "spiritual"];
        const r1secular = nonReligious.some((a) => r1.includes(a));
        const r2secular = nonReligious.some((a) => r2.includes(a));
        if (r1secular !== r2secular) score -= 15;
        else if (!r1secular && !r2secular && r1 !== r2) score -= 8;
    }

    // Children dealbreaker
    if (u1.children && u2.children) {
        const c1 = u1.children.toLowerCase();
        const c2 = u2.children.toLowerCase();
        const wants = (s: string) => s.includes("want") || s.includes("open") || s.includes("yes") || s.includes("would like");
        const doesnt = (s: string) => s.includes("don't") || s.includes("dont") || s.includes("no") || s.includes("never") || s.includes("not");
        if (wants(c1) && doesnt(c2)) score -= 20;
        else if (doesnt(c1) && wants(c2)) score -= 20;
    }

    // Drinking mismatch
    if (u1.drinking && u2.drinking) {
        const d1 = u1.drinking.toLowerCase();
        const d2 = u2.drinking.toLowerCase();
        const never1 = d1.includes("never") || d1.includes("no");
        const heavy2 = d2.includes("regular") || d2.includes("frequent") || d2.includes("often");
        if (never1 && heavy2) score -= 12;
        const never2 = d2.includes("never") || d2.includes("no");
        const heavy1 = d1.includes("regular") || d1.includes("frequent") || d1.includes("often");
        if (never2 && heavy1) score -= 12;
    }

    // Tobacco mismatch
    if (u1.tobacco && u2.tobacco) {
        const t1 = u1.tobacco.toLowerCase();
        const t2 = u2.tobacco.toLowerCase();
        const noSmoke1 = t1.includes("never") || t1.includes("no") || t1.includes("non");
        const smokes2 = t2.includes("yes") || t2.includes("regular") || t2.includes("daily") || t2.includes("smoke");
        if (noSmoke1 && smokes2) score -= 12;
        const noSmoke2 = t2.includes("never") || t2.includes("no") || t2.includes("non");
        const smokes1 = t1.includes("yes") || t1.includes("regular") || t1.includes("daily") || t1.includes("smoke");
        if (noSmoke2 && smokes1) score -= 12;
    }

    return Math.max(20, score);
}

function scoreGoals(u1: any, u2: any): number {
    let score = 65; // default if no data (not high)

    if (u1.datingIntention && u2.datingIntention) {
        const d1 = u1.datingIntention.toLowerCase();
        const d2 = u2.datingIntention.toLowerCase();
        if (d1 === d2) {
            score = 95;
        } else {
            const serious = (s: string) =>
                s.includes("serious") || s.includes("marriage") || s.includes("long") || s.includes("commit");
            const casual = (s: string) =>
                s.includes("casual") || s.includes("fun") || s.includes("short") || s.includes("dating around");
            if ((serious(d1) && casual(d2)) || (casual(d1) && serious(d2))) score = 20;
            else score = 65;
        }
    }

    if (u1.relationshipType && u2.relationshipType) {
        const r1 = u1.relationshipType.toLowerCase();
        const r2 = u2.relationshipType.toLowerCase();
        if (r1 === r2) score = Math.min(100, score + 10);
        const mono = (s: string) => s.includes("mono") || s.includes("exclusive");
        const poly = (s: string) => s.includes("poly") || s.includes("open");
        if ((mono(r1) && poly(r2)) || (poly(r1) && mono(r2))) score = Math.max(10, score - 25);
    }

    return Math.min(100, Math.max(10, score));
}

function scoreInterests(iv1: string[], iv2: string[]): number {
    if (!iv1.length && !iv2.length) return 50; // both unknown
    if (!iv1.length || !iv2.length) return 55; // one unknown
    const norm1 = iv1.map((s) => s.toLowerCase());
    const norm2 = iv2.map((s) => s.toLowerCase());
    const set2 = new Set(norm2);
    let overlap = 0;
    for (const item of norm1) {
        if (set2.has(item)) { overlap++; continue; }
        // Partial: substring match
        for (const item2 of norm2) {
            if (item.includes(item2) || item2.includes(item)) { overlap += 0.5; break; }
        }
    }
    const ratio = overlap / Math.max(iv1.length, iv2.length);
    return Math.min(100, Math.round(ratio * 75 + 25));
}

function scoreEmotional(e1: number, e2: number): number {
    const diff = Math.abs(e1 - e2);
    if (diff < 10) return 92;
    if (diff < 20) return 76;
    if (diff < 35) return 58;
    return 35;
}

function scoreHumor(h1: string, h2: string): number {
    if (h1 === "none" && h2 === "none") return 55;
    if (h1 === "unknown" || h2 === "unknown" || h1 === "none" || h2 === "none") return 55;
    if (h1 === h2) return 90;
    const HUMOR_COMPAT: Record<string, Record<string, number>> = {
        warm: { playful: 80, dry: 50, sarcastic: 42 },
        playful: { warm: 80, dry: 60, sarcastic: 55 },
        dry: { sarcastic: 75, playful: 60, warm: 50 },
        sarcastic: { dry: 75, playful: 55, warm: 42 },
    };
    return HUMOR_COMPAT[h1]?.[h2] ?? HUMOR_COMPAT[h2]?.[h1] ?? 60;
}

// Weighted total with normalized 8-dimension calculation (sum = 1.00)
function weightedTotal(d: {
    values: number; communication: number; lifeStage: number; lifestyle: number;
    goals: number; interests: number; emotional: number; humor: number;
}): number {
    return Math.round(
        d.values * 0.25 +        // Core values (25%)
        d.lifeStage * 0.20 +     // Life stage alignment (20%)
        d.communication * 0.15 + // Communication style match (15%)
        d.goals * 0.10 +         // Goal congruence (10%)
        d.lifestyle * 0.10 +     // Lifestyle compatibility (10%)
        d.interests * 0.10 +     // SHARED interests (10%)
        d.emotional * 0.05 +     // Emotional availability alignment (5%)
        d.humor * 0.05           // Humor resonance (5%)
    );
}

// ─── Canonical pair ordering ──────────────────────────────────────────────────
function sortedPair(a: string, b: string): [string, string] {
    return a < b ? [a, b] : [b, a];
}

// ─── Groq API logic for deep compatibility ────────────────────────────────────
async function callGroqCompatibility(systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is missing");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.2,
            response_format: { type: "json_object" },
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
export const getBothPersonalityProfiles = internalQuery({
    args: { user1ClerkId: v.string(), user2ClerkId: v.string() },
    handler: async (ctx, args) => {
        const [p1, p2] = await Promise.all([
            ctx.db.query("personality_profiles")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", args.user1ClerkId))
                .first(),
            ctx.db.query("personality_profiles")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", args.user2ClerkId))
                .first(),
        ]);
        return { p1, p2 };
    },
});

export const getBothUsersRaw = internalQuery({
    args: { user1ClerkId: v.string(), user2ClerkId: v.string() },
    handler: async (ctx, args) => {
        const [u1, u2] = await Promise.all([
            ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", args.user1ClerkId)).first(),
            ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", args.user2ClerkId)).first(),
        ]);
        return { u1, u2 };
    },
});

export const getCachedScore = internalQuery({
    args: { user1ClerkId: v.string(), user2ClerkId: v.string() },
    handler: async (ctx, args) => {
        const [a, b] = sortedPair(args.user1ClerkId, args.user2ClerkId);
        return await ctx.db
            .query("compatibility_scores")
            .withIndex("by_pair", (q) => q.eq("user1ClerkId", a).eq("user2ClerkId", b))
            .first();
    },
});

// ─── Internal mutations ───────────────────────────────────────────────────────
export const upsertCompatibilityScore = internalMutation({
    args: {
        user1ClerkId: v.string(),
        user2ClerkId: v.string(),
        totalScore: v.number(),
        valuesScore: v.number(),
        communicationScore: v.number(),
        lifeStageScore: v.number(),
        lifestyleScore: v.number(),
        goalsScore: v.number(),
        interestsScore: v.number(),
        emotionalScore: v.number(),
        humorScore: v.number(),
        insightsJson: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const [u1, u2] = sortedPair(args.user1ClerkId, args.user2ClerkId);
        const existing = await ctx.db
            .query("compatibility_scores")
            .withIndex("by_pair", (q) => q.eq("user1ClerkId", u1).eq("user2ClerkId", u2))
            .first();

        const data = {
            user1ClerkId: u1,
            user2ClerkId: u2,
            totalScore: args.totalScore,
            valuesScore: args.valuesScore,
            communicationScore: args.communicationScore,
            lifeStageScore: args.lifeStageScore,
            lifestyleScore: args.lifestyleScore,
            goalsScore: args.goalsScore,
            interestsScore: args.interestsScore,
            emotionalScore: args.emotionalScore,
            humorScore: args.humorScore,
            insightsJson: args.insightsJson,
            computedAt: Date.now(),
        };

        if (existing) {
            await ctx.db.patch(existing._id, data);
        } else {
            await ctx.db.insert("compatibility_scores", data);
        }
    },
});

// ─── Core scoring action ──────────────────────────────────────────────────────
export const computeCompatibilityScore = internalAction({
    args: { user1ClerkId: v.string(), user2ClerkId: v.string() },
    handler: async (ctx, args) => {
        const { p1, p2 } = await ctx.runQuery(
            internal.ai.compatibility.getBothPersonalityProfiles,
            { user1ClerkId: args.user1ClerkId, user2ClerkId: args.user2ClerkId }
        );

        const { u1, u2 } = await ctx.runQuery(
            internal.ai.compatibility.getBothUsersRaw,
            { user1ClerkId: args.user1ClerkId, user2ClerkId: args.user2ClerkId }
        );

        if (!u1 || !u2) return null;

        const systemPrompt = `You are the AI engine powering Align — a dating app. One of your core features is the Alignment Score — a percentage shown between two matched users that represents how genuinely compatible they are based on deep profile analysis.

WHAT THE ALIGNMENT SCORE IS
The Alignment Score is a number between 0 and 100 that represents genuine, deep compatibility between two people. It is not based on looks, location, or activity. It is based entirely on who each person is — their values, personality, communication style, life goals, and emotional depth — as revealed through their private bio, public bio, and all prompt answers.
It must feel accurate enough that when a user sees 91%, they think "yes, that makes sense" — and when they see 54%, they think "yeah, we're pretty different." It must never feel random or inflated.

HOW TO COMPUTE THE ALIGNMENT SCORE
Step 1 — Extract a Personality & Values Profile for Each User
From all three inputs combined, extract the following for each person:
- Core Values (top 3-5 explicitly/implicitly stated)
- Relationship Readiness (Score 0-100)
- Communication Style (expressive-emotional / intellectual-analytical / witty-playful / reserved-thoughtful / direct-assertive)
- Life Stage (career-first / actively-seeking-commitment / open-and-exploring / ready-for-marriage / focused-on-personal-growth)
- Emotional Depth (Score 0-100)
- Lifestyle Orientation (Homebodied / socially active / adventure-driven / career-absorbed / family-centered / spiritually-oriented)
- Dealbreaker Signals

Step 2 — Score 8 Compatibility Dimensions
Compare the two extracted profiles based on both raw text and pre-computed personality abstractions. Score each 0-100:
1. Values Alignment (25% weight)
2. Life Stage Match (20% weight)
3. Communication Style Compatibility (15% weight)
4. Long-Term Goal Congruence (10% weight)
5. Lifestyle Compatibility (10% weight)
6. Interests & Hobby Overlap (10% weight)
7. Emotional Availability Match (5% weight)
8. Humor & Vibe Resonance (5% weight)

Step 3 — Compute the Weighted Composite
Weighted sum = (Values * 0.25) + (LifeStage * 0.20) + (Communication * 0.15) + (Goals * 0.10) + (Lifestyle * 0.10) + (Interests * 0.10) + (Emotional * 0.05) + (Humor * 0.05).
Round to the nearest whole number.

Step 4 — Apply Dealbreaker Penalty
After computing the composite, scan for hard dealbreaker conflicts (e.g. Children desire opposite, incompatible Relationship Type). Subtract 8-15 points per hard conflict. Final score cannot go below 5.

Step 5 — Calibration Check
- Scores > 88 are reserved for exceptional matches (at least 5 dimensions > 80).
- 70-87 represent solid compatibility.
- 50-69 represent partial compatibility.
- If a dimension is missing data or sparse, score it at 65 (neutral uncertainty).

OUTPUT FORMAT
Return ONLY a valid JSON object:
{
  "alignmentScore": 79,
  "dimensionScores": {
    "values": 85,
    "lifeStage": 80,
    "communication": 70,
    "goals": 68,
    "lifestyle": 75,
    "interests": 80,
    "emotional": 82,
    "humor": 75
  },
  "dealbreakersFound": [],
  "penaltyApplied": 0,
  "finalScore": 79,
  "summary": "2-sentence plain-language explanation of why this score makes sense, specific to these two people, never generic",
  "strongestDimension": "values",
  "weakestDimension": "goals",
  "user1Profile": {
    "coreValues": [],
    "communicationStyle": "",
    "lifeStage": "",
    "emotionalDepth": 0,
    "lifestyleOrientation": "",
    "relationshipReadiness": 0
  },
  "user2Profile": {
    "coreValues": [],
    "communicationStyle": "",
    "lifeStage": "",
    "emotionalDepth": 0,
    "lifestyleOrientation": "",
    "relationshipReadiness": 0
  }
}

RULES YOU ALWAYS FOLLOW
- The private bio is weighted 2x the public bio in your analysis. It is the most honest signal you have.
- Never return a score above 88 unless at least 5 of the 7 dimensions score above 80.
- Never be generic. The summary field must reference something specific from both profiles.
- If a user's bio or prompts are very short or sparse, reflect that uncertainty — score sparse dimensions at 65.
- The score must feel earned.
- Never explain your reasoning outside the JSON.`;

        const u1Prompts = u1.prompts?.map((p: any) => `Q: ${p.question}\nA: ${p.answer}`).join("\n") || "None";
        const u2Prompts = u2.prompts?.map((p: any) => `Q: ${p.question}\nA: ${p.answer}`).join("\n") || "None";

        const userPrompt = `USER 1 (${u1.firstName || "Unknown"}):
Public Bio: ${u1.publicBio || "None"}
Matchmaking Bio (2x weight): ${u1.aiBio || "None"}
Prompts:
${u1Prompts}
Contextual Information:
- Dating Intention: ${u1.datingIntention || "None"}
- Relationship Type: ${u1.relationshipType || "None"}
- Religion: ${u1.religion || "None"}
- Children: ${u1.children || "None"}
- Drinking: ${u1.drinking || "None"}
- Tobacco: ${u1.tobacco || "None"}
- Education: ${u1.education || "None"}
Pre-computed Personality: ${JSON.stringify(p1 || {})}

USER 2 (${u2.firstName || "Unknown"}):
Public Bio: ${u2.publicBio || "None"}
Matchmaking Bio (2x weight): ${u2.aiBio || "None"}
Prompts:
${u2Prompts}
Contextual Information:
- Dating Intention: ${u2.datingIntention || "None"}
- Relationship Type: ${u2.relationshipType || "None"}
- Religion: ${u2.religion || "None"}
- Children: ${u2.children || "None"}
- Drinking: ${u2.drinking || "None"}
- Tobacco: ${u2.tobacco || "None"}
- Education: ${u2.education || "None"}
Pre-computed Personality: ${JSON.stringify(p2 || {})}`;

        let totalScore = 50;
        let finalDimensions = {
            values: 50, communication: 50, lifeStage: 50, lifestyle: 50, goals: 50, interests: 50, emotional: 50, humor: 50
        };
        let insightsJson: string | null = null;

        try {
            const rawResponse = await callGroqCompatibility(systemPrompt, userPrompt);
            const parsed = JSON.parse(rawResponse);
            totalScore = parsed.finalScore ?? parsed.alignmentScore ?? 50;
            const ds = parsed.dimensionScores || {};
            finalDimensions.values = ds.values ?? 50;
            finalDimensions.lifeStage = ds.lifeStage ?? 50;
            finalDimensions.communication = ds.communication ?? 50;
            finalDimensions.emotional = ds.emotional ?? 50;
            finalDimensions.lifestyle = ds.lifestyle ?? 50;
            finalDimensions.goals = ds.goals ?? 50;
            finalDimensions.interests = ds.interests ?? 50;
            finalDimensions.humor = ds.humor ?? 50;
            insightsJson = rawResponse;
        } catch (err) {
            console.error("Groq Compatibility Error:", err);
            // Fallback gracefully (Legacy Logic with unknown-safe defaults)
            const prof1 = p1 ?? { values: [], communicationStyle: "unknown", lifeStage: "unknown", humor: "none", emotionalAvailability: 50, interestVector: [] };
            const prof2 = p2 ?? { values: [], communicationStyle: "unknown", lifeStage: "unknown", humor: "none", emotionalAvailability: 50, interestVector: [] };
            finalDimensions = {
                values: scoreValues(prof1.values, prof2.values),
                communication: scoreCommunication(prof1.communicationStyle, prof2.communicationStyle),
                lifeStage: scoreLifeStage(prof1.lifeStage, prof2.lifeStage),
                lifestyle: scoreLifestyle(u1, u2),
                goals: scoreGoals(u1, u2),
                interests: scoreInterests(prof1.interestVector, prof2.interestVector),
                emotional: scoreEmotional(prof1.emotionalAvailability, prof2.emotionalAvailability),
                humor: scoreHumor(prof1.humor, prof2.humor),
            };
            totalScore = weightedTotal(finalDimensions);
        }

        await ctx.runMutation(internal.ai.compatibility.upsertCompatibilityScore, {
            user1ClerkId: args.user1ClerkId,
            user2ClerkId: args.user2ClerkId,
            totalScore,
            valuesScore: finalDimensions.values,
            communicationScore: finalDimensions.communication,
            lifeStageScore: finalDimensions.lifeStage,
            lifestyleScore: finalDimensions.lifestyle,
            goalsScore: finalDimensions.goals,
            interestsScore: finalDimensions.interests,
            emotionalScore: finalDimensions.emotional,
            humorScore: finalDimensions.humor,
            insightsJson: insightsJson !== null ? insightsJson : undefined
        });

        return { totalScore, ...finalDimensions, insightsJson };
    },
});

// ─── Public action: cache-first compatibility fetch ───────────────────────────
export const getCompatibilityScore = action({
    args: { otherClerkId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const myClerkId = identity.subject;

        const cached: any = await ctx.runQuery(internal.ai.compatibility.getCachedScore, {
            user1ClerkId: myClerkId,
            user2ClerkId: args.otherClerkId,
        });

        // Cache hit: only serve if both user profiles haven't changed since scoring
        if (cached && cached.insightsJson) {
            const { u1, u2 } = await ctx.runQuery(internal.ai.compatibility.getBothUsersRaw, {
                user1ClerkId: myClerkId,
                user2ClerkId: args.otherClerkId,
            });
            const u1Version = u1?.updatedAt ?? u1?.createdAt ?? 0;
            const u2Version = u2?.updatedAt ?? u2?.createdAt ?? 0;
            if (cached.computedAt >= Math.max(u1Version, u2Version)) {
                return cached as any; // Fresh cached score
            }
            // Profile updated after scoring — recompute below
        }

        const result: any = await ctx.runAction(
            internal.ai.compatibility.computeCompatibilityScore,
            { user1ClerkId: myClerkId, user2ClerkId: args.otherClerkId }
        );

        return result as any;
    },
});

// ─── Batch trigger: compute scores for discovery profiles shown on HomeScreen ──
export const triggerBatchCompatibility = action({
    args: { otherClerkIds: v.array(v.string()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const myClerkId = identity.subject;

        for (const otherClerkId of args.otherClerkIds) {
            // Check if score already exists
            const cached = await ctx.runQuery(internal.ai.compatibility.getCachedScore, {
                user1ClerkId: myClerkId,
                user2ClerkId: otherClerkId,
            });

            if (!cached) {
                // Schedule background computation (non-blocking)
                await ctx.scheduler.runAfter(0, internal.ai.compatibility.computeCompatibilityScore, {
                    user1ClerkId: myClerkId,
                    user2ClerkId: otherClerkId,
                });
            }
        }
    },
});
