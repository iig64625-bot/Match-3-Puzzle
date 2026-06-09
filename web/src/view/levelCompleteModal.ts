import { formatStarCount, LevelStarResult } from "../core/levelStars";

export class LevelCompleteModal {
  private readonly overlay: HTMLElement;
  private readonly titleEl: HTMLElement;
  private readonly subEl: HTMLElement;
  private readonly starsEl: HTMLElement;
  private readonly btn: HTMLButtonElement;
  private timer = 0;

  constructor(root: HTMLElement) {
    this.overlay = root.querySelector("#level-modal")!;
    this.titleEl = root.querySelector("#level-modal-title")!;
    this.subEl = root.querySelector("#level-modal-sub")!;
    this.starsEl = root.querySelector("#level-modal-stars")!;
    this.btn = root.querySelector("#level-modal-btn") as HTMLButtonElement;
  }

  show(
    completedLevel: number,
    nextLevel: number,
    starResult: LevelStarResult,
    stats: { maxCombo: number; hintsUsed: number; autoUsed: number },
  ): Promise<void> {
    this.clearTimer();
    const starText = formatStarCount(starResult.stars);
    this.titleEl.textContent = `第 ${completedLevel} 关完成！`;
    this.renderStars(starResult.slots);
    this.subEl.textContent =
      `${starText} / 3 星 · 通关 ${formatStarCount(starResult.slots.score)} · 连击 ${formatStarCount(starResult.slots.combo)} · 自主 ${formatStarCount(starResult.slots.skill)}` +
      ` · 最高连击 x${stats.maxCombo} · 提示 ${stats.hintsUsed} · 自动 ${stats.autoUsed}` +
      (nextLevel > completedLevel ? ` · 进入第 ${nextLevel} 关` : "");
    this.overlay.classList.remove("hidden");
    this.starsEl.setAttribute("aria-label", `${starText} 星`);
    requestAnimationFrame(() => this.overlay.classList.add("visible"));

    return new Promise((resolve) => {
      const done = () => {
        this.clearTimer();
        this.btn.removeEventListener("click", done);
        this.hide();
        resolve();
      };

      this.btn.addEventListener("click", done);
      this.timer = window.setTimeout(done, 2800);
    });
  }

  hide(): void {
    this.clearTimer();
    this.overlay.classList.remove("visible");
    window.setTimeout(() => {
      if (!this.overlay.classList.contains("visible")) {
        this.overlay.classList.add("hidden");
      }
    }, 320);
  }

  private renderStars(slots: LevelStarResult["slots"]): void {
    this.starsEl.innerHTML = "";
    const fills = [slots.score, slots.combo, slots.skill];
    for (const fill of fills) {
      const star = document.createElement("span");
      star.className = "level-star";

      const bg = document.createElement("span");
      bg.className = "level-star__bg";
      bg.textContent = "★";
      bg.setAttribute("aria-hidden", "true");
      star.appendChild(bg);

      if (fill > 0) {
        const fillEl = document.createElement("span");
        fillEl.className =
          "level-star__fill" + (fill >= 1 ? " level-star__fill--full" : " level-star__fill--half");
        fillEl.textContent = "★";
        fillEl.setAttribute("aria-hidden", "true");
        star.appendChild(fillEl);
      }

      this.starsEl.appendChild(star);
    }
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = 0;
    }
  }
}
