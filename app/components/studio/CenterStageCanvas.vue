<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faBorderAll,
  faCheck,
  faCircleCheck,
  faExpand,
  faMinus,
  faPlus,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import {
  buildFontJsonObject,
  buildPackMcmetaObject,
  stringifyAsciiSafeJson,
} from '@core/font/packBuilder.ts';
import { normalizeFontName } from '@core/font/puaAllocator.ts';
import { resolveBitmapEntryRaster } from '@core/font/pixelSynth.ts';
import { useWorkbenchStore, type CenterStageMode } from '@/stores/workbenchStore';
import { useInGamePreview } from '@/composables/useInGamePreview';
import CopyButton from '@/components/shared/CopyButton.vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const store = useWorkbenchStore();
const { snippets, cursorRuns, renderInGameStrip, effectiveGuiScale } = useInGamePreview();

const pixelCanvasRef = ref<HTMLCanvasElement | null>(null);
const inGameCanvasRef = ref<HTMLCanvasElement | null>(null);

const hoverPixel = ref<{
  readonly x: number;
  readonly y: number;
  readonly hex: string | null;
  readonly rgbaLabel: string;
} | null>(null);

watch(
  () => store.selectedEntry?.id,
  () => {
    hoverPixel.value = null;
  },
);

let isDrawing = false;
let pushedUndoThisStroke = false;
let lastPaintedPoint: { x: number; y: number } | null = null;
let cachedBaseCanvas: HTMLCanvasElement | null = null;

// Layout thrashing prevention: cache canvas bounding rect during pointer sessions
let cachedCanvasRect: DOMRect | null = null;
let pendingHoverCoord: { x: number; y: number } | null = null;
let rafHoverId: number | null = null;

function getCanvasRect(): DOMRect | null {
  if (!cachedCanvasRect && pixelCanvasRef.value) {
    cachedCanvasRect = pixelCanvasRef.value.getBoundingClientRect();
  }
  return cachedCanvasRect;
}

function invalidateCanvasRect(): void {
  cachedCanvasRect = null;
}

