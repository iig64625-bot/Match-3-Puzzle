import { AnimStep, posKey } from "../core/animSteps";
import { BoardData } from "../core/boardData";
import { PieceType, gridPos } from "../core/types";
import { Game } from "../core/game";
import { BoardView, PieceVisual } from "./boardView";
import {
  easeOutBack,
  easeOutCubic,
  dropWithBounce,
  destroyScale,
  destroyRotation,
  lerp,
} from "./easing";
import { EffectLayer } from "./effects";
import { ScreenShake } from "./screenShake";
import { SoundManager } from "./soundManager";
import { recordLevelSuccess, recordLevelFailure, getSuccessStreak } from "../core/levelProgression";

export interface AnimatorCallbacks {
  onScore?: (points: number, combo: number) => void;
  onLevelComplete?: (data: {
    level: number;
    levelScore: number;
    targetScore: number;
  }) => void | Promise<void>;
  onGameOver?: () => void;
}

export class BoardAnimator {
  private running = false;
  private rafId = 0;
  private readonly effects = new EffectLayer();
  private game: Game | null = null;

  constructor(
    private readonly boardView: BoardView,
    private readonly sound?: SoundManager,
    private readonly screenShake?: ScreenShake,
  ) {}

  get isRunning(): boolean {
    return this.running;
  }

  setGame(game: Game): void {
    this.game = game;
  }

  stop(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.running = false;
    this.effects.particles = [];
    this.effects.floatTexts = [];
    this.effects.rings = [];
    this.effects.comboBanners = [];
  }

