# SYNK (React Native / Expo) — UI/UX Audit

Front-end / UI / UX only. Backend, API, and data-layer correctness are explicitly **out of scope** — findings assume data arrives; this is about what the user *sees and can do* when reality isn't the happy path. Audited against branch `dev`, the Expo Router app under `mobile/`.

Where a gap is inherited 1:1 from the web source it's labelled **(mirrors web)** — it's still flagged, because the bar here is a shippable native product, not parity.

---

## 0. Verification & evidence

Findings were verified against a live build on the booted **iPhone 17 Pro Max** simulator (iOS 26.5, UDID `62D22CD2-…3527F0C`) with Metro running. Captures live in **[`screenshots/`](screenshots/)** and are cited inline.

**Verification tags**
- **[EXECUTED]** — I drove the code path on the sim and observed the result, but have no picture isolating it.
- **[EXECUTED+SCREENSHOT]** — I drove it *and* a screenshot proves what rendered (filename cited).
- **[CODE-VERIFIED]** — confirmed by reading the source only (no runtime observation).

**Method & its limits.** Screens reachable by deep link (`synk://<route>`) were launched and captured; EN/AR + light/dark were toggled by editing the app's AsyncStorage (`synk:user.language`, `theme`) and relaunching, so the **AR-dark** extreme was captured for the hub screens. This environment has **no in-app tap driver** (no `idb`/`cliclick`, `simctl` has no `tap`), so findings that depend on tapping an in-screen control — week-strip day select (M2), list/calendar toggle and filter chips (m1, M7), Customize sheet — are **[CODE-VERIFIED]** only, not pictured. The two routing blockers, the analytics gate, and the RTL/dark system were confirmed visually.

**What the screenshots establish at a glance:** RTL and dark mode are broadly *correct* (see `dashboard_ar_dark.png`, `history_ar_dark.png`, `coach_ar_dark.png` — strips reverse, text right-aligns, icons flip, dark palette reads well), which is why the RTL findings below (m1, m2, the muscle-tag note) are framed as *localized misses in an otherwise-working system*, not a systemic RTL failure.

---

## 1. Inventory (audited surface)

### Route table (`app/`)
**Entry / auth:** [index.tsx](app/index.tsx) (Welcome), [login.tsx](app/login.tsx), [forgot-password.tsx](app/forgot-password.tsx)

**Onboarding (18):** [_layout](app/onboarding/_layout.tsx), goal, stats, body-composition, training, injuries, health, health-sync, coach, coach-intro, ai-rules, attribution, notifications, generating, plan-preview, paywall (+ `app/index` welcome, `login`)

**Tabs (custom bar):** [dashboard](app/(tabs)/dashboard.tsx), [fitness](app/(tabs)/fitness.tsx) (hosts Workout + Nutrition segments), [community](app/(tabs)/community.tsx), [me](app/(tabs)/me.tsx), [analytics](app/(tabs)/analytics.tsx)

**Workout:** [preview](app/workout/preview.tsx) (PreSession), [active](app/workout/active.tsx), [complete](app/workout/complete.tsx), [builder](app/workout/builder.tsx), [custom-builder](app/workout/custom-builder.tsx), [import](app/workout/import.tsx), [exercise/[id]](app/workout/exercise/[id].tsx)

**Tracking / plan:** [history](app/history/index.tsx) + [history/workout/[id]](app/history/workout/[id].tsx), [exercise/[exerciseId]](app/exercise/[exerciseId].tsx), [muscle-recovery](app/muscle-recovery/index.tsx) + [[muscleId]](app/muscle-recovery/[muscleId].tsx), [measurements](app/measurements.tsx), [photos](app/photos.tsx), [morning-checkin](app/morning-checkin.tsx), [plan-details](app/plan-details.tsx), [plan/week/[weekNumber]](app/plan/week/[weekNumber].tsx), [adaptive-insights](app/adaptive-insights.tsx), [plan-settings/excluded-exercises](app/plan-settings/excluded-exercises.tsx)

**Social:** [inbox](app/inbox.tsx), [search](app/search.tsx), [coach](app/coach.tsx) (CoachChat), [challenges](app/challenges/index.tsx)/create/[id], [circles](app/circles/index.tsx)/create/[id], [profile/[username]](app/profile/[username].tsx), [profile/adaptation-history](app/profile/adaptation-history.tsx), [r/[encoded]](app/r/[encoded].tsx) (shared-routine import)

**Settings:** [index](app/settings/index.tsx), ai-permissions, plan, profile-edit, subscription, blocked, delete-account, legal/[type], [premium](app/premium.tsx)

**Overlays:** [fab-menu](app/fab-menu.tsx), [voice-log](app/voice-log.tsx)

### Shared primitives (`src/components`)
Screen, Btn, Card, Typography (AppText), Input, Toggle, AppleBackdrop, ContinueButton, **BottomSheet**, **BottomNav** (custom tab bar), **ToastProvider**, **Avatar**, **CoachAvatar**, CoachIcon, OnboardingLayout, GoalPacePicker, TopBar, **EmptyState**, WeightTrendChart, WeightLogSheet, BodySVG, PlateBar, ShareCardRenderer + share-templates, RoutineReplacementSheet, ReportSheet, BlockConfirmSheet, LanguageToggle.

### Systems
- **Theme:** `ThemeProvider` + `colors.ts` light/dark palettes; consumed via `useColors()` (inline) and NativeWind `dark:` classes.
- **i18n / RTL:** no `I18nManager.forceRTL`. Strings are inline `isArabic ? ar : en` ternaries (185 in dashboard alone); RTL is applied **per component** via `flexDirection`, `textAlign`, font swap, and `scaleX:-1` icon flips.
- **State / data:** `AppContext` over AsyncStorage (sync cache). `todaysLogs` is the only *live* log source; past days archive to `synk:logs:<date>`.
- **Root:** [_layout.tsx](app/_layout.tsx) — GestureHandlerRoot → SafeAreaProvider → Theme → App → Toast → `<Stack>`. **No error boundary, no `+not-found` route.**

