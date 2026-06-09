import { Game } from "../core/game";
import { tryAddHighScore, loadHighScores } from "../core/highScoreStore";
import { calculateLevelStars, formatStarCount } from "../core/levelStars";
import { tryUpdateLevelStars } from "../core/levelStarStore";
import { GameStateType, GridPos, PieceType, gridPosEquals } from "../core/types";
import { MoveFinder } from "../core/moveFinder";
import { resetDifficultyTracking } from "../core/levelProgression";
import { AssetLoader } from "./assetLoader";
import { BoardAnimator } from "./boardAnimator";
import { BoardView } from "./boardView";
import { LevelCompleteModal } from "./levelCompleteModal";
import { StarGuideModal } from "./starGuideModal";
import { ScreenShake } from "./screenShake";
import { SoundManager } from "./soundManager";
import { TutorialOverlay } from "./tutorialOverlay";
import { isTutorialDone } from "./tutorialStore";

export class App {
  private readonly game: Game;
  private moveFinder: MoveFinder;
  private readonly boardView: BoardView;
  private readonly animator: BoardAnimator;
  private readonly sound: SoundManager;
  private readonly screenShake: ScreenShake;
  private readonly levelModal: LevelCompleteModal;
  private readonly starGuide: StarGuideModal;
  private readonly tutorial: TutorialOverlay;
  private readonly canvas: HTMLCanvasElement;

  private selected: GridPos | null = null;
  private hintMove: { from: GridPos; to: GridPos } | null = null;
  private message = "";
  private lastRenderedLevel = 0;
  private animating = false;
  private pulseRaf = 0;
  private pulseT = 0;
  private displayScore = 0;
  private displayTotal = 0;
  private levelHintsUsed = 0;
  private levelAutoUsed = 0;
  private levelMaxCombo = 0;

  private readonly levelEl: HTMLElement;
  private readonly scoreEl: HTMLElement;
  private readonly movesEl: HTMLElement;
  private readonly statusEl: HTMLElement;
  private readonly leaderboardEl: HTMLElement;
  private readonly soundBtn: HTMLButtonElement;
  private readonly tutorialBtn: HTMLButtonElement;
  private readonly starGuideBtn: HTMLButtonElement;

  constructor(root: HTMLElement) {
    this.game = new Game();
    this.game.initialize();
    this.resetLevelStats();
    this.lastRenderedLevel = this.game.level;
    this.displayScore = this.game.score;
    this.displayTotal = this.game.totalScore;

    const assets = new AssetLoader();
    this.canvas = root.querySelector("#game-canvas") as HTMLCanvasElement;
    const boardWrap = root.querySelector(".board-wrap") as HTMLElement;
    this.boardView = new BoardView(this.canvas, assets);
    this.sound = new SoundManager();
    this.screenShake = new ScreenShake(boardWrap);
    this.animator = new BoardAnimator(this.boardView, this.sound, this.screenShake);
    this.animator.setGame(this.game);
    this.levelModal = new LevelCompleteModal(root);
    this.starGuide = new StarGuideModal(root);
    this.tutorial = new TutorialOverlay(root);

    this.moveFinder = new MoveFinder(this.game.Board, this.game.Config);

    this.levelEl = root.querySelector("#level-text")!;
    this.scoreEl = root.querySelector("#score-text")!;
    this.movesEl = root.querySelector("#moves-text")!;
    this.statusEl = root.querySelector("#status-text")!;
    this.leaderboardEl = root.querySelector("#leaderboard-text")!;
    this.soundBtn = root.querySelector("#btn-sound") as HTMLButtonElement;
    this.tutorialBtn = root.querySelector("#btn-tutorial") as HTMLButtonElement;
    this.starGuideBtn = root.querySelector("#btn-star-guide") as HTMLButtonElement;

    this.renderLeaderboard();

    this.bindButtons(root);
    this.bindCanvas();
    this.bindResize();
    this.bindSound();
    this.bindTutorial();
    this.bindStarGuide();

    void assets.loadAll().then(() => {
      this.resizeCanvas();
      this.refresh();
      if (!isTutorialDone()) {
        this.tutorial.start();
      }
    });
  }

  private bindStarGuide(): void {
    this.starGuideBtn.addEventListener("click", () => {
      this.unlockAudio();
      this.sound.play("select");
      if (this.starGuide.isVisible()) {
        this.starGuide.hide();
      } else {
        this.starGuide.show();
      }
    });
  }

  private bindTutorial(): void {
    this.tutorialBtn.addEventListener("click", () => {
      this.unlockAudio();
      this.sound.play("select");
      this.tutorial.start();
    });
  }

  private bindSound(): void {
    this.soundBtn.addEventListener("click", () => {
      this.sound.unlock();
      const muted = this.sound.toggleMute();
      this.soundBtn.textContent = muted ? "🔇" : "🔊";
      this.soundBtn.classList.toggle("muted", muted);
      if (!muted) this.sound.play("select");
    });
  }

  private unlockAudio(): void {
    this.sound.unlock();
  }