  play(
    startData: BoardData,
    steps: AnimStep[],
    callbacks: AnimatorCallbacks,
    onDone: () => void,
  ): void {
    this.stop();
    this.running = true;

    const grid = cloneGrid(startData);
    let pulseT = 0;
    let levelFlash = 0;
    let lastClearCenterX = 0;
    let lastClearCenterY = 0;
    let shakePhase: {
      a: { x: number; y: number };
      b: { x: number; y: number };
      t: number;
      start: number;
    } | null = null;

    const pieceAnims = new Map<
      string,
      {
        offsetX: number;
        offsetY: number;
        alpha: number;
        scale: number;
        rotation: number;
      }
    >();

    const getAnim = (col: number, row: number) => {
      const key = posKey(gridPos(col, row));
      if (!pieceAnims.has(key)) {
        pieceAnims.set(key, {
          offsetX: 0,
          offsetY: 0,
          alpha: 1,
          scale: 1,
          rotation: 0,
        });
      }
      return pieceAnims.get(key)!;
    };

    const layout = this.boardView.getLayout();
    const cellStep = layout.cellSize + layout.spacing;

    const render = () => {
      pulseT += 0.05;
      if (levelFlash > 0) levelFlash = Math.max(0, levelFlash - 0.04);

      const pieces: PieceVisual[] = [];
      for (let row = 0; row < grid.height; row++) {
        for (let col = 0; col < grid.width; col++) {
          const type = grid.get(gridPos(col, row));
          if (type === PieceType.None) continue;
          const anim = getAnim(col, row);
          let { offsetX, offsetY } = anim;
          if (shakePhase) {
            const amp = 6 * (1 - shakePhase.t);
            if (col === shakePhase.a.x && row === shakePhase.a.y) offsetX -= amp;
            if (col === shakePhase.b.x && row === shakePhase.b.y) offsetX += amp;
          }
          pieces.push({
            col,
            row,
            type,
            offsetX,
            offsetY,
            alpha: anim.alpha,
            scale: anim.scale,
            rotation: anim.rotation,
          });
        }
      }

      this.boardView.renderVisual({
        width: grid.width,
        height: grid.height,
        pieces,
        highlight: [],
        pulseT,
        levelFlash,
        effects: this.effects,
      });
    };

    const frame = (dt: number) => {
      this.effects.update(dt);
      this.screenShake?.update(dt);
      if (shakePhase) {
        shakePhase.t = Math.min(1, (performance.now() - shakePhase.start) / 180);
        if (shakePhase.t >= 1) shakePhase = null;
      }
      render();
    };

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const start = performance.now();
        let last = start;
        const tick = (now: number) => {
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          frame(dt);
          if (now - start >= ms) resolve();
          else this.rafId = requestAnimationFrame(tick);
        };
        this.rafId = requestAnimationFrame(tick);
      });

    const tween = (
      duration: number,
      update: (t: number) => void,
      easing = easeOutCubic,
    ) =>
      new Promise<void>((resolve) => {
        const start = performance.now();
        let last = start;
        const tick = (now: number) => {
          const raw = Math.min(1, (now - start) / duration);
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          update(easing(raw));
          frame(dt);
          if (raw >= 1) resolve();
          else this.rafId = requestAnimationFrame(tick);
        };
        this.rafId = requestAnimationFrame(tick);
      });

    const run = async () => {
      try {
        for (const step of steps) {
          if (step.type === "swap") {
            this.sound?.play("swap");
            const { a, b } = step;
            const typeA = grid.get(a);
            const typeB = grid.get(b);
            grid.set(a, typeB);
            grid.set(b, typeA);

            const animA = getAnim(a.x, a.y);
            const animB = getAnim(b.x, b.y);
            const dx = (b.x - a.x) * cellStep;
            const dy = (b.y - a.y) * cellStep;

            await tween(180, (t) => {
              animA.offsetX = dx * t;
              animA.offsetY = dy * t;
              animB.offsetX = -dx * t;
              animB.offsetY = -dy * t;
            });

            animA.offsetX = animA.offsetY = animB.offsetX = animB.offsetY = 0;
            pieceAnims.delete(posKey(a));
            pieceAnims.delete(posKey(b));
          } else if (step.type === "shake") {
            this.sound?.play("invalid");
            this.screenShake?.addTrauma(0.25);
            shakePhase = { a: step.a, b: step.b, t: 0, start: performance.now() };
            await wait(180);
          } else if (step.type === "clear") {
            if (step.hasBomb) {
              this.sound?.play("explode");
              this.screenShake?.addTrauma(0.75);
            } else {
              this.sound?.play("match");
              // 消除数量越多，震动越强
              const shakeIntensity = Math.min(0.5, 0.15 + step.cells.length * 0.05);
              this.screenShake?.addTrauma(shakeIntensity);
            }
            if (step.iceCells.length > 0) this.sound?.play("ice");

            const centers: { x: number; y: number }[] = [];
            for (const pos of step.cells) {
              const piece = step.pieces[posKey(pos)] ?? grid.get(pos);
              const { cx, cy } = this.effects.cellCenter(layout, pos.x, pos.y);
              centers.push({ x: cx, y: cy });

              // 添加链接可视化（从上次消除位置 → 当前消除位置）
              if (lastClearCenterX !== 0 || lastClearCenterY !== 0) {
                this.effects.addComboChain(lastClearCenterX, lastClearCenterY, cx, cy);
              }

              const color =
                piece === PieceType.Bomb
                  ? "#ff6b35"
                  : piece === PieceType.Ice
                    ? "#b8e8ff"
                    : "#f5d78e";

              // 基础爆裂效果
              this.effects.burst(cx, cy, color, 8);

              if (piece === PieceType.Ice) this.effects.iceShatter(cx, cy);
              if (piece === PieceType.Bomb) this.effects.bombRing(cx, cy);
            }

            // 记录本次消除的中心位置，用于下一个连锁的链接
            if (centers.length > 0) {
              const midClear = centers[Math.floor(centers.length / 2)];
              lastClearCenterX = midClear.x;
              lastClearCenterY = midClear.y;
            }

            // 消除动画：收缩 + 旋转 + 淡出
            await tween(260, (t) => {
              for (const pos of step.cells) {
                const anim = getAnim(pos.x, pos.y);
                anim.scale = destroyScale(t);
                anim.rotation = destroyRotation(t);
                anim.alpha = 1 - t;
              }
            });

            for (const pos of step.cells) {
              grid.set(pos, PieceType.None);
              pieceAnims.delete(posKey(pos));
            }

            if (step.hasBomb && centers.length > 0) {
              const mid = centers[Math.floor(centers.length / 2)];
              this.effects.bombRing(mid.x, mid.y, 1.5);
            }
          } else if (step.type === "fall") {
            for (const move of step.moves) {
              grid.set(move.from, PieceType.None);
              grid.set(move.to, move.piece);
              const anim = getAnim(move.to.x, move.to.y);
              anim.offsetY = (move.from.y - move.to.y) * cellStep;
              pieceAnims.delete(posKey(move.from));
            }

            // 使用重力下落动画（有反弹感）
            await tween(260, (t) => {
              for (const move of step.moves) {
                const anim = getAnim(move.to.x, move.to.y);
                const startY = (move.from.y - move.to.y) * cellStep;
                // 使用 dropWithBounce 获得物理感
                anim.offsetY = startY * (1 - dropWithBounce(t, 2));
              }
            });

            for (const move of step.moves) {
              const anim = getAnim(move.to.x, move.to.y);
              anim.offsetY = 0;
            }
          } else if (step.type === "spawn") {
            for (const spawn of step.spawns) {
              grid.set(spawn.pos, spawn.piece);
              const anim = getAnim(spawn.pos.x, spawn.pos.y);
              anim.offsetY = -(spawn.pos.y + 1) * cellStep;
              anim.alpha = 0.6;
            }

            await tween(220, (t) => {
              for (const spawn of step.spawns) {
                const anim = getAnim(spawn.pos.x, spawn.pos.y);
                const startY = -(spawn.pos.y + 1) * cellStep;
                anim.offsetY = lerp(startY, 0, easeOutBack(t));
                anim.alpha = lerp(0.6, 1, t);
              }
            });

            for (const spawn of step.spawns) {
              const anim = getAnim(spawn.pos.x, spawn.pos.y);
              anim.offsetY = 0;
              anim.alpha = 1;
            }
            if (step.spawns.length > 0) this.sound?.play("land");
          } else if (step.type === "score") {
            const combo = step.combo;

            if (combo > 1) {
              this.sound?.play("combo");
              // Combo 越高，屏幕震动越强
              const shakeIntensity = 0.3 + Math.min(0.4, combo * 0.08);
              this.screenShake?.addTrauma(shakeIntensity);

              // Combo 里程碑（x5, x10, x15...）触发特殊反馈
              if (combo % 5 === 0) {
                // 屏幕全闪
                this.screenShake?.addTrauma(0.5);
                // 大量粒子爆裂
                const cx = layout.canvasW / 2;
                const cy = layout.canvasH * 0.42;
                this.effects.burst(cx, cy, "#ffe566", 32);
                this.effects.ring(cx, cy, "#ffe566", 1.5);
              }
            }

            callbacks.onScore?.(step.points, combo);
            const cx = layout.canvasW / 2;
            const cy = layout.canvasH * 0.42;

            this.effects.addScoreText(cx, cy, step.points, combo);

            // Combo 里程碑添加横幅
            if (combo > 1) {
              this.effects.addComboBanner(cx, cy, combo);
            }

            await wait(320);
          } else if (step.type === "levelComplete") {
            levelFlash = 1;
            this.sound?.play("levelUp");
            this.screenShake?.addTrauma(0.55);

            // 记录过关成功（用于难度调整）
            recordLevelSuccess(step.level);

            await Promise.resolve(
              callbacks.onLevelComplete?.({
                level: step.level,
                levelScore: step.levelScore,
                targetScore: step.targetScore,
              }),
            );
            await wait(400);
          } else if (step.type === "gameOver") {
            this.sound?.play("gameOver");
            this.screenShake?.addTrauma(0.4);

            // 记录游戏结束（失败，重置连续成功计数）
            recordLevelFailure(this.game?.level ?? 1);

            callbacks.onGameOver?.();
            await wait(400);
          }
        }

        await wait(80);
      } finally {
        this.screenShake?.reset();
        this.stop();
        onDone();
      }
    };

    void run();
  }
}

function cloneGrid(data: BoardData): BoardData {
  return data.clone();
}
