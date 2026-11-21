<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faCheck,
  faChevronDown,
  faCopy,
  faObjectUngroup,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import {
  PIXEL_ICONS,
  parseHexRgba,
  type RgbaRaster,
} from '@core/font/pixelSynth.ts';
import {
  allocateNextSafePuaChar,
  formatCodepointHex,
  parseCodepointInput,
} from '@core/font/puaAllocator.ts';
import type {
  BitmapFontEntry,
  CanvasWidthMode,
  FontProjectEntry,
  PixelFontSize,
  PixelIconId,
  RankBadgeLayout,
  RankFrameStyle,
  SplitIconFrameMode,
} from '@core/font/types.ts';
import { useWorkbenchStore, type ComposerSubTab } from '@/stores/workbenchStore';
import PixelPreviewCanvas from '@/components/shared/PixelPreviewCanvas.vue';
import StudioColorPicker from '@/components/shared/StudioColorPicker.vue';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const store = useWorkbenchStore();

const codepointDraft = ref<string | null>(null);
const charsDraft = ref<string | null>(null);
const replacePngRef = ref<HTMLInputElement | null>(null);
const metricsOpen = ref<boolean>(false);
const copiedFieldKey = ref<string | null>(null);
let copiedFieldTimer: number | null = null;

watch(
  () => store.selectedEntry?.id,
  () => {
    codepointDraft.value = null;
    charsDraft.value = null;
  },
);

const selectedEntryErrors = computed(() => {
  const entry = store.selectedEntry;
  if (!entry) return [];
  return store.validation.findings.filter(
    (f) => f.entryId === entry.id && f.severity === 'ERROR',
  );
});

const ascentError = computed(() =>
  selectedEntryErrors.value.some((f) => f.id === 'F01'),
);

const currentPrimaryChar = computed(() => {
  const entry = store.selectedEntry;
  if (!entry) return '';
  if (entry.kind === 'space') return entry.char;
  return Array.from(entry.chars[0] ?? '')[0] ?? '';
});

const displayedCodepoint = computed(() => {
  if (codepointDraft.value !== null) return codepointDraft.value;
  const cp = currentPrimaryChar.value.codePointAt(0);
  return cp !== undefined ? formatCodepointHex(cp) : '';
});

function copyFieldColor(fieldKey: string, hex: string): void {
  store.copyColorHex(hex);
  copiedFieldKey.value = fieldKey;
  if (typeof window !== 'undefined') {
    if (copiedFieldTimer !== null) {
      window.clearTimeout(copiedFieldTimer);
    }
    copiedFieldTimer = window.setTimeout(() => {
      copiedFieldKey.value = null;
    }, 1500);
  }
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
  const entry = store.selectedEntry;
  if (!entry || entry.kind !== 'bitmap') return '';
  return escapeCharsForInput(entry.chars);
});

function applyPrimaryCodepoint(raw: string): void {
  codepointDraft.value = raw;
  const entry = store.selectedEntry;
  if (!entry) return;
  const cp = parseCodepointInput(raw);
  if (cp === null) return;
  charsDraft.value = null;
  const nextChar = String.fromCodePoint(cp);
  store.updateEntry(entry.id, (prev) => {
    if (prev.kind === 'space') {
      return { ...prev, char: nextChar };
    }
    const restRows = prev.chars.slice(1);
    const firstRowRest = Array.from(prev.chars[0] ?? '').slice(1).join('');
    return { ...prev, chars: [`${nextChar}${firstRowRest}`, ...restRows] };
  });
}

function handleAutoAllocatePua(): void {
  const entry = store.selectedEntry;
  if (!entry) return;
  const safeChar = allocateNextSafePuaChar(store.fontProject.entries);
  codepointDraft.value = null;
  charsDraft.value = null;
  store.updateEntry(entry.id, (prev) => {
    if (prev.kind === 'space') {
      return { ...prev, char: safeChar };
    }
    const restRows = prev.chars.slice(1);
    const firstRowRest = Array.from(prev.chars[0] ?? '').slice(1).join('');
    return { ...prev, chars: [`${safeChar}${firstRowRest}`, ...restRows] };
  });
}

