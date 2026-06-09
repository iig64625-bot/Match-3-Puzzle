import { describe, expect, it } from "vitest";
import { Board } from "./board";
import { BoardData } from "./boardData";
import { Eliminator } from "./eliminator";
import { Game } from "./game";
import { applyLevelToConfig } from "./levelProgression";
import { Matcher } from "./matcher";
import { MoveFinder } from "./moveFinder";
import {
  DEFAULT_CONFIG,
  GameConfig,
  PieceType,
  canSwap,
  gridPos,
  isMatchable,
} from "./types";

const RUNES = [
  PieceType.Fire,
  PieceType.Water,
  PieceType.Nature,
  PieceType.Lightning,
] as const;

/** 棋盘其余格：交替填色，避免整列同色引发无限连锁 */
function fillerCell(x: number, y: number): PieceType {
  return RUNES[(x + y * 2) % RUNES.length];
}

function testConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    ...DEFAULT_CONFIG,
    boardWidth: 6,
    boardHeight: 6,
    elementTypes: 4,
    bombSpawnRate: 0,
    levelTargetScore: 10_000,
    ...overrides,
  };
}

/** rows[y][x] — null 表示用 fillerCell 填充 */
function boardFromRows(rows: (PieceType | null)[][]): Board {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const data = new BoardData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cell = rows[y][x] ?? fillerCell(x, y);
      data.set(gridPos(x, y), cell);
    }
  }
  return Board.fromData(data, testConfig({ boardWidth: w, boardHeight: h }), () => 0.99);
}

function gameFromRows(rows: (PieceType | null)[][]): Game {
  const board = boardFromRows(rows);
  const config = testConfig({
    boardWidth: board.width,
    boardHeight: board.height,
  });
  return new Game(config, () => 0.99, board);
}

function padRows(head: (PieceType | null)[][], w = 6, h = 6): (PieceType | null)[][] {
  const rows: (PieceType | null)[][] = head.map((r) => [...r]);
  while (rows.length < h) {
    rows.push(Array(w).fill(null));
  }
  return rows;
}

function matchIncludes(matches: Set<{ x: number; y: number }>, x: number, y: number): boolean {
  for (const p of matches) {
    if (p.x === x && p.y === y) return true;
  }
  return false;
}

describe("piece rules", () => {
  it("ice is not swappable or matchable", () => {
    expect(canSwap(PieceType.Ice)).toBe(false);
    expect(isMatchable(PieceType.Ice)).toBe(false);
    expect(isMatchable(PieceType.Bomb)).toBe(true);
  });
});

describe("Matcher", () => {
  it("detects a horizontal match of three", () => {
    const board = boardFromRows(
      padRows([
        [PieceType.Water, PieceType.Fire, PieceType.Fire, PieceType.Fire, PieceType.Water, null],
      ]),
    );
    const matcher = new Matcher(board, testConfig());
    const matches = matcher.findAllMatches();
    expect(matches.size).toBe(3);
    expect(matchIncludes(matches, 1, 0)).toBe(true);
    expect(matchIncludes(matches, 2, 0)).toBe(true);
    expect(matchIncludes(matches, 3, 0)).toBe(true);
  });
});

describe("Game.trySwap", () => {
  it("rejects swap that does not create a match", () => {
    const game = gameFromRows(padRows([[PieceType.Fire, PieceType.Water, null, null, null, null]]));
    const before = game.Board.getPiece(gridPos(0, 0));
    const ok = game.trySwap(gridPos(0, 0), gridPos(1, 0));
    expect(ok).toBe(false);
    expect(game.Board.getPiece(gridPos(0, 0))).toBe(before);
  });

  it("rejects swap involving ice", () => {
    const game = gameFromRows(
      padRows([[PieceType.Ice, PieceType.Fire, PieceType.Fire, PieceType.Fire, null, null]]),
    );
    expect(game.trySwap(gridPos(0, 0), gridPos(1, 0))).toBe(false);
  });

  it("swap that forms a match is detected before elimination", () => {
    const board = boardFromRows(
      padRows([[PieceType.Water, PieceType.Fire, PieceType.Water, PieceType.Fire, PieceType.Fire, null]]),
    );
    board.swap(gridPos(1, 0), gridPos(2, 0));
    expect(new Matcher(board, testConfig()).findAllMatches().size).toBe(3);
  });
});

describe("scoring", () => {
  it("eliminator awards baseScore per cleared cell", () => {
    const board = boardFromRows(
      padRows([[PieceType.Fire, PieceType.Fire, PieceType.Fire, null, null, null]]),
    );
    const config = testConfig({ baseScore: 10 });
    const eliminator = new Eliminator(board, config);
    const points = eliminator.processMatches(new Matcher(board, config).findAllMatches());
    expect(points).toBe(30);
  });
});

describe("Eliminator", () => {
  it("clears adjacent ice when a neighbor matches", () => {
    const board = boardFromRows(
      padRows([[PieceType.Ice, PieceType.Fire, PieceType.Fire, PieceType.Fire, null, null]]),
    );
    const config = testConfig();
    const matcher = new Matcher(board, config);
    const eliminator = new Eliminator(board, config);
    eliminator.processMatches(matcher.findAllMatches());
    expect(board.getPiece(gridPos(0, 0))).not.toBe(PieceType.Ice);
  });

  it("bomb in a match triggers a 3x3 blast", () => {
    const rows = padRows([[PieceType.Bomb, PieceType.Bomb, PieceType.Bomb, null, null, null]]);
    const board = boardFromRows(rows);
    const config = testConfig();
    const matcher = new Matcher(board, config);
    const eliminator = new Eliminator(board, config);
    const points = eliminator.processMatches(matcher.findAllMatches());
    expect(board.getPiece(gridPos(0, 0))).not.toBe(PieceType.Bomb);
    expect(board.getPiece(gridPos(2, 0))).not.toBe(PieceType.Bomb);
    expect(points).toBeGreaterThan(30);
  });
});

describe("MoveFinder", () => {
  it("does not suggest swaps through ice", () => {
    const board = boardFromRows(
      padRows([[PieceType.Ice, PieceType.Water, PieceType.Fire, PieceType.Fire, PieceType.Water, null]]),
    );
    const finder = new MoveFinder(board, testConfig());
    const moves = finder.findAllValidMoves();
    expect(moves.some((m) => m.from.x === 0 && m.from.y === 0)).toBe(false);
    expect(moves.some((m) => m.to.x === 0 && m.to.y === 0)).toBe(false);
  });
});

describe("levelProgression", () => {
  it("grows board and element count by level", () => {
    const config = { ...DEFAULT_CONFIG };
    applyLevelToConfig(config, 1);
    expect(config.boardWidth).toBe(6);
    expect(config.elementTypes).toBe(3);

    applyLevelToConfig(config, 5);
    expect(config.boardWidth).toBe(8);
    expect(config.elementTypes).toBe(5);
    expect(config.levelTargetScore).toBe(400 + 5 * 350);
  });
});
