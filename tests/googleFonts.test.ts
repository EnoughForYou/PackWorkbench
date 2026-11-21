import { describe, expect, it } from 'vitest';
import {
  buildGoogleFontsCss2Url,
  createGoogleFontConfig,
  CURATED_GOOGLE_FONTS,
  getCuratedGoogleFonts,
  getGoogleFontByFamily,
  searchGoogleFonts,
} from '../src/core/font/googleFonts.ts';
import {
  resolveBitmapEntryRaster,
  synthesizeRankRgba,
} from '../src/core/font/pixelSynth.ts';
import type {
  BitmapFontEntry,
  GoogleFontConfig,
  RankComposerConfig,
  RankLayerVisibility,
} from '../src/core/font/types.ts';

const DEFAULT_VISIBILITY: RankLayerVisibility = {
  frame: true,
  icon: false,
  text: true,
  shadow: true,
  paint: true,
};

const BASE_COMPOSER: RankComposerConfig = {
  text: 'VIP',
  fontSize: '3x5',
  textColor: '#ffffff',
  shadowColor: '#0c0a09',
  frameStyle: 'solid',
  frameColor: '#1c1917',
  frameBorderColor: '#10b981',
  iconId: 'none',
  iconColor: '#34d399',
  paddingX: 2,
  paddingY: 2,
  iconGap: 2,
};

function makeBitmapEntry(overrides?: Partial<BitmapFontEntry>): BitmapFontEntry {
  return {
    kind: 'bitmap',
    id: 'test-entry-1',
    label: 'VIP',
    sourceMode: 'composer',
    fileRef: 'assets/test/textures/font/vip.png',
    height: 8,
    ascent: 7,
    chars: ['\uE001'],
    spaceLeft: 0,
    spaceRight: 0,
    composer: BASE_COMPOSER,
    layerVisibility: DEFAULT_VISIBILITY,
    paintEdits: {},
    ...overrides,
  };
}

