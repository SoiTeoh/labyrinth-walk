/**
 * 全部可调参数。单位是 SVG 单位（viewBox 宽 360，在手机上约等于 CSS 像素）。
 * 默认值的来由见 PROJECT_PLAN.md 第 9 节。
 */
export const tuning = {
  view: {
    width: 360,
    height: 640,
    /** 小路圆心 */
    centerX: 180,
    centerY: 330,
    /** 行者圆点半径 */
    walkerRadius: 9,
    /** 行者外圈半径 */
    walkerHaloRadius: 15,
    /** 行者外围触摸指示圈半径（大于常见手指遮挡范围） */
    walkerTouchRadius: 26,
    /** 已走高亮线宽占路宽的比例 */
    walkedWidthRatio: 0.55,
    /** 顶部进度条 */
    progressBarWidth: 240,
    progressBarY: 86,
  },
  maze: {
    /** 圈数，决定总路程 */
    rings: 7,
    /** 相邻圈中心线间距 */
    ringSpacing: 20,
    /** 路宽（描边宽度） */
    pathWidth: 14,
    /** 中心区域半径 */
    centerRadius: 24,
    /**
     * 每圈留出的转弯口角度（弧度）。
     * 0.45 能让最内圈转弯处两条路之间仍有约 5 个单位的空隙；
     * 0.35 时最内圈两条路几乎贴在一起。
     */
    gapAngle: 0.45,
    /** 入口角度：π/2 是正下方（SVG 的 y 轴向下） */
    startAngle: Math.PI / 2,
    /** 入口直线段长度（从最外圈向外延伸） */
    entryLength: 36,
  },
  track: {
    /** 采样步长，影响投影精度和计算量 */
    sampleStep: 2,
  },
  walk: {
    /** 按下点离行者多近才算抓住 */
    grabRadius: 32,
    /** 手指离小路中心线多远算偏离 */
    tolerance: 18,
    /** 投影搜索窗口：当前路程往回 */
    searchBack: 10,
    /** 投影搜索窗口：当前路程往前 */
    searchForward: 40,
    /** 单次移动事件的最大前进量 */
    maxStepPerEvent: 30,
    /** 离终点不到这个距离时直接吸附到终点，避免手指差一点点而停在 99% */
    endSnap: 2,
    /** 完成判定的进度阈值 */
    completeThreshold: 0.995,
  },
  hint: {
    /** 偏离多少毫秒后触发提示 */
    delayMs: 300,
    /** 偏离提示文案 */
    message: '回到小路上继续',
  },
  complete: {
    title: '你走到了中心',
    buttonText: '再走一次',
  },
  atmosphere: {
    /** 0% 与 100% 视觉氛围停靠点（各通道单调过渡） */
    stops: {
      0: {
        bg: '#1d2430',
        path: '#8d96a6',
        walked: '#f0c27a',
        goal: '#3a4558',
      },
      1: {
        bg: '#44302c',
        path: '#a89f92',
        walked: '#ffd18b',
        goal: '#70483c',
      },
    },
    /** 中心渐强光晕半径与不透明度 */
    centerGlow: {
      startRadius: 24,
      endRadius: 44,
      startOpacity: 0.08,
      endOpacity: 0.48,
    },
    /** 里程碑阈值位置 */
    milestones: [0.25, 0.5, 0.75] as const,
  },
} as const;

type DeepWiden<T> = T extends number
  ? number
  : T extends readonly (infer U)[]
    ? readonly DeepWiden<U>[]
    : T extends object
      ? { [K in keyof T]: DeepWiden<T[K]> }
      : T;

export type RuntimeTuning = DeepWiden<typeof tuning>;
export type Tuning = RuntimeTuning;
