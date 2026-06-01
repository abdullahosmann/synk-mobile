/**
 * Design-system scalar tokens for inline `style` use (the NativeWind classes
 * `rounded-md/lg`, `h-[44px]` cover className usage; these mirror them 1:1 for
 * the many places that style inline). Source of truth: ../src/index.css +
 * tailwind.config.js.
 *
 * Radii: xs 4 · sm 8 · md 10 · lg 14 · pill 9999.
 * Convention (DESIGN_SYSTEM_AUDIT): outer/content cards = lg, inner
 * tiles/chips/inputs = md, full pills = pill, icon circles = size/2.
 */
export const radii = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 14,
  pill: 9999,
} as const;

/** Interactive control heights. `control` is the canonical button/input/row
 *  height; `large` is reserved for hero / onboarding CTAs. */
export const controlHeight = {
  small: 36,
  control: 44,
  large: 52,
} as const;
