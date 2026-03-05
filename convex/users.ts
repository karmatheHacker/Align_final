import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const createUserIfNotExists = mutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        imageUrl: v.string(),
    },
    handler: async (ctx: any, args: any) => {
        // Security layer: enforce caller identity matches passed clerkId
        // In a real app involving strict checks, you'd use ctx.auth.getUserIdentity()
        // For this implementation, we ensure no unauthorized user creation by checking auth context
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to createUserIfNotExists");
        }

        if (identity.subject !== args.clerkId) {
            throw new Error("clerkId mismatch: cannot create user for another identity");
        }

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", args.clerkId))
            .first();

        if (existingUser) {
            return existingUser._id;
        }

        const newUserId = await ctx.db.insert("users", {
            clerkId: args.clerkId,
            name: args.name,
            email: args.email,
            imageUrl: args.imageUrl,
            onboardingCompleted: false,
            verificationStatus: "none",
            createdAt: Date.now(),
        });

        return newUserId;
    },
});

export const getCurrentUser = query({
    args: {},
    handler: async (ctx: any) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
            .first();
    },
});

export const completeOnboarding = mutation({
    args: {
        clerkId: v.string(),
    },
    handler: async (ctx: any, args: any) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || identity.subject !== args.clerkId) {
            throw new Error("Unauthenticated or unauthorized call to completeOnboarding");
        }

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", args.clerkId))
            .first();

        if (!existingUser) {
            throw new Error("User not found");
        }

        // Idempotent: skip AI job scheduling if onboarding already completed
        if (existingUser.onboardingCompleted) {
            return;
        }

        await ctx.db.patch(existingUser._id, {
            onboardingCompleted: true,
        });

        // Trigger personality profile computation now that profile is complete
        await ctx.scheduler.runAfter(0, internal.ai.personality.computePersonalityProfile, {
            clerkId: args.clerkId,
        });
        // Trigger profile review generation
        await ctx.scheduler.runAfter(0, internal.ai.profileReview.generateProfileReview, {
            clerkId: args.clerkId,
        });
        // Trigger AIM generation after personality is ready (~5s delay)
        await ctx.scheduler.runAfter(5000, internal.ai.aims.generateAIMsForUser, {
            clerkId: args.clerkId,
        });
    }
});

