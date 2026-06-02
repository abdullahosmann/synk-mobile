# UX Review 2 — Deep coherence / "what-if" pass (frontend only)

A second, deeper audit done by **driving the app as different kinds of users** ("what if I edit my calories — does it still match my goal?", "the coach is adaptive, so if I change intensity does everything adapt?", "what if the weights were heavy?"). Backend is explicitly out of scope — the goal is a **self-consistent frontend** before backend work begins, so mock/derived state should at least behave coherently.

Status legend: 🔴 trust/coherence · 🟠 adaptive-lever does nothing · 🟡 correctness/copy · 🎨 visual · 🔵 interaction · ⚙️ dev.

**Nothing here is edited yet — this is the plan to approve.**

---

## Part A — Findings

### Group C — Numbers contradict each other (trust) 🔴
- **C1 — Me "YOUR PROGRESS" card is hardcoded.** [`app/(tabs)/me.tsx`] shows *"Weekly streak 5 days · Volume +12% · PRs 3 this week"*. The dashboard's equivalent (fixed in F6) shows *"3 days · +59% · 1 PR"*, and the Me stat-strip directly above says *"Streak 3"*. Three different numbers, two on the same screen.
- **C2 — Workout count source mismatch.** Me strip = **0 workouts / 0 min** (reads `synk:historicalSets`, empty); Analytics = **21 workouts**, History = full list (both read `getAllWorkouts`). The profile says "0 workouts" next to a populated history.
- **C3 — Workout Plan detail is mock, contradicts Plan Settings.** [`app/plan-details.tsx`] grid = *"1 workout/wk · Gym · 40 min · Advanced"*; Plan Settings = *4 days · Full-gym · 45 min*. The week-progress carousel ("Week 1 — all 7 days completed") and plan-history list are also hardcoded. After a user "rebuilds" their week the detail screen still says 1 workout/40 min.
- **C4 — Week editor header date is hardcoded.** [`app/plan/week/[weekNumber].tsx`] header = *"Week 2 / May 26 – June 1"*, but the day rows below are June 01–05 (simulated from today). Range and rows disagree.

### Group A — Adaptive levers are write-only (the core "does it adapt?" problem) 🟠
`getWorkoutForDate(user, date)` [`src/lib/workoutSelection.ts:214`] reads **only** `workoutSplit`/`split`, `daysPerWeek`, `trainingStartDay`. Everything below is persisted by its UI but never read back, so the change has no visible effect:
- **A1 — fitness level & workout duration don't change the workout.** Changing them routes through the "Changing this will rebuild the rest of your week" confirmation + a "coach is rebalancing" toast — but `getWorkoutForDate` ignores both, so nothing changes. The confirmation over-promises.
- **A2 — Excluded exercises reappear.** "Don't recommend" / the Excluded-Exercises screen persist `excludedExercises`, but the selector never filters them → the exercise shows up again next session.
- **A3 — Injuries aren't applied.** Collected in onboarding + settings; never used to filter risky movements.
- **A4 — "Tell coach about this week" goes nowhere.** WeekEditor writes `weekOverrides` and they render *inside that screen only*; dashboard / PreSession / ActiveWorkout don't read them.
- **A5 — "Replace today with this routine" doesn't take over.** PreSession adapt writes `planOverride` (just-today / replace-today) and `defaultRoutineId` (save-as-default), but PreSession's own `workout` is `getWorkoutForDate(...)`, which ignores them → the day still shows the original workout.
- **A6 — Arnold / PHUL / PHAT splits silently become PPL.** Plan Settings offers them, but `splitMap` only maps ppl/upper-lower/bro-split/full-body/auto → the rest fall back to push-pull-legs.
- **A7 — Split × days-per-week mismatch silently falls back.** `patternKey = split-days` (e.g. `push-pull-legs-4`); if that pattern doesn't exist it falls back to `push-pull-legs-3`. Split and days aren't coupled or guarded, so "PPL + 4 days" quietly runs the 3-day plan.
- **A8 — No feedback loop.** Heavy weights / RPE in ActiveWorkout and the morning check-in don't affect `muscleRecovery` or the next session. (Likely backend territory — flag, don't necessarily build.)
- **A9 — PreSession "tweak today" doesn't change the session.** The reason-chip flow → APPLY swaps the coach's bullet text + a toast, but the actual exercises/sets in the session are unchanged.

