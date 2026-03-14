# Propoze Document Intelligence

## Overview

**Propoze Document Intelligence** is a citation-based AI assistant built into the Align freelancing app. It helps freelancers analyze project requirement documents (RFPs, project briefs, etc.) and prevents generic bidding by grounding every response in specific document evidence.

## Core Identity

Propoze acts as a bridge between complex project requirements and freelancers by:
- **Citations-First Protocol**: Every technical requirement, budget detail, or deadline mentioned includes a bracketed reference `[Section X.X]` or `[Page X]`
- **Evidence-Based Responses**: Only uses information from the uploaded document - never relies on outside knowledge
- **Zero Hallucination**: If information isn't in the document, Propoze explicitly states this

## Architecture

### Database Schema

#### `project_documents`
Stores uploaded project requirement documents:
- `clerkId`: Owner of the document
- `title`: Project name (e.g., "MediCare+ Smart Patient Portal")
- `documentReference`: Document ID (e.g., "#MC-2026-TRD")
- `version`: Document version (e.g., "1.0.2")
- `status`: Document status (e.g., "Confidential / RFP Phase")
- `storageId`: Reference to PDF file in Convex storage
- `parsedContent`: Full text extracted from the document
- `sectionsJson`: JSON array of document sections with metadata
- `isActive`: Only one document can be active per user at a time

#### `propoze_chat_messages`
Stores conversation history with citations:
- `clerkId`: User who sent the message
- `projectDocumentId`: Reference to the project document
- `text`: Message content
- `isAi`: Whether this is an AI response
- `citations`: Array of `{section, quote}` objects
- `mode`: Operation mode (`DOC_QA`, `BID_GEN`, `CHALLENGE_MODE`)

#### `propoze_proposals`
Stores generated proposals:
- `clerkId`: Freelancer who generated the proposal
- `projectDocumentId`: Reference to the project document
- `proposalText`: Full proposal text
- `keyConstraints`: Array of constraints with citations
- `generatedAt`: Timestamp

### Backend Implementation

**File**: `convex/ai/propoze.ts`

Key functions:
- `uploadProjectDocument`: Handles PDF upload and parsing
- `getActiveProjectDocument`: Retrieves the current active document
- `sendPropozeMessage`: Main chat action with citation extraction
- `generateProposal`: BID_GEN mode for creating proposals
- `extractCitations`: Parses AI responses to extract citation references

### Frontend Screens

#### 1. **ProjectDocumentUploadScreen**
- File picker for PDF/text documents
- Form fields for document metadata (title, reference, version, status)
- Document parsing and upload to Convex storage
- Automatic section extraction

#### 2. **PropozeChatScreen**
- Chat interface with citation display
- Active document indicator in header
- Citation badges below AI responses
- Quick prompt suggestions for common questions
- Upload button to switch documents

#### 3. **HeyMayaHomeScreen** (Updated)
- Added "Propoze Intelligence" card with gradient icon
- Direct navigation to Propoze chat

## Operating Modes

### DOC_QA (Document Q&A)
**Purpose**: Answer specific questions about the project document

**Example**:
```
User: "What is the project budget range?"
Propoze: "The allocated budget range is $12,000 to $15,000 [Section 3.1].
Bids exceeding this range will be automatically disqualified."
```

**Protocol**:
- Provide short, evidence-based answers
- Always cite sources with `[Section X.X]` or `[Page X]`
- End with: "Is there anything else you'd like to clarify about this project?"

### BID_GEN (Proposal Generation)
**Purpose**: Draft professional proposals grounded in document constraints

**Structure**:
1. Acknowledge 3 key project constraints with citations
2. Demonstrate understanding of project scope
3. Propose approach aligned with requirements
4. Timeline considerations (referenced from document)
5. Budget alignment (referenced from document)

