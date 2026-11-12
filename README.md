# labyrinth-walk

一个竖屏网页小游戏：用手指或鼠标带着小小的行者，沿一条不分岔的盘绕小路，从入口慢慢走到中心。

这不是找出口的迷宫，整条路只有一条，不会走错岔路。本作品是休闲互动小游戏。

> 状态：原型阶段。已完成 PROJECT_PLAN.md 的 Task 1–4（小路生成、窗口投影、拖动行走、进度显示）。
> 偏离提示、完成界面、重开、氛围变化尚未实现，见 `TODO.md`。

## 操作

1. 按住入口处的白色圆点（行者）。在别处按下没有反应，不能直接点终点跳过。
2. 沿小路拖动，行者跟着手指前进，顶部显示进度百分比和进度条。
3. 只能向前走：往回拖不会后退。
4. 手指离开小路太远（默认超过 18 个单位），或想"抄近路"跳到相邻一圈时，行者停在原地并变暗。把手指移回行者附近的小路上即可继续。
5. 松开手指后进度保留，再按住行者就能接着走。

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

调试视图：地址后加 `?debug=1`，例如 `http://localhost:5173/?debug=1`。屏幕上会画出指针到"当前窗口内投影点"的连线，并在左下角显示距离 `d` 和路程 `s`。连线为蓝色表示在容错范围内，红色表示超出。

## 代码结构

- `src/config/tuning.ts`：全部可调参数（圈数、路宽、容错、搜索窗口等）
- `src/logic/`：纯逻辑，不依赖 DOM
  - `geometry.ts`：线段、圆弧、长度、取点、生成 SVG `d`
  - `labyrinth.ts`：根据参数生成环行小路
  - `pathTrack.ts`：路径采样与窗口内投影
  - `walker.ts`：行走状态机（空闲 / 行走中 / 偏离）
- `src/view/`：SVG 场景、进度 HUD、调试视图
- `src/input/pointer.ts`：屏幕坐标到 SVG 坐标的换算
- `tests/`：Vitest 单元测试

## 文档

- `PROJECT_PLAN.md`：设计与技术方案
- `TODO.md`：任务进度与试玩记录