### Group N — Nutrition edit coherence (the "edit calories vs goal" example) 🟠🟡
- **N1 — Calories and macros can contradict.** "Edit targets" saves whatever is typed with no reconciliation: the calorie target and the protein/carb/fat grams (×4/4/9) can disagree, and the detail screen then shows a calorie number that doesn't match its own macro breakdown.
- **N2 — Edited calories can contradict the goal.** Goal = lose fat (deficit) but the user can set a surplus (or vice-versa) with no warning.
- **N3 — Diet style vs macros drift + stale explanation.** Keto can sit next to manually-high carbs; and the coach-explanation paragraph never reflects the diet style (still says "deficit / keep protein high" under Keto).
- **N4 — "Use this plan today" has no undo, and rebuilds strand old meals.** After a plan rebuild the previously-logged `isCoachSuggested` meals linger and the dup-guard blocks re-adding until they're manually deleted; there's no undo on the add.

### Group X — Cross-setting coherence 🟡
- **X1 — Goal vs target-weight direction mismatch.** Goal "weight loss" with a target weight *above* current (or "weight gain" below) isn't validated; the timeline/pace can then be nonsensical.
- **X2 — Unit conversion completeness.** Verify kg↔lb / cm↔ft toggles convert everywhere they should (target weight, weight log, weight trend, measurements). (Measurements is a confirmed miss — see U1.)
- **X3 — Gender change vs cycle tracking.** The female-only Cycle Tracking section + any stored cycle state isn't reconciled if gender changes.

### Group U — Units / copy 🟡
- **U1 — Body Measurements are in inches** for a metric (kg/cm) user → should be cm.
- **U2 — "1 items"** pluralization (Plan Settings → Health restrictions value).

### Group V — Visual cleanliness 🎨
- **V1 — Food-search rows collide.** Long names + EG/Verified badges push the right-aligned "kcal" on top of the "Verified" badge (e.g. *"Gebna Beida (White Cheese) ⊘Verified 90 KCAL"*).
- **V2 — TopBar uses a hardcoded stock photo** instead of the user's avatar/initials (visible on Analytics) — different face than Community/Me for the same user.
- **V3 — Coach Chat empty state** leaves a large blank gap between the single welcome bubble and the composer.
- **V4 — Settings Coach/Country rows** show a small substituted glyph — confirm it's intentional (lucide brand-glyph substitution).

### Group I — Interaction 🔵
- **I1 — Dashboard hydration writes to *today* on a past day.** M2 loads past-day food, but the hydration quick-add (+250/500/1000) always mutates `todaysLogs.water` even when a past day is selected.
- **I2 — No double-tap navigation guard** — fast double-tap on a card stacks the screen twice.

### Group D — Dev hygiene ⚙️
- **D1 — A `console.warn` fires app-wide** (the dev "Open debugger to view warnings" LogBox banner on every screen). Won't ship, but indicates an unresolved warning to find & clear.

---

