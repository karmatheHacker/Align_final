import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const submitVerification = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to submitVerification");
        }

        const clerkId = identity.subject;

        const url = await ctx.storage.getUrl(args.storageId);
        if (!url) {
            throw new Error("Failed to retrieve URL for uploaded verification file");
        }

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .first();

        if (!existingUser) {
            throw new Error("User document not found");
        }

        await ctx.db.insert("verifications", {
            clerkId,
            verificationPhotoStorageId: args.storageId,
            verificationPhotoUrl: url,
            submittedAt: Date.now(),
            status: "pending",
        });

        await ctx.db.patch(existingUser._id, {
            verificationStatus: "pending",
        });

        return true;
    },
});

export const getPendingVerifications = query({
    args: {
        adminSecret: v.string(),
    },
    handler: async (ctx, args) => {
        const adminClerkId = process.env.ADMIN_CLERK_ID;
        if (!adminClerkId) {
            throw new Error("ADMIN_CLERK_ID environment variable not set in Convex dashboard");
        }

        if (args.adminSecret !== adminClerkId) {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity || identity.subject !== adminClerkId) {
                throw new Error("Admin access required");
            }
        }

        const pendingVerifications = await ctx.db
            .query("verifications")
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

        const results = [];
        for (const v of pendingVerifications) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", v.clerkId))
                .first();

            const profilePhotos = await ctx.db
                .query("photos")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", v.clerkId))
                .collect();

            results.push({
                userName: user?.firstName || user?.name,
                clerkId: v.clerkId,
                verificationPhotoUrl: v.verificationPhotoUrl,
                profilePhotoUrls: profilePhotos.map(p => p.url),
                submittedAt: new Date(v.submittedAt).toISOString(),
            });
        }

        return results;
    },
});

export const reviewVerification = mutation({
    args: {
        clerkId: v.string(),
        decision: v.union(v.literal("approved"), v.literal("rejected")),
        adminSecret: v.string(),
    },
    handler: async (ctx, args) => {
        const adminClerkId = process.env.ADMIN_CLERK_ID;
        if (!adminClerkId) {
            throw new Error("ADMIN_CLERK_ID environment variable not set in Convex dashboard");
        }

        if (args.adminSecret !== adminClerkId) {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity || identity.subject !== adminClerkId) {
                throw new Error("Admin access required");
            }
        }

        const pendingVerifications = await ctx.db
            .query("verifications")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

        if (pendingVerifications.length === 0) {
            throw new Error("No pending verification found for this user");
        }

        for (const verification of pendingVerifications) {
            await ctx.db.patch(verification._id, {
                status: args.decision,
                reviewedAt: Date.now(),
            });
            // H3: Delete the verification photo from storage after review
            await ctx.storage.delete(verification.verificationPhotoStorageId);
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (user) {
            await ctx.db.patch(user._id, {
                verificationStatus: args.decision,
            });
        }

        return true;
    },
});

export const getMyVerificationStatus = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return "none";
        }

        const clerkId = identity.subject;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .first();

        if (!user) {
            return "none";
        }

        return user.verificationStatus || "none";
    },
});
