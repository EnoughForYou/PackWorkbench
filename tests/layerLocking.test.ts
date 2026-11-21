import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BitmapFontEntry, RankLayerId, RankLayerStyle } from '../src/core/font/types.ts';
import { useWorkbenchStore } from '../app/stores/workbenchStore.ts';
import { setupWorkbenchTestingPinia } from './helpers/piniaTestHarness.ts';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

// Logic mirror from InspectorLayersTab.vue
function getStyleFor(entry: BitmapFontEntry, id: RankLayerId): RankLayerStyle {
  const raw = entry.layerStyles?.[id];
  return {
    opacity: raw?.opacity ?? 100,
    offsetX: raw?.offsetX ?? 0,
    offsetY: raw?.offsetY ?? 0,
    locked: raw?.locked ?? false,
  };
}

function updateLayerStyleWithLockCheck(
  entry: BitmapFontEntry,
  id: RankLayerId,
  patch: Partial<RankLayerStyle>,
): BitmapFontEntry {
  const current = getStyleFor(entry, id);
  if (current.locked && patch.locked === undefined) {
    return entry;
  }
  return {
    ...entry,
    layerStyles: {
      ...entry.layerStyles,
      [id]: {
        ...current,
        ...patch,
      },
    },
  };
}

function toggleLayerLock(entry: BitmapFontEntry, id: RankLayerId): BitmapFontEntry {
  const current = getStyleFor(entry, id);
  return updateLayerStyleWithLockCheck(entry, id, { locked: !current.locked });
}

function deleteLayerWithLockCheck(
  entry: BitmapFontEntry,
  id: RankLayerId,
): { entry: BitmapFontEntry; success: boolean } {
  if (getStyleFor(entry, id).locked) {
    return { entry, success: false };
  }
  if (id === 'paint') {
    return {
      entry: { ...entry, paintEdits: {} },
      success: true,
    };
  }
  return {
    entry: {
      ...entry,
      layerVisibility: {
        ...entry.layerVisibility,
        [id]: false,
      },
    },
    success: true,
  };
}

