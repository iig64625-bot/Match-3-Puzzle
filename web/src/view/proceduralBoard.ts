import { BoardLayout, cellAt } from "./boardLayout";

export interface AlchemyBoardTheme {
  level: number;
  elementTypes: number;
  ornamentTier: number;
  mysticIntensity: number;
  accentRgb: [number, number, number];
  seed: number;
}

export function createAlchemyTheme(level: number, elementTypes: number): AlchemyBoardTheme {
  const tier = Math.min(3, Math.floor((level - 1) / 2) + Math.floor((elementTypes - 3) / 2));
  const mysticIntensity = Math.min(1, 0.35 + level * 0.06 + elementTypes * 0.05);
  const hueShift = ((level * 37 + elementTypes * 53) % 360) / 360;
  const accentRgb = alchemyAccent(hueShift, elementTypes);
  return {
    level,
    elementTypes,
    ornamentTier: tier,
    mysticIntensity,
    accentRgb,
    seed: level * 1009 + elementTypes * 9176,
  };
}

export function drawAlchemyBoard(
  ctx: CanvasRenderingContext2D,
  layout: BoardLayout,
  theme: AlchemyBoardTheme,
  canvasW: number,
  canvasH: number,
  hasImageBackground = false,
): void {
  if (hasImageBackground) {
    drawGridPlaySurface(ctx, layout, theme);
    drawOrnateFrame(ctx, layout, theme);
    return;
  }

  drawCanvasBackdrop(ctx, layout, canvasW, canvasH, theme, false);
  drawFrameSlab(ctx, layout, theme);
  drawCells(ctx, layout, theme);
  drawGridLines(ctx, layout, theme);
  drawOrnateFrame(ctx, layout, theme);
}

function drawCanvasBackdrop(
  ctx: CanvasRenderingContext2D,
  layout: BoardLayout,
  w: number,
  h: number,
  theme: AlchemyBoardTheme,
  hasImageBackground: boolean,
): void {
  const [ar, ag, ab] = theme.accentRgb;

  if (!hasImageBackground) {
    const gradient = ctx.createLinearGradient(0, 0, w * 0.2, h);
    gradient.addColorStop(0, "#120a24");
    gradient.addColorStop(0.45, `rgb(${18 + ar * 0.15}, ${10 + ag * 0.12}, ${36 + ab * 0.2})`);
    gradient.addColorStop(1, "#0a0618");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  const { grid } = layout;
  const cx = grid.x + grid.width / 2;
  const cy = grid.y + grid.height / 2;
  const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(grid.width, grid.height) * 0.85);
  aura.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, ${0.14 * theme.mysticIntensity})`);
  aura.addColorStop(0.55, `rgba(${ar}, ${ag}, ${ab}, ${0.05 * theme.mysticIntensity})`);
  aura.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, w, h);

  const vignette = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.2, cx, cy, Math.max(w, h) * 0.75);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, hasImageBackground ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.45)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function drawGridPlaySurface(
  ctx: CanvasRenderingContext2D,
  layout: BoardLayout,
  theme: AlchemyBoardTheme,
): void {
  const { grid } = layout;
  ctx.save();
  ctx.beginPath();
  ctx.rect(grid.x, grid.y, grid.width, grid.height);
  ctx.clip();

  const mat = ctx.createLinearGradient(grid.x, grid.y, grid.x, grid.y + grid.height);
  mat.addColorStop(0, "rgba(26, 18, 42, 0.94)");
  mat.addColorStop(0.5, "rgba(20, 14, 34, 0.96)");
  mat.addColorStop(1, "rgba(14, 10, 26, 0.94)");
  ctx.fillStyle = mat;
  ctx.fillRect(grid.x, grid.y, grid.width, grid.height);

  drawCells(ctx, layout, theme);
  drawGridLines(ctx, layout, theme);
  ctx.restore();
}

function drawFrameSlab(ctx: CanvasRenderingContext2D, layout: BoardLayout, theme: AlchemyBoardTheme): void {
  const frame = layout.frame;
  const pad = Math.max(4, frame.width * 0.02);
  const r = Math.min(20, frame.width * 0.04);

  ctx.save();
  const slab = ctx.createLinearGradient(frame.x, frame.y, frame.x, frame.y + frame.height);
  slab.addColorStop(0, "#2a1f3d");
  slab.addColorStop(0.5, "#1a1228");
  slab.addColorStop(1, "#120c1e");
  ctx.fillStyle = slab;
  roundRect(ctx, frame.x, frame.y, frame.width, frame.height, r);
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 2;
  roundRect(ctx, frame.x + 1, frame.y + 1, frame.width - 2, frame.height - 2, r - 1);
  ctx.stroke();

  const inner = ctx.createLinearGradient(frame.x, frame.y, frame.x + frame.width, frame.y);
  inner.addColorStop(0, `rgba(${theme.accentRgb.join(",")}, ${0.08 + theme.mysticIntensity * 0.06})`);
  inner.addColorStop(0.5, "rgba(245, 215, 140, 0.04)");
  inner.addColorStop(1, `rgba(${theme.accentRgb.join(",")}, ${0.06 + theme.mysticIntensity * 0.05})`);
  ctx.fillStyle = inner;
  roundRect(ctx, frame.x + pad, frame.y + pad, frame.width - pad * 2, frame.height - pad * 2, r - 4);
  ctx.fill();
  ctx.restore();
}

function drawCells(ctx: CanvasRenderingContext2D, layout: BoardLayout, theme: AlchemyBoardTheme): void {
  const rng = seeded(theme.seed);
  const { cells } = layout;

  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      const cell = cellAt(layout, col, row);
      const inset = Math.max(1.5, cell.width * 0.04);
      const x = cell.x + inset;
      const y = cell.y + inset;
      const w = cell.width - inset * 2;
      const h = cell.height - inset * 2;
      const cr = Math.min(8, w * 0.14);
      const shade = 0.82 + rng() * 0.18;

      const tile = ctx.createLinearGradient(x, y, x + w, y + h);
      tile.addColorStop(0, stoneColor(shade + 0.08, theme));
      tile.addColorStop(0.45, stoneColor(shade, theme));
      tile.addColorStop(1, stoneColor(shade - 0.12, theme));

      ctx.save();
      ctx.fillStyle = tile;
      roundRect(ctx, x, y, w, h, cr);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, cr);
      ctx.stroke();

      if (theme.ornamentTier >= 2 && (col + row + theme.level) % 3 === 0) {
        const [ar, ag, ab] = theme.accentRgb;
        const glow = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 0.45);
        glow.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, ${0.12 * theme.mysticIntensity})`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        roundRect(ctx, x, y, w, h, cr);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}