  private bindButtons(root: HTMLElement): void {
    root.querySelector("#btn-hint")?.addEventListener("click", () => {
      if (this.tutorial.isBlockingInput()) return;
      this.unlockAudio();
      this.onHint();
    });
    root.querySelector("#btn-auto")?.addEventListener("click", () => {
      if (this.tutorial.isBlockingInput()) return;
      this.unlockAudio();
      void this.onAuto();
    });
    root.querySelector("#btn-restart")?.addEventListener("click", () => {
      if (this.tutorial.isBlockingInput()) return;
      this.unlockAudio();
      this.onRestart();
    });
  }

  private bindCanvas(): void {
    this.canvas.addEventListener("click", (e) => {
      this.unlockAudio();
      if (this.animating || this.tutorial.isBlockingInput()) return;
      const rect = this.canvas.getBoundingClientRect();
      const pos = this.boardView.pixelToGrid(e.clientX - rect.left, e.clientY - rect.top);
      if (pos) void this.onCellClick(pos);
    });
  }

  private bindResize(): void {
    this.resizeCanvas();
    window.addEventListener("resize", () => {
      if (!this.animating) this.resizeCanvas();
    });
  }

  private resizeCanvas(): void {
    const wrap = this.canvas.parentElement!;
    const board = this.game.Board;
    this.boardView.resize(wrap.clientWidth, wrap.clientHeight, board.width, board.height);
    if (!this.animating) this.boardView.render(board);
  }

  private async onCellClick(pos: GridPos): Promise<void> {
    if (this.game.getState() !== GameStateType.Playing || this.animating) return;

    this.hintMove = null;
    this.message = "";

    if (!this.selected) {
      this.selected = pos;
      this.sound.play("select");
      this.boardView.setHighlight([pos]);
      this.startSelectionPulse();
      this.refreshHud();
      return;
    }

    if (gridPosEquals(this.selected, pos)) {
      this.selected = null;
      this.boardView.clearHighlight();
      this.stopSelectionPulse();
      this.refreshHud();
      return;
    }

    const from = this.selected;
    await this.playSwap(from, pos);
  }

  private notifyTutorialAction(action: "swap" | "hint" | "auto", success = true): void {
    if (this.tutorial.isWaitingPractice()) {
      this.tutorial.notifyPractice(action, success);
    }
  }

  private async playSwap(from: GridPos, to: GridPos): Promise<void> {
    const snapshot = this.game.Board.data.clone();
    const playback = this.game.trySwapWithSteps(from, to);
    const finalState = this.game.getState();

    this.selected = null;
    this.boardView.clearHighlight();
    this.stopSelectionPulse();
    this.moveFinder = new MoveFinder(this.game.Board, this.game.Config);

    if (!playback.success) {
      this.animating = true;
      this.animator.play(
        snapshot,
        playback.steps,
        {},
        () => {
          this.animating = false;
          this.message = "无效交换 — 需相邻且能形成三连。";
          this.boardView.render(this.game.Board);
          this.refreshHud();
          this.notifyTutorialAction("swap", false);
        },
      );
      return;
    }

    let levelCompleteMsg = "";
    this.animating = true;
    this.animator.play(
      snapshot,
      playback.steps,
      {
        onScore: (points, combo) => {
          this.levelMaxCombo = Math.max(this.levelMaxCombo, combo);
          this.displayScore = Math.min(
            this.game.Config.levelTargetScore,
            this.displayScore + points,
          );
          this.displayTotal += points;
          this.bumpScoreHud(combo > 1);
          this.refreshHud();
        },
        onLevelComplete: ({ level, levelScore, targetScore }) => {
          const completed = level - 1;
          const stats = {
            maxCombo: this.levelMaxCombo,
            hintsUsed: this.levelHintsUsed,
            autoUsed: this.levelAutoUsed,
          };
          const starResult = calculateLevelStars({
            hintsUsed: stats.hintsUsed,
            autoUsed: stats.autoUsed,
            maxCombo: stats.maxCombo,
            levelScore,
            levelTargetScore: targetScore,
          });
          tryUpdateLevelStars(completed, starResult.stars);
          levelCompleteMsg = `第 ${completed} 关完成！${formatStarCount(starResult.stars)} 星`;
          this.displayScore = 0;
          this.lastRenderedLevel = level;
          this.resetLevelStats();
          return this.levelModal.show(completed, level, starResult, stats);
        },
        onGameOver: () => {
          tryAddHighScore(this.game.totalScore, this.game.level);
          this.renderLeaderboard();
          this.message = `游戏结束！总分 ${this.game.totalScore}`;
        },
      },
      () => {
        this.animating = false;
        this.displayScore = this.game.score;
        this.displayTotal = this.game.totalScore;

        if (finalState === GameStateType.GameOver && !this.message) {
          tryAddHighScore(this.game.totalScore, this.game.level);
          this.renderLeaderboard();
          this.message = `游戏结束！总分 ${this.game.totalScore}`;
        } else if (levelCompleteMsg) {
          this.message = levelCompleteMsg;
        }

        this.resizeCanvas();
        this.boardView.render(this.game.Board);
        this.refreshHud();
        this.notifyTutorialAction("swap", true);
      },
    );
  }

