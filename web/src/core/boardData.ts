import { GridPos, PieceType, gridPos } from "./types";

export class BoardData {
  readonly width: number;
  readonly height: number;
  readonly grid: PieceType[][];

  constructor(width: number, height: number) {
    if (width <= 0 || height <= 0) {
      throw new Error("Board dimensions must be positive.");
    }
    this.width = width;
    this.height = height;
    this.grid = Array.from({ length: width }, () =>
      Array.from({ length: height }, () => PieceType.None),
    );
  }

  get(pos: GridPos): PieceType {
    return this.grid[pos.x][pos.y];
  }

  set(pos: GridPos, type: PieceType): void {
    this.grid[pos.x][pos.y] = type;
  }

  isValid(pos: GridPos): boolean {
    return pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height;
  }

  clone(): BoardData {
    const copy = new BoardData(this.width, this.height);
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        copy.grid[x][y] = this.grid[x][y];
      }
    }
    return copy;
  }
}

export function forEachCell(
  width: number,
  height: number,
  fn: (pos: GridPos) => void,
): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      fn(gridPos(x, y));
    }
  }
}