onMounted(() => {
  window.addEventListener('resize', invalidateCanvasRect, { passive: true });
  window.addEventListener('scroll', invalidateCanvasRect, { passive: true, capture: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', invalidateCanvasRect);
  window.removeEventListener('scroll', invalidateCanvasRect, true);
  if (rafHoverId !== null && typeof window !== 'undefined') {
    window.cancelAnimationFrame(rafHoverId);
    rafHoverId = null;
  }
});

watch(
  () => [store.zoom, activeRaster.value?.width, activeRaster.value?.height],
  () => {
    invalidateCanvasRect();
  },
);

function buildCheckerPattern(
  ctx: CanvasRenderingContext2D,
  zoomVal: number,
): CanvasPattern | null {
  if (typeof document === 'undefined') return null;
  const cell = zoomVal >= 8 ? Math.max(4, Math.floor(zoomVal / 2)) : Math.max(2, zoomVal);
  const tile = document.createElement('canvas');
  tile.width = cell * 2;
  tile.height = cell * 2;
  const tctx = tile.getContext('2d');
  if (!tctx) return null;
  tctx.fillStyle = '#1e1f29';
  tctx.fillRect(0, 0, cell * 2, cell * 2);
  tctx.fillStyle = '#262736';
  tctx.fillRect(cell, 0, cell, cell);
  tctx.fillRect(0, cell, cell, cell);
  return ctx.createPattern(tile, 'repeat');
}

const selectedMetrics = computed(() =>
  store.selectedEntry
    ? store.validation.metricsByEntryId[store.selectedEntry.id]
    : undefined,
);

const selectedDecodeError = computed(() =>
  store.selectedEntry
    ? store.validation.decodeErrorsByEntryId[store.selectedEntry.id]
    : undefined,
);

const activeRaster = computed(() => {
  const entry = store.selectedEntry;
  if (!entry || entry.kind !== 'bitmap') return null;
  return resolveBitmapEntryRaster(entry, store.decodedUploads.get(entry.id));
});

const jsonOutputText = computed(() => {
  const proj = store.fontProject;
  const fontJson = stringifyAsciiSafeJson(buildFontJsonObject(proj), 2);
  const mcmetaJson = JSON.stringify(
    buildPackMcmetaObject(proj.targetVersion, proj.packDescription),
    null,
    2,
  );
  const ns = (proj.namespace || 'mypack').trim().toLowerCase();
  const fontName = normalizeFontName(proj.fontName);
  return `// assets/${ns}/font/${fontName}.json\n${fontJson}\n\n// pack.mcmeta\n${mcmetaJson}`;
});

function toHexByte(n: number): string {
  return Math.max(0, Math.min(255, n)).toString(16).toUpperCase().padStart(2, '0');
}

// 1. Rebuild base canvas (checkerboard pattern + sprite + dual-tier grid + guides) ONLY when content/zoom/grid changes
watchEffect(() => {
  const raster = activeRaster.value;
  const metrics = selectedMetrics.value;
  const z = store.zoom;
  const grid = store.showGrid;
  if (!raster || typeof document === 'undefined') {
    cachedBaseCanvas = null;
    return;
  }

  const displayW = Math.max(1, raster.width * z);
  const displayH = Math.max(1, raster.height * z);
  if (!cachedBaseCanvas) {
    cachedBaseCanvas = document.createElement('canvas');
  }
  if (cachedBaseCanvas.width !== displayW || cachedBaseCanvas.height !== displayH) {
    cachedBaseCanvas.width = displayW;
    cachedBaseCanvas.height = displayH;
  }

  const ctx = cachedBaseCanvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, displayW, displayH);

  // Pixel-aligned alpha checkerboard via single CanvasPattern fill (O(1) draw call)
  const pattern = buildCheckerPattern(ctx, z);
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, displayW, displayH);
  } else {
    ctx.fillStyle = '#1e1f29';
    ctx.fillRect(0, 0, displayW, displayH);
  }

  // Crisp nearest-neighbor RGBA sprite layer
  const off = document.createElement('canvas');
  off.width = raster.width;
  off.height = raster.height;
  const octx = off.getContext('2d');
  if (!octx) return;
  octx.putImageData(
    new ImageData(new Uint8ClampedArray(raster.rgba), raster.width, raster.height),
    0,
    0,
  );
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, displayW, displayH);

  // Dual-tier pixel grid (minor 1px lines + major 4px alignment guides)
  if (grid && z >= 4) {
    ctx.strokeStyle = z >= 8 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < raster.width; x++) {
      if (x % 4 === 0 && z >= 6) continue;
      const px = Math.floor(x * z) + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, displayH);
    }
    for (let y = 1; y < raster.height; y++) {
      if (y % 4 === 0 && z >= 6) continue;
      const py = Math.floor(y * z) + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(displayW, py);
    }
    ctx.stroke();

    if (z >= 6) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 4; x < raster.width; x += 4) {
        const px = Math.floor(x * z) + 0.5;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, displayH);
      }
      for (let y = 4; y < raster.height; y += 4) {
        const py = Math.floor(y * z) + 0.5;
        ctx.moveTo(0, py);
        ctx.lineTo(displayW, py);
      }
      ctx.stroke();
    }
  }

  // Sprite sheet cell boundaries
  if (metrics && (metrics.cols > 1 || metrics.rows > 1)) {
    ctx.strokeStyle = 'rgba(255, 94, 44, 0.78)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 1; c < metrics.cols; c++) {
      const cx = Math.floor(c * metrics.cellW * z) + 0.5;
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, displayH);
    }
    for (let r = 1; r < metrics.rows; r++) {
      const ry = Math.floor(r * metrics.cellH * z) + 0.5;
      ctx.moveTo(0, ry);
      ctx.lineTo(displayW, ry);
    }
    ctx.stroke();
  }
});

// 2. Lightweight display blit + dual-contrast hover reticle (O(1) on pointermove)
watchEffect(() => {
  const canvas = pixelCanvasRef.value;
  const raster = activeRaster.value;
  const z = store.zoom;
  const hovered = hoverPixel.value;
  const tool = store.activeTool;
  const brush = store.brushColor;
  // Subscribe to grid & metrics so display redraws immediately whenever baseCanvas updates
  void store.showGrid;
  void selectedMetrics.value;
  if (!canvas || !raster || !cachedBaseCanvas || typeof document === 'undefined') return;

  const displayW = Math.max(1, raster.width * z);
  const displayH = Math.max(1, raster.height * z);
  if (canvas.width !== displayW || canvas.height !== displayH) {
    canvas.width = displayW;
    canvas.height = displayH;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, displayW, displayH);
  ctx.drawImage(cachedBaseCanvas, 0, 0);

  if (
    hovered &&
    hovered.x >= 0 &&
    hovered.y >= 0 &&
    hovered.x < raster.width &&
    hovered.y < raster.height &&
    z >= 4
  ) {
    const rx = hovered.x * z + 0.5;
    const ry = hovered.y * z + 0.5;
    const rw = Math.max(1, z - 1);
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.lineWidth = 2;
    ctx.strokeRect(rx, ry, rw, rw);
    ctx.strokeStyle =
      tool === 'eraser'
        ? 'rgba(239, 68, 68, 0.98)'
        : tool === 'pencil' || tool === 'eyedropper'
          ? 'rgba(255, 94, 44, 0.98)'
          : 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1;
    ctx.strokeRect(rx, ry, rw, rw);

    if (tool === 'pencil' && z >= 8) {
      const dotSize = Math.max(2, Math.floor(z * 0.34));
      const dotOff = Math.floor((z - dotSize) / 2);
      ctx.fillStyle = brush;
      ctx.fillRect(hovered.x * z + dotOff, hovered.y * z + dotOff, dotSize, dotSize);
    }
    ctx.restore();
  }
});

