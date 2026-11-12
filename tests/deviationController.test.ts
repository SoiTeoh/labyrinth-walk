import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDeviationController } from '../src/logic/deviationController';

describe('createDeviationController (偏离反馈控制器)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('偏离少于 300ms 时不显示提示，也不振动', () => {
    const onHintShow = vi.fn();
    const onVibrate = vi.fn();
    const ctrl = createDeviationController({ onHintShow, onVibrate });

    ctrl.update('off');
    vi.advanceTimersByTime(290);

    expect(ctrl.isHintVisible()).toBe(false);
    expect(onHintShow).not.toHaveBeenCalled();
    expect(onVibrate).not.toHaveBeenCalled();
  });

  it('偏离超过 300ms 进入提示状态并触发振动', () => {
    const onHintShow = vi.fn();
    const onVibrate = vi.fn();
    const ctrl = createDeviationController({ onHintShow, onVibrate });

    ctrl.update('off');
    vi.advanceTimersByTime(300);

    expect(ctrl.isHintVisible()).toBe(true);
    expect(onHintShow).toHaveBeenCalledTimes(1);
    expect(onVibrate).toHaveBeenCalledTimes(1);
  });

  it('在 300ms 到达前回正为 walking，提示不触发且定时器取消', () => {
    const onHintShow = vi.fn();
    const onHintHide = vi.fn();
    const ctrl = createDeviationController({ onHintShow, onHintHide });

    ctrl.update('off');
    vi.advanceTimersByTime(200);
    ctrl.update('walking');

    // 再流逝 200ms，总计 400ms，但已被取消
    vi.advanceTimersByTime(200);

    expect(ctrl.isHintVisible()).toBe(false);
    expect(onHintShow).not.toHaveBeenCalled();
    expect(onHintHide).not.toHaveBeenCalled();
  });

  it('提示显示后，一旦切回 walking 立即退出提示状态并触发 onHintHide', () => {
    const onHintShow = vi.fn();
    const onHintHide = vi.fn();
    const ctrl = createDeviationController({ onHintShow, onHintHide });

    ctrl.update('off');
    vi.advanceTimersByTime(300);
    expect(ctrl.isHintVisible()).toBe(true);

    ctrl.update('walking');
    expect(ctrl.isHintVisible()).toBe(false);
    expect(onHintHide).toHaveBeenCalledTimes(1);
  });

  it('提示显示后，切为 idle（抬手）立即退出提示状态', () => {
    const onHintHide = vi.fn();
    const ctrl = createDeviationController({ onHintHide });

    ctrl.update('off');
    vi.advanceTimersByTime(300);
    expect(ctrl.isHintVisible()).toBe(true);

    ctrl.update('idle');
    expect(ctrl.isHintVisible()).toBe(false);
    expect(onHintHide).toHaveBeenCalledTimes(1);
  });

  it('reset() 清空定时器与显示状态', () => {
    const onHintHide = vi.fn();
    const ctrl = createDeviationController({ onHintHide });

    ctrl.update('off');
    vi.advanceTimersByTime(300);
    expect(ctrl.isHintVisible()).toBe(true);

    ctrl.reset();
    expect(ctrl.isHintVisible()).toBe(false);
    expect(onHintHide).toHaveBeenCalledTimes(1);

    // 再次流逝时间不发生任何变化
    vi.advanceTimersByTime(500);
    expect(ctrl.isHintVisible()).toBe(false);
  });
});
