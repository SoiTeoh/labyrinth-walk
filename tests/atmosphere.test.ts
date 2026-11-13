import { describe, expect, it } from 'vitest';
import {
  computeAtmosphere,
  hexToRgb,
  interpolateHex,
  rgbToHex,
  type AtmosphereConfig,
} from '../src/logic/atmosphere';

const testConfig: AtmosphereConfig = {
  stops: {
    0: {
      bg: '#1d2430',
      path: '#8d96a6',
      walked: '#f0c27a',
      goal: '#3a4558',
    },
    1: {
      bg: '#44302c',
      path: '#a89f92',
      walked: '#ffd18b',
      goal: '#70483c',
    },
  },
  centerGlow: {
    startRadius: 24,
    endRadius: 44,
    startOpacity: 0.08,
    endOpacity: 0.48,
  },
  milestones: [0.25, 0.5, 0.75],
};

describe('atmosphere (视觉氛围计算)', () => {
  it('hex 与 rgb 互相转换正确，interpolateHex 正确插值', () => {
    expect(hexToRgb('#1d2430')).toEqual({ r: 29, g: 36, b: 48 });
    expect(rgbToHex({ r: 29, g: 36, b: 48 })).toBe('#1d2430');
    expect(rgbToHex({ r: 255, g: 209, b: 139 })).toBe('#ffd18b');
    expect(interpolateHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(interpolateHex('#000000', '#ffffff', 0)).toBe('#000000');
    expect(interpolateHex('#000000', '#ffffff', 1)).toBe('#ffffff');
  });

  it('验收标准 9：0% 和 100% 时的输出颜色严格等于起止配置', () => {
    const at0 = computeAtmosphere(0, testConfig);
    expect(at0.colors.bg.toLowerCase()).toBe(testConfig.stops[0].bg.toLowerCase());
    expect(at0.colors.path.toLowerCase()).toBe(testConfig.stops[0].path.toLowerCase());
    expect(at0.colors.walked.toLowerCase()).toBe(testConfig.stops[0].walked.toLowerCase());
    expect(at0.colors.goal.toLowerCase()).toBe(testConfig.stops[0].goal.toLowerCase());

    const at1 = computeAtmosphere(1, testConfig);
    expect(at1.colors.bg.toLowerCase()).toBe(testConfig.stops[1].bg.toLowerCase());
    expect(at1.colors.path.toLowerCase()).toBe(testConfig.stops[1].path.toLowerCase());
    expect(at1.colors.walked.toLowerCase()).toBe(testConfig.stops[1].walked.toLowerCase());
    expect(at1.colors.goal.toLowerCase()).toBe(testConfig.stops[1].goal.toLowerCase());
  });

  it('验收标准 9：中间各颜色通道严格单调变化', () => {
    const keys: (keyof typeof testConfig.stops[0])[] = ['bg', 'path', 'walked', 'goal'];
    const steps = 20;

    for (const key of keys) {
      const channelSamples: { r: number[]; g: number[]; b: number[] } = { r: [], g: [], b: [] };

      for (let i = 0; i <= steps; i++) {
        const p = i / steps;
        const out = computeAtmosphere(p, testConfig);
        const rgb = hexToRgb(out.colors[key]);
        channelSamples.r.push(rgb.r);
        channelSamples.g.push(rgb.g);
        channelSamples.b.push(rgb.b);
      }

      for (const ch of ['r', 'g', 'b'] as const) {
        const arr = channelSamples[ch];
        const isNonDecreasing = arr.every((v, idx) => idx === 0 || v >= arr[idx - 1]);
        const isNonIncreasing = arr.every((v, idx) => idx === 0 || v <= arr[idx - 1]);
        expect(
          isNonDecreasing || isNonIncreasing,
          `${key} 的 ${ch} 通道未保持单调：${arr.join(', ')}`,
        ).toBe(true);
      }
    }
  });

  it('中心光晕半径和不透明度随进度单调增加', () => {
    let prevRadius = 0;
    let prevOpacity = 0;

    for (let i = 0; i <= 20; i++) {
      const p = i / 20;
      const out = computeAtmosphere(p, testConfig);
      if (i > 0) {
        expect(out.centerGlowRadius).toBeGreaterThanOrEqual(prevRadius);
        expect(out.centerGlowOpacity).toBeGreaterThanOrEqual(prevOpacity);
      }
      prevRadius = out.centerGlowRadius;
      prevOpacity = out.centerGlowOpacity;
    }
  });

  it('进度超出 [0, 1] 范围时自动裁剪', () => {
    const neg = computeAtmosphere(-0.5, testConfig);
    const pos = computeAtmosphere(1.5, testConfig);
    expect(neg).toEqual(computeAtmosphere(0, testConfig));
    expect(pos).toEqual(computeAtmosphere(1, testConfig));
  });
});