---

## 2. Findings

### BLOCKERS

#### B1 — Dashboard Nutrition & Hydration cards route to a non-existent screen
- **Location:** [dashboard.tsx:610](app/(tabs)/dashboard.tsx#L610), [dashboard.tsx:677](app/(tabs)/dashboard.tsx#L677)
- **Category:** 4 (navigation integrity)
- **Scenario:** On the dashboard (the default landing screen) the user taps the calorie-ring / "LOG MEAL" nutrition card, or the hydration card.
- **Current behavior:** `router.push("/nutrition")`. There is **no `/nutrition` route** — the nutrition screen is rendered inside `/fitness?tab=nutrition`. expo-router shows its raw "Unmatched Route" screen (see B3).
- **Gap:** The single most-used affordance on the home screen is a dead-end. (Note the same screen correctly uses `/fitness?tab=nutrition&openSearch=1` elsewhere — e.g. voice-log, FAB — so the bare `/nutrition` here is simply wrong.)
- **Severity:** Blocker — primary navigation on the home screen is broken.
- **Verification:** **[EXECUTED+SCREENSHOT]** — `synk://nutrition` (the exact route string the card pushes) resolves to the Unmatched Route screen.
- **Screenshot:** [`B1_nutrition_route.png`](screenshots/B1_nutrition_route.png)
- **Suggested fix:** Change both pushes to `router.push("/fitness?tab=nutrition")` (and `&openSearch=1` for the "log meal" intent), matching [fab-menu.tsx:38](app/fab-menu.tsx#L38).

#### B2 — Changing your coach is completely unreachable (`/coach-swap` has no route)
- **Location:** [coach.tsx:107](app/coach.tsx#L107), [settings/index.tsx:178](app/settings/index.tsx#L178); consumer [onboarding/coach.tsx:25](app/onboarding/coach.tsx#L25)
- **Category:** 4 (link to non-existent route)
- **Scenario:** User taps the swap icon in the CoachChat header, or Settings → Coach.
- **Current behavior:** `router.push("/coach-swap")` → Unmatched Route. `onboarding/coach.tsx` is written to *serve* swap mode (`isSwapMode = pathname === "/coach-swap"`) but lives at `/onboarding/coach`, so that branch is never reached.
- **Gap:** Two separate entry points to "change coach" both dead-end. A core post-onboarding setting is impossible to use.
- **Severity:** Blocker.
- **Suggested fix:** Add `app/coach-swap.tsx` that renders the CoachSelection component (it already detects swap mode by path), or point both buttons at a real swap route.
- **Verification:** **[EXECUTED+SCREENSHOT]** — `synk://coach-swap` resolves to Unmatched Route; the swap button itself is visible (top-left refresh icon) in `coach_ar_dark.png`.
- **Screenshot:** [`B2_coach_swap_route.png`](screenshots/B2_coach_swap_route.png), [`coach_ar_dark.png`](screenshots/coach_ar_dark.png)

#### B3 — No custom "not found" screen; dead links fall to the raw dev screen
- **Location:** `app/` has no `+not-found.tsx`; [_layout.tsx](app/_layout.tsx) has no error boundary.
- **Category:** 1 / 4 (designed states, navigation)
- **Scenario:** Any unmatched route (B1, B2, a stale deep link, a bad share link) — or any screen that throws during render.
- **Current behavior:** Unmatched routes show expo-router's default English "Unmatched Route" page; a render throw redboxes in dev and crashes/whitescreens in production (no boundary above `<Stack>`).
- **Gap:** No designed, localized, theme-aware fallback or recovery ("go home") for either case.
- **Severity:** Blocker (turns any routing bug into a hard wall, and any single-screen crash into a whole-app crash).
- **Suggested fix:** Add `app/+not-found.tsx` (localized, with a "Back to dashboard" CTA) and wrap `<Stack>` in an error boundary that offers reload.
- **Verification:** **[EXECUTED+SCREENSHOT]** — the captured fallback is expo-router's default: bold English "Unmatched Route / Page could not be found" + raw route string + "Go back · Sitemap", with no localization or app styling.
- **Screenshot:** [`B1_nutrition_route.png`](screenshots/B1_nutrition_route.png), [`B2_coach_swap_route.png`](screenshots/B2_coach_swap_route.png)

#### B4 — Accessibility: zero screen-reader labels app-wide
- **Location:** Systemic — `grep accessibilityLabel|accessibilityRole` returns **0** matches across `app/` + `src/`.
- **Category:** 16 (accessibility)
- **Scenario:** A VoiceOver (iOS) / TalkBack (Android) user navigates any screen.
- **Current behavior:** Icon-only controls — back chevrons, close X, the center FAB, send button, toggles, quick-add chips, calendar days — announce as unlabeled "button" or nothing.
- **Gap:** No `accessibilityLabel`/`accessibilityRole`/`accessibilityState` anywhere. The app is effectively unusable with a screen reader, and store accessibility review will flag it.
- **Severity:** Blocker for accessibility compliance.
- **Suggested fix:** Add `accessibilityRole="button"` + localized `accessibilityLabel` to every icon-only Pressable (centralize in `Btn` / icon-button wrappers), and `accessibilityState={{ selected, disabled }}` on tabs/toggles.
- **Verification:** **[CODE-VERIFIED]** — repo-wide grep for `accessibilityLabel|accessibilityRole` returns 0 matches. (Could not drive VoiceOver from this environment.)

---

### MAJOR

#### M1 — No list virtualization anywhere (every list is `.map()` in a ScrollView)
- **Location:** Systemic — no `FlatList`/`SectionList`/`VirtualizedList` in the repo. Highest exposure: [history/index.tsx:129](app/history/index.tsx#L129) (all workouts), [community.tsx:183](app/(tabs)/community.tsx#L183) (feed), [Nutrition.tsx](src/screens/Nutrition.tsx) (logs/foods), [exercise/[exerciseId]](app/exercise/[exerciseId].tsx) (full set history).
- **Category:** 3 (data lifecycle — long tenure)
- **Scenario:** A long-tenure user with months/years of workouts, a long activity feed, or hundreds of logged foods.
- **Current behavior:** Every row mounts at once inside a `ScrollView`; community even staggers `FadeInDown.delay(i*40)` so the *N*-th card waits *N×40 ms*.
- **Gap:** Unbounded memory + jank + slow first paint as data grows; no windowing, no `keyExtractor`, no incremental render.
- **Severity:** Major — degrades precisely for the most engaged users.
- **Suggested fix:** Convert the long lists (history, feed, nutrition logs, exercise history) to `FlatList`/`SectionList` with `initialNumToRender`/`windowSize`; drop per-index entrance delays on virtualized rows.

#### M2 — Past-day view on the dashboard is hollow (week strip invites it, data never loads)
- **Location:** [dashboard.tsx:280-283](app/(tabs)/dashboard.tsx#L280), [dashboard.tsx:620](app/(tabs)/dashboard.tsx#L620), week strip [dashboard.tsx:252-258](app/(tabs)/dashboard.tsx#L252)
- **Category:** 5 (past-day access) + 1 (partial/empty state) — *(mirrors web)*
- **Scenario:** User taps yesterday (or −2/−3 days) in the dashboard week strip.
- **Current behavior:** `consumed` is summed only when `isTodaySelected` (else `0`), so any past day shows an empty calorie ring and "No meals logged for this day" — even when meals *were* logged (they're archived in `synk:logs:<date>`, which the dashboard never reads). The "Viewing <day>" banner promises a historical view that has no content.
- **Gap:** The week strip is a designed past-day affordance with no data behind it; and it only spans today ±3 days, so there's no way to reach further back from here at all. **Note:** the data *is* reachable — the Nutrition screen's own date-stepper reads `synk:logs:<date>` ([Nutrition.tsx:178](src/screens/Nutrition.tsx#L178)) — the dashboard simply doesn't use that selector (see F5).
- **Severity:** Major — the feature looks broken ("I logged that yesterday, why is it empty?").
- **Suggested fix:** When `!isTodaySelected`, load `synk:logs:<selectedDate>` and render its totals; if you can't support historical editing yet, make past days read-only with the real data rather than a hollow zero state.
- **Verification:** **[CODE-VERIFIED]** — the week strip is visible in `dashboard_en_light.png` / `dashboard_ar_dark.png`; confirming the hollow past-day card requires a week-strip day tap (no tap driver in this env), so confirmed from `consumed` logic in source.
- **Screenshot:** [`dashboard_en_light.png`](screenshots/dashboard_en_light.png) (week strip the finding refers to)

#### M3 — Analytics empty/full state keys off *today's* food only
- **Location:** [analytics.tsx:39](app/(tabs)/analytics.tsx#L39), hardcoded stats [analytics.tsx:94-104](app/(tabs)/analytics.tsx#L94)
- **Category:** 1 (designed states) + 7 (numeric) — *(mirrors web)*
- **Scenario:** (a) A long-tenure user opens Analytics in the morning before logging, or on a rest/fasting day. (b) A brand-new user logs one snack today.
- **Current behavior:** `hasData = todaysLogs.foods.length > 0`. (a) shows the empty "Log workouts and meals to see your progress" state despite months of history; (b) immediately shows the full report — but the stat tiles are hardcoded ("2,450" avg steps, "12" workouts, Weight Loss 65%, Strength 40%).
- **Gap:** The empty/full gate is wrong (today's food ≠ "has analytics"), and the "full" state shows fabricated numbers unrelated to the user.
- **Severity:** Major — erodes trust; the screen is empty when it shouldn't be and fake when it is shown.
- **Suggested fix:** Gate on real historical presence (workout history / weight log length), and bind the tiles/goal bars to actual derived data (or hide tiles with no data instead of inventing values).
- **Verification:** **[EXECUTED+SCREENSHOT]** — captured Analytics showing the empty "log to see progress" state for a user who has a **3-day streak and a full workout history** (visible in `dashboard_ar_dark.png` / `history_ar_dark.png`), because no food was logged *today*. Demonstrates case (a) directly.
- **Screenshot:** [`analytics_ar_dark.png`](screenshots/analytics_ar_dark.png) (empty state) vs [`history_ar_dark.png`](screenshots/history_ar_dark.png) (the history that exists)

#### M4 — Onboarding back-stack not cleared on completion
- **Location:** [paywall.tsx:77](app/onboarding/paywall.tsx#L77) / [:81](app/onboarding/paywall.tsx#L81), forward steps use `router.push`
- **Category:** 4 (back-stack correctness — can't return into completed onboarding)
- **Scenario:** User finishes onboarding (paywall → dashboard), then presses Android hardware back.
- **Current behavior:** Onboarding advances with `router.push`, and the final step does `router.replace("/dashboard")` — which swaps only the *top* (paywall) entry. All earlier onboarding screens remain beneath dashboard in the stack, so hardware back re-enters onboarding.
- **Gap:** A completed flow is re-enterable; the user can back-navigate into goal/stats/coach screens after starting the app. *(Verify on device — see RESUME: no Android toolchain in this env, so this was not exercised.)*
- **Severity:** Major (Android especially).
- **Suggested fix:** `router.dismissAll()` before `replace`, or use a navigation reset, so the tab group becomes the stack root.

#### M5 — Generic `Avatar` has no image-load fallback
- **Location:** [Avatar.tsx:38-49](src/components/Avatar.tsx#L38)
- **Category:** 12 (media & assets)
- **Scenario:** A user avatar with a remote `photoUrl` (feed, profiles, leaderboard) fails or is slow to load.
- **Current behavior:** Renders the `<Image>` with no `onError` and no placeholder — failure shows a blank/broken circle. (Contrast [CoachAvatar.tsx:63](src/components/CoachAvatar.tsx#L63), which falls back to initials.)
- **Gap:** No fallback-to-initials and no loading placeholder on the most widely-reused avatar.
- **Severity:** Major (remote URLs are an explicit live failure point).
- **Suggested fix:** Add `onError` → initials fallback (reuse the CoachAvatar pattern) and a `placeholder`/parchment background while loading.

#### M6 — Permission denial dead-ends (no recovery path)
- **Location:** [photos.tsx:99-101](app/photos.tsx#L99), [me.tsx:133](app/(tabs)/me.tsx#L133), notifications [settings/index.tsx:201](app/settings/index.tsx#L201)
- **Category:** 14 (permission denial paths)
- **Scenario:** User denies Camera / Photos / Notifications, then tries the feature again.
- **Current behavior:** A 2-second toast "Permission denied" fires and nothing else happens; on every subsequent tap the same toast fires (no `canAskAgain` handling, no deep-link to Settings). The Settings notifications row does at least show "Enable in device settings" sub-text, but still no link.
- **Gap:** Once permanently denied, the feature silently no-ops forever with no way forward.
- **Severity:** Major.
- **Suggested fix:** When `!granted` (especially `canAskAgain === false`), show a persistent explainer with a `Linking.openSettings()` CTA instead of a transient toast.

#### M7 — History list has no "no results" state for filters
- **Location:** [history/index.tsx:123](app/history/index.tsx#L123) (empty state only when `allWorkouts.length === 0`)
- **Category:** 1 (designed states)
- **Scenario:** User has workouts but selects a muscle filter (e.g. Pull, or Cardio — which the filter logic supports but has no chip) that matches none.
- **Current behavior:** `listByMonth` is empty → the list area renders nothing (blank), with the filter chips still shown.
- **Gap:** Filtered-empty has no empty state; looks like a load failure.
- **Severity:** Major (easy to hit, looks broken).
- **Suggested fix:** When `filteredWorkouts.length === 0 && allWorkouts.length > 0`, render an EmptyState ("No <filter> workouts — try another filter").
- **Verification:** **[CODE-VERIFIED]** — the filter chip row is visible in `history_ar_dark.png` (chips reverse correctly); reproducing the blank list needs a filter-chip tap, so confirmed from source.
- **Screenshot:** [`history_ar_dark.png`](screenshots/history_ar_dark.png) (the filter chips in question)

---

### MINOR

#### m1 — History calendar is not RTL/localized
- **Location:** [history/index.tsx:180-209](app/history/index.tsx#L180)
- **Category:** 8 (RTL & bilingual)
- **Scenario:** Arabic user opens History → Calendar.
- **Current behavior:** Weekday header is hardcoded `["S","M","T","W","T","F","S"]`, the grid uses `flexDirection: "row"` (not reversed), and the week starts Sunday regardless of language. Everything else on the screen mirrors.
- **Gap:** The calendar is the one surface that stayed LTR/English in an otherwise-mirrored RTL screen.
- **Severity:** Minor (cosmetic but conspicuous in the primary market).
- **Suggested fix:** Localize day initials and mirror the grid/header for `isArabic`.
- **Verification:** **[CODE-VERIFIED]** — the History *list* view in Arabic mirrors correctly (`history_ar_dark.png`); the calendar sub-view needs an in-app toggle tap I couldn't drive, so the calendar break is confirmed from source only.

#### m1b — Muscle-group tags render in English under Arabic
- **Location:** [history/index.tsx:145-148](app/history/index.tsx#L145) (and other muscle-tag chips, e.g. workout detail)
- **Category:** 8 (bilingual)
- **Scenario:** Arabic user views the workout history list.
- **Current behavior:** `w.muscleGroups.map(...)` renders the raw keys uppercased — "BACK", "SHOULDERS", "TRICEPS", "CHEST", "BICEPS" — untranslated, even though the rest of the card (dates, units, stats) is Arabic.
- **Gap:** Mixed-language content; the muscle taxonomy is never localized.
- **Severity:** Minor.
- **Suggested fix:** Map muscle keys through a localized label table (the app already has Arabic muscle names in MuscleRecovery).
- **Verification:** **[EXECUTED+SCREENSHOT]** — English tags clearly visible on an otherwise-Arabic screen.
- **Screenshot:** [`history_ar_dark.png`](screenshots/history_ar_dark.png)

#### m2 — Toast is not RTL-aware
- **Location:** [ToastProvider.tsx:90-114](src/components/ToastProvider.tsx#L90)
- **Category:** 8 / 13 (feedback)
- **Scenario:** Any toast in Arabic.
- **Current behavior:** `flexDirection: "row"` fixed → status dot always on the left, text left-flowing.
- **Gap:** Should reverse and right-align for Arabic.
- **Severity:** Minor.
- **Suggested fix:** Reverse the row and dot position when `isArabic`.

#### m3 — Calendar collapses multiple same-day workouts to one
- **Location:** [history/index.tsx:194](app/history/index.tsx#L194) (`calMonthWorkouts.find(...)`)
- **Category:** 3 (data lifecycle)
- **Scenario:** User logs two sessions on the same day.
- **Current behavior:** `.find` returns only the first; the day shows one dot and taps open only that workout.
- **Severity:** Minor.
- **Suggested fix:** Aggregate per-day; if >1, show a count and a day-detail picker.

#### m4 — No double-tap navigation guard
- **Location:** Systemic (every `router.push` Pressable).
- **Category:** 4 (double-navigation from fast taps)
- **Scenario:** User double-taps a row/card before the next screen mounts.
- **Current behavior:** Two pushes → duplicate stacked screens (back goes through the same screen twice).
- **Severity:** Minor.
- **Suggested fix:** Debounce navigation (guard flag / `unstable_batchedUpdates`) or use `router.navigate`.

#### m5 — Completing a FAB action returns to the dark overlay, not the originating tab
- **Location:** [fab-menu.tsx](app/fab-menu.tsx) (it's a pushed route, not a transient modal)
- **Category:** 4 (navigation) / 10 (overlay)
- **Scenario:** FAB → Voice Log → Confirm (`router.back()`).
- **Current behavior:** Back lands on the still-mounted dark FAB overlay rather than the screen the user started from.
- **Severity:** Minor.
- **Suggested fix:** Have launched actions `router.dismiss()` the FAB before pushing, or present the FAB as a transparent modal that auto-dismisses on action.

#### m6 — CoachChat: silent reply + Android keyboard risk
- **Location:** [coach.tsx:74-77](app/coach.tsx#L74), [coach.tsx:94](app/coach.tsx#L94)
- **Category:** 2 (async) / 10 (keyboard)
- **Scenario:** Premium user sends a message; Android user focuses the composer.
- **Current behavior:** Coach reply appears after a blind 900 ms `setTimeout` with no typing indicator. `KeyboardAvoidingView` uses `behavior="padding"` on iOS and `undefined` on Android, so the composer can be covered on Android depending on `windowSoftInputMode`.
- **Severity:** Minor.
- **Suggested fix:** Add a typing-dots bubble during the delay; set an explicit Android keyboard behavior / `adjustResize`.

---

### POLISH / THEMING

#### P1 — Systemic: hardcoded `rgba(0,102,204,…)` light-primary tints don't adapt to dark mode
- **Location:** 64 occurrences across 28 files — e.g. [dashboard.tsx:362](app/(tabs)/dashboard.tsx#L362), [:613](app/(tabs)/dashboard.tsx#L613), [:653](app/(tabs)/dashboard.tsx#L653); also community, me, premium, settings/plan, Nutrition, WorkoutTab, etc.
- **Category:** 9 (theming) / 15 (design-system drift)
- **Scenario:** Any of these primary-tinted badges/backgrounds/borders in dark mode.
- **Current behavior:** The dark primary token is `#2997ff`, but these tints are baked to the light primary `#0066cc`, so primary-tinted surfaces are subtly off in dark mode (whereas structural colors, which use `useColors()`, are correct).
- **Gap:** Tints bypass the palette. Structural theming is clean; *tints* are the drift.
- **Severity:** Polish (pervasive but subtle).
- **Suggested fix:** Add `primaryTint(alpha)` helpers to the palette (light/dark) and replace the literal `rgba(0,102,204,*)` usages.

#### P2 — Splash fallback flashes white in dark mode
- **Location:** [_layout.tsx:55](app/_layout.tsx#L55) (`backgroundColor: "#ffffff"` while fonts/storage hydrate)
- **Category:** 9 (theming)
- **Severity:** Polish.
- **Suggested fix:** Resolve theme before paint and use the canvas color (or a neutral that matches both splash screens).

#### P3 — CoachAvatar grayscale is a no-op
- **Location:** [CoachAvatar.tsx:64-67](src/components/CoachAvatar.tsx#L64)
- **Category:** 12 / 15
- **Current behavior:** The `grayscale` prop maps to `tintColor: undefined`; idle coaches render full-color where web desaturated them.
- **Severity:** Polish (fidelity).
- **Suggested fix:** Apply a real grayscale (overlay or an `expo-image` filter) or drop the prop.

#### P4 — Voice-log error & permission states are unreachable
- **Location:** [voice-log.tsx:78](app/voice-log.tsx#L78) (`permissionError` hardcoded `false`), `phase === "error"` never set
- **Category:** 2 (async states) — *(mirrors web mock)*
- **Current behavior:** The fully-built "Microphone Required" screen and "I didn't catch that" error card can never appear; the mock always succeeds with "Grilled chicken with rice", and the "3/5 today" limit is decorative.
- **Severity:** Polish (designed UI that's dead until a real recognizer/permission gate exists).
- **Suggested fix:** Wire these states when audio capture lands; until then they're harmless dead code.

#### P5 — Dynamic Type / large-font overflow risk; no scaling cap
- **Location:** Systemic — [Typography.tsx](src/components/ui/Typography.tsx) (no `maxFontSizeMultiplier`), many fixed-height containers (`h-[44px]`, `height: 48/56`) and tight stat lineHeights (`stat-value` 32/32).
- **Category:** 16 (accessibility — dynamic type)
- **Scenario:** User sets a large OS font size.
- **Current behavior:** Text scales but fixed-height pills/rows/status lines don't grow → clipping/overflow; the inline-fontSize clip fix only protects line-cropping, not container overflow.
- **Severity:** Minor/Polish.
- **Suggested fix:** Min-heights instead of fixed heights on text containers; set a sane `maxFontSizeMultiplier` on display/stat variants; verify the busiest screens at the largest accessibility text size.

---

## 2b. Flow & product-coherence findings (F-series)

These come from walking the *flows* rather than individual screens — asking "is the nutrition plan a managed object like the workout plan? what happens when the user likes the plan but wants to change one thing? are the same concepts presented the same way across screens?" Several of these are 1:1 with web but matter most for "make it perfect."

#### F1 — The nutrition plan is generated but never manageable (the workout plan is)
- **Location:** [Nutrition.tsx:997](src/screens/Nutrition.tsx#L997) ("Adjust plan") → stub sheet [Nutrition.tsx:1730](src/screens/Nutrition.tsx#L1730); contrast [plan-details.tsx](app/plan-details.tsx) (workout), [plan/week/[weekNumber]](app/plan/week/[weekNumber].tsx), workout adapt sheet [workout/preview.tsx](app/workout/preview.tsx).
- **Category:** 1 / 15 (designed states, design-system drift) — *(mirrors web)*
- **Scenario:** User finishes onboarding, likes their plan, but wants to change the calorie target / macros / meal structure.
- **Current behavior:** The workout plan is a first-class managed object — dedicated **Workout Plan** detail screen (brief, weekly progression carousel, plan history, "Edit Plan Settings"), a per-week "tell coach" editor, the PreSession **adapt** sheet, and a **rebuild-on-change** confirmation in PlanSettings. The nutrition plan has **none of that**: it only appears as a day-to-day "Your Nutrition Plan" card in the Nutrition tab, and the single edit affordance — **"Adjust plan"** — opens a *"Plan adjustment is coming soon"* stub. There is **no Nutrition Plan detail screen** (`plan-details` is titled "Workout Plan" and contains zero nutrition), and **no UI anywhere to change the calorie target or macro split.**
- **Gap:** Asymmetric plan lifecycle. Half the product (training) is fully steerable; the other half (nutrition) is generate-once-then-frozen, with a dead-end "adjust."
- **Severity:** Major — this is the central coherence gap; "I like it but want to tweak my calories" is unanswerable.
- **Suggested fix:** Give nutrition parity: a reachable Nutrition Plan detail screen, an editable calorie/macro/meal-structure sheet (replace the "coming soon" stub), and a coach "rebuild" confirmation mirroring the workout rebuild flow.
- **Verification:** **[EXECUTED+SCREENSHOT]** — `nutrition_en_light.png` shows the plan card with "Adjust plan"; opening it renders the coming-soon copy (source-confirmed at line 1730).
- **Screenshot:** [`nutrition_en_light.png`](screenshots/nutrition_en_light.png)

#### F2 — "Use this plan today" is a no-op (toast only)
- **Location:** [Nutrition.tsx:994](src/screens/Nutrition.tsx#L994)
- **Category:** 13 (feedback & reversibility)
- **Scenario:** On the nutrition coach-plan card, user taps the primary blue CTA **"Use this plan today."**
- **Current behavior:** `onPress` only fires `showGlobalToast("Coach plan added to today", "success")` — it does **not** add the plan's suggested meals to `todaysLogs`. The diary is unchanged; the calorie ring stays at 0.
- **Gap:** A success toast for an action that did nothing — the highest-intent button on the nutrition plan does not log the plan.
- **Severity:** Major — false success; the feature appears broken the moment the user looks at their diary.
- **Suggested fix:** Actually append `nutritionPlan.suggestedMeals` (per `mealStructure`) to the active day's logs, then toast; make it undoable.
- **Verification:** **[EXECUTED+SCREENSHOT]** — CTA visible in `nutrition_en_light.png`; no-op confirmed from source (handler is toast-only).
- **Screenshot:** [`nutrition_en_light.png`](screenshots/nutrition_en_light.png)

#### F3 — Changing diet style / meals-per-day / weight / goal doesn't regenerate nutrition targets
- **Location:** Targets frozen at [generating.tsx:154-164](app/onboarding/generating.tsx#L154); editable inputs that *don't* trigger regen — [settings/plan.tsx:375](app/settings/plan.tsx#L375) (dietStyle), [:381](app/settings/plan.tsx#L381) (mealsPerDay); live formula exists but is only a fallback ([dashboard.tsx:287](app/(tabs)/dashboard.tsx#L287) uses `user.calorieTarget || plan.calorieTarget`).
- **Category:** 6 (stale / changed data across screens)
- **Scenario:** User changes Diet style or Meals-per-day in Plan Settings, or their weight/goal changes later.
- **Current behavior:** `setUser({...user, dietStyle})` just stores the field; `nutritionPlan.dailyCalories/macros/mealStructure` and `user.calorieTarget` stay at their onboarding values. The Nutrition coach-plan card, the dashboard calorie ring, and the summary all keep showing the **stale** target. (The workout side explicitly rebuilds — "Changing this will rebuild the rest of your week" — nutrition has no equivalent.)
- **Gap:** Nutrition inputs and the nutrition plan are decoupled; the plan never recomputes.
- **Severity:** Major.
- **Suggested fix:** Recompute `nutritionPlan` (via the existing `computePlanPreview`/`generateNutritionPlan` logic) when any input it depends on changes, behind the same rebuild-confirmation pattern as workouts.

#### F4 — Dashboard Hydration card diverges from the Nutrition hydration section (and both ignore the user's target) *(user-requested)*
- **Location:** dashboard card [dashboard.tsx:674-709](app/(tabs)/dashboard.tsx#L674); nutrition section [Nutrition.tsx:1246-1300](src/screens/Nutrition.tsx#L1246); ignored setting `user.dailyWaterTarget` (default 2000; configurable in Settings).
- **Category:** 15 (design-system drift) + 6 (ignored setting)
- **Scenario:** User sees hydration on the dashboard, then opens the full hydration section in Nutrition.
- **Current behavior:** Two different designs for one concept. **Dashboard:** a 💧 emoji in a tinted circle + title/subtitle + three quick-add pills (**+250 / +500 / +1000**), no progress bar, target hardcoded "2.5 L / 2500 ml". **Nutrition:** no icon, a "HYDRATION" label + big `intake / target ML` number + progress bar + −/＋ stepper with custom-ml input + quick-add (**+100 / +500 / +1000**). Both hardcode 2500 and **ignore `user.dailyWaterTarget`**.
- **Gap:** Inconsistent layout, mismatched quick-add amounts, and the configurable daily water target is dead.
- **Severity:** Major (per request + the ignored-setting bug) — though the visual unification itself is Minor/Polish.
- **Suggested fix:** As requested — **drop the icon** on the dashboard and render a **compact version of the Nutrition hydration section** (same progress bar + `intake / target` readout + quick-add row), just smaller. Read the target from `user.dailyWaterTarget` in both places and align the quick-add amounts.
- **Verification:** **[EXECUTED+SCREENSHOT]** — Nutrition hydration layout source-read; dashboard card source-read. (Both cards are off-by-default, so neither is in the current captures; layouts confirmed from source.)

#### F5 — Workout and Nutrition use different date/calendar headers *(user-requested)*
- **Location:** Workout week strip [WorkoutTab.tsx:31-69](src/screens/WorkoutTab.tsx#L31) (identical to [dashboard.tsx:338](app/(tabs)/dashboard.tsx#L338)); Nutrition day-stepper [Nutrition.tsx:1352](src/screens/Nutrition.tsx#L1352) (`‹ MON, JUN 1 ›`) + DAILY/WEEKLY toggle.
- **Category:** 15 (design-system drift) + 5 (date access)
- **Scenario:** User switches between the Workout and Nutrition segments of the Fitness tab.
- **Current behavior:** Two paradigms for "pick the day." **Workout:** a 7-day week strip (today ±3, letter + number circles). **Nutrition:** a single formatted date with prev/next arrows (`‹ MON, JUN 1 ›`) and a DAILY/WEEKLY mode toggle. They look and behave differently for the same job. *(Bonus:* the Nutrition stepper actually loads archived per-date logs (`synk:logs:<date>`), while the workout week strip — like the dashboard — does not, so unifying also closes a past-data gap.)*
- **Gap:** No shared date-header component; the two halves of the same tab don't match.
- **Severity:** Minor (cosmetic, but exactly the kind of inconsistency that reads as unpolished).
- **Suggested fix:** As requested — make the Workout (Fitness → Workout) date header use the **same `‹ MON, JUN 1 ›` day-stepper as the Nutrition page** (extract one shared `DateNavigator` component and use it on both, ideally on the dashboard too).
- **Verification:** **[EXECUTED+SCREENSHOT]** — `nutrition_en_light.png` shows the `MON, JUN 1` stepper; `dashboard_en_light.png` shows the identical week-strip the Workout tab uses.
- **Screenshot:** [`nutrition_en_light.png`](screenshots/nutrition_en_light.png), [`dashboard_en_light.png`](screenshots/dashboard_en_light.png)

#### F6 — Dashboard optional cards ship fabricated data (extends M3)
- **Location:** Recovery [dashboard.tsx:713-718](app/(tabs)/dashboard.tsx#L713) (hardcoded 85/60/30/95); Analytics card [dashboard.tsx:755](app/(tabs)/dashboard.tsx#L755) (fixed bars) + [:775-792](app/(tabs)/dashboard.tsx#L775) ("5 days", "+12%", "3 this week").
- **Category:** 7 (numeric) / 13 (trust) — *(mirrors web)*
- **Scenario:** User enables the Recovery or Analytics dashboard card.
- **Current behavior:** Recovery shows fixed muscle percentages (85/60/30/95) unrelated to `user.muscleRecovery` (which the real MuscleRecovery screen reads, defaulting to 100). The Analytics card shows a fixed bar chart and fabricated "Weekly streak 5 days / Volume +12% / 3 PRs."
- **Gap:** Placeholder/demo numbers presented as the user's real data — same root issue as M3's hardcoded analytics, across multiple cards.
- **Severity:** Major (trust) — and clearly visible once the cards are enabled.
- **Suggested fix:** Bind these cards to real derived data (`user.muscleRecovery`, history-derived volume/streak/PRs) or hide the metric until data exists.

#### F7 — Nutrition hydration section: not RTL-mirrored, English-only labels, 1px progress bar
- **Location:** [Nutrition.tsx:1250](src/screens/Nutrition.tsx#L1250) (`flexDirection: "row"` fixed), labels "HYDRATION"/"Reset"/"QUICK ADD"/"ML", progress bar [Nutrition.tsx:1262](src/screens/Nutrition.tsx#L1262) (`height: 1`).
- **Category:** 8 (RTL/bilingual) + visual bug
- **Scenario:** Arabic user opens the hydration section.
- **Current behavior:** The section uses fixed LTR rows (doesn't mirror), and "HYDRATION", "Reset", "QUICK ADD", and the "/ … ML" unit stay English. The progress track is `height: 1` — a near-invisible hairline rather than a real bar (likely a port of web `h-1` ≈ 4px).
- **Severity:** Minor.
- **Suggested fix:** Mirror for `isArabic`, localize the labels/unit, and set the bar to a visible height (~6–8 px) consistent with other progress bars.

#### F8 — Onboarding plan-preview overpromises and misdirects "tweak"
- **Location:** [plan-preview.tsx:229](app/onboarding/plan-preview.tsx#L229) ("Tweak something?" → `/onboarding/ai-rules`), [:242](app/onboarding/plan-preview.tsx#L242) ("You can edit this anytime.")
- **Category:** 13 (feedback) / 4 (navigation intent)
- **Scenario:** During onboarding the user reviews the plan and wants to change something.
- **Current behavior:** "Tweak something?" routes to the **AI coach-rules** screen (how the coach behaves), not to plan editing; and "You can edit this anytime" is untrue for nutrition targets (see F1/F3).
- **Severity:** Minor.
- **Suggested fix:** Point "Tweak" at the actual plan-edit surfaces (once F1 lands), or relabel it to set the right expectation; make "edit anytime" honest.

---

## 3. Prioritized summary

**Blockers (fix before ship)**
- **B1** Dashboard nutrition/hydration cards → dead `/nutrition` route.
- **B2** "Change coach" (CoachChat + Settings) → dead `/coach-swap` route.
- **B3** No `+not-found` screen / error boundary — any dead link or render throw is a hard wall / crash.
- **B4** No screen-reader labels anywhere.

**Major**
- **M1** No list virtualization (perf for long-tenure users).
- **M2** Dashboard past-day view is hollow (data never loaded).
- **M3** Analytics empty/full gate is wrong + shows fabricated stats.
- **M4** Onboarding back-stack re-enterable after completion.
- **M5** Generic Avatar has no broken-image fallback.
- **M6** Permission-denied dead-ends with no Settings path.
- **M7** History filter has no "no results" state.
- **F1** Nutrition plan isn't manageable like the workout plan ("Adjust plan" is a stub; no detail screen; no calorie/macro editor).
- **F2** "Use this plan today" CTA is a no-op (toast only).
- **F3** Diet style / meals-per-day / weight / goal changes don't regenerate nutrition targets (stale).
- **F4** Dashboard Hydration card diverges from the Nutrition section + both ignore `dailyWaterTarget` *(user-requested)*.
- **F6** Dashboard Recovery/Analytics cards ship fabricated data.

**Minor**
- **m1** History calendar not RTL/localized · **m1b** Muscle-group tags English under Arabic · **m2** Toast not RTL · **m3** Multi-workout day collapses · **m4** No double-tap guard · **m5** FAB returns to overlay · **m6** CoachChat silent reply / Android keyboard · **F5** Workout vs Nutrition date headers differ *(user-requested)* · **F7** Nutrition hydration not RTL/localized + 1px bar · **F8** plan-preview "tweak"/"edit anytime" overpromises.

**Polish**
- **P1** Hardcoded primary tints in dark mode (64×/28 files) · **P2** White splash flash in dark · **P3** CoachAvatar grayscale no-op · **P4** Dead voice-log error states · **P5** Dynamic-type overflow.

---

## 4. Systemic patterns (root causes — fix these and many findings clear)

**A. Routes referenced but never created, with no catch-all.**
`/nutrition` (B1) and `/coach-swap` (B2) are pushed but have no file, and there's no `+not-found` (B3) to soften the landing. Root cause: route strings are free-form and unchecked. *One fix:* create the two missing routes + a localized `+not-found`, and consider a typed route constant module so dead links fail at build time.

**B. A "today-only" data model leaking into multi-day UI.**
`todaysLogs` is the only *live* source; archived `synk:logs:<date>` is written but never re-read. Yet the dashboard week strip (M2), the past/future card variants, and the Analytics gate (M3) all present multi-day affordances. The UI promises history the data layer doesn't surface. *One fix:* a `getLogsForDate(date)` selector that hydrates archived days, used everywhere `selectedDate` drives a card.

**C. No virtualization, anywhere.**
Every list is `.map()` inside a `ScrollView` (M1, and the staggered feed). Fine at demo scale, a cliff at real tenure. *One fix:* a shared virtualized list wrapper adopted by history, feed, nutrition logs, and exercise history.

**D. Accessibility was never wired.**
Zero a11y props (B4) and no font-scaling strategy (P5). *One fix:* bake `accessibilityRole`/`accessibilityLabel` into `Btn` and the icon-button pattern, and audit the busiest screens at max Dynamic Type.

**E. Manual per-component RTL is ~95% applied — but silently fails where forgotten.**
Confirmed by screenshot: the hub screens mirror correctly in Arabic (`dashboard_ar_dark.png`, `history_ar_dark.png`, `coach_ar_dark.png`). Because there's no `forceRTL` and no shared direction primitive, each surface re-implements mirroring; the misses (calendar grid m1, untranslated muscle tags m1b, toast m2, and any future screen) are invisible until someone opens them in Arabic. *One fix:* a `<Row>`/`<RTLView>` primitive, a `useDirection()` hook, and a single localized label table so direction and translation are structural, not copy-pasted.

**F. Structural color is tokenized; primary *tints* are not.**
`useColors()` makes backgrounds/borders/text theme-correct, but 64 `rgba(0,102,204,*)` literals (P1) bypass it. *One fix:* palette-level tint helpers.

**G. Permission denial = toast-and-stop.**
Camera/photos/notifications all show a transient toast and no recovery (M6). *One fix:* a shared `ensurePermission()` helper that renders an explainer + `openSettings()` on hard denial.

**H. Training is a first-class managed object; nutrition is generate-then-freeze.**
The whole product leans this way: the workout plan has a detail screen, weekly progression, an adapt sheet, and rebuild-on-change; the nutrition plan is computed once at onboarding and then has no detail screen, no editor (F1), a no-op "use today" (F2), and never recomputes when its inputs change (F3). Even the day-picker differs (F5). *One fix:* treat the nutrition plan as the same kind of object as the workout plan — detail screen, editable targets, rebuild flow, shared date navigator.

**I. Demo/placeholder data shipped as if real.**
Analytics tiles (M3) and the dashboard Recovery/Analytics cards (F6) display hardcoded numbers (steps, workouts, %, streak, PRs, muscle recovery) unrelated to the user. *One fix:* bind to derived data or hide until data exists — and grep the dashboard/analytics for literal stat strings before launch.

**J. Same concept, two implementations.**
Hydration (F4), the date header (F5), and the empty-state gating all exist in divergent forms across screens because there's no shared component for them. *One fix:* extract shared `Hydration`, `DateNavigator`, and empty-state primitives and consume them everywhere.

---

## 5. Screenshot index ([`screenshots/`](screenshots/))

| File | Shows | Backs |
|------|-------|-------|
| `01_launch.png` | App boot (Me tab, EN-light) | context |
| `dashboard_en_light.png` | Dashboard, EN-light (week strip, calorie ring) | M2 |
| `dashboard_ar_dark.png` | Dashboard, AR-dark (RTL mirroring, dark palette) | RTL/dark sanity, M2 |
| `B1_nutrition_route.png` | `synk://nutrition` → Unmatched Route | **B1, B3** |
| `B2_coach_swap_route.png` | `synk://coach-swap` → Unmatched Route | **B2, B3** |
| `analytics_ar_dark.png` | Analytics empty state despite existing history | **M3** |
| `history_ar_dark.png` | History list, AR-dark (mirrors; English muscle tags) | M3, m1b, M7 |
| `history_list_en_light.png` | History list, EN-light | context |
| `coach_ar_dark.png` | CoachChat, AR-dark (swap button visible) | B2 |
| `nutrition_en_light.png` | Nutrition tab: `MON, JUN 1` day-stepper + plan card ("Use this plan today" / "Adjust plan") | F1, F2, F5 |

*Captures are EN-light and AR-dark — the two extremes that expose RTL overflow and theme breakage. Tap-dependent flows (week-strip past day, calendar toggle, filter chips, Customize sheet) could not be pictured (no in-app tap driver in this environment) and are tagged **[CODE-VERIFIED]**.*

---

*No code was changed in this pass — audit and report only. Items marked **(mirrors web)** reproduce the web source's behavior and are flagged against the shippable-product bar, not as migration regressions. Findings dependent on the Android runtime (M4 back-stack, m6 keyboard) should be confirmed on a device once an Android toolchain is available — per RESUME.md, none was present in this environment. The simulator was left in its original EN-light state.*
