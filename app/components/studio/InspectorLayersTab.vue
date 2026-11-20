<script setup lang="ts">
import { computed, ref } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faArrowDown,
  faArrowUp,
  faCheck,
  faChevronDown,
  faCopy,
  faEye,
  faEyeSlash,
  faGripVertical,
  faRotateLeft,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { DEFAULT_RANK_LAYER_ORDER } from '@core/font/pixelSynth.ts';
import type {
  BitmapFontEntry,
  RankLayerId,
  RankLayerStyle,
  RankLayerVisibility,
} from '@core/font/types.ts';
import { useWorkbenchStore } from '@/stores/workbenchStore';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

const store = useWorkbenchStore();
const expandedLayer = ref<RankLayerId | null>(null);
const copiedLayerColor = ref<string | null>(null);
let copiedTimer: number | null = null;

function updateBitmap(updater: (prev: BitmapFontEntry) => BitmapFontEntry): void {
  const entry = store.selectedEntry;
  if (!entry || entry.kind !== 'bitmap') return;
  store.updateEntry(entry.id, (prev) =>
    prev.kind === 'bitmap' ? updater(prev) : prev,
  );
}

function getEffectiveDrawOrder(entry: BitmapFontEntry): readonly RankLayerId[] {
  const raw = entry.layerOrder;
  if (!raw || raw.length === 0) return DEFAULT_RANK_LAYER_ORDER;
  const seen = new Set<RankLayerId>();
  const cleaned: RankLayerId[] = [];
  for (const id of raw) {
    if (DEFAULT_RANK_LAYER_ORDER.includes(id) && !seen.has(id)) {
      seen.add(id);
      cleaned.push(id);
    }
  }
  for (const id of DEFAULT_RANK_LAYER_ORDER) {
    if (!seen.has(id)) cleaned.push(id);
  }
  return cleaned;
}

// Top-to-bottom UI order = reverse of bottom-to-top composite draw order
const displayLayers = computed<readonly RankLayerId[]>(() => {
  const entry = store.selectedEntry;
  if (!entry || entry.kind !== 'bitmap') return [];
  return [...getEffectiveDrawOrder(entry)].reverse();
});

const hasCustomOrder = computed(() => {
  const entry = store.selectedEntry;
  if (!entry || entry.kind !== 'bitmap') return false;
  const current = getEffectiveDrawOrder(entry);
  return current.some((id, i) => id !== DEFAULT_RANK_LAYER_ORDER[i]);
});

function getLayerMeta(
  entry: BitmapFontEntry,
  id: RankLayerId,
): { readonly title: string; readonly subtitle: string } {
  if (id === 'paint') {
    return {
      title: 'Paint (Pixel Brush)',
      subtitle: `${Object.keys(entry.paintEdits).length} edited pixels`,
    };
  }
  if (id === 'text') {
    return {
      title: 'Rank Text',
      subtitle:
        entry.sourceMode === 'composer'
          ? `${entry.composer.text || '—'} (${entry.composer.fontSize})`
          : 'Composer mode only',
    };
  }
  if (id === 'shadow') {
    return {
      title: 'Drop Shadow',
      subtitle: '1 px base offset + custom nudge',
    };
  }
  if (id === 'icon') {
    return {
      title: 'Icon',
      subtitle:
        entry.sourceMode === 'composer'
          ? `${entry.composer.iconId} (${entry.composer.badgeLayout === 'split-left' ? 'left split' : 'inline'})`
          : 'Composer mode only',
    };
  }
  return {
    title: 'Frame / Background',
    subtitle:
      entry.sourceMode === 'composer'
        ? entry.composer.frameStyle
        : 'Composer mode only',
  };
}

function getStyleFor(entry: BitmapFontEntry, id: RankLayerId): RankLayerStyle {
  const raw = entry.layerStyles?.[id];
  return {
    opacity: raw?.opacity ?? 100,
    offsetX: raw?.offsetX ?? 0,
    offsetY: raw?.offsetY ?? 0,
  };
}

function toggleLayerVisibility(key: keyof RankLayerVisibility): void {
  updateBitmap((prev) => ({
    ...prev,
    layerVisibility: {
      ...prev.layerVisibility,
      [key]: !prev.layerVisibility[key],
    },
  }));
}

