import type { Tuning } from '../config/tuning';
import { pathToD, slicePath, type Vec } from '../logic/geometry';
import type { Labyrinth } from '../logic/labyrinth';
import type { WalkMode } from '../logic/walker';
import { svgEl } from './svg';

export interface Scene {
  /** 调试视图挂在这一层，位于行者下方 */
  debugLayer: SVGGElement;
  render(s: number, walkerAt: Vec, mode: WalkMode): void;
}

export function createScene(svg: SVGSVGElement, lab: Labyrinth, t: Tuning): Scene {
  const { width, height, walkerRadius, walkerHaloRadius, walkedWidthRatio } = t.view;
  const { pathWidth, centerRadius } = t.maze;

  svgEl('rect', { class: 'bg', x: 0, y: 0, width, height }, svg);

  svgEl('circle', {
    class: 'goal',
    cx: lab.center.x,
    cy: lab.center.y,
    r: centerRadius,
  }, svg);

  svgEl('path', {
    class: 'path-base',
    d: pathToD(lab.segments),
    'stroke-width': pathWidth,
  }, svg);

  const walked = svgEl('path', {
    class: 'path-walked',
    d: '',
    'stroke-width': pathWidth * walkedWidthRatio,
  }, svg);

  svgEl('text', {
    class: 'label',
    x: lab.start.x,
    y: lab.start.y + 32,
    'text-anchor': 'middle',
  }, svg).textContent = '入口';

  const debugLayer = svgEl('g', { class: 'debug' }, svg);

  const walker = svgEl('g', { class: 'walker' }, svg);
  svgEl('circle', { class: 'walker-halo', r: walkerHaloRadius }, walker);
  svgEl('circle', { class: 'walker-dot', r: walkerRadius }, walker);

  let lastS = -1;
  return {
    debugLayer,
    render(s, walkerAt, mode) {
      if (s !== lastS) {
        walked.setAttribute('d', pathToD(slicePath(lab.segments, s)));
        lastS = s;
      }
      walker.setAttribute('transform', `translate(${walkerAt.x.toFixed(2)} ${walkerAt.y.toFixed(2)})`);
      svg.dataset.mode = mode;
    },
  };
}
