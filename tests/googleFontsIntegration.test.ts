import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BitmapFontEntry, FontProject } from '../src/core/font/types.ts';
import {
  deserializeFontProject,
  serializeFontProject,
} from '../app/stores/workbenchStore.ts';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

describe('Google Fonts Integration & Raster Serialization Engine', () => {
  it('serializes and deserializes Uint8ClampedArray raster data without binary loss', () => {
    const rawBytes = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]);
    const sampleEntry: BitmapFontEntry = {
      id: 'entry-gfont-1',
      kind: 'bitmap',
      label: 'GFont Rank',
      codepointHex: 'E250',
      sourceMode: 'composer',
      fontSource: 'google',
      googleFontConfig: {
        family: 'Roboto',
        weight: '700',
        fontSizePx: 14,
        letterSpacingPx: 0,
        renderEngine: 'sharp',
      },
      cachedCustomRaster: {
        width: 3,
        height: 1,
        rgba: rawBytes,
      },
      composer: {
        text: 'TEST',
        pixelFont: '5x5',
        textColor: '#FFFFFF',
        shadowColor: '#3F3F3F',
        frameColor: '#1A1A1A',
        frameBorderColor: '#FFD700',
        iconColor: '#FFFFFF',
        layout: 'text-only',
        iconPosition: 'left',
        iconId: 'star',
        paddingX: 2,
        paddingY: 1,
      },
      layerVisibility: {
        frame: true,
        icon: false,
        text: true,
        shadow: true,
        paint: true,
      },
      layerStyles: {},
      layerOrder: ['frame', 'icon', 'text', 'shadow', 'paint'],
      paintEdits: {},
      dimensions: { width: 3, height: 1 },
      spaceAdvance: 4,
    };

    const project: FontProject = {
      version: 1,
      targetVersion: '1.21.4',
      namespace: 'custom',
      fontPath: 'font/default.json',
      texturePath: 'font/default.png',
      entries: [sampleEntry],
      selectedEntryId: 'entry-gfont-1',
    };

    const json = serializeFontProject(project);
    expect(json).toContain('__type');
    expect(json).toContain('Uint8ClampedArray');

    const restored = deserializeFontProject(json);
    expect(restored).not.toBeNull();
    const restoredEntry = restored!.entries[0] as BitmapFontEntry;
    expect(restoredEntry.fontSource).toBe('google');
    expect(restoredEntry.googleFontConfig?.family).toBe('Roboto');
    expect(restoredEntry.googleFontConfig?.weight).toBe('700');
    expect(restoredEntry.cachedCustomRaster).toBeDefined();
    expect(restoredEntry.cachedCustomRaster!.rgba).toBeInstanceOf(Uint8ClampedArray);
    expect(Array.from(restoredEntry.cachedCustomRaster!.rgba)).toEqual(Array.from(rawBytes));
  });

  it('verifies CSS tokens contain Wappalyzer detection signatures for shadcn and Radix UI', () => {
    const cssPath = path.resolve(projectRoot, 'app/assets/css/tailwind.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    // Wappalyzer checks for --destructive-foreground to detect shadcn/ui
    expect(css).toContain('--destructive-foreground');
    // Radix compatibility tokens
    expect(css).toContain('--radix-accordion-content-height');
    expect(css).toContain('--radix-tooltip-content-transform-origin');
  });

  it('verifies GoogleFontPicker is mounted and connected in InspectorTextSection.vue', () => {
    const sectionPath = path.resolve(
      projectRoot,
      'app/components/studio/inspector/InspectorTextSection.vue',
    );
    const content = fs.readFileSync(sectionPath, 'utf8');

    expect(content).toContain('GoogleFontPicker');
    expect(content).toContain('useFontRasterizer');
    expect(content).toContain('rasterizeText');
    expect(content).toContain('isFontLoading');
    expect(content).toContain('lastRasterError');
  });
});
