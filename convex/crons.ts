import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily at 1:00 AM UTC (6:30 AM IST) — recompute any stale personality profiles
crons.daily(
    "recompute-stale-personality-profiles",
    { hourUTC: 1, minuteUTC: 0 },
    internal.ai.personality.recomputeStaleProfiles
);

// Daily at 00:30 AM UTC (6:00 AM IST) — generate fresh AIMs for all active users
crons.daily(
    "generate-daily-aims",
    { hourUTC: 0, minuteUTC: 30 },
    internal.ai.aims.generateDailyAIMs
);

// Every Monday at 2:00 AM UTC (7:30 AM IST) — generate weekly insights for all onboarded users
crons.weekly(
    "generate-weekly-insights",
    { dayOfWeek: "monday", hourUTC: 2, minuteUTC: 0 },
    internal.ai.weeklyInsights.generateWeeklyInsightsForAll
);

// Monthly (1st of month) at 3:00 AM UTC — delete AI chat messages older than 90 days
crons.monthly(
    "prune-old-chat-messages",
    { day: 1, hourUTC: 3, minuteUTC: 0 },
    internal.ai.chat.pruneAllOldChatMessages
);

// Monthly (1st of month) at 4:00 AM UTC — delete expired AIM records
crons.monthly(
    "prune-expired-aims",
    { day: 1, hourUTC: 4, minuteUTC: 0 },
    internal.ai.aims.pruneExpiredAIMs
);

export default crons;
