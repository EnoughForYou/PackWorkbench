<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faChevronDown, faUpload } from '@fortawesome/free-solid-svg-icons';
import type { BitmapFontEntry, FontProjectEntry } from '@core/font/types.ts';
import { useWorkbenchStore } from '@/stores/workbenchStore';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

const store = useWorkbenchStore();

const charsDraft = ref<string | null>(null);
const replacePngRef = ref<HTMLInputElement | null>(null);
const metricsOpen = ref<boolean>(false);

watch(
  () => store.selectedEntry?.id,
  () => {
    charsDraft.value = null;
  },
);

const entry = computed(() => store.selectedEntry);

const selectedEntryErrors = computed(() => {
  const e = store.selectedEntry;
  if (!e) return [];
  return store.validation.findings.filter(
    (f) => f.entryId === e.id && f.severity === 'ERROR',
  );
});

const ascentError = computed(() =>
  selectedEntryErrors.value.some((f) => f.id === 'F01'),
);

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

function escapeCharsForInput(chars: readonly string[]): string {
  return chars
    .map((row) =>
      Array.from(row)
        .map((ch) => {
          const cp = ch.codePointAt(0) ?? 0;
          if (cp >= 0x20 && cp <= 0x7e && cp !== 0x5c) return ch;
          if (cp <= 0xffff) {
            return `\\u${cp.toString(16).toUpperCase().padStart(4, '0')}`;
          }
          return `\\u{${cp.toString(16).toUpperCase()}}`;
        })
        .join(''),
    )
    .join('\n');
}

function parseCharsTextarea(raw: string): string[] {
  return raw.split(/\r?\n/).map((line) =>
    line.replace(
      /\\u\{([0-9a-fA-F]{1,6})\}|\\u([0-9a-fA-F]{4})/g,
      (full, bracedHex: string | undefined, fourHex: string | undefined) => {
        const cp = Number.parseInt(bracedHex ?? fourHex ?? '', 16);
        if (Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff) {
          return String.fromCodePoint(cp);
        }
        return full;
      },
    ),
  );
}

function hasIncompleteUnicodeEscape(raw: string): boolean {
  return /(?:^|[^\\])\\(?:u(?:\{[0-9a-fA-F]{0,6}|[0-9a-fA-F]{0,3})?)?$/.test(raw);
}

const displayedChars = computed(() => {
  if (charsDraft.value !== null) return charsDraft.value;
  const e = store.selectedEntry;
  if (!e || e.kind !== 'bitmap') return '';
  return escapeCharsForInput(e.chars);
});

function handleCharsInput(raw: string): void {
  const e = store.selectedEntry;
  if (!e || e.kind !== 'bitmap') return;
  charsDraft.value = raw;
  if (!hasIncompleteUnicodeEscape(raw)) {
    store.updateEntry(e.id, (prev) =>
      prev.kind === 'bitmap' ? { ...prev, chars: parseCharsTextarea(raw) } : prev,
    );
  }
}

function commitCharsBlur(): void {
  const e = store.selectedEntry;
  if (charsDraft.value === null || !e || e.kind !== 'bitmap') return;
  const committed = charsDraft.value;
  charsDraft.value = null;
  store.updateEntry(e.id, (prev) =>
    prev.kind === 'bitmap' ? { ...prev, chars: parseCharsTextarea(committed) } : prev,
  );
}

function handleReplacePngChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file && store.selectedEntry) {
    store.replaceEntryPng(store.selectedEntry.id, file);
  }
  input.value = '';
}
</script>

