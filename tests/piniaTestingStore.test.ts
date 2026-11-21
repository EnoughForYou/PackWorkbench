import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkbenchStore } from '../app/stores/workbenchStore.ts';
import { setupWorkbenchTestingPinia } from './helpers/piniaTestHarness.ts';

describe('@pinia/testing Integration - useWorkbenchStore with createTestingPinia', () => {
  describe('Live Action Spying (stubActions: false)', () => {
    beforeEach(() => {
      setupWorkbenchTestingPinia({ stubActions: false });
    });

    it('provides an isolated store instance with initial defaults', () => {
      const store = useWorkbenchStore();
      expect(store).toBeDefined();
      expect(store.studioMode).toBe('font');
      expect(store.fontProject).toBeDefined();
      expect(store.fontProject.entries.length).toBeGreaterThan(0);
    });

    it('dispatches store action and updates reactive preview context using spy', () => {
      const store = useWorkbenchStore();
      store.setPreviewContext('tab');
      expect(store.setPreviewContext).toHaveBeenCalledTimes(1);
      expect(store.setPreviewContext).toHaveBeenCalledWith('tab');
      expect(store.fontProject.previewContext).toBe('tab');
    });

    it('updates sample chat text reactively through store action', () => {
      const store = useWorkbenchStore();
      store.setSampleChatText('Test Player: Testing Pinia!');
      expect(store.setSampleChatText).toHaveBeenCalledTimes(1);
      expect(store.setSampleChatText).toHaveBeenCalledWith('Test Player: Testing Pinia!');
      expect(store.fontProject.sampleChatText).toBe('Test Player: Testing Pinia!');
    });

    it('updates project state using updateProject action', () => {
      const store = useWorkbenchStore();
      store.updateProject((prev) => ({
        ...prev,
        targetVersion: '1.21.1',
      }));

      expect(store.updateProject).toHaveBeenCalledTimes(1);
      expect(store.fontProject.targetVersion).toBe('1.21.1');
    });

    it('adds a rank from template and tracks newly created entry', () => {
      const store = useWorkbenchStore();
      const initialCount = store.fontProject.entries.length;

      store.addRankFromTemplate('crystal');
      expect(store.addRankFromTemplate).toHaveBeenCalledTimes(1);
      expect(store.addRankFromTemplate).toHaveBeenCalledWith('crystal');
      expect(store.fontProject.entries.length).toBe(initialCount + 1);
    });

    it('records paint strokes and tracks undo/redo action dispatches via Vitest spies', () => {
      const store = useWorkbenchStore();
      const admin = store.selectedEntry;
      expect(admin).toBeDefined();
      if (!admin || admin.kind !== 'bitmap') return;

      // Paint pixel at (2, 3)
      store.paintPixels(admin.id, { '2,3': '#ff5555' }, true);
      expect(store.paintPixels).toHaveBeenCalledTimes(1);
      expect(store.paintPixels).toHaveBeenCalledWith(admin.id, { '2,3': '#ff5555' }, true);
      expect(store.undoStack.length).toBe(1);

      // Undo paint action
      store.undoPaint();
      expect(store.undoPaint).toHaveBeenCalledTimes(1);
      expect(store.undoStack.length).toBe(0);
      expect(store.redoStack.length).toBe(1);

      // Redo paint action
      store.redoPaint();
      expect(store.redoPaint).toHaveBeenCalledTimes(1);
      expect(store.undoStack.length).toBe(1);
    });

    it('records backdrop mode and GUI scale transitions via Vitest spies', () => {
      const store = useWorkbenchStore();
      expect(store.previewBackdropMode).toBe('world');

      store.setPreviewBackdropMode('solid');
      expect(store.setPreviewBackdropMode).toHaveBeenCalledWith('solid');
      expect(store.previewBackdropMode).toBe('solid');

      store.setGuiScale(4);
      expect(store.setGuiScale).toHaveBeenCalledWith(4);
      expect(store.fontProject.guiScale).toBe(4);
    });
  });

  describe('Action Stubbing for Isolated Component Verification (stubActions: true)', () => {
    beforeEach(() => {
      setupWorkbenchTestingPinia({ stubActions: true });
    });

    it('records action dispatches without executing mutation side-effects', () => {
      const store = useWorkbenchStore();

      // With stubActions: true, actions are no-op spies
      store.setPreviewContext('nametag');
      expect(store.setPreviewContext).toHaveBeenCalledTimes(1);
      expect(store.setPreviewContext).toHaveBeenCalledWith('nametag');

      // State is not mutated by the stubbed action, confirming isolation
      expect(store.fontProject.previewContext).toBe('Chat');
    });

    it('stubs complex rank template creation and removal calls', () => {
      const store = useWorkbenchStore();
      const initialCount = store.fontProject.entries.length;

      store.addRankFromTemplate('vip');
      expect(store.addRankFromTemplate).toHaveBeenCalledTimes(1);
      expect(store.addRankFromTemplate).toHaveBeenCalledWith('vip');
      // Count remains initial default because action was stubbed
      expect(store.fontProject.entries.length).toBe(initialCount);

      store.removeEntry('rank-admin');
      expect(store.removeEntry).toHaveBeenCalledTimes(1);
      expect(store.removeEntry).toHaveBeenCalledWith('rank-admin');
      // Entry is not removed because action was stubbed
      expect(store.fontProject.entries.some((e) => e.id === 'rank-admin')).toBe(true);
    });
  });

  describe('Preloaded Initial State Injection', () => {
    it('initializes store with custom pre-seeded state without triggering constructors', () => {
      setupWorkbenchTestingPinia({
        stubActions: false,
        initialState: {
          workbench: {
            studioMode: 'validator',
            zoom: 20,
            activeTool: 'pencil',
            brushColor: '#10b981',
            stageMode: 'split',
            inspectorTab: 'layers',
          },
        },
      });

      const store = useWorkbenchStore();
      expect(store.studioMode).toBe('validator');
      expect(store.zoom).toBe(20);
      expect(store.activeTool).toBe('pencil');
      expect(store.brushColor).toBe('#10b981');
      expect(store.stageMode).toBe('split');
      expect(store.inspectorTab).toBe('layers');
    });
  });
});
