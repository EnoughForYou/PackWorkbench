<script setup lang="ts">
import { computed } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { usePerformanceDiagnostics } from '@/composables/usePerformanceDiagnostics';
import { useWorkbenchStore } from '@/stores/workbenchStore';

const { isHudVisible, fps, frameLatency, usedHeapMb, recentMeasures, toggleHud, clearHistory } =
  usePerformanceDiagnostics();
const store = useWorkbenchStore();

const reversedMeasures = computed(() => {
  return [...recentMeasures.value].reverse().slice(0, 6);
});

const fpsBadgeClass = computed(() => {
  if (fps.value >= 50) return 'text-success border-success/40 bg-success/10';
  if (fps.value >= 30) return 'text-warning border-warning/40 bg-warning/10';
  return 'text-destructive border-destructive/40 bg-destructive/10';
});
</script>

<template>
  <div
    v-if="isHudVisible"
    role="region"
    aria-label="Panel Diagnostik Performa Developer"
    class="fixed bottom-4 right-4 z-50 flex w-80 flex-col overflow-hidden rounded-md border border-border bg-card/95 font-mono text-xs text-foreground shadow-2xl backdrop-blur-md"
  >
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-border bg-panel px-3 py-2">
      <div class="flex items-center gap-2">
        <span class="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span class="font-bold tracking-tight text-foreground">HUD Diagnostik</span>
        <span class="text-[10px] text-muted-foreground">(Ctrl+Shift+D)</span>
      </div>
      <button
        type="button"
        class="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        title="Tutup HUD"
        aria-label="Tutup panel diagnostik"
        @click="toggleHud"
      >
        <FontAwesomeIcon :icon="faXmark" class="h-3 w-3" />
      </button>
    </div>

    <!-- Core Metrics -->
    <div class="grid grid-cols-2 gap-2 border-b border-border p-3">
      <div class="flex flex-col gap-1 rounded border border-border/60 bg-muted/30 p-2">
        <span class="text-[10px] uppercase text-muted-foreground">Frame Rate</span>
        <div class="flex items-baseline gap-1.5">
          <span
            class="inline-flex items-center rounded border px-1.5 py-0.5 text-sm font-bold tabular-nums"
            :class="fpsBadgeClass"
          >
            {{ fps }} FPS
          </span>
          <span class="text-[10px] text-muted-foreground tabular-nums">
            {{ frameLatency }}ms
          </span>
        </div>
      </div>

      <div class="flex flex-col gap-1 rounded border border-border/60 bg-muted/30 p-2">
        <span class="text-[10px] uppercase text-muted-foreground">JS Heap Memory</span>
        <div class="flex items-baseline gap-1">
          <span class="text-sm font-bold tabular-nums text-foreground">
            {{ usedHeapMb !== null ? `${usedHeapMb} MB` : 'N/A' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Application State Counts -->
    <div class="flex items-center justify-between border-b border-border bg-panel/50 px-3 py-1.5 text-[11px]">
      <span class="text-muted-foreground">Studio Entries / Decoded:</span>
      <span class="font-bold tabular-nums text-foreground">
        {{ store.fontProject.entries.length }} entri · {{ store.decodedUploads.size }} aktif
      </span>
    </div>

    <!-- User Timing Measures -->
    <div class="flex max-h-40 flex-col overflow-y-auto p-2">
      <div class="mb-1 flex items-center justify-between text-[10px] uppercase text-muted-foreground">
        <span>Pengukuran User Timing</span>
        <button
          type="button"
          class="hover:text-primary underline"
          @click="clearHistory"
        >
          Bersihkan
        </button>
      </div>

      <div v-if="reversedMeasures.length === 0" class="py-2 text-center text-[10px] text-muted-foreground">
        Belum ada pengukuran tercatat.
      </div>

      <div
        v-for="(rec, idx) in reversedMeasures"
        :key="idx"
        class="flex items-center justify-between border-b border-border/40 py-1 text-[11px] last:border-0"
      >
        <span class="truncate text-foreground" :title="rec.name">{{ rec.name }}</span>
        <span class="font-bold tabular-nums text-primary">{{ rec.durationMs }}ms</span>
      </div>
    </div>
  </div>
</template>