export const deleteCurrentAccount = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to deleteCurrentAccount");
        }

        const clerkId = identity.subject;

        // M6: Set pendingDeletion flag first to prevent duplicate runs
        const existingUserCheck = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .first();
        if (!existingUserCheck) return true; // already deleted
        if (existingUserCheck.pendingDeletion) return true; // deletion already in progress
        await ctx.db.patch(existingUserCheck._id, { pendingDeletion: true });

        // ── Storage-backed tables (delete storage objects first) ──────────────

        const photos = await ctx.db
            .query("photos")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .collect();
        for (const photo of photos) {
            await ctx.storage.delete(photo.storageId);
            await ctx.db.delete(photo._id);
        }

        const voices = await ctx.db
            .query("voiceProfiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .collect();
        for (const voice of voices) {
            await ctx.storage.delete(voice.storageId);
            await ctx.db.delete(voice._id);
        }

        const verifications = await ctx.db
            .query("verifications")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .collect();
        for (const verification of verifications) {
            await ctx.storage.delete(verification.verificationPhotoStorageId);
            await ctx.db.delete(verification._id);
        }

        // ── DB-only tables ────────────────────────────────────────────────────

        const deleteAll = async (rows: { _id: any }[]) => {
            for (const row of rows) await ctx.db.delete(row._id);
        };

        await deleteAll(
            await ctx.db.query("swipes")
                .withIndex("by_from", (q) => q.eq("fromClerkId", clerkId))
                .collect()
        );
        await deleteAll(
            await ctx.db.query("swipes")
                .withIndex("by_to", (q) => q.eq("toClerkId", clerkId))
                .collect()
        );

        const matchesAs1 = await ctx.db.query("matches")
            .withIndex("by_user1", (q) => q.eq("user1ClerkId", clerkId))
            .collect();
        const matchesAs2 = await ctx.db.query("matches")
            .withIndex("by_user2", (q) => q.eq("user2ClerkId", clerkId))
            .collect();
        const allMatches = [...matchesAs1, ...matchesAs2];

        // Delete icebreakers for all matches involving this user
        for (const match of allMatches) {
            const icebreakers = await ctx.db.query("icebreakers")
                .withIndex("by_match", (q) => q.eq("matchId", match._id))
                .collect();
            await deleteAll(icebreakers);
            await ctx.db.delete(match._id);
        }

        await deleteAll(
            await ctx.db.query("ai_matches")
                .withIndex("by_owner", (q) => q.eq("ownerClerkId", clerkId))
                .collect()
        );
        await deleteAll(
            await ctx.db.query("personality_profiles")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
                .collect()
        );
        await deleteAll(
            await ctx.db.query("profile_reviews")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
                .collect()
        );
        await deleteAll(
            await ctx.db.query("weekly_insights")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
                .collect()
        );
        await deleteAll(
            await ctx.db.query("learned_preferences")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
                .collect()
        );
        await deleteAll(
            await ctx.db.query("ai_chat_messages")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
                .collect()
        );
        await deleteAll(
            await ctx.db.query("profile_views")
                .withIndex("by_viewer", (q) => q.eq("viewerClerkId", clerkId))
                .collect()
        );
        await deleteAll(
            await ctx.db.query("profile_views")
                .withIndex("by_viewed", (q) => q.eq("viewedClerkId", clerkId))
                .collect()
        );
        await deleteAll(
            await ctx.db.query("date_feedback")
                .withIndex("by_from", (q) => q.eq("fromClerkId", clerkId))
                .collect()
        );

        // Compatibility scores: delete rows where user appears as user1 or user2
        const compAs1 = await ctx.db.query("compatibility_scores")
            .withIndex("by_user1", (q) => q.eq("user1ClerkId", clerkId))
            .collect();
        const compAs2 = await ctx.db.query("compatibility_scores")
            .withIndex("by_user2", (q) => q.eq("user2ClerkId", clerkId))
            .collect();
        await deleteAll([...compAs1, ...compAs2]);

        // ── Delete user record last ───────────────────────────────────────────
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .first();
        if (existingUser) {
            await ctx.db.delete(existingUser._id);
        }

        return true;
    }
});

export const updateUserLocation = mutation({
    args: {
        clerkId: v.string(),
        city: v.string(),
        region: v.string(),
        country: v.string(),
        latitude: v.number(),
        longitude: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || identity.subject !== args.clerkId) {
            throw new Error("Unauthenticated or unauthorized call to updateUserLocation");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        if (args.latitude < -90 || args.latitude > 90) {
            throw new Error("Invalid latitude: must be between -90 and 90.");
        }
        if (args.longitude < -180 || args.longitude > 180) {
            throw new Error("Invalid longitude: must be between -180 and 180.");
        }

        const displayLocation = args.city && args.region
            ? `${args.city}, ${args.region}`
            : (args.city || args.region || args.country || "Unknown");

        // Truncate to 2 decimal places (~1 km precision) to avoid storing exact location
        await ctx.db.patch(user._id, {
            location: displayLocation,
            locationCoords: {
                latitude: Math.round(args.latitude * 100) / 100,
                longitude: Math.round(args.longitude * 100) / 100,
            },
            updatedAt: Date.now(),
        });
    },
});

