export const THEME_STORAGE_KEY = "docuhub-theme";

export const THEME_NAMES = [
  "cozy-cream",
  "cozy-rose",
  "cozy-sage",
  "cozy-sky",
  "cozy-peach",
  "cozy-lavender",
  "dark-slate",
  "dark-ocean",
  "dark-forest",
  "dark-ember",
  "dark-plum",
  "dark-mono",
] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

export type ThemeMode = "light" | "dark";

export type ThemeTokens = {
  label: string;
  mode: ThemeMode;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  success: string;
  danger: string;
};

export const DEFAULT_THEME: ThemeName = "cozy-cream";

export const THEMES: Record<ThemeName, ThemeTokens> = {
  "cozy-cream": {
    label: "Cozy Cream",
    mode: "light",
    background: "#f8f2ea",
    surface: "#fffaf4",
    text: "#2f241d",
    mutedText: "#6f5f53",
    border: "#dccfc1",
    primary: "#7a4e2f",
    primaryForeground: "#ffffff",
    accent: "#a6684a",
    accentForeground: "#ffffff",
    success: "#1f6d3d",
    danger: "#a33131",
  },
  "cozy-rose": {
    label: "Cozy Rose",
    mode: "light",
    background: "#fbf1f3",
    surface: "#fff8f9",
    text: "#3b2029",
    mutedText: "#76505d",
    border: "#e7cbd4",
    primary: "#8e3b57",
    primaryForeground: "#ffffff",
    accent: "#b24e6e",
    accentForeground: "#ffffff",
    success: "#1f6d3d",
    danger: "#a33131",
  },
  "cozy-sage": {
    label: "Cozy Sage",
    mode: "light",
    background: "#f1f6f0",
    surface: "#fbfffa",
    text: "#1d3024",
    mutedText: "#4f6758",
    border: "#cfe0d2",
    primary: "#2f6b45",
    primaryForeground: "#ffffff",
    accent: "#4b8a61",
    accentForeground: "#ffffff",
    success: "#1f6d3d",
    danger: "#a33131",
  },
  "cozy-sky": {
    label: "Cozy Sky",
    mode: "light",
    background: "#eef5fb",
    surface: "#f9fcff",
    text: "#1d3040",
    mutedText: "#4d6275",
    border: "#ccdcea",
    primary: "#245b85",
    primaryForeground: "#ffffff",
    accent: "#3274a8",
    accentForeground: "#ffffff",
    success: "#1f6d3d",
    danger: "#a33131",
  },
  "cozy-peach": {
    label: "Cozy Peach",
    mode: "light",
    background: "#fff3eb",
    surface: "#fffbf8",
    text: "#3b261c",
    mutedText: "#7a584b",
    border: "#f0d2c1",
    primary: "#a14f2f",
    primaryForeground: "#ffffff",
    accent: "#c1673e",
    accentForeground: "#ffffff",
    success: "#1f6d3d",
    danger: "#a33131",
  },
  "cozy-lavender": {
    label: "Cozy Lavender",
    mode: "light",
    background: "#f4f1fa",
    surface: "#fcfaff",
    text: "#2c2540",
    mutedText: "#65597d",
    border: "#d9d0ea",
    primary: "#5e4b88",
    primaryForeground: "#ffffff",
    accent: "#7b63ab",
    accentForeground: "#ffffff",
    success: "#1f6d3d",
    danger: "#a33131",
  },
  "dark-slate": {
    label: "Dark Slate",
    mode: "dark",
    background: "#10141d",
    surface: "#1a2230",
    text: "#eef3fb",
    mutedText: "#b6c1d4",
    border: "#334155",
    primary: "#60a5fa",
    primaryForeground: "#0c1628",
    accent: "#f59e0b",
    accentForeground: "#1f2937",
    success: "#34d399",
    danger: "#f87171",
  },
  "dark-ocean": {
    label: "Dark Ocean",
    mode: "dark",
    background: "#0a1b25",
    surface: "#112a38",
    text: "#eaf6ff",
    mutedText: "#b3d0e2",
    border: "#2f4d60",
    primary: "#38bdf8",
    primaryForeground: "#0a2230",
    accent: "#22d3ee",
    accentForeground: "#0b2230",
    success: "#34d399",
    danger: "#f87171",
  },
  "dark-forest": {
    label: "Dark Forest",
    mode: "dark",
    background: "#101d15",
    surface: "#193022",
    text: "#ebf9ef",
    mutedText: "#b8d7c2",
    border: "#345140",
    primary: "#4ade80",
    primaryForeground: "#102316",
    accent: "#84cc16",
    accentForeground: "#1f2e11",
    success: "#4ade80",
    danger: "#f87171",
  },
  "dark-ember": {
    label: "Dark Ember",
    mode: "dark",
    background: "#1a1311",
    surface: "#2a1d18",
    text: "#fff2eb",
    mutedText: "#ddc0b0",
    border: "#574033",
    primary: "#fb923c",
    primaryForeground: "#2a1708",
    accent: "#f97316",
    accentForeground: "#2b1506",
    success: "#34d399",
    danger: "#f87171",
  },
  "dark-plum": {
    label: "Dark Plum",
    mode: "dark",
    background: "#181220",
    surface: "#251932",
    text: "#f6eeff",
    mutedText: "#c9b5de",
    border: "#4a365f",
    primary: "#c084fc",
    primaryForeground: "#24143a",
    accent: "#a78bfa",
    accentForeground: "#201033",
    success: "#34d399",
    danger: "#f87171",
  },
  "dark-mono": {
    label: "Dark Mono",
    mode: "dark",
    background: "#0f0f10",
    surface: "#1c1c1f",
    text: "#f5f5f5",
    mutedText: "#c8c8cc",
    border: "#3b3b42",
    primary: "#d1d5db",
    primaryForeground: "#111111",
    accent: "#9ca3af",
    accentForeground: "#111827",
    success: "#34d399",
    danger: "#f87171",
  },
};

