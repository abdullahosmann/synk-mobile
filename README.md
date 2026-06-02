# SYNK — mobile (React Native / Expo)

Bilingual (EN/AR, full RTL) fitness app. The **frontend is complete and runs on mock/on-device data** — this repo is handed off so the **backend** can replace the mock data sources with a real API.

## Setup
```bash
npm install            # .npmrc sets legacy-peer-deps=true (required)
npx expo start         # Metro (dev). Use a dev client / device build, NOT Expo Go
                       # (custom native modules: reanimated, gesture-handler, view-shot, …)
```
To run on a device/simulator (regenerates the native `ios/`/`android/` projects automatically):
```bash
npx expo run:ios       # or: npx expo run:android
```
- Expo SDK 56 / RN 0.85 / new architecture. `node_modules`, `ios/Pods`, native build dirs are **gitignored and regenerate** — never commit them.

## Where the backend plugs in
The app talks to a small set of **mock/local sources**; swapping these for real API calls is the backend work. Nothing else in the UI needs to change.
- **`src/types.ts`** — every data model (UserProfile, WorkoutLog, CoachNutritionPlan, FoodItem, etc.). This is the contract.
- **`src/AppContext.tsx`** — global state + persistence (currently AsyncStorage). The single source the screens read/write.
- **`src/lib/storage.ts`** — sync-cached AsyncStorage wrapper (keys are `synk:*`). The persistence layer to back with the API.
- **`src/lib/`** mock data/logic to replace with server responses:
  - `historyQueries.ts` (`getAllWorkouts`, `getWorkoutsInMonth`) — workout history.
  - `workoutSelection.ts` (`getWorkoutForDate`) — the daily/adaptive workout engine (deterministic levers wired; RPE/injury logic is a backend TODO — see UX_REVIEW_2.md).
  - `nutritionPlan.ts` (`generateNutritionPlan`, `computeMacros`, `estimateMaintenance`) — nutrition targets.
  - `planUtils.ts` — plan/calorie math.
- Mock food DB: `src/data/commonFoods.ts`, `src/data/foods-egypt.ts`.

## Branches
- **`dev`** — stable baseline (all feature/coherence/a11y/perf work).
- **`design-system`** — `dev` + a visual-consistency pass (radii/heights/labels) + keyboard handling; under review for keep/merge.
- tag **`pre-design-system`** — restore point before that pass.

## Project context (read these)
- `RESUME.md` — full status + how everything was built/verified.
- `MIGRATION_MAP.md` — routes, tokens, state, web→RN mapping.
- `FIX_LOG.md`, `UX_REVIEW_2.md`, `DESIGN_SYSTEM_AUDIT.md` — what was changed and why.

## Note
`app.json` `bundleIdentifier` is `app.synk.mobile`. To run on a personal (free) Apple ID, use a unique id (e.g. `app.synk.mobile.<name>`) and remove the Push Notifications entitlement — push needs a paid Apple Developer account.
