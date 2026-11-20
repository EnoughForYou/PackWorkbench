<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faArrowPointer,
  faBorderAll,
  faCheck,
  faEraser,
  faEyeDropper,
  faMagnifyingGlassPlus,
  faPencil,
  faRotateLeft,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkbenchStore, type CanvasTool } from '@/stores/workbenchStore';

const store = useWorkbenchStore();

const BRUSH_SWATCHES = [
  '#ffffff',
  '#e4e4e7',
  '#9da0b8',
  '#1e1f29',
  '#9b73be',
  '#e05252',
  '#fb7185',
  '#f43f5e',
  '#fcd34d',
  '#f59e0b',
  '#22c55e',
  '#10b981',
  '#38bdf8',
  '#3b82f6',
  '#818cf8',
  '#a78bfa',
] as const;

const QUICK_DOCK_SWATCHES = [
  '#ffffff',
  '#9b73be',
  '#38bdf8',
  '#22c55e',
  '#fcd34d',
  '#fb7185',
] as const;

function handleToolChange(value: unknown): void {
  if (
    value === 'select' ||
    value === 'pencil' ||
    value === 'eraser' ||
    value === 'eyedropper'
  ) {
    store.activeTool = value as CanvasTool;
  }
}

function selectAndCopySwatch(hex: string): void {
  store.brushColor = hex;
  store.activeTool = 'pencil';
  store.copyColorHex(hex);
}
</script>

