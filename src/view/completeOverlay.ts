import type { Tuning } from '../config/tuning';
import { svgEl } from './svg';

export interface CompleteOverlay {
  show(formattedTime: string): void;
  hide(): void;
  readonly element: SVGGElement;
}

/**
 * 到达中心后的结算遮罩与重开界面。
 */
export function createCompleteOverlay(
  svg: SVGSVGElement,
  t: Tuning,
  onRestart: () => void,
): CompleteOverlay {
  const { width, centerX, centerY } = t.view;
  const overlay = svgEl('g', { class: 'complete-overlay', 'aria-hidden': 'true' }, svg);

  // 中心光晕展开效果
  svgEl('circle', {
    class: 'complete-glow',
    cx: centerX,
    cy: centerY,
    r: t.maze.centerRadius,
  }, overlay);

  // 结算卡片背景
  const cardW = 260;
  const cardH = 176;
  const cardX = (width - cardW) / 2;
  const cardY = centerY - cardH / 2;

  svgEl('rect', {
    class: 'complete-card',
    x: cardX,
    y: cardY,
    width: cardW,
    height: cardH,
    rx: 16,
  }, overlay);

  // 标题
  const title = svgEl('text', {
    class: 'complete-title',
    x: width / 2,
    y: cardY + 48,
    'text-anchor': 'middle',
  }, overlay);
  title.textContent = t.complete.title;

  // 用时展示
  const timeLabel = svgEl('text', {
    class: 'complete-time',
    x: width / 2,
    y: cardY + 86,
    'text-anchor': 'middle',
  }, overlay);

  // “再走一次” 按钮
  const btnW = 140;
  const btnH = 40;
  const btnX = (width - btnW) / 2;
  const btnY = cardY + 110;

  const btnGroup = svgEl('g', {
    class: 'complete-btn',
    role: 'button',
    tabindex: '0',
    'aria-label': t.complete.buttonText,
  }, overlay);

  svgEl('rect', {
    class: 'complete-btn-bg',
    x: btnX,
    y: btnY,
    width: btnW,
    height: btnH,
    rx: 20,
  }, btnGroup);

  const btnText = svgEl('text', {
    class: 'complete-btn-text',
    x: width / 2,
    y: btnY + 25,
    'text-anchor': 'middle',
  }, btnGroup);
  btnText.textContent = t.complete.buttonText;

  function handleRestart(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    onRestart();
  }

  btnGroup.addEventListener('click', handleRestart);
  btnGroup.addEventListener('pointerdown', (e) => e.stopPropagation());
  btnGroup.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleRestart(e);
    }
  });

  return {
    element: overlay,
    show(formattedTime: string): void {
      timeLabel.textContent = `用时 ${formattedTime}`;
      overlay.setAttribute('aria-hidden', 'false');
      overlay.classList.add('visible');
    },
    hide(): void {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('visible');
    },
  };
}