## Progress log — ✅ ALL PHASES DONE (branch dev, tsc clean)
- **Phase 1 — DONE & sim-verified** (`78a5c63` C1+C2, `d565bd2` C3, `82a6a61` C4).
- **Phase 2 — DONE & sim-verified** (`197c0f1`): A1/A2/A4/A5/A6/A7 in `getWorkoutForDate` (split=arnold→Chest, exclude bench→removed, beginner→sets-1, duration reflected, routine override honored).
- **Phase 3 — DONE & sim-verified** (`bea8cfa`): N1 auto-balanced read-only macros, N2 soft-warn goal conflict, N3 diet-style clause in coach copy, N4 "Use this plan today" toggle/undo.
- **Phase 4 — DONE & sim-verified** (`cedf97f`): V1 food-row collision fixed, V2 TopBar real avatar, U2 pluralization. **U1 was a false positive** (measurements already convert via `heightUnit`; user's heightUnit is "ft"). V3 (coach-chat gap) / V4 (settings glyph) left as minor/subjective.
- **Phase 5 — DONE & sim-verified** (`d38fd2b`): I1 hydration reads/writes the selected day, D1 silenced the benign Reanimated warning (banner gone).
- **Deferred (documented):** A3 injuries + A8/A9 feedback-loop/tweak-swaps (backend/coach engine, per decision); I2 double-tap nav guard (systemic, regression risk); V3/V4 (minor visual). The rebuild/adapt copy is now honest because the deterministic levers (Phase 2) actually work.

## Part B — Fix plan (phased; approve before I start)

Frontend-only, mock-aware: the aim is **internal consistency** — derived/mock state should behave as if the system were real, so the backend can later swap in real data with no UI change.

### Phase 1 — Trust/coherence (no design decisions; clear wins) 🔴
- **C1**: bind the Me "YOUR PROGRESS" card to the same derived streak/volume/PR source the dashboard card uses.
- **C2**: make the Me strip + everywhere use one canonical workout source (`getAllWorkouts`-derived) so counts match Analytics/History.
- **C3**: derive `plan-details` metadata from `daysPerWeek` / `trainingLocation` / `workoutDuration` / `fitnessLevel` (+ make the week carousel/history reflect real-ish state or clearly read as upcoming).
- **C4**: compute the WeekEditor header range from the same simulated dates as the day rows.

### Phase 2 — Make adaptive levers actually propagate 🟠
Centralize in `getWorkoutForDate` (or a thin wrapper the screens already call):
- **A6**: add arnold/phul/phat to `splitMap` (+ patterns, or map to the closest existing pattern).
- **A7**: couple split↔days (or, on a mismatch, pick the nearest valid pattern instead of silently 3-day) — and/or filter the days/split options so an invalid combo can't be chosen.
- **A2/A3**: filter `excludedExercises` (and injury-flagged movements) out of the returned exercises.
- **A5**: honor `planOverride` (just-today / replace-today) and `defaultRoutineId` by returning the chosen `customWorkouts` routine for that day.
- **A4**: read `weekOverrides` for the selected date in PreSession/dashboard so "tell coach about this week" reflects.
- **A1**: have level/duration visibly affect the session (e.g. duration → warm-up/exercise count; level → sets/rep scheme) **or** soften the rebuild copy if we keep them cosmetic. *(decision below)*
- **A8/A9**: feedback loop (RPE/heavy→recovery→next session) and tweak→actual-exercise changes are closer to a real engine — propose **deferring to backend** and just making the current UI honest, unless you want a frontend simulation. *(decision below)*

### Phase 3 — Nutrition edit coherence 🟠🟡
- **N1/N3**: reconcile calories↔macros↔diet style in "Edit targets" — *approach is a decision below*.
- **N2/X1**: warn (non-blocking) when an edit contradicts the goal direction (e.g. deficit goal + surplus calories; loss goal + higher target weight).
- **N3**: regenerate the coach-explanation prose to mention the diet style.
- **N4**: clear/replace old `isCoachSuggested` meals on rebuild; add an undo (or a confirm) to "Use this plan today".

### Phase 4 — Units / copy / visual 🟡🎨
- **U1**: measurements respect cm/in from the unit preference (+ convert stored values for display). **X2**: audit kg/lb + cm/ft conversions across weight log / target weight / trend.
- **U2**: pluralize "item(s)".
- **V1**: fix the food-row layout (truncate name / give kcal a fixed column so it can't overlap badges).
- **V2**: TopBar uses the real `Avatar` (avatarUrl/initials).
- **V3**: tighten the Coach Chat empty state.
- **V4**: confirm/replace the Settings Coach/Country glyph.

### Phase 5 — Interaction / dev 🔵⚙️
- **I1**: hydration quick-add writes to the selected day's log (mirror M2).
- **I2**: a small navigation debounce/guard helper applied to card pushes.
- **D1**: find & clear the console warning.

---

## Design decisions — ✅ RESOLVED (user-approved)
1. **Nutrition "Edit targets" model (N1/N3): AUTO-BALANCE.** User edits calories + diet style; protein/carbs/fat auto-derive (via the generator's diet-style profiles) to always match the calorie target. Macros become read-only outputs in the editor.
2. **Goal/diet conflict (N2/X1): SOFT-WARN, ALLOW.** Non-blocking inline warning when an edit contradicts the goal direction (deficit goal + surplus; loss goal + higher target weight); the user can still save.
3. **Adaptive depth (A1/A8/A9): PROPAGATE THE DETERMINISTIC LEVERS.** Make `getWorkoutForDate` honor excluded exercises, injuries, plan-override routine, week overrides, and split/days validity, and have level/duration visibly affect sets/warm-up. **Defer** the RPE/heavy-weight feedback loop (A8) and tweak→real-exercise-swap (A9) to backend — and make their copy honest in the meantime.

## Sequencing & resumability
Order: **Phase 1 → 2 → 3 → 4 → 5**, one commit per finding (or tight group), `npx tsc --noEmit` + sim-verify each (deep-link + Quartz-tap method in RESUME.md). Log progress in this file (a status column per finding) and in `FIX_LOG.md`; update `RESUME.md` at each checkpoint so a new session continues. **Do not start editing until the user confirms the plan + answers the 3 decisions above.**
