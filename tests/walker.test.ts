import { describe, expect, it } from 'vitest';
import { tuning } from '../src/config/tuning';
import { distance, type Vec } from '../src/logic/geometry';
import { buildLabyrinth } from '../src/logic/labyrinth';
import { createTrack, pointAt } from '../src/logic/pathTrack';
import {
  createWalker,
  isCompleted,
  move,
  press,
  progress,
  release,
  resetWalker,
  walkerPosition,
  type WalkerState,
} from '../src/logic/walker';

const center = { x: tuning.view.centerX, y: tuning.view.centerY };
const lab = buildLabyrinth(tuning.maze, center);
const track = createTrack(lab.segments, tuning.track.sampleStep);
const t = tuning.walk;
const [r0, r1] = lab.ringRadii;

/** 最外圈中段的路程 */
const sMidRing0 = tuning.maze.entryLength + (r0 * (2 * Math.PI - tuning.maze.gapAngle)) / 2;

function walkingAt(s: number): WalkerState {
  return { mode: 'walking', s };
}

/** 把点沿圆心方向缩放到另一个半径 */
function toRadius(p: Vec, from: number, to: number): Vec {
  return { x: center.x + ((p.x - center.x) * to) / from, y: center.y + ((p.y - center.y) * to) / from };
}

describe('按下', () => {
  it('按在行者附近开始行走', () => {
    const s0 = createWalker();
    const start = walkerPosition(s0, track);
    expect(press(s0, track, start, t).mode).toBe('walking');
    expect(press(s0, track, { x: start.x + t.grabRadius - 1, y: start.y }, t).mode).toBe('walking');
  });

  it('按下点离行者超过 grabRadius 时不进入行走', () => {
    const s0 = createWalker();
    const start = walkerPosition(s0, track);
    expect(press(s0, track, { x: start.x + t.grabRadius + 1, y: start.y }, t)).toBe(s0);
  });

  it('不能直接按终点跳过路线', () => {
    const s0 = createWalker();
    const pressed = press(s0, track, lab.end, t);
    expect(pressed.mode).toBe('idle');
    expect(pressed.s).toBe(0);
  });

  it('空闲时移动没有效果', () => {
    const s0 = createWalker();
    expect(move(s0, track, pointAt(track, 20), t)).toBe(s0);
  });
});

describe('拖动', () => {
  it('沿小路带噪声拖动，从入口走到终点：进度单调不减，单步不超过上限，不偏离', () => {
    let state = press(createWalker(), track, lab.start, t);
    let prev = state.s;
    let i = 0;
    for (let s = 5; s < track.total; s += 5, i++) {
      const on = pointAt(track, s);
      const noisy = { x: on.x + 6 * Math.sin(i), y: on.y + 6 * Math.cos(i * 1.3) };
      state = move(state, track, noisy, t);
      expect(state.mode).toBe('walking');
      expect(state.s).toBeGreaterThanOrEqual(prev);
      expect(state.s - prev).toBeLessThanOrEqual(t.maxStepPerEvent + 1e-9);
      prev = state.s;
    }
    state = move(state, track, lab.end, t);
    expect(state.s).toBeCloseTo(track.total, 6);
    expect(progress(state, track)).toBeCloseTo(1, 6);
    // 到终点后继续拖动不会超过总长
    state = move(state, track, lab.end, t);
    expect(state.s).toBeLessThanOrEqual(track.total);
  });

  it('单次移动事件的前进量不超过 maxStepPerEvent', () => {
    const state = walkingAt(1000);
    const next = move(state, track, pointAt(track, 1000 + t.searchForward - 2), t);
    expect(next.s).toBeCloseTo(1000 + t.maxStepPerEvent, 6);
  });

  it('向后拖动不改变进度', () => {
    const state = walkingAt(1000);
    const back = move(state, track, pointAt(track, 995), t);
    expect(back.s).toBe(1000);
    expect(back.mode).toBe('walking');
    const farBack = move(state, track, pointAt(track, 800), t);
    expect(farBack.s).toBe(1000);
    expect(farBack.mode).toBe('off');
  });

  it('相邻圈同一角度的点：即使离相邻圈中心线很近，进度也不变', () => {
    const state = walkingAt(sMidRing0);
    const here = pointAt(track, sMidRing0);

    // 正好在第二圈中心线上：离当前圈 20 > 容错 18，判为偏离
    const onRing1 = move(state, track, toRadius(here, r0, r1), t);
    expect(onRing1.mode).toBe('off');
    expect(onRing1.s).toBe(sMidRing0);

    // 离第二圈中心线只有 3，但离当前圈 17：仍按当前圈投影，进度不跳
    const nearRing1 = move(state, track, toRadius(here, r0, r1 + 3), t);
    expect(nearRing1.mode).toBe('walking');
    expect(Math.abs(nearRing1.s - sMidRing0)).toBeLessThan(1);
  });

  it('从相邻圈"抄近路"不会让行者跳圈', () => {
    // 从入口拖到第一圈起点，再径向向内拖到第二圈终点附近（空间上很近，路程上相差一整圈）
    let state = press(createWalker(), track, lab.start, t);
    for (let s = 2; s <= tuning.maze.entryLength + 4; s += 2) state = move(state, track, pointAt(track, s), t);
    const sBefore = state.s;
    const here = pointAt(track, sBefore);
    for (let r = r0; r >= r1; r -= 2) {
      state = move(state, track, toRadius(here, r0, r), t);
    }
    expect(state.s - sBefore).toBeLessThan(1);
    expect(state.mode).toBe('off');
  });

  it('手指一次跳出搜索窗口时判为偏离，行者停在原地', () => {
    const state = walkingAt(1000);
    const next = move(state, track, pointAt(track, 1000 + t.searchForward + 60), t);
    expect(next.mode).toBe('off');
    expect(next.s).toBe(1000);
  });

  it('偏离后回到容错范围内继续行走', () => {
    let state = walkingAt(1000);
    const here = pointAt(track, 1000);
    state = move(state, track, { x: here.x + 40, y: here.y + 40 }, t);
    expect(state.mode).toBe('off');
    state = move(state, track, pointAt(track, 1010), t);
    expect(state.mode).toBe('walking');
    expect(state.s).toBeCloseTo(1010, 6);
  });
});

