import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        imageUrl: v.string(),

        // Core Identity (optional initially, filled during onboarding)
        firstName: v.optional(v.string()),
        birthday: v.optional(v.string()),
        gender: v.optional(v.string()),
        sexuality: v.optional(v.string()),
        relationshipType: v.optional(v.string()),
        datingIntention: v.optional(v.string()),

        // Optional Identity
        pronouns: v.optional(v.union(v.array(v.string()), v.null())),
        height: v.optional(v.union(v.object({ value: v.number(), unit: v.string() }), v.null())),

        // Location
        hometown: v.optional(v.union(v.string(), v.null())),
        location: v.optional(v.union(v.string(), v.null())),
        locationCoords: v.optional(v.union(v.object({
            latitude: v.number(),
            longitude: v.number()
        }), v.null())),

        // Education & Career
        education: v.optional(v.union(v.string(), v.null())),
        school: v.optional(v.union(v.string(), v.null())),
        workplace: v.optional(v.union(v.string(), v.null())),

        // Beliefs & Lifestyle
        religion: v.optional(v.union(v.string(), v.null())),
        politics: v.optional(v.union(v.string(), v.null())),
        children: v.optional(v.union(v.string(), v.null())),
        tobacco: v.optional(v.union(v.string(), v.null())),
        drinking: v.optional(v.union(v.string(), v.null())),
        drugs: v.optional(v.union(v.string(), v.null())),

        // Preferences
        distancePreference: v.optional(v.union(v.string(), v.null())),

        // Media
        photos: v.optional(v.array(v.string())),
        publicBio: v.optional(v.union(v.string(), v.null())),
        aiBio: v.optional(v.union(v.string(), v.null())),
        prompts: v.optional(v.union(v.array(v.object({
            id: v.optional(v.number()),
            question: v.string(),
            answer: v.string()
        })), v.null())),

        onboardingCompleted: v.boolean(),
        verificationStatus: v.optional(v.union(v.literal("none"), v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
        createdAt: v.number(),
        updatedAt: v.optional(v.number()),
    }).index("by_clerkId", ["clerkId"]),

    verifications: defineTable({
        clerkId: v.string(),
        verificationPhotoStorageId: v.id("_storage"),
        verificationPhotoUrl: v.string(),
        submittedAt: v.number(),
        status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
        reviewedAt: v.optional(v.number()),
    })
        .index("by_clerkId", ["clerkId"])
        .index("by_status", ["status"]),

    photos: defineTable({
        clerkId: v.string(),
        storageId: v.id("_storage"),
        url: v.string(),
        position: v.number(),
        createdAt: v.number(),
    }).index("by_clerkId", ["clerkId"]),

    voiceProfiles: defineTable({
        clerkId: v.string(),
        storageId: v.id("_storage"),
        url: v.string(),
        durationSeconds: v.number(),
        createdAt: v.number(),
    }).index("by_clerkId", ["clerkId"]),

    swipes: defineTable({
        fromClerkId: v.string(),
        toClerkId: v.string(),
        direction: v.union(v.literal("left"), v.literal("right")),
        createdAt: v.number(),
    })
        .index("by_from", ["fromClerkId"])
        .index("by_to", ["toClerkId"])
        .index("by_to_time", ["toClerkId", "createdAt"])
        .index("by_pair", ["fromClerkId", "toClerkId"]),

    matches: defineTable({
        user1ClerkId: v.string(),
        user2ClerkId: v.string(),
        matchedAt: v.number(),
        icebreakersGenerated: v.boolean(),
    })
        .index("by_user1", ["user1ClerkId"])
        .index("by_user2", ["user2ClerkId"])
        .index("by_user1_time", ["user1ClerkId", "matchedAt"])
        .index("by_user2_time", ["user2ClerkId", "matchedAt"])
        .index("by_pair", ["user1ClerkId", "user2ClerkId"]),

    personality_profiles: defineTable({
        clerkId: v.string(),
        values: v.array(v.string()),
        communicationStyle: v.string(),
        lifeStage: v.string(),
        humor: v.string(),
        emotionalAvailability: v.number(),
        interestVector: v.array(v.string()),
        rawAnalysis: v.optional(v.string()),
        lastComputedAt: v.number(),
        profileVersion: v.number(),
    }).index("by_clerkId", ["clerkId"]),

    compatibility_scores: defineTable({
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
        insightsJson: v.optional(v.string()),
        computedAt: v.number(),
    })
        .index("by_user1", ["user1ClerkId"])
        .index("by_user2", ["user2ClerkId"])
        .index("by_pair", ["user1ClerkId", "user2ClerkId"]),

    ai_matches: defineTable({
        ownerClerkId: v.string(),
        targetClerkId: v.string(),
        compatibilityScore: v.number(),
        explanation: v.string(),
        shown: v.boolean(),
        createdAt: v.number(),
        expiresAt: v.number(),
    })
        .index("by_owner", ["ownerClerkId"])
        .index("by_owner_shown", ["ownerClerkId", "shown"]),

    icebreakers: defineTable({
        matchId: v.id("matches"),
        generatedForClerkId: v.string(),
        option1: v.string(),
        option2: v.string(),
        option3: v.string(),
        bonus: v.string(),
        createdAt: v.number(),
    })
        .index("by_match", ["matchId"])
        .index("by_generated_for", ["generatedForClerkId"]),

    profile_reviews: defineTable({
        clerkId: v.string(),
        whatsWorking: v.string(),
        fixes: v.string(),
        standout: v.string(),
        generatedAt: v.number(),
        profileVersion: v.number(),
    }).index("by_clerkId", ["clerkId"]),

    weekly_insights: defineTable({
        clerkId: v.string(),
        weekStart: v.number(),
        profileViews: v.number(),
        likesReceived: v.number(),
        apsReceived: v.number(),
        matchesMade: v.number(),
        conversationsStarted: v.number(),
        prevProfileViews: v.number(),
        prevLikesReceived: v.number(),
        prevMatchesMade: v.number(),
        whatsWorking: v.string(),
        recommendation: v.string(),
        aimQualityNote: v.string(),
        generatedAt: v.number(),
    })
        .index("by_clerkId", ["clerkId"])
        .index("by_clerk_week", ["clerkId", "weekStart"]),

    profile_views: defineTable({
        viewerClerkId: v.string(),
        viewedClerkId: v.string(),
        viewedAt: v.number(),
    })
        .index("by_viewed", ["viewedClerkId"])
        .index("by_viewed_time", ["viewedClerkId", "viewedAt"])
        .index("by_viewer", ["viewerClerkId"])
        .index("by_pair_day", ["viewerClerkId", "viewedClerkId", "viewedAt"]),

    date_feedback: defineTable({
        fromClerkId: v.string(),
        toClerkId: v.string(),
        thumbsUp: v.boolean(),
        whatWorked: v.optional(v.string()),
        whatDidnt: v.optional(v.string()),
        continuing: v.optional(v.union(v.literal("yes"), v.literal("no"), v.literal("maybe"))),
        createdAt: v.number(),
    })
        .index("by_from", ["fromClerkId"])
        .index("by_pair", ["fromClerkId", "toClerkId"]),

    learned_preferences: defineTable({
        clerkId: v.string(),
        preferredAgeMin: v.optional(v.number()),
        preferredAgeMax: v.optional(v.number()),
        topEducationLevels: v.array(v.string()),
        topReligions: v.array(v.string()),
        topLifeStages: v.array(v.string()),
        topValues: v.array(v.string()),
        topDatingIntentions: v.array(v.string()),
        swipesAnalyzed: v.number(),
        lastComputedAt: v.number(),
    }).index("by_clerkId", ["clerkId"]),

    ai_chat_messages: defineTable({
        clerkId: v.string(),
        text: v.string(),
        isAi: v.boolean(),
        createdAt: v.number(),
    }).index("by_clerkId", ["clerkId"]),
});
