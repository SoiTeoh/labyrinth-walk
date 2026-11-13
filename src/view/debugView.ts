import type { Vec } from '../logic/geometry';
import { pointAt, type Projection, type Track } from '../logic/pathTrack';
import type { WalkMode } from '../logic/walker';
import { svgEl } from './svg';

export interface DebugViewState {
  mode: WalkMode;
  s: number;
  total: number;
  walker: Vec;
  pointer: Vec | null;
  proj: Projection | null;
  withinTolerance: boolean;
  grabRadius: number;
  tolerance: number;
  searchBack: number;
  searchForward: number;
  track: Track;
}

/** ?debug=1 时显示：状态、进度与路程、触摸/行者/投影点、偏离距离、抓取半径、容错范围与局部搜索窗口。 */
export interface DebugView {
  render(state: DebugViewState): void;
}

function buildWindowPath(track: Track, fromS: number, toS: number): string {
  const start = Math.max(0, fromS);
  const end = Math.min(track.total, toS);
  if (end <= start) return '';

  const step = 4;
  const parts: string[] = [];
  for (let pos = start; pos < end; pos += step) {
    const pt = pointAt(track, pos);
    parts.push(`${parts.length === 0 ? 'M' : 'L'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
  }
  const endPt = pointAt(track, end);
  parts.push(`L${endPt.x.toFixed(1)} ${endPt.y.toFixed(1)}`);
  return parts.join(' ');
}

export function createDebugView(
  layer: SVGGElement,
  view: { width: number; height: number },
): DebugView {
  const windowPath = svgEl('path', { class: 'debug-window' }, layer);
  const grabCircle = svgEl('circle', { class: 'debug-grab' }, layer);
  const toleranceCircle = svgEl('circle', { class: 'debug-tolerance' }, layer);
  const line = svgEl('line', { class: 'debug-line' }, layer);
  const pointerDot = svgEl('circle', { class: 'debug-pointer', r: 3.5 }, layer);
  const projDot = svgEl('circle', { class: 'debug-proj', r: 3.5 }, layer);
  const textLine1 = svgEl(
    'text',
    { class: 'debug-text', x: 10, y: view.height - 26 },
    layer,
  );
  const textLine2 = svgEl(
    'text',
    { class: 'debug-text', x: 10, y: view.height - 11 },
    layer,
  );

  return {
    render(state) {
      const {
        mode,
        s,
        total,
        walker,
        pointer,
        proj,
        withinTolerance,
        grabRadius,
        tolerance,
        searchBack,
        searchForward,
        track,
      } = state;

      const winStart = Math.max(0, s - searchBack);
      const winEnd = Math.min(total, s + searchForward);
      windowPath.setAttribute('d', buildWindowPath(track, winStart, winEnd));

      grabCircle.setAttribute('cx', walker.x.toFixed(1));
      grabCircle.setAttribute('cy', walker.y.toFixed(1));
      grabCircle.setAttribute('r', grabRadius.toFixed(1));

      if (pointer && proj) {
        line.style.display = '';
        pointerDot.style.display = '';
        projDot.style.display = '';
        toleranceCircle.style.display = '';

        line.setAttribute('x1', pointer.x.toFixed(1));
        line.setAttribute('y1', pointer.y.toFixed(1));
        line.setAttribute('x2', proj.point.x.toFixed(1));
        line.setAttribute('y2', proj.point.y.toFixed(1));

        pointerDot.setAttribute('cx', pointer.x.toFixed(1));
        pointerDot.setAttribute('cy', pointer.y.toFixed(1));

        projDot.setAttribute('cx', proj.point.x.toFixed(1));
        projDot.setAttribute('cy', proj.point.y.toFixed(1));

        toleranceCircle.setAttribute('cx', proj.point.x.toFixed(1));
        toleranceCircle.setAttribute('cy', proj.point.y.toFixed(1));
        toleranceCircle.setAttribute('r', tolerance.toFixed(1));

        layer.dataset.ok = withinTolerance ? '1' : '0';
      } else {
        line.style.display = 'none';
        pointerDot.style.display = 'none';
        projDot.style.display = 'none';
        toleranceCircle.style.display = 'none';
        layer.dataset.ok = '1';
      }

      const pct = total > 0 ? ((s / total) * 100).toFixed(1) : '0.0';
      const ptrStr = pointer
        ? `(${pointer.x.toFixed(0)},${pointer.y.toFixed(0)})`
        : 'none';
      const dStr = proj ? proj.distance.toFixed(1) : '-';

      textLine1.textContent =
        `mode=${mode} p=${pct}% s=${s.toFixed(0)}/${total.toFixed(0)} win=[${winStart.toFixed(0)},${winEnd.toFixed(0)}]`;
      textLine2.textContent =
        `w=(${walker.x.toFixed(0)},${walker.y.toFixed(0)}) ptr=${ptrStr} d=${dStr} grab=${grabRadius} tol=${tolerance}`;
    },
  };
}
