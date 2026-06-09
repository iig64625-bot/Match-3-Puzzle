/**
 * 程序生成布局（无自定义图片时的基准坐标系）。
 * 用户 board_frame / runes 必须 1:1 覆盖到这些矩形上。
 */
export const GRID_COLUMNS = 6;
export const GRID_ROWS = 6;

/** 格子间距（px），越小格子越紧密 */
export const BASE_SPACING = 0;

/** 格子内棋子留白（越大棋子越小） */
export const PIECE_INSET_RATIO = 0.18;

/** 棋子可见区域占 piece 矩形的比例（程序圆球与贴图统一） */
export const PIECE_VISUAL_FILL = 0.92;

/** 棋盘占画布最大比例（越大棋盘越大） */
export const GRID_FILL_RATIO = 0.92;

/** 单格最大边长（px） */
export const MAX_CELL_SIZE = 68;

/** 棋盘外框相对网格的 padding */
export const FRAME_PAD_RATIO = 0.12;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 完整布局：网格、每格、棋子绘制区、外框 —— 全部由此派生 */
export interface BoardLayout {
  canvasW: number;
  canvasH: number;
  grid: Rect;
  frame: Rect;
  cellSize: number;
  spacing: number;
  cells: Rect[][];
  pieces: Rect[][];
}

export function computeBoardLayout(
  canvasW: number,
  canvasH: number,
  columns = GRID_COLUMNS,
  rows = GRID_ROWS,
): BoardLayout {
  const spacing = BASE_SPACING;
  const maxGridW = canvasW * GRID_FILL_RATIO;
  const maxGridH = canvasH * GRID_FILL_RATIO;

  const cellFromW = (maxGridW - (columns - 1) * spacing) / columns;
  const cellFromH = (maxGridH - (rows - 1) * spacing) / rows;
  const cellSize = Math.floor(Math.min(cellFromW, cellFromH, MAX_CELL_SIZE));

  const gridW = columns * cellSize + (columns - 1) * spacing;
  const gridH = rows * cellSize + (rows - 1) * spacing;

  const grid: Rect = {
    x: (canvasW - gridW) / 2,
    y: (canvasH - gridH) / 2,
    width: gridW,
    height: gridH,
  };

  const pad = Math.max(gridW, gridH) * FRAME_PAD_RATIO;
  const frame: Rect = {
    x: grid.x - pad,
    y: grid.y - pad,
    width: gridW + pad * 2,
    height: gridH + pad * 2,
  };

  const cells: Rect[][] = [];
  const pieces: Rect[][] = [];
  const step = cellSize + spacing;

  for (let row = 0; row < rows; row++) {
    cells[row] = [];
    pieces[row] = [];
    for (let col = 0; col < columns; col++) {
      const cell: Rect = {
        x: grid.x + col * step,
        y: grid.y + row * step,
        width: cellSize,
        height: cellSize,
      };
      cells[row][col] = cell;
      pieces[row][col] = pieceDrawRect(cell);
    }
  }

  return {
    canvasW,
    canvasH,
    grid,
    frame,
    cellSize,
    spacing,
    cells,
    pieces,
  };
}

export function pieceDrawRect(cell: Rect, insetRatio = PIECE_INSET_RATIO): Rect {
  const inset = cell.width * insetRatio;
  const size = cell.width - inset * 2;
  return {
    x: cell.x + inset,
    y: cell.y + inset,
    width: size,
    height: size,
  };
}

export function cellAt(layout: BoardLayout, col: number, row: number): Rect {
  return snapRect(layout.cells[row][col]);
}

export function pieceAt(layout: BoardLayout, col: number, row: number): Rect {
  return snapRect(layout.pieces[row][col]);
}

export function snapRect(rect: Rect): Rect {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

export function snapFrameRect(rect: Rect): Rect {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}
