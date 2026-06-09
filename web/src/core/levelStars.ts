export interface LevelRunStats {
  hintsUsed: number;
  autoUsed: number;
  maxCombo: number;
  levelScore: number;
  levelTargetScore: number;
}

export interface LevelStarSlots {
  /** 通关表现：达标半星，超额满分 */
  score: number;
  /** 连击深度：中等半星，高连击满分 */
  combo: number;
  /** 自主操作：少量辅助半星，零辅助满分 */
  skill: number;
}

export interface LevelStarResult {
  /** 0 ~ 3，步进 0.5 */
  stars: number;
  slots: LevelStarSlots;
}

/** 超额得分达到目标的该比例 → 第一星满分 */
export const SCORE_FULL_RATIO = 1.2;
/** 单次交换内 cascade 连击阈值 */
export const COMBO_HALF_THRESHOLD = 4;
export const COMBO_FULL_THRESHOLD = 7;
/** 提示 + 自动总次数 ≤ 该值 → 第三星半分（>0 时） */
export const ASSIST_HALF_MAX = 2;

function clampHalfStep(value: number): number {
  return Math.round(value * 2) / 2;
}

function scoreSlot(levelScore: number, target: number): number {
  if (levelScore >= target * SCORE_FULL_RATIO) return 1;
  if (levelScore >= target) return 0.5;
  return 0;
}

function comboSlot(maxCombo: number): number {
  if (maxCombo >= COMBO_FULL_THRESHOLD) return 1;
  if (maxCombo >= COMBO_HALF_THRESHOLD) return 0.5;
  return 0;
}

function skillSlot(hintsUsed: number, autoUsed: number): number {
  const total = hintsUsed + autoUsed;
  if (total === 0) return 1;
  if (total <= ASSIST_HALF_MAX) return 0.5;
  return 0;
}

export function calculateLevelStars(stats: LevelRunStats): LevelStarResult {
  const slots: LevelStarSlots = {
    score: scoreSlot(stats.levelScore, stats.levelTargetScore),
    combo: comboSlot(stats.maxCombo),
    skill: skillSlot(stats.hintsUsed, stats.autoUsed),
  };

  const stars = clampHalfStep(slots.score + slots.combo + slots.skill);

  return { stars, slots };
}

export function formatStarCount(stars: number): string {
  return Number.isInteger(stars) ? `${stars}` : stars.toFixed(1);
}