**Example Output**:
```markdown
## Proposal for MediCare+ Smart Patient Portal

### Key Constraints Acknowledged
1. **HIPAA Compliance Required** [Section 2.1]
   All data storage and transmission must strictly adhere to HIPAA standards.

2. **12-Week Timeline** [Section 3.2]
   The project must be completed within 12 weeks, with a functional Beta
   ready by Week 8 for internal clinical testing [Section 3.3].

3. **Legacy System Integration** [Section 5.1]
   The portal must connect to an existing Epic EMR system using SOAP-based
   API, which is the highest priority risk [Section 5.2].

### Proposed Approach
[Evidence-based approach referencing technical requirements from document]
```

### CHALLENGE_MODE (Verification Questions)
**Purpose**: Generate questions to test document comprehension

**Format**: JSON output with question, correct answer, and section reference

**Example**:
```json
{
  "question": "What encryption standard is required for data at rest?",
  "correctAnswer": "AES-256",
  "section": "Section 2.3",
  "context": "Use AES-256 for data at rest and TLS 1.3 for data in transit."
}
```

## System Prompts

### Core Identity Prompt
```
You are the Propoze Document Intelligence. Your primary goal is to act as a
bridge between complex project requirements (PDFs) and freelancers. You must
prevent generic bidding by grounding every statement in specific document evidence.

MANDATORY PROTOCOL: THE "CITATIONS-FIRST" RULE
For every technical requirement, budget detail, or deadline you mention, you
MUST append a bracketed reference indicating where that data was found.
- Format: [Section X.X] or [Page X]
- Example: "The project requires HIPAA compliance [Section 2.1]."

OPERATIONAL CONSTRAINTS
1. ONLY THE SOURCE: Do not use outside knowledge.
2. NO HALLUCINATION: If you cannot find a specific page or section number,
   do not invent one.
3. CONVERSATIONAL GROUNDING: Use the chat history to understand context, but
   always verify new claims against the document.
```

## Example Interaction Flow

### Scenario: Analyzing MediCare+ Project

**Step 1: Upload Document**
- User navigates to "Propoze Intelligence" from HeyMaya home
- Uploads "PROJECT REQUIREMENTS.pdf"
- Fills in metadata:
  - Title: "MediCare+ Smart Patient Portal"
  - Reference: "#MC-2026-TRD"
  - Version: "1.0.2"
  - Status: "Confidential / RFP Phase"

**Step 2: Document Parsing**
- System extracts sections:
  - Section 1: Executive Summary
  - Section 2: Regulatory & Compliance
  - Section 3: Financials & Timeline
  - Section 4: Technical Stack
  - Section 5: Primary Technical Challenge

**Step 3: Q&A Session**
```
User: "What is the budget for this project?"

Propoze: "The allocated budget range is $12,000 to $15,000 [Section 3.1].
Bids exceeding this range will be automatically disqualified [Section 3.1]."
[Citations: Section 3.1]

User: "What are the compliance requirements?"

Propoze: "The project has three mandatory compliance requirements [Section 2]:

1. HIPAA Compliance: All data storage and transmission must strictly adhere
   to HIPAA standards [Section 2.1]

2. Data Residency: All patient health records (PHR) must be stored on servers
   located within the region of the healthcare provider to comply with local
   data sovereignty laws [Section 2.2]

3. Encryption: Use AES-256 for data at rest and TLS 1.3 for data in transit
   [Section 2.3]

Is there anything else you'd like to clarify about this project?"
[Citations: Section 2.1, Section 2.2, Section 2.3]
```

**Step 4: Generate Proposal (BID_GEN)**
User taps "Generate Proposal" and receives a professional proposal that:
- Lists 3 key constraints with exact citations
- Proposes technical approach aligned with requirements
- References timeline and budget from document

## Citation Extraction

The system uses regex pattern matching to extract citations from AI responses:

```typescript
function extractCitations(aiResponse: string): { cleanedText: string; citations: Citation[] } {
    const citationRegex = /\[([^\]]+)\]/g;
    const citations: Citation[] = [];
    const matches = aiResponse.matchAll(citationRegex);

    for (const match of matches) {
        const citation = match[1];
        if (citation.toLowerCase().includes('section') ||
            citation.toLowerCase().includes('page')) {
            citations.push({
                section: citation,
                quote: "",
            });
        }
    }

    return { cleanedText: aiResponse, citations };
}
```

