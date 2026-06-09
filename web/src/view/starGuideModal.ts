import {
  ASSIST_HALF_MAX,
  COMBO_FULL_THRESHOLD,
  COMBO_HALF_THRESHOLD,
  SCORE_FULL_RATIO,
} from "../core/levelStars";

export class StarGuideModal {
  private readonly overlay: HTMLElement;
  private readonly bodyEl: HTMLElement;
  private readonly closeBtn: HTMLButtonElement;
  private visible = false;

  constructor(root: HTMLElement) {
    this.overlay = root.querySelector("#star-guide-modal")!;
    this.bodyEl = root.querySelector("#star-guide-body")!;
    this.closeBtn = root.querySelector("#star-guide-close") as HTMLButtonElement;

    this.renderBody();
    this.closeBtn.addEventListener("click", () => this.hide());
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.hide();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.visible) this.hide();
    });
  }

  show(): void {
    this.visible = true;
    this.overlay.classList.remove("hidden");
    requestAnimationFrame(() => this.overlay.classList.add("visible"));
  }

  hide(): void {
    this.visible = false;
    this.overlay.classList.remove("visible");
    window.setTimeout(() => {
      if (!this.visible) this.overlay.classList.add("hidden");
    }, 320);
  }

  isVisible(): boolean {
    return this.visible;
  }

  private renderBody(): void {
    const scorePct = Math.round(SCORE_FULL_RATIO * 100);
    this.bodyEl.innerHTML = `
      <p class="star-guide-intro">
        每关最高 <strong>3 星</strong>，最小步进 <strong>0.5 星</strong>。
        三颗独立星星各计 0 / 0.5 / 1 分，相加为总分。
      </p>

      <section class="star-guide-section">
        <h3 class="star-guide-heading"><span aria-hidden="true">★</span> 第一星 · 通关表现</h3>
        <ul class="star-guide-list">
          <li><span class="star-guide-tag star-guide-tag--half">0.5</span>本关得分 ≥ 关卡目标分</li>
          <li><span class="star-guide-tag star-guide-tag--full">1</span>本关得分 ≥ 目标分 × ${scorePct}%</li>
        </ul>
      </section>

      <section class="star-guide-section">
        <h3 class="star-guide-heading"><span aria-hidden="true">★</span> 第二星 · 连击深度</h3>
        <p class="star-guide-note">「最高连击」= 本关任意一次交换后，连锁消除的峰值。</p>
        <ul class="star-guide-list">
          <li><span class="star-guide-tag star-guide-tag--none">0</span>最高连击 ≤ ${COMBO_HALF_THRESHOLD - 1}</li>
          <li><span class="star-guide-tag star-guide-tag--half">0.5</span>最高连击 ${COMBO_HALF_THRESHOLD} ~ ${COMBO_FULL_THRESHOLD - 1}</li>
          <li><span class="star-guide-tag star-guide-tag--full">1</span>最高连击 ≥ ${COMBO_FULL_THRESHOLD}</li>
        </ul>
      </section>

      <section class="star-guide-section">
        <h3 class="star-guide-heading"><span aria-hidden="true">★</span> 第三星 · 自主操作</h3>
        <p class="star-guide-note">提示与自动次数相加；教程中的操作不计入。</p>
        <ul class="star-guide-list">
          <li><span class="star-guide-tag star-guide-tag--full">1</span>提示 + 自动 = 0 次</li>
          <li><span class="star-guide-tag star-guide-tag--half">0.5</span>提示 + 自动 = 1 ~ ${ASSIST_HALF_MAX} 次</li>
          <li><span class="star-guide-tag star-guide-tag--none">0</span>提示 + 自动 ≥ ${ASSIST_HALF_MAX + 1} 次</li>
        </ul>
      </section>

      <section class="star-guide-section star-guide-section--tip">
        <h3 class="star-guide-heading">完美 3 星</h3>
        <p class="star-guide-tip">
          超额得分（≥${scorePct}%）+ 高连击（≥${COMBO_FULL_THRESHOLD}）+ 全程零辅助。
        </p>
      </section>
    `;
  }
}