<template>
  <div v-if="entry" class="space-y-2.5">
    <!-- Space Advance Controls (if Space entry) -->
    <div v-if="entry.kind === 'space'" class="space-y-2 pt-1">
      <div class="grid grid-cols-[96px_1fr] items-center gap-2">
        <Label for="space-adv-input" class="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
          <span>Lebar Maju</span>
          <span class="font-mono text-[10px] text-muted-foreground">px</span>
        </Label>
        <Input
          id="space-adv-input"
          type="number"
          step="0.25"
          placeholder="0"
          :model-value="Number.isFinite(entry.advance) ? entry.advance : 0"
          class="h-7 rounded-sm bg-muted/80 px-2 font-mono text-xs tabular-nums text-foreground"
          @update:model-value="
            updateSpace((prev) => {
              const parsed = Number.parseFloat(String($event ?? 0));
              return { ...prev, advance: Number.isNaN(parsed) ? 0 : parsed };
            })
          "
        />
      </div>

      <Slider
        :model-value="[Math.max(-32, Math.min(32, entry.advance))]"
        :min="-32"
        :max="32"
        :step="1"
        aria-label="Atur nilai lebar maju spasi"
        @update:model-value="
          (vals) => {
            const v = vals?.[0];
            if (v !== undefined) {
              updateSpace((prev) => ({ ...prev, advance: v }));
            }
          }
        "
      />
      <p class="text-[10px] leading-snug text-muted-foreground">
        SpaceProvider menerima nilai float apa pun; nilai &lt; 0 atau &gt; 32 dilewati dalam mode <code>&amp;k</code>.
      </p>
    </div>

    <!-- Bitmap Metrics Section -->
    <template v-else-if="entry.kind === 'bitmap'">
      <!-- Uploaded PNG Info & Replace -->
      <div
        v-if="entry.sourceMode === 'uploaded-png'"
        class="flex items-center justify-between gap-2 py-1"
      >
        <span class="truncate font-mono text-[11px] text-foreground">
          {{ entry.uploadedPngFileName ?? 'PNG Kustom' }}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="h-7 shrink-0 gap-1.5 rounded-sm px-2 text-[11px] transition-transform active:scale-[0.96]"
          @click="replacePngRef?.click()"
        >
          <FontAwesomeIcon :icon="faUpload" class="h-3 w-3" />
          <span>Ganti PNG</span>
        </Button>
        <input
          ref="replacePngRef"
          type="file"
          accept="image/png,.png"
          aria-label="Ganti berkas PNG"
          class="sr-only"
          @change="handleReplacePngChange"
        />
      </div>

      <!-- Collapsible Mojang BitmapProvider Metrics Section -->
      <Collapsible v-model:open="metricsOpen" class="space-y-2.5">
        <CollapsibleTrigger as-child>
          <button
            type="button"
            class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm py-0.5 text-left hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span class="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <FontAwesomeIcon
                :icon="faChevronDown"
                :class="[
                  'h-3.5 w-3.5 transition-transform duration-150',
                  metricsOpen ? 'rotate-0 text-foreground' : '-rotate-90',
                ]"
              />
              <span>Metrik BitmapProvider</span>
            </span>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent class="space-y-2.5">
          <!-- Height and Ascent -->
          <div class="grid grid-cols-[88px_1fr] items-center gap-2">
            <span class="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
              <span>Tinggi / Ascent</span>
              <span class="font-mono text-[10px] text-muted-foreground">px</span>
            </span>
            <div class="grid grid-cols-2 gap-1.5">
              <div>
                <Label for="bitmap-height-input" class="sr-only">Tinggi</Label>
                <Input
                  id="bitmap-height-input"
                  type="number"
                  placeholder="Tinggi"
                  :model-value="entry.height"
                  :aria-invalid="ascentError"
                  :class="[
                    'h-7 rounded-sm bg-muted/80 px-2 font-mono text-xs tabular-nums text-foreground',
                    ascentError ? 'border-destructive text-destructive' : '',
                  ]"
                  @update:model-value="
                    updateBitmap((prev) => {
                      const v = Number.parseInt(String($event ?? '1'), 10);
                      return { ...prev, height: Number.isNaN(v) ? 1 : v };
                    })
                  "
                />
              </div>
              <div>
                <Label for="bitmap-ascent-input" class="sr-only">Ascent</Label>
                <Input
                  id="bitmap-ascent-input"
                  type="number"
                  placeholder="Ascent"
                  :model-value="entry.ascent"
                  :aria-invalid="ascentError"
                  :class="[
                    'h-7 rounded-sm bg-muted/80 px-2 font-mono text-xs tabular-nums text-foreground',
                    ascentError ? 'border-destructive text-destructive' : '',
                  ]"
                  @update:model-value="
                    updateBitmap((prev) => {
                      const v = Number.parseInt(String($event ?? '0'), 10);
                      return { ...prev, ascent: Number.isNaN(v) ? 0 : v };
                    })
                  "
                />
              </div>
            </div>
          </div>

          <p v-if="ascentError" class="font-mono text-[10px] text-red-300">
            F01: Nilai ascent ({{ entry.ascent }}) melebihi tinggi glif ({{ entry.height }}).
          </p>

          <!-- Space Left / Right (Composer) -->
          <div
            v-if="entry.sourceMode === 'composer'"
            class="grid grid-cols-[88px_1fr] items-center gap-2"
          >
            <span class="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
              <span>Spasi Kiri / Kanan</span>
              <span class="font-mono text-[10px] text-muted-foreground">px</span>
            </span>
            <div class="grid grid-cols-2 gap-1.5">
              <div>
                <Label for="bitmap-space-left" class="sr-only">Spasi Kiri</Label>
                <Input
                  id="bitmap-space-left"
                  type="number"
                  step="0.5"
                  placeholder="Kiri"
                  :model-value="entry.spaceLeft"
                  class="h-7 rounded-sm bg-muted/80 px-2 font-mono text-xs tabular-nums text-foreground"
                  @update:model-value="
                    updateBitmap((prev) => {
                      const v = Number.parseFloat(String($event ?? '0'));
                      return { ...prev, spaceLeft: Number.isNaN(v) ? 0 : v };
                    })
                  "
                />
              </div>
              <div>
                <Label for="bitmap-space-right" class="sr-only">Spasi Kanan</Label>
                <Input
                  id="bitmap-space-right"
                  type="number"
                  step="0.5"
                  placeholder="Kanan"
                  :model-value="entry.spaceRight"
                  class="h-7 rounded-sm bg-muted/80 px-2 font-mono text-xs tabular-nums text-foreground"
                  @update:model-value="
                    updateBitmap((prev) => {
                      const v = Number.parseFloat(String($event ?? '0'));
                      return { ...prev, spaceRight: Number.isNaN(v) ? 0 : v };
                    })
                  "
                />
              </div>
            </div>
          </div>

          <!-- File Reference -->
          <div class="grid grid-cols-[88px_1fr] items-center gap-2">
            <Label for="bitmap-fileref-input" class="text-[11px] font-medium text-foreground">
              Jalur Berkas
            </Label>
            <Input
              id="bitmap-fileref-input"
              type="text"
              :model-value="entry.fileRef"
              class="h-7 rounded-sm bg-muted/80 px-2 font-mono text-[11px] text-foreground"
              @update:model-value="
                updateBitmap((prev) => ({
                  ...prev,
                  fileRef: String($event ?? ''),
                }))
              "
            />
          </div>

          <!-- Character Matrix (chars) -->
          <div class="space-y-1">
            <Label for="bitmap-chars-textarea" class="text-[11px] font-medium text-foreground">
              Matriks Karakter Glif
            </Label>
            <p class="text-[10px] text-muted-foreground">
              Baris baru untuk setiap baris glif pada berkas sprite sheet (chars).
            </p>
            <Textarea
              id="bitmap-chars-textarea"
              :rows="Math.min(4, Math.max(2, entry.chars.length))"
              :model-value="displayedChars"
              class="min-h-14 rounded-sm bg-muted/80 px-2 py-1.5 font-mono text-[11px] text-foreground"
              @update:model-value="handleCharsInput(String($event ?? ''))"
              @blur="commitCharsBlur()"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </template>
  </div>
</template>
