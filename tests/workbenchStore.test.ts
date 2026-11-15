import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useWorkbenchStore } from '../app/stores/workbenchStore.ts';

describe('Pinia Integration - useWorkbenchStore', () => {
  beforeEach(() => {
    // Fresh Pinia instance for each test as recommended by official Pinia documentation
    setActivePinia(createPinia());
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
});
