import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

// ─── Type Definitions ─────────────────────────────────────────────────────────
type Citation = {
    section: string;
    quote: string;
};

type DocumentSection = {
    title: string;
    content: string;
    page: number;
    sectionNumber: string;
};

// ─── Groq helper for Propoze AI ───────────────────────────────────────────────
async function callPropozeAI(
    systemPrompt: string,
    userMessage: string,
    documentContext: string
): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY is missing from Convex environment variables.");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45_000);

    try {
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
                    { role: "user", content: `[PROJECT_DOCUMENT]\n${documentContext}\n\n[USER_QUERY]\n${userMessage}` }
                ],
                temperature: 0.3, // Lower temperature for more factual responses
                max_tokens: 1000
            }),
            signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!response.ok) {
            throw new Error(`Groq error ${response.status}`);
        }

        const data: any = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// ─── Document Upload & Management ─────────────────────────────────────────────

export const uploadProjectDocument = mutation({
    args: {
        title: v.string(),
        documentReference: v.optional(v.string()),
        version: v.optional(v.string()),
        status: v.optional(v.string()),
        storageId: v.id("_storage"),
        parsedContent: v.string(),
        sectionsJson: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to uploadProjectDocument");
        }

        const url = await ctx.storage.getUrl(args.storageId);
        if (!url) {
            throw new Error("Failed to retrieve URL for uploaded document");
        }

        const clerkId = identity.subject;

        // Deactivate all other documents for this user
        const existingDocs = await ctx.db
            .query("project_documents")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        for (const doc of existingDocs) {
            await ctx.db.patch(doc._id, { isActive: false });
        }

        // Insert new document as active
        const documentId = await ctx.db.insert("project_documents", {
            clerkId,
            title: args.title,
            documentReference: args.documentReference,
            version: args.version,
            status: args.status,
            storageId: args.storageId,
            url,
            parsedContent: args.parsedContent,
            sectionsJson: args.sectionsJson,
            uploadedAt: Date.now(),
            isActive: true,
        });

        return documentId;
    },
});

export const getActiveProjectDocument = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("project_documents")
            .withIndex("by_clerkId_active", (q) =>
                q.eq("clerkId", identity.subject).eq("isActive", true)
            )
            .first();
    },
});

export const getAllProjectDocuments = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("project_documents")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .order("desc")
            .collect();
    },
});

export const setActiveDocument = mutation({
    args: { documentId: v.id("project_documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const clerkId = identity.subject;

        // Verify ownership
        const document = await ctx.db.get(args.documentId);
        if (!document || document.clerkId !== clerkId) {
            throw new Error("Document not found or unauthorized");
        }

        // Deactivate all other documents
        const existingDocs = await ctx.db
            .query("project_documents")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        for (const doc of existingDocs) {
            await ctx.db.patch(doc._id, { isActive: false });
        }

        // Activate the selected document
        await ctx.db.patch(args.documentId, { isActive: true });

        return true;
    },
});

// ─── Propoze Chat Functionality ───────────────────────────────────────────────

export const getPropozeChatHistory = query({
    args: { projectDocumentId: v.optional(v.id("project_documents")) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        if (args.projectDocumentId) {
            return await ctx.db
                .query("propoze_chat_messages")
                .withIndex("by_clerkId_document", (q) =>
                    q.eq("clerkId", identity.subject).eq("projectDocumentId", args.projectDocumentId)
                )
                .order("asc")
                .collect();
        }

        return await ctx.db
            .query("propoze_chat_messages")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .order("asc")
            .take(50);
    },
});

// ─── Internal Mutations ───────────────────────────────────────────────────────

export const insertPropozeMessage = internalMutation({
    args: {
        clerkId: v.string(),
        projectDocumentId: v.id("project_documents"),
        text: v.string(),
        isAi: v.boolean(),
        citations: v.optional(v.array(v.object({
            section: v.string(),
            quote: v.string(),
        }))),
        mode: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("propoze_chat_messages", {
            clerkId: args.clerkId,
            projectDocumentId: args.projectDocumentId,
            text: args.text,
            isAi: args.isAi,
            citations: args.citations,
            mode: args.mode,
            createdAt: Date.now(),
        });
    },
});

export const getDocumentById = internalQuery({
    args: { documentId: v.id("project_documents") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.documentId);
    },
});

// ─── Extract Citations from AI Response ───────────────────────────────────────

function extractCitations(aiResponse: string): { cleanedText: string; citations: Citation[] } {
    const citationRegex = /\[([^\]]+)\]/g;
    const citations: Citation[] = [];
    const matches = aiResponse.matchAll(citationRegex);

    for (const match of matches) {
        const citation = match[1];
        // Only extract if it looks like a section/page reference
        if (citation.toLowerCase().includes('section') || citation.toLowerCase().includes('page')) {
            citations.push({
                section: citation,
                quote: "", // We'll populate this from the document if needed
            });
        }
    }

    return {
        cleanedText: aiResponse,
        citations: [...new Set(citations.map(c => JSON.stringify(c)))].map(c => JSON.parse(c)),
    };
}

// ─── Main Propoze Chat Action ─────────────────────────────────────────────────

