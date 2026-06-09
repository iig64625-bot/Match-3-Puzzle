# Figma 导出暂存区

从 Figma 导出的文件**先放这里**，确认无误后再运行导入脚本。

## 目录结构（导出时必须一致）

```
figma-export/
├── bg_main.png
├── board_frame.png
├── runes/
│   ├── fire.png
│   ├── water.png
│   ├── nature.png
│   ├── lightning.png
│   ├── light.png
│   └── shadow.png
```

> **bomb / ice** 不用从 Figma 导出。游戏使用 `web/public/assets/special/` 里的 **AI 生成贴图**（始终加载，见 `assetLoader.ts`）。

## Figma 导出设置

- 格式：**PNG**
- 缩放：**2x**（符文/道具）或 **1x**（背景 1024、边框 1024）
- 符文/道具：**透明背景**
- 边框：中间区域透明

导入命令见 `docs/figma-workflow.md`
