import { Board } from "./board";
import { GameConfig, GridPos, PieceType, gridPos } from "./types";

export class Eliminator {
  constructor(
    private readonly board: Board,
    private readonly config: GameConfig,
  ) {}

  processMatches(matches: Set<GridPos>): number {
    if (matches.size === 0) return 0;

    const toClear = this.expandClears(matches);
    for (const pos of toClear) {
      this.board.clearCell(pos);
    }

    this.board.applyGravity();
    this.board.fillEmpty();

    return toClear.size * this.config.baseScore;
  }

  private expandClears(matches: Set<GridPos>): Set<GridPos> {
    const toClear = new Set(matches);

    for (const pos of matches) {
      if (this.board.getPiece(pos) === PieceType.Bomb) {
        this.addBombBlast(toClear, pos);
      }
    }

    this.addAdjacentIce(toClear, matches);
    return toClear;
  }

  private addBombBlast(toClear: Set<GridPos>, center: GridPos): void {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const pos = gridPos(center.x + dx, center.y + dy);
        if (this.board.isValid(pos)) toClear.add(pos);
      }
    }
  }

  private addAdjacentIce(toClear: Set<GridPos>, matches: Set<GridPos>): void {
    for (const pos of matches) {
      this.tryAddIce(toClear, gridPos(pos.x + 1, pos.y));
      this.tryAddIce(toClear, gridPos(pos.x - 1, pos.y));
      this.tryAddIce(toClear, gridPos(pos.x, pos.y + 1));
      this.tryAddIce(toClear, gridPos(pos.x, pos.y - 1));
    }
  }

  private tryAddIce(toClear: Set<GridPos>, pos: GridPos): void {
    if (this.board.isValid(pos) && this.board.getPiece(pos) === PieceType.Ice) {
      toClear.add(pos);
    }
  }
}
