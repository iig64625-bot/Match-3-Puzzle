import { Board } from "./board";
import { Eliminator } from "./eliminator";
import { applyLevelToConfig } from "./levelProgression";
import { Matcher } from "./matcher";
import {
  canSwap,
  DEFAULT_CONFIG,
  GameConfig,
  GameStateType,
  GridPos,
  gridPosEquals,
} from "./types";

export class Game {
  private config: GameConfig;
  private readonly board: Board;
  private readonly matcher: Matcher;
  private readonly eliminator: Eliminator;

  state: GameStateType = GameStateType.Playing;
  score = 0;
  level = 1;
  totalScore = 0;

  constructor(
    config: GameConfig = DEFAULT_CONFIG,
    random: () => number = Math.random,
    board?: Board,
  ) {
    this.config = { ...config };
    this.board = board ?? new Board(random);
    this.matcher = new Matcher(this.board, this.config);
    this.eliminator = new Eliminator(this.board, this.config);
  }

  get Board(): Board {
    return this.board;
  }

  get Config(): GameConfig {
    return this.config;
  }

  getState(): GameStateType {
    return this.state;
  }

  initialize(): void {
    this.state = GameStateType.Playing;
    this.score = 0;
    this.level = 1;
    this.totalScore = 0;
    applyLevelToConfig(this.config, this.level);
    this.board.initializeForLevel(this.config, this.level);
  }

  trySwap(a: GridPos, b: GridPos): boolean {
    if (this.state !== GameStateType.Playing) return false;
    if (!this.board.isValid(a) || !this.board.isValid(b) || !isAdjacent(a, b)) {
      return false;
    }
    if (!canSwap(this.board.getPiece(a)) || !canSwap(this.board.getPiece(b))) {
      return false;
    }

    this.board.swap(a, b);

    if (this.matcher.findAllMatches().size === 0) {
      this.board.swap(a, b);
      return false;
    }

    this.state = GameStateType.Processing;
    this.processTurn();
    return true;
  }

  private processTurn(): void {
    while (true) {
      const matches = this.matcher.findAllMatches();
      if (matches.size === 0) break;
      const points = this.eliminator.processMatches(matches);
      this.addScore(points);
      if (this.state === GameStateType.LevelComplete) return;
    }

    if (this.score >= this.config.levelTargetScore) {
      this.completeLevel();
      return;
    }

    if (!this.matcher.hasValidMoves()) {
      this.state = GameStateType.GameOver;
      return;
    }

    this.state = GameStateType.Playing;
  }

  private addScore(points: number): void {
    this.score += points;
    this.totalScore += points;
    if (this.score >= this.config.levelTargetScore) {
      this.completeLevel();
    }
  }

  private completeLevel(): void {
    this.state = GameStateType.LevelComplete;
    this.level++;
    this.score = 0;
    applyLevelToConfig(this.config, this.level);
    this.board.initializeForLevel(this.config, this.level);
    this.state = GameStateType.Playing;
  }
}

function isAdjacent(a: GridPos, b: GridPos): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

export { gridPosEquals };
