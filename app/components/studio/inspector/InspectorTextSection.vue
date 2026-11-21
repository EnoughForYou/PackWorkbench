<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCheck, faCopy, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import type {
  BitmapFontEntry,
  FontSourceMode,
  GoogleFontConfig,
  PixelFontSize,
} from '@core/font/types.ts';
import { useWorkbenchStore } from '@/stores/workbenchStore';
import StudioColorPicker from '@/components/shared/StudioColorPicker.vue';
import GoogleFontPicker from '@/components/studio/GoogleFontPicker.vue';
import { useFontRasterizer } from '@/composables/useFontRasterizer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const store = useWorkbenchStore();
const { rasterizeText, isFontLoading, lastRasterError } = useFontRasterizer();

const DEFAULT_GOOGLE_FONT: GoogleFontConfig = {
  family: 'Press Start 2P',
  category: 'display',
  weight: 400,
  fontSizePx: 8,
  style: 'normal',
};

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

async function triggerGoogleFontRaster(text: string, fontConfig: GoogleFontConfig): Promise<void> {
  const targetEntry = entry.value;
  if (!targetEntry) return;
  const raster = await rasterizeText(text, fontConfig);
  if (raster) {
    updateBitmap((prev) => ({
      ...prev,
      cachedCustomRaster: raster,
    }));
  }
}

function handleTextChange(val: string): void {
  updateBitmap((prev) => ({
    ...prev,
    label: val.trim() || prev.label,
    composer: { ...prev.composer, text: val },
  }));

  if (entry.value?.composer.fontSource === 'google-font') {
    void triggerGoogleFontRaster(
      val,
      entry.value.composer.googleFont ?? DEFAULT_GOOGLE_FONT,
    );
  }
}

function handleFontSourceChange(val: unknown): void {
  const str = typeof val === 'string' ? val : null;
  if (str === 'pixel' || str === 'google-font') {
    const nextFontConfig = entry.value?.composer.googleFont ?? DEFAULT_GOOGLE_FONT;
    updateBitmap((prev) => ({
      ...prev,
      composer: {
        ...prev.composer,
        fontSource: str as FontSourceMode,
        googleFont: str === 'google-font' ? nextFontConfig : prev.composer.googleFont,
      },
    }));

    if (str === 'google-font' && entry.value) {
      void triggerGoogleFontRaster(entry.value.composer.text, nextFontConfig);
    }
  }
}

function handleGoogleFontConfigChange(nextConfig: GoogleFontConfig): void {
  updateBitmap((prev) => ({
    ...prev,
    composer: {
      ...prev.composer,
      googleFont: nextConfig,
    },
  }));
  if (entry.value) {
    void triggerGoogleFontRaster(entry.value.composer.text, nextConfig);
  }
}

watch(
  () => [entry.value?.id, entry.value?.composer.fontSource, entry.value?.composer.text],
  ([id, source, text]) => {
    if (id && source === 'google-font' && !entry.value?.cachedCustomRaster) {
      void triggerGoogleFontRaster(
        String(text || ''),
        entry.value?.composer.googleFont ?? DEFAULT_GOOGLE_FONT,
      );
    }
  },
  { immediate: true },
);

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
</script>

