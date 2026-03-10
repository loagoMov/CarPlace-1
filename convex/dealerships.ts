import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("dealerships").order("desc").take(50);
    },
});

export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("dealerships")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .unique();
    },
});

export const getByClerkOrgId = query({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("dealerships")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
            .unique();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        location: v.string(),
        slug: v.string(),
        clerkOrgId: v.string(),
        logoUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("dealerships")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
            .first();

        if (existing) return existing._id;

        return await ctx.db.insert("dealerships", args);
    },
});