export const updateUser = mutation({
    args: {
        clerkId: v.string(),
        name: v.optional(v.union(v.string(), v.null())),
        firstName: v.optional(v.union(v.string(), v.null())),
        birthday: v.optional(v.union(v.string(), v.null())),
        gender: v.optional(v.union(v.string(), v.null())),
        sexuality: v.optional(v.union(v.string(), v.null())),
        relationshipType: v.optional(v.union(v.string(), v.null())),
        datingIntention: v.optional(v.union(v.string(), v.null())),
        pronouns: v.optional(v.union(v.array(v.string()), v.null())),
        height: v.optional(v.union(v.object({ value: v.number(), unit: v.string() }), v.null())),
        hometown: v.optional(v.union(v.string(), v.null())),
        education: v.optional(v.union(v.string(), v.null())),
        school: v.optional(v.union(v.string(), v.null())),
        workplace: v.optional(v.union(v.string(), v.null())),
        religion: v.optional(v.union(v.string(), v.null())),
        politics: v.optional(v.union(v.string(), v.null())),
        children: v.optional(v.union(v.string(), v.null())),
        tobacco: v.optional(v.union(v.string(), v.null())),
        drinking: v.optional(v.union(v.string(), v.null())),
        drugs: v.optional(v.union(v.string(), v.null())),
        distancePreference: v.optional(v.union(v.string(), v.null())),
        publicBio: v.optional(v.union(v.string(), v.null())),
        aiBio: v.optional(v.union(v.string(), v.null())),
        prompts: v.optional(v.union(v.array(v.object({
            id: v.optional(v.number()), // added id
            question: v.string(),
            answer: v.string()
        })), v.null())),
        photos: v.optional(v.array(v.string())),
        location: v.optional(v.union(v.string(), v.null())),
        locationCoords: v.optional(v.union(v.object({
            latitude: v.number(),
            longitude: v.number()
        }), v.null())),
        onboardingCompleted: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || identity.subject !== args.clerkId) {
            throw new Error("Unauthenticated or unauthorized call to updateUser");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        // Server-side length limits
        if (args.publicBio && args.publicBio.length > 2000) {
            throw new Error("Bio must be 2000 characters or fewer.");
        }
        if (args.prompts) {
            for (const p of args.prompts) {
                if (p.answer.length > 500) {
                    throw new Error("Prompt answers must be 500 characters or fewer.");
                }
            }
        }
        const SHORT_LIMIT = 100;
        const shortFields: Array<[string | null | undefined, string]> = [
            [args.firstName, "Name"],
            [args.name, "Name"],
            [args.hometown, "Hometown"],
            [args.workplace, "Workplace"],
            [args.education, "Education"],
            [args.school, "School"],
            [args.religion, "Religion"],
            [args.politics, "Politics"],
            [args.distancePreference, "Distance preference"],
        ];
        for (const [val, label] of shortFields) {
            if (val && val.length > SHORT_LIMIT) {
                throw new Error(`${label} must be ${SHORT_LIMIT} characters or fewer.`);
            }
        }

        // Age validation: must be 18+
        if (args.birthday) {
            const birth = new Date(args.birthday);
            const now = new Date();
            let age = now.getFullYear() - birth.getFullYear();
            const m = now.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
            if (age < 18) {
                throw new Error("You must be at least 18 years old to use Align.");
            }
        }

        // Build the patch object dynamically by omitting clerkId
        const patchData: any = { updatedAt: Date.now() };

        // Define field mappings for snake_case to camelCase and other mismatches
        const fieldMapping: Record<string, string> = {
            'dating_intention': 'datingIntention',
            'relationship_type': 'relationshipType',
            'distance_preference': 'distancePreference',
            'publicBio': 'publicBio', // already correct but just in case
            'bio': 'publicBio',
            'hometown_location': 'hometown',
            'pronouns_list': 'pronouns',
            'first_name': 'firstName',
        };

        // Transfer values from args to patchData based on mapping or original key
        Object.keys(args).forEach(key => {
            const val = (args as any)[key];
            if (key !== 'clerkId' && val !== undefined) {
                const targetKey = fieldMapping[key] || key;
                patchData[targetKey] = val;

                // If we are updating firstName, also update the main name field for compatibility
                if (targetKey === 'firstName' && val) {
                    patchData['name'] = val;
                }
            }
        });

        await ctx.db.patch(user._id, patchData);

        // Recompute personality profile and profile review if relevant fields changed
        const profileFieldsChanged =
            args.publicBio !== undefined ||
            args.prompts !== undefined ||
            args.aiBio !== undefined ||
            args.photos !== undefined;
        if (profileFieldsChanged) {
            await ctx.scheduler.runAfter(0, internal.ai.personality.computePersonalityProfile, {
                clerkId: args.clerkId,
            });
            await ctx.scheduler.runAfter(0, internal.ai.profileReview.generateProfileReview, {
                clerkId: args.clerkId,
            });
        }

        return true;
    },
});