  private onHint(): void {
    if (this.game.getState() !== GameStateType.Playing || this.animating) return;

    const best = this.moveFinder.findBestMove();
    if (!best) {
      this.message = "没有可用步数了。";
      this.boardView.clearHighlight();
      this.stopSelectionPulse();
      this.refreshHud();
      return;
    }

    this.hintMove = { from: best.from, to: best.to };
    if (!this.tutorial.isActive()) {
      this.levelHintsUsed++;
    }
    this.selected = null;
    this.sound.play("select");
    this.boardView.setHighlight([best.from, best.to]);
    this.startSelectionPulse();
    this.message = `提示：交换 (${best.from.x},${best.from.y}) ↔ (${best.to.x},${best.to.y})`;
    this.refreshHud();
    this.notifyTutorialAction("hint");
  }

  private async onAuto(): Promise<void> {
    if (this.game.getState() !== GameStateType.Playing || this.animating) return;

    const best = this.moveFinder.findBestMove();
    if (!best) {
      this.message = "没有可用步数了。";
      this.refreshHud();
      return;
    }

    if (!this.tutorial.isActive()) {
      this.levelAutoUsed++;
    }

    this.hintMove = null;
    await this.playSwap(best.from, best.to);
  }

  private onRestart(): void {
    this.animator.stop();
    this.levelModal.hide();
    this.tutorial.hide();
    this.screenShake.reset();
    this.stopSelectionPulse();
    this.animating = false;

    // 重置难度跟踪系统
    resetDifficultyTracking();

    this.game.initialize();
    this.moveFinder = new MoveFinder(this.game.Board, this.game.Config);
    this.resetLevelStats();
    this.selected = null;
    this.hintMove = null;
    this.message = "";
    this.lastRenderedLevel = this.game.level;
    this.displayScore = this.game.score;
    this.displayTotal = this.game.totalScore;
    this.boardView.clearHighlight();
    this.resizeCanvas();
    this.refreshHud();
  }

  private startSelectionPulse(): void {
    this.stopSelectionPulse();
    const tick = () => {
      this.pulseT += 0.08;
      if (!this.selected && !this.hintMove) return;
      const cells = this.selected
        ? [this.selected]
        : this.hintMove
          ? [this.hintMove.from, this.hintMove.to]
          : [];
      if (cells.length === 0) return;

      const board = this.game.Board;
      const pieces = [];
      for (let row = 0; row < board.height; row++) {
        for (let col = 0; col < board.width; col++) {
          const type = board.getPiece({ x: col, y: row });
          if (type === PieceType.None) continue;
          pieces.push({
            col,
            row,
            type,
            offsetX: 0,
            offsetY: 0,
            alpha: 1,
            scale: 1,
          });
        }
      }
      this.boardView.renderVisual({
        width: board.width,
        height: board.height,
        pieces,
        highlight: cells,
        pulseT: this.pulseT,
        levelFlash: 0,
      });
      this.pulseRaf = requestAnimationFrame(tick);
    };
    this.pulseRaf = requestAnimationFrame(tick);
  }

  private stopSelectionPulse(): void {
    if (this.pulseRaf) cancelAnimationFrame(this.pulseRaf);
    this.pulseRaf = 0;
    this.pulseT = 0;
  }

  private bumpScoreHud(big = false): void {
    this.scoreEl.classList.remove("score-bump", "score-bump-big");
    void this.scoreEl.offsetWidth;
    this.scoreEl.classList.add(big ? "score-bump-big" : "score-bump");
  }

  private refreshHud(): void {
    const cfg = this.game.Config;
    const board = this.game.Board;
    this.levelEl.textContent = `第 ${this.game.level} 关 · ${board.width}×${board.height} · ${cfg.elementTypes} 种符文`;
    this.scoreEl.textContent = `目标 ${this.displayScore} / ${cfg.levelTargetScore}`;
    this.movesEl.textContent = `总分 ${this.displayTotal}`;

    if (this.game.getState() === GameStateType.GameOver) {
      this.statusEl.textContent = this.message || "无步可走 — 游戏结束。";
    } else {
      this.statusEl.textContent = this.message;
    }

    this.lastRenderedLevel = this.game.level;
  }

  private refresh(): void {
    this.boardView.setDifficulty(this.game.level, this.game.Config.elementTypes);
    this.refreshHud();
    if (!this.animating) {
      this.resizeCanvas();
    }
  }

  private resetLevelStats(): void {
    this.levelHintsUsed = 0;
    this.levelAutoUsed = 0;
    this.levelMaxCombo = 0;
  }

  private renderLeaderboard(): void {
    const entries = loadHighScores();
    if (entries.length === 0) {
      this.leaderboardEl.textContent = "最高 —";
      return;
    }
    const top = entries[0];
    this.leaderboardEl.textContent = `最高 ${top.score} (第${top.level}关)`;
  }
}