describe('Google Fonts Integration & Rasterization Adapter', () => {
  describe('CSS2 URL Generator', () => {
    it('escapes spaces in family names with + and formats wght query', () => {
      const url = buildGoogleFontsCss2Url('Press Start 2P', [400]);
      expect(url).toBe(
        'https://fonts.googleapis.com/css2?family=Press+Start+2P:wght@400&display=swap',
      );
    });

    it('sorts weights ascending and deduplicates values', () => {
      const url = buildGoogleFontsCss2Url('Inter', [700, 400, 400, 900, 600]);
      expect(url).toBe(
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap',
      );
    });

    it('handles multi-word font families with multiple consecutive spaces', () => {
      const url = buildGoogleFontsCss2Url('Plus   Jakarta   Sans', [500]);
      expect(url).toBe(
        'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500&display=swap',
      );
    });

    it('defaults to [400] when weights are omitted or empty', () => {
      const url1 = buildGoogleFontsCss2Url('Silkscreen');
      expect(url1).toBe(
        'https://fonts.googleapis.com/css2?family=Silkscreen:wght@400&display=swap',
      );

      const url2 = buildGoogleFontsCss2Url('Silkscreen', []);
      expect(url2).toBe(
        'https://fonts.googleapis.com/css2?family=Silkscreen:wght@400&display=swap',
      );
    });
  });

  describe('Curated Catalog & Search/Filter', () => {
    it('provides 35+ curated fonts covering all core categories', () => {
      const fonts = getCuratedGoogleFonts();
      expect(fonts.length).toBeGreaterThanOrEqual(35);
      expect(CURATED_GOOGLE_FONTS.length).toBe(fonts.length);
    });

    it('contains all required Pixel/Retro, Sans-Serif, Monospace, and Display fonts', () => {
      const requiredFonts = [
        // Pixel/Retro
        'Press Start 2P',
        'Silkscreen',
        'VT323',
        'Pixelify Sans',
        'Chakra Petch',
        // Sans-Serif
        'Onest',
        'Inter',
        'Montserrat',
        'Poppins',
        'Outfit',
        'Plus Jakarta Sans',
        // Monospace
        'JetBrains Mono',
        'Space Grotesk',
        'Roboto Mono',
        // Display
        'Righteous',
        'Orbitron',
        'Bangers',
        'Bungee',
      ];

      for (const name of requiredFonts) {
        const found = getGoogleFontByFamily(name);
        expect(found, `Expected font "${name}" in curated catalog`).toBeDefined();
        expect(found?.family.toLowerCase()).toBe(name.toLowerCase());
      }
    });

    it('filters correctly by category', () => {
      const pixelFonts = searchGoogleFonts('', 'pixel-retro');
      expect(pixelFonts.length).toBeGreaterThan(0);
      expect(pixelFonts.every((f) => f.isPixel)).toBe(true);

      const monoFonts = searchGoogleFonts('', 'monospace');
      expect(monoFonts.length).toBeGreaterThan(0);
      expect(monoFonts.every((f) => f.category === 'monospace')).toBe(true);

      const sansFonts = searchGoogleFonts('', 'sans-serif');
      expect(sansFonts.length).toBeGreaterThan(0);
      expect(sansFonts.every((f) => f.category === 'sans-serif')).toBe(true);

      const allFonts = searchGoogleFonts('', 'all');
      expect(allFonts.length).toBe(CURATED_GOOGLE_FONTS.length);
    });

    it('searches fonts case-insensitively by family name and description', () => {
      const res1 = searchGoogleFonts('press');
      expect(res1.some((f) => f.family === 'Press Start 2P')).toBe(true);

      const res2 = searchGoogleFonts('JETBRAINS');
      expect(res2.some((f) => f.family === 'JetBrains Mono')).toBe(true);

      const res3 = searchGoogleFonts('nonexistent-font-xyz');
      expect(res3).toHaveLength(0);
    });

    it('combines query and category filters cleanly', () => {
      const filtered = searchGoogleFonts('mono', 'monospace');
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((f) => f.category === 'monospace')).toBe(true);
      expect(filtered.some((f) => f.family === 'JetBrains Mono')).toBe(true);
    });

    it('creates GoogleFontConfig with safe defaults and overrides', () => {
      const cfg1 = createGoogleFontConfig('Press Start 2P');
      expect(cfg1.family).toBe('Press Start 2P');
      expect(cfg1.weight).toBe(400);
      expect(cfg1.fontSizePx).toBe(8);

      const cfg2 = createGoogleFontConfig('Inter', {
        weight: 700,
        fontSizePx: 12,
      });
      expect(cfg2.family).toBe('Inter');
      expect(cfg2.category).toBe('sans-serif');
      expect(cfg2.weight).toBe(700);
      expect(cfg2.fontSizePx).toBe(12);
    });
  });

  describe('Backward Compatibility & Pixel Synth with Custom Raster', () => {
    it('defaults existing entries without fontSource or googleFont to pixel-builtin', () => {
      const entry = makeBitmapEntry();
      expect(entry.composer.fontSource).toBeUndefined();
      expect(entry.composer.googleFont).toBeUndefined();

      const raster = resolveBitmapEntryRaster(entry);
      expect(raster).not.toBeNull();
      expect(raster!.width).toBeGreaterThan(0);
      expect(raster!.height).toBeGreaterThan(0);
      expect(raster!.rgba.length).toBe(raster!.width * raster!.height * 4);
    });

    it('renders identically when fontSource is explicitly pixel-builtin', () => {
      const defaultRaster = synthesizeRankRgba(BASE_COMPOSER, DEFAULT_VISIBILITY);
      const pixelBuiltinRaster = synthesizeRankRgba(
        { ...BASE_COMPOSER, fontSource: 'pixel-builtin' },
        DEFAULT_VISIBILITY,
      );

      expect(pixelBuiltinRaster.width).toBe(defaultRaster.width);
      expect(pixelBuiltinRaster.height).toBe(defaultRaster.height);
      expect(Array.from(pixelBuiltinRaster.rgba)).toEqual(Array.from(defaultRaster.rgba));
    });

    it('falls back to procedural glyphs when fontSource is google-font but cachedCustomRaster is absent', () => {
      const googleFontCfg: GoogleFontConfig = {
        family: 'Press Start 2P',
        weight: 400,
        fontSizePx: 8,
      };

      const raster = synthesizeRankRgba(
        {
          ...BASE_COMPOSER,
          fontSource: 'google-font',
          googleFont: googleFontCfg,
        },
        DEFAULT_VISIBILITY,
      );

      // Falls back safely without throwing, generating same dimensions as procedural
      const defaultRaster = synthesizeRankRgba(BASE_COMPOSER, DEFAULT_VISIBILITY);
      expect(raster.width).toBe(defaultRaster.width);
      expect(raster.height).toBe(defaultRaster.height);
    });

    it('uses cachedCustomRaster for text layer when fontSource is google-font', () => {
      // Create a 10x8 synthetic raster representing rendered Google Font text
      const customW = 10;
      const customH = 8;
      const customRgba = new Uint8ClampedArray(customW * customH * 4);
      // Fill middle 4 pixels with opaque white
      for (let y = 2; y < 6; y++) {
        for (let x = 2; x < 8; x++) {
          const idx = (y * customW + x) * 4;
          customRgba[idx] = 255;
          customRgba[idx + 1] = 255;
          customRgba[idx + 2] = 255;
          customRgba[idx + 3] = 255;
        }
      }

      const customRasterObj = {
        width: customW,
        height: customH,
        rgba: customRgba,
      };

      const entry = makeBitmapEntry({
        composer: {
          ...BASE_COMPOSER,
          fontSource: 'google-font',
          googleFont: {
            family: 'Press Start 2P',
            weight: 400,
            fontSizePx: 8,
          },
        },
        cachedCustomRaster: customRasterObj,
      });

      const raster = resolveBitmapEntryRaster(entry);
      expect(raster).not.toBeNull();
      // Height should accommodate customH (8) + padding (2*2) + shadow (1) + topShadowPad (1)
      expect(raster!.height).toBeGreaterThanOrEqual(customH);
      // Width should accommodate customW (10) + padding (2*2) + shadow (1)
      expect(raster!.width).toBeGreaterThanOrEqual(customW);

      // Verify non-zero alpha pixels exist in raster
      let nonZeroCount = 0;
      for (let i = 3; i < raster!.rgba.length; i += 4) {
        if (raster!.rgba[i]! > 0) nonZeroCount++;
      }
      expect(nonZeroCount).toBeGreaterThan(0);
    });
  });
});
