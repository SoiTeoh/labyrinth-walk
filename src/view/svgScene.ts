import type { Tuning } from '../config/tuning';
import { computeAtmosphere } from '../logic/atmosphere';
import { pathToD, slicePath, type Vec } from '../logic/geometry';
import type { Labyrinth } from '../logic/labyrinth';
import { pointAt, type Track } from '../logic/pathTrack';
import type { WalkMode } from '../logic/walker';
import { svgEl } from './svg';

export interface Scene {
  /** 调试视图挂在这一层，位于行者下方 */
  debugLayer: SVGGElement;
  render(
    s: number,
    walkerAt: Vec,
    mode: WalkMode,
    hintVisible?: boolean,
    progressRatio?: number,
  ): void;
}

export function createScene(
  svg: SVGSVGElement,
  lab: Labyrinth,
  track: Track,
  t: Tuning,
): Scene {
  const { width, height, walkerRadius, walkerHaloRadius, walkerTouchRadius, walkedWidthRatio } =
    t.view;
  const { pathWidth, centerRadius } = t.maze;

  svgEl('rect', { class: 'bg', x: 0, y: 0, width, height }, svg);

  // 随进度渐强的中心氛围光晕
  const centerAmbientGlow = svgEl(
    'circle',
    {
      class: 'center-ambience-glow',
      cx: lab.center.x,
      cy: lab.center.y,
      r: t.atmosphere.centerGlow.startRadius,
      opacity: t.atmosphere.centerGlow.startOpacity,
    },
    svg,
  );

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

  // 25%、50%、75% 里程碑光点
  const milestonesLayer = svgEl('g', { class: 'milestones-layer' }, svg);
  const milestoneEls = t.atmosphere.milestones.map((threshold) => {
    const pt = pointAt(track, threshold * track.total);
    const g = svgEl(
      'g',
      {
        class: 'milestone',
        transform: `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`,
        'data-reached': '0',
      },
      milestonesLayer,
    );
    svgEl('circle', { class: 'milestone-glow', r: 8 }, g);
    svgEl('circle', { class: 'milestone-dot', r: 2.5 }, g);
    return g;
  });

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
  let lastP = -1;

  return {
    debugLayer,
    render(s, walkerAt, mode, hintVisible = false, progressRatio) {
      if (s !== lastS) {
        walked.setAttribute('d', s > 0 ? pathToD(slicePath(lab.segments, s)) : '');
        lastS = s;
      }

      walker.setAttribute('transform', `translate(${walkerAt.x.toFixed(2)} ${walkerAt.y.toFixed(2)})`);
      svg.dataset.mode = mode;
      svg.dataset.hint = hintVisible ? '1' : '0';

      const pClamped = Math.max(
        0,
        Math.min(1, progressRatio ?? (track.total > 0 ? s / track.total : 0)),
      );

      // 每帧最多写一次 CSS 变量与氛围属性
      if (pClamped !== lastP) {
        const atm = computeAtmosphere(pClamped, t.atmosphere);
        svg.style.setProperty('--bg', atm.colors.bg);
        svg.style.setProperty('--path', atm.colors.path);
        svg.style.setProperty('--walked', atm.colors.walked);
        svg.style.setProperty('--goal', atm.colors.goal);

        centerAmbientGlow.setAttribute('r', atm.centerGlowRadius.toFixed(1));
        centerAmbientGlow.setAttribute('opacity', atm.centerGlowOpacity.toFixed(3));

        for (let i = 0; i < t.atmosphere.milestones.length; i++) {
          const threshold = t.atmosphere.milestones[i];
          const reached = pClamped >= threshold;
          milestoneEls[i].dataset.reached = reached ? '1' : '0';
        }

        lastP = pClamped;
      }
    },
  };
}