export const THEME_GROUPS = {
  light: THEME_NAMES.filter((name) => THEMES[name].mode === "light"),
  dark: THEME_NAMES.filter((name) => THEMES[name].mode === "dark"),
} as const;

const LEGACY_THEME_MAP: Record<string, ThemeName> = {
  classic: "cozy-cream",
  ocean: "cozy-sky",
  forest: "cozy-sage",
  sunset: "cozy-peach",
  mono: "cozy-lavender",
  slate: "dark-slate",
};

const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  const value =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : clean;
  const int = Number.parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const relativeLuminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const channel = (n: number) => {
    const srgb = n / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrastRatio = (foreground: string, background: string) => {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
};

type ThemeContrastAudit = {
  pass: boolean;
  checks: Record<string, number>;
};

const createAudit = (tokens: ThemeTokens): ThemeContrastAudit => {
  const checks = {
    textOnBackground: contrastRatio(tokens.text, tokens.background),
    textOnSurface: contrastRatio(tokens.text, tokens.surface),
    mutedTextOnBackground: contrastRatio(tokens.mutedText, tokens.background),
    primaryForegroundOnPrimary: contrastRatio(tokens.primaryForeground, tokens.primary),
    accentForegroundOnAccent: contrastRatio(tokens.accentForeground, tokens.accent),
  };
  const pass =
    checks.textOnBackground >= 4.5 &&
    checks.textOnSurface >= 4.5 &&
    checks.mutedTextOnBackground >= 4.5 &&
    checks.primaryForegroundOnPrimary >= 4.5 &&
    checks.accentForegroundOnAccent >= 4.5;

  return { pass, checks };
};

export const THEME_CONTRAST_AUDIT: Record<ThemeName, ThemeContrastAudit> = Object.fromEntries(
  THEME_NAMES.map((name) => [name, createAudit(THEMES[name])]),
) as Record<ThemeName, ThemeContrastAudit>;

export const isThemeName = (value: string | null | undefined): value is ThemeName =>
  Boolean(value && THEME_NAMES.includes(value as ThemeName));

export const resolveStoredTheme = (value: string | null | undefined): ThemeName => {
  if (isThemeName(value)) return value;
  if (value && value in LEGACY_THEME_MAP) return LEGACY_THEME_MAP[value];
  return DEFAULT_THEME;
};
