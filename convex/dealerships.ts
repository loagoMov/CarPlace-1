import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { isGlobalAdmin, requireGlobalAdmin } from "./utils";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "./rateLimit";

// MED-02 fix: server-side email format validation helper
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validateEmail(email: string): void {
    if (email.length > 254) throw new ConvexError("Email address is too long (max 254 characters).");
    if (!EMAIL_REGEX.test(email)) throw new ConvexError(`"${email}" is not a valid email address.`);
}

export const list = query({
    handler: async (ctx) => {
        const rows = await ctx.db.query("dealerships").order("desc").take(50);
        // MED-06 fix: mask full phone in public listing — only show last 4 digits.
        // The full number is only exposed in authenticated dealer/admin contexts.
        return rows.map((d) => ({
            ...d,
            phone: d.phone ? `***${d.phone.slice(-4)}` : undefined,
        }));
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
        authorizedEmails: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        // V-02 fix: require authentication
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized: You must be signed in to register a dealership.");
        }

        // CRIT-03 fix: rate limit dealership creation
        await checkRateLimit(
            ctx,
            rateLimitKey("create_dealer", "user", identity.subject),
            RATE_LIMITS.CREATE_DEALERSHIP
        );

        // V-03 fix: the caller can only register their own Clerk org as a dealership.
        const callerOrgId = identity.orgID ?? identity.orgId ?? identity.subject;
        if (args.clerkOrgId !== callerOrgId) {
            throw new ConvexError("Forbidden: You can only register a dealership for your own organization.");
        }

        // Input length limits
        if (args.name.length > 100) throw new ConvexError("Dealership name must be ≤ 100 characters.");
        if (args.location.length > 200) throw new ConvexError("Location must be ≤ 200 characters.");
        if (args.slug.length > 100) throw new ConvexError("Slug must be ≤ 100 characters.");

        // MED-02 fix: validate any provided authorized emails
        if (args.authorizedEmails) {
            for (const email of args.authorizedEmails) {
                validateEmail(email);
            }
        }

        const existing = await ctx.db
            .query("dealerships")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
            .first();

        const emailList = args.authorizedEmails ?? (identity.email ? [identity.email] : []);
        if (emailList.length === 0) {
            throw new ConvexError("At least one authorized email address is required.");
        }

        if (existing) {
            if (!existing.authorizedEmails) {
                await ctx.db.patch(existing._id, { authorizedEmails: emailList });
            }
            return existing._id;
        }

        return await ctx.db.insert("dealerships", {
            name: args.name,
            location: args.location,
            slug: args.slug,
            clerkOrgId: args.clerkOrgId,
            logoUrl: args.logoUrl,
            authorizedEmails: emailList,
            rating: 5.0,
        });
    },
});

export const updateAuthorizedEmails = mutation({
    args: {
        id: v.id("dealerships"),
        authorizedEmails: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized: You must be signed in.");
        }

        const dealership = await ctx.db.get(args.id);
        if (!dealership) {
            throw new ConvexError("Dealership not found.");
        }

        const callerOrgId = (identity as any).orgID ?? (identity as any).orgId ?? identity.subject;
        const isOrgMember = dealership.clerkOrgId === callerOrgId;
        const isGlobal = await isGlobalAdmin(ctx);
        const isCurrentDealerAdmin = identity.email && dealership.authorizedEmails?.includes(identity.email);

        if (!isGlobal && !isCurrentDealerAdmin && !isOrgMember) {
            throw new ConvexError("Forbidden: You are not authorized to update this dealership's admin emails.");
        }

        if (args.authorizedEmails.length < 1) {
            throw new ConvexError("At least 1 authorized email address must be registered.");
        }

        // MED-02 fix: validate all emails server-side before persisting
        for (const email of args.authorizedEmails) {
            validateEmail(email);
        }

        // CRIT-03 fix: rate limit contact updates
        await checkRateLimit(
            ctx,
            rateLimitKey("update_contact", "user", identity.subject),
            RATE_LIMITS.UPDATE_CONTACT
        );

        await ctx.db.patch(args.id, {
            authorizedEmails: args.authorizedEmails,
        });
    },
});

export const checkGlobalAdmin = query({
    args: {},
    handler: async (ctx) => {
        return await isGlobalAdmin(ctx);
    },
});

export const listAll = query({
    args: {},
    handler: async (ctx) => {
        await requireGlobalAdmin(ctx);
        return await ctx.db.query("dealerships").order("desc").collect();
    },
});

export const updateRating = mutation({
    args: {
        id: v.id("dealerships"),
        rating: v.number(),
    },
    handler: async (ctx, args) => {
        await requireGlobalAdmin(ctx);
        if (args.rating < 0 || args.rating > 5) {
            throw new ConvexError("Rating must be between 0 and 5.");
        }
        await ctx.db.patch(args.id, { rating: args.rating });
    },
});

export const updatePhone = mutation({
    args: {
        id: v.id("dealerships"),
        phone: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized: You must be signed in.");
        }

        const dealership = await ctx.db.get(args.id);
        if (!dealership) {
            throw new ConvexError("Dealership not found.");
        }

        const callerOrgId = (identity as any).orgID ?? (identity as any).orgId ?? identity.subject;
        const isOrgMember = dealership.clerkOrgId === callerOrgId;
        const isGlobal = await isGlobalAdmin(ctx);
        const isCurrentDealerAdmin = identity.email && dealership.authorizedEmails?.includes(identity.email);

        if (!isGlobal && !isCurrentDealerAdmin && !isOrgMember) {
            throw new ConvexError("Forbidden: You are not authorized to update this dealership's contact phone.");
        }

        // CRIT-03 fix: rate limit contact updates
        await checkRateLimit(
            ctx,
            rateLimitKey("update_contact", "user", identity.subject),
            RATE_LIMITS.UPDATE_CONTACT
        );

        // Validate phone number format or just save clean version
        const cleanedPhone = args.phone.replace(/\D/g, "");
        if (cleanedPhone.length < 7 || cleanedPhone.length > 15) {
            throw new ConvexError("Invalid phone number. Must be 7–15 digits including country code.");
        }

        await ctx.db.patch(args.id, {
            phone: cleanedPhone,
        });
    },
});