describe('Phase 2: Layer Locking & Protection Engine', () => {
  beforeEach(() => {
    setupWorkbenchTestingPinia({ stubActions: false });
  });

  describe('Layer Locking State Toggle', () => {
    it('initializes layers as unlocked by default', () => {
      const store = useWorkbenchStore();
      const entry = store.selectedEntry as BitmapFontEntry;
      expect(entry).toBeDefined();
      expect(entry.kind).toBe('bitmap');

      const style = getStyleFor(entry, 'text');
      expect(style.locked).toBe(false);
    });

    it('toggles locked state from false to true and back to false', () => {
      const store = useWorkbenchStore();
      let entry = store.selectedEntry as BitmapFontEntry;

      // Lock 'text' layer
      entry = toggleLayerLock(entry, 'text');
      expect(getStyleFor(entry, 'text').locked).toBe(true);

      // Lock 'icon' layer
      entry = toggleLayerLock(entry, 'icon');
      expect(getStyleFor(entry, 'icon').locked).toBe(true);
      expect(getStyleFor(entry, 'text').locked).toBe(true);

      // Unlock 'text' layer
      entry = toggleLayerLock(entry, 'text');
      expect(getStyleFor(entry, 'text').locked).toBe(false);
      expect(getStyleFor(entry, 'icon').locked).toBe(true);
    });

    it('supports locking all 5 rank layer ids independently', () => {
      const store = useWorkbenchStore();
      let entry = store.selectedEntry as BitmapFontEntry;
      const layerIds: RankLayerId[] = ['frame', 'shadow', 'icon', 'text', 'paint'];

      for (const id of layerIds) {
        entry = toggleLayerLock(entry, id);
        expect(getStyleFor(entry, id).locked).toBe(true);
      }

      for (const id of layerIds) {
        entry = toggleLayerLock(entry, id);
        expect(getStyleFor(entry, id).locked).toBe(false);
      }
    });
  });

  describe('Locked Layer Offset & Modification Protection', () => {
    it('prevents offset X/Y changes when layer is locked', () => {
      const store = useWorkbenchStore();
      let entry = store.selectedEntry as BitmapFontEntry;

      // Initially unlocked: offset change succeeds
      entry = updateLayerStyleWithLockCheck(entry, 'frame', { offsetX: 3, offsetY: -2 });
      expect(getStyleFor(entry, 'frame').offsetX).toBe(3);
      expect(getStyleFor(entry, 'frame').offsetY).toBe(-2);

      // Lock the layer
      entry = toggleLayerLock(entry, 'frame');
      expect(getStyleFor(entry, 'frame').locked).toBe(true);

      // Attempt to modify offset while locked -> should be a no-op / rejected
      const attempted = updateLayerStyleWithLockCheck(entry, 'frame', { offsetX: 7, offsetY: 4 });
      expect(attempted).toBe(entry);
      expect(getStyleFor(attempted, 'frame').offsetX).toBe(3);
      expect(getStyleFor(attempted, 'frame').offsetY).toBe(-2);

      // Unlock and modify -> succeeds
      entry = toggleLayerLock(entry, 'frame');
      expect(getStyleFor(entry, 'frame').locked).toBe(false);
      entry = updateLayerStyleWithLockCheck(entry, 'frame', { offsetX: 7, offsetY: 4 });
      expect(getStyleFor(entry, 'frame').offsetX).toBe(7);
      expect(getStyleFor(entry, 'frame').offsetY).toBe(4);
    });

    it('prevents opacity modification when layer is locked', () => {
      const store = useWorkbenchStore();
      let entry = store.selectedEntry as BitmapFontEntry;

      // Lock 'shadow' layer
      entry = toggleLayerLock(entry, 'shadow');
      expect(getStyleFor(entry, 'shadow').locked).toBe(true);

      // Attempt opacity change -> rejected
      const attempted = updateLayerStyleWithLockCheck(entry, 'shadow', { opacity: 50 });
      expect(attempted).toBe(entry);
      expect(getStyleFor(attempted, 'shadow').opacity).toBe(100);
    });
  });

  describe('Locked Layer Deletion Protection', () => {
    it('prevents deletion or clearing of locked paint layer edits', () => {
      const store = useWorkbenchStore();
      let entry = store.selectedEntry as BitmapFontEntry;

      // Add a paint edit
      entry = { ...entry, paintEdits: { '2,2': '#ff0000', '3,3': '#00ff00' } };
      expect(Object.keys(entry.paintEdits).length).toBe(2);

      // Lock the 'paint' layer
      entry = toggleLayerLock(entry, 'paint');
      expect(getStyleFor(entry, 'paint').locked).toBe(true);

      // Attempt to delete/clear paint edits while locked -> fails
      const resLocked = deleteLayerWithLockCheck(entry, 'paint');
      expect(resLocked.success).toBe(false);
      expect(Object.keys(resLocked.entry.paintEdits).length).toBe(2);

      // Unlock the 'paint' layer
      entry = toggleLayerLock(entry, 'paint');
      expect(getStyleFor(entry, 'paint').locked).toBe(false);

      // Attempt to delete/clear paint edits when unlocked -> succeeds
      const resUnlocked = deleteLayerWithLockCheck(entry, 'paint');
      expect(resUnlocked.success).toBe(true);
      expect(Object.keys(resUnlocked.entry.paintEdits).length).toBe(0);
    });

    it('prevents visibility deletion of other locked layers', () => {
      const store = useWorkbenchStore();
      let entry = store.selectedEntry as BitmapFontEntry;

      // Lock 'icon' layer
      entry = toggleLayerLock(entry, 'icon');

      const resLocked = deleteLayerWithLockCheck(entry, 'icon');
      expect(resLocked.success).toBe(false);
      expect(resLocked.entry.layerVisibility.icon).toBe(true);

      // Unlock and delete -> succeeds
      entry = toggleLayerLock(entry, 'icon');
      const resUnlocked = deleteLayerWithLockCheck(entry, 'icon');
      expect(resUnlocked.success).toBe(true);
      expect(resUnlocked.entry.layerVisibility.icon).toBe(false);
    });
  });

  describe('InspectorLayersTab.vue Template Contract', () => {
    const layersTabPath = path.resolve(
      projectRoot,
      'app/components/studio/InspectorLayersTab.vue',
    );
    const content = fs.readFileSync(layersTabPath, 'utf8');

    it('imports faLock and faLockOpen from fontawesome free solid icons', () => {
      expect(content).toContain('faLock');
      expect(content).toContain('faLockOpen');
      expect(content).toContain('@fortawesome/free-solid-svg-icons');
    });

    it('renders lock/unlock toggle button with faLock and faLockOpen', () => {
      expect(content).toMatch(/toggleLayerLock\(layerId\)/);
      expect(content).toMatch(/:icon="[^"]*faLock[^"]*"/);
    });

    it('displays lock badge when layer is locked', () => {
      expect(content).toContain('data-testid="layer-lock-badge"');
      expect(content).toContain('Terkunci');
    });

    it('disables offset X and Y inputs when layer is locked', () => {
      expect(content).toMatch(/:id="`layer-ox-\$\{layerId\}`"[^>]*:disabled="getStyleFor\(store\.selectedEntry,\s*layerId\)\.locked"/);
      expect(content).toMatch(/:id="`layer-oy-\$\{layerId\}`"[^>]*:disabled="getStyleFor\(store\.selectedEntry,\s*layerId\)\.locked"/);
    });

    it('disables opacity slider and reset button when layer is locked', () => {
      expect(content).toMatch(/<Slider[^>]*:disabled="getStyleFor\(store\.selectedEntry,\s*layerId\)\.locked"/);
      expect(content).toMatch(/<Button[^>]*:disabled="getStyleFor\(store\.selectedEntry,\s*layerId\)\.locked"[^>]*@click="resetLayerStyle\(layerId\)"|<Button[^>]*@click="resetLayerStyle\(layerId\)"[^>]*:disabled="getStyleFor\(store\.selectedEntry,\s*layerId\)\.locked"/);
    });

    it('disables paintEdits deletion button when paint layer is locked', () => {
      expect(content).toMatch(/:disabled="getStyleFor\(store\.selectedEntry,\s*'paint'\)\.locked"/);
    });

    it('disables checkbox, move buttons, and reset order button when layers are locked', () => {
      expect(content).toContain(':disabled="getStyleFor(store.selectedEntry, layerId).locked"');
      expect(content).toContain(':draggable="!getStyleFor(store.selectedEntry, layerId).locked"');
      expect(content).toContain(':disabled="displayLayers.some((id) => getStyleFor(store.selectedEntry, id).locked)"');
    });
  });

  describe('Inspector Subcomponents Structure & TDZ Audit', () => {
    const subcomponents = [
      'app/components/studio/inspector/InspectorEntryHeader.vue',
      'app/components/studio/inspector/InspectorTextSection.vue',
      'app/components/studio/inspector/InspectorIconSection.vue',
      'app/components/studio/inspector/InspectorFrameSection.vue',
      'app/components/studio/inspector/InspectorMetricsSection.vue',
      'app/components/studio/InspectorPropertiesTab.vue',
      'app/components/studio/InspectorLayersTab.vue',
    ];

    it('verifies all 5 subcomponents and refactored tabs exist on disk', () => {
      for (const relPath of subcomponents) {
        const fullPath = path.resolve(projectRoot, relPath);
        expect(fs.existsSync(fullPath)).toBe(true);
      }
    });

    it('audits all inspector components for Temporal Dead Zone (TDZ) safety in watch/watchEffect', () => {
      for (const relPath of subcomponents) {
        const fullPath = path.resolve(projectRoot, relPath);
        const fileContent = fs.readFileSync(fullPath, 'utf8');

        // Extract <script> section
        const scriptMatch = fileContent.match(/<script[^>]*>([\s\S]*?)<\/script>/);
        expect(scriptMatch).toBeTruthy();
        const script = scriptMatch![1];

        // Gather all const/let declarations
        const declMap = new Map<string, number>();
        const declRegex = /^(?:export\s+)?(?:const|let)\s+([a-zA-Z0-9_$]+)\s*=/gm;
        let m: RegExpExecArray | null;
        while ((m = declRegex.exec(script)) !== null) {
          declMap.set(m[1], m.index);
        }

        // Look for immediate watch/watchEffect calls
        const watchRegex = /(?:watch|watchEffect)\s*\(\s*(?:\(\)\s*=>|\s*function|\s*\[)([\s\S]*?)\n\);/g;
        while ((m = watchRegex.exec(script)) !== null) {
          const callIndex = m.index;
          const body = m[0];
          for (const [name, declIndex] of declMap.entries()) {
            if (declIndex > callIndex && new RegExp('\\b' + name + '\\b').test(body)) {
              throw new Error(`TDZ violation in ${relPath}: variable '${name}' accessed before declaration`);
            }
          }
        }
      }
    });

    it('verifies InspectorPropertiesTab coordinates all subcomponents cleanly', () => {
      const coordinatorPath = path.resolve(
        projectRoot,
        'app/components/studio/InspectorPropertiesTab.vue',
      );
      const content = fs.readFileSync(coordinatorPath, 'utf8');

      expect(content).toContain('InspectorEntryHeader');
      expect(content).toContain('InspectorTextSection');
      expect(content).toContain('InspectorIconSection');
      expect(content).toContain('InspectorFrameSection');
      expect(content).toContain('InspectorMetricsSection');
      expect(content).toContain('!store.selectedEntry');
    });
  });
});
