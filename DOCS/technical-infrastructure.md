# CarPlace — Full Technical Infrastructure Analysis

**Project**: CarPlace-1  
**Nature**: B2C / B2B Automotive Marketplace (Gaborone, Botswana)  
**Stack**: Next.js 16 · React 19 · TypeScript · Convex · Clerk · Tailwind CSS v4

---

## 1. High-Level Architecture

```
                        ┌──────────────────────────────────┐
                        │           BROWSER CLIENT          │
                        │  Next.js 16 App Router (React 19) │
                        │  Tailwind v4 · Lucide icons       │
                        └────────┬──────────────┬───────────┘
                                 │              │
                 Clerk JWT Auth  │              │  Convex WebSocket
                 (user sessions) │              │  (real-time data)
                                 ▼              ▼
               ┌─────────────────────┐  ┌──────────────────────┐
               │    Clerk Cloud      │  │   Convex Cloud        │
               │  Authentication     │  │  Database + Storage   │
               │  Organizations      │  │  Serverless Functions │
               │  User Profiles      │  │  Full-text Search     │
               └─────────────────────┘  └──────────────────────┘
```

---

## 2. All Dependencies

| Package | Version | What It Does |
|---|---|---|
| `next` | ^16.1.6 | Core React framework with App Router + server rendering |
| `react` / `react-dom` | ^19.2.4 | UI rendering library |
| `typescript` | ^5.9.3 | Compile-time type safety |
| `@clerk/nextjs` | ^6.39.0 | Auth: sign-in, user profiles, organizations (B2B) |
| `convex` | ^1.32.0 | Real-time database, file storage, serverless functions |
| `tailwindcss` | ^4.2.1 | Utility-first CSS with custom design tokens |
| `@tailwindcss/postcss` | ^4.2.1 | PostCSS plugin for Tailwind v4 |
| `framer-motion` | ^12.34.4 | Animation library (installed, not yet actively used) |
| `lucide-react` | ^0.576.0 | Icon set used throughout all UI |
| `clsx` | ^2.1.1 | Conditional className helper |
| `tailwind-merge` | ^3.5.0 | Resolves conflicting Tailwind class names |
| `autoprefixer` | ^10.4.27 | CSS vendor prefix automation |
| `postcss` | ^8.5.8 | CSS transformation pipeline |
| `eslint` / `eslint-config-next` | ^10 | Code linting |
| `@types/*` | various | TypeScript definitions |

---

## 3. Project File Structure

```
CarPlace-1/
├── convex/                         # Backend (runs on Convex Cloud)
│   ├── _generated/                 # Auto-generated types (do not edit)
│   ├── auth.config.ts              # Tells Convex to validate Clerk JWTs
│   ├── schema.ts                   # Database tables & indexes
│   ├── dealerships.ts              # Dealership queries & mutations
│   └── vehicles.ts                 # Vehicle CRUD + search functions
│
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── layout.tsx              # Root layout — wraps ALL pages
│   │   ├── page.tsx                # / Home page
│   │   ├── globals.css             # Global CSS + custom utility classes
│   │   ├── search/page.tsx         # /search — full-text search
│   │   ├── listings/[id]/page.tsx  # /listings/[id] — vehicle detail
│   │   ├── dashboard/page.tsx      # /dashboard — dealer portal (protected)
│   │   ├── profile/[[...rest]]/    # /profile — Clerk account management
│   │   └── dealers/page.tsx        # /dealers — dealership directory
│   │
│   ├── components/
│   │   ├── ConvexClientProvider.tsx     # Top-level Clerk+Convex provider
│   │   ├── navigation/MobileNav.tsx     # Floating bottom nav bar
│   │   ├── dashboard/
│   │   │   ├── AddVehicleForm.tsx       # Modal: create a listing
│   │   │   └── EditVehicleForm.tsx      # Modal: edit/delete a listing
│   │   └── ui/
│   │       ├── CarCard.tsx              # Vehicle card component
│   │       └── SkeletonLoader.tsx       # Loading skeleton placeholders
│   │
│   └── proxy.ts                    # Next.js middleware (auth route guard)
│
├── DOCS/                           # Project documentation
├── .env.local                      # Secret keys (gitignored)
├── next.config.js                  # Next.js config (images, security headers)
├── tailwind.config.js              # Primary color palette
├── tsconfig.json                   # TypeScript strict mode, @/* alias
└── package.json                    # Scripts and dependencies
```

