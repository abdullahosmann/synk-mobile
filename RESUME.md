# SYNK React Native Port — Resume Guide

Handoff doc for continuing the web→React Native migration in a fresh session.

## TL;DR for the next session

1. Read this file + `../MIGRATION_MAP.md` (the full Phase-0 audit: routes, tokens, state, web-API replacements).
2. The RN app lives in `mobile/` on branch **`dev`**. Working tree is clean; everything builds.
3. Web app is the **source of truth** in `../src/` — do not modify it.
4. Next task: **Remaining standalone screens + ShareCardRenderer.** Phases 2.6–2.9 are complete; `RoutineBuilder` (`app/workout/builder.tsx`) is now done too. Still-unported routes from the map: `ImportRoutine` (`app/workout/import.tsx` + `app/r/[encoded].tsx`) — **do this next**, then `PlanDetails` (`app/plan-details.tsx`), `WeekEditor` (`app/plan/week/[weekNumber].tsx`), `Paywall` (`app/premium.tsx`), `AdaptiveInsights` (`app/adaptive-insights.tsx`), `AdaptationHistory` (`app/profile/adaptation-history.tsx`). Then **ShareCardRenderer + `share-templates/`** — the dedicated 1080×1920 share cards (WorkoutShareTemplates Template1–5 + the ProgressPhotos comparison), which HistoryWorkoutDetail/ProgressPhotos currently approximate with a simplified on-screen capture. Then Phase 3 polish.

## Status (what's done)

Branch `dev`. **Phases 2.3, 2.4, 2.5 (settings), 2.6 (social), 2.7 (CoachChat), 2.8 (tracking), 2.9 (history) all complete.** All screens below are typecheck-clean and verified rendering on the iPhone 17 Pro Max simulator.

- **Phase 1 — Foundation:** expo-router + NativeWind v4 + reanimated/gesture-handler + svg. Design tokens ported 1:1 from `../src/index.css`. AsyncStorage-backed storage with sync cache + boot hydration. ThemeProvider (light/dark), Inter/Cairo fonts.
- **Shared components (~32):** Btn, Card, Typography, Input, Screen, AppleBackdrop, Toggle, ContinueButton, BottomSheet, BottomNav, ToastProvider, Avatar, CoachAvatar, CoachIcon, OnboardingLayout, GoalPacePicker, TopBar, EmptyState, WeightTrendChart (svg), WeightLogSheet, BodySVG (svg muscle map).
- **Phase 2.1 — Onboarding:** all 18 screens (`app/index.tsx` Welcome → `app/onboarding/*` → `app/login.tsx`, `app/forgot-password.tsx`).
- **Phase 2.2 — Core tabs:** all 5 (`app/(tabs)/dashboard.tsx`, `fitness.tsx`, `community.tsx`, `me.tsx`, `analytics.tsx`).
- **Phase 2.4 — Nutrition core + VoiceLog + FABRadialMenu:** `src/screens/Nutrition.tsx` (rendered in the Fitness NUTRITION segment; `/fitness?tab=nutrition` deep-links to it), `app/voice-log.tsx` (VoiceLog — press-and-hold mock), `app/fab-menu.tsx` (FABRadialMenu — quick-actions overlay). Re-added `src/data/commonFoods.ts` (`ALL_FOODS`). Deferred Nutrition sheets toast "coming soon" — see Remaining work.
- **Phase 2.5 — settings cluster (complete):** `app/settings/index.tsx` (Settings hub), `app/settings/ai-permissions.tsx` (AIPermissions), `app/settings/plan.tsx` (PlanSettings — 17 sheets + pendingChange), `app/settings/profile-edit.tsx` (EditProfile), `app/settings/subscription.tsx` (Subscription — premium + free/upgrade views, expo-linear-gradient), `app/settings/blocked.tsx` (BlockedAccounts), `app/settings/delete-account.tsx` (DeleteAccount), `app/settings/legal/[type].tsx` (LegalScreen — terms + privacy via param), `app/plan-settings/excluded-exercises.tsx` (ExcludedExercises — linked from PlanSettings). `app/settings/_layout.tsx` + `app/plan-settings/_layout.tsx` are slide stacks for the clusters. Note: social brand glyphs are absent in lucide-react-native v1 — substituted Camera/Users/Play.
- **Phase 2.3 — Workout flow (complete):** `src/screens/WorkoutTab.tsx` (in Fitness WORKOUT segment), `app/workout/preview.tsx` (PreSession), `app/workout/complete.tsx` (WorkoutComplete), `app/workout/active.tsx` (ActiveWorkout — live set-logging), `app/exercise/[exerciseId].tsx` (ExerciseProgression — per-exercise chart/history), `app/workout/custom-builder.tsx` (CustomSessionBuilder — custom-workout form), `app/workout/exercise/[id].tsx` (PreSessionExerciseDetail). Shared: `src/components/PlateBar.tsx` (svg barbell + `getPlateColor`).
- **RoutineBuilder (complete):** `app/workout/builder.tsx` (create/edit a custom routine; `?id=` → edit mode). motion `Reorder` → gesture-handler Pan on the grip + reanimated absolute layout (measured row height, commit order onEnd); the `AnimatePresence` library sheet → reanimated `progress` shared value inside a transparent `<Modal>`. Data model: the builder keeps full `Exercise` objects (with images) while editing, then maps down to `CustomRoutineExercise` and saves a `CustomRoutine` to `user.customWorkouts` (web saved a `Workout`); edit-mode prefill re-hydrates images from `EXERCISE_LIBRARY` by name.

