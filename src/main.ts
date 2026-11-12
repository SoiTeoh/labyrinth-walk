import './style.css';
import { tuning } from './config/tuning';
import { expandPointerEvent, toSvgPoint } from './input/pointer';
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
import { createDebugView } from './view/debugView';
import { createHud } from './view/hud';
import { createScene } from './view/svgScene';

const svg = document.querySelector<SVGSVGElement>('#stage');
if (!svg) throw new Error('缺少 #stage');

const lab = buildLabyrinth(tuning.maze, { x: tuning.view.centerX, y: tuning.view.centerY });
const track = createTrack(lab.segments, tuning.track.sampleStep);
const scene = createScene(svg, lab, tuning);
const hud = createHud(svg, tuning);
const debug = new URLSearchParams(location.search).get('debug') === '1'
  ? createDebugView(scene.debugLayer, { x: 12, y: tuning.view.height - 16 })
  : null;

let state: WalkerState = createWalker();
let activePointer: number | null = null;
let frameRequested = false;

function render(): void {
  frameRequested = false;
  scene.render(state.s, walkerPosition(state, track), state.mode);
  hud.render(progress(state, track));
}

function scheduleRender(): void {
  if (frameRequested) return;
  frameRequested = true;
  requestAnimationFrame(render);
}

svg.addEventListener('pointerdown', (e) => {
  if (activePointer !== null) return; // 只跟踪第一根手指
  const p = toSvgPoint(svg, e.clientX, e.clientY);
  if (!p) return;
  const next = press(state, track, p, tuning.walk);
  if (next === state) return; // 没有按在行者附近
  e.preventDefault();
  activePointer = e.pointerId;
  svg.setPointerCapture(e.pointerId);
  state = next;
  scheduleRender();
});

svg.addEventListener('pointermove', (e) => {
  if (debug) {
    const p = toSvgPoint(svg, e.clientX, e.clientY);
    if (p) {
      const { searchBack, searchForward, tolerance } = tuning.walk;
      const proj = projectInWindow(track, p, state.s - searchBack, state.s + searchForward);
      debug.render(p, proj, track.total, proj.distance <= tolerance);
    }
  }
  if (e.pointerId !== activePointer) return;
  for (const ev of expandPointerEvent(e)) {
    const p = toSvgPoint(svg, ev.clientX, ev.clientY);
    if (p) state = move(state, track, p, tuning.walk);
  }
  scheduleRender();
});

function endPointer(e: PointerEvent): void {
  if (e.pointerId !== activePointer) return;
  activePointer = null;
  state = release(state);
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
