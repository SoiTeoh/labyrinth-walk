import type { Tuning } from '../config/tuning';
import { pathToD, slicePath, type Vec } from '../logic/geometry';
import type { Labyrinth } from '../logic/labyrinth';
import type { WalkMode } from '../logic/walker';
import { svgEl } from './svg';

export interface Scene {
  /** 调试视图挂在这一层，位于行者下方 */
  debugLayer: SVGGElement;
  render(s: number, walkerAt: Vec, mode: WalkMode, hintVisible?: boolean): void;
}

export function createScene(svg: SVGSVGElement, lab: Labyrinth, t: Tuning): Scene {
  const { width, height, walkerRadius, walkerHaloRadius, walkerTouchRadius, walkedWidthRatio } =
    t.view;
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
  // 呼吸脉冲光环（偏离超过 300ms 时激活）
  svgEl('circle', { class: 'walker-pulse', r: walkerTouchRadius }, walker);
  // 外围触摸指示圈（防止手指遮挡行者）
  svgEl('circle', { class: 'walker-touch', r: walkerTouchRadius }, walker);
  // 行者外圈
  svgEl('circle', { class: 'walker-halo', r: walkerHaloRadius }, walker);
  // 行者中心实心圆点
  svgEl('circle', { class: 'walker-dot', r: walkerRadius }, walker);

  let lastS = -1;
  return {
    debugLayer,
    render(s, walkerAt, mode, hintVisible = false) {
      if (s !== lastS) {
        walked.setAttribute('d', s > 0 ? pathToD(slicePath(lab.segments, s)) : '');
        lastS = s;
      }
      walker.setAttribute('transform', `translate(${walkerAt.x.toFixed(2)} ${walkerAt.y.toFixed(2)})`);
      svg.dataset.mode = mode;
      svg.dataset.hint = hintVisible ? '1' : '0';
    },
  };
}