---

## 4. Configuration Files

### `next.config.js`
- `reactStrictMode: true` — detects side effects in dev (double-renders)
- **Image whitelisting**: allows `*.convex.cloud` (vehicle photos) and `img.clerk.com` / `images.clerk.dev` (user avatars)
- **HTTP Security Headers** applied to all routes:
  - `X-Frame-Options: DENY` — blocks clickjacking
  - `X-Content-Type-Options: nosniff` — blocks MIME sniffing attacks
  - `Strict-Transport-Security` — enforces HTTPS for 1 year
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` — disables camera, mic, geolocation APIs
  - **Content Security Policy (CSP)** — whitelists Clerk domains, Convex WebSocket/cloud, Cloudflare Turnstile (Clerk CAPTCHA), Google Fonts; blocks `object-src`

### `tsconfig.json`
- Target: `es5`, Module: `esnext`, Strict mode on
- `@/*` path alias → `./src/*` (used everywhere instead of relative paths)
- `isolatedModules: true` for fast Babel transforms

### `tailwind.config.js`
- Custom `primary` color palette (sky-blue, 50–900 scale based on `#0ea5e9`)
- Adds `gradient-radial` and `gradient-conic` background utilities

### `globals.css`
Defines 4 reusable utility CSS classes:
- `.glass-nav` — glassmorphism floating navbar (backdrop-filter blur, semi-transparent)
- `.card-premium` — hoverable card with lift animation (`translateY(-4px)`)
- `.btn-primary` — blue CTA button with shadow and active scale-down
- `.no-scrollbar` — hides scrollbar cross-browser

---

## 5. Routes & Pages

### `/` — Home Page
**File**: `src/app/page.tsx`
- Fetches all vehicles via `useQuery(api.vehicles.list, {})`
- Read-only search bar → redirects to `/search` on focus
- Category tabs → link to `/search?category=<id>`
- Renders grid of `<CarCard>` components
- Shows `<SkeletonGrid>` while data loads

### `/search` — Search Page
**File**: `src/app/search/page.tsx`
- Reads `?q=` and `?category=` query params on load
- Debounces text input by 300ms before querying
- Updates URL via `router.replace()` on each change (browser back-button friendly)
- Calls `useQuery(api.vehicles.search, { queryText, category })`
- Live-subscribes to results; shows empty state with reset button

### `/listings/[id]` — Vehicle Detail
**File**: `src/app/listings/[id]/page.tsx`
- Dynamic route — `[id]` is the Convex document `_id`
- Fetches single vehicle via `useQuery(api.vehicles.getVehicle, { id })`
- Shows: image gallery, specs grid (fuel, engine, transmission, color, mileage, year)
- **WhatsApp CTA** → opens `wa.me/` with pre-filled message about the car
- **Book a Visit** button (placeholder `alert()`, not yet implemented)
- Responsive: mobile bottom action bar + desktop sidebar

### `/dashboard` — Dealer Portal *(Protected)*
**File**: `src/app/dashboard/page.tsx`
- Requires auth (enforced by middleware)
- Uses `useOrganization()` + `useOrganizationList()` from Clerk
- Auto-selects the org if user has only 1 membership
- **Auto-syncs dealership**: if org exists in Clerk but not in Convex, calls `createDealership()` automatically
- Shows: stats cards (currently hardcoded placeholders), inventory table with Edit actions
- Opens `<AddVehicleForm>` / `<EditVehicleForm>` modals

### `/profile/[[...rest]]` — Account Management *(Protected)*
**File**: `src/app/profile/[[...rest]]/page.tsx`
- Catch-all route — required by Clerk's `<UserProfile>` internal navigation
- Renders Clerk's managed `<UserProfile>` UI with custom styling overrides

### `/dealers` — Dealer Directory
**File**: `src/app/dealers/page.tsx`
- Fetches all dealerships via `useQuery(api.dealerships.list)`
- Shows dealer cards with logo, name, location, "View Inventory" CTA
- Links to `/dealers/${dealer.slug}` — **⚠️ this page does not yet exist**

---

## 6. Convex Backend (Database & Functions)

### Database Schema (`convex/schema.ts`)

**`dealerships` table**
| Field | Type | Notes |
|---|---|---|
| `name` | string | Display name |
| `location` | string | e.g. "Gaborone, Botswana" |
| `logoUrl` | string (optional) | Logo image URL |
| `slug` | string | URL-safe identifier |
| `clerkOrgId` | string | Links to Clerk Organization |

Indexes: `by_slug`, `by_clerk_org_id`

**`vehicles` table**
| Field | Type | Notes |
|---|---|---|
| `dealerId` | `Id<"dealerships">` | Foreign key |
| `make` / `model` | string | e.g. "Toyota Hilux" |
| `price` | number | In BWP (Pula) |
| `year` | number | 1900–2030 |
| `images` | `Id<"_storage">[]` | Convex Storage IDs (NOT URLs) |
| `status` | `"available" \| "reserved" \| "sold"` | |
| `mileage` | number (optional) | km |
| `fuelType` | string (optional) | Petrol/Diesel/Hybrid/Electric |
| `transmission` | string (optional) | Automatic/Manual |
| `category` | union literal (optional) | suv/sedan/hatchback/truck/coupe/wagon/van/luxury |
| `engineSize` | string (optional) | e.g. "2.8L" |
| `color` | string (optional) | e.g. "White" |
| `searchText` | string (optional) | Auto-generated: `"${make} ${model}".toLowerCase()` |

Indexes: `by_dealer`, `by_status`, `search_vehicles` (full-text search index on `searchText`)

---

### Vehicle Functions (`convex/vehicles.ts`)

**Security Helpers (internal):**
- `requireAuth(ctx)` — throws if no JWT identity found
- `requireVehicleOwnership(ctx, vehicleId)` — validates that the caller's Clerk org ID matches the vehicle's dealership

**Public Queries (no auth needed):**

| Function | What It Does |
|---|---|
| `api.vehicles.list` | All vehicles (or filtered by status), max 100, resolves image URLs |
| `api.vehicles.getVehicle` | Single vehicle by ID with resolved image URLs |
| `api.vehicles.getByDealerId` | Up to 50 vehicles for a specific dealer |
| `api.vehicles.search` | Full-text search + optional category filter, max 20–50 results |

**Protected Mutations (require auth):**

| Function | What It Does |
|---|---|
| `api.vehicles.generateUploadUrl` | Returns a presigned POST URL for direct browser→Convex Storage upload |
| `api.vehicles.create` | Creates a vehicle listing; validates inputs; checks caller owns the dealership |
| `api.vehicles.update` | Updates vehicle fields; re-derives `searchText`; ownership check |
| `api.vehicles.remove` | Deletes all stored images from Convex Storage, then deletes the DB record |

**Validation limits**: make/model ≤ 50 chars, description ≤ 2000 chars, max 10 images, year 1900–2030

---

### Dealership Functions (`convex/dealerships.ts`)

| Function | Auth? | What It Does |
|---|---|---|
| `api.dealerships.list` | No | Returns up to 50 dealerships |
| `api.dealerships.getBySlug` | No | Lookup by URL slug |
| `api.dealerships.getByClerkOrgId` | No | Lookup by Clerk org ID |
| `api.dealerships.create` | Yes | Creates a dealership. Verifies caller's org ID matches. Idempotent (returns existing ID if already created). |

---

## 7. Authentication — How Clerk Wires Into Everything

```
User signs in via Clerk
        │
        ▼
Clerk issues a JWT token with claims:
  - userId (subject)
  - orgId (active organization)
        │
        ▼
ConvexProviderWithClerk (in ConvexClientProvider.tsx)
  attaches JWT to every Convex request
        │
        ▼
convex/auth.config.ts validates the JWT
  against Clerk's JWKS endpoint
        │
        ▼
Convex mutations receive ctx.auth.getUserIdentity()
  → checks orgID === dealership.clerkOrgId
  → grants or denies the operation
```

**Clerk Components used in the app:**
- `<ClerkProvider>` — wraps entire app (in layout.tsx via ConvexClientProvider)
- `<SignedIn>` / `<SignedOut>` — conditional rendering in header
- `<SignInButton mode="modal">` — opens sign-in modal (MobileNav + header)
- `<UserButton>` — avatar + sign-out menu (header)
- `<UserProfile>` — full account management page (`/profile`)
- `<OrganizationList>` — shows org invitations for new dealers (`/dashboard`)
- `useOrganization()` — gets the currently active Clerk organization
- `useOrganizationList()` — gets all memberships, enables auto-select
- `useAuth()` — checks `isSignedIn` for conditional MobileNav rendering

---

## 8. Data Flow: Browser → Convex → Back

### Image Upload (the most complex flow)
```
1. User selects files in AddVehicleForm
2. Client validates: MIME type (jpg/png/webp only), max 5MB each, max 10 files
3. For each file:
   a. Calls generateUploadUrl() mutation → Convex returns presigned URL
   b. Browser POSTs file directly to Convex Storage (bypasses Next.js server)
   c. Convex returns { storageId }
4. storageIds[] collected → passed to createVehicle mutation
5. Mutation stores Id<"_storage">[] in the vehicles table
6. Later, queries call ctx.storage.getUrl(storageId) → returns CDN URL
7. CDN URL returned as imageUrls[] to the frontend
```

### Real-time Data (all useQuery calls)
Every `useQuery()` establishes a **live WebSocket subscription** via Convex. Any DB write triggers all subscribed clients to re-render automatically. No polling, no manual refresh needed.

---

## 9. Middleware & Route Protection

**File**: `src/proxy.ts` *(Note: This should be `src/middleware.ts` — see Known Issues below)*

- Runs on every non-static request before it reaches a page
- Protected routes: `/dashboard(.*)` and `/profile(.*)`
- Unauthenticated users → redirected to Clerk's sign-in, then back to original URL
- All other routes pass through freely (public browsing requires no login)

---

## 10. Environment Variables

| Variable | Where Used | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Browser (public) | Clerk frontend SDK initialization |
| `CLERK_SECRET_KEY` | Server only | Clerk server-side verification |
| `CONVEX_DEPLOYMENT` | Build time | Identifies the Convex deployment (e.g. `dev:acoustic-tiger-6`) |
| `NEXT_PUBLIC_CONVEX_URL` | Browser (public) | Convex WebSocket + HTTP endpoint |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Browser (public) | Convex file serving / HTTP actions URL |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex runtime | Validates Clerk JWTs in Convex backend |

> **Security note**: `.env.local` is correctly listed in `.gitignore` and must NEVER be committed to version control.

---

## 11. Deployment Flow (How It Gets to Production)

```
Developer writes code
        │
        ▼
git push → GitHub / GitLab
        │
        ├──────────────────────────────────┐
        ▼                                  ▼
npx convex deploy                   Vercel auto-deploys
  (manual step)                      from repo
  Pushes schema + functions           Builds Next.js app
  to Convex Production                with env vars from
  cloud environment                   Vercel dashboard
        │                                  │
        ▼                                  ▼
Convex Production Cloud            carplace.vercel.app
  (DB, Storage, Functions)            (static + SSR pages)
        │                                  │
        └──────────── talks to ────────────┘
                   at runtime via
              WebSocket + HTTP requests
```

---

## 12. Known Issues & Gaps

| # | Issue | Impact |
|---|---|---|
| 1 | `src/proxy.ts` should be `src/middleware.ts` | **Critical** — if Next.js doesn't pick it up, `/dashboard` and `/profile` are NOT protected by auth |
| 2 | `api.vehicles.search` returns `images` (storage IDs) instead of `imageUrls` (URLs) | **High** — search result images will break in `<CarCard>` |
| 3 | WhatsApp number on listing page is hardcoded placeholder (`26771234567`) | Medium — should come from the dealership record |
| 4 | Dashboard stats ("P 2.4M", "12 listings") are hardcoded | Low — purely cosmetic but misleading |
| 5 | `/dealers/[slug]` route page does not exist yet | Medium — links from the dealer directory will 404 |
| 6 | Category filtering in `search` uses in-memory JS filter instead of DB index | Low now, performance issue at scale |
| 7 | `framer-motion` is installed but unused | Cosmetic — dead dependency bloating bundle |
| 8 | `Badge` icon imported but unused in `CarCard.tsx` | Cosmetic — minor dead import |
| 9 | `identity.subject` fallback in ownership check could allow edge-case impersonation | Low-risk but worth removing |
