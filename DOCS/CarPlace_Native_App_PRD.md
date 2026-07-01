# CarPlace Native App — Product Requirements Document (PRD)

**Version**: 1.0  
**Date**: June 2026  
**Status**: Draft — Pending Stakeholder Review  
**Market**: Gaborone, Botswana · B2C / B2B Automotive Marketplace

---

## 1. Executive Summary

CarPlace is a premium automotive marketplace connecting car buyers with vetted dealerships in Botswana. The current product is a **Next.js 16 web app** deployed on Vercel, purpose-built with a mobile-first philosophy — yet it remains constrained by the browser sandbox.

This PRD defines the strategy, technology choices, architecture, and phased plan for **porting CarPlace into a true native iOS and Android application** while preserving the existing Convex + Clerk backend entirely. The native app will unlock hardware capabilities (push notifications, camera, GPS), eliminate web latency, and place CarPlace on the App Store and Google Play — driving brand credibility and organic discovery in a mobile-first market.

---

## 2. Problem Statement

| Problem | Current State | Native App Solves It |
|---|---|---|
| No push notifications | Users must actively return to the app to see new listings | Instant alerts for new vehicles matching saved searches |
| App install-ability | Web shortcut on home screen, no icon prominence | First-class App Store / Play Store presence |
| Camera & image quality | Browser file picker, compressed upload | Native camera with real-time preview and multi-select |
| Performance on low-end devices | Next.js SSR + hydration overhead | Native rendering, no JS hydration cost |
| Offline browsing | Blank screen with no internet | Cached listings viewable offline |
| WhatsApp / phone deeplinks | `wa.me` links open new browser tabs | Native intent opens WhatsApp / dialer in-place |
| Location-based features | `Permissions-Policy` blocks geolocation | Native GPS for "near me" searches |
| Trust & credibility | "Just a website" perception | App Store badge builds buyer and dealer confidence |

---

## 3. Goals & Success Metrics

### 3.1 Goals
1. **G1** — Ship a feature-complete iOS and Android app within **12 weeks** of development start.
2. **G2** — Achieve **100% feature parity** with the current web app at launch.
3. **G3** — Ship **3 native-only features** unavailable on web: push notifications, GPS search, and native camera upload.
4. **G4** — Reuse the existing **Convex + Clerk backend** with zero backend re-architecture.
5. **G5** — Maintain a **single shared codebase** for iOS and Android.

### 3.2 Success Metrics (3 months post-launch)
| Metric | Target |
|---|---|
| App Store rating | ≥ 4.5 ⭐ |
| Day-7 retention | ≥ 40% |
| Push notification opt-in rate | ≥ 60% |
| Avg. session length | ≥ 3 min (vs. 1.8 min on web) |
| WhatsApp conversion rate | ≥ 25% of vehicle detail views |
| Time to first listing (dealer) | ≤ 5 minutes |

---

## 4. Recommended Tech Stack

> [!IMPORTANT]
> The recommended stack is **React Native + Expo (SDK 52+)** with the Expo Router file-system navigation. This is the clear industry choice for a team already fluent in React and TypeScript.

### 4.1 Core Framework

| Layer | Technology | Rationale |
|---|---|---|
| **Cross-platform framework** | **React Native** (via Expo SDK 52) | Single codebase for iOS + Android. Leverages existing React/TS knowledge from the web app. |
| **Development platform** | **Expo** (managed workflow → bare when needed) | Expo Go for instant previews; EAS Build for production; no Xcode/Android Studio required for day-to-day dev. |
| **Navigation** | **Expo Router v3** (file-based) | Mirrors Next.js App Router conventions your team already knows. Deep linking is free. |
| **Language** | **TypeScript** | Already used in CarPlace-1. Full type safety across native + backend. |

### 4.2 Backend (No Changes Required)

