import { describe, expect, it } from 'vitest';
import { tuning } from '../src/config/tuning';
import { distance, segmentEnd, segmentStart } from '../src/logic/geometry';
import { buildLabyrinth } from '../src/logic/labyrinth';
import { createTrack } from '../src/logic/pathTrack';

const center = { x: tuning.view.centerX, y: tuning.view.centerY };
const maze = tuning.maze;
const lab = buildLabyrinth(maze, center);

/** 独立于实现计算的解析总长 */
function analyticTotal(rings: number): number {
  const span = 2 * Math.PI - maze.gapAngle;
  let sum = maze.entryLength;
  for (let i = 0; i < rings; i++) sum += span * (maze.centerRadius + maze.ringSpacing * (rings - i));
  sum += (rings - 1) * maze.ringSpacing; // 圈与圈之间的径向转弯
  sum += maze.centerRadius + maze.ringSpacing; // 最内圈到中心
  return sum;
}

describe('buildLabyrinth', () => {
  it('段首尾相接，误差小于 1e-6', () => {
    for (let i = 0; i + 1 < lab.segments.length; i++) {
      expect(distance(segmentEnd(lab.segments[i]), segmentStart(lab.segments[i + 1]))).toBeLessThan(1e-6);
    }
  });

  it('起点在最外圈正下方，终点在中心半径内', () => {
    const outer = lab.ringRadii[0];
    expect(lab.start.x).toBeCloseTo(center.x, 6);
    expect(lab.start.y).toBeGreaterThan(center.y + outer);
    expect(distance(lab.end, center)).toBeLessThanOrEqual(maze.centerRadius);
  });

  it('圈数正确，相邻圈中心线间距等于 ringSpacing', () => {
    const arcs = lab.segments.filter((s) => s.kind === 'arc');
    expect(arcs).toHaveLength(maze.rings);
    for (let i = 0; i + 1 < arcs.length; i++) {
      const a = arcs[i];
      const b = arcs[i + 1];
      if (a.kind !== 'arc' || b.kind !== 'arc') throw new Error('unreachable');
      expect(a.radius - b.radius).toBeCloseTo(maze.ringSpacing, 10);
      // 相邻圈走向相反
      expect(Math.sign(a.sweep)).toBe(-Math.sign(b.sweep));
    }
  });

  it('总长度与解析值误差小于 0.5%', () => {
    const expected = analyticTotal(maze.rings);
    expect(Math.abs(lab.total - expected) / expected).toBeLessThan(0.005);
    // 采样折线的长度也要和解析值一致
    const track = createTrack(lab.segments, tuning.track.sampleStep);
    let chordSum = 0;
    for (let i = 1; i < track.points.length; i++) chordSum += distance(track.points[i - 1], track.points[i]);
    expect(Math.abs(chordSum - expected) / expected).toBeLessThan(0.005);
  });

  it('修改 rings 后圈数和长度随之变化', () => {
    for (const rings of [1, 3, 6, 8]) {
      const l = buildLabyrinth({ ...maze, rings }, center);
      expect(l.segments.filter((s) => s.kind === 'arc')).toHaveLength(rings);
      expect(Math.abs(l.total - analyticTotal(rings)) / analyticTotal(rings)).toBeLessThan(0.005);
      expect(distance(l.end, center)).toBeLessThanOrEqual(maze.centerRadius);
    }
  });

  it('小路不自相交：路程相隔较远的两点，空间距离至少是路宽加 4', () => {
    const track = createTrack(lab.segments, 3);
    const minGap = maze.pathWidth + 4;
    const farAlongPath = 3 * maze.ringSpacing;
    let worst = Infinity;
    for (let i = 0; i < track.points.length; i++) {
      for (let j = i + 1; j < track.points.length; j++) {
        if (track.lengths[j] - track.lengths[i] <= farAlongPath) continue;
        worst = Math.min(worst, distance(track.points[i], track.points[j]));
      }
    }
    expect(worst).toBeGreaterThanOrEqual(minGap);
  });

  it('非法参数抛错', () => {
    expect(() => buildLabyrinth({ ...maze, rings: 0 }, center)).toThrow();
    expect(() => buildLabyrinth({ ...maze, gapAngle: 0 }, center)).toThrow();
    expect(() => buildLabyrinth({ ...maze, ringSpacing: -1 }, center)).toThrow();
  });
});
