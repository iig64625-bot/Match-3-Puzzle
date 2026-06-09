# RuneMind AI — Match-3 益智游戏

基于 **C# 游戏逻辑 + TypeScript Canvas 前端** 的三消 Demo。先以控制台验证核心玩法，再快速落地可演示的 Web 版本。

| 模块 | 技术 | 说明 |
|------|------|------|
| 逻辑层 | C# .NET 8 | `Assets/Scripts/` — 棋盘、匹配、消除、关卡、排行榜 |
| 演示层 | Vite + TypeScript + Canvas | `web/` — 浏览器可玩、可部署 |
| AI 协作 | Cursor Agent | 跨语言移植、UI 迭代、资产生成、工程清理 |
| 质量门禁 | Vitest + GitHub Actions | 核心规则自动化测试，push 自动 build |

> **在线 Demo**（推送到 GitHub 并开启 Pages 后可用）：  
> `https://<你的用户名>.github.io/<仓库名>/`

---

## 快速启动

```powershell
# 控制台版
dotnet run --project Match3Console.csproj

# Web 版
cd web
npm install
npm run dev
# → http://localhost:5173

# 跑核心逻辑测试
cd web
npm test
```

### 部署到 GitHub Pages

1. 将仓库推到 GitHub（默认分支 `main` 或 `master`）
2. 打开 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**
3. push 后 `.github/workflows/deploy-pages.yml` 会自动构建并发布 `web/dist`
4. 访问 `https://<用户名>.github.io/<仓库名>/`

---

## 我在本项目中的 AI 协作方式

> 这份文档面向技术面试：展示的不是「会不会用 AI」，而是**能否把 AI 当成生产力工具，在真实工程里交付可运行结果**。

### 我的角色：AI 工程指挥官（Human-in-the-Loop）

我把 AI 当作**可对话的结对工程师**，而不是代写器。每个阶段都由我定目标、定边界、做验收；AI 负责快速实现、批量改动和探索方案。

| 我负责 | AI 负责 |
|--------|---------|
| 产品方向（放弃 Unity，转向 Web 可演示） | 按决策落地代码，避免在错误路径上深挖 |
| 架构边界（逻辑与表现分离、`core/` vs `view/`） | 保持目录与命名一致，减少后续维护成本 |
| 精确需求（布局参数、规则细节、验收标准） | 小步提交、可编译、可运行 |
| 代码审查与纠偏（冰块规则、Auto 死局、尺寸不一致） | 定位根因、给出最小修复 diff |
| 最终质量（`dotnet build` / `npm run build` 必须通过） | 修编译错误、处理环境差异（如 PowerShell 下 `npm.cmd`） |

### AI 在本 Web 工程里扮演的角色

在本项目中，Cursor AI 相当于一位**全栈副工程师**，具体承担：

1. **跨语言逻辑移植**  
   以 C# `Gameplay` 为单一事实来源，将 `Board`、`Matcher`、`Eliminator`、`Game`、`LevelProgression` 等模块逐文件移植到 `web/src/core/`，保证控制台与 Web 规则一致。

2. **Canvas 表现层搭建**  
   实现 `boardLayout.ts`（动态网格布局）、`boardView.ts`（渲染管线）、`app.ts`（交互与 HUD），把控制台坐标输入升级为点击交换 + Hint/Auto/Restart。

3. **需求驱动的 UI 迭代**  
   根据我的反馈连续调整：棋盘居中、格距、棋子缩放、关卡升级后棋盘动态 resize——每次只改相关常量或函数，控制 diff 范围。

4. **扩展玩法落地**  
   实现难度递进（元素种类 + 棋盘尺寸）、关卡目标分、炸弹 3×3 爆炸、冰块邻格碎裂、`localStorage` 排行榜——同步改 C# 与 TS 两侧。

5. **AI 资产生成与接入**  
   为炸弹/冰块生成游戏图标 → 绿幕抠图 → 透明 PNG → `assetLoader` 加载；并通过不透明区域裁剪 + `PIECE_VISUAL_FILL` 解决「道具比符文小一圈」的视觉问题。

