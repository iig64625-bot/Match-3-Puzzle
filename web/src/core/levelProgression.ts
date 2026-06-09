import { GameConfig } from "./types";

// 追踪连续成功关卡数
let successStreak = 0;
let lastLevelSuccess = true;

export function applyLevelToConfig(config: GameConfig, level: number): void {
  config.elementTypes = Math.min(3 + Math.floor((level - 1) / 2), config.maxElementTypes);
  config.boardWidth = 6;
  config.boardHeight = 6;

  // 动态目标分调整
  config.levelTargetScore = calculateAdaptiveTargetScore(level, lastLevelSuccess);
}

/**
 * 计算自适应目标分数
 * - 基础公式：400 + level × 350
 * - 上一关失败 → 降低 20%（给玩家喘息机会）
 * - 连续成功 3+ 关 → 提升 15%（增加挑战）
 */
export function calculateAdaptiveTargetScore(level: number, lastSuccess: boolean): number {
  const baseTarget = 400 + level * 350;

  if (!lastSuccess) {
    // 上一关失败，本关降难度
    return Math.floor(baseTarget * 0.8);
  }

  if (successStreak >= 3) {
    // 连续成功 3+，增加挑战
    return Math.floor(baseTarget * 1.15);
  }

  return baseTarget;
}

/**
 * 记录关卡完成状态（调用时机：过关时）
 */
export function recordLevelSuccess(level: number): void {
  lastLevelSuccess = true;
  successStreak++;
}

/**
 * 记录关卡失败状态（调用时机：游戏结束但未过关时）
 */
export function recordLevelFailure(level: number): void {
  lastLevelSuccess = false;
  successStreak = 0; // 重置连续成功计数
}

/**
 * 重置难度跟踪（调用时机：新游戏开始时）
 */
export function resetDifficultyTracking(): void {
  successStreak = 0;
  lastLevelSuccess = true;
}

/**
 * 获取当前连续成功的关卡数（UI 显示用）
 */
export function getSuccessStreak(): number {
  return successStreak;
}

export function iceCountForLevel(level: number): number {
  return Math.min(2 + Math.floor(level / 2), 14);
}
