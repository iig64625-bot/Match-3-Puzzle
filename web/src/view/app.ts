import { Game } from "../core/game";
import { tryAddHighScore, loadHighScores } from "../core/highScoreStore";
import { GameStateType, GridPos, gridPosEquals } from "../core/types";
import { MoveFinder } from "../core/moveFinder";
import { AssetLoader } from "./assetLoader";
import { BoardView } from "./boardView";

export class App {
  private readonly game: Game;
  private moveFinder: MoveFinder;
  private readonly boardView: BoardView;
  private readonly canvas: HTMLCanvasElement;

  private selected: GridPos | null = null;
  private hintMove: { from: GridPos; to: GridPos } | null = null;
  private message = "";
  private lastRenderedLevel = 0;

  private readonly levelEl: HTMLElement;
  private readonly scoreEl: HTMLElement;
  private readonly movesEl: HTMLElement;
  private readonly statusEl: HTMLElement;

  private readonly leaderboardEl: HTMLElement;

  constructor(root: HTMLElement) {
    this.game = new Game();
    this.game.initialize();
    this.lastRenderedLevel = this.game.level;

    const assets = new AssetLoader();
    this.canvas = root.querySelector("#game-canvas") as HTMLCanvasElement;
    this.boardView = new BoardView(this.canvas, assets);

    this.moveFinder = new MoveFinder(this.game.Board, this.game.Config);

    this.levelEl = root.querySelector("#level-text")!;
    this.scoreEl = root.querySelector("#score-text")!;
    this.movesEl = root.querySelector("#moves-text")!;
    this.statusEl = root.querySelector("#status-text")!;
    this.leaderboardEl = root.querySelector("#leaderboard-text")!;

    this.renderLeaderboard();

    this.bindButtons(root);
    this.bindCanvas();
    this.bindResize();

    void assets.loadAll().then(() => {
      this.resizeCanvas();
      this.refresh();
    });
  }

  private bindButtons(root: HTMLElement): void {
    root.querySelector("#btn-hint")?.addEventListener("click", () => this.onHint());
    root.querySelector("#btn-auto")?.addEventListener("click", () => this.onAuto());
    root.querySelector("#btn-restart")?.addEventListener("click", () => this.onRestart());
  }

  private bindCanvas(): void {
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const pos = this.boardView.pixelToGrid(e.clientX - rect.left, e.clientY - rect.top);
      if (pos) this.onCellClick(pos);
    });
  }

  private bindResize(): void {
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    const wrap = this.canvas.parentElement!;
    const board = this.game.Board;
    this.boardView.resize(wrap.clientWidth, wrap.clientHeight, board.width, board.height);
    this.boardView.render(board);
  }

  private onCellClick(pos: GridPos): void {
    if (this.game.getState() !== GameStateType.Playing) return;

    this.hintMove = null;
    this.message = "";

    if (!this.selected) {
      this.selected = pos;
      this.boardView.setHighlight([pos]);
      this.refresh();
      return;
    }

    if (gridPosEquals(this.selected, pos)) {
      this.selected = null;
      this.boardView.clearHighlight();
      this.refresh();
      return;
    }

    const from = this.selected;
    const success = this.game.trySwap(from, pos);
    const finalState = this.game.getState();
    this.selected = null;
    this.boardView.clearHighlight();
    this.moveFinder = new MoveFinder(this.game.Board, this.game.Config);

    if (!success) {
      this.message = "Invalid swap — must be adjacent and create a match.";
    } else if (finalState === GameStateType.GameOver) {
      tryAddHighScore(this.game.totalScore, this.game.level);
      this.renderLeaderboard();
      this.message = `Game Over! Total ${this.game.totalScore}`;
    } else if (this.game.level > this.lastRenderedLevel) {
      this.message = `Level ${this.game.level - 1} complete!`;
    }

    this.refresh();
  }

  private onHint(): void {
    if (this.game.getState() !== GameStateType.Playing) return;

    const best = this.moveFinder.findBestMove();
    if (!best) {
      this.message = "No valid moves available.";
      this.boardView.clearHighlight();
      this.refresh();
      return;
    }

    this.hintMove = { from: best.from, to: best.to };
    this.selected = null;
    this.boardView.setHighlight([best.from, best.to]);
    this.message = `Hint: swap (${best.from.x},${best.from.y}) ↔ (${best.to.x},${best.to.y}) — ~${best.estimatedMatchCount} cells`;
    this.refresh();
  }

  private onAuto(): void {
    if (this.game.getState() !== GameStateType.Playing) return;

    const best = this.moveFinder.findBestMove();
    if (!best) {
      this.message = "No valid moves available.";
      this.refresh();
      return;
    }

    const success = this.game.trySwap(best.from, best.to);
    const finalState = this.game.getState();
    this.moveFinder = new MoveFinder(this.game.Board, this.game.Config);
    this.hintMove = null;
    this.selected = null;
    this.boardView.clearHighlight();

    if (!success) {
      this.message = "No valid moves available.";
      this.refresh();
      return;
    }

    if (finalState === GameStateType.GameOver) {
      tryAddHighScore(this.game.totalScore, this.game.level);
      this.renderLeaderboard();
      this.message = `Game Over! Total ${this.game.totalScore}`;
    } else if (this.game.level > this.lastRenderedLevel) {
      this.message = `Level ${this.game.level - 1} complete!`;
    } else {
      this.message = `Auto played: (${best.from.x},${best.from.y}) ↔ (${best.to.x},${best.to.y})`;
    }

    this.refresh();
  }

  private onRestart(): void {
    this.game.initialize();
    this.moveFinder = new MoveFinder(this.game.Board, this.game.Config);
    this.selected = null;
    this.hintMove = null;
    this.message = "";
    this.lastRenderedLevel = 0;
    this.boardView.clearHighlight();
    this.resizeCanvas();
    this.refresh();
  }

  private refresh(): void {
    const cfg = this.game.Config;
    const board = this.game.Board;
    this.levelEl.textContent = `Level ${this.game.level} · ${board.width}×${board.height} · ${cfg.elementTypes} runes`;
    this.scoreEl.textContent = `Goal ${this.game.score} / ${cfg.levelTargetScore}`;
    this.movesEl.textContent = `Total ${this.game.totalScore}`;

    if (this.game.getState() === GameStateType.GameOver) {
      this.statusEl.textContent = this.message || "No moves left — game over.";
    } else {
      this.statusEl.textContent = this.message;
    }

    this.resizeCanvas();
    this.lastRenderedLevel = this.game.level;
  }

  private renderLeaderboard(): void {
    const entries = loadHighScores();
    if (entries.length === 0) {
      this.leaderboardEl.textContent = "Best —";
      return;
    }
    const top = entries[0];
    this.leaderboardEl.textContent = `Best ${top.score} (Lv.${top.level})`;
  }
}
