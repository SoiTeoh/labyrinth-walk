import { lerp, pointOnSegment, segmentLength, type Segment, type Vec } from './geometry';

/**
 * 把路径采样成折线。lengths[i] 是 points[i] 在原路径上的精确路程（按解析长度计算），
 * 所以投影得到的路程和 slicePath、进度显示使用同一套长度。
 */
export interface Track {
  points: Vec[];
  lengths: number[];
  total: number;
}

export interface Projection {
  /** 投影点的路程 */
  s: number;
  /** 输入点到投影点的距离 */
  distance: number;
  point: Vec;
}

export function createTrack(segments: readonly Segment[], step: number): Track {
  if (!(step > 0)) throw new Error('step 必须大于 0');
  if (segments.length === 0) throw new Error('路径为空');
  const points: Vec[] = [];
  const lengths: number[] = [];
  let acc = 0;
  segments.forEach((seg, index) => {
    const len = segmentLength(seg);
    const n = Math.max(1, Math.ceil(len / step));
    for (let j = index === 0 ? 0 : 1; j <= n; j++) {
      const d = (len * j) / n;
      points.push(pointOnSegment(seg, d));
      lengths.push(acc + d);
    }
    acc += len;
  });
  return { points, lengths, total: acc };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

/** 返回满足 lengths[i] <= s 的最大 i，并保证 i 不超过倒数第二个点。 */
function pieceIndex(track: Track, s: number): number {
  const { lengths } = track;
  let lo = 0;
  let hi = lengths.length - 2;
  if (hi <= 0) return 0;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lengths[mid] <= s) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function pointAt(track: Track, s: number): Vec {
  const { points, lengths } = track;
  if (points.length === 1) return points[0];
  const clamped = clamp(s, 0, track.total);
  const i = pieceIndex(track, clamped);
  const span = lengths[i + 1] - lengths[i];
  const t = span > 0 ? (clamped - lengths[i]) / span : 0;
  return lerp(points[i], points[i + 1], clamp(t, 0, 1));
}

/**
 * 只在路程区间 [sFrom, sTo] 内寻找离 p 最近的点。
 * 这是防止跳圈的关键：相邻圈在空间上很近，但在路程上相差一整圈，不会落进窗口。
 */
export function projectInWindow(track: Track, p: Vec, sFrom: number, sTo: number): Projection {
  const { points, lengths } = track;
  const from = clamp(Math.min(sFrom, sTo), 0, track.total);
  const to = clamp(Math.max(sFrom, sTo), 0, track.total);

  let best: Projection | null = null;
  for (let i = pieceIndex(track, from); i < points.length - 1; i++) {
    const la = lengths[i];
    const lb = lengths[i + 1];
    if (la > to) break;
    const span = lb - la;
    if (span <= 0) continue;

    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const chord2 = dx * dx + dy * dy;
    const t = chord2 > 0 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / chord2 : 0;
    const s = clamp(la + t * span, Math.max(la, from), Math.min(lb, to));
    const point = lerp(a, b, (s - la) / span);
    const d = Math.hypot(p.x - point.x, p.y - point.y);
    if (best === null || d < best.distance) best = { s, distance: d, point };
  }

  if (best === null) {
    const point = pointAt(track, from);
    return { s: from, distance: Math.hypot(p.x - point.x, p.y - point.y), point };
  }
  return best;
}
