import type { BitmapGlyphMetrics, CellGlyphMetric } from './types.ts';

export interface ComputeBitmapMetricsInput {
  readonly imageWidth: number;
  readonly imageHeight: number;
  readonly rgba: Uint8ClampedArray;
  readonly chars: readonly string[];
  readonly height: number;
  readonly ascent: number;
  /** True for grayscale PNG without alpha where luminance (r != 0) defines non-empty pixels. */
  readonly luminanceOnly?: boolean;
}

/**
 * Scans a glyph cell from rightmost column inward to find actualGlyphWidth
 * matching Mojang BitmapProvider$Definition.getActualGlyphWidth (26.3/client.jar).
 * Reference: docs/knowledge/font-dan-glyph.md §1A
 */
export function computeActualCellWidth(
  rgba: Uint8ClampedArray,
  imageWidth: number,
  cellX: number,
  cellY: number,
  cellW: number,
  cellH: number,
  luminanceOnly = false,
): number {
  for (let x = cellW - 1; x >= 0; x--) {
    const px = cellX + x;
    for (let y = 0; y < cellH; y++) {
      const py = cellY + y;
      const idx = (py * imageWidth + px) * 4;
      const isLit = luminanceOnly
        ? rgba[idx + 3]! !== 0 &&
          (rgba[idx]! | rgba[idx + 1]! | rgba[idx + 2]!) !== 0
        : rgba[idx + 3]! !== 0;
      if (isLit) {
        return x + 1;
      }
    }
  }
  return 0;
}

/**
 * Computes exact Mojang BitmapProvider$Definition & GlyphBitmap metrics:
 * - cellW = Math.floor(imageWidth / cols)
 * - cellH = Math.floor(imageHeight / rows)
 * - scale = height / cellH
 * - advance = Math.floor(0.5 + actualGlyphWidth * scale) + 1
 * - top = 7 - ascent
 * - bottom = top + height
 * Reference: docs/knowledge/font-dan-glyph.md §1A & §3
 */
export function computeBitmapMetrics(
  input: ComputeBitmapMetricsInput,
): BitmapGlyphMetrics | null {
  const rows = input.chars.length;
  if (rows === 0) return null;
  const firstRowCodepoints = Array.from(input.chars[0] ?? '');
  const cols = firstRowCodepoints.length;
  if (cols === 0) return null;
  if (input.imageWidth <= 0 || input.imageHeight <= 0) return null;

  const cellW = Math.floor(input.imageWidth / cols);
  const cellH = Math.floor(input.imageHeight / rows);
  if (cellW <= 0 || cellH <= 0) return null;

  const scale = input.height / cellH;
  const top = 7.0 - input.ascent;
  const bottom = top + input.height;

  const cells: CellGlyphMetric[] = [];
  for (let row = 0; row < rows; row++) {
    const rowChars = Array.from(input.chars[row] ?? '');
    for (let col = 0; col < Math.min(cols, rowChars.length); col++) {
      const ch = rowChars[col]!;
      const cp = ch.codePointAt(0) ?? 0;
      const actualGlyphWidth = computeActualCellWidth(
        input.rgba,
        input.imageWidth,
        col * cellW,
        row * cellH,
        cellW,
        cellH,
        input.luminanceOnly ?? false,
      );
      const advance = Math.floor(0.5 + actualGlyphWidth * scale) + 1;
      cells.push({
        row,
        col,
        codepoint: cp,
        char: ch,
        actualGlyphWidth,
        advance,
      });
    }
  }

  const firstVisible = cells.find((c) => c.codepoint !== 0) ?? cells[0];
  return {
    imageWidth: input.imageWidth,
    imageHeight: input.imageHeight,
    cols,
    rows,
    cellW,
    cellH,
    scale,
    top,
    bottom,
    primaryActualGlyphWidth: firstVisible?.actualGlyphWidth ?? 0,
    primaryAdvance: firstVisible?.advance ?? 1,
    cells,
  };
}

/**
 * Implements Mojang Window.calculateScale(int guiScaleOption, boolean forceUnicode).
 * Reference: docs/knowledge/font-dan-glyph.md §3
 */
export function calculateWindowGuiScale(
  guiScaleOption: number,
  forceUnicode: boolean,
  framebufferWidth = 1920,
  framebufferHeight = 1080,
): number {
  let scale = 1;
  while (
    scale !== guiScaleOption &&
    scale < framebufferWidth &&
    scale < framebufferHeight &&
    Math.floor(framebufferWidth / (scale + 1)) >= 320 &&
    Math.floor(framebufferHeight / (scale + 1)) >= 240
  ) {
    scale++;
  }
  if (forceUnicode && scale % 2 !== 0) {
    scale++;
  }
  return scale;
}

export interface SimulatedTokenRun {
  readonly char: string;
  readonly xStartFloat: number;
  readonly advance: number;
  readonly xEndFloat: number;
  readonly kind: 'bitmap' | 'space' | 'placeholder';
  readonly label: string;
}

/**
 * Accumulates cursor x using raw IEEE-754 float addition matching Font$PreparedTextBuilder.accept
 * and BakedSheetGlyph.render (no Math.round/Math.floor between glyphs).
 * Reference: docs/knowledge/font-dan-glyph.md §3
 */
export function simulateRawFloatCursorRuns(
  text: string,
  advanceByCodepoint: ReadonlyMap<
    number,
    { readonly advance: number; readonly kind: 'bitmap' | 'space'; readonly label: string }
  >,
  fallbackCharAdvance = 6,
): readonly SimulatedTokenRun[] {
  const runs: SimulatedTokenRun[] = [];
  let cursorX = 0;

  for (const ch of Array.from(text)) {
    const cp = ch.codePointAt(0) ?? 0;
    const mapped = advanceByCodepoint.get(cp);
    const advance = mapped ? mapped.advance : ch === ' ' ? 4 : fallbackCharAdvance;
    const xStartFloat = cursorX;
    cursorX = cursorX + advance;
    runs.push({
      char: ch,
      xStartFloat,
      advance,
      xEndFloat: cursorX,
      kind: mapped ? mapped.kind : 'placeholder',
      label: mapped ? mapped.label : ch,
    });
  }

  return runs;
}