| Layer | Technology | Status |
|---|---|---|
| **Real-time Database** | **Convex** (`convex` SDK) | ✅ Works natively — `convex/react-native` package is officially supported |
| **Authentication** | **Clerk** (`@clerk/clerk-expo`) | ✅ Official Expo SDK. Drop-in replacement for `@clerk/nextjs` |
| **File Storage** | **Convex Storage** | ✅ Same upload flow, native file picker replaces browser input |
| **Email** | **Resend** | ✅ Backend-only, no change needed |

### 4.3 UI & Styling

| Layer | Technology | Rationale |
|---|---|---|
| **UI components** | **React Native core** + **NativeWind v4** | NativeWind brings Tailwind CSS class names to React Native. Mirrors the existing Tailwind v4 web styles. |
| **Icons** | **Lucide React Native** | Direct port of `lucide-react` used in the web app. Same icon names. |
| **Animations** | **React Native Reanimated v3** + **Moti** | Moti is a Reanimated wrapper with Framer Motion-like API — maps to existing `framer-motion` intent. |
| **Image handling** | **Expo Image** | Performant, cached image rendering with blur-hash placeholders. |
| **Gestures** | **React Native Gesture Handler** | Required by Reanimated; enables swipe carousels and pull-to-refresh. |

### 4.4 Native Capabilities

| Feature | Package | Notes |
|---|---|---|
| **Push Notifications** | `expo-notifications` + **Expo Push Service** | Free tier covers early scale. Can migrate to FCM/APNs direct later. |
| **Camera & Gallery** | `expo-image-picker` | Native camera + multi-image gallery picker for dealer uploads. |
| **GPS / Location** | `expo-location` | "Search near me" feature. Requests permission gracefully. |
| **Deep Linking** | Expo Router built-in | `carplace://listings/[id]` — links from WhatsApp/email open the app directly. |
| **Haptic Feedback** | `expo-haptics` | Subtle taps on favorites, confirms — premium feel. |
| **Secure Storage** | `expo-secure-store` | Replaces `localStorage` for anonymous session IDs and auth tokens. |
| **Share Sheet** | `expo-sharing` + `Share` API | Native OS share for vehicle listings. |
| **In-App Browser** | `expo-web-browser` | Opens WhatsApp / external links without leaving the app. |

### 4.5 Build & Distribution

| Layer | Technology | Rationale |
|---|---|---|
| **CI/CD & Builds** | **EAS Build** (Expo Application Services) | Cloud builds. No Mac required for Android; free tier available. |
| **OTA Updates** | **EAS Update** | Ship JS-layer bug fixes instantly without App Store review. |
| **App Store** | Apple App Store + Google Play | Both via EAS Submit. |
| **Analytics** | **Expo + custom Convex telemetry** | Existing `telemetryLogs` table already in Convex schema — extend it for native events. |

---

## 5. Architecture

### 5.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   NATIVE CLIENT                          │
│  React Native (Expo Router) · NativeWind · Reanimated    │
│  iOS (SwiftUI bridge) + Android (Jetpack bridge)         │
└────────────┬──────────────────────────────┬─────────────┘
             │                              │
   Clerk Expo JWT Auth                Convex React Native
   (@clerk/clerk-expo)                WebSocket + HTTP
             │                              │
             ▼                              ▼
┌────────────────────┐           ┌──────────────────────┐
│    Clerk Cloud     │           │    Convex Cloud       │
│  Authentication    │           │  DB · Storage · Fns   │
│  Organizations     │           │  Full-text Search     │
│  User Profiles     │           │  Real-time Subs       │
└────────────────────┘           └──────────────────────┘
                                          │
                                 ┌────────▼──────────┐
                                 │   Expo Push        │
                                 │   Notification     │
                                 │   Service (EPNS)   │
                                 └───────────────────┘
