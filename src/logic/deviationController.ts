import type { WalkMode } from './walker';

export interface DeviationControllerOptions {
  /** 偏离多久后显示提示（毫秒），默认 300ms */
  delayMs?: number;
  /** 提示显示时的回调 */
  onHintShow?: () => void;
  /** 提示隐藏时的回调 */
  onHintHide?: () => void;
  /** 触发轻微振动的回调 */
  onVibrate?: () => void;
}

export interface DeviationController {
  update(mode: WalkMode): void;
  reset(): void;
  isHintVisible(): boolean;
}

/**
 * 偏离路径控制器。
 * 偏离持续超过 delayMs（默认 300ms）后进入提示状态；回到路径或抬起时立即退出。
 */
export function createDeviationController(
  options: DeviationControllerOptions = {},
): DeviationController {
  const delayMs = options.delayMs ?? 300;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let hintVisible = false;

  function update(mode: WalkMode): void {
    if (mode === 'off') {
      if (!hintVisible && timer === null) {
        timer = setTimeout(() => {
          timer = null;
          hintVisible = true;
          options.onHintShow?.();
          options.onVibrate?.();
        }, delayMs);
      }
    } else {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (hintVisible) {
        hintVisible = false;
        options.onHintHide?.();
      }
    }
  }

  function reset(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (hintVisible) {
      hintVisible = false;
      options.onHintHide?.();
    }
  }

  return {
    update,
    reset,
    isHintVisible: () => hintVisible,
  };
}
