import { describe, expect, it } from "vitest";
import { calculateLevelStars, formatStarCount } from "./levelStars";

describe("calculateLevelStars", () => {
  it("awards 0.5 when barely passing with no combo and heavy assist", () => {
    const result = calculateLevelStars({
      hintsUsed: 2,
      autoUsed: 2,
      maxCombo: 2,
      levelScore: 760,
      levelTargetScore: 750,
    });
    expect(result.stars).toBe(0.5);
    expect(result.slots).toEqual({ score: 0.5, combo: 0, skill: 0 });
  });

  it("awards 1 star for pass + half combo", () => {
    const result = calculateLevelStars({
      hintsUsed: 3,
      autoUsed: 1,
      maxCombo: 5,
      levelScore: 800,
      levelTargetScore: 750,
    });
    expect(result.stars).toBe(1);
    expect(result.slots.score).toBe(0.5);
    expect(result.slots.combo).toBe(0.5);
    expect(result.slots.skill).toBe(0);
  });

  it("awards half skill star for limited assist", () => {
    const result = calculateLevelStars({
      hintsUsed: 0,
      autoUsed: 1,
      maxCombo: 3,
      levelScore: 800,
      levelTargetScore: 750,
    });
    expect(result.stars).toBe(1);
    expect(result.slots.skill).toBe(0.5);
  });

  it("awards full skill star with no assist", () => {
    const result = calculateLevelStars({
      hintsUsed: 0,
      autoUsed: 0,
      maxCombo: 3,
      levelScore: 800,
      levelTargetScore: 750,
    });
    expect(result.slots.skill).toBe(1);
  });

  it("awards 3 stars for excellent run", () => {
    const result = calculateLevelStars({
      hintsUsed: 0,
      autoUsed: 0,
      maxCombo: 8,
      levelScore: 1200,
      levelTargetScore: 750,
    });
    expect(result.stars).toBe(3);
    expect(result.slots).toEqual({ score: 1, combo: 1, skill: 1 });
  });

  it("awards 2.5 stars when auto was used once with strong combo and score", () => {
    const result = calculateLevelStars({
      hintsUsed: 0,
      autoUsed: 1,
      maxCombo: 7,
      levelScore: 1000,
      levelTargetScore: 750,
    });
    expect(result.stars).toBe(2.5);
    expect(result.slots).toEqual({ score: 1, combo: 1, skill: 0.5 });
  });

  it("awards full score star when exceeding target by 20%", () => {
    const result = calculateLevelStars({
      hintsUsed: 0,
      autoUsed: 0,
      maxCombo: 2,
      levelScore: 900,
      levelTargetScore: 750,
    });
    expect(result.slots.score).toBe(1);
  });
});

describe("formatStarCount", () => {
  it("formats integers without decimal", () => {
    expect(formatStarCount(2)).toBe("2");
  });

  it("formats half stars with one decimal", () => {
    expect(formatStarCount(2.5)).toBe("2.5");
  });
});
