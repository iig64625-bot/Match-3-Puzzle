# RuneMind Web

浏览器版 Match-3 演示工程。游戏逻辑移植自 `Assets/Scripts/Gameplay`（C#），表现层为 TypeScript + Canvas。

---

## 快速启动

```powershell
cd "d:\Screw Puzzle\web"
npm install
npm run dev
```

浏览器打开 http://localhost:5173

> Windows PowerShell 若 `npm` 被策略拦截，使用 `npm.cmd`。

```powershell
npm test          # 核心逻辑单元测试（Vitest）
npm run build     # 生产构建
```

---

## 操作

| 操作 | 说明 |
|------|------|
| 点击两格 | 交换相邻符文（必须能形成三连） |
| Hint | 高亮当前最佳一步 |
| Auto | 自动执行一步最优交换（非连续挂机） |
| Restart | 重新开始 |

---

## 项目结构

```
web/
├── index.html
├── src/
│   ├── core/              # 游戏逻辑（无 DOM 依赖）
│   │   ├── board.ts
│   │   ├── matcher.ts
│   │   ├── eliminator.ts
│   │   ├── game.ts
│   │   ├── levelProgression.ts
│   │   ├── highScoreStore.ts
│   │   └── moveFinder.ts
│   └── view/              # Canvas 渲染与交互
│       ├── app.ts
│       ├── boardView.ts
│       ├── boardLayout.ts
│       └── assetLoader.ts
└── public/assets/
    └── special/           # 炸弹/冰块 AI 贴图（始终加载）
        ├── bomb.png
        └── ice.png
```

---

## AI 在本 Web 工程中的分工

> 本节说明：开发者如何把 Cursor AI 用在**真实前端工程**里，而不是只做代码补全。

### 开发者（我）的定位

- **产品经理**：决定做 Web 演示、放弃 Unity 包袱
- **架构师**：规定 `core/` 与 `view/` 职责边界
- **验收者**：玩一局、截图、指出「冰块不能三连」「Auto 没反应」「炸弹偏小」
- **发布者**：确认 `npm run build` 通过后才算完成

### AI 的定位：Web 副工程师

| 任务 | AI 具体做了什么 |
|------|----------------|
| 逻辑移植 | C# → TS，保持 `trySwap` / `processTurn` / 连锁消除语义一致 |
| 动态布局 | `computeBoardLayout(columns, rows)` 随关卡棋盘尺寸重算格子和棋子矩形 |
| 交互层 | `app.ts` 点击选格、交换、HUD（关卡/目标分/排行榜）、窗口 resize |
| 特殊元素渲染 | `assetLoader` 加载 AI 贴图；`drawPieceImage` 裁透明边 + 统一 `PIECE_VISUAL_FILL` |
| 寻路修复 | `MoveFinder` 增加 `canSwap` 过滤，修复 Auto 对冰块给出非法步的问题 |
| 工程清理 | 删除 Unity 目录后同步更新文档与构建配置 |

### 三次典型的「人机协作」案例

**案例 1：从 Unity 方案 pivot 到 Web**

- 我：「不做 Unity 了，要浏览器能演示。」
- AI：保留 C# 逻辑层，新建 Vite 工程，用 Canvas 程序化 UI 搭棋盘。
- 结果：当天可 `npm run dev` 点玩，无需引擎导入资源。

**案例 2：布局反复微调**

- 我：连续给出「往右移」「格子更紧」「棋盘更大」等视觉反馈。
- AI：只改 `boardLayout.ts` 中 `BASE_SPACING`、`GRID_FILL_RATIO`、`MAX_CELL_SIZE` 等常量，不重写渲染管线。
- 结果：迭代快、diff 小、方便 code review。

**案例 3：AI 生成道具图并解决尺寸问题**

- 我：「炸弹和冰块不要用字母，用 AI 出图，大小要和符文一致。」
- AI：生图 → 绿幕抠图 → 接入 `public/assets/special/`；发现贴图因透明留白显小，增加 `computeOpaqueBounds` 裁剪。
- 结果：道具与程序绘制符文视觉直径对齐。

### 我如何控制 AI 产出质量

```text
✓ 每次需求带上下文文件（@boardView.ts @game.ts）
✓ 要求改动后执行 npm run build
✓ 拒绝无关重构（「只改尺寸，不要动消除逻辑」）
✓ 用截图描述 bug，而不是笼统说「有问题」
✓ 大任务拆阶段：core 移植 → UI → 扩展玩法 → 美术 → 清理
```

---

## 美术资源（可选）

默认 **程序绘制** 彩色符文（`USE_CUSTOM_ART = false`）。

启用自定义贴图：在 `src/view/assetLoader.ts` 设 `USE_CUSTOM_ART = true`，并放置：

```
public/assets/
├── bg_main.png
├── board_frame.png
├── special/
│   ├── bomb.png          # 已内置 AI 生成版
│   └── ice.png
└── runes/
    ├── fire.png … shadow.png
```

`special/` 下的炸弹/冰块**始终加载**，不依赖 `USE_CUSTOM_ART`。

---

## 构建发布

```powershell
npm run build
npm run preview
```

输出在 `web/dist/`。

### GitHub Pages

push 到 `main` 后，Actions 会把 `web/dist` 推到 **`gh-pages` 分支**。

在 GitHub **Settings → Pages** 中：

- **Source**：Deploy from a branch  
- **Branch**：`gh-pages` · **`/ (root)`**

---

## 相关文档

- [../README.md](../README.md) — 项目总览与 AI 协作方法论（**面试向**）
- [../GAMEPLAY.md](../GAMEPLAY.md) — 玩法规则说明