function drawGridLines(ctx: CanvasRenderingContext2D, layout: BoardLayout, theme: AlchemyBoardTheme): void {
  const { grid, cellSize, spacing, cells } = layout;
  const goldAlpha = 0.12 + theme.ornamentTier * 0.04;

  ctx.save();
  ctx.strokeStyle = `rgba(245, 215, 140, ${goldAlpha})`;
  ctx.lineWidth = 1;
  ctx.shadowColor = `rgba(${theme.accentRgb.join(",")}, 0.25)`;
  ctx.shadowBlur = theme.mysticIntensity * 6;

  for (let col = 1; col < cells[0].length; col++) {
    const lx = grid.x + col * cellSize + (col - 0.5) * spacing;
    ctx.beginPath();
    ctx.moveTo(lx, grid.y + 2);
    ctx.lineTo(lx, grid.y + grid.height - 2);
    ctx.stroke();
  }

  for (let row = 1; row < cells.length; row++) {
    const ly = grid.y + row * cellSize + (row - 0.5) * spacing;
    ctx.beginPath();
    ctx.moveTo(grid.x + 2, ly);
    ctx.lineTo(grid.x + grid.width - 2, ly);
    ctx.stroke();
  }

  ctx.restore();
}

function drawOrnateFrame(ctx: CanvasRenderingContext2D, layout: BoardLayout, theme: AlchemyBoardTheme): void {
  const frame = layout.frame;
  const r = Math.min(18, frame.width * 0.035);
  const borderW = 3 + theme.ornamentTier;

  ctx.save();
  ctx.strokeStyle = `rgba(245, 215, 140, ${0.45 + theme.ornamentTier * 0.12})`;
  ctx.lineWidth = borderW;
  ctx.shadowColor = "rgba(255, 200, 100, 0.4)";
  ctx.shadowBlur = 8 + theme.mysticIntensity * 10;
  roundRect(ctx, frame.x, frame.y, frame.width, frame.height, r);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(${theme.accentRgb.join(",")}, ${0.35 + theme.mysticIntensity * 0.2})`;
  ctx.lineWidth = 1.5;
  const inset = borderW + 3;
  roundRect(ctx, frame.x + inset, frame.y + inset, frame.width - inset * 2, frame.height - inset * 2, r - 4);
  ctx.stroke();

  if (theme.ornamentTier >= 1) {
    drawCornerSigils(ctx, frame, theme);
  }

  if (theme.ornamentTier >= 2) {
    drawEdgeRunes(ctx, frame, theme);
  }

  if (theme.ornamentTier >= 3) {
    drawCenterEmblem(ctx, layout, theme);
  }

  ctx.restore();
}

function drawCornerSigils(
  ctx: CanvasRenderingContext2D,
  frame: { x: number; y: number; width: number; height: number },
  theme: AlchemyBoardTheme,
): void {
  const size = Math.max(14, frame.width * 0.055);
  const margin = size * 0.65;
  const corners = [
    [frame.x + margin, frame.y + margin],
    [frame.x + frame.width - margin, frame.y + margin],
    [frame.x + margin, frame.y + frame.height - margin],
    [frame.x + frame.width - margin, frame.y + frame.height - margin],
  ];

  ctx.strokeStyle = `rgba(245, 215, 140, ${0.5 + theme.mysticIntensity * 0.2})`;
  ctx.lineWidth = 1.5;

  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.25, cy);
    ctx.lineTo(cx + size * 0.25, cy);
    ctx.moveTo(cx, cy - size * 0.25);
    ctx.lineTo(cx, cy + size * 0.25);
    ctx.stroke();
    if (theme.ornamentTier >= 2) {
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawEdgeRunes(
  ctx: CanvasRenderingContext2D,
  frame: { x: number; y: number; width: number; height: number },
  theme: AlchemyBoardTheme,
): void {
  const [ar, ag, ab] = theme.accentRgb;
  ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${0.35 + theme.mysticIntensity * 0.15})`;
  ctx.lineWidth = 1;
  const midX = frame.x + frame.width / 2;
  const midY = frame.y + frame.height / 2;
  const tick = frame.width * 0.04;

  for (const x of [frame.x + frame.width * 0.25, frame.x + frame.width * 0.75]) {
    ctx.beginPath();
    ctx.moveTo(x, frame.y + 6);
    ctx.lineTo(x, frame.y + 6 + tick);
    ctx.moveTo(x, frame.y + frame.height - 6);
    ctx.lineTo(x, frame.y + frame.height - 6 - tick);
    ctx.stroke();
  }

  for (const y of [frame.y + frame.height * 0.25, frame.y + frame.height * 0.75]) {
    ctx.beginPath();
    ctx.moveTo(frame.x + 6, y);
    ctx.lineTo(frame.x + 6 + tick, y);
    ctx.moveTo(frame.x + frame.width - 6, y);
    ctx.lineTo(frame.x + frame.width - 6 - tick, y);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(midX, frame.y + 8, 4, 0, Math.PI);
  ctx.arc(midX, frame.y + frame.height - 8, 4, Math.PI, Math.PI * 2);
  ctx.stroke();
}

function drawCenterEmblem(ctx: CanvasRenderingContext2D, layout: BoardLayout, theme: AlchemyBoardTheme): void {
  const { grid } = layout;
  const cx = grid.x + grid.width / 2;
  const cy = grid.y + grid.height / 2;
  const radius = Math.min(grid.width, grid.height) * 0.12;

  ctx.save();
  ctx.globalAlpha = 0.08 + theme.mysticIntensity * 0.06;
  ctx.strokeStyle = `rgb(${theme.accentRgb.join(",")})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.6, cy);
  ctx.lineTo(cx + radius * 0.6, cy);
  ctx.moveTo(cx, cy - radius * 0.6);
  ctx.lineTo(cx, cy + radius * 0.6);
  ctx.stroke();
  ctx.restore();
}

function stoneColor(shade: number, theme: AlchemyBoardTheme): string {
  const [ar, ag, ab] = theme.accentRgb;
  const base = 28 + shade * 22;
  const r = Math.min(80, base + ar * 0.08);
  const g = Math.min(70, base * 0.9 + ag * 0.06);
  const b = Math.min(95, base * 1.1 + ab * 0.1);
  return `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
}

function alchemyAccent(hueShift: number, elementTypes: number): [number, number, number] {
  const palette: [number, number, number][] = [
    [120, 80, 200],
    [80, 160, 200],
    [200, 140, 60],
    [160, 60, 200],
    [60, 180, 140],
    [220, 100, 80],
  ];
  const idx = Math.min(palette.length - 1, elementTypes - 3);
  const base = palette[idx];
  const mix = hueShift * 0.35;
  return [
    base[0] + mix * 40,
    base[1] + mix * 20,
    base[2] + mix * 30,
  ].map((v) => Math.round(v)) as [number, number, number];
}

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s & 0xffff) / 0xffff;
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
