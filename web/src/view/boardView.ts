import { Board } from "../core/board";
import { GridPos, PieceType, gridPos, gridPosEquals } from "../core/types";
import { AssetLoader, USE_CUSTOM_ART, drawPieceFallback, drawPieceImage, drawRuneExact } from "./assetLoader";
import {
  BoardLayout,
  cellAt,
  computeBoardLayout,
  pieceAt,
  snapFrameRect,
} from "./boardLayout";

/** 程序生成模式下显示格子线 */
const SHOW_PROCEDURAL_GRID = !USE_CUSTOM_ART;

export class BoardView {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly assets: AssetLoader;
  private layout: BoardLayout;
  private highlight: GridPos[] = [];

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
    const w = this.layout.canvasW;
    const h = this.layout.canvasH;
    this.ctx.clearRect(0, 0, w, h);

    this.drawBackground(w, h);

    if (SHOW_PROCEDURAL_GRID) {
      this.drawProceduralGrid();
    }

    this.drawPieces(board);
    this.drawHighlights();
    this.drawBoardFrame();
  }

  private drawPieces(board: Board): void {
    this.ctx.save();
    this.clipGrid();

    for (let row = 0; row < board.height; row++) {
      for (let col = 0; col < board.width; col++) {
        const type = board.getPiece(gridPos(col, row));
        if (type === PieceType.None) continue;

        const cell = cellAt(this.layout, col, row);
        const target = pieceAt(this.layout, col, row);

        const specialPiece = this.assets.getSpecialPiece(type);
        if (specialPiece) {
          drawPieceImage(this.ctx, specialPiece, target);
          continue;
        }

        if (USE_CUSTOM_ART) {
          const image = this.assets.getRune(type);
          if (image) {
            drawRuneExact(this.ctx, image, target);
            continue;
          }
        }

        drawPieceFallback(this.ctx, type, cell);
      }
    }

    this.ctx.restore();
  }

  private drawBoardFrame(): void {
    if (USE_CUSTOM_ART && this.assets.boardFrame) {
      const frame = snapFrameRect(this.layout.frame);
      this.ctx.drawImage(
        this.assets.boardFrame,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
      );
      return;
    }

    this.drawProceduralFrame();
  }

  private drawBackground(w: number, h: number): void {
    if (USE_CUSTOM_ART && this.assets.background) {
      this.ctx.drawImage(this.assets.background, 0, 0, w, h);
      this.ctx.fillStyle = "rgba(10, 8, 24, 0.22)";
      this.ctx.fillRect(0, 0, w, h);
      return;
    }

    const gradient = this.ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#1a1035");
    gradient.addColorStop(0.5, "#2d1b4e");
    gradient.addColorStop(1, "#0f172a");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, w, h);
  }

  /** 程序生成的金边外框 */
  private drawProceduralFrame(): void {
    const frame = snapFrameRect(this.layout.frame);
    this.ctx.save();
    this.ctx.strokeStyle = "rgba(255, 215, 140, 0.55)";
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = "rgba(255, 200, 100, 0.35)";
    this.ctx.shadowBlur = 12;
    roundRect(this.ctx, frame.x, frame.y, frame.width, frame.height, 16);
    this.ctx.stroke();
    this.ctx.restore();
  }

  /** 程序生成的格子线 */
  private drawProceduralGrid(): void {
    const { grid, cellSize, spacing, cells } = this.layout;
    this.ctx.save();
    this.ctx.strokeStyle = "rgba(255,255,255,0.15)";
    this.ctx.lineWidth = 1;

    for (let col = 1; col < cells[0].length; col++) {
      const lx = grid.x + col * cellSize + (col - 0.5) * spacing;
      this.ctx.beginPath();
      this.ctx.moveTo(lx, grid.y);
      this.ctx.lineTo(lx, grid.y + grid.height);
      this.ctx.stroke();
    }

    for (let row = 1; row < cells.length; row++) {
      const ly = grid.y + row * cellSize + (row - 0.5) * spacing;
      this.ctx.beginPath();
      this.ctx.moveTo(grid.x, ly);
      this.ctx.lineTo(grid.x + grid.width, ly);
      this.ctx.stroke();
    }

    for (let row = 0; row < cells.length; row++) {
      for (let col = 0; col < cells[row].length; col++) {
        const cell = cellAt(this.layout, col, row);
        this.ctx.strokeStyle = "rgba(255,255,255,0.08)";
        this.ctx.strokeRect(cell.x + 0.5, cell.y + 0.5, cell.width - 1, cell.height - 1);
      }
    }

    this.ctx.restore();
  }

  private drawHighlights(): void {
    if (this.highlight.length === 0) return;

    this.ctx.save();
    this.clipGrid();
    this.ctx.strokeStyle = "#ffe08a";
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = "#ffd060";
    this.ctx.shadowBlur = 8;

    for (const pos of this.highlight) {
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
