/**
 * withAlpha — apply an alpha to a hex color, returning an rgba() string.
 *
 * Used to replace hardcoded `rgba(0,102,204,*)` primary tints (audit P1) with
 * `withAlpha(colors.primary, a)` so the tint adapts to the theme (the dark
 * primary is #2997ff, not the light #0066cc). Accepts #rgb / #rrggbb and passes
 * through any non-hex value (e.g. already-rgba) unchanged.
 */
export function withAlpha(hex: string, alpha: number): string {
  if (typeof hex !== "string" || hex[0] !== "#") return hex;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return hex;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
