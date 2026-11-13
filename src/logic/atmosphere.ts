export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface AtmosphereTheme {
  bg: string;
  path: string;
  walked: string;
  goal: string;
}

export interface AtmosphereConfig {
  stops: {
    0: AtmosphereTheme;
    1: AtmosphereTheme;
  };
  centerGlow: {
    startRadius: number;
    endRadius: number;
    startOpacity: number;
    endOpacity: number;
  };
  milestones: readonly number[];
}

export interface AtmosphereOutput {
  colors: AtmosphereTheme;
  centerGlowRadius: number;
  centerGlowOpacity: number;
}

/**
 * 将 6 位 hex 颜色转为 RGB 对象。
 */
export function hexToRgb(hex: string): Rgb {
  const sanitized = hex.replace('#', '').trim();
  const num = parseInt(sanitized, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * 将 RGB 对象转为 6 位小写 hex 字符串。
 */
export function rgbToHex(rgb: Rgb): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(rgb.r).toString(16).padStart(2, '0');
  const g = clamp(rgb.g).toString(16).padStart(2, '0');
  const b = clamp(rgb.b).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

/**
 * 两个 RGB 颜色之间的线性插值（纯数学，严格单调）。
 */
export function interpolateRgb(a: Rgb, b: Rgb, t: number): Rgb {
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    r: Math.round(a.r + (b.r - a.r) * clampedT),
    g: Math.round(a.g + (b.g - a.g) * clampedT),
    b: Math.round(a.b + (b.b - a.b) * clampedT),
  };
}

/**
 * 两个 Hex 颜色插值。
 */
export function interpolateHex(hexA: string, hexB: string, t: number): string {
  if (t <= 0) return hexA.toLowerCase();
  if (t >= 1) return hexB.toLowerCase();
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex(interpolateRgb(a, b, t));
}

/**
 * 根据进度计算当前视觉氛围属性（纯函数）。
 */
export function computeAtmosphere(p: number, config: AtmosphereConfig): AtmosphereOutput {
  const clampedP = Math.max(0, Math.min(1, p));
  const { stops, centerGlow } = config;

  const colors: AtmosphereTheme = {
    bg: interpolateHex(stops[0].bg, stops[1].bg, clampedP),
    path: interpolateHex(stops[0].path, stops[1].path, clampedP),
    walked: interpolateHex(stops[0].walked, stops[1].walked, clampedP),
    goal: interpolateHex(stops[0].goal, stops[1].goal, clampedP),
  };

  const centerGlowRadius =
    centerGlow.startRadius + (centerGlow.endRadius - centerGlow.startRadius) * clampedP;
  const centerGlowOpacity =
    centerGlow.startOpacity + (centerGlow.endOpacity - centerGlow.startOpacity) * clampedP;

  return {
    colors,
    centerGlowRadius,
    centerGlowOpacity,
  };
}
