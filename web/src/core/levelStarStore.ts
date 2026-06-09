const STORAGE_KEY = "runemind-level-stars-v1";

export function loadLevelStars(): Record<number, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    const out: Record<number, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const level = Number(key);
      if (Number.isFinite(level) && value >= 0 && value <= 3) {
        out[level] = Math.round(value * 2) / 2;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function tryUpdateLevelStars(level: number, stars: number): number {
  const all = loadLevelStars();
  const best = all[level] ?? 0;
  if (stars > best) {
    all[level] = stars;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return stars;
  }
  return best;
}

export function getBestStars(level: number): number {
  return loadLevelStars()[level] ?? 0;
}
