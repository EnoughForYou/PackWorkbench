import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  clearMeasuresHistory,
  getRecentMeasures,
  subscribeTelemetry,
  type TelemetryMeasureRecord,
} from '@core/telemetry.ts';

const isHudVisible = ref<boolean>(false);
const fps = ref<number>(60);
const frameLatency = ref<number>(16.6);
const usedHeapMb = ref<number | null>(null);
const recentMeasures = ref<readonly TelemetryMeasureRecord[]>(getRecentMeasures());

let rafId: number | null = null;
let lastFrameTime = 0;
let frameCount = 0;
let lastFpsSampleTime = 0;
let listenerAttached = false;
let unsubscribeTelemetry: (() => void) | null = null;

function sampleLoop(currentTime: number): void {
  if (lastFrameTime > 0) {
    const delta = currentTime - lastFrameTime;
    frameLatency.value = Math.round(delta * 10) / 10;
  }
  lastFrameTime = currentTime;
  frameCount++;

  if (currentTime - lastFpsSampleTime >= 500) {
    fps.value = Math.round((frameCount * 1000) / (currentTime - lastFpsSampleTime));
    frameCount = 0;
    lastFpsSampleTime = currentTime;

    // Sample Chrome/Chromium performance.memory if available
    if (typeof performance !== 'undefined') {
      const perfAny = performance as unknown as {
        memory?: { usedJSHeapSize?: number; jsHeapSizeLimit?: number };
      };
      if (perfAny.memory && typeof perfAny.memory.usedJSHeapSize === 'number') {
        usedHeapMb.value = Math.round((perfAny.memory.usedJSHeapSize / (1024 * 1024)) * 10) / 10;
      }
    }
  }

  if (isHudVisible.value && typeof window !== 'undefined') {
    rafId = window.requestAnimationFrame(sampleLoop);
  } else {
    rafId = null;
  }
}

function startRafLoop(): void {
  if (rafId !== null || typeof window === 'undefined') return;
  lastFrameTime = window.performance?.now?.() ?? Date.now();
  lastFpsSampleTime = lastFrameTime;
  frameCount = 0;
  rafId = window.requestAnimationFrame(sampleLoop);
}

function stopRafLoop(): void {
  if (rafId !== null && typeof window !== 'undefined') {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function handleGlobalKeydown(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    isHudVisible.value = !isHudVisible.value;
  }
}

export function usePerformanceDiagnostics() {
  onMounted(() => {
    if (typeof window === 'undefined') return;

    if (!listenerAttached) {
      window.addEventListener('keydown', handleGlobalKeydown);
      listenerAttached = true;
    }

    if (!unsubscribeTelemetry) {
      unsubscribeTelemetry = subscribeTelemetry((records) => {
        recentMeasures.value = records;
      });
    }

    if (isHudVisible.value) {
      startRafLoop();
    }
  });

  watch(
    isHudVisible,
    (visible) => {
      if (visible) {
        startRafLoop();
      } else {
        stopRafLoop();
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    stopRafLoop();
    if (unsubscribeTelemetry) {
      unsubscribeTelemetry();
      unsubscribeTelemetry = null;
    }
    if (listenerAttached && typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleGlobalKeydown);
      listenerAttached = false;
    }
  });

  function toggleHud(): void {
    isHudVisible.value = !isHudVisible.value;
  }

  function clearHistory(): void {
    clearMeasuresHistory();
  }

  return {
    isHudVisible,
    fps,
    frameLatency,
    usedHeapMb,
    recentMeasures,
    toggleHud,
    clearHistory,
  };
}
