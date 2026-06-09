import { markTutorialDone } from "./tutorialStore";
import { TUTORIAL_STEPS } from "./tutorialSteps";

export class TutorialOverlay {
  private readonly overlay: HTMLElement;
  private readonly card: HTMLElement;
  private readonly practiceHint: HTMLElement;
  private readonly stepLabel: HTMLElement;
  private readonly titleEl: HTMLElement;
  private readonly bodyEl: HTMLElement;
  private readonly tipsEl: HTMLElement;
  private readonly dotsEl: HTMLElement;
  private readonly btnSkip: HTMLButtonElement;
  private readonly btnPrev: HTMLButtonElement;
  private readonly btnNext: HTMLButtonElement;

  private index = 0;
  private active = false;
  private cardVisible = false;
  private waitingPractice: "swap" | "hint" | "auto" | null = null;
  private showingRetry = false;
  private onClose: (() => void) | null = null;

  constructor(root: HTMLElement) {
    this.overlay = root.querySelector("#tutorial-overlay")!;
    this.card = root.querySelector("#tutorial-card")!;
    this.practiceHint = root.querySelector("#tutorial-practice-hint")!;
    this.stepLabel = root.querySelector("#tutorial-step-label")!;
    this.titleEl = root.querySelector("#tutorial-title")!;
    this.bodyEl = root.querySelector("#tutorial-body")!;
    this.tipsEl = root.querySelector("#tutorial-tips")!;
    this.dotsEl = root.querySelector("#tutorial-dots")!;
    this.btnSkip = root.querySelector("#tutorial-skip") as HTMLButtonElement;
    this.btnPrev = root.querySelector("#tutorial-prev") as HTMLButtonElement;
    this.btnNext = root.querySelector("#tutorial-next") as HTMLButtonElement;

    this.btnSkip.addEventListener("click", () => this.finish());
    this.btnPrev.addEventListener("click", () => this.prev());
    this.btnNext.addEventListener("click", () => this.onNextClick());

    this.renderDots();
  }

  /** 教程进行中（含等待操作的阶段） */
  isActive(): boolean {
    return this.active;
  }

  /** 弹窗遮挡输入 */
  isBlockingInput(): boolean {
    return this.active && this.cardVisible;
  }

  /** 正在等待用户实际操作 */
  isWaitingPractice(): boolean {
    return this.active && this.waitingPractice !== null;
  }

  start(options: { onClose?: () => void } = {}): void {
    this.onClose = options.onClose ?? null;
    this.index = 0;
    this.active = true;
    this.waitingPractice = null;
    this.overlay.classList.remove("hidden", "practice-mode");
    this.practiceHint.classList.add("hidden");
    this.showCard();
  }

  finish(): void {
    if (!this.active) return;
    this.active = false;
    this.cardVisible = false;
    this.waitingPractice = null;
    this.showingRetry = false;
    markTutorialDone();
    this.overlay.classList.remove("visible", "practice-mode");
    window.setTimeout(() => {
      if (!this.active) this.overlay.classList.add("hidden");
    }, 220);
    this.practiceHint.classList.add("hidden");
    this.onClose?.();
    this.onClose = null;
  }

  hide(): void {
    this.finish();
  }

  notifyPractice(action: "swap" | "hint" | "auto", success = true): void {
    if (!this.active || this.waitingPractice !== action) return;

    if (!success) {
      this.showPracticeRetry(action);
      return;
    }

    this.waitingPractice = null;
    this.showingRetry = false;
    this.practiceHint.classList.add("hidden");
    this.overlay.classList.remove("practice-mode");
    this.advanceStep();
  }

