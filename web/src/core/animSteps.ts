import { GridPos, PieceType } from "./types";

export type AnimStep =
  | { type: "swap"; a: GridPos; b: GridPos }
  | { type: "shake"; a: GridPos; b: GridPos }
  | {
      type: "clear";
      cells: GridPos[];
      pieces: Record<string, PieceType>;
      hasBomb: boolean;
      iceCells: GridPos[];
    }
  | { type: "fall"; moves: FallMove[] }
  | { type: "spawn"; spawns: SpawnCell[] }
  | { type: "score"; points: number; combo: number }
  | {
      type: "levelComplete";
      level: number;
      levelScore: number;
      targetScore: number;
    }
  | { type: "gameOver" };

export interface FallMove {
  from: GridPos;
  to: GridPos;
  piece: PieceType;
}

export interface SpawnCell {
  pos: GridPos;
  piece: PieceType;
}

export function posKey(pos: GridPos): string {
  return `${pos.x},${pos.y}`;
}
