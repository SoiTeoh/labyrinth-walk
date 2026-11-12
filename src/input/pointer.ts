import type { Vec } from '../logic/geometry';

/**
 * 屏幕坐标 → SVG 坐标。每次调用都重新读取 getScreenCTM()，
 * 所以窗口缩放、屏幕旋转后依然准确。
 */
export function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): Vec | null {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

/** 取出一次 pointermove 中合并的所有中间点，让快速拖动时推进更平滑。 */
export function expandPointerEvent(e: PointerEvent): PointerEvent[] {
  if (typeof e.getCoalescedEvents === 'function') {
    const list = e.getCoalescedEvents();
    if (list.length > 0) return list;
  }
  return [e];
}
