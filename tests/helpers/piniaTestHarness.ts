import { createTestingPinia, type TestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { vi } from 'vitest';

export interface SetupTestingPiniaOptions {
  /**
   * Whether to stub store actions. If true, actions won't execute their implementation.
   * Default: false (actions run real implementations while recording spies).
   */
  readonly stubActions?: boolean;
  /**
   * Initial state object to inject into Pinia stores before initialization.
   */
  readonly initialState?: Record<string, unknown>;
}

/**
 * Standard test harness helper to initialize a fresh, isolated Pinia instance
 * powered by `@pinia/testing` with Vitest spy integration.
 */
export function setupWorkbenchTestingPinia(options: SetupTestingPiniaOptions = {}): TestingPinia {
  const pinia = createTestingPinia({
    stubActions: options.stubActions ?? false,
    createSpy: vi.fn,
    initialState: options.initialState,
  });
  setActivePinia(pinia);
  return pinia;
}
