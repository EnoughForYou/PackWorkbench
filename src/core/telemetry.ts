/**
 * Telemetry and User Timing instrumentation for Pack Workbench.
 * 100% client-side & privacy-preserving: No network tracking or external leaks.
 * Safe across Node.js (test runner) and browser environments.
 */

export interface TelemetryMeasureRecord {
  readonly name: string;
  readonly durationMs: number;
  readonly timestamp: number;
}

const MAX_HISTORY = 50;
const measuresHistory: TelemetryMeasureRecord[] = [];

export type TelemetryListener = (records: readonly TelemetryMeasureRecord[]) => void;
const telemetryListeners = new Set<TelemetryListener>();

function notifyListeners(): void {
  const snapshot = [...measuresHistory];
  for (const listener of telemetryListeners) {
    try {
      listener(snapshot);
    } catch {
      // Ignore listener error
    }
  }
}

/**
 * Subscribe to telemetry measurement updates.
 * Calls listener immediately with current history snapshot and returns an unsubscribe cleanup function.
 */
export function subscribeTelemetry(listener: TelemetryListener): () => void {
  telemetryListeners.add(listener);
  listener([...measuresHistory]);
  return () => {
    telemetryListeners.delete(listener);
  };
}

function hasPerformance(): boolean {
  return typeof globalThis !== 'undefined' && typeof globalThis.performance !== 'undefined';
}

/**
 * Record a custom performance mark.
 */
export function recordMark(name: string): void {
  if (hasPerformance() && typeof globalThis.performance.mark === 'function') {
    try {
      globalThis.performance.mark(name);
    } catch {
      // Ignore mark collision or permission errors
    }
  }
}

/**
 * Record a performance measurement between two marks, or return measured duration.
 */
export function recordMeasure(
  name: string,
  startMark: string,
  endMark: string,
): number | null {
  if (
    hasPerformance() &&
    typeof globalThis.performance.measure === 'function' &&
    typeof globalThis.performance.getEntriesByName === 'function'
  ) {
    try {
      globalThis.performance.measure(name, startMark, endMark);
      const entries = globalThis.performance.getEntriesByName(name, 'measure');
      const last = entries[entries.length - 1];
      const duration = last ? last.duration : null;
      if (duration !== null) {
        addMeasureToHistory(name, duration);
      }
      return duration;
    } catch {
      return null;
    }
  }
  return null;
}

function addMeasureToHistory(name: string, durationMs: number): void {
  measuresHistory.push({
    name,
    durationMs: Math.round(durationMs * 100) / 100,
    timestamp: Date.now(),
  });
  if (measuresHistory.length > MAX_HISTORY) {
    measuresHistory.shift();
  }
  notifyListeners();
}

/**
 * Synchronous measurement helper.
 */
export function measureSync<T>(name: string, fn: () => T): T {
  const startMark = `${name}:start:${Date.now()}`;
  const endMark = `${name}:end:${Date.now()}`;
  const fallbackStart = hasPerformance() ? globalThis.performance.now() : Date.now();

  recordMark(startMark);
  try {
    return fn();
  } finally {
    recordMark(endMark);
    const measured = recordMeasure(name, startMark, endMark);
    if (measured === null) {
      const fallbackEnd = hasPerformance() ? globalThis.performance.now() : Date.now();
      addMeasureToHistory(name, fallbackEnd - fallbackStart);
    }
  }
}

/**
 * Asynchronous measurement helper.
 */
export async function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const startMark = `${name}:start:${Date.now()}`;
  const endMark = `${name}:end:${Date.now()}`;
  const fallbackStart = hasPerformance() ? globalThis.performance.now() : Date.now();

  recordMark(startMark);
  try {
    return await fn();
  } finally {
    recordMark(endMark);
    const measured = recordMeasure(name, startMark, endMark);
    if (measured === null) {
      const fallbackEnd = hasPerformance() ? globalThis.performance.now() : Date.now();
      addMeasureToHistory(name, fallbackEnd - fallbackStart);
    }
  }
}

/**
 * Retrieve recent measurement records for diagnostics.
 */
export function getRecentMeasures(): readonly TelemetryMeasureRecord[] {
  return [...measuresHistory];
}

/**
 * Clear recorded measures (useful in tests).
 */
export function clearMeasuresHistory(): void {
  measuresHistory.length = 0;
  if (hasPerformance() && typeof globalThis.performance.clearMarks === 'function') {
    try {
      globalThis.performance.clearMarks();
      globalThis.performance.clearMeasures();
    } catch {
      // Ignore
    }
  }
  notifyListeners();
}
