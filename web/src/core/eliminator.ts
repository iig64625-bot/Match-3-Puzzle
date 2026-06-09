import { Board } from "./board";
import { FallMove, SpawnCell, posKey } from "./animSteps";
import { GameConfig, GridPos, PieceType, gridPos } from "./types";

export interface MatchResolution {
  cleared: GridPos[];
  pieces: Record<string, PieceType>;
  hasBomb: boolean;
  iceCells: GridPos[];
  fallMoves: FallMove[];
  spawns: SpawnCell[];
  points: number;
}

export class Eliminator {
  constructor(
    private readonly board: Board,
    private readonly config: GameConfig,
  ) {}

  processMatches(matches: Set<GridPos>): number {
    return this.resolveMatches(matches).points;
  }

  resolveMatches(matches: Set<GridPos>): MatchResolution {
    if (matches.size === 0) {
      return {
        cleared: [],
        pieces: {},
        hasBomb: false,
        iceCells: [],
        fallMoves: [],
        spawns: [],
        points: 0,
      };
    }

    const toClear = this.expandClears(matches);
    const cleared = [...toClear];
    const pieces: Record<string, PieceType> = {};
    let hasBomb = false;
    const iceCells: GridPos[] = [];

    for (const pos of cleared) {
      const piece = this.board.getPiece(pos);
      pieces[posKey(pos)] = piece;
      if (piece === PieceType.Bomb) hasBomb = true;
      if (piece === PieceType.Ice) iceCells.push(pos);
      this.board.clearCell(pos);
    }

    const afterClear = this.board.data.clone();
    this.board.applyGravity();
    const fallMoves = this.computeFallMoves(afterClear, this.board.data);
    const spawns = this.board.fillEmptyRecorded();

    return {
      cleared,
      pieces,
      hasBomb,
      iceCells,
      fallMoves,
      spawns,
      points: cleared.length * this.config.baseScore,
    };
  }

  private computeFallMoves(
    afterClear: import("./boardData").BoardData,
    afterGravity: import("./boardData").BoardData,
  ): FallMove[] {
    const moves: FallMove[] = [];
    for (let x = 0; x < afterGravity.width; x++) {
      const src: { y: number; piece: PieceType }[] = [];
      const dst: { y: number; piece: PieceType }[] = [];
      for (let y = afterGravity.height - 1; y >= 0; y--) {
        const fromPiece = afterClear.get(gridPos(x, y));
        if (fromPiece !== PieceType.None) src.push({ y, piece: fromPiece });
        const toPiece = afterGravity.get(gridPos(x, y));
        if (toPiece !== PieceType.None) dst.push({ y, piece: toPiece });
      }
      for (let i = 0; i < src.length; i++) {
        if (src[i].y !== dst[i].y) {
          moves.push({
            from: gridPos(x, src[i].y),
            to: gridPos(x, dst[i].y),
            piece: src[i].piece,
          });
        }
      }
    }
    return moves;
  }

  expandClears(matches: Set<GridPos>): Set<GridPos> {
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
