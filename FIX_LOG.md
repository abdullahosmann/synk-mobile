# Fix Log — Targeted Fix Pass (scoped subset of UIUX_AUDIT.md)

Branch `dev`. Front-end only. Tags: `[FIXED+VERIFIED]` = changed + ran + screenshot; `[FIXED+CODE-ONLY]` = changed + typecheck-clean but not runtime-verified.

## Phase 1 — Ship blockers

| Item | Status | Commit | Screenshot | Notes |
|------|--------|--------|------------|-------|
| **B1** dashboard nutrition/hydration → dead `/nutrition` | `[FIXED+VERIFIED]` | `28bfdb9` | `B1_fixed_nutrition_logmeal.png` | Nutrition card → `/fitness?tab=nutrition&openSearch=1` (opens food search), hydration → `/fitness?tab=nutrition`. Verified the route now opens the meal-search screen (vs. Unmatched Route). |
| **B2** `/coach-swap` dead route | `[FIXED+VERIFIED]` | `31c7065` | `B2_fixed_coach_swap.png` | Added `app/coach-swap.tsx` re-exporting CoachSelection; its existing `isSwapMode` branch now activates (Save CTA, current coach preselected). Both pushers resolve. |
| **B3** no `+not-found` / error boundary | `[FIXED+VERIFIED]` (not-found) / `[FIXED+CODE-ONLY]` (boundary) | `d23ab66` | `B3_fixed_notfound_ar_dark.png` | `app/+not-found.tsx` (localized, theme-aware, Back-to-dashboard) verified in AR-dark replacing the raw dev page. ErrorBoundary wired above `<Stack>` but not runtime-triggered (couldn't force a render throw). |
| **M3 / F6** fabricated stats shown as real | `[FIXED+VERIFIED]` (analytics screen) / `[FIXED+CODE-ONLY]` (dashboard cards) | `347951a` | `M3_fixed_analytics_ar_dark.png` | Analytics gate now keys off real history; tiles = real workout counts; goal = derived weight progress (or honest hint); steps & fabricated strength removed. Dashboard analytics card (bars/streak/volume-delta/PRs) + recovery card now derive from `getAllWorkouts`/`streaks`/`user.muscleRecovery`. Dashboard cards are off-by-default → typecheck-clean but not screenshotted. |

**Note on data source:** `getAllWorkouts()` is itself mock (front-end-only build), so "real" here means *internally consistent with the rest of the app and reactive to actual state* — and unsourced metrics are hidden rather than faked. When the data layer becomes real, these gates/derivations behave correctly with no further change.

## Out of scope (Android runtime) — see `DEVICE_CONFIRM.md`
- **M4** onboarding back-stack re-enterable — repro steps documented, not changed.
- **m6** CoachChat Android keyboard — repro steps documented, not changed.

## Phase 2 — Nutrition coherence
Not started. Awaiting the **2.0 design checkpoint** approval before implementing F1/F2/F3.
