import {
  PIECE_COLORS,
  PIECE_LABELS,
  PieceType,
} from "../core/types";
import { PIECE_INSET_RATIO, PIECE_VISUAL_FILL } from "./boardLayout";

export interface ImageTrim {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface LoadedPieceImage {
  image: HTMLImageElement;
  trim: ImageTrim;
}

/** false = 纯程序生成界面；true = 加载 public/assets 下的用户图片 */
export const USE_CUSTOM_ART = false;

const RUNE_PATHS: Partial<Record<PieceType, string>> = {
  [PieceType.Fire]: "/assets/runes/fire.png",
  [PieceType.Water]: "/assets/runes/water.png",
  [PieceType.Nature]: "/assets/runes/nature.png",
  [PieceType.Lightning]: "/assets/runes/lightning.png",
  [PieceType.Light]: "/assets/runes/light.png",
  [PieceType.Shadow]: "/assets/runes/shadow.png",
};

/** AI 生成的道具图，始终加载（不依赖 USE_CUSTOM_ART） */
const SPECIAL_PATHS: Partial<Record<PieceType, string>> = {
  [PieceType.Bomb]: "/assets/special/bomb.png",
  [PieceType.Ice]: "/assets/special/ice.png",
};

const BG_PATH = "/assets/bg_main.png";
const FRAME_PATH = "/assets/board_frame.png";

export class AssetLoader {
  readonly runes = new Map<PieceType, HTMLImageElement>();
  readonly specialPieces = new Map<PieceType, LoadedPieceImage>();
  background: HTMLImageElement | null = null;
  boardFrame: HTMLImageElement | null = null;
  private loaded = false;

  async loadAll(): Promise<void> {
    if (this.loaded) return;
    const loads: Promise<void>[] = [];

    for (const type of [PieceType.Bomb, PieceType.Ice]) {
      loads.push(
        loadOptionalImage(SPECIAL_PATHS[type]!).then((img) => {
          if (img) {
            this.specialPieces.set(type, {
              image: img,
              trim: computeOpaqueBounds(img),
            });
          }
        }),
      );
    }

    if (USE_CUSTOM_ART) {
      for (const type of [
        PieceType.Fire,
        PieceType.Water,
        PieceType.Nature,
        PieceType.Lightning,
        PieceType.Light,
        PieceType.Shadow,
      ]) {
        loads.push(
          loadOptionalImage(RUNE_PATHS[type]!).then((img) => {
            if (img) this.runes.set(type, img);
          }),
        );
      }

      loads.push(
        loadOptionalImage(BG_PATH).then((img) => {
          this.background = img;
        }),
      );

      loads.push(
        loadOptionalImage(FRAME_PATH).then((img) => {
          this.boardFrame = img;
        }),
      );
    }

    await Promise.all(loads);
    this.loaded = true;
  }

  getRune(type: PieceType): HTMLImageElement | undefined {
    return this.runes.get(type);
  }

  getSpecialPiece(type: PieceType): LoadedPieceImage | undefined {
    return this.specialPieces.get(type);
  }
}

function computeOpaqueBounds(image: HTMLImageElement, alphaThreshold = 12): ImageTrim {
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  if (!w || !h) return { sx: 0, sy: 0, sw: w, sh: h };

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { sx: 0, sy: 0, sw: w, sh: h };

  ctx.drawImage(image, 0, 0);
  const { data } = ctx.getImageData(0, 0, w, h);
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > alphaThreshold) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) return { sx: 0, sy: 0, sw: w, sh: h };
  return { sx: minX, sy: minY, sw: maxX - minX + 1, sh: maxY - minY + 1 };
}

/** 按不透明区域裁剪后缩放，尺寸与程序生成圆球一致 */
export function drawPieceImage(
  ctx: CanvasRenderingContext2D,
  loaded: LoadedPieceImage,
  target: { x: number; y: number; width: number; height: number },
  fillRatio = PIECE_VISUAL_FILL,
): void {
  const { image, trim } = loaded;
  if (!trim.sw || !trim.sh) return;

  const fitW = target.width * fillRatio;
  const fitH = target.height * fillRatio;
  const scale = Math.min(fitW / trim.sw, fitH / trim.sh);
  const dw = trim.sw * scale;
  const dh = trim.sh * scale;
  const dx = target.x + (target.width - dw) / 2;
  const dy = target.y + (target.height - dh) / 2;

  ctx.drawImage(image, trim.sx, trim.sy, trim.sw, trim.sh, dx, dy, dw, dh);
}

function loadOptionalImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * 1:1 贴合目标矩形：与用户素材和程序生成格子完全重合。
 * 在目标区域内等比居中，不超出程序给定的 piece 矩形。
 */
export function drawRuneExact(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  target: { x: number; y: number; width: number; height: number },
): void {
  const iw = image.naturalWidth;
  const ih = image.naturalHeight;
  if (!iw || !ih) return;

  const scale = Math.min(target.width / iw, target.height / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = target.x + (target.width - dw) / 2;
  const dy = target.y + (target.height - dh) / 2;

  ctx.drawImage(image, 0, 0, iw, ih, dx, dy, dw, dh);
}

/** 程序生成彩色棋子（无用户图时），与 drawRuneExact 使用同一 cell 区域 */
export function drawPieceFallback(
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  cell: { x: number; y: number; width: number; height: number },
  insetRatio = PIECE_INSET_RATIO,
): void {
  const inset = cell.width * insetRatio;
  const x = cell.x + inset;
  const y = cell.y + inset;
  const size = cell.width - inset * 2;

  const cx = x + size / 2;
  const cy = y + size / 2;
  const radius = size / 2;

  const gradient = ctx.createRadialGradient(
    cx - radius * 0.2,
    cy - radius * 0.2,
    radius * 0.1,
    cx,
    cy,
    radius,
  );
  gradient.addColorStop(0, lighten(PIECE_COLORS[type], 0.35));
  gradient.addColorStop(1, PIECE_COLORS[type]);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = size * 0.08;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * PIECE_VISUAL_FILL, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = `bold ${Math.floor(size * 0.22)}px Cinzel, Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const label =
    type === PieceType.Bomb
      ? "B"
      : type === PieceType.Ice
        ? "#"
        : (PIECE_LABELS[type]?.[0]?.toUpperCase() ?? "?");
  ctx.fillText(label, cx, cy);
}

function lighten(hex: string, amount: number): string {
  const rgb = hex.replace("#", "");
  const r = Math.min(255, parseInt(rgb.slice(0, 2), 16) + 255 * amount);
  const g = Math.min(255, parseInt(rgb.slice(2, 4), 16) + 255 * amount);
  const b = Math.min(255, parseInt(rgb.slice(4, 6), 16) + 255 * amount);
  return `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
}
