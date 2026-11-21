<script setup lang="ts">
import { computed } from 'vue';
import {
  faArrowRight,
  faCheck,
  faCircleNotch,
  faHashtag,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { Sha1ProgressState } from '@/stores/workbenchStore';
import CopyButton from '@/components/shared/CopyButton.vue';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface Props {
  readonly sha1State: Sha1ProgressState;
  readonly activeFile: File | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  openServerConfig: [];
}>();

function formatMiB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2);
}

const progressPercent = computed(() => Math.round(props.sha1State.ratio * 100));
</script>

<template>
  <section aria-labelledby="sha1-card-heading" class="space-y-2.5">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-1.5">
        <FontAwesomeIcon :icon="faHashtag" aria-hidden="true" class="h-3 w-3 text-muted-foreground" />
        <h2 id="sha1-card-heading" class="font-mono text-xs font-semibold text-foreground">
          Ringkasan SHA-1
        </h2>
      </div>

      <!-- State indicator label -->
      <span class="font-mono text-[11px] text-muted-foreground tabular-nums">
        <template v-if="sha1State.status === 'idle'">Belum Ada Berkas</template>
        <template v-else-if="sha1State.status === 'hashing'">
          {{ progressPercent }}%
        </template>
        <template v-else-if="sha1State.status === 'done'">
          {{ formatMiB(sha1State.totalBytes) }} MB
        </template>
        <template v-else>Gagal</template>
      </span>
    </div>

    <!-- Idle state -->
    <div
      v-if="sha1State.status === 'idle'"
      class="rounded-lg border border-dashed border-border/80 bg-muted/20 p-3 text-center"
    >
      <p class="text-xs text-muted-foreground leading-relaxed">
        Pilih berkas resource pack untuk menghitung hash SHA-1 secara otomatis.
      </p>
    </div>

    <!-- Hashing state -->
    <div
      v-else-if="sha1State.status === 'hashing'"
      class="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3"
    >
      <div class="flex items-center justify-between text-xs">
        <span class="inline-flex items-center gap-1.5 font-medium text-foreground">
          <FontAwesomeIcon :icon="faCircleNotch" aria-hidden="true" class="h-3 w-3 animate-spin text-primary" />
          Menghitung hash SHA-1...
        </span>
        <span class="font-mono text-[11px] text-primary tabular-nums">
          {{ formatMiB(sha1State.bytesRead) }} MB
        </span>
      </div>
      <Progress :model-value="progressPercent" class="h-1.5" />
    </div>

    <!-- Done state -->
    <div
      v-else-if="sha1State.status === 'done' && sha1State.sha1Hex"
      class="space-y-2.5 rounded-lg border border-border bg-card p-3 shadow-xs"
    >
      <div class="flex items-center justify-between text-[11px]">
        <span class="inline-flex items-center gap-1 font-semibold text-emerald-400">
          <FontAwesomeIcon :icon="faCheck" aria-hidden="true" class="h-2.5 w-2.5" />
          Selesai Dihitung
        </span>
        <span class="font-mono text-muted-foreground">40 karakter hex</span>
      </div>

      <!-- Hex Readout -->
      <code
        id="sidebar-sha1-hex"
        class="block break-all rounded border border-border/60 bg-background/80 p-2 font-mono text-[11px] font-semibold text-primary select-all tabular-nums"
      >
        {{ sha1State.sha1Hex }}
      </code>

      <!-- Action buttons -->
      <div class="flex items-center gap-2 pt-0.5">
        <CopyButton
          compact
          target-id="sidebar-sha1-hex"
          :text-to-copy="sha1State.sha1Hex"
          label="Salin SHA-1"
          aria-label="Salin digest SHA-1 ke papan klip"
          class="flex-1 active:scale-[0.96] transition-transform duration-100 ease-out"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground active:scale-[0.96] transition-transform duration-100 ease-out"
          @click="emit('openServerConfig')"
        >
          <span>Konfigurasi Server</span>
          <FontAwesomeIcon :icon="faArrowRight" aria-hidden="true" class="h-2.5 w-2.5" />
        </Button>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="sha1State.status === 'error'"
      class="rounded-lg border border-destructive/40 bg-destructive/15 p-3 text-xs text-destructive space-y-1"
    >
      <div class="flex items-center gap-1.5 font-semibold">
        <FontAwesomeIcon :icon="faTriangleExclamation" aria-hidden="true" class="h-3.5 w-3.5" />
        <span>Gagal menghitung hash</span>
      </div>
      <p class="text-[11px] text-destructive/90 leading-relaxed">
        {{ sha1State.errorMessage ?? 'Terjadi kesalahan saat membaca berkas arsip.' }}
      </p>
    </div>
  </section>
</template>
