import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { useInGamePreview } from '../app/composables/useInGamePreview.ts';
import { useWorkbenchStore } from '../app/stores/workbenchStore.ts';
import { setupWorkbenchTestingPinia } from './helpers/piniaTestHarness.ts';

describe('Studio Multi-Token Prefix Chaining', () => {
  beforeEach(() => {
    setupWorkbenchTestingPinia({ stubActions: false });
  });

  it('initializes single prefix token synchronized with default selected entry', () => {
    const store = useWorkbenchStore();
    const { getActivePrefixTokens } = useInGamePreview();

    expect(store.fontProject.prefixSequenceIds).toEqual(['rank-admin']);
    expect(store.selectedStudioEntryId).toBe('rank-admin');

    const tokens = getActivePrefixTokens();
    expect(tokens.length).toBe(1);
    expect(tokens[0]?.id).toBe('rank-admin');
    expect(tokens[0]?.kind).toBe('bitmap');
    expect(tokens[0]?.label).toContain('ADMIN');
    expect(tokens[0]?.raster).toBeDefined();
    expect(tokens[0]?.advance).toBeGreaterThan(0);
  });

  it('supports multi-token prefix chaining with space and multiple bitmap glyphs', () => {
    const store = useWorkbenchStore();
    const { getActivePrefixTokens } = useInGamePreview();

    // Add space and additional rank template
    store.addSpace(); // Creates space entry with advance -2
    store.addRankFromTemplate('crystal');

    const spaceEntry = store.fontProject.entries.find(
      (e) => e.kind === 'space' && e.id !== 'space-neg4',
    );
    const crystalEntry = store.fontProject.entries.find(
      (e) => e.kind === 'bitmap' && e.id.startsWith('rank-crystal'),
    );

    expect(spaceEntry).toBeDefined();
    expect(crystalEntry).toBeDefined();

    // Chain tokens: [Admin Badge] -> [Negative Space] -> [Crystal Badge]
    store.updateProject((prev) => ({
      ...prev,
      prefixSequenceIds: ['rank-admin', spaceEntry!.id, crystalEntry!.id],
    }));

    const tokens = getActivePrefixTokens();
    expect(tokens.length).toBe(3);

    // Token 1: Admin bitmap
    expect(tokens[0]?.id).toBe('rank-admin');
    expect(tokens[0]?.kind).toBe('bitmap');
    expect(tokens[0]?.raster).not.toBeNull();
    expect(tokens[0]?.advance).toBeGreaterThan(10);

    // Token 2: Space advance
    expect(tokens[1]?.id).toBe(spaceEntry!.id);
    expect(tokens[1]?.kind).toBe('space');
    expect(tokens[1]?.raster).toBeNull();
    expect(tokens[1]?.advance).toBe(-2);

    // Token 3: Crystal bitmap
    expect(tokens[2]?.id).toBe(crystalEntry!.id);
    expect(tokens[2]?.kind).toBe('bitmap');
    expect(tokens[2]?.raster).not.toBeNull();
    expect(tokens[2]?.advance).toBeGreaterThan(10);
  });

  it('calculates chained horizontal width respecting positive and negative glyph advances', () => {
    const store = useWorkbenchStore();
    const { getActivePrefixTokens } = useInGamePreview();

    store.addSpace();
    store.addRankFromTemplate('crystal');

    const spaceEntry = store.fontProject.entries.find(
      (e) => e.kind === 'space' && e.id !== 'space-neg4',
    );
    const crystalEntry = store.fontProject.entries.find(
      (e) => e.kind === 'bitmap' && e.id.startsWith('rank-crystal'),
    );

    expect(spaceEntry).toBeDefined();
    expect(crystalEntry).toBeDefined();

    store.updateProject((prev) => ({
      ...prev,
      prefixSequenceIds: ['rank-admin', spaceEntry!.id, crystalEntry!.id],
    }));

    const tokens = getActivePrefixTokens();
    expect(tokens.length).toBe(3);

    // Calculate composite layout width as done in renderInGameStrip
    const badgeH = 10;
    let chainW = 0;
    for (const token of tokens) {
      const tokenH = token.height || 9;
      const scale = badgeH / tokenH;
      if (token.kind === 'space') {
        chainW += token.advance * scale;
      } else if (token.kind === 'bitmap' && token.raster) {
        const rH = Math.max(1, token.raster.height);
        const drawH = badgeH;
        const drawW = Math.max(1, Math.round(token.raster.width * (drawH / rH)));
        const advancePx = token.advance ? Math.round(token.advance * scale) : drawW + 1;
        chainW += Math.max(drawW, advancePx);
      }
    }

    // Space advance of -2 should have reduced chain width by 2 * (10/8) = -2.5
    expect(chainW).toBeGreaterThan(20);
    // Chain width must be strictly less than unspaced sum of both bitmap badge advances
    const adminAdvance = tokens[0]?.advance ?? 0;
    const crystalAdvance = tokens[2]?.advance ?? 0;
    expect(chainW).toBeLessThan(adminAdvance * (badgeH / 9) + crystalAdvance * (badgeH / 9));
  });

  it('keeps prefix tokens synchronized when switching presets via solo selection', () => {
    const store = useWorkbenchStore();
    const { getActivePrefixTokens } = useInGamePreview();

    // Select different preset
    store.addRankFromTemplate('crystal');
    const crystalEntry = store.fontProject.entries.find(
      (e) => e.id.startsWith('rank-crystal'),
    );
    expect(crystalEntry).toBeDefined();

    // In single-token mode, setSoloPrefixEntry updates the token sequence
    store.setSoloPrefixEntry(crystalEntry!.id);
    expect(store.fontProject.prefixSequenceIds).toEqual([crystalEntry!.id]);

    const tokens = getActivePrefixTokens();
    expect(tokens.length).toBe(1);
    expect(tokens[0]?.id).toBe(crystalEntry!.id);
    expect(tokens[0]?.label).toContain('CRYSTAL');
  });

  it('falls back safely to default procedural badge when token list is empty or references deleted entry', () => {
    const store = useWorkbenchStore();
    const { getActivePrefixTokens, getActiveRankRaster } = useInGamePreview();

    // Clear prefix IDs and remove all entries
    store.updateProject((prev) => ({
      ...prev,
      entries: [],
      prefixSequenceIds: ['deleted-token-id'],
    }));
    store.selectedStudioEntryId = null;

    const tokens = getActivePrefixTokens();
    expect(tokens.length).toBe(1);
    expect(tokens[0]?.id).toBe('fallback-vip');
    expect(tokens[0]?.kind).toBe('bitmap');
    expect(tokens[0]?.raster).not.toBeNull();

    const raster = getActiveRankRaster();
    expect(raster).toBeDefined();
    expect(raster.width).toBeGreaterThan(0);
    expect(raster.height).toBeGreaterThan(0);
  });
});

