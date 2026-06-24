/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as dealerships from "../dealerships.js";
import type * as email from "../email.js";
import type * as featured from "../featured.js";
import type * as http from "../http.js";
import type * as rateLimit from "../rateLimit.js";
import type * as reports from "../reports.js";
import type * as searchHistory from "../searchHistory.js";
import type * as telemetry from "../telemetry.js";
import type * as utils from "../utils.js";
import type * as vehicles from "../vehicles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  dealerships: typeof dealerships;
  email: typeof email;
  featured: typeof featured;
  http: typeof http;
  rateLimit: typeof rateLimit;
  reports: typeof reports;
  searchHistory: typeof searchHistory;
  telemetry: typeof telemetry;
  utils: typeof utils;
  vehicles: typeof vehicles;
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
