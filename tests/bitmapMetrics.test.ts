import { describe, expect, it } from 'vitest';
import {
  calculateWindowGuiScale,
  computeActualCellWidth,
  computeBitmapMetrics,
  simulateRawFloatCursorRuns,
} from '../src/core/font/bitmapMetrics.ts';
import {
  PIXEL_ICONS,
  applyPaintEditsToRaster,
  synthesizeRankRgba,
} from '../src/core/font/pixelSynth.ts';
import {
  createDefaultRankComposer,
  createInitialFontProject,
} from '../src/core/font/presets.ts';
import { makeSolidRectRgba } from './helpers/syntheticPng.ts';

describe('Mojang Bitmap Metrics, GUI Scale & Procedural Pixel Synth', () => {
  it('computes exact cellW, cellH, scale, actualGlyphWidth, advance, top, and bottom per BitmapProvider$Definition', () => {
    // 16x16 image with 2x2 grid -> cellW = 8, cellH = 8
    // Cell (0,0) has pixel up to column index 4 (width = 5 px)
    // Cell (0,1) has pixel up to column index 7 (width = 8 px)
    // height = 12, ascent = 8 -> scale = 12 / 8 = 1.5
    // Cell (0,0) advance = Math.floor(0.5 + 5 * 1.5) + 1 = Math.floor(8.0) + 1 = 9
    // Cell (0,1) advance = Math.floor(0.5 + 8 * 1.5) + 1 = Math.floor(12.5) + 1 = 13
    const rgba = makeSolidRectRgba(16, 16, [
      { x: 0, y: 1, w: 5, h: 4, rgba: [255, 255, 255, 255] },
      { x: 8, y: 0, w: 8, h: 6, rgba: [16, 185, 129, 255] },
    ]);

    const metrics = computeBitmapMetrics({
      imageWidth: 16,
      imageHeight: 16,
      rgba,
      chars: ['\uE200\uE201', '\uE202\u0000'],
      height: 12,
      ascent: 8,
    });

    expect(metrics).not.toBeNull();
    if (!metrics) return;

    expect(metrics.cellW).toBe(8);
    expect(metrics.cellH).toBe(8);
    expect(metrics.scale).toBe(1.5);
    expect(metrics.top).toBe(7 - 8);
    expect(metrics.bottom).toBe(-1 + 12);

    const c00 = metrics.cells[0]!;
    expect(c00.actualGlyphWidth).toBe(5);
    expect(c00.advance).toBe(9);

    const c01 = metrics.cells[1]!;
    expect(c01.actualGlyphWidth).toBe(8);
    expect(c01.advance).toBe(13);

    const c10 = metrics.cells[2]!;
    expect(c10.actualGlyphWidth).toBe(0);
    expect(c10.advance).toBe(1);
  });

  it('computes Window.calculateScale and raw float cursor accumulation without intermediate rounding', () => {
    expect(calculateWindowGuiScale(3, false, 1920, 1080)).toBe(3);
    // Force Unicode forces odd scale (3) up to even (4)
    expect(calculateWindowGuiScale(3, true, 1920, 1080)).toBe(4);
    // Small framebuffer caps scale so width/scale >= 320 and height/scale >= 240
    expect(calculateWindowGuiScale(4, false, 640, 480)).toBe(2);

    const advMap = new Map([
      [0xe200, { advance: 10.5, kind: 'bitmap' as const, label: 'Tag' }],
      [0xe201, { advance: -0.25, kind: 'space' as const, label: 'Space' }],
    ]);
    const runs = simulateRawFloatCursorRuns('\uE200\uE201A', advMap, 6);
    expect(runs[0]?.xStartFloat).toBe(0);
    expect(runs[0]?.xEndFloat).toBe(10.5);
    expect(runs[1]?.xStartFloat).toBe(10.5);
    expect(runs[1]?.xEndFloat).toBe(10.25);
    expect(runs[2]?.xStartFloat).toBe(10.25);
    expect(runs[2]?.xEndFloat).toBe(16.25);
  });

  it('synthesizes Rank Badge layers and applies freehand paint/eraser edits deterministically', () => {
    const composer = createDefaultRankComposer({
      text: 'VIP',
      iconId: 'crown',
      frameStyle: 'outline',
    });
    const raster = synthesizeRankRgba(
      composer,
      { frame: true, icon: true, text: true, shadow: true, paint: true },
      { '0,0': '#ff0000', '1,1': null },
    );

    expect(raster.width).toBeGreaterThan(10);
    expect(raster.height).toBeGreaterThanOrEqual(7);
    // Pixel (0,0) painted red by pencil edit
    expect(Array.from(raster.rgba.subarray(0, 4))).toEqual([255, 0, 0, 255]);
    // Pixel (1,1) erased to transparent by eraser edit
    const idx11 = (1 * raster.width + 1) * 4;
    expect(raster.rgba[idx11 + 3]).toBe(0);
  });

  it('computes luminanceOnly actualGlyphWidth accurately even with blue/non-red paintEdits', () => {
    const baseRgba = makeSolidRectRgba(8, 8, [
      { x: 0, y: 0, w: 8, h: 8, rgba: [0, 0, 0, 255] },
      { x: 0, y: 0, w: 3, h: 5, rgba: [255, 255, 255, 255] },
    ]);
    expect(computeActualCellWidth(baseRgba, 8, 0, 0, 8, 8, true)).toBe(3);

    const painted = applyPaintEditsToRaster(
      { width: 8, height: 8, rgba: baseRgba },
      { '6,2': '#0000ff' },
      true,
    );
    expect(computeActualCellWidth(painted.rgba, 8, 0, 0, 8, 8, true)).toBe(7);
  });

  it('validates all procedural PIXEL_ICONS dimensions and non-empty matrices (zero Mojang assets)', () => {
    expect(PIXEL_ICONS.length).toBeGreaterThanOrEqual(20);
    for (const icon of PIXEL_ICONS) {
      expect(icon.rows.length).toBe(icon.height);
      for (const row of icon.rows) {
        expect(row.length).toBe(icon.width);
      }
      if (icon.id !== 'none') {
        expect(icon.width).toBeGreaterThan(0);
        expect(icon.height).toBeGreaterThan(0);
        expect(icon.rows.some((r) => r.includes('#'))).toBe(true);
      }
    }
  });

  it('renders split-left layout with transparent separation gap between left icon and right rank box', () => {
    const splitComposer = createDefaultRankComposer({
      text: 'CONQ',
      iconId: 'helm',
      frameStyle: 'outline',
      badgeLayout: 'split-left',
      splitIconFrame: 'match',
      iconGap: 3,
      paddingX: 2,
      paddingY: 1,
    });
    const raster = synthesizeRankRgba(splitComposer, {
      frame: true,
      icon: true,
      text: true,
      shadow: true,
      paint: true,
    });

    // Left icon box width = 7 (helm) + 1 (shadow) + (2 pad + 1 border)*2 = 14 px (indices 0..13)
    // Separation gap = 3 px (indices 14, 15, 16) -> MUST be completely transparent (alpha === 0)
    for (let gapX = 14; gapX <= 16; gapX++) {
      for (let y = 0; y < raster.height; y++) {
        const idx = (y * raster.width + gapX) * 4;
        expect(raster.rgba[idx + 3], `gap column x=${gapX} y=${y}`).toBe(0);
      }
    }
    // Right rank box starts at x = 17 with outline border pixel
    const rightBoxTopLeftIdx = (0 * raster.width + 17) * 4;
    expect(raster.rgba[rightBoxTopLeftIdx + 3]).toBe(255);
  });

  it('renders split-left bare icon (splitIconFrame=none) without frame around icon while preserving rank frame on right', () => {
    const bareSplit = createDefaultRankComposer({
      text: 'VIP',
      iconId: 'crown',
      frameStyle: 'outline',
      badgeLayout: 'split-left',
      splitIconFrame: 'none',
      iconGap: 2,
      paddingX: 2,
      paddingY: 1,
    });
    const raster = synthesizeRankRgba(bareSplit, {
      frame: true,
      icon: true,
      text: true,
      shadow: true,
      paint: true,
    });

    // Top-left (0,0) around bare crown icon must remain transparent (no box frame)
    expect(raster.rgba[3]).toBe(0);
    // Separation gap columns x = 8, 9 (7px crown + 1px shadow = 8px) must be transparent
    for (let y = 0; y < raster.height; y++) {
      expect(raster.rgba[(y * raster.width + 8) * 4 + 3]).toBe(0);
      expect(raster.rgba[(y * raster.width + 9) * 4 + 3]).toBe(0);
    }
    // Right rank box starts at x = 10 with solid outline border
    expect(raster.rgba[10 * 4 + 3]).toBe(255);
  });

  it('respects custom layerOrder and per-layer opacity & offsetX/Y deterministically', () => {
    const composer = createDefaultRankComposer({
      text: 'A',
      iconId: 'none',
      frameStyle: 'none',
      textColor: '#ffffff',
      paddingX: 0,
      paddingY: 0,
    });

    // Put paint BEFORE text so text draws over paint
    const textOverPaint = synthesizeRankRgba(
      composer,
      { frame: false, icon: false, text: true, shadow: false, paint: true },
      { '1,0': '#ff0000' },
      { layerOrder: ['frame', 'shadow', 'icon', 'paint', 'text'] },
    );
    // 'A' 3x5 top-middle pixel at (1,0) is white (#ffffff) because text drew on top of paint
    expect(Array.from(textOverPaint.rgba.subarray(4, 8))).toEqual([255, 255, 255, 255]);

    // Put paint AFTER text -> pixel (1,0) becomes red (#ff0000)
    const paintOverText = synthesizeRankRgba(
      composer,
      { frame: false, icon: false, text: true, shadow: false, paint: true },
      { '1,0': '#ff0000' },
      { layerOrder: ['frame', 'shadow', 'icon', 'text', 'paint'] },
    );
    expect(Array.from(paintOverText.rgba.subarray(4, 8))).toEqual([255, 0, 0, 255]);

    // Opacity 0 hides text layer cleanly
    const hiddenText = synthesizeRankRgba(
      composer,
      { frame: false, icon: false, text: true, shadow: false, paint: false },
      {},
      { layerStyles: { text: { opacity: 0, offsetX: 0, offsetY: 0 } } },
    );
    expect(Array.from(hiddenText.rgba.subarray(4, 8))).toEqual([0, 0, 0, 0]);
  });

  it('includes Crystal, Ace, Glorious, Conqueror presets and updated P0TAT0D0G sample chat text', () => {
    const proj = createInitialFontProject();
    expect(proj.sampleChatText).toBe('P0TAT0D0G: Hi, thanks for using my tools!');
    const labels = proj.entries.map((e) => e.label);
    expect(labels).toContain('CRYSTAL');
    expect(labels).toContain('ACE');
    expect(labels).toContain('GLORIOUS');
    expect(labels).toContain('CONQUEROR');
  });

  it('balances vertical padding equally (2px top and 2px bottom) when drop shadow is enabled', () => {
    const composer = createDefaultRankComposer({
      text: 'I',
      iconId: 'none',
      frameStyle: 'outline',
      frameColor: '#111111',
      frameBorderColor: '#ef4444',
      textColor: '#ffffff',
      shadowColor: '#000000',
      paddingX: 2,
      paddingY: 1,
    });
    const raster = synthesizeRankRgba(composer, {
      frame: true,
      icon: false,
      text: true,
      shadow: true,
      paint: false,
    });

    // Outer border: y=0 and y=10 -> total height = 11
    // Above text (rows 1, 2) = 2px background; text rows 3..7 = 5px; below text (row 8 shadow + row 9 gap) = 2px
    expect(raster.height).toBe(11);
    const readPx = (x: number, y: number) => {
      const i = (y * raster.width + x) * 4;
      return [raster.rgba[i], raster.rgba[i + 1], raster.rgba[i + 2], raster.rgba[i + 3]];
    };
    const centerX = Math.floor(raster.width / 2);
    expect(readPx(centerX, 1)).toEqual([0x11, 0x11, 0x11, 255]);
    expect(readPx(centerX, 2)).toEqual([0x11, 0x11, 0x11, 255]);
    expect(readPx(centerX, 3)).toEqual([0xff, 0xff, 0xff, 255]);
    expect(readPx(centerX, 8)).toEqual([0x00, 0x00, 0x00, 255]);
    expect(readPx(centerX, 9)).toEqual([0x11, 0x11, 0x11, 255]);
  });

  it('supports bevel 3D frame and dynamic auto vs fixed canvas width', () => {
    const shortAuto = synthesizeRankRgba(
      createDefaultRankComposer({
        text: 'OK',
        iconId: 'none',
        frameStyle: 'bevel',
        canvasWidthMode: 'auto',
      }),
      { frame: true, icon: false, text: true, shadow: true, paint: false },
    );
    const longAuto = synthesizeRankRgba(
      createDefaultRankComposer({
        text: 'DEVELOPER',
        iconId: 'none',
        frameStyle: 'bevel',
        canvasWidthMode: 'auto',
      }),
      { frame: true, icon: false, text: true, shadow: true, paint: false },
    );
    const fixed = synthesizeRankRgba(
      createDefaultRankComposer({
        text: 'OK',
        iconId: 'none',
        frameStyle: 'bevel',
        canvasWidthMode: 'fixed',
        customWidth: 64,
      }),
      { frame: true, icon: false, text: true, shadow: true, paint: false },
    );

    expect(longAuto.width).toBeGreaterThan(shortAuto.width);
    expect(fixed.width).toBe(64);
    // Bevel corners stay transparent (0,0 alpha = 0)
    expect(shortAuto.rgba[3]).toBe(0);
  });
});
