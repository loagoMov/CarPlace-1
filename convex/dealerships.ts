import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";

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
        // V-02 fix: require authentication
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized: You must be signed in to register a dealership.");
        }

        // V-03 fix: the caller can only register their own Clerk org as a dealership.
        // This prevents user A from creating a dealership record impersonating org B.
        // Note: The Clerk JWT might use orgID instead of orgId.
        const callerOrgId = identity.orgID ?? identity.orgId ?? identity.subject;
        if (args.clerkOrgId !== callerOrgId) {
            throw new ConvexError("Forbidden: You can only register a dealership for your own organization.");
        }

        // Input length limits
        if (args.name.length > 100) throw new ConvexError("Dealership name must be ≤ 100 characters.");
        if (args.location.length > 200) throw new ConvexError("Location must be ≤ 200 characters.");
        if (args.slug.length > 100) throw new ConvexError("Slug must be ≤ 100 characters.");

        const existing = await ctx.db
            .query("dealerships")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
            .first();

        if (existing) return existing._id;

        return await ctx.db.insert("dealerships", args);
    },
});
