# labyrinth-walk

一个竖屏网页小游戏：用手指或鼠标带着小小的行者，沿一条不分岔的盘绕小路，从入口慢慢走到中心。

这不是找出口的迷宫，整条路只有一条，不会走错岔路。本作品是休闲互动小游戏。

> 状态：**Prototype Complete — Pending Playtest**
> - Task 1–7 已完成；Task 8A 自动化验证已完成（完整调试视图、URL 安全调参、无障碍与质量检查）。
> - Task 8B 真人试玩与真机验收尚未完成，暂时不部署，不添加新功能。
> 真机调参见 `TODO.md`。

## 操作

1. 按住入口处的白色圆点（行者）。在别处按下没有反应，不能直接点终点跳过。
2. 沿小路拖动，行者跟着手指前进，顶部显示进度百分比和进度条。
3. 只能向前走：往回拖不会后退。
4. 手指离开小路太远（默认超过 18 个单位），或想"抄近路"跳到相邻一圈时，行者停在原地。若偏离持续超过 300ms，行者显示呼吸光环并在 HUD 提示"回到小路上继续"；移回小路后提示即刻消失。
5. 松开手指后进度保留，再按住行者就能接着走。
6. 沿小路走到中心后触发完成结算，显示"你走到了中心"与本次用时，提供"再走一次"按钮重开。在行走途中点击右上角"重开"，进度超过 10% 时会提示确认。
7. 随着向中心靠近，背景从深蓝灰自然过渡到温暖晨光，中心光晕逐渐变亮，在 25%、50%、75% 处会依次点亮里程碑微光。

电脑上用鼠标按住拖动，操作相同。

## 本地运行

需要 Node 20.19+（开发时使用 Node 24）。

```bash
npm install
npm run dev            # 打开终端显示的地址，默认 http://localhost:5173
npm run dev -- --host  # 手机与电脑连同一 Wi-Fi，用电脑局域网 IP 加端口访问
```

Windows PowerShell 如果提示"禁止运行脚本"（`npm.ps1` 被执行策略拦截），改用 `npm.cmd`，例如 `npm.cmd run dev`。

## 测试与构建

```bash
npm run typecheck  # TypeScript 类型检查
npm test           # Vitest 单元测试（单次运行）
npm run test:watch # 监听模式
npm run build      # 类型检查 + 生产构建，输出到 dist/
npm run preview    # 本地预览 dist/
```

调试视图与安全调参：
- `?debug=1`：开启调试层，在画面上实时绘制局部搜索窗口高亮、抓取半径圈、路径容错范围圈、触摸点与投影点连线，并在左下角显示行走状态、进度、`s/total`、坐标及距离 `d`。
- URL 安全调参：支持通过查询参数临时覆盖 `tolerance`（6–60）、`grabRadius`（10–120）与 `rings`（整数 1–7），例如 `?tolerance=30&grabRadius=60&rings=5`。非法类型或越界参数会自动回退默认值。

## 代码结构

- `src/config/tuning.ts`：全部可调参数（圈数、路宽、容错、搜索窗口等）
- `src/config/tuningQuery.ts`：URL 查询参数安全解析与范围校验（`debug`、`tolerance`、`grabRadius`、`rings`）
- `src/logic/`：纯逻辑，不依赖 DOM
  - `geometry.ts`：线段、圆弧、长度、取点、生成 SVG `d`
  - `labyrinth.ts`：根据参数生成环行小路
  - `pathTrack.ts`：路径采样与窗口内投影
  - `walker.ts`：行走状态机（空闲 / 行走中 / 偏离 / 完成）
  - `deviationController.ts`：偏离判定、300ms 延迟提示与振动调度
  - `duration.ts`：用时格式化
  - `atmosphere.ts`：视觉氛围计算、单调颜色插值与光晕映射
- `src/view/`：SVG 场景、进度 HUD、完成结算层、调试视图
- `src/input/pointer.ts`：屏幕坐标到 SVG 坐标的换算
- `tests/`：Vitest 单元测试

## 文档

- `PROJECT_PLAN.md`：设计与技术方案
- `TODO.md`：任务进度与试玩记录
