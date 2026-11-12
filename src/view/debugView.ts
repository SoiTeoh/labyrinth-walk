import type { Vec } from '../logic/geometry';
import type { Projection } from '../logic/pathTrack';
import { svgEl } from './svg';

/** ?debug=1 时显示：指针位置、窗口内投影点、两者连线、距离和路程。 */
export interface DebugView {
  render(pointer: Vec, proj: Projection, total: number, withinTolerance: boolean): void;
}

export function createDebugView(layer: SVGGElement, textAt: Vec): DebugView {
  const line = svgEl('line', { class: 'debug-line' }, layer);
  const dot = svgEl('circle', { class: 'debug-proj', r: 3 }, layer);
  const text = svgEl('text', { class: 'debug-text', x: textAt.x, y: textAt.y }, layer);

  return {
    render(pointer, proj, total, withinTolerance) {
      line.setAttribute('x1', pointer.x.toFixed(1));
      line.setAttribute('y1', pointer.y.toFixed(1));
      line.setAttribute('x2', proj.point.x.toFixed(1));
      line.setAttribute('y2', proj.point.y.toFixed(1));
      dot.setAttribute('cx', proj.point.x.toFixed(1));
      dot.setAttribute('cy', proj.point.y.toFixed(1));
      layer.dataset.ok = withinTolerance ? '1' : '0';
      text.textContent = `d=${proj.distance.toFixed(1)}  s=${proj.s.toFixed(0)}/${total.toFixed(0)}`;
    },
  };
}