// One-time migration: fix old location object data to new string format
// ADMIN ONLY — set ADMIN_CLERK_ID environment variable in Convex dashboard
export const getProfileById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db.get(args.userId);
        if (!user) return null;

        const personality = await ctx.db
            .query("personality_profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", user.clerkId))
            .first();

        return {
            clerk_id: user.clerkId,
            name: user.firstName || user.name,
            birthday: user.birthday || null,
            bio: user.publicBio || null,
            aiBio: user.aiBio || null,
            hometown: user.hometown || null,
            location: user.location || null,
            workplace: user.workplace || null,
            education: user.education || null,
            school: user.school || null,
            pronouns: user.pronouns || null,
            sexuality: user.sexuality || null,
            relationship_type: user.relationshipType || null,
            dating_intention: user.datingIntention || null,
            children: user.children || null,
            religion: user.religion || null,
            politics: user.politics || null,
            drinking: user.drinking || null,
            tobacco: user.tobacco || null,
            drugs: user.drugs || null,
            gender: user.gender || null,
            height: user.height || null,
            verificationStatus: user.verificationStatus || "none",
            photos: user.photos || [],
            prompts: user.prompts?.map((p, i) => ({
                id: String(p.id ?? i),
                prompt_question: p.question,
                prompt_answer: p.answer
            })) || [],
            personality: personality ? {
                values: personality.values,
                communicationStyle: personality.communicationStyle,
                lifeStage: personality.lifeStage,
                humor: personality.humor,
                emotionalAvailability: personality.emotionalAvailability,
                interestVector: personality.interestVector,
            } : null,
        };
    },
});

export const getUserById = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
            .first();
        if (!user) return null;

        return {
            clerk_id: user.clerkId,
            name: user.firstName || user.name,
            birthday: user.birthday || null,
            bio: user.publicBio || null,
            hometown: user.hometown || null,
            workplace: user.workplace || null,
            education: user.education || null,
            school: user.school || null,
            pronouns: user.pronouns || null,
            sexuality: user.sexuality || null,
            relationship_type: user.relationshipType || null,
            dating_intention: user.datingIntention || null,
            children: user.children || null,
            religion: user.religion || null,
            politics: user.politics || null,
            drinking: user.drinking || null,
            tobacco: user.tobacco || null,
            drugs: user.drugs || null,
            photos: user.photos || [],
            prompts: user.prompts?.map((p, i) => ({
                id: String(p.id ?? i),
                prompt_question: p.question,
                prompt_answer: p.answer
            })) || [],
        };
    },
});

export const resetMySwipes = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const myClerkId = identity.subject;

        // Delete all my swipes
        const mySwipes = await ctx.db
            .query("swipes")
            .withIndex("by_from", (q) => q.eq("fromClerkId", myClerkId))
            .collect();

        for (const swipe of mySwipes) {
            await ctx.db.delete(swipe._id);
        }

        // Also reset shown AIMs if any
        const myAims = await ctx.db
            .query("ai_matches")
            .withIndex("by_owner", (q) => q.eq("ownerClerkId", myClerkId))
            .collect();

        for (const aim of myAims) {
            await ctx.db.patch(aim._id, { shown: false });
        }

        return true;
    },
});

export const fixLocationData = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        const adminClerkId = process.env.ADMIN_CLERK_ID;

        if (!adminClerkId) {
            throw new Error("ADMIN_CLERK_ID environment variable not set in Convex dashboard");
        }

        if (!identity || identity.subject !== adminClerkId) {
            throw new Error("Admin access required");
        }

        const allUsers = await ctx.db.query("users").collect();
        let migrated = 0;

        for (const user of allUsers) {
            const loc = user.location as any;
            if (loc && typeof loc === "object" && loc.city) {
                const displayLocation = loc.city && loc.region
                    ? `${loc.city}, ${loc.region}`
                    : (loc.city || loc.region || loc.country || "Unknown");

                await ctx.db.patch(user._id, {
                    location: displayLocation,
                    locationCoords: {
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                    },
                });
                migrated++;
            }
        }
        return { migrated, totalUsers: allUsers.length };
    },
});


