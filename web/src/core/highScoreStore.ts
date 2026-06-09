const STORAGE_KEY = "runemind_highscores";
const MAX_ENTRIES = 5;

export interface HighScoreEntry {
  score: number;
  level: number;
  date: string;
}

export function loadHighScores(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HighScoreEntry[];
    return parsed
      .sort((a, b) => b.score - a.score || b.level - a.level)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function tryAddHighScore(score: number, level: number): HighScoreEntry[] {
  const entries = loadHighScores();
  entries.push({ score, level, date: new Date().toISOString() });
  const sorted = entries
    .sort((a, b) => b.score - a.score || b.level - a.level)
    .slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  return sorted;
}
