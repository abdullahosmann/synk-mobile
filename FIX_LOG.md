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

### 2.0 design checkpoint — ✅ APPROVED
Goal: give the nutrition plan the same first-class lifecycle the workout plan has (`plan-details` / `plan/week/[n]` / PreSession adapt / PlanSettings rebuild-confirmation). Approved decisions:
- **Targets editor (F1):** *structured* editor (steppers for calories + macro grams, chips for diet style & meals/day) — deterministic, driven by the existing generator. **Not** a free-text "tell coach".
- **Nutrition Plan detail screen (F1):** *full standalone screen* — new `app/nutrition-plan.tsx` (1:1 mirror of `app/plan-details.tsx`: coach summary, 2×2 metadata grid, meal-structure section, "Edit targets" + "Edit Plan Settings" CTAs), reached from a new **"Nutrition Plan"** card on the Me tab (beside "Workout Plan") **and** from the coach-plan card's "Adjust plan" button.
- **Plan history (F1):** *included* — write each rebuild to `synk:nutritionPlanHistory`, render it on the detail screen mirroring the workout plan-history list.

Implementation order **F2 → F1 → F3**, one commit per finding.

| Item | Status | Commit | Screenshot | Notes |
|------|--------|--------|------------|-------|
| **F2** "Use this plan today" was toast-only no-op | `[FIXED+VERIFIED]` | `eec762b` | `F2_plan_logged.png`, `F2_dup_guard.png` | Logs `nutritionPlan.suggestedMeals` (per `mealStructure`) into the active day via a batch logger, mapping label→slot id against `MEAL_SLOTS`, marking `isCoachSuggested`. Sim: tap → "Added 3 meals" + Oats&Protein/Chicken&Rice/Salmon appear; re-tap → "already added" (dup guard). |
| **F1** nutrition plan not manageable (stub "adjust", no detail screen, no editor) | `[FIXED+VERIFIED]` | `0db3903` | `F1_detail.png`, `F1_editor.png`, `F1_metab_card.png` | New `app/nutrition-plan.tsx` (coach summary, 2×2 metadata grid, macro split, meal-structure list, plan-history fed by `synk:nutritionPlanHistory`). Me-tab "Nutrition Plan" card + Nutrition card's "Adjust plan" both route here (coming-soon stub removed). Structured "Edit targets" sheet (calories + macro grams + diet chips + meals/day) → direct save + toast. Sim-verified detail/editor/save/Me-card. |
| **F3** dietStyle/mealsPerDay/weight/goal don't regenerate targets | `[FIXED+VERIFIED]` | `b986193` | `F3_rebuild_confirm.png`, `F3_recomputed_macros.png`, `F3_plan_history.png` | Extracted `generateNutritionPlan` → `src/lib/nutritionPlan.ts` (now **dietStyle-aware** macro split; `balanced`/undefined reproduces the original onboarding formula so onboarding output is unchanged) + `pushNutritionHistory`/`readNutritionHistory`. PlanSettings **dietStyle** + **mealsPerDay** now route through the `pendingChange` confirmation (`kind: "nutrition"` → "rebuild your nutrition targets and meal plan" copy); on confirm → recompute plan + mirror fields + write a history entry. The F1 editor's manual save also writes a history entry. Sim-verified: Balanced→High Protein → confirm sheet → "rebuilding…" toast → macros 150/143/68 → **180/131/60**, Diet style row + detail screen update, PLAN HISTORY shows "Switched diet style to High Protein." **Scope note:** *goal* recompute deliberately left out — PlanSettings goal ids ("weight-loss"…) don't match the generator's expected `user.goal` ("lose-weight"), so a goal rebuild wouldn't reliably move calories without a separate id-mapping (kept goal as immediate-save); *currentWeight* is edited in profile-edit, not here. |

**RN gotcha (F3):** two `BottomSheet`s are RN `Modal`s and can't present simultaneously — opening the `pendingChange` confirmation while the option sheet was still visible silently dropped it. Fixed by closing the option sheet first, then opening the confirmation after its ~280ms exit (same pattern as the PreSession `RoutineReplacementSheet` fix). The existing workout dangerous-field handlers use the in-`apply` close and were never tap-verified — they likely share this latent issue; left untouched this pass (out of scope).

## Phase 3 — hydration + date-header coherence (user-requested F4/F5/F7)

| Item | Status | Commit | Screenshot | Notes |
|------|--------|--------|------------|-------|
| **F7** Nutrition hydration not RTL/localized + 1px bar + ignored water target | `[FIXED+VERIFIED]` | `4fdac48` | `F7_hydration_en.png`, `F7_hydration_ar.png` | `targets.water` now reads `user.dailyWaterTarget` (\|\| 2000) instead of hardcoded 2500; header/readout/quick-add rows mirror for Arabic; HYDRATION/Reset/ML localized; progress track 1px → 6px. Sim-verified EN ("0 / 2,000 ML", visible bar) + AR (mirrored "الترطيب / 500 / 2,000 مل", reversed quick-add). |
| **F4** dashboard Hydration card diverges from Nutrition + ignores water target | `[FIXED+VERIFIED]` | `14dcd6d` | `F4_dashboard_hydration_ar.png` | Dropped the 💧 emoji/title/subtitle design; the card is now a compact version of the Nutrition hydration section (HYDRATION label + intake/target readout + 6px progress bar + quick-add). Reads `user.dailyWaterTarget`; quick-add aligned to 100/500/1000 (was 250/500/1000). Sim-verified in AR. |
| **F5** Workout vs Nutrition date headers differ | `[FIXED+VERIFIED]` | `bea7f8c` | `F5_workout_datenav.png` | Extracted `src/components/DateNavigator.tsx` (localized, RTL-mirrored "‹ TODAY / Wed, Jun 4 ›" stepper); WorkoutTab now uses it in place of the 7-day week strip, and Nutrition's inline daily stepper now uses it too. Sim-verified: Fitness → Workout shows the same stepper as Nutrition. (Did **not** also swap the dashboard week strip — the audit's "ideally on the dashboard too" is optional and the dashboard's strip drives more states; left as-is.) |

