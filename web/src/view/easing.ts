export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}

export function easeInQuad(t: number): number {
  return t * t;
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** 重力下落 + 弹性反弹效果（模拟物理） */
export function dropWithBounce(t: number, bounceCount = 2): number {
  // 主线性下落
  let y = t;

  // 添加弹性反弹（模拟碰撞）
  for (let i = 0; i < bounceCount; i++) {
    // 每次反弹的振幅递减
    const bounceAmplitude = Math.pow(0.6, i);
    const bouncePhase = (t * 8 + i * 0.15) % 1;
    const bounceCurve = bounceAmplitude * Math.sin(bouncePhase * Math.PI) * 0.15;
    y += bounceCurve;
  }

  return Math.min(1, y);
}

/** Combo 里程碑触发时的"爆裂"缓动 */
export function comboBurst(t: number): number {
  // 0-0.3: 快速放大
  if (t < 0.3) {
    return easeOutBack(t / 0.3) * 0.5;
  }
  // 0.3-1: 逐渐收缩
  return 0.5 * (1 - (t - 0.3) / 0.7);
}

/** 销毁动画 - 收缩 + 旋转 */
export function destroyScale(t: number): number {
  return easeOutCubic(1 - t);
}

export function destroyRotation(t: number): number {
  return t * 720; // 旋转 2 圈（度数）
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
