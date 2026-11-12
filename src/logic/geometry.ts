/**
 * 二维几何：点、线段、圆弧。纯函数，不依赖 DOM。
 * 坐标系与 SVG 一致：x 向右，y 向下，角度 0 指向右侧，角度增大时在屏幕上顺时针转动。
 */

export interface Vec {
  x: number;
  y: number;
}

export interface LineSegment {
  kind: 'line';
  from: Vec;
  to: Vec;
}

export interface ArcSegment {
  kind: 'arc';
  center: Vec;
  radius: number;
  startAngle: number;
  /** 带符号的扫过角度（弧度）。正数为角度增大方向。绝对值必须小于 2π。 */
  sweep: number;
}

export type Segment = LineSegment | ArcSegment;

export function distance(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function lerp(a: Vec, b: Vec, t: number): Vec {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function polar(center: Vec, radius: number, angle: number): Vec {
  return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
}

export function segmentLength(seg: Segment): number {
  return seg.kind === 'line' ? distance(seg.from, seg.to) : Math.abs(seg.sweep) * seg.radius;
}

export function segmentStart(seg: Segment): Vec {
  return seg.kind === 'line' ? seg.from : polar(seg.center, seg.radius, seg.startAngle);
}

export function segmentEnd(seg: Segment): Vec {
  return seg.kind === 'line'
    ? seg.to
    : polar(seg.center, seg.radius, seg.startAngle + seg.sweep);
}

/** 沿线段走 d 个单位后的点；d 会被限制在 [0, 长度] 内。 */
export function pointOnSegment(seg: Segment, d: number): Vec {
  const len = segmentLength(seg);
  const clamped = Math.min(Math.max(d, 0), len);
  if (seg.kind === 'line') {
    return len === 0 ? seg.from : lerp(seg.from, seg.to, clamped / len);
  }
  const angle = seg.startAngle + Math.sign(seg.sweep) * (clamped / seg.radius);
  return polar(seg.center, seg.radius, angle);
}

export function pathLength(segments: readonly Segment[]): number {
  return segments.reduce((sum, seg) => sum + segmentLength(seg), 0);
}

/** 截取路径的前 length 个单位。 */
export function slicePath(segments: readonly Segment[], length: number): Segment[] {
  const result: Segment[] = [];
  let remaining = length;
  for (const seg of segments) {
    if (remaining <= 0) break;
    const len = segmentLength(seg);
    if (len <= remaining) {
      result.push(seg);
      remaining -= len;
      continue;
    }
    if (seg.kind === 'line') {
      result.push({ kind: 'line', from: seg.from, to: pointOnSegment(seg, remaining) });
    } else {
      result.push({ ...seg, sweep: Math.sign(seg.sweep) * (remaining / seg.radius) });
    }
    break;
  }
  return result;
}

function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
}

/** 把连续的段转换成 SVG path 的 d 字符串。 */
export function pathToD(segments: readonly Segment[]): string {
  if (segments.length === 0) return '';
  const first = segmentStart(segments[0]);
  const parts = [`M${fmt(first.x)} ${fmt(first.y)}`];
  for (const seg of segments) {
    const end = segmentEnd(seg);
    if (seg.kind === 'line') {
      parts.push(`L${fmt(end.x)} ${fmt(end.y)}`);
    } else {
      const largeArc = Math.abs(seg.sweep) > Math.PI ? 1 : 0;
      const sweepFlag = seg.sweep > 0 ? 1 : 0;
      const r = fmt(seg.radius);
      parts.push(`A${r} ${r} 0 ${largeArc} ${sweepFlag} ${fmt(end.x)} ${fmt(end.y)}`);
    }
  }
  return parts.join(' ');
}
