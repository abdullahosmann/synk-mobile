/**
 * /coach-swap — post-onboarding "change your coach" route.
 *
 * Renders the same CoachSelection screen as /onboarding/coach. That component
 * already detects swap mode via `usePathname() === "/coach-swap"` (renders a
 * "Save" CTA, pre-selects the current coach, and router.back()s with a toast on
 * save), so this route only needs to exist for that branch to activate. Reached
 * from the CoachChat header swap button and Settings → Coach.
 */
export { default } from "./onboarding/coach";
