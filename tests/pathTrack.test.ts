import { describe, expect, it } from 'vitest';
import { tuning } from '../src/config/tuning';
import { distance, pathLength, type Segment } from '../src/logic/geometry';
import { buildLabyrinth } from '../src/logic/labyrinth';
import { createTrack, pointAt, projectInWindow } from '../src/logic/pathTrack';

describe('createTrack / pointAt', () => {
  const segs: Segment[] = [
    { kind: 'line', from: { x: 0, y: 0 }, to: { x: 10, y: 0 } },
    { kind: 'arc', center: { x: 10, y: 10 }, radius: 10, startAngle: -Math.PI / 2, sweep: Math.PI / 2 },
  ];
  const track = createTrack(segs, 1);

  it('总长等于解析长度，累计长度单调递增', () => {
    expect(track.total).toBeCloseTo(pathLength(segs), 10);
    for (let i = 1; i < track.lengths.length; i++) {
      expect(track.lengths[i]).toBeGreaterThan(track.lengths[i - 1]);
    }
  });

  it('按路程取点，越界时取端点', () => {
    expect(pointAt(track, 5).x).toBeCloseTo(5, 6);
    expect(pointAt(track, -3)).toEqual({ x: 0, y: 0 });
    const end = pointAt(track, 1e9);
    expect(end.x).toBeCloseTo(20, 6);
    expect(end.y).toBeCloseTo(10, 6);
  });
});

describe('projectInWindow', () => {
  const line: Segment[] = [{ kind: 'line', from: { x: 0, y: 0 }, to: { x: 100, y: 0 } }];
  const lineTrack = createTrack(line, 2);

  it('直线段上的投影', () => {
    const p = projectInWindow(lineTrack, { x: 30, y: 7 }, 0, 100);
    expect(p.s).toBeCloseTo(30, 6);
    expect(p.distance).toBeCloseTo(7, 6);
  });

  it('投影被限制在窗口内', () => {
    const p = projectInWindow(lineTrack, { x: 80, y: 0 }, 10, 40);
    expect(p.s).toBeCloseTo(40, 6);
    expect(p.distance).toBeCloseTo(40, 6);
    const q = projectInWindow(lineTrack, { x: -50, y: 0 }, 10, 40);
    expect(q.s).toBeCloseTo(10, 6);
  });

  it('圆弧段上的投影', () => {
    const arc: Segment[] = [{ kind: 'arc', center: { x: 0, y: 0 }, radius: 50, startAngle: 0, sweep: Math.PI }];
    const track = createTrack(arc, 2);
    // 角度 π/3 方向、半径 60 的点，应投影到弧长 50·π/3 处，距离 10
    const p = projectInWindow(track, { x: 60 * Math.cos(Math.PI / 3), y: 60 * Math.sin(Math.PI / 3) }, 0, track.total);
    // 投影在弦上进行，误差应远小于采样步长 2
    expect(Math.abs(p.s - (50 * Math.PI) / 3)).toBeLessThan(0.2);
    expect(Math.abs(p.distance - 10)).toBeLessThan(0.05);
  });

  it('环行小路：相邻圈同一角度的点不会被投影到相邻圈', () => {
    const center = { x: tuning.view.centerX, y: tuning.view.centerY };
    const lab = buildLabyrinth(tuning.maze, center);
    const track = createTrack(lab.segments, tuning.track.sampleStep);
    const { searchBack, searchForward } = tuning.walk;
    const [r0, r1] = lab.ringRadii;

    // 当前位置：最外圈中段
    const s = tuning.maze.entryLength + (r0 * (2 * Math.PI - tuning.maze.gapAngle)) / 2;
    const here = pointAt(track, s);
    const dir = { x: (here.x - center.x) / r0, y: (here.y - center.y) / r0 };
    // 正好落在第二圈中心线上的点
    const onRing1 = { x: center.x + dir.x * r1, y: center.y + dir.y * r1 };

    const p = projectInWindow(track, onRing1, s - searchBack, s + searchForward);
    expect(p.s).toBeCloseTo(s, 0);
    expect(p.distance).toBeCloseTo(tuning.maze.ringSpacing, 1);
    expect(distance(p.point, here)).toBeLessThan(1);
  });
});
