<script setup lang="ts">
import { ref } from 'vue';
import { FolderUp } from '@lucide/vue';
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
  return `${mib} MiB (${bytes.toLocaleString('en-US')} B)`;
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
    <div class="flex items-center justify-between gap-2">
      <h2
        id="upload-section-heading"
        class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        1. Resource Pack Archive (.zip)
      </h2>
      <span class="font-mono text-[10px] text-[#868694]">Max 250 MiB (Z08)</span>
    </div>

    <div
      :class="[
        'flex flex-col gap-3 border border-dashed p-3.5 transition-colors',
        isDragging
          ? 'border-primary bg-primary/10'
          : 'border-border bg-[#09090c]',
      ]"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div class="flex items-start gap-2.5">
        <FolderUp
          aria-hidden="true"
          class="mt-0.5 h-4 w-4 shrink-0 text-primary"
        />
        <div class="min-w-0 flex-1 space-y-1">
          <p class="text-xs font-medium text-foreground">
            {{
              isDragging
                ? 'Drop .zip archive here...'
                : 'Drag .zip here or choose from device.'
            }}
          </p>
          <p
            v-if="activeFile"
            class="truncate font-mono text-[11px] text-[#ff8f6b] tabular-nums"
          >
            {{ activeFile.name }} · {{ formatBytesSummary(activeFile.size) }}
          </p>
          <p v-else class="text-[11px] text-muted-foreground">
            All checks run locally in browser memory.
          </p>
        </div>
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
        size="sm"
        class="h-8 w-full text-xs font-semibold"
        :disabled="isValidating"
        @click="fileInputRef?.click()"
      >
        {{ isValidating ? 'Inspecting ZIP...' : 'Choose .zip File' }}
      </Button>
    </div>
  </section>
</template>