describe('终点吸附', () => {
  it('离终点不到 endSnap 时进度直接到 100%，更远时不吸附', () => {
    const near = move(walkingAt(track.total - 10), track, pointAt(track, track.total - t.endSnap / 2), t);
    expect(near.s).toBe(track.total);
    const far = move(walkingAt(track.total - 20), track, pointAt(track, track.total - t.endSnap - 1), t);
    expect(far.s).toBeCloseTo(track.total - t.endSnap - 1, 6);
  });
});

describe('抬起', () => {
  it('回到空闲并保留路程，之后可以在行者处重新按下', () => {
    const released = release(walkingAt(1234));
    expect(released).toEqual({ mode: 'idle', s: 1234 });
    const at = walkerPosition(released, track);
    expect(distance(at, pointAt(track, 1234))).toBe(0);
    expect(press(released, track, at, t).mode).toBe('walking');
    expect(press(released, track, lab.start, t).mode).toBe('idle');
  });
});

describe('完成与重开 (Task 6)', () => {
  it('到达终点后进入 completed 状态', () => {
    const nearEnd = walkingAt(track.total - 1);
    const completed = move(nearEnd, track, lab.end, t);
    expect(completed.mode).toBe('completed');
    expect(completed.s).toBe(track.total);
    expect(isCompleted(completed)).toBe(true);
  });

  it('completed 状态下不能继续移动或推进路程', () => {
    const completedState: WalkerState = { mode: 'completed', s: track.total };
    const moved = move(completedState, track, { x: lab.end.x + 20, y: lab.end.y }, t);
    expect(moved.mode).toBe('completed');
    expect(moved.s).toBe(track.total);
  });

  it('completed 状态下按下不触发行走', () => {
    const completedState: WalkerState = { mode: 'completed', s: track.total };
    const pressed = press(completedState, track, lab.end, t);
    expect(pressed.mode).toBe('completed');
  });

  it('completed 状态下抬起保持 completed', () => {
    const completedState: WalkerState = { mode: 'completed', s: track.total };
    const released = release(completedState);
    expect(released.mode).toBe('completed');
  });

  it('达到 99.5% 阈值时抬起直接吸附到中心并进入完成状态', () => {
    const stateAt997: WalkerState = { mode: 'walking', s: track.total * 0.996 };
    const released = release(stateAt997, track, 0.995);
    expect(released.mode).toBe('completed');
    expect(released.s).toBe(track.total);
  });

  it('resetWalker 重置为初始空闲状态', () => {
    const reset = resetWalker();
    expect(reset).toEqual({ mode: 'idle', s: 0 });
    expect(progress(reset, track)).toBe(0);
  });
});
