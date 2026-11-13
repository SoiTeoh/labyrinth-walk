import { tuning, type RuntimeTuning } from './tuning';

export const PARAM_LIMITS = {
  rings: { min: 1, max: 7 },
  tolerance: { min: 6, max: 60 },
  grabRadius: { min: 10, max: 120 },
} as const;

export interface ParsedTuningResult {
  tuning: RuntimeTuning;
  debug: boolean;
  overrides: {
    rings?: number;
    tolerance?: number;
    grabRadius?: number;
  };
}

function parseStrictNumber(raw: string | null): number | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num)) return null;
  return num;
}

function parseValidInt(raw: string | null, min: number, max: number): number | null {
  const num = parseStrictNumber(raw);
  if (num === null || !Number.isInteger(num)) return null;
  if (num < min || num > max) return null;
  return num;
}

function parseValidFloat(raw: string | null, min: number, max: number): number | null {
  const num = parseStrictNumber(raw);
  if (num === null) return null;
  if (num < min || num > max) return null;
  return num;
}

/**
 * 从 URL 查询字符串安全解析调参配置，非法值自动回退到默认值。
 * 支持参数：debug=1, rings, tolerance, grabRadius。
 */
export function parseTuningFromSearch(
  search: string,
  base: RuntimeTuning = tuning,
): ParsedTuningResult {
  const params = new URLSearchParams(search);
  const debug = params.get('debug') === '1';

  const rings = parseValidInt(params.get('rings'), PARAM_LIMITS.rings.min, PARAM_LIMITS.rings.max);
  const tolerance = parseValidFloat(
    params.get('tolerance'),
    PARAM_LIMITS.tolerance.min,
    PARAM_LIMITS.tolerance.max,
  );
  const grabRadius = parseValidFloat(
    params.get('grabRadius'),
    PARAM_LIMITS.grabRadius.min,
    PARAM_LIMITS.grabRadius.max,
  );

  const overrides: ParsedTuningResult['overrides'] = {};
  if (rings !== null) overrides.rings = rings;
  if (tolerance !== null) overrides.tolerance = tolerance;
  if (grabRadius !== null) overrides.grabRadius = grabRadius;

  return {
    debug,
    overrides,
    tuning: {
      ...base,
      maze: {
        ...base.maze,
        rings: rings ?? base.maze.rings,
      },
      walk: {
        ...base.walk,
        tolerance: tolerance ?? base.walk.tolerance,
        grabRadius: grabRadius ?? base.walk.grabRadius,
      },
    },
  };
}