## Remaining work
- **Phase 2.4:** ✅ Nutrition core + `src/data/commonFoods.ts` + ✅ VoiceLog + ✅ FABRadialMenu. **Optional follow-up:** the Nutrition sheets deferred in the first pass (custom food/meal builders, recipe builder + share, camera label scanner OCR, weekly JSON export). Their triggers currently toast "coming soon".
- **Phase 2.5:** settings cluster ✅ complete (Settings hub, ai-permissions, plan, profile-edit, subscription, blocked, delete-account, legal, excluded-exercises).
- **Phase 2.6 — social cluster (complete):** `app/inbox.tsx` (Inbox), `app/search.tsx` (Search), `app/challenges/{index,create,[id]}.tsx` (Challenges/Create/Detail), `app/circles/{index,create,[id]}.tsx` (Circles/Create/Detail), `app/profile/[username].tsx` (UserProfile). New shared sheets: `src/components/ReportSheet.tsx`, `BlockConfirmSheet.tsx`. Each cluster has a slide-stack `_layout.tsx`.
- **Phase 2.7 — CoachChat (complete):** `app/coach.tsx`. Subscription gate uses `subscriptionTier !== "free"` (mobile has no `subscriptionStatus`).
- **Phase 2.8 — tracking (complete):** `app/muscle-recovery/{index,[muscleId]}.tsx` (MuscleRecovery/MuscleDetail — uses the RN-ported `BodySVG`; edit slider via PanResponder), `app/measurements.tsx` (BodyMeasurements — react-native-svg chart), `app/photos.tsx` (ProgressPhotos — expo-image-picker + new `src/lib/photoStorage.ts` on expo-file-system + view-shot share), `app/morning-checkin.tsx` (MorningCheckIn — 4-step, PanResponder slider).
- **Phase 2.9 — history (complete):** `app/history/index.tsx` (WorkoutHistory — list + calendar + filters), `app/history/workout/[id].tsx` (HistoryWorkoutDetail — stat grid, set tables, repeat CTA, view-shot share sheet). Slide-stack `app/history/_layout.tsx`.
- **ShareCardRenderer + `share-templates/`:** the dedicated 1080×1920 share cards (incl. the ProgressPhotos before/after comparison, currently a simplified on-screen capture). Pattern: `react-native-view-shot` (`app/workout/complete.tsx`).
- **Phase 3:** polish (safe-area/dark/RTL sweep), Android build, restore the CoachIcon drag + BodySVG pulse animation deferred in this pass.

## The porting loop (proven workflow)

For each screen: read `../src/screens/.../X.tsx` → port to `mobile/app/...` or `mobile/src/screens/...` → `npx tsc --noEmit` → screenshot natively → commit. One screen per commit, lowercase conventional style, targeting `dev`.

## Conventions established

- Colors via `useColors()` (palette) for dynamic/animated/SVG values; NativeWind `className` for static layout. **Do not** put `bg-*`/colored backgrounds in `className` on a reanimated `Animated.View` — they don't apply on web; use inline `style` from the palette (see `Btn.tsx`).
- **Gotcha:** a `Pressable` `style`-as-function (`style={({pressed}) => ({...})}`) does **not** apply inside a `<Modal>` in this Expo SDK 56 / RN 0.85 setup — the returned style is silently dropped (children stack with no bg). Use a plain object `style` for Pressables rendered inside a Modal (it works fine outside, e.g. the custom-builder chips). See `app/workout/builder.tsx` library cards.
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

> Continue the SYNK web→React Native migration. Read `mobile/RESUME.md` and `MIGRATION_MAP.md` first. The RN app is in `mobile/` on branch `dev` (clean, building). The web app in `src/` is the source of truth — don't modify it. Phases 2.6–2.9 are complete; port the next remaining standalone screen — start with `RoutineBuilder` (`src/screens/main/RoutineBuilder.tsx` → `mobile/app/workout/builder.tsx`), following the established loop (read → port → tsc → screenshot natively → commit). Keep the design 1:1 faithful.
