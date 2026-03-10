# CarPlace Developer Guide

## Architecture Overview
CarPlace is built on a modern, serverless stack designed for scale and developer velocity:
- **Frontend Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS (via custom utilities and basic classes) with Lucide React for iconography.
- **Backend & Database**: Convex (Real-time, serverless database and functions)
- **Authentication**: Clerk (B2B SaaS model focused on Organizations)

## Core Technologies & Patterns

### 1. Convex (Database & Functions)
We use Convex for all state modifications and queries. 
- **Schema (`convex/schema.ts`)**: Defines `dealerships` and `vehicles`. Note the recent additions to the `vehicles` table: `category`, `fuelType`, `transmission`, `engineSize`, and `color`.
- **Functions (`convex/vehicles.ts`, `convex/dealerships.ts`)**: Contains `query` and `mutation` functions. 
- **Important Pattern - Image URLs vs IDs**: Convex Storage uses `Id<"_storage">`. The `list` query maps these internal IDs to publicly accessible URLs (`imageUrls`) before returning data to the client. Mutations (`create`, `update`) always expect the raw `storageIds`.

### 2. Clerk (Authentication & Organizations)
Clerk handles user identities and organization mapping (Dealerships).
- **Organizations**: Users *must* belong to an organization to list vehicles. We use Clerk's `OrganizationSwitcher` and `<UserProfile />` components.
- **Organization Restrictions**: Public creation of organizations is visually restricted in the UI (`/dashboard`). Admin configuration in the Clerk dashboard is required to enforce this at the API level.
- **Routing**: The `<UserProfile />` is mounted at `/profile/[[...rest]]/page.tsx` as a catch-all route to prevent Next.js routing conflicts with Clerk's internal sub-routes.

### 3. Frontend Next.js Conventions
- **Client vs Server Components**: "use client" is utilized heavily in pages that require React state (e.g., forms, search with debounce) or Convex hooks (`useQuery`, `useMutation`).
- **Debounced Search**: See `/search/page.tsx` for an implementation of a React `useEffect` debounce pattern to optimize Convex API calls during text input.

## Recent Architectural Changes / Fixes
- **Image Handling Fix**: Fixed a bug where image URLs were being fed back into the `updateVehicle` mutation instead of storage IDs.
- **Catch-all Profile**: Resolved a bug where Clerk's inner profile navigation threw 404s by migrating `/profile` to a Next.js catch-all route.
- **Role-based UI**: `MobileNav.tsx` now conditionally renders the "Dealer" tab based on the presence of an active Clerk Organization.

## Local Development Checklist
When modifying the application:
1. Ensure both `npm run dev` and `npx convex dev` are running.
2. If modifying schema, wait for `npx convex dev` to sync changes.
3. If importing images, remember to import `Image` from `"next/image"`.
4. Test mobile responsiveness; the app utilizes "Glassmorphism" UI which heavily relies on mobile-specific floating action buttons (FABs) and bottom navigation (`MobileNav.tsx`).
