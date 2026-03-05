import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to generateUploadUrl");
        }

        return await ctx.storage.generateUploadUrl();
    },
});

export const saveProfilePhoto = mutation({
    args: {
        storageId: v.id("_storage"),
        position: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to saveProfilePhoto");
        }

        const url = await ctx.storage.getUrl(args.storageId);

        if (!url) {
            throw new Error("Failed to retrieve URL for uploaded file");
        }

        const clerkId = identity.subject;

        const newPhotoId = await ctx.db.insert("photos", {
            clerkId,
            storageId: args.storageId,
            url,
            position: args.position,
            createdAt: Date.now(),
        });

        return newPhotoId;
    },
});

export const getUserPhotos = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return []; // Return empty array if not authenticated
        }

        const clerkId = identity.subject;

        const photos = await ctx.db
            .query("photos")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .collect();

        // Order by position
        return photos.sort((a, b) => a.position - b.position);
    },
});

export const saveVoiceProfile = mutation({
    args: {
        storageId: v.id("_storage"),
        durationSeconds: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to saveVoiceProfile");
        }

        const clerkId = identity.subject;

        // Find existing voice profiles to replace
        const existingVoiceProfiles = await ctx.db
            .query("voiceProfiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .collect();

        const url = await ctx.storage.getUrl(args.storageId);

        if (!url) {
            throw new Error("Failed to retrieve URL for uploaded voice file");
        }

        // Insert new profile first so user is never left without one
        const newVoiceProfileId = await ctx.db.insert("voiceProfiles", {
            clerkId,
            storageId: args.storageId,
            url,
            durationSeconds: args.durationSeconds,
            createdAt: Date.now(),
        });

        // Now safely delete old voice files from storage and db
        for (const profile of existingVoiceProfiles) {
            await ctx.storage.delete(profile.storageId);
            await ctx.db.delete(profile._id);
        }

        return newVoiceProfileId;
    },
});

export const deletePhoto = mutation({
    args: {
        photoId: v.id("photos"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to deletePhoto");
        }

        const clerkId = identity.subject;

        const photo = await ctx.db.get(args.photoId);
        if (!photo) {
            throw new Error("Photo not found");
        }

        if (photo.clerkId !== clerkId) {
            throw new Error("Unauthorized: Cannot delete another user's photo");
        }

        // Delete from storage
        await ctx.storage.delete(photo.storageId);

        // Delete from database
        await ctx.db.delete(args.photoId);

        return true;
    },
});
