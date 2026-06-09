import { Board } from "./board";
import { canSwap, GameConfig, GridPos, isMatchable, PieceType, gridPos } from "./types";

export class Matcher {
  constructor(
    private readonly board: Board,
    private readonly config: GameConfig,
  ) {}

  findAllMatches(): Set<GridPos> {
    const matches = new Set<string>();
    const result = new Set<GridPos>();

    const add = (positions: GridPos[]) => {
      for (const pos of positions) {
        const key = `${pos.x},${pos.y}`;
        if (!matches.has(key)) {
          matches.add(key);
          result.add(pos);
        }
      }
    };

    for (let y = 0; y < this.board.height; y++) {
      for (let x = 0; x < this.board.width; x++) {
        add(this.getHorizontalMatch(x, y));
      }
    }

    for (let x = 0; x < this.board.width; x++) {
      for (let y = 0; y < this.board.height; y++) {
        add(this.getVerticalMatch(x, y));
      }
    }

    return result;
  }

  hasValidMoves(): boolean {
    for (let x = 0; x < this.board.width; x++) {
      for (let y = 0; y < this.board.height; y++) {
        const pos = gridPos(x, y);
        if (!canSwap(this.board.getPiece(pos))) continue;

        if (x + 1 < this.board.width) {
          const right = gridPos(x + 1, y);
          if (canSwap(this.board.getPiece(right)) && this.wouldMatchAfterSwap(pos, right)) {
            return true;
          }
        }

        if (y + 1 < this.board.height) {
          const down = gridPos(x, y + 1);
          if (canSwap(this.board.getPiece(down)) && this.wouldMatchAfterSwap(pos, down)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private wouldMatchAfterSwap(a: GridPos, b: GridPos): boolean {
    this.board.swap(a, b);
    const hasMatch = this.findAllMatches().size > 0;
    this.board.swap(a, b);
    return hasMatch;
  }

  private getHorizontalMatch(x: number, y: number): GridPos[] {
    const start = gridPos(x, y);
    const type = this.board.getPiece(start);
    if (!isMatchable(type)) return [];

    const result: GridPos[] = [start];
    for (let i = x + 1; i < this.board.width; i++) {
      if (this.board.getPiece(gridPos(i, y)) === type) {
        result.push(gridPos(i, y));
      } else {
        break;
      }
    }

    return result.length >= this.config.minMatchCount ? result : [];
  }

  private getVerticalMatch(x: number, y: number): GridPos[] {
    const start = gridPos(x, y);
    const type = this.board.getPiece(start);
    if (!isMatchable(type)) return [];

    const result: GridPos[] = [start];
    for (let i = y + 1; i < this.board.height; i++) {
      if (this.board.getPiece(gridPos(x, i)) === type) {
        result.push(gridPos(x, i));
      } else {
        break;
      }
    }

    return result.length >= this.config.minMatchCount ? result : [];
  }
}
