import type { Tuning } from '../config/tuning';
import { svgEl } from './svg';

export interface Hud {
  /** p 是 0 到 1 的进度 */
  render(p: number): void;
}

export function createHud(svg: SVGSVGElement, t: Tuning): Hud {
  const { width, height, progressBarWidth, progressBarY } = t.view;
  const cx = width / 2;
  const barX = cx - progressBarWidth / 2;

  svgEl('text', { class: 'hud-title', x: cx, y: 44, 'text-anchor': 'middle' }, svg).textContent =
    '沿小路走到中心';

  const percent = svgEl('text', { class: 'hud-percent', x: cx, y: 74, 'text-anchor': 'middle' }, svg);
  svgEl('rect', {
    class: 'hud-bar-track',
    x: barX,
    y: progressBarY,
    width: progressBarWidth,
    height: 4,
    rx: 2,
  }, svg);
  const fill = svgEl('rect', {
    class: 'hud-bar-fill',
    x: barX,
    y: progressBarY,
    width: 0,
    height: 4,
    rx: 2,
  }, svg);

  svgEl('text', { class: 'hud-help', x: cx, y: height - 52, 'text-anchor': 'middle' }, svg).textContent =
    '按住入口的圆点，沿小路拖动';

  let lastShown = -1;
  return {
    render(p) {
      const clamped = Math.min(Math.max(p, 0), 1);
      // 向下取整：只有真正走到终点才显示 100%
      const shown = Math.floor(clamped * 100);
      if (shown !== lastShown) {
        percent.textContent = `${shown}%`;
        lastShown = shown;
      }
      fill.setAttribute('width', (progressBarWidth * clamped).toFixed(2));
    },
  };
}