<template>
  <div v-if="entry" class="space-y-2.5">
    <!-- Text Input -->
    <div class="grid grid-cols-[88px_1fr] items-center gap-2">
      <Label for="rank-text-input" class="text-[11px] font-medium text-foreground">
        Teks Badge
      </Label>
      <Input
        id="rank-text-input"
        type="text"
        :model-value="entry.composer.text"
        class="h-7 rounded-sm bg-muted/80 px-2 font-mono text-xs text-foreground"
        @update:model-value="handleTextChange(String($event ?? ''))"
      />
    </div>

    <!-- Font Source Toggle (Pixel vs Google Font) -->
    <div class="grid grid-cols-[88px_1fr] items-center gap-2">
      <Label class="text-[11px] font-medium text-foreground">
        Sumber Font
      </Label>
      <ToggleGroup
        type="single"
        :model-value="entry.composer.fontSource ?? 'pixel'"
        aria-label="Pilih sumber font"
        class="gap-0.5 rounded-sm border border-border bg-muted/80 p-0.5"
        @update:model-value="handleFontSourceChange"
      >
        <ToggleGroupItem
          value="pixel"
          class="h-6 rounded-sm px-2 text-[10px] data-[state=on]:bg-card data-[state=on]:text-foreground"
        >
          Piksel Bawaan
        </ToggleGroupItem>
        <ToggleGroupItem
          value="google-font"
          class="h-6 rounded-sm px-2 text-[10px] data-[state=on]:bg-card data-[state=on]:text-foreground"
        >
          Google Fonts
        </ToggleGroupItem>
      </ToggleGroup>
    </div>

    <!-- Pixel Font Selector (if pixel fontSource) -->
    <div
      v-if="(entry.composer.fontSource ?? 'pixel') === 'pixel'"
      class="grid grid-cols-[88px_1fr] items-center gap-2"
    >
      <Label for="rank-fontsize-select" class="text-[11px] font-medium text-foreground">
        Font Piksel
      </Label>
      <Select
        :model-value="entry.composer.fontSize"
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

    <!-- Google Font Picker (if google-font fontSource) -->
    <div v-else class="space-y-2 rounded-sm border border-border/70 bg-card/60 p-2.5">
      <div class="flex items-center justify-between">
        <Label class="text-[11px] font-semibold text-foreground">
          Pilih Google Font
        </Label>
        <span
          v-if="isFontLoading"
          class="inline-flex items-center gap-1.5 font-mono text-[10px] text-primary"
        >
          <span class="h-1.5 w-1.5 animate-ping rounded-full bg-primary" />
          <span>Merasterisasi...</span>
        </span>
      </div>

      <!-- Mounted GoogleFontPicker Component -->
      <GoogleFontPicker
        :model-value="entry.composer.googleFont ?? DEFAULT_GOOGLE_FONT"
        :preview-text="entry.composer.text || 'RANK'"
        @update:model-value="handleGoogleFontConfigChange"
      />

      <!-- Error State -->
      <div
        v-if="lastRasterError"
        class="flex items-center gap-1.5 rounded border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] text-destructive"
        role="alert"
      >
        <FontAwesomeIcon :icon="faTriangleExclamation" class="h-3 w-3 shrink-0" />
        <span class="truncate">Gagal memuat font: {{ lastRasterError }}</span>
      </div>
    </div>

    <!-- Padding X -->
    <div class="grid grid-cols-[88px_1fr_32px] items-center gap-2">
      <Label class="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
        <span>Padding X</span>
        <span class="font-mono text-[10px] text-muted-foreground">px</span>
      </Label>
      <Slider
        :model-value="[entry.composer.paddingX]"
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
        {{ entry.composer.paddingX }}
      </span>
    </div>

    <!-- Padding Y -->
    <div class="grid grid-cols-[88px_1fr_32px] items-center gap-2">
      <Label class="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
        <span>Padding Y</span>
        <span class="font-mono text-[10px] text-muted-foreground">px</span>
      </Label>
      <Slider
        :model-value="[entry.composer.paddingY]"
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
        {{ entry.composer.paddingY }}
      </span>
    </div>

    <!-- Color Pickers (Teks & Bayangan) -->
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
            @click="copyFieldColor('textColor', entry.composer.textColor)"
          >
            <FontAwesomeIcon v-if="copiedFieldKey === 'textColor'" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
            <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
            <span>{{ entry.composer.textColor.toUpperCase() }}</span>
          </button>
          <StudioColorPicker
            :model-value="entry.composer.textColor"
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
            @click="copyFieldColor('shadowColor', entry.composer.shadowColor)"
          >
            <FontAwesomeIcon v-if="copiedFieldKey === 'shadowColor'" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
            <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
            <span>{{ entry.composer.shadowColor.toUpperCase() }}</span>
          </button>
          <StudioColorPicker
            :model-value="entry.composer.shadowColor"
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
</template>
