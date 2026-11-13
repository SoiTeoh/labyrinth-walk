import './style.css';
import { parseTuningFromSearch } from './config/tuningQuery';
import { expandPointerEvent, toSvgPoint } from './input/pointer';
import { createDeviationController } from './logic/deviationController';
import { formatDuration } from './logic/duration';
import type { Vec } from './logic/geometry';
import { buildLabyrinth } from './logic/labyrinth';
import { createTrack, projectInWindow } from './logic/pathTrack';
import {
  createWalker,
  move,
  press,
  progress,
  release,
  walkerPosition,
  type WalkerState,
} from './logic/walker';
import { createCompleteOverlay } from './view/completeOverlay';
import { createDebugView } from './view/debugView';
import { createHud } from './view/hud';
import { createScene } from './view/svgScene';

const svg = document.querySelector<SVGSVGElement>('#stage');
if (!svg) throw new Error('缺少 #stage');

const { tuning: runtimeTuning, debug: isDebug } = parseTuningFromSearch(location.search);

const lab = buildLabyrinth(runtimeTuning.maze, {
  x: runtimeTuning.view.centerX,
  y: runtimeTuning.view.centerY,
});
const track = createTrack(lab.segments, runtimeTuning.track.sampleStep);
const scene = createScene(svg, lab, track, runtimeTuning);

let state: WalkerState = createWalker();
let activePointer: number | null = null;
let lastPointer: Vec | null = null;
let frameRequested = false;
let startTime: number | null = null;
let endTime: number | null = null;

function restart(): void {
  state = createWalker();
  activePointer = null;
  lastPointer = null;
  startTime = null;
  endTime = null;
  deviationController.reset();
  hud.setHint(false);
  completeOverlay.hide();
  scheduleRender();
}

function handleResetRequest(): void {
  const p = progress(state, track);
  if (p > 0.10 && state.mode !== 'completed') {
    if (window.confirm('当前正在行走中，确定要重新开始吗？')) {
      restart();
    }
  } else {
    restart();
  }
}

const hud = createHud(svg, runtimeTuning, handleResetRequest);
const completeOverlay = createCompleteOverlay(svg, runtimeTuning, restart);

const deviationController = createDeviationController({
  delayMs: runtimeTuning.hint.delayMs,
  onHintShow: () => {
    hud.setHint(true, runtimeTuning.hint.message);
    scheduleRender();
  },
  onHintHide: () => {
    hud.setHint(false);
    scheduleRender();
  },
  onVibrate: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
  },
});

const debug = isDebug ? createDebugView(scene.debugLayer, runtimeTuning.view) : null;

function renderDebug(walkerPos: Vec): void {
  if (!debug) return;
  const { searchBack, searchForward, tolerance, grabRadius } = runtimeTuning.walk;
  const proj = lastPointer
    ? projectInWindow(track, lastPointer, state.s - searchBack, state.s + searchForward)
    : null;
  debug.render({
    mode: state.mode,
    s: state.s,
    total: track.total,
    walker: walkerPos,
    pointer: lastPointer,
    proj,
    withinTolerance: proj ? proj.distance <= tolerance : true,
    grabRadius,
    tolerance,
    searchBack,
    searchForward,
    track,
  });
}

function render(): void {
  frameRequested = false;
  const p = progress(state, track);
  const walkerPos = walkerPosition(state, track);
  scene.render(
    state.s,
    walkerPos,
    state.mode,
    deviationController.isHintVisible(),
    p,
  );
  hud.render(p);
  renderDebug(walkerPos);
}

function scheduleRender(): void {
  if (frameRequested) return;
  frameRequested = true;
  requestAnimationFrame(render);
}

function handleCompletion(): void {
  if (endTime === null) endTime = performance.now();
  deviationController.reset();
  hud.setHint(false);
  const elapsed = Math.max(0, endTime - (startTime ?? endTime));
  completeOverlay.show(formatDuration(elapsed));
}

svg.addEventListener('pointerdown', (e) => {
  if (state.mode === 'completed') return;
  if (activePointer !== null) return; // 只跟踪第一根手指
  const p = toSvgPoint(svg, e.clientX, e.clientY);
  if (!p) return;
  lastPointer = p;
  const next = press(state, track, p, runtimeTuning.walk);
  if (next === state) {
    if (debug) renderDebug(walkerPosition(state, track));
    return; // 没有按在行者附近
  }
  e.preventDefault();

  if (startTime === null) {
    startTime = performance.now();
  }

  activePointer = e.pointerId;
  svg.setPointerCapture(e.pointerId);
  state = next;

  // 处理 18~32 抓取体验：若按下点虽在抓取圈内但偏离路径容错，启动偏离计时
  const { searchBack, searchForward, tolerance } = runtimeTuning.walk;
  const proj = projectInWindow(track, p, state.s - searchBack, state.s + searchForward);
  if (proj.distance > tolerance) {
    deviationController.update('off');
  } else {
    deviationController.update('walking');
  }

  scheduleRender();
});

svg.addEventListener('pointermove', (e) => {
  if (debug) {
    const p = toSvgPoint(svg, e.clientX, e.clientY);
    if (p) {
      lastPointer = p;
      renderDebug(walkerPosition(state, track));
    }
  }
  if (e.pointerId !== activePointer) return;
  if (state.mode === 'completed') return;

  for (const ev of expandPointerEvent(e)) {
    const p = toSvgPoint(svg, ev.clientX, ev.clientY);
    if (p) {
      lastPointer = p;
      state = move(state, track, p, runtimeTuning.walk);
    }
  }

  if (state.mode === 'completed') {
    activePointer = null;
    try {
      svg.releasePointerCapture(e.pointerId);
    } catch {}
    handleCompletion();
  } else {
    deviationController.update(state.mode);
  }

  scheduleRender();
});

function endPointer(e: PointerEvent): void {
  if (e.pointerId !== activePointer) return;
  activePointer = null;

  if (state.mode !== 'completed') {
    state = release(state, track, runtimeTuning.walk.completeThreshold);
    if (state.mode === 'completed') {
      handleCompletion();
    } else {
      deviationController.update(state.mode);
    }
  }

  scheduleRender();
}

svg.addEventListener('pointerup', endPointer);
svg.addEventListener('pointercancel', endPointer);
svg.addEventListener('lostpointercapture', endPointer);

// 防误操作：长按菜单、iOS 双指缩放手势、残余的触摸滚动
svg.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

render();