function moveLayer(id: RankLayerId, direction: 'up' | 'down'): void {
  updateBitmap((prev) => {
    const uiOrder = [...getEffectiveDrawOrder(prev)].reverse();
    const idx = uiOrder.indexOf(id);
    if (idx < 0) return prev;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= uiOrder.length) return prev;
    const nextUi = [...uiOrder];
    const tmp = nextUi[idx]!;
    nextUi[idx] = nextUi[swapIdx]!;
    nextUi[swapIdx] = tmp;
    return {
      ...prev,
      layerOrder: nextUi.reverse(),
    };
  });
}

function resetLayerOrder(): void {
  updateBitmap((prev) => ({
    ...prev,
    layerOrder: [...DEFAULT_RANK_LAYER_ORDER],
  }));
}

function updateLayerStyle(
  id: RankLayerId,
  patch: Partial<RankLayerStyle>,
): void {
  updateBitmap((prev) => {
    const current = getStyleFor(prev, id);
    return {
      ...prev,
      layerStyles: {
        ...prev.layerStyles,
        [id]: {
          ...current,
          ...patch,
        },
      },
    };
  });
}

function resetLayerStyle(id: RankLayerId): void {
  updateLayerStyle(id, { opacity: 100, offsetX: 0, offsetY: 0 });
}

function copyColor(tag: string, hex: string): void {
  store.copyColorHex(hex);
  copiedLayerColor.value = tag;
  if (typeof window !== 'undefined') {
    if (copiedTimer !== null) window.clearTimeout(copiedTimer);
    copiedTimer = window.setTimeout(() => {
      copiedLayerColor.value = null;
    }, 1500);
  }
}

const draggingLayerId = ref<RankLayerId | null>(null);
const dragOverLayerId = ref<RankLayerId | null>(null);
const dragOverPosition = ref<'above' | 'below'>('below');

function reorderLayer(sourceId: RankLayerId, targetId: RankLayerId, position: 'above' | 'below'): void {
  if (sourceId === targetId) return;
  updateBitmap((prev) => {
    const uiOrder = [...getEffectiveDrawOrder(prev)].reverse(); // top→bottom display
    const withoutSource = uiOrder.filter((id) => id !== sourceId);
    const targetIdx = withoutSource.indexOf(targetId);
    if (targetIdx < 0) return prev;
    const insertIdx = position === 'above' ? targetIdx : targetIdx + 1;
    withoutSource.splice(insertIdx, 0, sourceId);
    return { ...prev, layerOrder: withoutSource.reverse() };
  });
}

function onDragStart(layerId: RankLayerId, event: DragEvent): void {
  draggingLayerId.value = layerId;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', layerId);
  }
}

function onDragOver(layerId: RankLayerId, event: DragEvent): void {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  if (draggingLayerId.value === layerId) {
    dragOverLayerId.value = null;
    return;
  }
  dragOverLayerId.value = layerId;
  const el = event.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  dragOverPosition.value = event.clientY < rect.top + rect.height / 2 ? 'above' : 'below';
}

function onDragLeave(layerId: RankLayerId, event?: DragEvent): void {
  if (event?.currentTarget && event?.relatedTarget) {
    const current = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as Node | null;
    if (related && current.contains(related)) {
      return;
    }
  }
  if (dragOverLayerId.value === layerId) {
    dragOverLayerId.value = null;
  }
}

function onDrop(targetId: RankLayerId, event: DragEvent): void {
  event.preventDefault();
  const sourceId = (event.dataTransfer?.getData('text/plain') ?? '') as RankLayerId;
  if (sourceId && sourceId !== targetId) {
    reorderLayer(sourceId, targetId, dragOverPosition.value);
  }
  dragOverLayerId.value = null;
  draggingLayerId.value = null;
}

function onDragEnd(): void {
  draggingLayerId.value = null;
  dragOverLayerId.value = null;
}

function handleLayerHeaderClick(layerId: RankLayerId): void {
  expandedLayer.value = expandedLayer.value === layerId ? null : layerId;
}
</script>

