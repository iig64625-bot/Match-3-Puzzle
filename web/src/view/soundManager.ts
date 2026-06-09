export type SfxId =
  | "select"
  | "swap"
  | "invalid"
  | "match"
  | "explode"
  | "ice"
  | "combo"
  | "land"
  | "levelUp"
  | "gameOver";

export class SoundManager {
  private ctx: AudioContext | null = null;
  private muted = false;

  get isMuted(): boolean {
    return this.muted;
  }

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  play(id: SfxId): void {
    if (this.muted || !this.ctx) return;
    if (this.ctx.state === "suspended") void this.ctx.resume();

    switch (id) {
      case "select":
        this.tone(520, 0.06, "sine", 0.05);
        break;
      case "swap":
        this.glide(340, 520, 0.1, "triangle", 0.06);
        break;
      case "invalid":
        this.tone(140, 0.14, "square", 0.05);
        this.tone(110, 0.12, "square", 0.04, 0.08);
        break;
      case "match":
        this.arpeggio([523, 659, 784], 0.07, 0.06);
        break;
      case "explode":
        this.playExplosion();
        break;
      case "ice":
        this.tone(880, 0.08, "sine", 0.05);
        this.tone(1320, 0.1, "triangle", 0.04, 0.05);
        break;
      case "combo":
        this.arpeggio([659, 784, 988, 1175], 0.06, 0.07);
        break;
      case "land":
        this.tone(220, 0.05, "sine", 0.035);
        break;
      case "levelUp":
        this.arpeggio([523, 659, 784, 1047], 0.1, 0.08);
        this.shimmer(0.35);
        break;
      case "gameOver":
        this.glide(392, 196, 0.35, "sine", 0.08);
        break;
    }
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    delay = 0,
  ): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  private glide(
    from: number,
    to: number,
    duration: number,
    type: OscillatorType,
    gain: number,
  ): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + duration);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  private arpeggio(freqs: number[], step: number, gain: number): void {
    freqs.forEach((f, i) => this.tone(f, step * 1.2, "sine", gain, i * step * 0.85));
  }

  private noiseBurst(duration: number, gain: number): void {
    const ctx = this.ctx!;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(g);
    g.connect(ctx.destination);
    src.start(t);
  }

  private shimmer(duration: number): void {
    for (let i = 0; i < 6; i++) {
      this.tone(1047 + i * 110, 0.06, "triangle", 0.025, 0.28 + i * 0.05);
    }
  }

  /** 爆炸：低频冲击 + 滤波噪声，与普通消除的上升琶音明显区分 */
  private playExplosion(): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;

    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = "sine";
    thump.frequency.setValueAtTime(220, t);
    thump.frequency.exponentialRampToValueAtTime(48, t + 0.28);
    thumpGain.gain.setValueAtTime(0.22, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    thump.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thump.start(t);
    thump.stop(t + 0.34);

    const crack = ctx.createOscillator();
    const crackGain = ctx.createGain();
    crack.type = "square";
    crack.frequency.setValueAtTime(140, t + 0.02);
    crack.frequency.exponentialRampToValueAtTime(55, t + 0.18);
    crackGain.gain.setValueAtTime(0.08, t + 0.02);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    crack.connect(crackGain);
    crackGain.connect(ctx.destination);
    crack.start(t + 0.02);
    crack.stop(t + 0.22);

    const noiseDur = 0.42;
    const bufferSize = Math.floor(ctx.sampleRate * noiseDur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = 1 - i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + noiseDur);
    filter.Q.value = 0.8;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + noiseDur);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);

    this.tone(660, 0.05, "triangle", 0.04, 0.06);
  }
}