```

### 5.2 Repository Structure

We will use a **monorepo** to share TypeScript types and Convex API bindings between the existing web app and the new native app.

```
carplace-monorepo/
├── apps/
│   ├── web/                  # Existing Next.js app (moved here)
│   └── native/               # New Expo app
│       ├── app/              # Expo Router screens (mirrors web /app)
│       │   ├── (tabs)/
│       │   │   ├── index.tsx       # Home feed
│       │   │   ├── search.tsx      # Search + filters
│       │   │   ├── favorites.tsx   # Saved vehicles
│       │   │   └── profile.tsx     # User account
│       │   ├── listings/[id].tsx   # Vehicle detail
│       │   ├── dashboard/          # Dealer portal screens
│       │   └── dealers/            # Dealer directory
│       ├── components/       # Native UI components
│       ├── hooks/            # Shared hooks (useTelemetry, useSearchHistory)
│       └── assets/           # App icons, splash screens
│
├── packages/
│   └── convex/               # Shared Convex schema + generated types
│       ├── schema.ts
│       ├── vehicles.ts
│       ├── dealerships.ts
│       └── _generated/
│
└── package.json              # Turborepo or npm workspaces
```

> [!NOTE]
> The Convex backend functions require **zero changes**. The `convex/` directory is hoisted to a shared package consumed by both `apps/web` and `apps/native`.

### 5.3 Navigation Architecture (Expo Router)

```
app/
├── _layout.tsx               # Root: ClerkProvider + ConvexProvider
├── (auth)/
│   ├── sign-in.tsx
│   └── sign-up.tsx
├── (tabs)/                   # Bottom tab navigator
│   ├── _layout.tsx           # Tab bar config (Home, Search, Favorites, Profile)
│   ├── index.tsx             # Home — featured + for-you feed
│   ├── search.tsx            # Full-text + filter search
│   ├── favorites.tsx         # Saved listings
│   └── profile.tsx           # Account + dealer dashboard entry
├── listings/
│   └── [id].tsx              # Vehicle detail page
├── dashboard/
│   ├── index.tsx             # Dealer inventory overview
│   ├── add.tsx               # Add vehicle (native camera + picker)
│   └── edit/[id].tsx         # Edit vehicle listing
└── dealers/
    ├── index.tsx             # Dealer directory
    └── [slug].tsx            # Dealer profile page
