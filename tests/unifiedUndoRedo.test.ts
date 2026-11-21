import { beforeEach, describe, expect, it } from 'vitest';
import type { BitmapFontEntry } from '../src/core/font/types.ts';
import { useWorkbenchStore } from '../app/stores/workbenchStore.ts';
import { setupWorkbenchTestingPinia } from './helpers/piniaTestHarness.ts';

describe('Unified Undo/Redo Engine', () => {
  beforeEach(() => {
    setupWorkbenchTestingPinia({ stubActions: false });
  });

  it('initializes with empty undo and redo stacks without history pollution', () => {
    const store = useWorkbenchStore();
    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(false);
    expect(store.undoStack.length).toBe(0);
    expect(store.redoStack.length).toBe(0);
  });

  it('records history when updating composer text and restores prior state on undo', () => {
    const store = useWorkbenchStore();
    const entry = store.selectedEntry as BitmapFontEntry;
    expect(entry).toBeDefined();

    const originalText = entry.composer.text;
    expect(originalText).toBe('ADMIN');

    // Update entry text
    store.updateEntry(entry.id, {
      composer: {
        ...entry.composer,
        text: 'OWNER',
      },
    });

    const modified = store.selectedEntry as BitmapFontEntry;
    expect(modified.composer.text).toBe('OWNER');
    expect(store.canUndo).toBe(true);
    expect(store.canRedo).toBe(false);

    // Perform undo
    const didUndo = store.undo();
    expect(didUndo).toBe(true);
    const reverted = store.selectedEntry as BitmapFontEntry;
    expect(reverted.composer.text).toBe(originalText);
    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(true);

    // Perform redo
    const didRedo = store.redo();
    expect(didRedo).toBe(true);
    const redone = store.selectedEntry as BitmapFontEntry;
    expect(redone.composer.text).toBe('OWNER');
    expect(store.canUndo).toBe(true);
    expect(store.canRedo).toBe(false);
  });

  it('records history when painting pixels and supports multi-step undo/redo', () => {
    const store = useWorkbenchStore();
    const entry = store.selectedEntry as BitmapFontEntry;

    // Paint pixel 1
    store.paintPixels(entry.id, { '0,0': '#FF0000' });
    expect(store.canUndo).toBe(true);
    expect(store.undoStack.length).toBe(1);

    // Paint pixel 2
    store.paintPixels(entry.id, { '1,1': '#00FF00' });
    expect(store.undoStack.length).toBe(2);

    let current = store.selectedEntry as BitmapFontEntry;
    expect(current.paintEdits['0,0']).toBe('#FF0000');
    expect(current.paintEdits['1,1']).toBe('#00FF00');

    // Undo step 2
    store.undo();
    current = store.selectedEntry as BitmapFontEntry;
    expect(current.paintEdits['0,0']).toBe('#FF0000');
    expect(current.paintEdits['1,1']).toBeUndefined();

    // Undo step 1
    store.undo();
    current = store.selectedEntry as BitmapFontEntry;
    expect(current.paintEdits['0,0']).toBeUndefined();
    expect(current.paintEdits['1,1']).toBeUndefined();
    expect(store.canUndo).toBe(false);

    // Redo step 1
    store.redo();
    current = store.selectedEntry as BitmapFontEntry;
    expect(current.paintEdits['0,0']).toBe('#FF0000');

    // Redo step 2
    store.redo();
    current = store.selectedEntry as BitmapFontEntry;
    expect(current.paintEdits['0,0']).toBe('#FF0000');
    expect(current.paintEdits['1,1']).toBe('#00FF00');
  });

  it('clears undo/redo stacks when creating a new project or restoring autosave', () => {
    const store = useWorkbenchStore();
    const entry = store.selectedEntry as BitmapFontEntry;

    // Mutate to create history
    store.updateEntry(entry.id, {
      composer: { ...entry.composer, text: 'MODERATOR' },
    });
    expect(store.canUndo).toBe(true);

    // Creating new project should reset history
    store.createNewProject();
    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(false);
    expect(store.undoStack.length).toBe(0);
    expect(store.redoStack.length).toBe(0);
  });
});