describe('Inspector Properties Metrics Section Default Collapse', () => {
  const propertiesTabPath = path.resolve(
    process.cwd(),
    'app/components/studio/InspectorPropertiesTab.vue',
  );

  it('verifies metricsOpen is initialized to ref(false) for default collapsed state', () => {
    const content = fs.readFileSync(propertiesTabPath, 'utf8');

    // Must be ref(false) or ref<boolean>(false), NOT ref(true) or ref<boolean>(true)
    const metricsOpenMatch = content.match(/const\s+metricsOpen\s*=\s*ref(?:<boolean>)?\(([^)]+)\)/);
    expect(metricsOpenMatch).toBeTruthy();
    expect(metricsOpenMatch![1].trim()).toBe('false');
  });

  it('verifies CollapsibleTrigger header is clean and does not render redundant codepoint/ascent badge', () => {
    const content = fs.readFileSync(propertiesTabPath, 'utf8');

    // Trigger button should have the section title
    expect(content).toContain('<span>Metrik BitmapProvider</span>');

    // Redundant badge text in header trigger must be removed
    expect(content).not.toMatch(/displayedCodepoint\s*\|\|\s*['"]—['"]/);
    expect(content).not.toMatch(/store\.selectedEntry\.height\s*\}\}\s*\/\s*\{\{\s*store\.selectedEntry\.ascent/);
  });

  it('verifies SelectContent components inherit elevated styling and do not hardcode bg-card', () => {
    const inspectorFiles = [
      propertiesTabPath,
      path.resolve(
        process.cwd(),
        'app/components/studio/inspector/InspectorTextSection.vue',
      ),
      path.resolve(
        process.cwd(),
        'app/components/studio/inspector/InspectorFrameSection.vue',
      ),
    ];

    let totalMatches = 0;
    for (const file of inspectorFiles) {
      if (!fs.existsSync(file)) continue;
      const content = fs.readFileSync(file, 'utf8');
      const selectContentMatches = content.match(/<SelectContent[^>]*class="([^"]*)"/g);
      if (selectContentMatches) {
        totalMatches += selectContentMatches.length;
        for (const match of selectContentMatches) {
          expect(match).not.toContain('bg-card');
        }
      }
    }
    expect(totalMatches).toBeGreaterThan(0);
  });
});
