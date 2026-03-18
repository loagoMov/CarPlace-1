export default {
    providers: [
        {
            domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://valid-moose-71.clerk.accounts.dev",
            applicationID: "convex",
        },
    ]
};
