import { GameConfig } from "./types";

export function applyLevelToConfig(config: GameConfig, level: number): void {
  config.elementTypes = Math.min(3 + Math.floor((level - 1) / 2), config.maxElementTypes);
  const size = Math.min(6 + Math.floor((level - 1) / 2), config.maxBoardSize);
  config.boardWidth = size;
  config.boardHeight = size;
  config.levelTargetScore = 400 + level * 350;
}

export function iceCountForLevel(level: number): number {
  return Math.min(2 + Math.floor(level / 2), 14);
}
