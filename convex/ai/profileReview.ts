import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, query } from "../_generated/server";
import { internal } from "../_generated/api";

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
            max_tokens: 600,
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
export const getUserForReview = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();
    },
});

export const getExistingReview = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("profile_reviews")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();
    },
});

// ─── Internal mutations ───────────────────────────────────────────────────────
export const upsertProfileReview = internalMutation({
    args: {
        clerkId: v.string(),
        whatsWorking: v.string(),
        fixes: v.string(),
        standout: v.string(),
        profileVersion: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("profile_reviews")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        const data = {
            clerkId: args.clerkId,
            whatsWorking: args.whatsWorking,
            fixes: args.fixes,
            standout: args.standout,
            generatedAt: Date.now(),
            profileVersion: args.profileVersion,
        };

        if (existing) {
            await ctx.db.patch(existing._id, data);
        } else {
            await ctx.db.insert("profile_reviews", data);
        }
    },
});

// ─── Core action ─────────────────────────────────────────────────────────────
export const generateProfileReview = internalAction({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(internal.ai.profileReview.getUserForReview, {
            clerkId: args.clerkId,
        });
        if (!user || !user.onboardingCompleted) return;

        const profileVersion = user.updatedAt ?? user.createdAt;

        // Skip if already up-to-date
        const existing = await ctx.runQuery(internal.ai.profileReview.getExistingReview, {
            clerkId: args.clerkId,
        });
        if (existing && existing.profileVersion === profileVersion) return;

        // Build profile text (same pattern as personality engine)
        const promptsText =
            user.prompts
                ?.map((p: any) => `Q: ${p.question}\nA: ${p.answer}`)
                .join("\n\n") ?? "";

        // Fetch deep personality context if available
        const personality = await ctx.runQuery(internal.ai.personality.getPersonalityProfile, { clerkId: args.clerkId });

        const photoCount = user.photos?.length ?? 0;

        const profileLines = [
            `Name: ${user.firstName || user.name}`,
            user.birthday ? `Age: ${calculateAge(user.birthday)}` : "",
            user.gender ? `Gender: ${user.gender}` : "",
            user.location ? `Location: ${user.location}` : "",
            user.publicBio ? `Bio: ${user.publicBio}` : "",
            promptsText ? `Profile prompts:\n${promptsText}` : "",
            `Photos: ${photoCount} photo${photoCount !== 1 ? "s" : ""}`,
            user.datingIntention ? `Dating intention: ${user.datingIntention}` : "",
            user.relationshipType ? `Relationship type: ${user.relationshipType}` : "",
            personality ? `Core Values: ${personality.values.join(", ")}` : "",
            personality ? `Humor Style: ${personality.humor}` : "",
            user.education ? `Education: ${user.education}` : "",
            user.school ? `School: ${user.school}` : "",
            user.workplace ? `Works at: ${user.workplace}` : "",
            user.hometown ? `Hometown: ${user.hometown}` : "",
            user.religion ? `Religion: ${user.religion}` : "",
            user.politics ? `Politics: ${user.politics}` : "",
            user.children ? `Children: ${user.children}` : "",
            user.drinking ? `Drinking: ${user.drinking}` : "",
            user.tobacco ? `Tobacco: ${user.tobacco}` : "",
            user.drugs ? `Substances: ${user.drugs}` : "",
        ]
            .filter(Boolean)
            .join("\n");

        const systemPrompt =
            "You are an expert dating profile coach specialising in Indian dating. " +
            "Review profiles honestly and constructively. Be warm but direct. " +
            "Always respond with valid JSON only — no extra text, no markdown.";

        const userPrompt =
            `Review this dating profile and return a JSON object with exactly these three fields:\n` +
            `- "whatsWorking": 1-2 sentences about what is genuinely strong or appealing in the profile.\n` +
            `- "fixes": 1-2 actionable, specific suggestions to improve the profile's appeal or completeness. ` +
            `If the profile has fewer than 3 photos, mention it. If bio is missing or thin, say so.\n` +
            `- "standout": 1 sentence naming the single most unique or memorable thing about this person based on their profile.\n\n` +
            `Profile:\n${profileLines}\n\n` +
            `Return only the JSON object with keys "whatsWorking", "fixes", "standout".`;

        const fallback = {
            whatsWorking: "Your profile shows genuine personality — keep building on that.",
            fixes: "Add more photos and write a bio that shows what makes you uniquely you.",
            standout: "You have a distinct perspective worth highlighting more.",
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
                fixes:
                    typeof data.fixes === "string" && data.fixes.trim()
                        ? data.fixes.trim()
                        : fallback.fixes,
                standout:
                    typeof data.standout === "string" && data.standout.trim()
                        ? data.standout.trim()
                        : fallback.standout,
            };
        } catch {
            // fallback already set
        }

        await ctx.runMutation(internal.ai.profileReview.upsertProfileReview, {
            clerkId: args.clerkId,
            ...parsed,
            profileVersion,
        });
    },
});

// ─── Public API ───────────────────────────────────────────────────────────────
export const getMyProfileReview = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("profile_reviews")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();
    },
});

export const triggerProfileReview = action({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Check staleness before scheduling to avoid duplicate work
        const user = await ctx.runQuery(internal.ai.profileReview.getUserForReview, {
            clerkId: identity.subject,
        });
        if (!user) return;

        const profileVersion = user.updatedAt ?? user.createdAt;
        const existing = await ctx.runQuery(internal.ai.profileReview.getExistingReview, {
            clerkId: identity.subject,
        });

        if (existing && existing.profileVersion === profileVersion) {
            return { cached: true };
        }

        await ctx.scheduler.runAfter(0, internal.ai.profileReview.generateProfileReview, {
            clerkId: identity.subject,
        });

        return { cached: false };
    },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calculateAge(birthday: string): number {
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
