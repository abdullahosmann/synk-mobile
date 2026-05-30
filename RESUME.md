# SYNK React Native Port — Resume Guide

Handoff doc for continuing the web→React Native migration in a fresh session.

## TL;DR for the next session

1. Read this file + `../MIGRATION_MAP.md` (the full Phase-0 audit: routes, tokens, state, web-API replacements).
2. The RN app lives in `mobile/` on branch **`dev`**. Working tree is clean; everything builds.
3. Web app is the **source of truth** in `../src/` — do not modify it.
4. Next task: **Phase 2.4 — port `FABRadialMenu`** (`../src/screens/main/FABRadialMenu.tsx` → `mobile/app/fab-menu.tsx`, 104 lines). VoiceLog is done. After FABRadialMenu, the remaining 2.4 work is the Nutrition deferred sheets (custom food/meal, recipe builder, label scanner OCR). Then Phase 2.5 (settings/social/history/tracking).

## Status (what's done)

Branch `dev`, 20 feature commits. **Phase 2.3 (workout flow) complete; Phase 2.4 Nutrition core + VoiceLog done.** All screens below are typecheck-clean and verified rendering on the iPhone 17 Pro Max simulator.

- **Phase 1 — Foundation:** expo-router + NativeWind v4 + reanimated/gesture-handler + svg. Design tokens ported 1:1 from `../src/index.css`. AsyncStorage-backed storage with sync cache + boot hydration. ThemeProvider (light/dark), Inter/Cairo fonts.
- **Shared components (~32):** Btn, Card, Typography, Input, Screen, AppleBackdrop, Toggle, ContinueButton, BottomSheet, BottomNav, ToastProvider, Avatar, CoachAvatar, CoachIcon, OnboardingLayout, GoalPacePicker, TopBar, EmptyState, WeightTrendChart (svg), WeightLogSheet, BodySVG (svg muscle map).
- **Phase 2.1 — Onboarding:** all 18 screens (`app/index.tsx` Welcome → `app/onboarding/*` → `app/login.tsx`, `app/forgot-password.tsx`).
- **Phase 2.2 — Core tabs:** all 5 (`app/(tabs)/dashboard.tsx`, `fitness.tsx`, `community.tsx`, `me.tsx`, `analytics.tsx`).
- **Phase 2.4 — Nutrition core + VoiceLog:** `src/screens/Nutrition.tsx` (rendered in the Fitness NUTRITION segment; `/fitness?tab=nutrition` deep-links to it), `app/voice-log.tsx` (VoiceLog — press-and-hold mock). Re-added `src/data/commonFoods.ts` (`ALL_FOODS`). Deferred Nutrition sheets toast "coming soon" — see Remaining work.
- **Phase 2.3 — Workout flow (complete):** `src/screens/WorkoutTab.tsx` (in Fitness WORKOUT segment), `app/workout/preview.tsx` (PreSession), `app/workout/complete.tsx` (WorkoutComplete), `app/workout/active.tsx` (ActiveWorkout — live set-logging), `app/exercise/[exerciseId].tsx` (ExerciseProgression — per-exercise chart/history), `app/workout/custom-builder.tsx` (CustomSessionBuilder — custom-workout form), `app/workout/exercise/[id].tsx` (PreSessionExerciseDetail). Shared: `src/components/PlateBar.tsx` (svg barbell + `getPlateColor`).

## Remaining work
- **Phase 2.4:** ✅ Nutrition core + `src/data/commonFoods.ts` re-added + ✅ VoiceLog. **Still to do:** FABRadialMenu, and the Nutrition follow-up sheets deferred in the first pass (custom food/meal builders, recipe builder + share, camera label scanner OCR, weekly JSON export). The deferred sheet triggers currently toast "coming soon".
- **Phase 2.5:** settings cluster, social (Inbox/Search/Challenges/Circles/UserProfile), CoachChat, history, tracking (MuscleRecovery/BodyMeasurements/ProgressPhotos/MorningCheckIn), ShareCardRenderer (needs react-native-view-shot — pattern already used in WorkoutComplete).
- **Phase 3:** polish (safe-area/dark/RTL sweep), Android build, restore the CoachIcon drag + BodySVG pulse animation deferred in this pass.

## The porting loop (proven workflow)

For each screen: read `../src/screens/.../X.tsx` → port to `mobile/app/...` or `mobile/src/screens/...` → `npx tsc --noEmit` → screenshot natively → commit. One screen per commit, lowercase conventional style, targeting `dev`.

## Conventions established

- Colors via `useColors()` (palette) for dynamic/animated/SVG values; NativeWind `className` for static layout. **Do not** put `bg-*`/colored backgrounds in `className` on a reanimated `Animated.View` — they don't apply on web; use inline `style` from the palette (see `Btn.tsx`).
- RTL is per-component: `isArabic` from `useIsArabic()` / `user.language`, `flexDirection: isArabic ? "row-reverse" : "row"`, `textAlign`, font swap Inter↔Cairo, and `transform: [{ scaleX: isArabic ? -1 : 1 }]` to flip directional icons. No `I18nManager.forceRTL`.
- Storage: `getItem`/`setItem` from `src/lib/storage.ts` (sync, hydrated at boot) mirror the web `localStorage` reads.
- Route map matches `../src/App.tsx` 1:1. Welcome is at `/` (`app/index.tsx`); Dashboard is `/dashboard` (`app/(tabs)/dashboard.tsx`).

## Running / testing natively (macOS, iPhone 17 Pro Max sim, UDID 62D22CD2-ABAD-47C1-91FC-C21FA3527F0C)

Native build is already installed on the sim. To iterate you only need Metro:

```bash
cd mobile
# Metro's file watcher crashes intermittently (the "addedFiles" bug) — disable watchman:
WATCHMAN_DISABLE=1 npx expo start --dev-client
```

Then drive the app via deep links + screenshots (no human needed):

```bash
xcrun simctl launch <UDID> app.synk.mobile
# warm the bundle so the dev client connects:
curl -s "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=ios&dev=true" -o /dev/null
xcrun simctl openurl <UDID> "synk://workout/preview"     # deep-link to any route
xcrun simctl io <UDID> screenshot /tmp/shot.png          # capture + view it
```

Gotchas:
- After adding new route files, fully relaunch the app (terminate + launch) so expo-router re-registers routes; a stale bundle shows "Unmatched Route".
- "No script URL provided" red screen = app launched before Metro's bundle was ready. Warm the bundle (curl above), then relaunch.
- If you need a full native rebuild: `npx expo prebuild --platform ios --clean && npx expo run:ios --device <UDID>`. **Watch disk** — a native build needs ~6-8 GB free; the build artifacts filled the disk once this session (cleared via `rm -rf ~/Library/Developer/Xcode/DerivedData/*`).
- Expo SDK 56 / RN 0.85 / new architecture. `legacy-peer-deps=true` is set in `.npmrc`.

## Paste-this prompt to start the next session

> Continue the SYNK web→React Native migration. Read `mobile/RESUME.md` and `MIGRATION_MAP.md` first. The RN app is in `mobile/` on branch `dev` (clean, building). The web app in `src/` is the source of truth — don't modify it. Port the next screen: `src/screens/main/FABRadialMenu.tsx` → `mobile/app/fab-menu.tsx`, following the established loop (read → port → tsc → screenshot natively → commit). Keep the design 1:1 faithful.
