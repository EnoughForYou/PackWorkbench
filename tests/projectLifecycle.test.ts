import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  AUTOSAVE_STORAGE_KEY,
  RECENT_STORAGE_KEY,
  serializeFontProject,
  useWorkbenchStore,
  type RecentProjectItem,
} from '../app/stores/workbenchStore.ts';
import { createInitialFontProject } from '../src/core/font/presets.ts';
import { setupWorkbenchTestingPinia } from './helpers/piniaTestHarness.ts';

describe('Project Lifecycle & Welcome Screen (Phase 1)', () => {
  const storageMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string): string | null => storageMap.get(key) ?? null,
    setItem: (key: string, val: string): void => {
      storageMap.set(key, val);
    },
    removeItem: (key: string): void => {
      storageMap.delete(key);
    },
    clear: (): void => {
      storageMap.clear();
    },
    key: (i: number): string | null => Array.from(storageMap.keys())[i] ?? null,
    get length(): number {
      return storageMap.size;
    },
  };

  beforeEach(() => {
    storageMap.clear();
    // @ts-expect-error Mocking global localStorage in Node environment
    globalThis.localStorage = mockLocalStorage;
    // @ts-expect-error Mocking global window in Node environment
    globalThis.window = globalThis;
    setupWorkbenchTestingPinia({ stubActions: false });
  });

  describe('workbenchStore initial project lifecycle', () => {
    it('initializes with isProjectOpen === false on first visit with empty localStorage', () => {
      expect(storageMap.get(AUTOSAVE_STORAGE_KEY)).toBeUndefined();
      const store = useWorkbenchStore();

      expect(store.isProjectOpen).toBe(false);
      expect(store.recentProjects).toEqual([]);
    });

    it('calling createNewProject() sets isProjectOpen === true and saves to storage', () => {
      const store = useWorkbenchStore();
      expect(store.isProjectOpen).toBe(false);

      store.createNewProject('testpack');

      expect(store.isProjectOpen).toBe(true);
      expect(store.fontProject.namespace).toBe('testpack');
      expect(store.fontProject.entries.length).toBe(1);

      // Verify persisted in localStorage
      expect(storageMap.has(AUTOSAVE_STORAGE_KEY)).toBe(true);
      expect(storageMap.has(RECENT_STORAGE_KEY)).toBe(true);
      expect(store.recentProjects.length).toBe(1);
    });

    it('calling closeProject() sets isProjectOpen === false and clears active entries while keeping recentProjects intact', () => {
      const store = useWorkbenchStore();
      store.createNewProject('project-to-close');
      expect(store.isProjectOpen).toBe(true);
      expect(store.fontProject.entries.length).toBe(1);
      expect(store.recentProjects.length).toBe(1);
      const recentCountBefore = store.recentProjects.length;

      store.closeProject();

      expect(store.isProjectOpen).toBe(false);
      expect(store.fontProject.entries.length).toBe(0);
      expect(store.selectedStudioEntryId).toBe('');
      expect(storageMap.has(AUTOSAVE_STORAGE_KEY)).toBe(false);
      // recentProjects must be preserved
      expect(store.recentProjects.length).toBe(recentCountBefore);
    });

    it('restores project from autosave and sets isProjectOpen === true on initialization', () => {
      const sampleProject = createInitialFontProject();
      sampleProject.namespace = 'restored-pack';
      const serialized = serializeFontProject(sampleProject);
      storageMap.set(AUTOSAVE_STORAGE_KEY, serialized);

      // Re-initialize store with autosave present
      setupWorkbenchTestingPinia({ stubActions: false });
      const store = useWorkbenchStore();

      expect(store.isProjectOpen).toBe(true);
      expect(store.fontProject.namespace).toBe('restored-pack');
      expect(store.fontProject.entries.length).toBeGreaterThan(0);
    });

    it('calling restoreAutosave() directly sets isProjectOpen === true when valid data exists', () => {
      const store = useWorkbenchStore();
      expect(store.isProjectOpen).toBe(false);

      const sampleProject = createInitialFontProject();
      sampleProject.namespace = 'manual-restore';
      storageMap.set(AUTOSAVE_STORAGE_KEY, serializeFontProject(sampleProject));

      const success = store.restoreAutosave();
      expect(success).toBe(true);
      expect(store.isProjectOpen).toBe(true);
      expect(store.fontProject.namespace).toBe('manual-restore');
    });

    it('calling openPresetProject(templateId) initializes project from template and sets isProjectOpen === true', () => {
      const store = useWorkbenchStore();
      expect(store.isProjectOpen).toBe(false);

      store.openPresetProject('vip');

      expect(store.isProjectOpen).toBe(true);
      expect(store.fontProject.entries.length).toBe(1);
      expect(store.fontProject.entries[0]?.label).toBe('VIP');
      expect(storageMap.has(AUTOSAVE_STORAGE_KEY)).toBe(true);
    });

    it('calling loadRecentProject(item) sets isProjectOpen === true and restores project data', () => {
      const store = useWorkbenchStore();
      const sampleProject = createInitialFontProject();
      sampleProject.namespace = 'recent-pack';
      const serialized = serializeFontProject(sampleProject);

      const item: RecentProjectItem = {
        name: 'recent-pack.zip',
        savedAt: Date.now(),
        entryCount: sampleProject.entries.length,
        data: serialized,
      };

      store.loadRecentProject(item);

      expect(store.isProjectOpen).toBe(true);
      expect(store.fontProject.namespace).toBe('recent-pack');
      expect(store.fontProject.entries.length).toBe(sampleProject.entries.length);
    });
  });

  describe('StudioWorkspace.vue showWelcomeScreen contract', () => {
    const workspaceFilePath = path.resolve(
      process.cwd(),
      'app/components/studio/StudioWorkspace.vue',
    );
    const content = fs.readFileSync(workspaceFilePath, 'utf8').replace(/\r\n/g, '\n');

    it('implements showWelcomeScreen checking !store.isProjectOpen || store.fontProject.entries.length === 0', () => {
      expect(content).toContain(
        'const showWelcomeScreen = computed(() => !store.isProjectOpen || store.fontProject.entries.length === 0);',
      );
    });

    it('renders StudioWelcomeScreen when showWelcomeScreen is true and hides workspace panels', () => {
      expect(content).toContain('<ToolDockRail v-if="!showWelcomeScreen" />');
      expect(content).toContain('<ResizablePanelGroup\n      v-if="!showWelcomeScreen"');
      expect(content).toContain('<StudioWelcomeScreen v-else class="flex-1" />');
    });
  });

  describe('StudioWelcomeScreen.vue action wiring contract', () => {
    const welcomeScreenPath = path.resolve(
      process.cwd(),
      'app/components/studio/StudioWelcomeScreen.vue',
    );
    const content = fs.readFileSync(welcomeScreenPath, 'utf8').replace(/\r\n/g, '\n');

    it('wires handleCreateRank to store.createNewProject()', () => {
      expect(content).toContain('function handleCreateRank(): void {\n  store.createNewProject();\n}');
    });

    it('wires handleSelectPreset to store.openPresetProject(templateId)', () => {
      expect(content).toContain('function handleSelectPreset(templateId: string): void {\n  store.openPresetProject(templateId);\n}');
    });

    it('wires handleOpenRecent to store.loadRecentProject(item)', () => {
      expect(content).toContain('function handleOpenRecent(item: RecentProjectItem): void {\n  store.loadRecentProject(item);\n}');
    });

    it('wires handlePngFileSelected to store.uploadPngFile and sets store.isProjectOpen = true', () => {
      expect(content).toContain('store.uploadPngFile(file);');
      expect(content).toContain('store.isProjectOpen = true;');
    });
  });

  describe('app/pages/studio.vue topbar menu contract', () => {
    const studioPagePath = path.resolve(
      process.cwd(),
      'app/pages/studio.vue',
    );
    const content = fs.readFileSync(studioPagePath, 'utf8').replace(/\r\n/g, '\n');

    it('renders Tutup Proyek button in topbar calling store.closeProject() when store.isProjectOpen is true', () => {
      expect(content).toContain('v-if="store.isProjectOpen"');
      expect(content).toContain('@click="store.closeProject()"');
      expect(content).toContain('Tutup Proyek');
      expect(content).toContain('faFolderClosed');
    });
  });
});
