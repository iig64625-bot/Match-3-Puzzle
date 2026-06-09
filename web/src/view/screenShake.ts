export class ScreenShake {
  private trauma = 0;

  constructor(private readonly target: HTMLElement) {}

  addTrauma(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  update(dt: number): void {
    if (this.trauma <= 0) {
      this.target.style.transform = "";
      return;
    }

    this.trauma = Math.max(0, this.trauma - dt * 2.8);
    const shake = this.trauma * this.trauma;
    const maxOffset = 10;
    const ox = (Math.random() * 2 - 1) * maxOffset * shake;
    const oy = (Math.random() * 2 - 1) * maxOffset * shake;
    this.target.style.transform = `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px)`;
  }

  reset(): void {
    this.trauma = 0;
    this.target.style.transform = "";
  }
}
