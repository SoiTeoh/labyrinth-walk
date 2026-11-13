import type { Tuning } from '../config/tuning';
import { svgEl } from './svg';

export interface Hud {
  /** p 是 0 到 1 的进度 */
  render(p: number): void;
  /** 设置偏离提示是否显示 */
  setHint(visible: boolean, text?: string): void;
}

export function createHud(
  svg: SVGSVGElement,
  t: Tuning,
  onResetRequest?: () => void,
): Hud {
  const { width, height, progressBarWidth, progressBarY } = t.view;
  const cx = width / 2;
  const barX = cx - progressBarWidth / 2;

  svgEl('text', { class: 'hud-title', x: cx, y: 44, 'text-anchor': 'middle' }, svg).textContent =
    '沿小路走到中心';

  // 主动重开按钮（含足够触控热区）
  if (onResetRequest) {
    const resetGroup = svgEl(
      'g',
      {
        class: 'hud-reset',
        role: 'button',
        tabindex: '0',
        'aria-label': '重新开始',
      },
      svg,
    );
    svgEl(
      'rect',
      {
        class: 'hud-reset-hit',
        x: width - 68,
        y: 20,
        width: 60,
        height: 40,
        rx: 8,
      },
      resetGroup,
    );
    const resetLabel = svgEl(
      'text',
      {
        class: 'hud-reset-label',
        x: width - 16,
        y: 44,
        'text-anchor': 'end',
      },
      resetGroup,
    );
    resetLabel.textContent = '重开';

    const triggerReset = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      onResetRequest();
    };

    resetGroup.addEventListener('click', triggerReset);
    resetGroup.addEventListener('pointerdown', (e) => e.stopPropagation());
    resetGroup.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        triggerReset(e);
      }
    });
  }

  const percent = svgEl('text', { class: 'hud-percent', x: cx, y: 74, 'text-anchor': 'middle' }, svg);
  svgEl(
    'rect',
    {
      class: 'hud-bar-track',
      x: barX,
      y: progressBarY,
      width: progressBarWidth,
      height: 4,
      rx: 2,
    },
    svg,
  );
  const fill = svgEl(
    'rect',
    {
      class: 'hud-bar-fill',
      x: barX,
      y: progressBarY,
      width: 0,
      height: 4,
      rx: 2,
    },
    svg,
  );

  const helpText = svgEl(
    'text',
    { class: 'hud-help', x: cx, y: height - 52, 'text-anchor': 'middle' },
    svg,
  );
  helpText.textContent = '按住入口的圆点，沿小路拖动';

  const hintText = svgEl(
    'text',
    { class: 'hud-hint', x: cx, y: height - 52, 'text-anchor': 'middle' },
    svg,
  );
  hintText.textContent = t.hint.message;

  let lastShown = -1;
  let isHintActive = false;

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

      // 若没有偏离提示，根据行走状态显示引导
      if (!isHintActive) {
        if (shown > 0) {
          helpText.classList.add('hud-help-fade');
        } else {
          helpText.classList.remove('hud-help-fade');
        }
      }
    },
    setHint(visible, text) {
      isHintActive = visible;
      if (text) {
        hintText.textContent = text;
      }
      if (visible) {
        hintText.classList.add('visible');
        helpText.classList.add('hidden');
      } else {
        hintText.classList.remove('visible');
        helpText.classList.remove('hidden');
      }
    },
  };
}
