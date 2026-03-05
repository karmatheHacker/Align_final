import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, query } from "../_generated/server";
import { internal } from "../_generated/api";

// ─── Groq helper ──────────────────────────────────────────────────────────────
async function callGroqAI(systemPrompt: string, messages: { role: string; content: string }[]): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error("GROQ_API_KEY is missing from Convex environment variables.");
        throw new Error("GROQ_API_KEY is missing");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 500
        }),
        signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
    if (!response.ok) {
        console.error(`Groq API Error (${response.status})`);
        throw new Error(`Groq error ${response.status}`);
    }
    const data: any = await response.json();
    return data.choices[0].message.content.trim();
}

// ─── Public Queries ───────────────────────────────────────────────────────────
export const getMyAIChatHistory = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("ai_chat_messages")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .order("asc")
            .collect();
    }
});

// ─── Internal Mutations ────────────────────────────────────────────────────────
const MAX_STORED_MESSAGES = 200;

export const insertChatMessage = internalMutation({
    args: { clerkId: v.string(), text: v.string(), isAi: v.boolean() },
    handler: async (ctx, args) => {
        await ctx.db.insert("ai_chat_messages", {
            clerkId: args.clerkId,
            text: args.text,
            isAi: args.isAi,
            createdAt: Date.now(),
        });

        // Cap at MAX_STORED_MESSAGES — delete oldest messages beyond the limit
        const allMessages = await ctx.db
            .query("ai_chat_messages")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .order("asc")
            .collect();
        if (allMessages.length > MAX_STORED_MESSAGES) {
            const toDelete = allMessages.slice(0, allMessages.length - MAX_STORED_MESSAGES);
            for (const msg of toDelete) {
                await ctx.db.delete(msg._id);
            }
        }
    }
});

export const pruneOldChatMessages = internalMutation({
    args: { clerkId: v.string(), cutoffMs: v.number() },
    handler: async (ctx, args) => {
        const old = await ctx.db
            .query("ai_chat_messages")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .order("asc")
            .filter((q) => q.lt(q.field("createdAt"), args.cutoffMs))
            .collect();
        for (const msg of old) {
            await ctx.db.delete(msg._id);
        }
    }
});

// ─── Public Actions ───────────────────────────────────────────────────────────
const RATE_LIMIT_MS = 3000; // min 3 seconds between messages
const MAX_MESSAGE_LENGTH = 2000;

export const sendMessage = action({
    args: { text: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        // Input validation
        const text = args.text.trim();
        if (!text) throw new Error("Message cannot be empty");
        if (text.length > MAX_MESSAGE_LENGTH) throw new Error("Message too long");

        // Rate limiting: reject if last user message was less than 3 seconds ago
        const lastMessageTime = await ctx.runQuery(internal.ai.chat.getLastUserMessageTime, {
            clerkId: identity.subject,
        });
        if (Date.now() - lastMessageTime < RATE_LIMIT_MS) {
            throw new Error("Please wait a moment before sending another message");
        }

        // 1. Get history for context
        const history = await ctx.runQuery(internal.ai.chat.getInternalHistory, { clerkId: identity.subject });

        // 2. Fetch User Profile + Personality for Hyper-Context
        const user = await ctx.runQuery(internal.ai.personality.getUserForPersonality, { clerkId: identity.subject });
        const personality = await ctx.runQuery(internal.ai.personality.getPersonalityProfile, { clerkId: identity.subject });

        // 3. Insert user message
        await ctx.runMutation(internal.ai.chat.insertChatMessage, {
            clerkId: identity.subject,
            text,
            isAi: false
        });

        // 4. Build Hyper-Personalized System Prompt
        let contextSnippet = "";
        if (user || personality) {
            contextSnippet = `User's profile context:\n`;
            if (user) {
                contextSnippet += `Name: ${user.firstName || user.name}\n`;
                contextSnippet += `Bio: ${user.publicBio || "Not provided"}\n`;
                contextSnippet += `Dating intention: ${user.datingIntention || "Not set"}\n`;
                contextSnippet += `Relationship type: ${user.relationshipType || "Not set"}\n`;
            }
            if (personality) {
                contextSnippet += `Personality: ${personality.communicationStyle}, ${personality.lifeStage}\n`;
                contextSnippet += `Values: ${personality.values.join(", ")}\n`;
            }
        }

        const systemPrompt =
            "You are Align AI, a personal dating strategist built into the Align dating app. You are warm, direct, and genuinely helpful. " +
            "You know this user personally — their profile, their goals, their communication style. " +
            "You give specific, honest advice about dating, profiles, conversations, and matches. " +
            "You never give generic advice. You always reference what you actually know about this user. " +
            "You are not a therapist. You are a brilliant friend who happens to know a lot about dating.\n\n" +
            contextSnippet;

        const apiMessages = [
            ...history.map((m: any) => ({ role: m.isAi ? "assistant" : "user", content: m.text })),
            { role: "user", content: text }
        ];

        let aiResponse: string;
        try {
            aiResponse = await callGroqAI(systemPrompt, apiMessages);
        } catch (error) {
            console.error("Groq Chat Error:", error);
            // Re-throw so the frontend can see the actual error during development
            throw error;
        }

        // 5. Insert AI response
        await ctx.runMutation(internal.ai.chat.insertChatMessage, {
            clerkId: identity.subject,
            text: aiResponse,
            isAi: true
        });

        return aiResponse;
    }
});

export const getInternalHistory = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("ai_chat_messages")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .order("desc")
            .take(10);
    }
});

// Returns the timestamp of the most recent message sent by this user (isAi = false)
export const getLastUserMessageTime = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const last = await ctx.db
            .query("ai_chat_messages")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .order("desc")
            .filter((q) => q.eq(q.field("isAi"), false))
            .first();
        return last?.createdAt ?? 0;
    }
});

export const getAllChatUserClerkIds = internalQuery({
    args: {},
    handler: async (ctx) => {
        const all = await ctx.db.query("ai_chat_messages").collect();
        return [...new Set(all.map((m) => m.clerkId))];
    }
});

// Monthly sweep: delete messages older than 90 days for all users
export const pruneAllOldChatMessages = internalAction({
    args: {},
    handler: async (ctx) => {
        const cutoffMs = Date.now() - 90 * 24 * 60 * 60 * 1000;
        const clerkIds = await ctx.runQuery(internal.ai.chat.getAllChatUserClerkIds, {});
        for (const clerkId of clerkIds) {
            await ctx.runMutation(internal.ai.chat.pruneOldChatMessages, { clerkId, cutoffMs });
        }
    }
});
