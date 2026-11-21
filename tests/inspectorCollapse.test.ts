import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { nextTick } from 'vue';
import {
  useWorkbenchStore,
  STORAGE_KEY_INSPECTOR_COLLAPSED,
} from '../app/stores/workbenchStore.ts';
import { setupWorkbenchTestingPinia } from './helpers/piniaTestHarness.ts';

describe('Inspector Panel Collapse Feature', () => {
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
  };

  beforeEach(() => {
    storageMap.clear();
    // @ts-expect-error Mocking global localStorage in Node environment
    globalThis.localStorage = mockLocalStorage;
    // @ts-expect-error Mocking global window in Node environment
    globalThis.window = globalThis;
    setupWorkbenchTestingPinia({ stubActions: false });
  });

  describe('workbenchStore inspectorCollapsed state', () => {
    it('initializes inspectorCollapsed with false by default', () => {
      const store = useWorkbenchStore();
      expect(store.inspectorCollapsed).toBe(false);
      expect(store.inspectorTab).toBe('properties');
    });

    it('toggles inspectorCollapsed reactively', () => {
      const store = useWorkbenchStore();
      expect(store.inspectorCollapsed).toBe(false);

      store.toggleInspectorCollapsed();
      expect(store.inspectorCollapsed).toBe(true);

      store.toggleInspectorCollapsed();
      expect(store.inspectorCollapsed).toBe(false);
    });

    it('sets inspectorCollapsed directly with setInspectorCollapsed', () => {
      const store = useWorkbenchStore();
      store.setInspectorCollapsed(true);
      expect(store.inspectorCollapsed).toBe(true);

      store.setInspectorCollapsed(false);
      expect(store.inspectorCollapsed).toBe(false);
    });

    it('persists inspectorCollapsed state into localStorage under pack-workbench-inspector-collapsed', async () => {
      const store = useWorkbenchStore();
      expect(localStorage.getItem(STORAGE_KEY_INSPECTOR_COLLAPSED)).toBeNull();

      store.inspectorCollapsed = true;
      await nextTick();
      expect(localStorage.getItem(STORAGE_KEY_INSPECTOR_COLLAPSED)).toBe('true');

      store.inspectorCollapsed = false;
      await nextTick();
      expect(localStorage.getItem(STORAGE_KEY_INSPECTOR_COLLAPSED)).toBe('false');
    });

    it('initializes inspectorCollapsed from localStorage when stored as true', () => {
      mockLocalStorage.setItem(STORAGE_KEY_INSPECTOR_COLLAPSED, 'true');
      setupWorkbenchTestingPinia({ stubActions: false });
      const store = useWorkbenchStore();
      expect(store.inspectorCollapsed).toBe(true);
    });
  });

  describe('InspectorPanel.vue component template and contract', () => {
    const inspectorPanelPath = path.resolve(
      process.cwd(),
      'app/components/studio/InspectorPanel.vue',
    );
    const content = fs.readFileSync(inspectorPanelPath, 'utf8');

    it('imports the required FontAwesome icons and components', () => {
      expect(content).toContain('faChevronLeft');
      expect(content).toContain('faChevronRight');
      expect(content).toContain('faSlidersH');
      expect(content).toContain('faLayerGroup');
      expect(content).toContain('faShieldHalved');
      expect(content).toContain('useWorkbenchStore');
    });

    it('contains accessibility h1 sr-only title in both collapsed and expanded states', () => {
      const srOnlyMatches = content.match(/<h1[^>]*class="[^"]*sr-only[^"]*"[^>]*>/g);
      expect(srOnlyMatches).not.toBeNull();
      expect(srOnlyMatches!.length).toBeGreaterThanOrEqual(2);
    });

    it('renders chevron-left when expanded and chevron-right when collapsed', () => {
      // In collapsed aside (store.inspectorCollapsed)
      expect(content).toMatch(/store\.inspectorCollapsed[\s\S]*?:icon="faChevronRight"/);
      // In expanded aside
      expect(content).toMatch(/:icon="faChevronLeft"/);
    });

    it('renders the 3 vertical icon buttons with exact dimensions h-10 w-11 p-0 and tooltips on left', () => {
      expect(content).toContain('h-10 w-11 p-0');
      expect(content).toContain('side="left"');
      expect(content).toContain('aria-label="Properti"');
      expect(content).toContain('aria-label="Lapisan"');
      expect(content).toContain('aria-label="Validasi"');
    });

    it('activates target tab and sets inspectorCollapsed to false when an icon button is clicked', () => {
      expect(content).toContain("activateTabAndExpand('properties')");
      expect(content).toContain("activateTabAndExpand('layers')");
      expect(content).toContain("activateTabAndExpand('validate')");
      expect(content).toContain('store.inspectorCollapsed = false');
    });
  });

  describe('StudioWorkspace.vue ResizablePanel configuration', () => {
    const workspacePath = path.resolve(
      process.cwd(),
      'app/components/studio/StudioWorkspace.vue',
    );
    const content = fs.readFileSync(workspacePath, 'utf8');

    it('configures ResizablePanel with collapsible, collapsed-size="0", and dynamic max-size', () => {
      expect(content).toContain(':collapsible="true"');
      expect(content).toContain(':collapsed-size="0"');
      expect(content).toContain('store.inspectorCollapsed ? 0 : 36');
      expect(content).toContain('store.inspectorCollapsed ? 0 : 20');
      expect(content).toContain("min-w-[44px] max-w-[44px]");
    });

    it('synchronizes panel collapse and expand events with store.inspectorCollapsed', () => {
      expect(content).toContain('@collapse="store.inspectorCollapsed = true"');
      expect(content).toContain('@expand="store.inspectorCollapsed = false"');
    });
  });
});
