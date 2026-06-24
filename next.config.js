/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,

  // ─── V-05 Fix: Restrict image proxy to known trusted hostnames ──────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.convex.cloud",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
        pathname: "/**",
      },
    ],
  },

  // ─── V-04 Fix: HTTP Security Headers ────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // LOW-03 fix: X-Frame-Options kept for legacy browser support,
          // but frame-ancestors in CSP is the modern standard (see below).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Only send HSTS in production – sending it on localhost makes Safari
          // permanently upgrade http:// → https://, breaking the dev server.
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
            : []),
          // MED-03 fix: tightened from strict-origin-when-cross-origin so that
          // external links (e.g. WhatsApp deep-links) don't receive our origin.
          { key: "Referrer-Policy", value: "no-referrer" },
          // LOW-04 fix: extended to explicitly deny payment, USB, bluetooth, etc.
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "payment=()",
              "usb=()",
              "bluetooth=()",
              "accelerometer=()",
              "gyroscope=()",
              "magnetometer=()",
            ].join(", "),
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: Clerk JS is served from *.clerk.com and *.clerk.accounts.dev
              // MED-01 note: 'unsafe-inline' and 'unsafe-eval' are required by Next.js
              // and Clerk in their current versions. To fully remove them, migrate to
              // nonce-based CSP via Next.js middleware (tracked as future backlog item).
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.dev https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.convex.cloud https://img.clerk.com https://images.clerk.dev",
              // Connections: Convex realtime + Clerk APIs
              "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.dev https://clerk-telemetry.com",
              "worker-src 'self' blob:",
              // Frames: Clerk OAuth popups and Cloudflare Turnstile
              "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.dev https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              // LOW-03 fix: frame-ancestors replaces the legacy X-Frame-Options header
              // for modern browsers. Both are set for maximum compatibility.
              "frame-ancestors 'none'",
              // Security best-practice: block access to browser features via CSP
              // Only upgrade insecure requests in production to avoid HTTPS
              // enforcement on the local dev server (breaks Safari).
              ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
            ].join("; "),
          },
          // Defense-in-depth: prevent browsers from caching sensitive admin/dashboard pages
          ...(process.env.NODE_ENV === "production"
            ? []
            : [{ key: "Cache-Control", value: "no-store" }]),
        ],
      },
      // Stricter no-cache headers on authenticated routes
      {
        source: "/(admin|dashboard|profile)(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
