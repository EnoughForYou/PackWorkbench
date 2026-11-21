import { beforeEach, describe, expect, it } from 'vitest';
import { encodeRgbaPng } from '../src/core/font/pngCodec.ts';
import { createUploadedPngEntry } from '../src/core/font/presets.ts';
import { useWorkbenchStore } from '../app/stores/workbenchStore.ts';
import { setupWorkbenchTestingPinia } from './helpers/piniaTestHarness.ts';

describe('Pinia Integration - useWorkbenchStore', () => {
  beforeEach(() => {
    // Fresh isolated Pinia instance for each test powered by @pinia/testing with Vitest spy tracking
    setupWorkbenchTestingPinia({ stubActions: false });
  });

  it('initializes store with default initial state and active Pinia instance', () => {
    const store = useWorkbenchStore();
    expect(store).toBeDefined();
    expect(store.studioMode).toBe('font');
    expect(store.fontProject).toBeDefined();
    expect(store.fontProject.entries.length).toBeGreaterThan(0);
    expect(store.selectedStudioEntryId).toBe('rank-admin');
  });

  it('updates GUI scale and forceUnicode reactively', () => {
    const store = useWorkbenchStore();
    expect(store.fontProject.guiScale).toBe(2);
    expect(store.fontProject.forceUnicode).toBe(false);

    store.setGuiScale(4);
    expect(store.fontProject.guiScale).toBe(4);

    store.toggleForceUnicode();
    expect(store.fontProject.forceUnicode).toBe(true);

    store.toggleForceUnicode();
    expect(store.fontProject.forceUnicode).toBe(false);
  });

  it('updates preview context and sample chat text', () => {
    const store = useWorkbenchStore();
    store.setPreviewContext('tab');
    expect(store.fontProject.previewContext).toBe('tab');

    store.setSampleChatText('P0TAT0D0G: Test Pinia Store!');
    expect(store.fontProject.sampleChatText).toBe('P0TAT0D0G: Test Pinia Store!');
  });

  it('adds preset rank template and auto-selects the newly created entry', () => {
    const store = useWorkbenchStore();
    const initialCount = store.fontProject.entries.length;

    store.addRankFromTemplate('crystal');
    expect(store.fontProject.entries.length).toBe(initialCount + 1);

    const added = store.fontProject.entries[store.fontProject.entries.length - 1];
    expect(added).toBeDefined();
    expect(added?.kind).toBe('bitmap');
    if (added?.kind === 'bitmap') {
      expect(added.composer.text).toBe('CRYSTAL');
    }
    expect(store.selectedStudioEntryId).toBe(added?.id);
  });

  it('adds space entry and manages entry removal', () => {
    const store = useWorkbenchStore();
    const initialCount = store.fontProject.entries.length;

    store.addSpace();
    expect(store.fontProject.entries.length).toBe(initialCount + 1);

    const spaceEntry = store.fontProject.entries[store.fontProject.entries.length - 1];
    expect(spaceEntry).toBeDefined();
    expect(spaceEntry?.kind).toBe('space');
    if (spaceEntry?.kind === 'space') {
      expect(spaceEntry.advance).toBe(-2);
    }

    if (spaceEntry) {
      store.removeEntry(spaceEntry.id);
      expect(store.fontProject.entries.length).toBe(initialCount);
      expect(store.fontProject.entries.some((e) => e.id === spaceEntry.id)).toBe(false);
    }
  });

  it('handles paint undo and redo stack correctly', () => {
    const store = useWorkbenchStore();
    const admin = store.selectedEntry;
    expect(admin).toBeDefined();
    if (!admin || admin.kind !== 'bitmap') return;

    expect(store.undoStack.length).toBe(0);
    expect(store.redoStack.length).toBe(0);

    // Paint a pixel
    store.paintPixels('rank-admin', { '5,5': '#ff0000' }, true);
    expect(store.undoStack.length).toBe(1);
    expect(store.redoStack.length).toBe(0);

    // Undo
    store.undoPaint();
    expect(store.undoStack.length).toBe(0);
    expect(store.redoStack.length).toBe(1);

    // Redo
    store.redoPaint();
    expect(store.undoStack.length).toBe(1);
    expect(store.redoStack.length).toBe(0);
  });

  it('memoizes decoded PNGs across unrelated project mutations via pngDecodeCache', async () => {
    const store = useWorkbenchStore();
    const w = 16;
    const h = 16;
    const rgba = new Uint8Array(w * h * 4);
    rgba[0] = 255;
    rgba[3] = 255;
    const pngBytes = await encodeRgbaPng(w, h, rgba);

    const uploadEntry = createUploadedPngEntry(store.fontProject.entries, {
      id: 'png-memo-test',
      label: 'Memo Icon',
      namespace: store.fontProject.namespace,
      fileName: 'icon.png',
      bytes: pngBytes,
    });

    store.fontProject = {
      ...store.fontProject,
      entries: [...store.fontProject.entries, uploadEntry],
    };

    // Await watcher execution
    await new Promise((resolve) => setTimeout(resolve, 35));

    const firstDecoded = store.decodedUploads.get('png-memo-test');
    expect(firstDecoded).toBeDefined();
    expect(firstDecoded?.width).toBe(16);
    expect(firstDecoded?.height).toBe(16);

    // Mutate an unrelated property (e.g. sample text or guiScale)
    store.setSampleChatText('Testing memoization without re-decoding');
    await new Promise((resolve) => setTimeout(resolve, 35));

    const secondDecoded = store.decodedUploads.get('png-memo-test');
    // Reference equality proves pngDecodeCache returned the cached instance
    expect(secondDecoded).toBe(firstDecoded);
  });

  it('manages auto-save, recent projects and closeProject in localStorage', () => {
    const mockStorage = new Map<string, string>();
    const storageObj: Storage = {
      getItem: (k: string) => mockStorage.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mockStorage.set(k, v);
      },
      removeItem: (k: string) => {
        mockStorage.delete(k);
      },
      clear: () => {
        mockStorage.clear();
      },
      key: (i: number) => Array.from(mockStorage.keys())[i] ?? null,
      length: 0,
    };
    // Mock window.localStorage
    (globalThis as unknown as { window: { localStorage: Storage } }).window = {
      localStorage: storageObj,
    };

    try {
      const store = useWorkbenchStore();
      store.fontProject.namespace = 'custompack';
      store.fontProject.packDescription = 'Custom Pack Description';
      store.saveProjectToStorage();

      expect(mockStorage.has('pack-workbench-autosave')).toBe(true);
      expect(mockStorage.has('pack-workbench-recent')).toBe(true);
      expect(store.recentProjects.length).toBe(1);
      expect(store.recentProjects[0]?.name).toBe('Custom Pack Description.zip');
      expect(store.recentProjects[0]?.entryCount).toBe(store.fontProject.entries.length);

      // Close project clears entries and autosave
      store.closeProject();
      expect(store.fontProject.entries.length).toBe(0);
      expect(mockStorage.has('pack-workbench-autosave')).toBe(false);

      // Restore from recent project
      const recent = store.recentProjects[0];
      expect(recent).toBeDefined();
      if (recent) {
        store.loadRecentProject(recent);
        expect(store.fontProject.entries.length).toBeGreaterThan(0);
        expect(store.fontProject.namespace).toBe('custompack');
      }

      // Create new blank project
      store.createNewProject('newnamespace');
      expect(store.fontProject.entries.length).toBe(1);
      expect(store.fontProject.namespace).toBe('newnamespace');
    } finally {
      delete (globalThis as unknown as { window?: unknown }).window;
    }
  });
});