export const getAllDiscoveryProfiles = query({
    args: { excludedIds: v.optional(v.array(v.id("users"))) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const myClerkId = identity.subject;
        const excludedUserIds = new Set(args.excludedIds || []);

        const mySwipes = await ctx.db
            .query("swipes")
            .withIndex("by_from", (q) => q.eq("fromClerkId", myClerkId))
            .collect();
        const swipedClerkIds = new Set(mySwipes.map((s) => s.toClerkId));

        // Fetch all onboarded users except current user
        const candidates = await ctx.db
            .query("users")
            .filter((q) =>
                q.and(
                    q.neq(q.field("clerkId"), myClerkId),
                    q.eq(q.field("onboardingCompleted"), true),
                )
            )
            .collect();

        const filtered = candidates
            .filter((u) => {
                if (swipedClerkIds.has(u.clerkId)) return false;
                if (excludedUserIds.has(u._id)) return false;
                return true;
            })
            .slice(0, 50); // Return up to 50 for the "All Users" view

        return await Promise.all(
            filtered.map(async (user) => {
                const [u1, u2] = myClerkId < user.clerkId
                    ? [myClerkId, user.clerkId]
                    : [user.clerkId, myClerkId];

                const cachedScore = await ctx.db
                    .query("compatibility_scores")
                    .withIndex("by_pair", (q) => q.eq("user1ClerkId", u1).eq("user2ClerkId", u2))
                    .first();

                return {
                    _id: user._id,
                    clerkId: user.clerkId,
                    firstName: user.firstName || user.name,
                    age: calculateAge(user.birthday),
                    photos: user.photos || [],
                    location: user.location || "Nearby",
                    prompts: user.prompts || [],
                    bio: user.publicBio || "",
                    compatibility_score: cachedScore?.totalScore ?? 0,
                };
            })
        );
    },
});

export const getDiscoveryProfiles = query({
    args: { excludedIds: v.optional(v.array(v.id("users"))) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!currentUser || !currentUser.gender) return [];

        const myClerkId = identity.subject;
        const gender = currentUser.gender.toLowerCase();
        const sexuality = currentUser.sexuality?.toLowerCase() || "";
        const excludedUserIds = new Set(args.excludedIds || []);

        // Exclude all users the current user has already swiped on
        const mySwipes = await ctx.db
            .query("swipes")
            .withIndex("by_from", (q) => q.eq("fromClerkId", myClerkId))
            .collect();
        const swipedClerkIds = new Set(mySwipes.map((s) => s.toClerkId));

        // Determine who to show based on gender + sexuality
        // null = no gender filter (show everyone)
        let targetGenders: string[] | null;
        if (sexuality === "gay" || sexuality === "lesbian" || sexuality === "homosexual") {
            targetGenders = [gender];
        } else if (sexuality === "straight" || sexuality === "heterosexual") {
            if (gender === "man") targetGenders = ["woman"];
            else if (gender === "woman") targetGenders = ["man"];
            else targetGenders = null; // non-binary + straight → show everyone
        } else {
            // bisexual, pansexual, queer, or unset → show everyone
            targetGenders = null;
        }

        // Over-fetch to account for swipe + id exclusions applied in JS
        const candidates = await ctx.db
            .query("users")
            .filter((q) =>
                q.and(
                    q.neq(q.field("clerkId"), myClerkId),
                    q.eq(q.field("onboardingCompleted"), true),
                )
            )
            .take(50);

        const filtered = candidates
            .filter((u) => {
                if (swipedClerkIds.has(u.clerkId)) return false;
                if (excludedUserIds.has(u._id)) return false;
                if (targetGenders !== null && !targetGenders.includes(u.gender?.toLowerCase() ?? "")) return false;
                return true;
            })
            .slice(0, 10);

        // Enrich with cached compatibility scores
        const enriched = await Promise.all(
            filtered.map(async (user) => {
                const [u1, u2] = myClerkId < user.clerkId
                    ? [myClerkId, user.clerkId]
                    : [user.clerkId, myClerkId];

                const cachedScore = await ctx.db
                    .query("compatibility_scores")
                    .withIndex("by_pair", (q) => q.eq("user1ClerkId", u1).eq("user2ClerkId", u2))
                    .first();

                return {
                    _id: user._id,
                    clerkId: user.clerkId,
                    firstName: user.firstName || user.name,
                    age: calculateAge(user.birthday),
                    photos: user.photos || [],
                    location: user.location || "Nearby",
                    prompts: user.prompts || [],
                    bio: user.publicBio || "",
                    compatibility_score: cachedScore?.totalScore ?? 0,
                };
            })
        );

        return enriched;
    },
});

function calculateAge(birthday: string | undefined) {
    if (!birthday) return 0;
    try {
        const birthDate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    } catch (e) {
        return 0;
    }
}
