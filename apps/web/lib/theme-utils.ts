/**
 * Utilitários para conversão de cores e aplicação de temas customizados
 */

import type { CustomTheme } from "./validations";

// Re-export CustomTheme for use in other components
export type { CustomTheme };

/**
 * Converte uma cor HEX (#RRGGBB) para HSL (h s% l%)
 * Retorna no formato usado pelas variáveis CSS do Tailwind (sem "hsl()")
 */
export function hexToHsl(hex: string): string {
  // Remove o # se presente
  const cleanHex = hex.replace(/^#/, "");

  // Converte para RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Retorna no formato "h s% l%" (sem parênteses, para uso com variáveis CSS)
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Converte HSL (formato variável CSS) para HEX
 */
export function hslToHex(hslString: string): string {
  const parts = hslString.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return "#000000";

  const part0 = parts[0];
  const part1 = parts[1];
  const part2 = parts[2];
  if (!part0 || !part1 || !part2) return "#000000";

  const h = parseFloat(part0) / 360;
  const s = parseFloat(part1) / 100;
  const l = parseFloat(part2) / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Gera as variáveis CSS inline a partir de um CustomTheme
 */
export function generateThemeStyles(theme: CustomTheme | null | undefined): React.CSSProperties {
  if (!theme) return {};

  const styles: Record<string, string> = {};

  if (theme.primaryColor) {
    styles["--primary"] = hexToHsl(theme.primaryColor);
    styles["--ring"] = hexToHsl(theme.primaryColor);
  }

  if (theme.backgroundColor) {
    styles["--background"] = hexToHsl(theme.backgroundColor);
  }

  if (theme.cardBackground) {
    styles["--card"] = hexToHsl(theme.cardBackground);
    styles["--popover"] = hexToHsl(theme.cardBackground);
  }

  if (theme.textColor) {
    styles["--foreground"] = hexToHsl(theme.textColor);
    styles["--card-foreground"] = hexToHsl(theme.textColor);
    styles["--popover-foreground"] = hexToHsl(theme.textColor);
  }

  if (theme.accentColor) {
    styles["--accent"] = hexToHsl(theme.accentColor);
  }

  if (theme.borderRadius) {
    const radiusMap: Record<string, string> = {
      none: "0",
      sm: "0.25rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
      full: "9999px",
    };
    styles["--radius"] = radiusMap[theme.borderRadius] || "0.75rem";
  }

  return styles as React.CSSProperties;
}

/**
 * Tema padrão (usado como fallback e para preview)
 */
export const defaultTheme: Required<CustomTheme> = {
  primaryColor: "#10b981", // emerald-500
  backgroundColor: "#030712", // gray-950
  cardBackground: "#0a1120", // custom dark blue
  textColor: "#f8fafc", // slate-50
  accentColor: "#f59e0b", // amber-500
  borderRadius: "lg",
};

/**
 * Presets de temas para usuários Pro
 */
export const themePresets: Record<string, Required<CustomTheme>> = {
  default: defaultTheme,
  ocean: {
    primaryColor: "#0ea5e9", // sky-500
    backgroundColor: "#0c1929",
    cardBackground: "#0f2942",
    textColor: "#e0f2fe", // sky-100
    accentColor: "#06b6d4", // cyan-500
    borderRadius: "lg",
  },
  sunset: {
    primaryColor: "#f97316", // orange-500
    backgroundColor: "#1c1015",
    cardBackground: "#2d1a1f",
    textColor: "#fff7ed", // orange-50
    accentColor: "#ec4899", // pink-500
    borderRadius: "md",
  },
  forest: {
    primaryColor: "#22c55e", // green-500
    backgroundColor: "#0a1a0f",
    cardBackground: "#122118",
    textColor: "#f0fdf4", // green-50
    accentColor: "#84cc16", // lime-500
    borderRadius: "lg",
  },
  lavender: {
    primaryColor: "#a855f7", // purple-500
    backgroundColor: "#13101c",
    cardBackground: "#1e1a2e",
    textColor: "#faf5ff", // purple-50
    accentColor: "#ec4899", // pink-500
    borderRadius: "xl",
  },
  midnight: {
    primaryColor: "#6366f1", // indigo-500
    backgroundColor: "#020617", // slate-950
    cardBackground: "#0f172a", // slate-900
    textColor: "#e2e8f0", // slate-200
    accentColor: "#8b5cf6", // violet-500
    borderRadius: "md",
  },
  rose: {
    primaryColor: "#f43f5e", // rose-500
    backgroundColor: "#18080d",
    cardBackground: "#2a0f17",
    textColor: "#fff1f2", // rose-50
    accentColor: "#fb7185", // rose-400
    borderRadius: "lg",
  },
};

/**
 * Valida se uma string é uma cor HEX válida
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Clareia uma cor HEX
 */
export function lightenColor(hex: string, percent: number): string {
  const hsl = hexToHsl(hex);
  const parts = hsl.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return hex;

  const part0 = parts[0];
  const part1 = parts[1];
  const part2 = parts[2];
  if (!part0 || !part1 || !part2) return hex;

  const h = parseFloat(part0);
  const s = parseFloat(part1);
  const l = Math.min(100, parseFloat(part2) + percent);

  return hslToHex(`${h} ${s}% ${l}%`);
}

/**
 * Escurece uma cor HEX
 */
export function darkenColor(hex: string, percent: number): string {
  const hsl = hexToHsl(hex);
  const parts = hsl.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return hex;

  const part0 = parts[0];
  const part1 = parts[1];
  const part2 = parts[2];
  if (!part0 || !part1 || !part2) return hex;

  const h = parseFloat(part0);
  const s = parseFloat(part1);
  const l = Math.max(0, parseFloat(part2) - percent);

  return hslToHex(`${h} ${s}% ${l}%`);
}
