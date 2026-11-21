<script setup lang="ts">
import { computed, ref } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faCheck,
  faCopy,
  faObjectUngroup,
} from '@fortawesome/free-solid-svg-icons';
import {
  PIXEL_ICONS,
  parseHexRgba,
  type RgbaRaster,
} from '@core/font/pixelSynth.ts';
import type {
  BitmapFontEntry,
  PixelIconId,
  RankBadgeLayout,
  SplitIconFrameMode,
} from '@core/font/types.ts';
import { useWorkbenchStore } from '@/stores/workbenchStore';
import PixelPreviewCanvas from '@/components/shared/PixelPreviewCanvas.vue';
import StudioColorPicker from '@/components/shared/StudioColorPicker.vue';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const store = useWorkbenchStore();

const copiedFieldKey = ref<string | null>(null);
let copiedFieldTimer: number | null = null;

const entry = computed(() => {
  const e = store.selectedEntry;
  return e && e.kind === 'bitmap' && e.sourceMode === 'composer' ? e : null;
});

function updateBitmap(updater: (prev: BitmapFontEntry) => BitmapFontEntry): void {
  const e = store.selectedEntry;
  if (!e || e.kind !== 'bitmap') return;
  store.updateEntry(e.id, (prev) =>
    prev.kind === 'bitmap' ? updater(prev) : prev,
  );
}

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
</script>

<template>
  <div v-if="entry" class="space-y-2.5">
    <!-- Icon Left / Rank Right Separation Feature -->
    <div class="space-y-1.5 rounded-sm border border-border/70 bg-muted/80 p-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-medium text-foreground">
          Tata Letak Badge
        </span>
        <ToggleGroup
          type="single"
          :model-value="entry.composer.badgeLayout ?? 'unified'"
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
        v-if="(entry.composer.badgeLayout ?? 'unified') === 'split-left'"
        class="flex items-center justify-between gap-2 border-t border-border/50 pt-1.5"
      >
        <span class="text-[10px] text-muted-foreground">
          Slot Ikon Kiri
        </span>
        <ToggleGroup
          type="single"
          :model-value="entry.composer.splitIconFrame ?? 'match'"
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
          :disabled="entry.composer.iconId === 'none'"
          class="h-6 gap-1 rounded-sm px-2 font-mono text-[10px] transition-transform active:scale-[0.96]"
          @click="store.splitEntryToIconAndRank(entry.id)"
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
        :aria-pressed="entry.composer.iconId === icon.id"
        :title="icon.label"
        :class="[
          'flex h-8 cursor-pointer items-center justify-center rounded-sm transition-[background-color,transform] duration-100 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-primary',
          entry.composer.iconId === icon.id
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
              entry.composer.iconColor,
            )
          "
          :raster="
            buildIconPreviewRaster(
              icon.rows,
              icon.width,
              icon.height,
              entry.composer.iconColor,
            )
          "
          :zoom="2"
          :aria-label="icon.label"
        />
        <span v-else class="font-mono text-xs text-muted-foreground">×</span>
      </button>
    </div>

    <!-- Icon Gap Slider -->
    <div class="grid grid-cols-[88px_1fr_32px] items-center gap-2">
      <Label class="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
        <span>Jarak Ikon</span>
        <span class="font-mono text-[10px] text-muted-foreground">px</span>
      </Label>
      <Slider
        :model-value="[entry.composer.iconGap]"
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
        {{ entry.composer.iconGap }}
      </span>
    </div>

    <!-- Icon Color Picker -->
    <div class="flex items-center justify-between gap-2 rounded-sm bg-muted/80 px-2.5 py-1">
      <span class="text-[11px] font-medium text-foreground">
        Warna Ikon
      </span>
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          title="Klik untuk menyalin kode HEX"
          class="inline-flex cursor-pointer items-center gap-1 rounded bg-card px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-foreground hover:bg-accent transition-transform duration-100 ease-out active:scale-[0.96]"
          @click="copyFieldColor('iconColor', entry.composer.iconColor)"
        >
          <FontAwesomeIcon v-if="copiedFieldKey === 'iconColor'" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
          <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
          <span>{{ entry.composer.iconColor.toUpperCase() }}</span>
        </button>
        <StudioColorPicker
          :model-value="entry.composer.iconColor"
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
</template>
