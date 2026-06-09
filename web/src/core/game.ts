import { AnimStep } from "./animSteps";
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

export interface SwapPlayback {
  steps: AnimStep[];
  success: boolean;
}

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
    return this.trySwapWithSteps(a, b).success;
  }

  trySwapWithSteps(a: GridPos, b: GridPos): SwapPlayback {
    const steps: AnimStep[] = [];
    if (this.state !== GameStateType.Playing) return { steps, success: false };
    if (!this.board.isValid(a) || !this.board.isValid(b) || !isAdjacent(a, b)) {
      return { steps, success: false };
    }
    if (!canSwap(this.board.getPiece(a)) || !canSwap(this.board.getPiece(b))) {
      return { steps, success: false };
    }

    this.board.swap(a, b);
    steps.push({ type: "swap", a, b });

    if (this.matcher.findAllMatches().size === 0) {
      this.board.swap(a, b);
      steps.length = 0;
      steps.push({ type: "shake", a, b });
      return { steps, success: false };
    }

    this.state = GameStateType.Processing;
    this.processTurnSteps(steps);
    return { steps, success: true };
  }

  private processTurn(): void {
    this.processTurnSteps([]);
  }

  private processTurnSteps(steps: AnimStep[]): void {
    let combo = 0;
    while (true) {
      const matches = this.matcher.findAllMatches();
      if (matches.size === 0) break;
      combo++;
      const resolution = this.eliminator.resolveMatches(matches);
      if (steps.length > 0) {
        steps.push({
          type: "clear",
          cells: resolution.cleared,
          pieces: resolution.pieces,
          hasBomb: resolution.hasBomb,
          iceCells: resolution.iceCells,
        });
        if (resolution.fallMoves.length > 0) {
          steps.push({ type: "fall", moves: resolution.fallMoves });
        }
        if (resolution.spawns.length > 0) {
          steps.push({ type: "spawn", spawns: resolution.spawns });
        }
        steps.push({ type: "score", points: resolution.points, combo });
      }
      const scoreResult = this.addScore(resolution.points);
      if (scoreResult.completed && steps.length > 0) {
        steps.push({
          type: "levelComplete",
          level: this.level,
          levelScore: scoreResult.levelScore!,
          targetScore: scoreResult.targetScore!,
        });
        return;
      }
    }

    if (!this.matcher.hasValidMoves()) {
      this.state = GameStateType.GameOver;
      if (steps.length > 0) steps.push({ type: "gameOver" });
      return;
    }

    this.state = GameStateType.Playing;
  }

  private addScore(points: number): {
    completed: boolean;
    levelScore?: number;
    targetScore?: number;
  } {
    this.score += points;
    this.totalScore += points;
    if (this.score >= this.config.levelTargetScore) {
      const levelScore = this.score;
      const targetScore = this.config.levelTargetScore;
      this.completeLevel();
      return { completed: true, levelScore, targetScore };
    }
    return { completed: false };
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