// Enlarged preview canvas when Preview mode active
watchEffect(() => {
  if (store.stageMode === 'preview') {
    renderInGameStrip(
      inGameCanvasRef.value,
      store.fontProject.previewContext,
      effectiveGuiScale.value,
      320,
      'stage',
    );
  }
});

function readCoordFromEvent(event: PointerEvent): { x: number; y: number } | null {
  const canvas = pixelCanvasRef.value;
  const raster = activeRaster.value;
  if (!canvas || !raster) return null;
  const rect = getCanvasRect();
  if (!rect || rect.width === 0 || rect.height === 0) return null;
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * raster.width);
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * raster.height);
  if (x < 0 || y < 0 || x >= raster.width || y >= raster.height) return null;
  return { x, y };
}

function readPixelAt(
  x: number,
  y: number,
): { r: number; g: number; b: number; a: number; hex: string | null } | null {
  const raster = activeRaster.value;
  if (!raster) return null;
  const idx = (y * raster.width + x) * 4;
  const r = raster.rgba[idx] ?? 0;
  const g = raster.rgba[idx + 1] ?? 0;
  const b = raster.rgba[idx + 2] ?? 0;
  const a = raster.rgba[idx + 3] ?? 0;
  const hex = a > 0 ? `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}` : null;
  return { r, g, b, a, hex };
}

function inspectPixelAt(x: number, y: number): void {
  const px = readPixelAt(x, y);
  if (!px) return;
  hoverPixel.value = {
    x,
    y,
    hex: px.hex,
    rgbaLabel: `rgba(${px.r},${px.g},${px.b},${px.a})`,
  };
}

function scheduleInspectPixelAt(x: number, y: number): void {
  pendingHoverCoord = { x, y };
  if (rafHoverId === null && typeof window !== 'undefined') {
    rafHoverId = window.requestAnimationFrame(() => {
      rafHoverId = null;
      if (pendingHoverCoord) {
        inspectPixelAt(pendingHoverCoord.x, pendingHoverCoord.y);
      }
    });
  }
}

function pickColorAt(x: number, y: number): void {
  const px = readPixelAt(x, y);
  if (!px || !px.hex) return;
  store.brushColor = px.hex;
  store.copyColorHex(px.hex);
}