<template>
  <div class="py-2">
    <p
      v-if="!store.selectedEntry || store.selectedEntry.kind !== 'bitmap'"
      class="px-3 py-4 text-xs text-muted-foreground"
    >
      Layer stack applies to bitmap or rank badge entries only.
    </p>

    <template v-else>
      <div class="flex items-center justify-between gap-2 px-3 pb-2">
        <p class="text-[11px] leading-snug text-muted-foreground">
          Drag with left mouse to reorder top-to-bottom. Click a layer to customize.
        </p>
        <Button
          v-if="hasCustomOrder"
          type="button"
          variant="ghost"
          size="sm"
          title="Reset layer order to default"
          class="h-6 shrink-0 gap-1 px-1.5 font-mono text-[10px] text-primary"
          @click="resetLayerOrder()"
        >
          <FontAwesomeIcon :icon="faRotateLeft" class="h-3 w-3" />
          <span>Reset</span>
        </Button>
      </div>

      <!-- Customizable Layer Stack -->
      <ul class="divide-y divide-border/50 border-y border-border/60">
        <li
          v-for="(layerId, idx) in displayLayers"
          :key="layerId"
          :data-layer-id="layerId"
          class="relative select-none bg-card"
        >
          <div
            :draggable="true"
            @dragstart="onDragStart(layerId, $event)"
            @dragover="onDragOver(layerId, $event)"
            @dragleave="onDragLeave(layerId, $event)"
            @drop="onDrop(layerId, $event)"
            @dragend="onDragEnd"
            class="flex items-center justify-between gap-1.5 px-2 py-2 transition-colors hover:bg-accent/40"
            :class="{
              'opacity-40': draggingLayerId === layerId,
              'border-t-2 border-primary': dragOverLayerId === layerId && dragOverPosition === 'above',
              'border-b-2 border-primary': dragOverLayerId === layerId && dragOverPosition === 'below',
            }"
          >
            <div class="flex min-w-0 flex-1 items-center gap-1.5">
              <span
                aria-hidden="true"
                title="Drag to reorder layer"
                class="flex h-5 w-4 shrink-0 cursor-grab items-center justify-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
              >
                <FontAwesomeIcon :icon="faGripVertical" class="h-3.5 w-3.5" />
              </span>
              <Checkbox
                :id="`layer-vis-${layerId}`"
                :model-value="store.selectedEntry.layerVisibility[layerId]"
                @update:model-value="toggleLayerVisibility(layerId)"
              />
              <button
                type="button"
                class="min-w-0 flex-1 cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-primary"
                @click="handleLayerHeaderClick(layerId)"
              >
                <span class="flex items-center gap-1.5 truncate text-xs font-medium text-foreground">
                  <span class="truncate">{{ getLayerMeta(store.selectedEntry, layerId).title }}</span>
                  <span
                    v-if="
                      getStyleFor(store.selectedEntry, layerId).opacity < 100 ||
                      getStyleFor(store.selectedEntry, layerId).offsetX !== 0 ||
                      getStyleFor(store.selectedEntry, layerId).offsetY !== 0
                    "
                    class="rounded bg-muted px-1 font-mono text-[9px] text-primary tabular-nums"
                  >
                    {{ getStyleFor(store.selectedEntry, layerId).opacity }}%
                  </span>
                </span>
                <span class="block w-full truncate font-mono text-[10px] font-normal text-muted-foreground">
                  {{ getLayerMeta(store.selectedEntry, layerId).subtitle }}
                </span>
              </button>
            </div>

            <div data-no-drag="true" :draggable="false" @dragstart.stop class="flex shrink-0 items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                :disabled="idx === 0"
                :aria-label="`Move ${layerId} layer up`"
                class="h-6 w-6 text-muted-foreground hover:text-foreground transition-[color,transform] duration-100 ease-out active:scale-[0.96]"
                @click="moveLayer(layerId, 'up')"
              >
                <FontAwesomeIcon :icon="faArrowUp" class="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                :disabled="idx === displayLayers.length - 1"
                :aria-label="`Move ${layerId} layer down`"
                class="h-6 w-6 text-muted-foreground hover:text-foreground transition-[color,transform] duration-100 ease-out active:scale-[0.96]"
                @click="moveLayer(layerId, 'down')"
              >
                <FontAwesomeIcon :icon="faArrowDown" class="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                :aria-label="`Toggle ${layerId} visibility`"
                class="h-6 w-6 text-muted-foreground hover:text-foreground transition-[color,transform] duration-100 ease-out active:scale-[0.96]"
                @click="toggleLayerVisibility(layerId)"
              >
                <FontAwesomeIcon
                  v-if="store.selectedEntry.layerVisibility[layerId]"
                  :icon="faEye"
                  class="h-3.5 w-3.5"
                />
                <FontAwesomeIcon
                  v-else
                  :icon="faEyeSlash"
                  class="h-3.5 w-3.5 text-muted-foreground/60"
                />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                :aria-expanded="expandedLayer === layerId"
                :aria-label="`Customize ${layerId} layer`"
                class="h-6 w-6 text-muted-foreground hover:text-foreground transition-[color,transform] duration-100 ease-out active:scale-[0.96]"
                @click="expandedLayer = expandedLayer === layerId ? null : layerId"
              >
                <FontAwesomeIcon
                  :icon="faChevronDown"
                  :class="[
                    'h-3.5 w-3.5 transition-transform duration-150',
                    expandedLayer === layerId ? 'rotate-180 text-foreground' : '',
                  ]"
                />
              </Button>
            </div>
          </div>

          <!-- Inline Layer Customization Drawer -->
          <div
            v-if="expandedLayer === layerId"
            class="space-y-2.5 border-t border-border/40 bg-muted px-3 py-2.5"
          >
            <!-- Opacity Slider -->
            <div class="grid grid-cols-[64px_1fr_36px] items-center gap-2">
              <Label class="text-[10px] text-muted-foreground">Opacity</Label>
              <Slider
                :model-value="[getStyleFor(store.selectedEntry, layerId).opacity]"
                :min="0"
                :max="100"
                :step="5"
                :aria-label="`${layerId} layer opacity`"
                @update:model-value="
                  (vals) => {
                    const v = vals?.[0];
                    if (v !== undefined) updateLayerStyle(layerId, { opacity: v });
                  }
                "
              />
              <span class="text-right font-mono text-[10px] text-foreground tabular-nums">
                {{ getStyleFor(store.selectedEntry, layerId).opacity }}%
              </span>
            </div>

            <!-- X / Y Pixel Nudge Offset -->
            <div class="grid grid-cols-[64px_1fr] items-center gap-2">
              <span class="text-[10px] text-muted-foreground">Offset X/Y</span>
              <div class="grid grid-cols-2 gap-1.5">
                <div class="flex items-center gap-1">
                  <Label :for="`layer-ox-${layerId}`" class="font-mono text-[10px] text-muted-foreground">X</Label>
                  <Input
                    :id="`layer-ox-${layerId}`"
                    type="number"
                    :min="-8"
                    :max="8"
                    :model-value="getStyleFor(store.selectedEntry, layerId).offsetX"
                    class="h-6 bg-muted px-1.5 font-mono text-[11px] tabular-nums"
                    @update:model-value="
                      updateLayerStyle(layerId, {
                        offsetX: Math.max(-8, Math.min(8, Number.parseInt(String($event ?? '0'), 10) || 0)),
                      })
                    "
                  />
                </div>
                <div class="flex items-center gap-1">
                  <Label :for="`layer-oy-${layerId}`" class="font-mono text-[10px] text-muted-foreground">Y</Label>
                  <Input
                    :id="`layer-oy-${layerId}`"
                    type="number"
                    :min="-8"
                    :max="8"
                    :model-value="getStyleFor(store.selectedEntry, layerId).offsetY"
                    class="h-6 bg-muted px-1.5 font-mono text-[11px] tabular-nums"
                    @update:model-value="
                      updateLayerStyle(layerId, {
                        offsetY: Math.max(-8, Math.min(8, Number.parseInt(String($event ?? '0'), 10) || 0)),
                      })
                    "
                  />
                </div>
              </div>
            </div>

            <!-- Layer-specific quick color customization + click-to-copy -->
            <template v-if="store.selectedEntry.sourceMode === 'composer'">
              <div
                v-if="layerId === 'text' || layerId === 'shadow' || layerId === 'icon'"
                class="flex items-center justify-between gap-2 rounded-sm bg-muted px-2 py-1"
              >
                <span class="text-[10px] text-muted-foreground">Color</span>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    class="inline-flex cursor-pointer items-center gap-1 rounded bg-card px-1.5 py-0.5 font-mono text-[10px] text-foreground hover:bg-accent transition-transform duration-100 ease-out active:scale-[0.96]"
                    @click="
                      copyColor(
                        layerId,
                        layerId === 'text'
                          ? store.selectedEntry.composer.textColor
                          : layerId === 'shadow'
                            ? store.selectedEntry.composer.shadowColor
                            : store.selectedEntry.composer.iconColor,
                      )
                    "
                  >
                    <FontAwesomeIcon v-if="copiedLayerColor === layerId" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
                    <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
                    <span>
                      {{
                        (layerId === 'text'
                          ? store.selectedEntry.composer.textColor
                          : layerId === 'shadow'
                            ? store.selectedEntry.composer.shadowColor
                            : store.selectedEntry.composer.iconColor
                        ).toUpperCase()
                      }}
                    </span>
                  </button>
                  <input
                    type="color"
                    :aria-label="`Change ${layerId} color`"
                    :value="
                      layerId === 'text'
                        ? store.selectedEntry.composer.textColor
                        : layerId === 'shadow'
                          ? store.selectedEntry.composer.shadowColor
                          : store.selectedEntry.composer.iconColor
                    "
                    class="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
                    @input="
                      updateBitmap((prev) => ({
                        ...prev,
                        composer: {
                          ...prev.composer,
                          ...(layerId === 'text'
                            ? { textColor: ($event.target as HTMLInputElement).value }
                            : layerId === 'shadow'
                              ? { shadowColor: ($event.target as HTMLInputElement).value }
                              : { iconColor: ($event.target as HTMLInputElement).value }),
                        },
                      }))
                    "
                  />
                </div>
              </div>

              <div
                v-else-if="layerId === 'frame'"
                class="grid grid-cols-2 gap-1.5"
              >
                <div class="flex items-center justify-between gap-1 rounded-sm bg-muted px-2 py-1">
                  <span class="text-[10px] text-muted-foreground">Fill</span>
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      title="Click to copy HEX color"
                      class="inline-flex cursor-pointer items-center gap-1 rounded bg-card px-1.5 py-0.5 font-mono text-[10px] text-foreground hover:bg-accent transition-transform duration-100 ease-out active:scale-[0.96]"
                      @click="copyColor('frame-fill', store.selectedEntry.composer.frameColor)"
                    >
                      <FontAwesomeIcon v-if="copiedLayerColor === 'frame-fill'" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
                      <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
                      <span>{{ store.selectedEntry.composer.frameColor.toUpperCase() }}</span>
                    </button>
                    <input
                      type="color"
                      aria-label="Frame fill color"
                      :value="store.selectedEntry.composer.frameColor"
                      class="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
                      @input="
                        updateBitmap((prev) => ({
                          ...prev,
                          composer: {
                            ...prev.composer,
                            frameColor: ($event.target as HTMLInputElement).value,
                          },
                        }))
                      "
                    />
                  </div>
                </div>
                <div class="flex items-center justify-between gap-1 rounded-sm bg-muted px-2 py-1">
                  <span class="text-[10px] text-muted-foreground">Edge</span>
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      title="Click to copy HEX color"
                      class="inline-flex cursor-pointer items-center gap-1 rounded bg-card px-1.5 py-0.5 font-mono text-[10px] text-foreground hover:bg-accent transition-transform duration-100 ease-out active:scale-[0.96]"
                      @click="copyColor('frame-edge', store.selectedEntry.composer.frameBorderColor)"
                    >
                      <FontAwesomeIcon v-if="copiedLayerColor === 'frame-edge'" :icon="faCheck" class="h-2.5 w-2.5 text-emerald-400" />
                      <FontAwesomeIcon v-else :icon="faCopy" class="h-2.5 w-2.5 text-muted-foreground" />
                      <span>{{ store.selectedEntry.composer.frameBorderColor.toUpperCase() }}</span>
                    </button>
                    <input
                      type="color"
                      aria-label="Frame border color"
                      :value="store.selectedEntry.composer.frameBorderColor"
                      class="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
                      @input="
                        updateBitmap((prev) => ({
                          ...prev,
                          composer: {
                            ...prev.composer,
                            frameBorderColor: ($event.target as HTMLInputElement).value,
                          },
                        }))
                      "
                    />
                  </div>
                </div>
              </div>
            </template>

            <div class="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="h-6 gap-1 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                @click="resetLayerStyle(layerId)"
              >
                <FontAwesomeIcon :icon="faRotateLeft" class="h-3 w-3" />
                <span>Reset Layer</span>
              </Button>
            </div>
          </div>
        </li>
      </ul>

      <div
        v-if="Object.keys(store.selectedEntry.paintEdits).length > 0"
        class="px-3 pt-3"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          class="h-8 w-full justify-center gap-1.5 text-xs text-destructive hover:bg-destructive/20 hover:text-destructive"
          @click="updateBitmap((prev) => ({ ...prev, paintEdits: {} }))"
        >
          <FontAwesomeIcon :icon="faTrashCan" class="h-3.5 w-3.5" />
          <span>
            Clear {{ Object.keys(store.selectedEntry.paintEdits).length }} Paint Edits
          </span>
        </Button>
      </div>
    </template>
  </div>
</template>
