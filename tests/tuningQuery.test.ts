import { describe, expect, it } from 'vitest';
import { tuning } from '../src/config/tuning';
import { PARAM_LIMITS, parseTuningFromSearch } from '../src/config/tuningQuery';

describe('parseTuningFromSearch', () => {
  it('无参数时保持默认配置与 debug=false', () => {
    const res = parseTuningFromSearch('');
    expect(res.debug).toBe(false);
    expect(res.overrides).toEqual({});
    expect(res.tuning.maze.rings).toBe(tuning.maze.rings);
    expect(res.tuning.walk.tolerance).toBe(tuning.walk.tolerance);
    expect(res.tuning.walk.grabRadius).toBe(tuning.walk.grabRadius);
  });

  it('正确解析合法的 tolerance、grabRadius、rings 和 debug=1', () => {
    const res = parseTuningFromSearch('?debug=1&tolerance=28&grabRadius=50&rings=5');
    expect(res.debug).toBe(true);
    expect(res.overrides).toEqual({
      tolerance: 28,
      grabRadius: 50,
      rings: 5,
    });
    expect(res.tuning.walk.tolerance).toBe(28);
    expect(res.tuning.walk.grabRadius).toBe(50);
    expect(res.tuning.maze.rings).toBe(5);
    // 未覆盖字段保持默认
    expect(res.tuning.walk.searchBack).toBe(tuning.walk.searchBack);
    expect(res.tuning.view.width).toBe(tuning.view.width);
  });

  it('支持边界值', () => {
    const minRes = parseTuningFromSearch(
      `?rings=${PARAM_LIMITS.rings.min}&tolerance=${PARAM_LIMITS.tolerance.min}&grabRadius=${PARAM_LIMITS.grabRadius.min}`,
    );
    expect(minRes.tuning.maze.rings).toBe(PARAM_LIMITS.rings.min);
    expect(minRes.tuning.walk.tolerance).toBe(PARAM_LIMITS.tolerance.min);
    expect(minRes.tuning.walk.grabRadius).toBe(PARAM_LIMITS.grabRadius.min);

    const maxRes = parseTuningFromSearch(
      `?rings=${PARAM_LIMITS.rings.max}&tolerance=${PARAM_LIMITS.tolerance.max}&grabRadius=${PARAM_LIMITS.grabRadius.max}`,
    );
    expect(maxRes.tuning.maze.rings).toBe(PARAM_LIMITS.rings.max);
    expect(maxRes.tuning.walk.tolerance).toBe(PARAM_LIMITS.tolerance.max);
    expect(maxRes.tuning.walk.grabRadius).toBe(PARAM_LIMITS.grabRadius.max);
  });

  it('非法类型、空值、小数 rings 与越界参数均回退默认值', () => {
    const cases = [
      '?tolerance=abc&grabRadius=NaN&rings=xyz',
      '?tolerance=&grabRadius=&rings=',
      '?tolerance=-5&grabRadius=0&rings=0',
      '?tolerance=999&grabRadius=999&rings=8',
      '?rings=3.5&tolerance=Infinity&grabRadius=-Infinity',
      '?debug=0&rings=-2',
    ];

    for (const search of cases) {
      const res = parseTuningFromSearch(search);
      expect(res.debug).toBe(false);
      expect(res.overrides).toEqual({});
      expect(res.tuning.maze.rings).toBe(tuning.maze.rings);
      expect(res.tuning.walk.tolerance).toBe(tuning.walk.tolerance);
      expect(res.tuning.walk.grabRadius).toBe(tuning.walk.grabRadius);
    }
  });

  it('部分合法、部分非法时仅采纳合法参数', () => {
    const res = parseTuningFromSearch('?debug=1&rings=99&tolerance=24&grabRadius=bad');
    expect(res.debug).toBe(true);
    expect(res.overrides).toEqual({ tolerance: 24 });
    expect(res.tuning.walk.tolerance).toBe(24);
    expect(res.tuning.maze.rings).toBe(tuning.maze.rings);
    expect(res.tuning.walk.grabRadius).toBe(tuning.walk.grabRadius);
  });
});