6. **缺陷修复**  
   例如：`MoveFinder` 未排除冰块导致 Auto「看似执行、实际无效」；关卡切换后布局未刷新等——均由我描述现象，AI 追溯调用链后修复。

7. **工程瘦身**  
   在我确认放弃 Unity 后，删除 View/UI/Editor/Art 等冗余目录与文档，更新 `csproj` 与 README，保持仓库只保留可维护部分。

### 一次典型的 AI 协作闭环

```
我：描述目标 + 约束（要什么 / 不要什么 / 怎样算完成）
    ↓
AI：读现有代码 → 最小改动实现 → 本地 build 验证
    ↓
我：打开页面或跑控制台 → 截图/描述偏差
    ↓
AI：针对偏差做第二轮精确修改（而不是重写整文件）
    ↓
我：合并前检查 diff 范围、命名、是否有过度设计
```

这个闭环在本项目里重复了多轮，典型场景包括：布局微调、冰块规则澄清、炸弹/冰块贴图尺寸对齐、Auto 模式行为修正。

### 可向面试官展示的产出

| 产出 | 说明 |
|------|------|
| 双端可运行 | C# 控制台 + Web 浏览器，规则同源 |
| 完整玩法扩展 | 关卡递进、目标分、炸弹/冰块、排行榜 |
| 程序/UI 解耦 | `core` 无 DOM 依赖，可单测、可复用 |
| AI 美术管线 | 生成 → 抠图 → 裁剪 → Canvas 等比绘制 |
| 干净仓库 | 移除 Unity 遗留，文档与代码一致 |

### 我使用 AI 的方法论（面试可讲）

1. **先定边界再写代码** — 例如「逻辑在 `core/`，Canvas 只在 `view/`」，避免 AI 把渲染写进游戏规则。
2. **用验收标准代替模糊描述** — 「炸弹和普通符文视觉直径一致」比「画好看一点」更可执行。
3. **小步迭代，频繁可运行** — 每次改动后要求 build 通过，而不是累积一大坨再修。
4. **会纠偏** — AI 提议 Unity 时，我根据交付节奏切换到 Web；AI 不会替我做产品决策。
5. **会审查** — 对 AI 产出看 diff、看是否 over-engineering、看是否与现有命名风格一致。
6. **把 AI 当工具链一环** — 代码用 Cursor，图片用 AI 生图 + 脚本抠图，联调仍靠人工点玩验证。
7. **用测试锁住 AI 改动** — `web/src/core/game.test.ts` 覆盖冰块/炸弹/寻路等规则，防止 AI 改一处坏一处。

### 自动化测试覆盖（10 项）

| 用例 | 验证点 |
|------|--------|
| 冰块规则 | 不可交换、不可三连 |
| 横向三连 | Matcher 检测 |
| 无效交换 | 无匹配则回滚 |
| 冰块交换 | `trySwap` 拒绝 |
| 匹配预判 | 交换后形成三连 |
| 计分 | Eliminator `baseScore` |
| 碎冰 | 邻格消除时冰块清除 |
| 炸弹 | 三连炸弹触发大范围清除 |
| Auto 寻路 | MoveFinder 跳过冰块 |
| 关卡递进 | 棋盘尺寸与目标分 |

---

## 文档索引

| 文档 | 内容 |
|------|------|
| [web/README.md](./web/README.md) | Web 工程结构、AI 协作细节、资源说明 |
| [GAMEPLAY.md](./GAMEPLAY.md) | 玩法规则（控制台 + Web 通用） |

---

## 技术亮点（简表）

- **动态棋盘**：关卡提升后 `width/height` 与 `elementTypes` 同步变化
- **特殊元素**：炸弹（匹配后 3×3）、冰块（不可交换，邻格消除碎裂）
- **程序/UI 分离**：`web/src/core` 与 `view` 分层，便于移植与测试
- **渐进式美术**：默认程序绘制符文；可选 `USE_CUSTOM_ART` 切换自定义贴图
