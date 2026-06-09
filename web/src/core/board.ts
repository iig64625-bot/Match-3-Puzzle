import { BoardData } from "./boardData";
import { iceCountForLevel } from "./levelProgression";
import { GameConfig, GridPos, PieceType, gridPos } from "./types";
import { Matcher } from "./matcher";

export class Board {
  private config: GameConfig;
  data: BoardData;
  private readonly random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
    this.config = {
      boardWidth: 1,
      boardHeight: 1,
      elementTypes: 4,
      minMatchCount: 3,
      baseScore: 10,
      levelTargetScore: 750,
      bombSpawnRate: 0.04,
      maxBoardSize: 10,
      maxElementTypes: 6,
    };
    this.data = new BoardData(1, 1);
  }

  get width(): number {
    return this.data.width;
  }

  get height(): number {
    return this.data.height;
  }

  initializeForLevel(config: GameConfig, level: number): void {
    this.config = { ...config };
    this.data = new BoardData(config.boardWidth, config.boardHeight);
    this.fillAllRandom();
    this.removeInitialMatches();
    this.placeIceCells(iceCountForLevel(level));
  }

  getPiece(pos: GridPos): PieceType {
    return this.data.get(pos);
  }

  setPiece(pos: GridPos, type: PieceType): void {
    this.data.set(pos, type);
  }

  clearCell(pos: GridPos): void {
    this.setPiece(pos, PieceType.None);
  }

  isValid(pos: GridPos): boolean {
    return this.data.isValid(pos);
  }

  createSnapshot(): Board {
    const snapshot = new Board(this.random);
    snapshot.loadSnapshot(this.data.clone(), this.config);
    return snapshot;
  }

  /** 测试/工具：从固定盘面构造棋盘（不随机填充） */
  static fromData(
    data: BoardData,
    config: GameConfig,
    random: () => number = () => 0,
  ): Board {
    const board = new Board(random);
    board.loadSnapshot(data, config);
    return board;
  }

  private loadSnapshot(data: BoardData, config: GameConfig): void {
    this.config = { ...config };
    this.data = data;
  }

  swap(a: GridPos, b: GridPos): void {
    const temp = this.getPiece(a);
    this.setPiece(a, this.getPiece(b));
    this.setPiece(b, temp);
  }

  applyGravity(): void {
    for (let x = 0; x < this.width; x++) {
      let writeY = this.height - 1;
      for (let y = this.height - 1; y >= 0; y--) {
        const pos = gridPos(x, y);
        const piece = this.getPiece(pos);
        if (piece === PieceType.None) continue;
        if (y !== writeY) {
          this.setPiece(gridPos(x, writeY), piece);
          this.setPiece(pos, PieceType.None);
        }
        writeY--;
      }
    }
  }

  fillEmpty(): void {
    this.fillEmptyRecorded();
  }

  fillEmptyRecorded(): import("./animSteps").SpawnCell[] {
    const spawns: import("./animSteps").SpawnCell[] = [];
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const pos = gridPos(x, y);
        if (this.getPiece(pos) === PieceType.None) {
          const piece = this.rollSpawnType();
          this.setPiece(pos, piece);
          spawns.push({ pos, piece });
        }
      }
    }
    return spawns;
  }

  placeIceCells(count: number): void {
    const candidates: GridPos[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const pos = gridPos(x, y);
        if (this.getPiece(pos) !== PieceType.Ice) candidates.push(pos);
      }
    }
    this.shuffle(candidates);
    const place = Math.min(count, candidates.length);
    for (let i = 0; i < place; i++) {
      this.setPiece(candidates[i], PieceType.Ice);
    }
  }

  private fillAllRandom(): void {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.setPiece(gridPos(x, y), this.rollSpawnType());
      }
    }
  }

  private rollSpawnType(): PieceType {
    if (this.random() < this.config.bombSpawnRate) return PieceType.Bomb;
    return Math.floor(this.random() * this.config.elementTypes) as PieceType;
  }

  private removeInitialMatches(): void {
    const matcher = new Matcher(this, this.config);
    let safety = this.width * this.height * 10;
    while (matcher.findAllMatches().size > 0 && safety-- > 0) {
      for (const pos of matcher.findAllMatches()) {
        this.setPiece(pos, Math.floor(this.random() * this.config.elementTypes) as PieceType);
      }
    }
  }

  private shuffle<T>(list: T[]): void {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }
}
