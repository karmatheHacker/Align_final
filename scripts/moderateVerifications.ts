import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import * as readline from "readline";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
const adminSecret = process.env.ADMIN_CLERK_ID;

if (!convexUrl) {
    console.error("❌ Error: EXPO_PUBLIC_CONVEX_URL or CONVEX_URL not found in .env");
    process.exit(1);
}

if (!adminSecret) {
    console.error("❌ Error: ADMIN_CLERK_ID not found in .env");
    process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
};

async function moderate() {
    console.log("\x1b[36m%s\x1b[0m", "Starting manual verification moderation...");

    while (true) {
        try {
            console.log("\nFetching next pending verification...");
            const pendingUsers = await client.query(api.verifications.getPendingVerifications, { adminSecret });

            if (pendingUsers.length === 0) {
                console.log("\x1b[33m%s\x1b[0m", "No pending verifications found. Checking again in 5 seconds...");
                await new Promise(res => setTimeout(res, 5000));
                continue;
            }

            const user = pendingUsers[0];

            console.log("\n------------------------------------------------------");
            console.log("\x1b[1m\x1b[33m%s\x1b[0m", "USER VERIFICATION REQUEST");
            console.log("------------------------------------------------------");
            console.log(`Name:        ${user.userName || 'Unknown'}`);
            console.log(`Clerk ID:    ${user.clerkId}`);

            const date = new Date(user.submittedAt);
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            console.log(`Submitted:   ${formattedTime}`);

            console.log("\n\x1b[36m%s\x1b[0m", "Verification Photo (Live Selfie):");
            console.log(user.verificationPhotoUrl);

            console.log(`\n\x1b[36mProfile Photos (${user.profilePhotoUrls.length}):\x1b[0m`);
            if (user.profilePhotoUrls.length === 0) {
                console.log("None");
            } else {
                user.profilePhotoUrls.forEach((url: string, i: number) => {
                    console.log(`${i + 1}. ${url}`);
                });
            }
            console.log("------------------------------------------------------\n");

            let validChoice = false;
            let decision = "";

            while (!validChoice) {
                const answer = await askQuestion("Approve this user? (y/n): ");
                const lowerAnswer = answer.trim().toLowerCase();

                if (lowerAnswer === 'y' || lowerAnswer === 'yes') {
                    decision = "approved";
                    validChoice = true;
                } else if (lowerAnswer === 'n' || lowerAnswer === 'no') {
                    decision = "rejected";
                    validChoice = true;
                } else {
                    console.log("\x1b[31m%s\x1b[0m", "Invalid input. Please type 'y' to approve or 'n' to reject.");
                }
            }

            // Execute mutation
            console.log(`\nProcessing ${decision} for ${user.clerkId}...`);
            await client.mutation(api.verifications.reviewVerification, {
                clerkId: user.clerkId,
                decision: decision as "approved" | "rejected",
                adminSecret,
            });

            if (decision === "approved") {
                console.log("\x1b[32m%s\x1b[0m", "✅ User approved");
            } else {
                console.log("\x1b[31m%s\x1b[0m", "❌ User rejected");
            }

            // Short delay before fetching the next one
            await new Promise(res => setTimeout(res, 1000));

        } catch (error) {
            console.error("\x1b[31m%s\x1b[0m", "An error occurred:", error);
            console.log("Retrying in 5 seconds...");
            await new Promise(res => setTimeout(res, 5000));
        }
    }
}

// Start the moderation loop
moderate();
