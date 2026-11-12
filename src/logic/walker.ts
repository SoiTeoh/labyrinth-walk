import { distance, type Vec } from './geometry';
import { pointAt, projectInWindow, type Track } from './pathTrack';

/**
 * 行走状态机（纯函数）。
 * - idle：没有按住行者
 * - walking：按住行者，手指在容错范围内
 * - off：按住行者，但手指离开了小路；行者停在原地
 * 完成状态会在 Task 6 加入。
 */
export type WalkMode = 'idle' | 'walking' | 'off';

export interface WalkerState {
  mode: WalkMode;
  /** 当前路程，只增不减 */
  s: number;
}

export interface WalkTuning {
  grabRadius: number;
  tolerance: number;
  searchBack: number;
  searchForward: number;
  maxStepPerEvent: number;
  endSnap: number;
}

export function createWalker(): WalkerState {
  return { mode: 'idle', s: 0 };
}

export function walkerPosition(state: WalkerState, track: Track): Vec {
  return pointAt(track, state.s);
}

/** 按下：只有按在行者附近才开始行走，按在别处（包括终点）没有反应。 */
export function press(state: WalkerState, track: Track, p: Vec, t: WalkTuning): WalkerState {
  if (state.mode !== 'idle') return state;
  if (distance(p, walkerPosition(state, track)) > t.grabRadius) return state;
  return { mode: 'walking', s: state.s };
}

/** 移动：把手指投影到当前位置附近的路程窗口里，只向前推进，单次推进有上限。 */
export function move(state: WalkerState, track: Track, p: Vec, t: WalkTuning): WalkerState {
  if (state.mode === 'idle') return state;
  const proj = projectInWindow(track, p, state.s - t.searchBack, state.s + t.searchForward);
  if (proj.distance > t.tolerance) {
    return state.mode === 'off' ? state : { mode: 'off', s: state.s };
  }
  const target = Math.min(proj.s, state.s + t.maxStepPerEvent, track.total);
  let s = Math.max(state.s, target);
  if (track.total - s <= t.endSnap) s = track.total;
  if (state.mode === 'walking' && s === state.s) return state;
  return { mode: 'walking', s };
}

/** 抬起：回到空闲，保留已走路程。 */
export function release(state: WalkerState): WalkerState {
  return state.mode === 'idle' ? state : { mode: 'idle', s: state.s };
}

export function progress(state: WalkerState, track: Track): number {
  return track.total > 0 ? state.s / track.total : 0;
}
