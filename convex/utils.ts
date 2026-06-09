import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "./_generated/server";

// ─── Admin Email Resolution ───────────────────────────────────────────────────
// HIGH-01 fix: GLOBAL_ADMIN_EMAILS is now a REQUIRED env var.
// If it is absent the function throws immediately rather than falling back to
// hardcoded placeholder addresses that an attacker could register on Clerk.
function resolveAdminEmails(): string[] {
    const raw = process.env.GLOBAL_ADMIN_EMAILS;
    if (!raw) {
        throw new ConvexError(
            "Server misconfiguration: GLOBAL_ADMIN_EMAILS environment variable is not set. " +
            "Contact the platform administrator."
        );
    }
    return raw.split(",").map((e) => e.trim()).filter(Boolean);
}

export async function isGlobalAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) return false;
    const adminEmails = resolveAdminEmails();
    return adminEmails.includes(identity.email);
}

export async function requireGlobalAdmin(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized: You must be signed in.");
    const adminEmails = resolveAdminEmails();
    if (!identity.email || !adminEmails.includes(identity.email)) {
        throw new ConvexError("Forbidden: Global administrators only.");
    }
    return identity;
}

