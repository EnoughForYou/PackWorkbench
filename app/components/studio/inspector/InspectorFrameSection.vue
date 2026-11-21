<script setup lang="ts">
import { computed, ref } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCheck, faCopy } from '@fortawesome/free-solid-svg-icons';
import type {
  BitmapFontEntry,
  CanvasWidthMode,
  RankFrameStyle,
} from '@core/font/types.ts';
import { useWorkbenchStore } from '@/stores/workbenchStore';
import StudioColorPicker from '@/components/shared/StudioColorPicker.vue';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
</script>

<template>
  <div v-if="entry" class="space-y-2.5">
    <!-- Frame Style Select -->
    <div class="grid grid-cols-[88px_1fr] items-center gap-2">
      <Label for="rank-frame-style" class="text-[11px] font-medium text-foreground">
        Gaya Bingkai
      </Label>
      <Select
        :model-value="entry.composer.frameStyle"
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

    <!-- Frame Fill & Border Color Pickers -->
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
            @click="copyFieldColor('frameColor', entry.composer.frameColor)"
          >
            <FontAwesomeIcon v-if="copiedFieldKey === 'frameColor'" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
            <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
            <span>{{ entry.composer.frameColor.toUpperCase() }}</span>
          </button>
          <StudioColorPicker
            :model-value="entry.composer.frameColor"
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
            @click="copyFieldColor('frameBorderColor', entry.composer.frameBorderColor)"
          >
            <FontAwesomeIcon v-if="copiedFieldKey === 'frameBorderColor'" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
            <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
            <span>{{ entry.composer.frameBorderColor.toUpperCase() }}</span>
          </button>
          <StudioColorPicker
            :model-value="entry.composer.frameBorderColor"
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

    <!-- Split Icon Colors (when split-left & match) -->
    <div
      v-if="
        (entry.composer.badgeLayout ?? 'unified') === 'split-left' &&
        (entry.composer.splitIconFrame ?? 'match') === 'match'
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
                entry.composer.splitIconFrameColor ?? entry.composer.frameColor,
              )
            "
          >
            <FontAwesomeIcon v-if="copiedFieldKey === 'splitIconFrameColor'" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
            <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
            <span>
              {{
                (
                  entry.composer.splitIconFrameColor ?? entry.composer.frameColor
                ).toUpperCase()
              }}
            </span>
          </button>
          <StudioColorPicker
            :model-value="entry.composer.splitIconFrameColor ?? entry.composer.frameColor"
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
                entry.composer.splitIconBorderColor ?? entry.composer.frameBorderColor,
              )
            "
          >
            <FontAwesomeIcon v-if="copiedFieldKey === 'splitIconBorderColor'" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
            <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
            <span>
              {{
                (
                  entry.composer.splitIconBorderColor ?? entry.composer.frameBorderColor
                ).toUpperCase()
              }}
            </span>
          </button>
          <StudioColorPicker
            :model-value="entry.composer.splitIconBorderColor ?? entry.composer.frameBorderColor"
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

    <!-- Canvas Width (Custom Width / Auto) -->
    <div class="grid grid-cols-[88px_1fr] items-center gap-2 border-t border-border/50 pt-2">
      <Label class="text-[11px] font-medium text-foreground">
        Lebar Kanvas
      </Label>
      <div class="flex items-center gap-1.5">
        <ToggleGroup
          type="single"
          :model-value="entry.composer.canvasWidthMode ?? 'auto'"
          aria-label="Mode penentuan lebar kanvas"
          class="gap-0.5 rounded-sm border border-border bg-muted/80 p-0.5"
          @update:model-value="
            (val) => {
              if (val === 'auto' || val === 'fixed') {
                const currentW =
                  store.validation.metricsByEntryId[entry!.id]?.imageWidth ?? 36;
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
          v-if="entry.composer.canvasWidthMode === 'fixed'"
          type="number"
          :min="4"
          :max="256"
          aria-label="Lebar kanvas kustom dalam piksel"
          :model-value="
            entry.composer.customWidth ??
            store.validation.metricsByEntryId[entry.id]?.imageWidth ??
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
          {{ store.validation.metricsByEntryId[entry.id]?.imageWidth ?? '—' }}px
        </span>
      </div>
    </div>
  </div>
</template>
