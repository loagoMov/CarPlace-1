import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "./rateLimit";

// ─── Auth helper ─────────────────────────────────────────────────────────────
async function requireAuth(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");
    return identity;
}

// ─── Save a search ────────────────────────────────────────────────────────────
export const save = mutation({
    args: {
        label:        v.string(),
        budgetMin:    v.optional(v.number()),
        budgetMax:    v.optional(v.number()),
        yearMin:      v.optional(v.number()),
        yearMax:      v.optional(v.number()),
        mileageMax:   v.optional(v.number()),
        fuelType:     v.optional(v.string()),
        transmission: v.optional(v.string()),
        category:     v.optional(v.string()),
        color:        v.optional(v.string()),
        makeModel:    v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await requireAuth(ctx);
        const userId = identity.subject;

        // Input validation: cap label length
        if (args.label.length > 100) throw new ConvexError("Search label must be \u2264 100 characters.");

        // CRIT-03 fix: rate limit search history saves
        await checkRateLimit(
            ctx,
            rateLimitKey("search_save", "user", userId),
            RATE_LIMITS.SEARCH_SAVE
        );

        // Keep only the 10 most recent per user — remove oldest if at limit
        const existing = await ctx.db
            .query("searchHistory")
            .withIndex("by_user", (q: any) => q.eq("userId", userId))
            .order("desc")
            .take(10);

        if (existing.length >= 10) {
            // delete the oldest
            await ctx.db.delete(existing[existing.length - 1]._id);
        }

        return await ctx.db.insert("searchHistory", { userId, ...args });
    },
});

// ─── Get a user's history ────────────────────────────────────────────────────
export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const userId = identity.subject;
        return await ctx.db
            .query("searchHistory")
            .withIndex("by_user", (q: any) => q.eq("userId", userId))
            .order("desc")
            .take(10);
    },
});

// ─── Delete one entry ─────────────────────────────────────────────────────────
export const remove = mutation({
    args: { id: v.id("searchHistory") },
    handler: async (ctx, args) => {
        const identity = await requireAuth(ctx);
        const entry = await ctx.db.get(args.id);
        if (!entry) throw new ConvexError("Not found");
        if (entry.userId !== identity.subject) throw new ConvexError("Forbidden");
        await ctx.db.delete(args.id);
    },
});

// ─── Clear all history for user ──────────────────────────────────────────────
export const clearAll = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await requireAuth(ctx);
        const userId = identity.subject;
        const entries = await ctx.db
            .query("searchHistory")
            .withIndex("by_user", (q: any) => q.eq("userId", userId))
            .take(100);
        await Promise.all(entries.map((e: any) => ctx.db.delete(e._id)));
    },
});