function applyToolLineTo(x: number, y: number): void {
  const entry = store.selectedEntry;
  if (!entry || store.activeTool === 'select' || store.activeTool === 'eyedropper') {
    return;
  }
  const colorVal = store.activeTool === 'pencil' ? store.brushColor : null;
  const updates: Record<string, string | null> = {};

  if (!lastPaintedPoint) {
    updates[`${x},${y}`] = colorVal;
  } else {
    let x0 = lastPaintedPoint.x;
    let y0 = lastPaintedPoint.y;
    if (x0 === x && y0 === y) return;
    const dx = Math.abs(x - x0);
    const dy = Math.abs(y - y0);
    const sx = x0 < x ? 1 : -1;
    const sy = y0 < y ? 1 : -1;
    let err = dx - dy;
    while (true) {
      updates[`${x0},${y0}`] = colorVal;
      if (x0 === x && y0 === y) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  lastPaintedPoint = { x, y };
  const pushHistory = !pushedUndoThisStroke;
  pushedUndoThisStroke = true;
  store.paintPixels(entry.id, updates, pushHistory);
}

function onPointerDown(e: PointerEvent): void {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (pixelCanvasRef.value) {
    cachedCanvasRect = pixelCanvasRef.value.getBoundingClientRect();
  }
  const coord = readCoordFromEvent(e);
  if (!coord) return;
  inspectPixelAt(coord.x, coord.y);

  if (
    store.activeTool === 'eyedropper' ||
    (e.altKey && store.activeTool === 'pencil')
  ) {
    pickColorAt(coord.x, coord.y);
    return;
  }

  if (store.activeTool !== 'select') {
    try {
      (e.currentTarget as HTMLElement | null)?.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic pointer event
    }
    isDrawing = true;
    pushedUndoThisStroke = false;
    lastPaintedPoint = null;
    applyToolLineTo(coord.x, coord.y);
  }
}

function onPointerMove(e: PointerEvent): void {
  const coord = readCoordFromEvent(e);
  if (!coord) return;
  scheduleInspectPixelAt(coord.x, coord.y);
  if (
    isDrawing &&
    (store.activeTool === 'pencil' || store.activeTool === 'eraser')
  ) {
    applyToolLineTo(coord.x, coord.y);
  }
}

function endStroke(): void {
  isDrawing = false;
  lastPaintedPoint = null;
}

function onPointerEnter(): void {
  if (pixelCanvasRef.value) {
    cachedCanvasRect = pixelCanvasRef.value.getBoundingClientRect();
  }
}

function onPointerLeave(): void {
  invalidateCanvasRect();
  if (rafHoverId !== null && typeof window !== 'undefined') {
    window.cancelAnimationFrame(rafHoverId);
    rafHoverId = null;
  }
  hoverPixel.value = null;
}

function handleCanvasWheel(e: WheelEvent): void {
  if (!e.ctrlKey && !e.metaKey && !e.altKey) return;
  e.preventDefault();
  const delta = e.deltaY < 0 ? 2 : -2;
  store.zoom = Math.max(2, Math.min(24, store.zoom + delta));
}

function handleStageModeChange(val: unknown): void {
  if (val === 'canvas' || val === 'preview' || val === 'split') {
    store.stageMode = val as CenterStageMode;
  }
}

const activeToolLabel = computed(() => {
  switch (store.activeTool) {
    case 'select':
      return 'Pilih (V)';
    case 'pencil':
      return 'Pensil (B)';
    case 'eraser':
      return 'Penghapus (E)';
    case 'eyedropper':
      return 'Pipet (I)';
    default:
      return store.activeTool;
  }
});
</script>

<template>
  <section
    aria-label="Panggung kanvas dan pratinjau studio"
    class="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
  >
    <!-- Crisp Workstation Top Header -->
    <div class="flex items-center justify-between border-b border-border bg-card px-3 py-1.5">
      <div class="flex items-center gap-1">
        <ToggleGroup
          type="single"
          :model-value="store.stageMode"
          aria-label="Mode tampilan panggung kerja"
          class="gap-0.5 rounded-sm border border-border bg-muted/80 p-0.5"
          @update:model-value="handleStageModeChange"
        >
          <ToggleGroupItem
            value="canvas"
            class="h-7 rounded-sm px-2.5 text-xs font-medium transition-[background-color,color] duration-100 ease-out data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground"
          >
            Kanvas Piksel
          </ToggleGroupItem>
          <ToggleGroupItem
            value="split"
            class="h-7 rounded-sm px-2.5 text-xs font-medium transition-[background-color,color] duration-100 ease-out data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground"
          >
            Split JSON
          </ToggleGroupItem>
          <ToggleGroupItem
            value="preview"
            class="h-7 rounded-sm px-2.5 text-xs font-medium transition-[background-color,color] duration-100 ease-out data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground"
          >
            Simulasi In-Game
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div class="flex items-center gap-1.5" role="group" aria-label="Kontrol perbesaran kanvas">
        <div class="flex items-center rounded-sm border border-border bg-muted/80 p-0.5">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Perkecil perbesaran kanvas"
                class="h-6 w-6 rounded-sm text-muted-foreground hover:text-foreground transition-[color,transform] duration-100 ease-out active:scale-[0.96]"
                @click="store.zoom = Math.max(2, store.zoom - 2)"
              >
                <FontAwesomeIcon :icon="faMinus" class="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" class="text-xs">
              Perkecil Kanvas
            </TooltipContent>
          </Tooltip>

          <span class="min-w-9 text-center font-mono text-[11px] font-medium text-foreground tabular-nums">
            {{ store.zoom }}×
          </span>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Perbesar kanvas"
                class="h-6 w-6 rounded-sm text-muted-foreground hover:text-foreground transition-[color,transform] duration-100 ease-out active:scale-[0.96]"
                @click="store.zoom = Math.min(24, store.zoom + 2)"
              >
                <FontAwesomeIcon :icon="faPlus" class="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" class="text-xs">
              Perbesar Kanvas
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Atur ulang zoom ke 12x (Ctrl+0)"
                class="h-6 w-6 rounded-sm text-muted-foreground hover:text-foreground transition-[color,transform] duration-100 ease-out active:scale-[0.96]"
                @click="store.zoom = 12"
              >
                <FontAwesomeIcon :icon="faExpand" class="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" class="flex items-center gap-1.5 text-xs">
              <span>Atur Ulang Zoom 12×</span>
              <kbd class="font-mono text-[10px] bg-background/60 px-1 py-0.5 rounded border border-border">Ctrl+0</kbd>
            </TooltipContent>
          </Tooltip>
        </div>

        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              :aria-pressed="store.showGrid"
              aria-label="Alihkan kisi piksel (G)"
              :class="[
                'h-7 w-7 rounded-sm border transition-[color,background-color,border-color,transform] duration-100 ease-out active:scale-[0.96]',
                store.showGrid
                  ? 'border-primary/40 bg-primary/15 text-primary'
                  : 'border-border bg-muted/80 text-muted-foreground hover:text-foreground',
              ]"
              @click="store.showGrid = !store.showGrid"
            >
              <FontAwesomeIcon :icon="faBorderAll" class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" class="flex items-center gap-1.5 text-xs">
            <span>Kisi Piksel</span>
            <kbd class="font-mono text-[10px] bg-background/60 px-1 py-0.5 rounded border border-border">G</kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>

    <!-- Main Stage Content -->
    <div class="relative min-h-0 flex-1 overflow-hidden">
      <!-- Floating Copied Color Toast -->
      <div
        v-if="store.copiedColorToast"
        role="status"
        aria-live="polite"
        class="pointer-events-none absolute right-3 bottom-3 z-20 flex items-center gap-1.5 rounded-md border border-border bg-card/95 px-2.5 py-1.5 font-mono text-[11px] text-foreground shadow-lg backdrop-blur-xs"
      >
        <span
          aria-hidden="true"
          class="h-3 w-3 rounded-[2px] border border-white/25 shadow-xs"
          :style="{ backgroundColor: store.copiedColorToast.hex }"
        />
        <FontAwesomeIcon :icon="faCheck" class="h-3 w-3 text-emerald-400" />
        <span class="tabular-nums">
          {{
            store.copiedColorToast.ok
              ? `Tersalin ${store.copiedColorToast.hex}`
              : `Dipilih ${store.copiedColorToast.hex}`
          }}
        </span>
      </div>

      <!-- Mode 1 & 2: Pure Canvas OR Side-by-side Split JSON -->
      <ResizablePanelGroup
        v-if="store.stageMode === 'canvas' || store.stageMode === 'split'"
        direction="horizontal"
        class="h-full w-full"
      >
        <ResizablePanel :default-size="store.stageMode === 'split' ? 56 : 100" :min-size="35">
          <div
            class="pixel-checkerboard flex h-full min-h-[300px] overflow-auto p-6"
            @wheel="handleCanvasWheel"
          >
            <p v-if="!store.selectedEntry" class="m-auto text-xs text-muted-foreground">
              Pilih atau tambahkan entri pada bilah kiri untuk mengedit piksel.
            </p>

            <!-- Space Entry Visual Offset Gauge -->
            <div
              v-else-if="store.selectedEntry.kind === 'space'"
              class="m-auto w-full max-w-md space-y-3 rounded-md border border-border bg-card/95 p-5 text-center shadow-lg"
            >
              <p class="font-mono text-xs font-medium text-primary">
                SpaceProvider · {{ store.selectedEntry.label }}
              </p>
              <p class="font-mono text-3xl font-semibold text-foreground tabular-nums">
                {{ store.selectedEntry.advance > 0 ? `+${store.selectedEntry.advance}` : store.selectedEntry.advance }} px
              </p>
              <div class="relative h-7 rounded border border-border bg-background px-3">
                <div class="absolute inset-y-0 left-1/2 w-px bg-border" />
                <div
                  :style="{
                    left:
                      store.selectedEntry.advance >= 0
                        ? '50%'
                        : `${Math.max(5, 50 + store.selectedEntry.advance * 1.5)}%`,
                    width: `${Math.min(45, Math.abs(store.selectedEntry.advance) * 1.5)}%`,
                  }"
                  :class="[
                    'absolute top-1.5 h-3.5 rounded-[2px]',
                    store.selectedEntry.advance < 0 ? 'bg-amber-500/80' : 'bg-primary/85',
                  ]"
                />
              </div>
              <p class="text-[11px] leading-relaxed text-muted-foreground">
                {{
                  store.selectedEntry.advance < 0 || store.selectedEntry.advance > 32
                    ? 'Valid dalam SpaceProvider (anyGlyphs); diabaikan dalam mode nonFishyGlyphs (&k).'
                    : 'Rentang nilai aman untuk anyGlyphs dan nonFishyGlyphs (0..32 px).'
                }}
              </p>
            </div>

            <!-- PNG Decode Error Alert -->
            <Alert
              v-else-if="selectedDecodeError || !activeRaster"
              variant="destructive"
              class="m-auto max-w-md rounded-md bg-destructive/10 border-destructive/40"
            >
              <FontAwesomeIcon :icon="faTriangleExclamation" class="h-4 w-4 text-destructive" />
              <AlertTitle class="text-xs font-semibold">
                Gagal memproses berkas PNG (F03)
              </AlertTitle>
              <AlertDescription class="text-xs text-destructive">
                {{ selectedDecodeError ?? 'Unggah berkas PNG yang valid melalui penjelajah atau inspektur.' }}
              </AlertDescription>
            </Alert>

            <!-- Crisp Pixel Canvas Wrapper -->
            <div
              v-else
              class="sprite-preview-outline m-auto inline-block shrink-0 rounded-xs ring-1 ring-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.65)]"
              :style="{
                width: `${activeRaster.width * store.zoom}px`,
                height: `${activeRaster.height * store.zoom}px`,
              }"
            >
              <canvas
                id="studio-pixel-canvas"
                ref="pixelCanvasRef"
                role="img"
                :aria-label="`Kanvas piksel untuk ${store.selectedEntry.label} (${activeRaster.width} × ${activeRaster.height} piksel)`"
                :style="{
                  touchAction: store.activeTool === 'select' ? 'auto' : 'none',
                  cursor:
                    store.activeTool === 'pencil' || store.activeTool === 'eyedropper'
                      ? 'crosshair'
                      : store.activeTool === 'eraser'
                        ? 'cell'
                        : 'default',
                }"
                class="pixelated-canvas block h-full w-full"
                @pointerdown="onPointerDown"
                @pointermove="onPointerMove"
                @pointerup="endStroke"
                @pointercancel="endStroke"
                @pointerenter="onPointerEnter"
                @pointerleave="onPointerLeave"
              />
            </div>
          </div>
        </ResizablePanel>

        <template v-if="store.stageMode === 'split'">
          <ResizableHandle with-handle />
          <ResizablePanel :default-size="44" :min-size="25">
            <div class="flex h-full min-h-0 flex-col bg-card">
              <div class="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                <span class="font-mono text-[11px] font-medium text-foreground">
                  font.json &amp; pack.mcmeta
                </span>
                <CopyButton
                  compact
                  target-id="split-font-json-code"
                  :text-to-copy="jsonOutputText"
                  label="Salin JSON"
                  aria-label="Salin font JSON dan pack.mcmeta"
                />
              </div>
              <ScrollArea class="min-h-0 flex-1">
                <pre
                  tabindex="0"
                  class="w-max min-w-full p-3.5 font-mono text-[11px] leading-relaxed text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                ><code id="split-font-json-code">{{ jsonOutputText }}</code></pre>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </ResizablePanel>
        </template>
      </ResizablePanelGroup>

      <!-- Mode 3: Enlarged In-Game Preview Stage -->
      <ScrollArea v-else class="h-full">
        <div class="mx-auto max-w-4xl space-y-5 p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h2 class="text-sm font-semibold text-foreground">
                Simulasi Render In-Game ({{ store.fontProject.previewContext === 'Nametag' ? 'Third Person · Nametag' : store.fontProject.previewContext }})
              </h2>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <ToggleGroup
                type="single"
                :model-value="store.fontProject.previewContext"
                aria-label="Konteks suasana pratinjau"
                class="gap-0.5 rounded-sm border border-border bg-card p-0.5"
                @update:model-value="
                  (val) => {
                    if (val === 'Chat' || val === 'TAB' || val === 'Nametag') {
                      store.setPreviewContext(val);
                    }
                  }
                "
              >
                <ToggleGroupItem
                  value="Chat"
                  class="h-6 rounded-sm px-2 text-[11px] data-[state=on]:bg-accent data-[state=on]:text-foreground"
                >
                  Obrolan
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="TAB"
                  class="h-6 rounded-sm px-2 text-[11px] data-[state=on]:bg-accent data-[state=on]:text-foreground"
                >
                  TAB
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="Nametag"
                  class="h-6 rounded-sm px-2 text-[11px] data-[state=on]:bg-accent data-[state=on]:text-foreground"
                >
                  Third Person
                </ToggleGroupItem>
              </ToggleGroup>

              <ToggleGroup
                type="single"
                :model-value="store.previewBackdropMode"
                aria-label="Mode latar belakang pratinjau"
                class="gap-0.5 rounded-sm border border-border bg-card p-0.5"
                @update:model-value="
                  (val) => {
                    if (val === 'world' || val === 'solid' || val === 'custom') {
                      store.setPreviewBackdropMode(val);
                    }
                  }
                "
              >
                <ToggleGroupItem
                  value="world"
                  class="h-6 rounded-sm px-2 text-[11px] data-[state=on]:bg-accent data-[state=on]:text-foreground"
                >
                  Suasana Dunia
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="solid"
                  class="h-6 rounded-sm px-2 text-[11px] data-[state=on]:bg-accent data-[state=on]:text-foreground"
                >
                  Gelap Pekat
                </ToggleGroupItem>
                <ToggleGroupItem
                  v-if="store.customBackdropUrl"
                  value="custom"
                  class="h-6 rounded-sm px-2 text-[11px] data-[state=on]:bg-accent data-[state=on]:text-foreground"
                >
                  Foto Lokal
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <div class="sprite-preview-outline flex min-h-44 items-center justify-center overflow-x-auto rounded-md border border-border bg-background p-3">
            <canvas
              ref="inGameCanvasRef"
              role="img"
              :aria-label="`Simulasi ${store.fontProject.previewContext}`"
              class="pixelated-canvas block max-w-full shrink-0 ring-1 ring-white/15"
            />
          </div>

          <div class="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div class="space-y-2">
              <Label for="stage-sample-chat-input" class="text-xs font-medium text-foreground">
                Teks sampel setelah prefiks
              </Label>
              <Input
                id="stage-sample-chat-input"
                type="text"
                :model-value="store.fontProject.sampleChatText"
                class="h-8 rounded-sm bg-muted font-mono text-xs"
                @update:model-value="store.setSampleChatText(String($event ?? ''))"
              />
              <p class="text-[11px] text-muted-foreground">
                Teks ASCII menggunakan font piksel 3×5 sintetis (tanpa aset vanilla Mojang).
              </p>
            </div>

            <div class="space-y-2">
              <p class="text-xs font-medium text-foreground">
                Urutan token prefiks aktif ({{ store.fontProject.prefixSequenceIds.length }})
              </p>
              <div class="flex flex-wrap gap-1.5">
                <Button
                  v-for="entry in store.fontProject.entries"
                  :key="entry.id"
                  type="button"
                  size="sm"
                  :variant="store.fontProject.prefixSequenceIds.includes(entry.id) ? 'default' : 'outline'"
                  class="h-7 rounded-sm px-2 font-mono text-[11px] transition-[background-color,color,transform] duration-100 ease-out active:scale-[0.96]"
                  @click="store.togglePrefixEntry(entry.id)"
                >
                  {{ store.fontProject.prefixSequenceIds.includes(entry.id) ? '✓ ' : '+ ' }}{{ entry.label }}
                </Button>
              </div>
            </div>
          </div>

          <div class="space-y-2 border-t border-border pt-4">
            <h3 class="text-xs font-semibold text-foreground">
              Akumulasi kursor float (<code class="text-muted-foreground font-mono">PreparedTextBuilder</code>)
            </h3>
            <div class="overflow-x-auto rounded-md border border-border bg-card">
              <Table>
                <TableHeader class="border-b border-border bg-muted">
                  <TableRow class="border-border hover:bg-transparent">
                    <TableHead class="h-8 font-mono text-[11px]">Token</TableHead>
                    <TableHead class="h-8 font-mono text-[11px]">Awal X</TableHead>
                    <TableHead class="h-8 font-mono text-[11px]">Advance</TableHead>
                    <TableHead class="h-8 font-mono text-[11px]">Akhir X</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody class="divide-y divide-border/50 font-mono text-[11px] tabular-nums">
                  <TableRow
                    v-for="(run, idx) in cursorRuns.slice(0, 12)"
                    :key="idx"
                    class="border-border/50"
                  >
                    <TableCell class="py-1.5 text-primary">{{ run.label }}</TableCell>
                    <TableCell class="py-1.5">{{ run.xStartFloat.toFixed(3) }}</TableCell>
                    <TableCell class="py-1.5">{{ run.advance }}</TableCell>
                    <TableCell class="py-1.5">{{ run.xEndFloat.toFixed(3) }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>

    <!-- Bottom 28px IDE Status Bar -->
    <div
      role="status"
      aria-label="Status kanvas dan kursor"
      class="flex h-7 shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-3 font-mono text-[11px] text-muted-foreground tabular-nums whitespace-nowrap select-none"
    >
      <div class="flex min-w-0 items-center gap-2.5 overflow-hidden whitespace-nowrap">
        <!-- Active Tool Indicator -->
        <span class="inline-flex items-center gap-1 font-medium text-foreground">
          <span class="text-[10px] uppercase tracking-wider text-muted-foreground">Alat:</span>
          <span class="text-primary">{{ activeToolLabel }}</span>
        </span>

        <span class="text-border">|</span>

        <!-- Zoom Indicator -->
        <span class="inline-flex items-center gap-1">
          <span class="text-[10px] uppercase tracking-wider text-muted-foreground">Zoom:</span>
          <span class="text-foreground">{{ store.zoom }}×</span>
        </span>

        <span class="text-border">|</span>

        <!-- Cursor Coordinates & Color -->
        <template v-if="hoverPixel">
          <span class="inline-flex items-center gap-1 text-foreground">
            <span class="text-[10px] uppercase tracking-wider text-muted-foreground">Pos:</span>
            <span>({{ hoverPixel.x }}, {{ hoverPixel.y }})</span>
          </span>

          <span v-if="hoverPixel.hex" class="inline-flex items-center gap-1.5 text-foreground">
            <span
              aria-hidden="true"
              class="inline-block h-2.5 w-2.5 rounded-[2px] border border-white/25 shadow-xs"
              :style="{ backgroundColor: hoverPixel.hex }"
            />
            <span class="text-foreground">{{ hoverPixel.hex }}</span>
          </span>
          <span v-else class="text-muted-foreground">(Transparan)</span>

          <span class="truncate text-[10px] text-muted-foreground">{{ hoverPixel.rgbaLabel }}</span>
        </template>
        <template v-else-if="store.selectedEntry?.kind === 'bitmap' && selectedMetrics">
          <span class="text-foreground">
            {{ selectedMetrics.imageWidth }}×{{ selectedMetrics.imageHeight }}px
          </span>
          <span>cell {{ selectedMetrics.cellW }}×{{ selectedMetrics.cellH }}</span>
          <span class="text-sky-300">
            w {{ selectedMetrics.primaryActualGlyphWidth }}
          </span>
          <span class="text-primary">
            adv {{ selectedMetrics.primaryAdvance }}px
          </span>
          <span>top {{ selectedMetrics.top }}</span>
        </template>
        <span v-else-if="store.selectedEntry?.kind === 'space'" class="text-foreground">
          Spasi Negatif · adv {{ store.selectedEntry.advance }}px
        </span>
        <span v-else class="text-muted-foreground">Siap</span>
      </div>

      <div class="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
        <Tooltip>
          <TooltipTrigger as-child>
            <span class="inline-flex cursor-help items-center gap-1 text-amber-300">
              <FontAwesomeIcon :icon="faTriangleExclamation" class="h-3 w-3" />
              <span>[UNVERIFIED] Simulasi Float</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" class="max-w-xs text-xs">
            Simulasi koordinat float diturunkan dari bytecode Mojang; rasterisasi klien dan pemfilteran tekstur 1.21.11+ tetap memerlukan verifikasi klien langsung.
          </TooltipContent>
        </Tooltip>

        <button
          type="button"
          :class="[
            'inline-flex cursor-pointer items-center gap-1.5 font-medium rounded px-1.5 py-0.5 focus-visible:outline-2 focus-visible:outline-primary transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.96]',
            store.validation.errors > 0 ? 'text-destructive bg-destructive/10' : 'text-emerald-300 hover:bg-muted/70',
          ]"
          @click="store.inspectorTab = 'validate'"
        >
          <FontAwesomeIcon v-if="store.validation.errors === 0" :icon="faCircleCheck" class="h-3 w-3" />
          <FontAwesomeIcon v-else :icon="faTriangleExclamation" class="h-3 w-3" />
          <span>
            {{
              store.validation.errors > 0
                ? `${store.validation.errors} Kesalahan`
                : store.validation.warns > 0
                  ? `0 Kesalahan · ${store.validation.warns} Peringatan`
                  : '0 Kesalahan · Siap'
            }}
          </span>
        </button>
      </div>
    </div>
  </section>
</template>
