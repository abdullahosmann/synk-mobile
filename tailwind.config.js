/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Mapped 1:1 from src/index.css @theme + html.dark overrides.
        // Single source of truth values; dark-mode variants handled via
        // the `dark:` className driven by the theme provider.
        primary: {
          DEFAULT: "#0066cc",
          focus: "#0071e3",
          "on-dark": "#2997ff",
          dark: "#2997ff",
          "dark-focus": "#4DA6FF",
        },
        ink: {
          DEFAULT: "#1d1d1f",
          "muted-80": "#333333",
          "muted-48": "#7a7a7a",
          "muted-24": "#b8b8b8",
          // dark variants
          dark: "#F5F7FA",
          "dark-muted-80": "#D7DCE3",
          "dark-muted-48": "#A6ADB8",
          "dark-muted-24": "#6F7785",
        },
        "body-on-dark": "#ffffff",
        "body-muted": "#cccccc",
        "divider-soft": {
          DEFAULT: "#f0f0f0",
          dark: "rgba(255,255,255,0.10)",
        },
        hairline: {
          DEFAULT: "#e0e0e0",
          dark: "rgba(255,255,255,0.10)",
        },
        canvas: {
          DEFAULT: "#ffffff",
          parchment: "#f5f5f7",
          dark: "#0B0D10",
          "parchment-dark": "#111418",
        },
        surface: {
          pearl: "#fafafc",
          "pearl-dark": "#171B21",
          "tile-1": "#272729",
          "tile-2": "#2a2a2c",
          "tile-3": "#252527",
          black: "#000000",
        },
        "on-primary": "#ffffff",
        "on-dark": "#ffffff",
        semantic: {
          green: "#34c759",
          red: "#ff3b30",
          orange: "#ff9500",
        },
      },
      borderRadius: {
        none: "0px",
        xs: "4px",
        sm: "8px",
        md: "10px",
        lg: "14px",
        pill: "9999px",
        full: "9999px",
      },
      fontFamily: {
        sans: ["Inter_400Regular"],
        body: ["Inter_400Regular"],
        "body-light": ["Inter_300Light"],
        "body-semibold": ["Inter_600SemiBold"],
        headline: ["Inter_600SemiBold"],
        arabic: ["Cairo_400Regular"],
        "arabic-light": ["Cairo_300Light"],
        "arabic-semibold": ["Cairo_600SemiBold"],
      },
    },
  },
  plugins: [],
};