<template>
  <div
    role="toolbar"
    aria-orientation="vertical"
    aria-label="Alat kanvas piksel"
    aria-controls="studio-pixel-canvas"
    class="flex w-12 shrink-0 flex-col items-center justify-between border-r border-border bg-card px-1 py-2"
  >
    <div class="flex flex-col items-center gap-1">
      <ToggleGroup
        type="single"
        :model-value="store.activeTool"
        orientation="vertical"
        class="flex flex-col gap-1"
        @update:model-value="handleToolChange"
      >
        <Tooltip>
          <TooltipTrigger as-child>
            <ToggleGroupItem
              value="select"
              aria-label="Pilih dan periksa piksel (V)"
              class="h-10 w-10 min-h-10 min-w-10 p-0 rounded-md transition-[color,background-color,border-color,transform] duration-100 ease-out active:scale-[0.96] border border-transparent data-[state=on]:bg-primary/20 data-[state=on]:text-primary data-[state=on]:border-primary/40 data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground data-[state=off]:hover:bg-muted/60"
            >
              <FontAwesomeIcon :icon="faArrowPointer" class="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="right" class="flex items-center gap-1.5 text-xs">
            <span>Pilih &amp; Periksa</span>
            <kbd class="font-mono text-[10px] bg-background/60 px-1 py-0.5 rounded border border-border">V</kbd>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <ToggleGroupItem
              value="pencil"
              aria-label="Pensil piksel (B)"
              class="h-10 w-10 min-h-10 min-w-10 p-0 rounded-md transition-[color,background-color,border-color,transform] duration-100 ease-out active:scale-[0.96] border border-transparent data-[state=on]:bg-primary/20 data-[state=on]:text-primary data-[state=on]:border-primary/40 data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground data-[state=off]:hover:bg-muted/60"
            >
              <FontAwesomeIcon :icon="faPencil" class="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="right" class="flex items-center gap-1.5 text-xs">
            <span>Pensil Piksel</span>
            <kbd class="font-mono text-[10px] bg-background/60 px-1 py-0.5 rounded border border-border">B</kbd>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <ToggleGroupItem
              value="eraser"
              aria-label="Penghapus transparan (E)"
              class="h-10 w-10 min-h-10 min-w-10 p-0 rounded-md transition-[color,background-color,border-color,transform] duration-100 ease-out active:scale-[0.96] border border-transparent data-[state=on]:bg-primary/20 data-[state=on]:text-primary data-[state=on]:border-primary/40 data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground data-[state=off]:hover:bg-muted/60"
            >
              <FontAwesomeIcon :icon="faEraser" class="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="right" class="flex items-center gap-1.5 text-xs">
            <span>Penghapus Transparan</span>
            <kbd class="font-mono text-[10px] bg-background/60 px-1 py-0.5 rounded border border-border">E</kbd>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <ToggleGroupItem
              value="eyedropper"
              aria-label="Pipet warna ambil dan salin (I)"
              class="h-10 w-10 min-h-10 min-w-10 p-0 rounded-md transition-[color,background-color,border-color,transform] duration-100 ease-out active:scale-[0.96] border border-transparent data-[state=on]:bg-primary/20 data-[state=on]:text-primary data-[state=on]:border-primary/40 data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground data-[state=off]:hover:bg-muted/60"
            >
              <FontAwesomeIcon :icon="faEyeDropper" class="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="right" class="flex items-center gap-1.5 text-xs">
            <span>Pipet Warna (Ambil &amp; Salin)</span>
            <kbd class="font-mono text-[10px] bg-background/60 px-1 py-0.5 rounded border border-border">I</kbd>
          </TooltipContent>
        </Tooltip>
      </ToggleGroup>

      <div
        aria-hidden="true"
        class="my-1 h-px w-6 shrink-0 bg-border"
      />

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            :aria-pressed="store.showGrid"
            aria-label="Alihkan kisi piksel (G)"
            :class="[
              'h-10 w-10 min-h-10 min-w-10 rounded-md transition-[color,background-color,border-color,transform] duration-100 ease-out active:scale-[0.96] border border-transparent',
              store.showGrid
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
            ]"
            @click="store.showGrid = !store.showGrid"
          >
            <FontAwesomeIcon :icon="faBorderAll" class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" class="flex items-center gap-1.5 text-xs">
          <span>Kisi Piksel</span>
          <kbd class="font-mono text-[10px] bg-background/60 px-1 py-0.5 rounded border border-border">G</kbd>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            :disabled="store.undoStack.length === 0"
            aria-label="Urungkan coretan terakhir (Ctrl+Z)"
            class="h-10 w-10 min-h-10 min-w-10 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.96] disabled:opacity-40 disabled:pointer-events-none"
            @click="store.undoPaint()"
          >
            <FontAwesomeIcon :icon="faRotateLeft" class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" class="flex items-center gap-1.5 text-xs">
          <span>Urungkan Coretan</span>
          <kbd class="font-mono text-[10px] bg-background/60 px-1 py-0.5 rounded border border-border">Ctrl+Z</kbd>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            :disabled="store.redoStack.length === 0"
            aria-label="Ulangi coretan (Ctrl+Y)"
            class="h-10 w-10 min-h-10 min-w-10 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.96] disabled:opacity-40 disabled:pointer-events-none"
            @click="store.redoPaint()"
          >
            <FontAwesomeIcon :icon="faRotateRight" class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" class="flex items-center gap-1.5 text-xs">
          <span>Ulangi Coretan</span>
          <kbd class="font-mono text-[10px] bg-background/60 px-1 py-0.5 rounded border border-border">Ctrl+Y</kbd>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Atur ulang perbesaran ke 12x (Ctrl+0)"
            class="h-10 w-10 min-h-10 min-w-10 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.96]"
            @click="store.zoom = 12"
          >
            <FontAwesomeIcon :icon="faMagnifyingGlassPlus" class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" class="flex items-center gap-1.5 text-xs">
          <span>Atur Ulang Zoom 12×</span>
          <kbd class="font-mono text-[10px] bg-background/60 px-1 py-0.5 rounded border border-border">Ctrl+0</kbd>
        </TooltipContent>
      </Tooltip>
    </div>

    <!-- Bottom Quick Swatches (Click to Select & Auto-Copy HEX) + Full Palette Popover -->
    <div class="flex flex-col items-center gap-1.5">
      <div class="flex flex-col items-center gap-1">
        <Tooltip v-for="hex in QUICK_DOCK_SWATCHES" :key="hex">
          <TooltipTrigger as-child>
            <button
              type="button"
              :aria-label="`Pilih dan salin ${hex.toUpperCase()}`"
              :aria-pressed="store.brushColor.toLowerCase() === hex"
              :style="{ backgroundColor: hex }"
              :class="[
                'touch-target-expand h-5 w-5 cursor-pointer rounded-[3px] border transition-transform hover:scale-110 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-primary',
                store.brushColor.toLowerCase() === hex
                  ? 'border-white ring-1 ring-primary'
                  : 'border-white/20',
              ]"
              @click="selectAndCopySwatch(hex)"
            />
          </TooltipTrigger>
          <TooltipContent side="right" class="font-mono text-[10px] tabular-nums">
            {{ hex.toUpperCase() }} (Klik untuk salin)
          </TooltipContent>
        </Tooltip>
      </div>

      <div
        aria-hidden="true"
        class="my-0.5 h-px w-6 shrink-0 bg-border"
      />

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger as-child>
            <DropdownMenuTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Buka palet warna dan salin hex"
                class="h-10 w-10 min-h-10 min-w-10 rounded-md p-0 transition-transform active:scale-[0.96] hover:bg-muted/60"
              >
                <span
                  aria-hidden="true"
                  class="block h-5 w-5 rounded-full border border-white/30 shadow-inner"
                  :style="{ backgroundColor: store.brushColor }"
                />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" class="text-xs">
            Warna Kuas <span class="font-mono text-[10px] tabular-nums text-primary font-semibold">({{ store.brushColor.toUpperCase() }})</span>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent side="right" align="end" class="w-52 rounded-md border-border bg-card p-2.5 shadow-xl">
          <div class="mb-2 flex items-center justify-between gap-2 border-b border-border pb-1.5">
            <p class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Palet Warna
            </p>
            <span
              v-if="store.copiedColorToast"
              class="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400 tabular-nums"
            >
              <FontAwesomeIcon :icon="faCheck" class="h-3 w-3" />
              <span>Tersalin {{ store.copiedColorToast.hex }}</span>
            </span>
          </div>

          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="hex in BRUSH_SWATCHES"
              :key="hex"
              type="button"
              :aria-label="`Pilih dan salin warna ${hex.toUpperCase()}`"
              :aria-pressed="store.brushColor.toLowerCase() === hex"
              :title="`Klik untuk menggunakan & salin ${hex.toUpperCase()}`"
              :style="{ backgroundColor: hex }"
              :class="[
                'h-6 w-full cursor-pointer rounded-[3px] border transition-transform hover:scale-105 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-primary',
                store.brushColor.toLowerCase() === hex
                  ? 'border-2 border-primary ring-1 ring-primary/40'
                  : 'border-white/15',
              ]"
              @click="selectAndCopySwatch(hex)"
            />
          </div>

          <p class="mt-2 text-[10px] text-muted-foreground">
            Klik swatch untuk memilih &amp; menyalin HEX.
          </p>

          <div class="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2">
            <label for="dock-custom-brush" class="text-[11px] font-medium text-foreground">
              Kustom
            </label>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                class="cursor-pointer rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-foreground hover:bg-accent transition-colors"
                title="Salin HEX saat ini"
                @click="store.copyColorHex(store.brushColor)"
              >
                {{ store.brushColor.toUpperCase() }}
              </button>
              <input
                id="dock-custom-brush"
                v-model="store.brushColor"
                type="color"
                aria-label="Pilih warna kuas kustom"
                class="h-6 w-8 cursor-pointer rounded border border-border bg-transparent p-0"
                @input="store.activeTool = 'pencil'"
              />
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>
