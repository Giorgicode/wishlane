# Wishlane — Project Context

## What is Wishlane
A gift-wishlist and event-sharing mobile app built with **Expo (React Native)** and **Firebase**. Users create gift wishlists, organize them into events, and share events with friends so others can reserve gifts.

## Tech Stack
- **Expo SDK 52** / React Native (managed workflow)
- **expo-router v3** — file-based routing under `app/`
- **Firebase** — Firestore (data), Firebase Auth (email/Google), Cloud Storage
- **react-native-reanimated v3** — all animations
- **TypeScript** — strict mode, no `any` except for RN-web CSS props

## Project Structure
```
app/
  (tabs)/         — Main tab screens (index, gifts, events, friends, shared)
  auth/           — Login/signup screen
  _layout.tsx     — Root layout (auth guard, avatar, bell overlay)
  event-share-link.tsx — Public share link screen
components/
  ambient-bg.tsx  — Reusable ambient glow orb backgrounds (5 presets)
  calendar.tsx    — Full calendar with holidays, events, day-detail panel
  event-details-modal.tsx — Event detail bottom sheet
constants/
  design.ts       — THE single source of truth for all design tokens
  holidays.ts     — 24-country holiday data, floating + fixed dates
lib/
  firestore.ts    — All Firestore read/write functions
types/
  firebase.ts     — TypeScript types for all Firestore documents
```

## Design System (CRITICAL — always follow)
Everything lives in `constants/design.ts`. Never use hardcoded hex values.

### Palette key tokens
- `C.bg` `#07070F` — deepest background
- `C.surface` `#0F0F1C` — card/modal backgrounds
- `C.cream` `#F2E8DA` — editorial headlines
- `C.rose` `#FF6B81` — primary accent (CTAs, icons, active states)
- `C.teal` `#5AF0D0` — friends screen accent
- `C.goldLux` `#C8A95A` — gold accents (shared screen, rules, dots)
- `C.t1/t2/t3` — text hierarchy (93% / 55% / 28% white)

### Glass effect
```ts
// Use glass or glassStrong from design.ts — never write these inline
...glass        // rgba(255,255,255,0.04) + blur(24px)
...glassStrong  // rgba(255,255,255,0.07) + blur(32px)
```

### Ambient backgrounds
Each screen has a color identity:
- Home → `<AmbientBg preset="rose" />` (+ mixed for bottom)
- Gifts → `<AmbientBg preset="rose" />`
- Events → `<AmbientBg preset="mixed" />`
- Friends → `<AmbientBg preset="teal" />`
- Shared → `<AmbientBg preset="gold" />`

### Typography
Use `T.hero`, `T.h1`, `T.h2`, `T.h3`, `T.body`, `T.small`, `T.micro`, `T.label` from design.ts.
Editorial headers use `serif` font from design.ts.

### Spacing / Radius
`S.xs=4 sm=8 md=16 lg=24 xl=32 xxl=48`
`R.xs=6 sm=10 md=14 lg=20 xl=28 xxl=36 full=9999`

## Firestore Data Model
```
users/{uid}/
  gifts/{giftId}          — Gift items (name, description, price, type, link, brand, country, city, place)
  events/{eventId}        — Events (name, description, expirationDate, shareCode, sharedWith[])
  friends/{friendId}      — Friend relationships
  notifications/{notifId} — In-app notifications
  analytics/{eventId}     — Event view/reservation analytics

eventShares/{shareId}     — Cross-user event shares (sharedWithUserId, eventOwnerId, eventId)
users/{uid}/              — User profile (displayName, email, photoURL, friends[])
```

## Key Conventions
- All Firestore calls go through `lib/firestore.ts` — never call Firestore directly from screens
- `as any` only for RN-web CSS-only props (`backdropFilter`, `filter`, `WebkitBackdropFilter`, `overflow: 'hidden'`)
- No comments unless the WHY is truly non-obvious
- No hardcoded brand colors — always import from `constants/design.ts`
- Animations use `react-native-reanimated` — never `Animated` from react-native
- `spring.snappy`, `spring.fast`, `spring.bouncy`, `spring.gentle` for spring configs

## What Has Been Done
- Full dark-luxury glassmorphism design applied to all screens
- Holiday calendar with 24 countries, 100+ entries, floating + fixed dates
- Morphing FAB on gifts and events screens
- Friend requests, event sharing, gift reservation flows
- Analytics tracking per event
- Ambient glow background system