```

---

## 6. Feature Requirements

### 6.1 Feature Parity (MVP — must ship at launch)

| # | Feature | Web Status | Native Implementation |
|---|---|---|---|
| F1 | Home feed (Explore + For You tabs) | ✅ Done | `(tabs)/index.tsx` — `FlatList` with `CarCard` native component |
| F2 | Featured vehicle carousel | ✅ Done | `FlatList` horizontal + Reanimated parallax |
| F3 | Full-text vehicle search | ✅ Done | Real-time Convex `search` query, debounced input |
| F4 | Advanced filters (category, fuel, price, year, transmission) | ✅ Done | Native bottom sheet modal (Gorhom Bottom Sheet) |
| F5 | Vehicle detail page (gallery + specs + CTAs) | ✅ Done | Image carousel with pinch-zoom; specs grid |
| F6 | WhatsApp CTA | ✅ Done | `Linking.openURL('whatsapp://')` — opens native WhatsApp |
| F7 | Book a Visit CTA | ⚠️ Placeholder | Native phone dialer `Linking.openURL('tel:...')` |
| F8 | Favorites / saved listings | ✅ Done | Persisted in Convex, heart icon with haptic feedback |
| F9 | Search history | ✅ Done | Convex `searchHistory` table, rendered in search screen |
| F10 | Dealer sign-in / Clerk auth | ✅ Done | `@clerk/clerk-expo` with OAuth + email/password |
| F11 | Dealer dashboard (inventory CRUD) | ✅ Done | Protected tab stack behind auth check |
| F12 | Add vehicle with image upload | ✅ Done | `expo-image-picker` + same Convex presigned URL flow |
| F13 | Vehicle status management (available/reserved/sold) | ✅ Done | Native picker/segmented control |
| F14 | Dealer directory | ✅ Done | `dealers/index.tsx` |
| F15 | Dealer profile page | ⚠️ 404 on web | `dealers/[slug].tsx` — **build this natively first** |
| F16 | Report a listing | ✅ Done | Native bottom sheet with radio options |
| F17 | Featured listing application | ✅ Done | Native modal flow |
| F18 | Admin panel | ✅ Done | Admin tab (org-gated) |

### 6.2 Native-Only Features (differentiators)

| # | Feature | Priority | Description |
|---|---|---|---|
| N1 | **Push Notifications** | 🔴 Critical | Notify buyers when a new vehicle matching saved filters is listed. Notify dealers when their featured listing is approved/rejected. Uses `expo-notifications` + Convex cron to fan out. |
| N2 | **Native Camera Upload** | 🔴 Critical | Dealers use device camera directly inside the Add Vehicle flow. Multi-select from gallery. Real-time preview strip before submitting. |
| N3 | **Location-Based Search** | 🟡 High | "Show listings near me" toggle. Uses `expo-location` to get coordinates, passes to Convex query filtered by dealership region. |
| N4 | **Haptic Feedback** | 🟡 High | Haptic tap on: favorite, report confirm, status change. Elevates perceived quality. |
| N5 | **Deep Linking** | 🟡 High | `carplace://listings/[id]` — WhatsApp share links open the native app directly. |
| N6 | **Pull-to-Refresh** | 🟢 Medium | `RefreshControl` on all list screens. Convex queries already live-update; this adds manual control. |
| N7 | **Offline Mode** | 🟢 Medium | Cache last-seen listings with `expo-sqlite` or `@tanstack/query` offline persistence. Show stale data with "Offline" banner. |
| N8 | **Biometric Auth** | 🟢 Medium | `expo-local-authentication` — dealers can use Face ID / fingerprint to log in quickly. |
| N9 | **Share Sheet** | 🟢 Medium | Native OS share for vehicle listings — WhatsApp, iMessage, Twitter, etc. |
| N10 | **App Icon Badges** | 🔵 Low | Badge count on app icon for dealers with pending featured applications. |

---

## 7. Screen-by-Screen Design Spec

### 7.1 Home Screen
- **Header**: "CarPlace." wordmark + location pin ("Gaborone, Botswana") + notification bell (N1) + filter icon
- **Search Bar**: Tappable → navigates to `/search`. Debounced inline OR navigates with state.
- **Category Pills**: Horizontal scroll — SUV, Sedan, Hatchback, Luxury, Truck, Van, Coupe, Wagon
- **Featured Carousel**: Auto-scrolling with Reanimated parallax. Badge shows "Featured" pill.
- **Tabs**: "Explore" | "For You" (requires sign-in)
- **Vehicle Grid**: 2-column `FlatList` of `CarCard` components.

### 7.2 Search Screen
- **Sticky search bar** at top (autofocused on nav)
- **Filter Bottom Sheet**: Price range slider, year range, fuel type, transmission, category
- **Results**: Single-column or 2-column toggle
- **Empty state**: illustration + "Try different filters" CTA

### 7.3 Vehicle Detail Screen
- **Image gallery**: Horizontal swipe, pinch-to-zoom, photo count indicator
- **Sticky bottom bar**: "Contact on WhatsApp" (green) + "Book a Visit" (outline)
- **Specs grid**: Make, Model, Year, Mileage, Fuel, Transmission, Engine, Color
- **Dealer card**: Logo, name, location → taps to Dealer Profile
- **Share button**: Native OS share sheet with deep link URL

### 7.4 Dealer Dashboard
- **Stats cards**: Total listings, total views, total favorites (from `listingAnalytics`)
- **Inventory list**: Swipe-to-delete, tap to edit, FAB for "Add Vehicle"
- **Add Vehicle flow** (multi-step):
  1. Camera / Gallery picker (N2)
  2. Basic details (make, model, year, price)
  3. Specs (fuel, transmission, engine, color)
  4. Category + description
  5. Review + Submit

