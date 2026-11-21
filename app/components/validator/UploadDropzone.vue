<script setup lang="ts">
import { ref } from 'vue';
import {
  faArrowUpFromBracket,
  faBoxArchive,
  faCheck,
  faRotate,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { Button } from '@/components/ui/button';

interface Props {
  readonly activeFile: File | null;
  readonly isValidating: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  fileSelected: [file: File];
}>();

const isDragging = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

function formatBytesSummary(bytes: number): string {
  const mib = (bytes / (1024 * 1024)).toFixed(2);
  return `${mib} MiB (${bytes.toLocaleString('id-ID')} byte)`;
}

function handleFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    emit('fileSelected', file);
  }
  input.value = '';
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
  isDragging.value = true;
}

function handleDragLeave(event: DragEvent): void {
  const container = event.currentTarget as HTMLElement | null;
  if (container && container.contains(event.relatedTarget as Node | null)) {
    return;
  }
  isDragging.value = false;
}

function handleDrop(event: DragEvent): void {
  event.preventDefault();
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    emit('fileSelected', file);
  }
}
</script>

<template>
  <section aria-labelledby="upload-section-heading" class="space-y-2.5">
    <!-- Header strip -->
    <div class="flex items-center justify-between gap-2">
      <h2
        id="upload-section-heading"
        class="font-mono text-xs font-semibold text-foreground"
      >
        Berkas Resource Pack
      </h2>
      <span class="rounded border border-border/60 bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
        Maksimal 250 MB
      </span>
    </div>

    <!-- Receiver Box -->
    <div
      :class="[
        'flex flex-col gap-3 rounded-lg border p-4 transition-all duration-150',
        isDragging
          ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(155,115,190,0.5)]'
          : 'border-border bg-card hover:border-border hover:bg-card/90',
      ]"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/60 text-primary">
          <FontAwesomeIcon
            :icon="faBoxArchive"
            aria-hidden="true"
            class="h-4 w-4"
          />
        </div>
        <div class="min-w-0 flex-1 space-y-0.5">
          <p class="text-xs font-semibold text-foreground">
            {{
              isDragging
                ? 'Lepaskan berkas .zip sekarang'
                : 'Tarik dan letakkan berkas .zip ke sini'
            }}
          </p>
          <p class="text-[11px] text-muted-foreground">
            Mendukung Minecraft Java 1.21.1 hingga 26.3
          </p>
        </div>
      </div>

      <!-- Active File Readout Card -->
      <div
        v-if="activeFile"
        class="flex items-center justify-between gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 font-mono text-[11px]"
      >
        <div class="flex min-w-0 items-center gap-2">
          <FontAwesomeIcon
            :icon="faCheck"
            aria-hidden="true"
            class="h-3 w-3 shrink-0 text-emerald-400"
          />
          <span class="truncate font-semibold text-foreground">
            {{ activeFile.name }}
          </span>
        </div>
        <span class="shrink-0 font-medium text-emerald-400 tabular-nums">
          {{ formatBytesSummary(activeFile.size) }}
        </span>
      </div>

      <input
        ref="fileInputRef"
        id="pack-file-input"
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        class="sr-only"
        @change="handleFileChange"
      />

      <Button
        type="button"
        size="default"
        class="h-9 min-h-[36px] w-full text-xs font-semibold rounded-md active:scale-[0.96] transition-transform duration-100 ease-out"
        :disabled="isValidating"
        @click="fileInputRef?.click()"
      >
        <FontAwesomeIcon
          v-if="isValidating"
          :icon="faRotate"
          aria-hidden="true"
          class="mr-2 h-3.5 w-3.5 animate-spin"
        />
        <FontAwesomeIcon
          v-else
          :icon="faArrowUpFromBracket"
          aria-hidden="true"
          class="mr-2 h-3.5 w-3.5"
        />
        {{ isValidating ? 'Memeriksa Berkas...' : activeFile ? 'Ganti Berkas (.zip)' : 'Pilih Berkas (.zip)' }}
      </Button>
    </div>
  </section>
</template>
