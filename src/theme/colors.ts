/**
 * Raw design-token values, mirrored 1:1 from src/index.css (@theme + html.dark).
 *
 * NativeWind classes cover most styling, but some places need literal color
 * values (SVG fills, Reanimated interpolations, icon `color` props, blur tints).
 * Use `useColors()` from ThemeProvider to get the active palette, or import
 * `lightColors` / `darkColors` directly for static needs.
 */

export interface Palette {
  primary: string;
  primaryFocus: string;
  primaryOnDark: string;

  ink: string;
  inkMuted80: string;
  inkMuted48: string;
  inkMuted24: string;

  bodyOnDark: string;
  bodyMuted: string;

  dividerSoft: string;
  hairline: string;

  canvas: string;
  canvasParchment: string;

  surfacePearl: string;
  surfaceTile1: string;
  surfaceTile2: string;
  surfaceTile3: string;
  surfaceBlack: string;

  onPrimary: string;
  onDark: string;

  semanticGreen: string;
  semanticRed: string;
  semanticOrange: string;
}

export const lightColors: Palette = {
  primary: "#0066cc",
  primaryFocus: "#0071e3",
  primaryOnDark: "#2997ff",

  ink: "#1d1d1f",
  inkMuted80: "#333333",
  inkMuted48: "#7a7a7a",
  inkMuted24: "#b8b8b8",

  bodyOnDark: "#ffffff",
  bodyMuted: "#cccccc",

  dividerSoft: "#f0f0f0",
  hairline: "#e0e0e0",

  canvas: "#ffffff",
  canvasParchment: "#f5f5f7",

  surfacePearl: "#fafafc",
  surfaceTile1: "#272729",
  surfaceTile2: "#2a2a2c",
  surfaceTile3: "#252527",
  surfaceBlack: "#000000",

  onPrimary: "#ffffff",
  onDark: "#ffffff",

  semanticGreen: "#34c759",
  semanticRed: "#ff3b30",
  semanticOrange: "#ff9500",
};

export const darkColors: Palette = {
  ...lightColors,
  // html.dark overrides from index.css
  primary: "#2997ff",
  primaryFocus: "#4DA6FF",

  ink: "#F5F7FA",
  inkMuted80: "#D7DCE3",
  inkMuted48: "#A6ADB8",
  inkMuted24: "#6F7785",

  dividerSoft: "rgba(255,255,255,0.10)",
  hairline: "rgba(255,255,255,0.10)",

  canvas: "#0B0D10",
  canvasParchment: "#111418",

  surfacePearl: "#171B21",
};