---

## 8. Phased Build Roadmap

### Phase 0 — Foundation (Week 1–2)
- [ ] Initialize Expo app with `npx create-expo-app@latest` (TypeScript template)
- [ ] Set up Expo Router v3 with tab navigator skeleton
- [ ] Configure NativeWind v4 + design tokens (matching web `tailwind.config.js` palette)
- [ ] Integrate `@clerk/clerk-expo` — sign-in / sign-up screens
- [ ] Integrate Convex React Native SDK — verify real-time queries work
- [ ] EAS project setup (`eas.json` — dev/preview/production profiles)
- [ ] Monorepo scaffold with shared `packages/convex`

### Phase 1 — Buyer MVP (Week 3–5)
- [ ] Home screen — featured carousel + explore/for-you tabs
- [ ] `CarCard` native component with image + price + specs
- [ ] Search screen — real-time text search + category pills
- [ ] Filter bottom sheet (Gorhom Bottom Sheet)
- [ ] Vehicle detail screen — image gallery + specs + WhatsApp CTA
- [ ] Favorites screen (Convex-persisted)
- [ ] Dealer directory + dealer profile page (`/dealers/[slug]` — fixes web gap too)
- [ ] Search history (Convex `searchHistory` table)
- [ ] Deep linking setup (N5)

### Phase 2 — Dealer Portal (Week 6–8)
- [ ] Dashboard screen — inventory list + analytics cards
- [ ] Add Vehicle flow with native camera (N2)
- [ ] Edit/Delete vehicle
- [ ] Vehicle status management
- [ ] Report listing modal
- [ ] Featured application flow
- [ ] Biometric auth for dealers (N8)

### Phase 3 — Native Enhancements (Week 9–10)
- [ ] Push notifications — buyer alerts for new matches (N1)
- [ ] Push notifications — dealer alerts for featured approvals (N1)
- [ ] Convex cron job: fan-out push notifications on new vehicle creation
- [ ] GPS "near me" search (N3)
- [ ] Haptic feedback throughout (N4)
- [ ] Pull-to-refresh on all screens (N6)
- [ ] Native share sheet (N9)

### Phase 4 — Polish & Launch (Week 11–12)
- [ ] Offline mode with stale cache (N7)
- [ ] App icon + splash screen design
- [ ] App Store + Play Store metadata (screenshots, description, keywords)
- [ ] Performance profiling (Flipper / React DevTools Profiler)
- [ ] Accessibility audit (VoiceOver / TalkBack)
- [ ] EAS Build — production iOS + Android binaries
- [ ] EAS Submit — App Store Connect + Google Play Console
- [ ] TestFlight / Internal Testing track
- [ ] App Store review submission

---

## 9. Technical Decisions & Rationale

### Why Expo over bare React Native?
Expo's managed workflow eliminates Xcode / Android Studio for 95% of development. EAS Build handles cloud compilation. The remaining 5% (custom native modules) can be handled with Expo Config Plugins or a bare workflow ejection if needed. Given the current team size and timeline, this is the right tradeoff.

### Why NativeWind over StyleSheet?
The team has deep Tailwind expertise from the web app. NativeWind v4 compiles Tailwind classes to React Native `StyleSheet` objects at build time — zero runtime overhead. This dramatically reduces the mental context-switching between web and native codebases.

### Why keep Convex + Clerk?
- Convex's React Native SDK is officially supported and production-ready.
- `@clerk/clerk-expo` is the official Clerk SDK for React Native, maintained by the Clerk team.
- Rebuilding the backend would add months of work with no user-facing benefit.
- All real-time WebSocket subscriptions work identically on native.

