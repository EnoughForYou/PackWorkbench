<script setup lang="ts">
import {
  Check,
  Eraser,
  Grid2x2,
  MousePointer2,
  Pencil,
  Pipette,
  Redo2,
  Undo2,
} from '@lucide/vue';
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
  '#94a3b8',
  '#111115',
  '#ff5e2c',
  '#ef4444',
  '#fb7185',
  '#f43f5e',
  '#fcd34d',
  '#f59e0b',
  '#34d399',
  '#10b981',
  '#38bdf8',
  '#3b82f6',
  '#818cf8',
  '#a78bfa',
] as const;

const QUICK_DOCK_SWATCHES = [
  '#ffffff',
  '#ff5e2c',
  '#38bdf8',
  '#34d399',
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
    aria-label="Pixel canvas tools"
    aria-controls="studio-pixel-canvas"
    class="flex shrink-0 flex-row items-center justify-between gap-2 border-b border-border bg-[#0b0b0e] px-2 py-1.5 lg:w-11 lg:flex-col lg:border-r lg:border-b-0 lg:px-1.5 lg:py-2"
  >
    <div class="flex flex-row items-center gap-0.5 lg:flex-col">
      <ToggleGroup
        type="single"
        :model-value="store.activeTool"
        orientation="vertical"
        class="flex flex-row gap-0.5 lg:flex-col"
        @update:model-value="handleToolChange"
      >
        <Tooltip>
          <TooltipTrigger as-child>
            <ToggleGroupItem
              value="select"
              aria-label="Select and inspect pixels"
              class="h-7 w-7 p-0 data-[state=on]:bg-primary/15 data-[state=on]:text-[#ff8f6b]"
            >
              <MousePointer2 aria-hidden="true" class="h-3.5 w-3.5" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="right">Select &amp; Inspect (V)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <ToggleGroupItem
              value="pencil"
              aria-label="Pixel pencil"
              class="h-7 w-7 p-0 data-[state=on]:bg-primary/15 data-[state=on]:text-[#ff8f6b]"
            >
              <Pencil aria-hidden="true" class="h-3.5 w-3.5" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="right">Pixel Pencil (B)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <ToggleGroupItem
              value="eraser"
              aria-label="Transparent eraser"
              class="h-7 w-7 p-0 data-[state=on]:bg-primary/15 data-[state=on]:text-[#ff8f6b]"
            >
              <Eraser aria-hidden="true" class="h-3.5 w-3.5" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="right">Transparent Eraser (E)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <ToggleGroupItem
              value="eyedropper"
              aria-label="Eyedropper pick and copy color"
              class="h-7 w-7 p-0 data-[state=on]:bg-primary/15 data-[state=on]:text-[#ff8f6b]"
            >
              <Pipette aria-hidden="true" class="h-3.5 w-3.5" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="right">Eyedropper · Pick &amp; Copy (I)</TooltipContent>
        </Tooltip>
      </ToggleGroup>

      <div
        aria-hidden="true"
        class="mx-1 h-4 w-px shrink-0 bg-border lg:mx-0 lg:my-0.5 lg:h-px lg:w-6"
      />

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            :aria-pressed="store.showGrid"
            aria-label="Toggle pixel grid"
            :class="[
              'h-7 w-7',
              store.showGrid
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            ]"
            @click="store.showGrid = !store.showGrid"
          >
            <Grid2x2 aria-hidden="true" class="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Toggle Pixel Grid (G)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            :disabled="store.undoStack.length === 0"
            aria-label="Undo last paint stroke"
            class="h-7 w-7 text-muted-foreground hover:text-foreground"
            @click="store.undoPaint()"
          >
            <Undo2 aria-hidden="true" class="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Undo Stroke (Ctrl+Z)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            :disabled="store.redoStack.length === 0"
            aria-label="Redo paint stroke"
            class="h-7 w-7 text-muted-foreground hover:text-foreground"
            @click="store.redoPaint()"
          >
            <Redo2 aria-hidden="true" class="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Redo Stroke (Ctrl+Y / Ctrl+Shift+Z)</TooltipContent>
      </Tooltip>
    </div>

    <!-- Bottom Quick Swatches (Click to Select & Auto-Copy HEX) + Full Palette Popover -->
    <div class="flex items-center gap-1 lg:flex-col lg:gap-1.5">
      <div class="hidden items-center gap-1 sm:flex lg:flex-col">
        <Tooltip v-for="hex in QUICK_DOCK_SWATCHES" :key="hex">
          <TooltipTrigger as-child>
            <button
              type="button"
              :aria-label="`Select and copy ${hex.toUpperCase()}`"
              :aria-pressed="store.brushColor.toLowerCase() === hex"
              :style="{ backgroundColor: hex }"
              :class="[
                'h-4 w-4 cursor-pointer rounded-[3px] border transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-primary lg:w-5',
                store.brushColor.toLowerCase() === hex
                  ? 'border-white ring-1 ring-primary'
                  : 'border-white/20',
              ]"
              @click="selectAndCopySwatch(hex)"
            />
          </TooltipTrigger>
          <TooltipContent side="right" class="font-mono text-[10px]">
            {{ hex.toUpperCase() }} (click to copy)
          </TooltipContent>
        </Tooltip>
      </div>

      <div
        aria-hidden="true"
        class="mx-0.5 hidden h-4 w-px shrink-0 bg-border sm:block lg:mx-0 lg:my-0.5 lg:h-px lg:w-6"
      />

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger as-child>
            <DropdownMenuTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open paint palette and copy hex"
                class="h-8 w-8 p-0"
              >
                <span
                  aria-hidden="true"
                  class="block h-5 w-5 rounded-full border border-white/30 shadow-inner"
                  :style="{ backgroundColor: store.brushColor }"
                />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">
            Brush Color ({{ store.brushColor.toUpperCase() }})
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent side="right" align="end" class="w-48 p-2.5">
          <div class="mb-2 flex items-center justify-between gap-2">
            <p class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Paint Swatches
            </p>
            <span
              v-if="store.copiedColorToast"
              class="inline-flex items-center gap-0.5 font-mono text-[10px] text-emerald-400"
            >
              <Check aria-hidden="true" class="h-3 w-3" />
              {{ store.copiedColorToast.hex }}
            </span>
          </div>

          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="hex in BRUSH_SWATCHES"
              :key="hex"
              type="button"
              :aria-label="`Pick and copy color ${hex.toUpperCase()}`"
              :aria-pressed="store.brushColor.toLowerCase() === hex"
              :title="`Click to use & copy ${hex.toUpperCase()}`"
              :style="{ backgroundColor: hex }"
              :class="[
                'h-6 w-full cursor-pointer rounded border transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-primary',
                store.brushColor.toLowerCase() === hex
                  ? 'border-2 border-primary'
                  : 'border-white/15',
              ]"
              @click="selectAndCopySwatch(hex)"
            />
          </div>

          <p class="mt-2 text-[10px] text-muted-foreground">
            Click any swatch to select &amp; copy HEX.
          </p>

          <div class="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2">
            <label for="dock-custom-brush" class="text-[11px] text-muted-foreground">
              Custom
            </label>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                class="cursor-pointer rounded bg-[#15151b] px-1.5 py-0.5 font-mono text-[10px] text-foreground hover:bg-accent"
                title="Copy current HEX"
                @click="store.copyColorHex(store.brushColor)"
              >
                {{ store.brushColor.toUpperCase() }}
              </button>
              <input
                id="dock-custom-brush"
                v-model="store.brushColor"
                type="color"
                aria-label="Pick custom brush color"
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