  private showPracticeRetry(action: "swap" | "hint" | "auto"): void {
    const step = TUTORIAL_STEPS[this.index];
    const retry = step.practiceRetry;
    if (!retry) {
      this.practiceHint.textContent =
        action === "swap" ? "操作未成功，请再试一次" : step.practiceHint ?? "请再试一次";
      return;
    }

    this.showingRetry = true;
    this.stepLabel.textContent = "需要再试一次";
    this.titleEl.textContent = retry.title;
    this.bodyEl.textContent = retry.body;

    this.tipsEl.innerHTML = "";
    if (retry.tips?.length) {
      for (const tip of retry.tips) {
        const li = document.createElement("li");
        li.textContent = tip;
        this.tipsEl.appendChild(li);
      }
      this.tipsEl.hidden = false;
    } else {
      this.tipsEl.hidden = true;
    }

    this.btnPrev.disabled = false;
    this.btnNext.textContent = "再试试";
    this.showCard();
  }

  private onNextClick(): void {
    const step = TUTORIAL_STEPS[this.index];
    const isLast = this.index >= TUTORIAL_STEPS.length - 1;

    if (this.showingRetry && step.practice) {
      this.showingRetry = false;
      this.enterPractice(step.practice, step.practiceHint ?? "请按提示操作");
      return;
    }

    if (isLast) {
      this.finish();
      return;
    }

    if (step.practice && !this.waitingPractice) {
      this.enterPractice(step.practice, step.practiceHint ?? "请按提示操作");
      return;
    }

    this.advanceStep();
  }

  private enterPractice(action: "swap" | "hint" | "auto", hint: string): void {
    this.showingRetry = false;
    this.waitingPractice = action;
    this.hideCard();
    this.practiceHint.textContent = hint;
    this.practiceHint.classList.remove("hidden");
    this.overlay.classList.add("practice-mode");
  }

  private prev(): void {
    if (this.waitingPractice || this.showingRetry) {
      this.waitingPractice = null;
      this.showingRetry = false;
      this.practiceHint.classList.add("hidden");
      this.overlay.classList.remove("practice-mode");
      this.showCard();
      this.renderStep();
      return;
    }
    if (this.index <= 0) return;
    this.index--;
    this.showCard();
    this.renderStep();
  }

  private advanceStep(): void {
    if (this.index >= TUTORIAL_STEPS.length - 1) {
      this.finish();
      return;
    }
    this.index++;
    this.showCard();
    this.renderStep();
  }

  private showCard(): void {
    this.cardVisible = true;
    this.overlay.classList.remove("practice-mode");
    this.practiceHint.classList.add("hidden");
    requestAnimationFrame(() => this.overlay.classList.add("visible"));
    if (!this.showingRetry) this.renderStep();
  }

  private hideCard(): void {
    this.cardVisible = false;
    this.overlay.classList.remove("visible");
  }

  private renderDots(): void {
    this.dotsEl.innerHTML = "";
    TUTORIAL_STEPS.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "tutorial-dot";
      this.dotsEl.appendChild(dot);
      dot.classList.toggle("active", i === 0);
    });
  }

  private renderStep(): void {
    const step = TUTORIAL_STEPS[this.index];
    const total = TUTORIAL_STEPS.length;
    const isLast = this.index === total - 1;

    this.stepLabel.textContent = `${this.index + 1} / ${total}`;
    this.titleEl.textContent = step.title;
    this.bodyEl.textContent = step.body;

    this.tipsEl.innerHTML = "";
    if (step.tips?.length) {
      for (const tip of step.tips) {
        const li = document.createElement("li");
        li.textContent = tip;
        this.tipsEl.appendChild(li);
      }
      this.tipsEl.hidden = false;
    } else {
      this.tipsEl.hidden = true;
    }

    this.btnPrev.disabled = this.index === 0 && !this.waitingPractice;
    this.btnNext.textContent = step.practice && !this.waitingPractice
      ? "去试试"
      : isLast
        ? "开始游戏"
        : "下一步";

    this.dotsEl.querySelectorAll(".tutorial-dot").forEach((el, i) => {
      el.classList.toggle("active", i === this.index);
    });
  }
}