const PROPOZE_SYSTEM_PROMPT = `### IDENTITY
You are the Propoze Document Intelligence. Your primary goal is to act as a bridge between complex project requirements (PDFs) and freelancers. You must prevent generic bidding by grounding every statement in specific document evidence.

### MANDATORY PROTOCOL: THE "CITATIONS-FIRST" RULE
For every technical requirement, budget detail, or deadline you mention, you MUST append a bracketed reference indicating where that data was found.
- Format: [Section X.X] or [Page X]
- Example: "The project requires HIPAA compliance [Section 2.1]."

### OPERATIONAL CONSTRAINTS
1. ONLY THE SOURCE: Do not use outside knowledge. If a freelancer asks about a tech stack not mentioned in the PDF, respond: "The provided document does not specify a technical stack for this requirement."
2. NO HALLUCINATION: If you cannot find a specific page or section number, do not invent one.
3. CONVERSATIONAL GROUNDING: Use the chat history to understand what the freelancer already knows, but always verify new claims against the [PROJECT_DOCUMENT].

### RESPONSE RULES
- Keep responses concise and evidence-based
- Always cite your sources with [Section X.X] or [Page X]
- If information is not in the document, explicitly state this
- End DOC_QA responses with: "Is there anything else you'd like to clarify about this project?"
- Be helpful but never make assumptions beyond the document content`;

export const sendPropozeMessage = action({
    args: {
        text: v.string(),
        mode: v.optional(v.string()), // "DOC_QA", "BID_GEN", "CHALLENGE_MODE"
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const clerkId = identity.subject;
        const text = args.text.trim();
        if (!text) throw new Error("Message cannot be empty");

        // Get active project document
        const activeDoc = await ctx.runQuery(internal.ai.propoze.getActiveDocumentInternal, { clerkId });
        if (!activeDoc) {
            throw new Error("No active project document found. Please upload a project document first.");
        }

        // Parse document sections
        const sections: DocumentSection[] = JSON.parse(activeDoc.sectionsJson);
        const documentContext = activeDoc.parsedContent;

        // Insert user message
        await ctx.runMutation(internal.ai.propoze.insertPropozeMessage, {
            clerkId,
            projectDocumentId: activeDoc._id,
            text,
            isAi: false,
            mode: args.mode,
        });

        // Build mode-specific prompt enhancements
        let modeInstructions = "";
        if (args.mode === "BID_GEN") {
            modeInstructions = "\n\n[BID_GEN MODE]: Draft a proposal that starts by acknowledging 3 key constraints found in the document, citing their exact location. Structure the proposal professionally.";
        } else if (args.mode === "CHALLENGE_MODE") {
            modeInstructions = "\n\n[CHALLENGE_MODE]: Generate verification questions where the 'Correct Answer' is explicitly stated in a specific section of the document. Format as JSON with 'question', 'correctAnswer', and 'section' fields.";
        } else {
            modeInstructions = "\n\n[DOC_QA MODE]: Provide short, evidence-based answers. Always end with: \"Is there anything else you'd like to clarify about this project?\"";
        }

        const systemPrompt = PROPOZE_SYSTEM_PROMPT + modeInstructions;

        // Call AI
        let aiResponse: string;
        try {
            aiResponse = await callPropozeAI(systemPrompt, text, documentContext);
        } catch (error) {
            throw new Error("Failed to generate response from Propoze AI");
        }

        // Extract citations from response
        const { cleanedText, citations } = extractCitations(aiResponse);

        // Insert AI response with citations
        await ctx.runMutation(internal.ai.propoze.insertPropozeMessage, {
            clerkId,
            projectDocumentId: activeDoc._id,
            text: cleanedText,
            isAi: true,
            citations: citations.length > 0 ? citations : undefined,
            mode: args.mode,
        });

        return aiResponse;
    },
});

export const getActiveDocumentInternal = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("project_documents")
            .withIndex("by_clerkId_active", (q) =>
                q.eq("clerkId", args.clerkId).eq("isActive", true)
            )
            .first();
    },
});

// ─── Generate Proposal (BID_GEN) ──────────────────────────────────────────────

export const generateProposal = action({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const clerkId = identity.subject;

        // Get active document
        const activeDoc = await ctx.runQuery(internal.ai.propoze.getActiveDocumentInternal, { clerkId });
        if (!activeDoc) {
            throw new Error("No active project document found");
        }

        const documentContext = activeDoc.parsedContent;

        const proposalPrompt = `Based on the project document, generate a professional proposal for this project.

Include:
1. Three key project constraints with citations
2. Your understanding of the project scope
3. Proposed approach
4. Timeline alignment with document requirements
5. Budget considerations based on document

Use the citations-first approach for all claims.`;

        const systemPrompt = PROPOZE_SYSTEM_PROMPT + "\n\n[BID_GEN MODE]: Generate a complete proposal.";

        const proposalText = await callPropozeAI(systemPrompt, proposalPrompt, documentContext);

        // Extract key constraints with citations
        const { citations } = extractCitations(proposalText);

        // Save proposal
        await ctx.db.insert("propoze_proposals", {
            clerkId,
            projectDocumentId: activeDoc._id,
            proposalText,
            keyConstraints: citations.map(c => ({
                constraint: c.quote || c.section,
                citation: c.section,
            })),
            generatedAt: Date.now(),
        });

        return proposalText;
    },
});

// ─── Get User's Proposals ─────────────────────────────────────────────────────

export const getMyProposals = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("propoze_proposals")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .order("desc")
            .collect();
    },
});