## Phase 4 — assorted Major/Minor fixes

| Item | Status | Commit | Screenshot | Notes |
|------|--------|--------|------------|-------|
| **M2** dashboard past-day view hollow (data never loaded) | `[FIXED+VERIFIED]` | `cd6da1f` | `M2_pastday_real_data.png` | `consumed` now reads `synk:logs:<selectedDate>` (the key the Nutrition stepper writes) for non-today days via a `selectedDayFoods` memo, instead of summing only when today. Sim-verified: selecting a past day shows its real archived total (850 kcal, macros 25/60/12, ring filled, "Add missed meal") not a hollow zero. |
| **M5** generic Avatar has no broken-image fallback | `[FIXED+CODE-ONLY]` | `da296da` | — | `hasError` flag (reset on `photoUrl` change) falls back to the initials circle on `onError`, mirroring CoachAvatar; parchment placeholder + fade while loading. tsc-clean; runtime needs a broken remote URL to exercise. |
| **M6** permission denial dead-ends (toast-and-stop) | `[FIXED+CODE-ONLY]` | `be93452` | — | New `src/lib/permissions.ts` `showPermissionDeniedAlert()` → persistent native alert + "Open Settings" (`Linking.openSettings`). Wired into photos, me-tab avatar, settings notifications toggle (replaces the transient toasts). tsc-clean; runtime needs an actual OS denial. |
| **M7** history filter has no "no results" state | `[FIXED+CODE-ONLY]` | `ad05e64` | — | List view now renders an EmptyState ("No workouts match this filter…") when `listByMonth` is empty but history exists. tsc-clean; runtime needs a filter-chip tap that matches none. |

**Deferred at user request:** **F8** (onboarding plan-preview "tweak"/"edit anytime" copy) — keep for later.

## Phase 5 — accessibility + RTL minors

| Item | Status | Commit | Screenshot | Notes |
|------|--------|--------|------------|-------|
| **B4** zero screen-reader labels app-wide | `[FIXED+CODE-ONLY]` (primitives) | `f33c821` | — | a11y baked into the shared primitives so it propagates broadly: `Btn` (role=button + label from text + disabled state), `Toggle` (role=switch + checked state + optional label), `BottomNav` tabs (role=tab + label + selected) and FAB, `ContinueButton`, `TopBar` (profile/bell/settings). Verified by inspection (VoiceOver can't be screenshotted). **Follow-up:** the remaining inline icon-only Pressables in individual screens (back chevrons, close X, etc.) still need labels — large per-screen sweep, not done. |
| **m2** toast not RTL-aware | `[FIXED+CODE-ONLY]` | `3ac324b` | — | `ToastProvider` row reverses + padding swaps + text right-aligns (Cairo) when `isArabic`. (Transient; verified by inspection.) |
| **m1b** muscle-group tags English under Arabic | `[FIXED+VERIFIED]` | `8de1c7d` | `m1b_muscle_tags_ar.png` | New `src/lib/muscleLabels.ts` (key→Arabic); history list + workout-detail tags localize. Sim-verified: AR history shows الصدر/الترايسبس/الأكتاف/الظهر/… |

## Phase 6 — calendar RTL + theming polish

| Item | Status | Commit | Screenshot | Notes |
|------|--------|--------|------------|-------|
| **m1** history calendar not RTL/localized | `[FIXED+CODE-ONLY]` | `f4593b0` | — | Weekday initials localized (ح ن ث ر خ ج س) + header and day-grid `flexDirection` mirror for Arabic. (Verified by inspection — the calendar sub-view needs an in-app toggle tap that was too small a target to drive reliably; RTL rendering on the same screen is confirmed via m1b.) |
| **m3** multi-workout day collapses to one | `[FIXED+CODE-ONLY]` | `f4593b0` | — | `calMonthWorkouts.find` → `.filter`; renders up to 3 dots so multiple same-day sessions are visible (tap still opens the first — a full day-picker is a larger follow-up). |
| **P2** splash flashes white in dark mode | `[FIXED+CODE-ONLY]` | `228e4a4` | — | Pre-hydration splash View bg now follows `useColorScheme()` (dark → `#0B0D10`, light → white) instead of hardcoded white. |
| **P3** CoachAvatar grayscale no-op | `[FIXED+CODE-ONLY]` | `711dadb` | — | Replaced `tintColor:undefined` with an opacity dim proportional to the grayscale amount (expo-image has no grayscale filter) so idle coaches look muted, approximating web. |

**Remaining (not started), per UIUX_AUDIT.md:** F8 (deferred), B4 per-screen icon-button sweep, M1 (list virtualization — biggest/riskiest), P1 (dark-mode primary tints — 64 `rgba(0,102,204,*)` literals across 28 files; replace with `withAlpha(colors.primary, …)`), P4 (dead voice-log states — harmless until a real recognizer), P5 (dynamic-type overflow). Android build still blocked (no toolchain).
