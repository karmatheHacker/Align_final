/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_aims from "../ai/aims.js";
import type * as ai_chat from "../ai/chat.js";
import type * as ai_compatibility from "../ai/compatibility.js";
import type * as ai_dateFeedback from "../ai/dateFeedback.js";
import type * as ai_icebreakers from "../ai/icebreakers.js";
import type * as ai_insights from "../ai/insights.js";
import type * as ai_personality from "../ai/personality.js";
import type * as ai_preferences from "../ai/preferences.js";
import type * as ai_profileReview from "../ai/profileReview.js";
import type * as ai_propoze from "../ai/propoze.js";
import type * as ai_weeklyInsights from "../ai/weeklyInsights.js";
import type * as crons from "../crons.js";
import type * as files from "../files.js";
import type * as swipes from "../swipes.js";
import type * as users from "../users.js";
import type * as verifications from "../verifications.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai/aims": typeof ai_aims;
  "ai/chat": typeof ai_chat;
  "ai/compatibility": typeof ai_compatibility;
  "ai/dateFeedback": typeof ai_dateFeedback;
  "ai/icebreakers": typeof ai_icebreakers;
  "ai/insights": typeof ai_insights;
  "ai/personality": typeof ai_personality;
  "ai/preferences": typeof ai_preferences;
  "ai/profileReview": typeof ai_profileReview;
  "ai/propoze": typeof ai_propoze;
  "ai/weeklyInsights": typeof ai_weeklyInsights;
  crons: typeof crons;
  files: typeof files;
  swipes: typeof swipes;
  users: typeof users;
  verifications: typeof verifications;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
