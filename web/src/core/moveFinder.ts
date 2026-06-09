import { Board } from "./board";
import { Matcher } from "./matcher";
import { canSwap, GameConfig, GridPos, MoveData, gridPos } from "./types";

export class MoveFinder {
  constructor(
    private readonly board: Board,
    private readonly config: GameConfig,
  ) {}

  findAllValidMoves(): MoveData[] {
    const moves: MoveData[] = [];

    for (let x = 0; x < this.board.width; x++) {
      for (let y = 0; y < this.board.height; y++) {
        const from = gridPos(x, y);

        if (x + 1 < this.board.width) {
          this.tryAddMove(moves, from, gridPos(x + 1, y));
        }

        if (y + 1 < this.board.height) {
          this.tryAddMove(moves, from, gridPos(x, y + 1));
        }
      }
    }

    return moves;
  }

  findBestMove(): MoveData | null {
    const moves = this.findAllValidMoves();
    if (moves.length === 0) return null;

    return moves.reduce((best, move) =>
      move.estimatedMatchCount > best.estimatedMatchCount ? move : best,
    );
  }

  private tryAddMove(moves: MoveData[], from: GridPos, to: GridPos): void {
    if (!canSwap(this.board.getPiece(from)) || !canSwap(this.board.getPiece(to))) {
      return;
    }

    const matchCount = this.estimateMatchCount(from, to);
    if (matchCount > 0) {
      moves.push({ from, to, estimatedMatchCount: matchCount });
    }
  }

  private estimateMatchCount(from: GridPos, to: GridPos): number {
    const snapshot = this.board.createSnapshot();
    snapshot.swap(from, to);
    const matcher = new Matcher(snapshot, this.config);
    return matcher.findAllMatches().size;
  }
}