### Why monorepo?
The Convex schema and generated TypeScript types are the single source of truth. A monorepo (`npm workspaces` or Turborepo) ensures both `apps/web` and `apps/native` always consume the same backend types — preventing drift and type errors at compile time.

### Push Notifications Architecture
```
New vehicle listed (Convex mutation)
        │
        ▼
Convex cron (runs every 5 min OR triggered inline)
  → queries searchHistory for matching filters
  → for each matching userId, fetch push token
        │
        ▼
Expo Push Notification Service (EPNS)
  → delivers to iOS APNs + Android FCM
        │
        ▼
User device receives notification:
  "New Toyota Hilux for P320,000 just listed! 🚗"
  → tap → deep link → app opens to listing
```

---

## 10. Open Questions & Decisions Required

> [!IMPORTANT]
> The following items require stakeholder decisions before development begins.

| # | Question | Options | Impact |
|---|---|---|---|
| Q1 | **Monetization model for the app?** | Free download + in-app featured listings (existing model) / Subscription for dealers / Freemium for buyers | Affects App Store category and in-app purchase setup |
| Q2 | **App Store name?** | "CarPlace" / "CarPlace Botswana" / "CarPlace — Car Marketplace" | App Store Search Optimization |
| Q3 | **Android-first or simultaneous launch?** | iOS + Android day-1 / iOS first (faster review) | EAS Submit strategy |
| Q4 | **Offline scope?** | View cached listings only / Full offline CRUD (complex) | Phase 4 scope |
| Q5 | **Push notification opt-in timing?** | On first open / After first favorite / After search | Opt-in conversion rate |
| Q6 | **Dealer image limit on native?** | Same as web (10 images, 5MB each) / Increase to 20 with compression | Storage cost |

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Apple App Store rejection | Medium | High | Review guidelines upfront; no objectionable content; clear app description |
| Clerk Expo SDK gaps vs. web | Low | High | Test auth flows in Phase 0; Clerk Expo is battle-tested |
| Convex WebSocket performance on mobile networks | Low | Medium | Implement connection-state UI; Convex handles reconnection automatically |
| NativeWind styling drift from web | Medium | Low | Maintain shared design token file; visual QA on both platforms |
| Push notification spam causing uninstalls | Low | High | Rate-limit notifications; user preference screen for notification types |
| App Store review time delays launch | Medium | Medium | Submit for review 2 weeks before target launch date |

---

## 12. Definition of Done

A feature is considered **done** when:
1. ✅ Implemented and visually matches the design spec on both iOS and Android
2. ✅ TypeScript compiles with zero errors
3. ✅ Tested on a physical device (not just simulator)
4. ✅ Accessibility labels applied (`accessibilityLabel`, `accessibilityRole`)
5. ✅ Loading + error + empty states are handled
6. ✅ No console warnings or errors in production build

---

## 13. Appendix — Dependency Summary

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react-native": "0.76.x",
    "typescript": "^5.9.3",
    
    "convex": "^1.41.0",
    "@clerk/clerk-expo": "^2.x",
    
    "nativewind": "^4.1.x",
    "tailwindcss": "^3.4.x",
    "lucide-react-native": "^0.x",
    "react-native-reanimated": "~3.16.x",
    "moti": "^0.30.x",
    "react-native-gesture-handler": "~2.20.x",
    "expo-image": "~2.0.x",
    
    "expo-notifications": "~0.29.x",
    "expo-image-picker": "~16.0.x",
    "expo-location": "~18.0.x",
    "expo-haptics": "~14.0.x",
    "expo-secure-store": "~14.0.x",
    "expo-web-browser": "~14.0.x",
    "expo-local-authentication": "~15.0.x",
    "expo-sharing": "~12.0.x",
    
    "@gorhom/bottom-sheet": "^4.x"
  }
}
```

---

*This document will be updated as decisions are made and phases are completed. All technical details subject to change based on stakeholder feedback and Phase 0 spike findings.*