## UI Features

### Citation Badges
- Small blue badges appear below AI messages
- Display section/page references (e.g., "Section 2.1")
- Bookmark icon for visual consistency
- Help users verify information in the original document

### Document Status Header
- Shows active document title in chat header
- Upload button to switch documents
- Only one document can be active at a time per user

### Empty State
- When no document is uploaded: Prompts user to upload
- When document is active but no messages: Shows quick prompts
- Prompts include:
  - "What is the project budget range?"
  - "What are the compliance requirements?"
  - "What is the development timeline?"
  - "What technical stack is required?"

## Technical Stack

- **Frontend**: React Native with TypeScript
- **Backend**: Convex (for real-time data and serverless functions)
- **AI Model**: Groq API with llama-3.3-70b-versatile
- **File Storage**: Convex Storage (for PDFs)
- **Document Picker**: expo-document-picker
- **UI Components**: React Native, Expo Linear Gradient

## Best Practices for Freelancers

1. **Always Upload the Full Document**: Propoze needs the complete RFP/brief to provide accurate citations
2. **Ask Specific Questions**: "What is the budget?" works better than "Tell me about this project"
3. **Verify Citations**: Click through to the original document to verify context
4. **Use BID_GEN for Proposals**: Let Propoze draft the initial proposal, then customize
5. **Trust the Citations**: If Propoze says information isn't in the document, it's not there

## Preventing Generic Bidding

Propoze helps freelancers avoid generic proposals by:
- **Forcing specificity**: Can't make claims without document evidence
- **Highlighting constraints**: Identifies budget, timeline, and technical limitations upfront
- **Risk identification**: Calls out high-priority challenges (e.g., legacy system integration)
- **Compliance awareness**: Surfaces regulatory requirements that generic bids might miss

## Future Enhancements

- **Multi-document support**: Compare multiple RFPs side-by-side
- **Smart highlighting**: Show exact quotes from document in chat
- **Proposal templates**: Pre-built templates for common project types
- **Competitor analysis**: Compare your proposal against others (if available)
- **Risk scoring**: Automatically assess project risk based on constraints

## Sample Document: MediCare+ Smart Patient Portal

See the example document used for testing: [PROJECT REQUIREMENTS.pdf](./PROJECT%20REQUIREMENTS.pdf)

This document includes:
- Executive Summary with 40% wait time reduction goal
- Mandatory HIPAA compliance requirements
- $12,000-$15,000 budget range
- 12-week timeline with Week 8 Beta milestone
- React Native + Firebase + Twilio tech stack
- Critical Epic EMR SOAP API integration challenge

## Navigation

**From HeyMaya Home:**
1. Tap "Propoze Intelligence" card
2. Upload document or start chatting if document exists

**From Propoze Chat:**
- Tap upload icon (top right) to upload new document
- Tap back to return to HeyMaya home

## Troubleshooting

**Problem**: "No active project document found"
**Solution**: Upload a document via the upload screen first

**Problem**: Citations not appearing in responses
**Solution**: Ensure AI response includes `[Section X.X]` or `[Page X]` format

**Problem**: Document parsing fails
**Solution**: Currently supports PDF and text files - ensure correct file type

**Problem**: Empty sections array
**Solution**: Document may not follow standard section formatting - manual review recommended

---

## Developer Notes

- All Propoze logic is in `convex/ai/propoze.ts`
- UI screens are in `src/screens/Propoze*.tsx`
- Navigation configured in `src/navigation/StackNavigators.tsx`
- Schema additions in `convex/schema.ts` (lines 257-302)
- Temperature set to 0.3 for more factual, less creative responses
- 45-second timeout for AI calls (longer than standard chat due to document context)

**Generated with Claude Code** 🤖
