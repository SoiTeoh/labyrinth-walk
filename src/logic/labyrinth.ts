import { pathLength, polar, segmentEnd, segmentStart, type Segment, type Vec } from './geometry';

export interface LabyrinthParams {
  rings: number;
  ringSpacing: number;
  centerRadius: number;
  gapAngle: number;
  startAngle: number;
  entryLength: number;
}

export interface Labyrinth {
  segments: Segment[];
  /** 各圈半径，下标 0 是最外圈 */
  ringRadii: number[];
  center: Vec;
  total: number;
  start: Vec;
  end: Vec;
}

/**
 * 生成一条不分岔的环行小路：
 * 入口直线 → 最外圈 → 径向转弯 → 下一圈（反向）→ … → 最内圈 → 直线进入中心。
 *
 * 每圈都覆盖同样的角度范围 [startAngle, startAngle + 2π − gapAngle]，
 * 所以 (startAngle − gapAngle, startAngle) 这段扇形里只有径向转弯线，没有圆弧，
 * 转弯线不会和任何圆弧交叉。
 */
export function buildLabyrinth(params: LabyrinthParams, center: Vec): Labyrinth {
  const { rings, ringSpacing, centerRadius, gapAngle, startAngle, entryLength } = params;
  if (!Number.isInteger(rings) || rings < 1) throw new Error('rings 必须是正整数');
  if (ringSpacing <= 0) throw new Error('ringSpacing 必须大于 0');
  if (centerRadius < 0) throw new Error('centerRadius 不能为负');
  if (gapAngle <= 0 || gapAngle >= Math.PI) throw new Error('gapAngle 必须在 (0, π) 内');
  if (entryLength < 0) throw new Error('entryLength 不能为负');

  const ringRadii = Array.from({ length: rings }, (_, i) => centerRadius + ringSpacing * (rings - i));
  const span = 2 * Math.PI - gapAngle;
  const segments: Segment[] = [];

  const outer = ringRadii[0];
  if (entryLength > 0) {
    segments.push({
      kind: 'line',
      from: polar(center, outer + entryLength, startAngle),
      to: polar(center, outer, startAngle),
    });
  }

  let angle = startAngle;
  for (let i = 0; i < rings; i++) {
    const radius = ringRadii[i];
    const direction = i % 2 === 0 ? 1 : -1;
    segments.push({ kind: 'arc', center, radius, startAngle: angle, sweep: direction * span });
    angle += direction * span;

    const isLast = i === rings - 1;
    segments.push({
      kind: 'line',
      from: polar(center, radius, angle),
      to: isLast ? { ...center } : polar(center, ringRadii[i + 1], angle),
    });
  }

  return {
    segments,
    ringRadii,
    center,
    total: pathLength(segments),
    start: segmentStart(segments[0]),
    end: segmentEnd(segments[segments.length - 1]),
  };
}
