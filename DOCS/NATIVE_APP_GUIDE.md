# CarPlace — Native App Readiness Guide

> **Goal:** Build a React Native (Expo) companion app that shares CarPlace's existing  
> Convex backend and Clerk authentication — zero duplication of business logic.

---

## 1. Recommended Stack

| Layer | Web (current) | Native (recommended) |
|---|---|---|
| Framework | Next.js 14 | **Expo SDK 51+** (React Native) |
| Auth | `@clerk/nextjs` | **`@clerk/clerk-expo`** |
| Data / Realtime | `convex/react` | **`convex/react-native`** |
| Styling | Tailwind CSS | **NativeWind v4** or StyleSheet API |
| Navigation | Next.js router | **Expo Router v3** (file-based, same mental model) |
| Images | `next/image` | `expo-image` |
| Push Notifications | — | `expo-notifications` + Convex action |

> **Why Expo?** Expo Router v3 is file-based just like Next.js App Router — your team's mental model transfers directly. It also ships OTA updates, making deploys as fast as your web deploys.

---

## 2. Shared Infrastructure (No Changes Needed)

### 2a. Convex Backend
All your existing queries and mutations work identically in React Native.

```ts
// In your native app — exact same import path
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";   // symlink or copy

const vehicles = useQuery(api.vehicles.getByDealerId, { dealerId });
```

The `convex/_generated` folder can be **shared** between the web and native repos via:
- A Git submodule pointing at the Convex project directory, **or**
- A local npm workspace (`packages/convex-backend`) used by both apps.

### 2b. Clerk Auth
Swap the import, keep the logic:

```ts
// Web
import { useUser, useOrganization } from "@clerk/nextjs";

// Native — identical API surface
import { useUser, useOrganization } from "@clerk/clerk-expo";
```

Clerk Expo requires adding `expo-secure-store` as the token cache:

```ts
// app/_layout.tsx (native)
import { ClerkProvider } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_KEY!} tokenCache={tokenCache}>
      {/* ... */}
    </ClerkProvider>
  );
}
```

---

## 3. Design Token Mapping

Copy these values from `tailwind.config.js` into a shared `theme.ts` file:

```ts
// packages/theme/index.ts  (shared between web + native)
export const colors = {
  primary: {
    50:  "#f0f9ff",
    100: "#e0f2fe",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
  },
};

export const radius = {
  card: 24,     // rounded-3xl
  button: 12,   // rounded-xl
  chip: 99,     // rounded-full
};

export const spacing = {
  pagePadding: 16,
  cardPadding: 16,
  sectionGap: 24,
};
```

---

## 4. Screen Map

| Web Route | Native Screen | Priority |
|---|---|---|
| `/` | `Home` — featured cars grid | P0 |
| `/search` | `Search` — filter + list | P0 |
| `/listings/[id]` | `ListingDetail` — images, price, WhatsApp CTA | P0 |
| `/dealers` | `Dealers` — dealer list | P1 |
| `/dealers/[slug]` | `DealerProfile` | P1 |
| `/dashboard` | `DealerDashboard` — vehicle cards, stats | P1 |
| `/dashboard/analytics` | `Analytics` — metric cards | P2 |
| `/dashboard/billing` | `Billing` — invoice cards | P2 |
| `/profile` | `Profile` — Clerk user card | P1 |
| `/favorites` | `Favorites` | P1 |

---

## 5. Recommended Folder Structure

```
carplace-native/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          ← Home
│   │   ├── search.tsx
│   │   ├── dealers.tsx
│   │   └── profile.tsx
│   ├── listings/[id].tsx
│   ├── dashboard/
│   │   ├── index.tsx
│   │   ├── analytics.tsx
│   │   └── billing.tsx
│   └── _layout.tsx            ← ClerkProvider + ConvexProvider
├── components/
│   ├── VehicleCard.tsx
│   ├── StatCard.tsx
│   └── InvoiceCard.tsx
├── convex/                    ← Symlink to ../CarPlace-1/convex
└── theme.ts
```

---

## 6. Bootstrap Steps

```bash
# 1. Create the Expo project
npx create-expo-app@latest carplace-native --template tabs

# 2. Install Clerk Expo
cd carplace-native
npx expo install @clerk/clerk-expo expo-secure-store

# 3. Install Convex
npx expo install convex

# 4. Install NativeWind (optional)
npx expo install nativewind tailwindcss
npx tailwindcss init

# 5. Link your Convex backend (same project as web)
npx convex dev
```

`.env.local`:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

---

## 7. Key Differences to Watch For

| Concern | Web | Native |
|---|---|---|
| Touch targets | `min-h-[44px]` CSS | `minHeight: 44` in StyleSheet |
| Safe area | `env(safe-area-inset-bottom)` | `useSafeAreaInsets()` from `react-native-safe-area-context` |
| Links | `<Link href="…">` | `router.push("…")` or `<Link>` (Expo Router) |
| Images | `<Image fill …>` | `<Image contentFit="cover" …>` (expo-image) |
| WhatsApp CTA | `<a href="https://wa.me/…">` | `Linking.openURL("https://wa.me/…")` |

---

## 8. Push Notifications (Future)

1. Store Expo push token per dealership in a `pushTokens` Convex table.
2. Call `expo-server-sdk` from a Convex action when a buyer favorites a car.
3. Register token on app launch with `expo-notifications`.

---

## 9. Suggested Timeline

| Week | Milestone |
|---|---|
| 1 | Bootstrap Expo, connect Convex + Clerk, build Home & Search |
| 2 | Listing Detail + WhatsApp CTA + Favorites |
| 3 | Dealer Profile + Dealers list |
| 4 | Dealer Dashboard (cards) + Analytics |
| 5 | Billing, Profile, polish + TestFlight / Play Store internal track |
