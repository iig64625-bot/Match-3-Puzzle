import { BoardLayout } from "./boardLayout";
import { easeOutCubic, lerp } from "./easing";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
  scale: number;
}

export interface RingEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface ComboBanner {
  x: number;
  y: number;
  combo: number;
  life: number;
  maxLife: number;
  scale: number;
}

export interface ComboChain {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  life: number;
  maxLife: number;
  color: string;
}

export class EffectLayer {
  particles: Particle[] = [];
  floatTexts: FloatText[] = [];
  rings: RingEffect[] = [];
  comboBanners: ComboBanner[] = [];
  comboChains: ComboChain[] = [];

  private static readonly MAX_PARTICLES = 180;

  cellCenter(layout: BoardLayout, col: number, row: number): { cx: number; cy: number } {
    const cell = layout.cells[row]?.[col];
    if (!cell) return { cx: 0, cy: 0 };
    return {
      cx: cell.x + cell.width / 2,
      cy: cell.y + cell.height / 2,
    };
  }

  /** 基础爆裂 - 向外散射粒子 */
  burst(x: number, y: number, color: string, count = 10): void {
    const available = Math.max(0, EffectLayer.MAX_PARTICLES - this.particles.length);
    const toAdd = Math.min(count, available);

    for (let i = 0; i < toAdd; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        size: 3 + Math.random() * 4,
        color,
      });
    }
  }

  /** 连锁标记 - 根据连锁层数改变特效强度 */
  cascadeMarker(x: number, y: number, cascadeIndex: number): void {
    const intensity = 0.7 + cascadeIndex * 0.15;
    const scale = 1 + cascadeIndex * 0.1;

    // 连锁特效分层颜色
    const colors = ["#f5d78e", "#ffe566", "#ff9f43"];
    const color = colors[Math.min(cascadeIndex, 2)];

    // 发射更多粒子 + 环形波
    const particleCount = 8 + cascadeIndex * 4;
    this.ring(x, y, color, scale);
    this.burst(x, y, color, particleCount);
  }

  /** 冰块碎裂 - 尖锐、快速 */
  iceShatter(x: number, y: number): void {
    const available = Math.max(0, EffectLayer.MAX_PARTICLES - this.particles.length);
    const count = Math.min(20, available);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.15,
        size: 1 + Math.random() * 3,
        color: [
          "#9ad4f5",
          "#b8e8ff",
          "#d4f0ff",
        ][i % 3],
      });
    }
  }

  /** 炸弹爆炸 - 多层次、大规模 */
  bombRing(x: number, y: number, power = 1): void {
    // 多层环形波
    for (let layer = 0; layer < 3; layer++) {
      this.rings.push({
        x,
        y,
        radius: 8 + layer * 8,
        maxRadius: 56 + layer * 20,
        life: 0,
        maxLife: 0.45 + layer * 0.1,
        color: layer === 0 ? "#ff6b35" : layer === 1 ? "#ffd166" : "#ffad42",
      });
    }

    // 爆裂粒子分多层
    const available = Math.max(0, EffectLayer.MAX_PARTICLES - this.particles.length);

    // 第一层：明亮黄色
    const yellow = Math.min(16 * power, available);
    this.burst(x, y, "#ffd166", yellow);

    // 第二层：橙色
    const orange = Math.min(12 * power, available - this.particles.length);
    this.burst(x, y, "#ff6b35", orange);

    // 第三层：深红
    const red = Math.min(8 * power, available - this.particles.length);
    this.burst(x, y, "#ff4500", red);
  }

  /** 环形波纹 */
  ring(x: number, y: number, color: string, scale = 1): void {
    this.rings.push({
      x,
      y,
      radius: 8 * scale,
      maxRadius: 56 * scale,
      life: 0,
      maxLife: 0.45,
      color,
    });
  }

  /** 浮动分数文字 */
  addScoreText(x: number, y: number, points: number, combo: number): void {
    const text = combo > 1 ? `+${points} x${combo}` : `+${points}`;
    this.floatTexts.push({
      x,
      y,
      text,
      life: 0,
      maxLife: 0.9,
      color: combo > 1 ? "#ffe566" : "#f5d78e",
      scale: combo > 1 ? 1.15 : 1,
    });
  }

  /** Combo 里程碑横幅（x5, x10 等） */
  addComboBanner(x: number, y: number, combo: number): void {
    this.comboBanners.push({
      x,
      y,
      combo,
      life: 0,
      maxLife: 0.7,
      scale: 0,
    });
  }

  /** 添加连锁链接可视化（从一个消除位置指向下一个） */
  addComboChain(fromX: number, fromY: number, toX: number, toY: number): void {
    const colors = ["#f5d78e", "#ffe566", "#ff9f43"];
    const chainCount = this.comboChains.length;
    const color = colors[Math.min(chainCount, 2)];

    this.comboChains.push({
      fromX,
      fromY,
      toX,
      toY,
      life: 0,
      maxLife: 0.5,
      color,
    });
  }

  /** 粒子生命周期更新 */
  update(dt: number): void {
    // 更新粒子
    for (const p of this.particles) {
      p.life += dt;
      p.x += p.vx * dt * 60; // 基础速度 * 60fps
      p.vy += 9.8 * dt; // 重力加速度
      p.y += p.vy * dt * 60;
    }
    // 清理过期粒子
    this.particles = this.particles.filter((p) => p.life < p.maxLife);

    // 更新浮动文字
    for (const text of this.floatTexts) {
      text.life += dt;
      text.y -= 40 * dt; // 向上浮动
    }
    this.floatTexts = this.floatTexts.filter((t) => t.life < t.maxLife);

    // 更新环形波
    for (const ring of this.rings) {
      ring.life += dt;
    }
    this.rings = this.rings.filter((r) => r.life < r.maxLife);

    // 更新 Combo 横幅
    for (const banner of this.comboBanners) {
      banner.life += dt;
      // 0-0.3s: 放大
      if (banner.life < 0.3) {
        banner.scale = (banner.life / 0.3) * 1.2;
      } else {
        // 0.3-0.7s: 收缩 + 淡出
        banner.scale = 1.2 * (1 - (banner.life - 0.3) / 0.4);
      }
    }
    this.comboBanners = this.comboBanners.filter((b) => b.life < b.maxLife);

    // 更新链接
    for (const chain of this.comboChains) {
      chain.life += dt;
    }
    this.comboChains = this.comboChains.filter((c) => c.life < c.maxLife);
  }

  /** 绘制所有特效 */
  render(ctx: CanvasRenderingContext2D): void {
    // 绘制链接线（在环形波之前，背景层）
    for (const chain of this.comboChains) {
      const progress = chain.life / chain.maxLife;
      const alpha = (1 - progress) * 0.8;

      ctx.save();
      ctx.strokeStyle = chain.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // 绘制贝塞尔曲线，形成流畅的链接
      ctx.beginPath();
      ctx.moveTo(chain.fromX, chain.fromY);

      // 控制点在中间，制造弧形效果
      const midX = (chain.fromX + chain.toX) / 2;
      const midY = (chain.fromY + chain.toY) / 2;
      const offsetX = (chain.toY - chain.fromY) * 0.15;
      const offsetY = (chain.fromX - chain.toX) * 0.15;

      ctx.quadraticCurveTo(
        midX + offsetX,
        midY + offsetY,
        chain.toX,
        chain.toY
      );
      ctx.stroke();

      // 绘制箭头头部（指向方向）
      const angle = Math.atan2(chain.toY - chain.fromY, chain.toX - chain.fromX);
      const arrowSize = 8;
      ctx.fillStyle = chain.color;
      ctx.beginPath();
      ctx.moveTo(chain.toX, chain.toY);
      ctx.lineTo(
        chain.toX - arrowSize * Math.cos(angle - Math.PI / 6),
        chain.toY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        chain.toX - arrowSize * Math.cos(angle + Math.PI / 6),
        chain.toY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.fill();

      ctx.restore();
    }

    // 绘制环形波
    for (const ring of this.rings) {
      const progress = ring.life / ring.maxLife;
      const radius = lerp(ring.radius, ring.maxRadius, progress);
      const alpha = (1 - progress) * 0.7;

      ctx.strokeStyle = ring.color.replace(")", `, ${alpha})`).replace(/^#/, "rgba(");
      if (ring.color.startsWith("#")) {
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = alpha;
      }
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 绘制粒子
    for (const p of this.particles) {
      const progress = p.life / p.maxLife;
      const alpha = 1 - progress;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 绘制浮动文字
    for (const text of this.floatTexts) {
      const progress = text.life / text.maxLife;
      const alpha = Math.max(0, 1 - progress);
      const scale = text.scale + progress * 0.3;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = text.color;
      ctx.font = `bold ${16 * scale}px "Nunito", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text.text, text.x, text.y);
      ctx.restore();
    }

    // 绘制 Combo 横幅
    for (const banner of this.comboBanners) {
      const text = `x${banner.combo} COMBO!`;
      const progress = banner.life / banner.maxLife;
      const alpha = banner.scale > 0 ? Math.max(0, 1 - progress * 0.5) : 0;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ffe566";
      ctx.strokeStyle = "#f5d78e";
      ctx.lineWidth = 3;
      ctx.font = `bold ${28 * banner.scale}px "Cinzel", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // 描边（外边框）
      ctx.strokeText(text, banner.x, banner.y);
      // 填充
      ctx.fillText(text, banner.x, banner.y);

      ctx.restore();
    }
  }
}
