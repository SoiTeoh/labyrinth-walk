import { describe, expect, it } from 'vitest';
import {
  distance,
  pathLength,
  pathToD,
  pointOnSegment,
  segmentEnd,
  segmentLength,
  slicePath,
  type Segment,
} from '../src/logic/geometry';

describe('distance', () => {
  it('计算两点距离', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(distance({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0);
  });
});

describe('线段与圆弧', () => {
  const line: Segment = { kind: 'line', from: { x: 0, y: 0 }, to: { x: 10, y: 0 } };
  const arc: Segment = { kind: 'arc', center: { x: 0, y: 0 }, radius: 10, startAngle: 0, sweep: Math.PI / 2 };
  const arcBack: Segment = { kind: 'arc', center: { x: 0, y: 0 }, radius: 10, startAngle: 0, sweep: -Math.PI / 2 };

  it('长度', () => {
    expect(segmentLength(line)).toBe(10);
    expect(segmentLength(arc)).toBeCloseTo(5 * Math.PI, 10);
    expect(segmentLength(arcBack)).toBeCloseTo(5 * Math.PI, 10);
  });

  it('按长度取点，并限制在段内', () => {
    expect(pointOnSegment(line, 4)).toEqual({ x: 4, y: 0 });
    expect(pointOnSegment(line, -5)).toEqual({ x: 0, y: 0 });
    expect(pointOnSegment(line, 99)).toEqual({ x: 10, y: 0 });
    const mid = pointOnSegment(arc, (5 * Math.PI) / 2);
    expect(mid.x).toBeCloseTo(10 * Math.cos(Math.PI / 4), 10);
    expect(mid.y).toBeCloseTo(10 * Math.sin(Math.PI / 4), 10);
    // 反向圆弧走向 y 负方向
    expect(pointOnSegment(arcBack, 5 * Math.PI).y).toBeCloseTo(-10, 10);
  });

  it('slicePath 截取的长度等于请求的长度', () => {
    const path = [line, { kind: 'line', from: { x: 10, y: 0 }, to: { x: 10, y: 10 } } as Segment];
    for (const len of [0, 3, 10, 14.5, 20]) {
      expect(pathLength(slicePath(path, len))).toBeCloseTo(len, 10);
    }
    expect(pathLength(slicePath(path, 99))).toBeCloseTo(20, 10);
    const half = slicePath([arc], (5 * Math.PI) / 2);
    expect(segmentEnd(half[0]).x).toBeCloseTo(10 * Math.cos(Math.PI / 4), 10);
  });

  it('pathToD 输出 M/L/A 命令和正确的圆弧标志', () => {
    const big: Segment = { kind: 'arc', center: { x: 0, y: 0 }, radius: 10, startAngle: 0, sweep: 1.5 * Math.PI };
    const d = pathToD([line, { kind: 'arc', center: { x: 0, y: 0 }, radius: 10, startAngle: 0, sweep: -1 }, big]);
    expect(d.startsWith('M0 0 L10 0 ')).toBe(true);
    expect(d).toContain('A10 10 0 0 0 ');
    expect(d).toContain('A10 10 0 1 1 ');
    expect(pathToD([])).toBe('');
  });
});
