import { Board } from "../core/board";
import { GridPos, PieceType, gridPos, gridPosEquals } from "../core/types";
import { AssetLoader, USE_CUSTOM_ART, drawPieceFallback, drawPieceImage, drawRuneExact } from "./assetLoader";
import {
  BoardLayout,
  cellAt,
  computeBoardLayout,
  pieceAt,
} from "./boardLayout";
import { EffectLayer } from "./effects";
import { AlchemyBoardTheme, createAlchemyTheme, drawAlchemyBoard } from "./proceduralBoard";

export interface PieceVisual {
  col: number;
  row: number;
  type: PieceType;
  offsetX: number;
  offsetY: number;
  alpha: number;
  scale: number;
  rotation?: number;
}

export interface BoardVisualState {
  width: number;
  height: number;
  pieces: PieceVisual[];
  highlight: GridPos[];
  pulseT: number;
  levelFlash: number;
  effects?: EffectLayer;
}

export class BoardView {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly assets: AssetLoader;
  private layout: BoardLayout;
  private highlight: GridPos[] = [];
  private boardTheme: AlchemyBoardTheme = createAlchemyTheme(1, 3);

  constructor(canvas: HTMLCanvasElement, assets: AssetLoader) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not supported");
    this.ctx = ctx;
    this.assets = assets;
    this.layout = computeBoardLayout(1, 1);
  }

  setHighlight(cells: GridPos[]): void {
    this.highlight = cells;
  }

  clearHighlight(): void {
    this.highlight = [];
  }

  getLayout(): BoardLayout {
    return this.layout;
  }

  setDifficulty(level: number, elementTypes: number): void {
    this.boardTheme = createAlchemyTheme(level, elementTypes);
  }

  resize(width: number, height: number, columns: number, rows: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.layout = computeBoardLayout(width, height, columns, rows);
  }

  pixelToGrid(px: number, py: number): GridPos | null {
    for (let row = 0; row < this.layout.cells.length; row++) {
      for (let col = 0; col < this.layout.cells[row].length; col++) {
        const cell = cellAt(this.layout, col, row);
        if (
          px >= cell.x &&
          px <= cell.x + cell.width &&
          py >= cell.y &&
          py <= cell.y + cell.height
        ) {
          return gridPos(col, row);
        }
      }
    }
    return null;
  }

  render(board: Board): void {
    const pieces: PieceVisual[] = [];
    for (let row = 0; row < board.height; row++) {
      for (let col = 0; col < board.width; col++) {
        const type = board.getPiece(gridPos(col, row));
        if (type === PieceType.None) continue;
        pieces.push({
          col,
          row,
          type,
          offsetX: 0,
          offsetY: 0,
          alpha: 1,
          scale: 1,
          rotation: 0,
        });
      }
    }
    this.renderVisual({
      width: board.width,
      height: board.height,
      pieces,
      highlight: this.highlight,
      pulseT: 0,
      levelFlash: 0,
    });
  }

  renderVisual(state: BoardVisualState): void {
    const w = this.layout.canvasW;
    const h = this.layout.canvasH;
    this.ctx.clearRect(0, 0, w, h);

    const hasBg = !!this.assets.background;
    if (!hasBg) {
      this.ctx.fillStyle = "#120a24";
      this.ctx.fillRect(0, 0, w, h);
    }

    drawAlchemyBoard(this.ctx, this.layout, this.boardTheme, w, h, hasBg);

    this.drawVisualPieces(state.pieces);
    this.drawHighlights(state.highlight, state.pulseT);

    if (state.levelFlash > 0) {
      this.ctx.save();
      this.ctx.fillStyle = `rgba(245, 215, 140, ${state.levelFlash * 0.35})`;
      this.ctx.fillRect(0, 0, w, h);
      this.ctx.restore();
    }

    state.effects?.render(this.ctx);
  }

  private drawVisualPieces(pieces: PieceVisual[]): void {
    this.ctx.save();
    this.clipGrid();

    for (const pv of pieces) {
      const cell = cellAt(this.layout, pv.col, pv.row);
      const target = pieceAt(this.layout, pv.col, pv.row);
      const cx = target.x + target.width / 2;
      const cy = target.y + target.height / 2;

      this.ctx.save();
      this.ctx.globalAlpha = pv.alpha;
      this.ctx.translate(cx + pv.offsetX, cy + pv.offsetY);

      // 支持旋转（销毁动画）
      if (pv.rotation) {
        this.ctx.rotate((pv.rotation * Math.PI) / 180);
      }

      this.ctx.scale(pv.scale, pv.scale);
      this.ctx.translate(-cx, -cy);

      const specialPiece = this.assets.getSpecialPiece(pv.type);
      if (specialPiece) {
        drawPieceImage(this.ctx, specialPiece, target);
        this.ctx.restore();
        continue;
      }

      if (USE_CUSTOM_ART) {
        const image = this.assets.getRune(pv.type);
        if (image) {
          drawRuneExact(this.ctx, image, target);
          this.ctx.restore();
          continue;
        }
      }

      drawPieceFallback(this.ctx, pv.type, cell);
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  private drawHighlights(cells: GridPos[], pulseT: number): void {
    if (cells.length === 0) return;

    const pulse = 0.55 + Math.sin(pulseT) * 0.45;

    this.ctx.save();
    this.clipGrid();
    this.ctx.strokeStyle = `rgba(255, 224, 138, ${pulse})`;
    this.ctx.lineWidth = 2.5;
    this.ctx.shadowColor = "#ffd060";
    this.ctx.shadowBlur = 10 + Math.sin(pulseT) * 4;

    for (const pos of cells) {
      const cell = cellAt(this.layout, pos.x, pos.y);
      const inset = 2;
      roundRect(
        this.ctx,
        cell.x + inset,
        cell.y + inset,
        cell.width - inset * 2,
        cell.height - inset * 2,
        Math.min(8, cell.width * 0.12),
      );
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private clipGrid(): void {
    const { grid } = this.layout;
    this.ctx.beginPath();
    this.ctx.rect(grid.x, grid.y, grid.width, grid.height);
    this.ctx.clip();
  }
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

export { gridPosEquals };
