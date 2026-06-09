// MED-05 fix: CLERK_JWT_ISSUER_DOMAIN is now REQUIRED — no hardcoded fallback.
// Previously, if this env var was absent, Convex would silently accept tokens
// issued by the dev Clerk instance ("valid-moose-71") in production, meaning
// dev accounts could authenticate against the live backend.
//
// If this throws at startup it means the env var is not set in the Convex
// dashboard — add it under Settings → Environment Variables.
if (!process.env.CLERK_JWT_ISSUER_DOMAIN) {
    throw new Error(
        "[auth.config] CLERK_JWT_ISSUER_DOMAIN environment variable is not set. " +
        "Configure it in the Convex dashboard under Settings → Environment Variables."
    );
}

export default {
    providers: [
        {
            domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
            applicationID: "convex",
        },
    ],
};
