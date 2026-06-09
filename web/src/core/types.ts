export enum PieceType {
  None = -1,
  Fire = 0,
  Water = 1,
  Nature = 2,
  Lightning = 3,
  Light = 4,
  Shadow = 5,
  Bomb = 6,
  Ice = 7,
}

export enum GameStateType {
  Playing = "Playing",
  Processing = "Processing",
  LevelComplete = "LevelComplete",
  GameOver = "GameOver",
  Paused = "Paused",
}

export interface GridPos {
  x: number;
  y: number;
}

export function gridPos(x: number, y: number): GridPos {
  return { x, y };
}

export function gridPosEquals(a: GridPos, b: GridPos): boolean {
  return a.x === b.x && a.y === b.y;
}

export interface GameConfig {
  boardWidth: number;
  boardHeight: number;
  elementTypes: number;
  minMatchCount: number;
  baseScore: number;
  levelTargetScore: number;
  bombSpawnRate: number;
  maxBoardSize: number;
  maxElementTypes: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  boardWidth: 6,
  boardHeight: 6,
  elementTypes: 4,
  minMatchCount: 3,
  baseScore: 10,
  levelTargetScore: 750,
  bombSpawnRate: 0.04,
  maxBoardSize: 10,
  maxElementTypes: 6,
};

export interface MoveData {
  from: GridPos;
  to: GridPos;
  estimatedMatchCount: number;
}

export function isRune(type: PieceType): boolean {
  return type >= PieceType.Fire && type <= PieceType.Shadow;
}

export function isMatchable(type: PieceType): boolean {
  return isRune(type) || type === PieceType.Bomb;
}

export function canSwap(type: PieceType): boolean {
  return type !== PieceType.None && type !== PieceType.Ice;
}

export const PIECE_LABELS: Record<number, string> = {
  [PieceType.Fire]: "Fire",
  [PieceType.Water]: "Water",
  [PieceType.Nature]: "Nature",
  [PieceType.Lightning]: "Lightning",
  [PieceType.Light]: "Light",
  [PieceType.Shadow]: "Shadow",
  [PieceType.Bomb]: "Bomb",
  [PieceType.Ice]: "Ice",
};

export const PIECE_COLORS: Record<number, string> = {
  [PieceType.Fire]: "#e85d4a",
  [PieceType.Water]: "#4a9fe8",
  [PieceType.Nature]: "#4ecb71",
  [PieceType.Lightning]: "#f0c040",
  [PieceType.Light]: "#f5f0d0",
  [PieceType.Shadow]: "#8b5cf6",
  [PieceType.Bomb]: "#c41e1e",
  [PieceType.Ice]: "#9ad4f5",
};
