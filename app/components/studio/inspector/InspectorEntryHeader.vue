<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  allocateNextSafePuaChar,
  formatCodepointHex,
  parseCodepointInput,
} from '@core/font/puaAllocator.ts';
import type { BitmapFontEntry, FontProjectEntry } from '@core/font/types.ts';
import { useWorkbenchStore } from '@/stores/workbenchStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const store = useWorkbenchStore();

const codepointDraft = ref<string | null>(null);

watch(
  () => store.selectedEntry?.id,
  () => {
    codepointDraft.value = null;
  },
);

const entry = computed(() => store.selectedEntry);

const currentPrimaryChar = computed(() => {
  const e = store.selectedEntry;
  if (!e) return '';
  if (e.kind === 'space') return e.char;
  return Array.from(e.chars[0] ?? '')[0] ?? '';
});

const displayedCodepoint = computed(() => {
  if (codepointDraft.value !== null) return codepointDraft.value;
  const cp = currentPrimaryChar.value.codePointAt(0);
  return cp !== undefined ? formatCodepointHex(cp) : '';
});

function updateBitmap(updater: (prev: BitmapFontEntry) => BitmapFontEntry): void {
  const e = store.selectedEntry;
  if (!e || e.kind !== 'bitmap') return;
  store.updateEntry(e.id, (prev) =>
    prev.kind === 'bitmap' ? updater(prev) : prev,
  );
}

function updateSpace(
  updater: (prev: Extract<FontProjectEntry, { kind: 'space' }>) => FontProjectEntry,
): void {
  const e = store.selectedEntry;
  if (!e || e.kind !== 'space') return;
  store.updateEntry(e.id, (prev) =>
    prev.kind === 'space' ? updater(prev) : prev,
  );
}

function applyPrimaryCodepoint(raw: string): void {
  codepointDraft.value = raw;
  const e = store.selectedEntry;
  if (!e) return;
  const cp = parseCodepointInput(raw);
  if (cp === null) return;
  const nextChar = String.fromCodePoint(cp);
  store.updateEntry(e.id, (prev) => {
    if (prev.kind === 'space') {
      return { ...prev, char: nextChar };
    }
    const restRows = prev.chars.slice(1);
    const firstRowRest = Array.from(prev.chars[0] ?? '').slice(1).join('');
    return { ...prev, chars: [`${nextChar}${firstRowRest}`, ...restRows] };
  });
}

function handleAutoAllocatePua(): void {
  const e = store.selectedEntry;
  if (!e) return;
  const safeChar = allocateNextSafePuaChar(store.fontProject.entries);
  codepointDraft.value = null;
  store.updateEntry(e.id, (prev) => {
    if (prev.kind === 'space') {
      return { ...prev, char: safeChar };
    }
    const restRows = prev.chars.slice(1);
    const firstRowRest = Array.from(prev.chars[0] ?? '').slice(1).join('');
    return { ...prev, chars: [`${safeChar}${firstRowRest}`, ...restRows] };
  });
}
</script>

<template>
  <div v-if="entry" class="space-y-2 rounded-sm border border-border/70 bg-card/60 p-2.5">
    <!-- Row 1: ID & Type Badge -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-1.5">
        <span class="truncate font-mono text-[11px] font-semibold text-foreground">
          {{ entry.id }}
        </span>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <span
          v-if="displayedCodepoint"
          class="rounded bg-primary/15 border border-primary/30 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary tabular-nums"
          data-testid="entry-pua-badge"
        >
          {{ displayedCodepoint }}
        </span>
        <span
          v-if="entry.kind === 'space'"
          class="rounded bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 font-mono text-[10px] font-medium text-sky-400"
        >
          Spasi
        </span>
        <span
          v-else-if="entry.sourceMode === 'composer'"
          class="rounded bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 font-mono text-[10px] font-medium text-purple-300"
        >
          Bitmap
        </span>
        <span
          v-else
          class="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 font-mono text-[10px] font-medium text-emerald-400"
        >
          PNG
        </span>
      </div>
    </div>

    <!-- Row 2: Label Input -->
    <div class="grid grid-cols-[88px_1fr] items-center gap-2">
      <Label
        :for="entry.kind === 'space' ? 'space-label-input' : 'bitmap-label-input'"
        class="text-[11px] font-medium text-foreground"
      >
        Label
      </Label>
      <Input
        :id="entry.kind === 'space' ? 'space-label-input' : 'bitmap-label-input'"
        type="text"
        :model-value="entry.label"
        class="h-7 rounded-sm bg-muted/80 px-2 text-xs text-foreground"
        @update:model-value="
          entry.kind === 'space'
            ? updateSpace((prev) => ({ ...prev, label: String($event ?? '') }))
            : updateBitmap((prev) => ({ ...prev, label: String($event ?? '') }))
        "
      />
    </div>

    <!-- Row 3: Codepoint PUA input + Otomatis button -->
    <div class="grid grid-cols-[88px_1fr] items-center gap-2">
      <Label
        :for="entry.kind === 'space' ? 'space-cp-input' : 'bitmap-cp-input'"
        class="text-[11px] font-medium text-foreground"
      >
        Codepoint PUA
      </Label>
      <div class="flex items-center gap-1">
        <Input
          :id="entry.kind === 'space' ? 'space-cp-input' : 'bitmap-cp-input'"
          type="text"
          :model-value="displayedCodepoint"
          class="h-7 rounded-sm bg-muted/80 px-2 font-mono text-xs tabular-nums text-foreground"
          @update:model-value="applyPrimaryCodepoint(String($event ?? ''))"
          @blur="codepointDraft = null"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          class="h-7 shrink-0 rounded-sm px-2 font-mono text-[10px] text-primary transition-transform active:scale-[0.96]"
          @click="handleAutoAllocatePua()"
        >
          Otomatis
        </Button>
      </div>
    </div>
  </div>
</template>