function handleCharsInput(raw: string): void {
  const entry = store.selectedEntry;
  if (!entry || entry.kind !== 'bitmap') return;
  charsDraft.value = raw;
  if (!hasIncompleteUnicodeEscape(raw)) {
    codepointDraft.value = null;
    store.updateEntry(entry.id, (prev) =>
      prev.kind === 'bitmap' ? { ...prev, chars: parseCharsTextarea(raw) } : prev,
    );
  }
}

function commitCharsBlur(): void {
  const entry = store.selectedEntry;
  if (charsDraft.value === null || !entry || entry.kind !== 'bitmap') return;
  const committed = charsDraft.value;
  charsDraft.value = null;
  codepointDraft.value = null;
  store.updateEntry(entry.id, (prev) =>
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

function buildIconPreviewRaster(
  rows: readonly string[],
  width: number,
  height: number,
  hexColor: string,
): RgbaRaster | null {
  if (width === 0 || height === 0 || rows.length === 0) return null;
  const rgba = new Uint8ClampedArray(width * height * 4);
  const color = parseHexRgba(hexColor, [255, 94, 44, 255]);
  for (let y = 0; y < height; y++) {
    const row = rows[y] ?? '';
    for (let x = 0; x < width; x++) {
      if (row[x] === '#') {
        const idx = (y * width + x) * 4;
        rgba[idx] = color[0];
        rgba[idx + 1] = color[1];
        rgba[idx + 2] = color[2];
        rgba[idx + 3] = color[3];
      }
    }
  }
  return { width, height, rgba };
}

function updateBitmap(updater: (prev: BitmapFontEntry) => BitmapFontEntry): void {
  const entry = store.selectedEntry;
  if (!entry || entry.kind !== 'bitmap') return;
  store.updateEntry(entry.id, (prev) =>
    prev.kind === 'bitmap' ? updater(prev) : prev,
  );
}

function updateSpace(
  updater: (prev: Extract<FontProjectEntry, { kind: 'space' }>) => FontProjectEntry,
): void {
  const entry = store.selectedEntry;
  if (!entry || entry.kind !== 'space') return;
  store.updateEntry(entry.id, (prev) =>
    prev.kind === 'space' ? updater(prev) : prev,
  );
}

function handleComposerSubTabChange(val: unknown): void {
  if (val === 'text' || val === 'icon' || val === 'frame') {
    store.composerSubTab = val as ComposerSubTab;
  }
}
</script>

<template>
  <div class="space-y-3 p-3">
    <p v-if="!store.selectedEntry" class="py-4 text-xs text-muted-foreground">
      Pilih entri di bilah kiri untuk mengedit propertinya.
    </p>

    <!-- Space Entry Editor -->
    <div v-else-if="store.selectedEntry.kind === 'space'" class="space-y-3">
      <p class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Penyedia Spasi Negatif
      </p>

      <div class="grid grid-cols-[96px_1fr] items-center gap-2">
        <Label for="space-label-input" class="text-[11px] font-medium text-foreground">
          Label
        </Label>
        <Input
          id="space-label-input"
          type="text"
          :model-value="store.selectedEntry.label"
          class="h-7 rounded-sm bg-muted/80 px-2 text-xs text-foreground"
          @update:model-value="
            updateSpace((prev) => ({ ...prev, label: String($event ?? '') }))
          "
        />
      </div>

      <div class="grid grid-cols-[96px_1fr] items-center gap-2">
        <Label for="space-cp-input" class="text-[11px] font-medium text-foreground">
          Codepoint PUA
        </Label>
        <div class="flex items-center gap-1">
          <Input
            id="space-cp-input"
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

      <div class="space-y-2 pt-1">
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
            :model-value="Number.isFinite(store.selectedEntry.advance) ? store.selectedEntry.advance : 0"
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
          :model-value="[Math.max(-32, Math.min(32, store.selectedEntry.advance))]"
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
    </div>

    <!-- Bitmap / Rank Composer Editor -->
    <div v-else class="space-y-3">
      <!-- Composer Layer Properties -->
      <template v-if="store.selectedEntry.sourceMode === 'composer'">
        <div class="flex items-center justify-between gap-2">
          <span class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Penyusun Rank
          </span>
          <ToggleGroup
            type="single"
            :model-value="store.composerSubTab"
            aria-label="Sub-bagian penyusun rank"
            class="gap-0.5 rounded-sm border border-border bg-muted/80 p-0.5"
            @update:model-value="handleComposerSubTabChange"
          >
            <ToggleGroupItem
              value="text"
              class="h-6 rounded-sm px-2.5 text-[11px] font-medium transition-[background-color,color] duration-100 ease-out data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground"
            >
              Teks
            </ToggleGroupItem>
            <ToggleGroupItem
              value="icon"
              class="h-6 rounded-sm px-2.5 text-[11px] font-medium transition-[background-color,color] duration-100 ease-out data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground"
            >
              Ikon
            </ToggleGroupItem>
            <ToggleGroupItem
              value="frame"
              class="h-6 rounded-sm px-2.5 text-[11px] font-medium transition-[background-color,color] duration-100 ease-out data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground"
            >
              Bingkai
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <!-- Text Section -->
        <div v-if="store.composerSubTab === 'text'" class="space-y-2.5">
          <div class="grid grid-cols-[88px_1fr] items-center gap-2">
            <Label for="rank-text-input" class="text-[11px] font-medium text-foreground">
              Teks Badge
            </Label>
            <Input
              id="rank-text-input"
              type="text"
              :model-value="store.selectedEntry.composer.text"
              class="h-7 rounded-sm bg-muted/80 px-2 font-mono text-xs text-foreground"
              @update:model-value="
                updateBitmap((prev) => {
                  const val = String($event ?? '');
                  return {
                    ...prev,
                    label: val.trim() || prev.label,
                    composer: { ...prev.composer, text: val },
                  };
                })
              "
            />
          </div>

          <div class="grid grid-cols-[88px_1fr] items-center gap-2">
            <Label for="rank-fontsize-select" class="text-[11px] font-medium text-foreground">
              Font Piksel
            </Label>
            <Select
              :model-value="store.selectedEntry.composer.fontSize"
              @update:model-value="
                (val) => {
                  if (val === '3x5' || val === '5x5') {
                    updateBitmap((prev) => ({
                      ...prev,
                      composer: { ...prev.composer, fontSize: val as PixelFontSize },
                    }));
                  }
                }
              "
            >
              <SelectTrigger id="rank-fontsize-select" class="h-7 rounded-sm bg-muted/80 text-xs text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent class="rounded-md border-border">
                <SelectItem value="3x5">3×5 Ringkas</SelectItem>
                <SelectItem value="5x5">5×5 Tebal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid grid-cols-[88px_1fr] items-center gap-2">
            <Label class="text-[11px] font-medium text-foreground">
              Lebar Kanvas
            </Label>
            <div class="flex items-center gap-1.5">
              <ToggleGroup
                type="single"
                :model-value="store.selectedEntry.composer.canvasWidthMode ?? 'auto'"
                aria-label="Mode penentuan lebar kanvas"
                class="gap-0.5 rounded-sm border border-border bg-muted/80 p-0.5"
                @update:model-value="
                  (val) => {
                    if (val === 'auto' || val === 'fixed') {
                      const currentW =
                        store.validation.metricsByEntryId[store.selectedEntry!.id]?.imageWidth ?? 36;
                      updateBitmap((prev) => ({
                        ...prev,
                        composer: {
                          ...prev.composer,
                          canvasWidthMode: val as CanvasWidthMode,
                          customWidth: prev.composer.customWidth ?? currentW,
                        },
                      }));
                    }
                  }
                "
              >
                <ToggleGroupItem
                  value="auto"
                  class="h-6 rounded-sm px-2 text-[10px] data-[state=on]:bg-card data-[state=on]:text-foreground"
                >
                  Otomatis
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="fixed"
                  class="h-6 rounded-sm px-2 text-[10px] data-[state=on]:bg-card data-[state=on]:text-foreground"
                >
                  Kustom
                </ToggleGroupItem>
              </ToggleGroup>
              <Input
                v-if="store.selectedEntry.composer.canvasWidthMode === 'fixed'"
                type="number"
                :min="4"
                :max="256"
                aria-label="Lebar kanvas kustom dalam piksel"
                :model-value="
                  store.selectedEntry.composer.customWidth ??
                  store.validation.metricsByEntryId[store.selectedEntry.id]?.imageWidth ??
                  36
                "
                class="h-7 w-16 rounded-sm bg-muted/80 px-2 font-mono text-xs tabular-nums text-foreground"
                @update:model-value="
                  updateBitmap((prev) => ({
                    ...prev,
                    composer: {
                      ...prev.composer,
                      customWidth: Math.max(
                        4,
                        Math.min(256, Number.parseInt(String($event ?? '36'), 10) || 36),
                      ),
                    },
                  }))
                "
              />
              <span
                v-else
                class="font-mono text-[10px] text-muted-foreground tabular-nums"
              >
                {{
                  store.validation.metricsByEntryId[store.selectedEntry.id]?.imageWidth ?? '—'
                }}px
              </span>
            </div>
          </div>

          <div class="grid grid-cols-[88px_1fr_32px] items-center gap-2">
            <Label class="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
              <span>Padding X</span>
              <span class="font-mono text-[10px] text-muted-foreground">px</span>
            </Label>
            <Slider
              :model-value="[store.selectedEntry.composer.paddingX]"
              :min="0"
              :max="12"
              :step="1"
              aria-label="Padding horizontal badge"
              @update:model-value="
                (vals) => {
                  const v = vals?.[0];
                  if (v !== undefined) {
                    updateBitmap((prev) => ({
                      ...prev,
                      composer: { ...prev.composer, paddingX: v },
                    }));
                  }
                }
              "
            />
            <span class="text-right font-mono text-[11px] text-foreground tabular-nums">
              {{ store.selectedEntry.composer.paddingX }}
            </span>
          </div>

          <div class="grid grid-cols-[88px_1fr_32px] items-center gap-2">
            <Label class="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
              <span>Padding Y</span>
              <span class="font-mono text-[10px] text-muted-foreground">px</span>
            </Label>
            <Slider
              :model-value="[store.selectedEntry.composer.paddingY]"
              :min="0"
              :max="8"
              :step="1"
              aria-label="Padding vertikal badge"
              @update:model-value="
                (vals) => {
                  const v = vals?.[0];
                  if (v !== undefined) {
                    updateBitmap((prev) => ({
                      ...prev,
                      composer: { ...prev.composer, paddingY: v },
                    }));
                  }
                }
              "
            />
            <span class="text-right font-mono text-[11px] text-foreground tabular-nums">
              {{ store.selectedEntry.composer.paddingY }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-0.5">
            <div class="flex items-center justify-between gap-1.5 rounded-sm bg-muted/80 px-2 py-1">
              <span class="text-[11px] font-medium text-foreground">
                Teks
              </span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  title="Klik untuk menyalin kode HEX"
                  class="inline-flex cursor-pointer items-center gap-1 rounded bg-card px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-foreground hover:bg-accent transition-transform duration-100 ease-out active:scale-[0.96]"
                  @click="copyFieldColor('textColor', store.selectedEntry.composer.textColor)"
                >
                  <FontAwesomeIcon v-if="copiedFieldKey === 'textColor'" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
                  <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
                  <span>{{ store.selectedEntry.composer.textColor.toUpperCase() }}</span>
                </button>
                <StudioColorPicker
                  :model-value="store.selectedEntry.composer.textColor"
                  aria-label="Pilih warna teks badge"
                  trigger-class="h-5 w-5 rounded-[3px]"
                  side="left"
                  @update:model-value="
                    (color: string) =>
                      updateBitmap((prev) => ({
                        ...prev,
                        composer: {
                          ...prev.composer,
                          textColor: color,
                        },
                      }))
                  "
                />
              </div>
            </div>

            <div class="flex items-center justify-between gap-1.5 rounded-sm bg-muted/80 px-2 py-1">
              <span class="text-[11px] font-medium text-foreground">
                Bayangan
              </span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  title="Klik untuk menyalin kode HEX"
                  class="inline-flex cursor-pointer items-center gap-1 rounded bg-card px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-foreground hover:bg-accent transition-transform duration-100 ease-out active:scale-[0.96]"
                  @click="copyFieldColor('shadowColor', store.selectedEntry.composer.shadowColor)"
                >
                  <FontAwesomeIcon v-if="copiedFieldKey === 'shadowColor'" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
                  <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
                  <span>{{ store.selectedEntry.composer.shadowColor.toUpperCase() }}</span>
                </button>
                <StudioColorPicker
                  :model-value="store.selectedEntry.composer.shadowColor"
                  aria-label="Pilih warna bayangan teks badge"
                  trigger-class="h-5 w-5 rounded-[3px]"
                  side="left"
                  @update:model-value="
                    (color: string) =>
                      updateBitmap((prev) => ({
                        ...prev,
                        composer: {
                          ...prev.composer,
                          shadowColor: color,
                        },
                      }))
                  "
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Icon Section -->
        <div v-else-if="store.composerSubTab === 'icon'" class="space-y-2.5">
          <!-- Icon Left / Rank Right Separation Feature -->
          <div class="space-y-1.5 rounded-sm border border-border/70 bg-muted/80 p-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-medium text-foreground">
                Tata Letak Badge
              </span>
              <ToggleGroup
                type="single"
                :model-value="store.selectedEntry.composer.badgeLayout ?? 'unified'"
                aria-label="Mode tata letak badge"
                class="gap-0.5 rounded-sm border border-border bg-card p-0.5"
                @update:model-value="
                  (val) => {
                    if (val === 'unified' || val === 'split-left') {
                      updateBitmap((prev) => ({
                        ...prev,
                        composer: {
                          ...prev.composer,
                          badgeLayout: val as RankBadgeLayout,
                        },
                      }));
                    }
                  }
                "
              >
                <ToggleGroupItem
                  value="unified"
                  class="h-5 rounded-xs px-2 text-[10px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  Satu Kesatuan
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="split-left"
                  class="h-5 rounded-xs px-2 text-[10px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  Ikon Kiri · Rank Kanan
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div
              v-if="(store.selectedEntry.composer.badgeLayout ?? 'unified') === 'split-left'"
              class="flex items-center justify-between gap-2 border-t border-border/50 pt-1.5"
            >
              <span class="text-[10px] text-muted-foreground">
                Slot Ikon Kiri
              </span>
              <ToggleGroup
                type="single"
                :model-value="store.selectedEntry.composer.splitIconFrame ?? 'match'"
                aria-label="Gaya slot ikon kiri"
                class="gap-0.5"
                @update:model-value="
                  (val) => {
                    if (val === 'match' || val === 'none') {
                      updateBitmap((prev) => ({
                        ...prev,
                        composer: {
                          ...prev.composer,
                          splitIconFrame: val as SplitIconFrameMode,
                        },
                      }));
                    }
                  }
                "
              >
                <ToggleGroupItem
                  value="match"
                  class="h-5 rounded-xs px-2 text-[10px] data-[state=on]:bg-accent data-[state=on]:text-foreground"
                >
                  Berbingkai
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="none"
                  class="h-5 rounded-xs px-2 text-[10px] data-[state=on]:bg-accent data-[state=on]:text-foreground"
                >
                  Ikon Polos
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div class="flex items-center justify-between gap-2 pt-0.5">
              <span class="text-[10px] text-muted-foreground">
                Atau pisahkan menjadi 2 glif font terpisah
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                :disabled="store.selectedEntry.composer.iconId === 'none'"
                class="h-6 gap-1 rounded-sm px-2 font-mono text-[10px] transition-transform active:scale-[0.96]"
                @click="store.splitEntryToIconAndRank(store.selectedEntry.id)"
              >
                <FontAwesomeIcon :icon="faObjectUngroup" class="h-3 w-3" />
                <span>Pisahkan Glif</span>
              </Button>
            </div>
          </div>

          <!-- 25 Procedural Pixel Icons Grid -->
          <div class="grid grid-cols-5 gap-1">
            <button
              v-for="icon in PIXEL_ICONS"
              :key="icon.id"
              type="button"
              :aria-label="icon.label"
              :aria-pressed="store.selectedEntry.composer.iconId === icon.id"
              :title="icon.label"
              :class="[
                'flex h-8 cursor-pointer items-center justify-center rounded-sm transition-[background-color,transform] duration-100 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-primary',
                store.selectedEntry.composer.iconId === icon.id
                  ? 'bg-primary/20 ring-1 ring-primary'
                  : 'bg-card hover:bg-accent',
              ]"
              @click="
                updateBitmap((prev) => ({
                  ...prev,
                  composer: { ...prev.composer, iconId: icon.id as PixelIconId },
                }))
              "
            >
              <PixelPreviewCanvas
                v-if="
                  buildIconPreviewRaster(
                    icon.rows,
                    icon.width,
                    icon.height,
                    store.selectedEntry.composer.iconColor,
                  )
                "
                :raster="
                  buildIconPreviewRaster(
                    icon.rows,
                    icon.width,
                    icon.height,
                    store.selectedEntry.composer.iconColor,
                  )
                "
                :zoom="2"
                :aria-label="icon.label"
              />
              <span v-else class="font-mono text-xs text-muted-foreground">×</span>
            </button>
          </div>

          <div class="grid grid-cols-[88px_1fr_32px] items-center gap-2">
            <Label class="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
              <span>Jarak Ikon</span>
              <span class="font-mono text-[10px] text-muted-foreground">px</span>
            </Label>
            <Slider
              :model-value="[store.selectedEntry.composer.iconGap]"
              :min="0"
              :max="8"
              :step="1"
              aria-label="Jarak ikon dalam piksel"
              @update:model-value="
                (vals) => {
                  const v = vals?.[0];
                  if (v !== undefined) {
                    updateBitmap((prev) => ({
                      ...prev,
                      composer: { ...prev.composer, iconGap: v },
                    }));
                  }
                }
              "
            />
            <span class="text-right font-mono text-[11px] tabular-nums text-foreground">
              {{ store.selectedEntry.composer.iconGap }}
            </span>
          </div>

          <div class="flex items-center justify-between gap-2 rounded-sm bg-muted/80 px-2.5 py-1">
            <span class="text-[11px] font-medium text-foreground">
              Warna Ikon
            </span>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                title="Klik untuk menyalin kode HEX"
                class="inline-flex cursor-pointer items-center gap-1 rounded bg-card px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-foreground hover:bg-accent transition-transform duration-100 ease-out active:scale-[0.96]"
                @click="copyFieldColor('iconColor', store.selectedEntry.composer.iconColor)"
              >
                <FontAwesomeIcon v-if="copiedFieldKey === 'iconColor'" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
                <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
                <span>{{ store.selectedEntry.composer.iconColor.toUpperCase() }}</span>
              </button>
              <StudioColorPicker
                :model-value="store.selectedEntry.composer.iconColor"
                aria-label="Pilih warna ikon badge"
                trigger-class="h-5 w-5 rounded-[3px]"
                side="left"
                @update:model-value="
                  (color: string) =>
                    updateBitmap((prev) => ({
                      ...prev,
                      composer: {
                        ...prev.composer,
                        iconColor: color,
                      },
                    }))
                "
              />
            </div>
          </div>
        </div>

        <!-- Frame Section -->
        <div v-else class="space-y-2.5">
          <div class="grid grid-cols-[88px_1fr] items-center gap-2">
            <Label for="rank-frame-style" class="text-[11px] font-medium text-foreground">
              Gaya Bingkai
            </Label>
            <Select
              :model-value="store.selectedEntry.composer.frameStyle"
              @update:model-value="
                (val) => {
                  if (
                    val === 'bevel' ||
                    val === 'outline' ||
                    val === 'pill' ||
                    val === 'solid' ||
                    val === 'ribbon' ||
                    val === 'none'
                  ) {
                    updateBitmap((prev) => ({
                      ...prev,
                      composer: {
                        ...prev.composer,
                        frameStyle: val as RankFrameStyle,
                      },
                    }));
                  }
                }
              "
            >
              <SelectTrigger id="rank-frame-style" class="h-7 rounded-sm bg-muted/80 text-xs text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent class="rounded-md border-border">
                <SelectItem value="bevel">Bevel 3D</SelectItem>
                <SelectItem value="outline">Garis Tepi 1px</SelectItem>
                <SelectItem value="pill">Sudut Bulat Pill</SelectItem>
                <SelectItem value="solid">Blok Padat Solid</SelectItem>
                <SelectItem value="ribbon">Pita Bertakik Ribbon</SelectItem>
                <SelectItem value="none">Tanpa Bingkai</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="flex items-center justify-between gap-1.5 rounded-sm bg-muted/80 px-2 py-1">
              <span class="text-[11px] font-medium text-foreground">
                Isi
              </span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  title="Klik untuk menyalin kode HEX"
                  class="inline-flex cursor-pointer items-center gap-1 rounded bg-card px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-foreground hover:bg-accent transition-transform duration-100 ease-out active:scale-[0.96]"
                  @click="copyFieldColor('frameColor', store.selectedEntry.composer.frameColor)"
                >
                  <FontAwesomeIcon v-if="copiedFieldKey === 'frameColor'" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
                  <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
                  <span>{{ store.selectedEntry.composer.frameColor.toUpperCase() }}</span>
                </button>
                <StudioColorPicker
                  :model-value="store.selectedEntry.composer.frameColor"
                  aria-label="Pilih warna isi bingkai"
                  trigger-class="h-5 w-5 rounded-[3px]"
                  side="left"
                  @update:model-value="
                    (color: string) =>
                      updateBitmap((prev) => ({
                        ...prev,
                        composer: {
                          ...prev.composer,
                          frameColor: color,
                        },
                      }))
                  "
                />
              </div>
            </div>

            <div class="flex items-center justify-between gap-1.5 rounded-sm bg-muted/80 px-2 py-1">
              <span class="text-[11px] font-medium text-foreground">
                Tepi
              </span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  title="Klik untuk menyalin kode HEX"
                  class="inline-flex cursor-pointer items-center gap-1 rounded bg-card px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-foreground hover:bg-accent transition-transform duration-100 ease-out active:scale-[0.96]"
                  @click="copyFieldColor('frameBorderColor', store.selectedEntry.composer.frameBorderColor)"
                >
                  <FontAwesomeIcon v-if="copiedFieldKey === 'frameBorderColor'" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
                  <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
                  <span>{{ store.selectedEntry.composer.frameBorderColor.toUpperCase() }}</span>
                </button>
                <StudioColorPicker
                  :model-value="store.selectedEntry.composer.frameBorderColor"
                  aria-label="Pilih warna garis tepi bingkai"
                  trigger-class="h-5 w-5 rounded-[3px]"
                  side="left"
                  @update:model-value="
                    (color: string) =>
                      updateBitmap((prev) => ({
                        ...prev,
                        composer: {
                          ...prev.composer,
                          frameBorderColor: color,
                        },
                      }))
                  "
                />
              </div>
            </div>
          </div>

          <div
            v-if="
              (store.selectedEntry.composer.badgeLayout ?? 'unified') === 'split-left' &&
              (store.selectedEntry.composer.splitIconFrame ?? 'match') === 'match'
            "
            class="grid grid-cols-2 gap-2 border-t border-border/50 pt-2"
          >
            <div class="flex items-center justify-between gap-1.5 rounded-sm bg-muted/80 px-2 py-1">
              <span class="text-[10px] font-medium text-foreground">
                Isi Ikon
              </span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  title="Klik untuk menyalin kode HEX"
                  class="inline-flex cursor-pointer items-center gap-1 rounded bg-card px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-foreground hover:bg-accent transition-transform duration-100 ease-out active:scale-[0.96]"
                  @click="
                    copyFieldColor(
                      'splitIconFrameColor',
                      store.selectedEntry.composer.splitIconFrameColor ??
                        store.selectedEntry.composer.frameColor,
                    )
                  "
                >
                  <FontAwesomeIcon v-if="copiedFieldKey === 'splitIconFrameColor'" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
                  <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
                  <span>
                    {{
                      (
                        store.selectedEntry.composer.splitIconFrameColor ??
                        store.selectedEntry.composer.frameColor
                      ).toUpperCase()
                    }}
                  </span>
                </button>
                <StudioColorPicker
                  :model-value="
                    store.selectedEntry.composer.splitIconFrameColor ??
                    store.selectedEntry.composer.frameColor
                  "
                  aria-label="Pilih warna isi kotak ikon kiri"
                  trigger-class="h-5 w-5 rounded-[3px]"
                  side="left"
                  @update:model-value="
                    (color: string) =>
                      updateBitmap((prev) => ({
                        ...prev,
                        composer: {
                          ...prev.composer,
                          splitIconFrameColor: color,
                        },
                      }))
                  "
                />
              </div>
            </div>

            <div class="flex items-center justify-between gap-1.5 rounded-sm bg-muted/80 px-2 py-1">
              <span class="text-[10px] font-medium text-foreground">
                Tepi Ikon
              </span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  title="Klik untuk menyalin kode HEX"
                  class="inline-flex cursor-pointer items-center gap-1 rounded bg-card px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-foreground hover:bg-accent transition-transform duration-100 ease-out active:scale-[0.96]"
                  @click="
                    copyFieldColor(
                      'splitIconBorderColor',
                      store.selectedEntry.composer.splitIconBorderColor ??
                        store.selectedEntry.composer.frameBorderColor,
                    )
                  "
                >
                  <FontAwesomeIcon v-if="copiedFieldKey === 'splitIconBorderColor'" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
                  <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
                  <span>
                    {{
                      (
                        store.selectedEntry.composer.splitIconBorderColor ??
                        store.selectedEntry.composer.frameBorderColor
                      ).toUpperCase()
                    }}
                  </span>
                </button>
                <StudioColorPicker
                  :model-value="
                    store.selectedEntry.composer.splitIconBorderColor ??
                    store.selectedEntry.composer.frameBorderColor
                  "
                  aria-label="Pilih warna garis tepi kotak ikon kiri"
                  trigger-class="h-5 w-5 rounded-[3px]"
                  side="left"
                  @update:model-value="
                    (color: string) =>
                      updateBitmap((prev) => ({
                        ...prev,
                        composer: {
                          ...prev.composer,
                          splitIconBorderColor: color,
                        },
                      }))
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Uploaded PNG Info & Replace -->
      <div v-else class="flex items-center justify-between gap-2 py-1">
        <span class="truncate font-mono text-[11px] text-foreground">
          {{ store.selectedEntry.uploadedPngFileName ?? 'PNG Kustom' }}
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

      <Separator class="bg-border" />

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
          <div class="grid grid-cols-[88px_1fr] items-center gap-2">
            <Label for="bitmap-cp-input" class="text-[11px] font-medium text-foreground">
              Codepoint
            </Label>
            <div class="flex items-center gap-1">
              <Input
                id="bitmap-cp-input"
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

          <div class="grid grid-cols-[88px_1fr] items-center gap-2">
            <Label for="bitmap-label-input" class="text-[11px] font-medium text-foreground">
              Label
            </Label>
            <Input
              id="bitmap-label-input"
              type="text"
              :model-value="store.selectedEntry.label"
              class="h-7 rounded-sm bg-muted/80 px-2 text-xs text-foreground"
              @update:model-value="
                updateBitmap((prev) => ({
                  ...prev,
                  label: String($event ?? ''),
                }))
              "
            />
          </div>

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
                  :model-value="store.selectedEntry.height"
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
                  :model-value="store.selectedEntry.ascent"
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
            F01: Nilai ascent ({{ store.selectedEntry.ascent }}) melebihi tinggi glif ({{ store.selectedEntry.height }}).
          </p>

          <div
            v-if="store.selectedEntry.sourceMode === 'composer'"
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
                  :model-value="store.selectedEntry.spaceLeft"
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
                  :model-value="store.selectedEntry.spaceRight"
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

          <div class="grid grid-cols-[88px_1fr] items-center gap-2">
            <Label for="bitmap-fileref-input" class="text-[11px] font-medium text-foreground">
              Jalur Berkas
            </Label>
            <Input
              id="bitmap-fileref-input"
              type="text"
              :model-value="store.selectedEntry.fileRef"
              class="h-7 rounded-sm bg-muted/80 px-2 font-mono text-[11px] text-foreground"
              @update:model-value="
                updateBitmap((prev) => ({
                  ...prev,
                  fileRef: String($event ?? ''),
                }))
              "
            />
          </div>

          <div class="space-y-1">
            <Label for="bitmap-chars-textarea" class="text-[11px] font-medium text-foreground">
              Matriks Karakter Glif
            </Label>
            <p class="text-[10px] text-muted-foreground">
              Baris baru untuk setiap baris glif pada berkas sprite sheet (chars).
            </p>
            <Textarea
              id="bitmap-chars-textarea"
              :rows="Math.min(4, Math.max(2, store.selectedEntry.chars.length))"
              :model-value="displayedChars"
              class="min-h-14 rounded-sm bg-muted/80 px-2 py-1.5 font-mono text-[11px] text-foreground"
              @update:model-value="handleCharsInput(String($event ?? ''))"
              @blur="commitCharsBlur()"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  </div>
</template>
