<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faArrowRight,
  faChevronDown,
  faExpand,
  faImage,
  faPlus,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import type { FontProjectEntry, PreviewContext } from '@core/font/types.ts';
import {
  resolveBitmapEntryRaster,
  type RgbaRaster,
} from '@core/font/pixelSynth.ts';
import {
  useWorkbenchStore,
  type PreviewBackdropMode,
} from '@/stores/workbenchStore';
import { useInGamePreview } from '@/composables/useInGamePreview';
import PixelPreviewCanvas from '@/components/shared/PixelPreviewCanvas.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const store = useWorkbenchStore();
const { snippets, renderInGameStrip } = useInGamePreview();

const livePreviewCanvasRef = ref<HTMLCanvasElement | null>(null);
const customBgInputRef = ref<HTMLInputElement | null>(null);

// Synchronize selectedEntry and preview prefix tokens when switching presets in single-token mode
watch(
  () => store.selectedEntry?.id,
  (newId) => {
    if (!newId) return;
    if (store.fontProject.prefixSequenceIds.length <= 1) {
      if (store.fontProject.prefixSequenceIds[0] !== newId) {
        store.setSoloPrefixEntry(newId);
      }
    }
  },
  { immediate: true },
);

interface ActiveChainToken {
  readonly id: string;
  readonly entry: FontProjectEntry | undefined;
  readonly label: string;
  readonly kind: 'bitmap' | 'space' | 'unknown';
  readonly raster: RgbaRaster | null;
}

const activeChainTokens = computed<readonly ActiveChainToken[]>(() => {
  return store.fontProject.prefixSequenceIds.map((id) => {
    let entry = store.fontProject.entries.find((e) => e.id === id);
    if (!entry && store.selectedEntry?.id === id) {
      entry = store.selectedEntry;
    }
    const raster =
      entry && entry.kind === 'bitmap'
        ? resolveBitmapEntryRaster(entry, store.decodedUploads.get(entry.id))
        : null;
    return {
      id,
      entry,
      label: entry?.label ?? id,
      kind: entry?.kind ?? 'unknown',
      raster,
    };
  });
});

const canAddSelected = computed(() => {
  const entry = store.selectedEntry;
  if (!entry) return false;
  return !store.fontProject.prefixSequenceIds.includes(entry.id);
});

function appendToken(entryId: string): void {
  store.updateProject((prev) => ({
    ...prev,
    prefixSequenceIds: [...prev.prefixSequenceIds, entryId],
  }));
}

function removeTokenAt(index: number): void {
  store.updateProject((prev) => {
    const next = [...prev.prefixSequenceIds];
    next.splice(index, 1);
    return {
      ...prev,
      prefixSequenceIds:
        next.length === 0 && store.selectedEntry
          ? [store.selectedEntry.id]
          : next,
    };
  });
}

function selectToken(entryId: string): void {
  store.selectedStudioEntryId = entryId;
}

watchEffect(() => {
  renderInGameStrip(
    livePreviewCanvasRef.value,
    store.fontProject.previewContext,
    2,
    232,
    'compact',
  );
});

function handleContextChange(val: string | number): void {
  if (val === 'Chat' || val === 'TAB' || val === 'Nametag') {
    store.setPreviewContext(val as PreviewContext);
  }
}

function handleBackdropModeChange(val: unknown): void {
  if (val === 'world' || val === 'solid' || val === 'custom') {
    store.setPreviewBackdropMode(val as PreviewBackdropMode);
  }
}

function onCustomBgSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    store.setCustomBackdropFile(file);
  }
  input.value = '';
}
</script>

<template>
  <div class="shrink-0 border-b border-border bg-card">
    <div class="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-1.5">
      <Tabs
        :model-value="store.fontProject.previewContext"
        class="gap-0"
        @update:model-value="handleContextChange"
      >
        <TabsList class="h-7 gap-1 bg-transparent p-0">
          <TabsTrigger
            value="Chat"
            class="relative h-7 flex-none rounded-none border-0 bg-transparent px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
          >
            Obrolan
          </TabsTrigger>
          <TabsTrigger
            value="TAB"
            class="relative h-7 flex-none rounded-none border-0 bg-transparent px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
          >
            TAB
          </TabsTrigger>
          <TabsTrigger
            value="Nametag"
            class="relative h-7 flex-none rounded-none border-0 bg-transparent px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
          >
            Nametag
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div class="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Buka pratinjau in-game di panggung utama"
              class="h-6 w-6 rounded-sm text-muted-foreground hover:text-foreground transition-[color,transform] duration-100 ease-out active:scale-[0.96]"
              @click="store.stageMode = 'preview'"
            >
              <FontAwesomeIcon :icon="faExpand" class="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" class="text-xs">
            Buka Tampilan Penuh In-Game
          </TooltipContent>
        </Tooltip>
      </div>
    </div>

    <div class="space-y-2 px-3 py-2.5">
      <!-- Live Preview Canvas -->
      <div class="sprite-preview-outline flex items-center justify-center overflow-hidden rounded-md border border-border/80 bg-background">
        <canvas
          ref="livePreviewCanvasRef"
          role="img"
          :aria-label="`Pratinjau langsung ${store.fontProject.previewContext}`"
          class="pixelated-canvas block h-auto w-full"
        />
      </div>

      <!-- Quick sample text input -->
      <div class="flex items-center gap-1.5">
        <Label for="quick-sample-chat" class="sr-only">
          Teks sampel obrolan atau nametag
        </Label>
        <Input
          id="quick-sample-chat"
          type="text"
          :model-value="store.fontProject.sampleChatText"
          placeholder="P0TAT0D0G: Halo, selamat datang di studio!"
          class="h-6 rounded-sm border-border/70 bg-muted/80 px-2 font-mono text-[10px] text-foreground"
          @update:model-value="store.setSampleChatText(String($event ?? ''))"
        />
      </div>

      <!-- Backdrop Controls Bar -->
      <div class="flex items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground tabular-nums">
        <div class="flex items-center gap-1">
          <span class="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Latar:</span>
          <ToggleGroup
            type="single"
            :model-value="store.previewBackdropMode"
            aria-label="Mode latar belakang pratinjau"
            class="gap-0.5 rounded-sm border border-border bg-muted/60 p-0.5"
            @update:model-value="handleBackdropModeChange"
          >
            <ToggleGroupItem
              value="world"
              class="h-5 rounded-xs px-1.5 text-[9px] data-[state=on]:bg-card data-[state=on]:text-foreground"
            >
              Dunia
            </ToggleGroupItem>
            <ToggleGroupItem
              value="solid"
              class="h-5 rounded-xs px-1.5 text-[9px] data-[state=on]:bg-card data-[state=on]:text-foreground"
            >
              Solid
            </ToggleGroupItem>
            <ToggleGroupItem
              v-if="store.customBackdropUrl"
              value="custom"
              class="h-5 rounded-xs px-1.5 text-[9px] data-[state=on]:bg-card data-[state=on]:text-foreground"
            >
              Foto
            </ToggleGroupItem>
          </ToggleGroup>

          <input
            ref="customBgInputRef"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="sr-only"
            aria-label="Pilih berkas gambar latar lokal"
            @change="onCustomBgSelected"
          />
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Unggah screenshot latar lokal dari perangkat"
                class="h-5 w-5 rounded-xs text-muted-foreground hover:text-foreground transition-[color,transform] duration-100 ease-out active:scale-[0.96]"
                @click="customBgInputRef?.click()"
              >
                <FontAwesomeIcon :icon="faImage" class="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" class="text-xs">
              Uji latar screenshot lokal (100% di browser)
            </TooltipContent>
          </Tooltip>

          <Tooltip v-if="store.customBackdropUrl">
            <TooltipTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Hapus screenshot latar kustom"
                class="h-5 w-5 rounded-xs text-muted-foreground hover:text-destructive transition-[color,transform] duration-100 ease-out active:scale-[0.96]"
                @click="store.clearCustomBackdropFile()"
              >
                <FontAwesomeIcon :icon="faXmark" class="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" class="text-xs">
              Hapus latar kustom
            </TooltipContent>
          </Tooltip>
        </div>

        <div class="flex min-w-0 items-center gap-1 font-mono text-[9px]">
          <span class="text-muted-foreground">PUA:</span>
          <span class="truncate text-primary" :title="snippets.prefixEscaped">
            {{ snippets.prefixEscaped || '—' }}
          </span>
        </div>
      </div>

      <!-- Multi-Token Prefix Chain Manager -->
      <div class="space-y-1.5 border-t border-border/60 pt-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <span class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Rantai Prefiks
            </span>
            <Badge
              variant="outline"
              class="h-4 px-1 font-mono text-[9px] tabular-nums border-border bg-muted/60 text-muted-foreground"
            >
              {{ store.fontProject.prefixSequenceIds.length }}
            </Badge>
          </div>

          <div class="flex items-center gap-1">
            <Button
              v-if="canAddSelected && store.selectedEntry"
              type="button"
              variant="outline"
              size="sm"
              class="h-5 gap-1 rounded-xs px-1.5 font-mono text-[9px] text-primary transition-transform active:scale-[0.96]"
              @click="appendToken(store.selectedEntry.id)"
            >
              <FontAwesomeIcon :icon="faPlus" class="h-2.5 w-2.5" />
              <span>+ {{ store.selectedEntry.label }}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Tambah token ke rantai prefiks"
                  class="h-5 gap-1 rounded-xs px-1.5 font-mono text-[9px] text-foreground hover:bg-muted/70 transition-transform active:scale-[0.96]"
                >
                  <FontAwesomeIcon :icon="faPlus" class="h-2.5 w-2.5 text-primary" />
                  <span>Token</span>
                  <FontAwesomeIcon :icon="faChevronDown" class="h-2 w-2 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-48 rounded-md border-border p-1 shadow-xl">
                <DropdownMenuLabel class="px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tambah ke Rantai
                </DropdownMenuLabel>
                <DropdownMenuSeparator class="bg-border" />
                <DropdownMenuItem
                  v-for="entry in store.fontProject.entries"
                  :key="entry.id"
                  class="flex items-center justify-between rounded-sm px-2 py-1 text-xs cursor-pointer hover:bg-muted text-foreground"
                  @select="appendToken(entry.id)"
                >
                  <span class="truncate font-mono text-[11px]">{{ entry.label }}</span>
                  <span class="font-mono text-[9px] text-muted-foreground">
                    {{ entry.kind === 'space' ? `${entry.advance}px` : 'Glif' }}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <!-- Token Chain Horizontal Flow -->
        <div class="flex flex-wrap items-center gap-1 rounded-sm border border-border/70 bg-muted/40 p-1.5">
          <template v-for="(token, idx) in activeChainTokens" :key="token.id + '-' + idx">
            <div
              :class="[
                'group flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] transition-[background-color,border-color]',
                store.selectedEntry?.id === token.id
                  ? 'border-primary/60 bg-primary/10 text-primary'
                  : 'border-border/80 bg-card text-foreground hover:border-border',
              ]"
            >
              <span class="font-mono text-[9px] text-muted-foreground tabular-nums">
                {{ idx + 1 }}
              </span>

              <button
                type="button"
                :title="`Pilih ${token.label} untuk diedit`"
                class="flex cursor-pointer items-center gap-1 text-left font-mono text-[10px] font-medium hover:underline"
                @click="selectToken(token.id)"
              >
                <span
                  v-if="token.kind === 'space'"
                  class="font-mono text-[9px] text-amber-400/90"
                >
                  [{{ token.entry?.kind === 'space' ? `${token.entry.advance}px` : 'Spasi' }}]
                </span>
                <PixelPreviewCanvas
                  v-else-if="token.raster"
                  :raster="token.raster"
                  :zoom="1"
                  :aria-label="token.label"
                  class="inline-block h-3 w-5 shrink-0"
                />
                <span class="max-w-[70px] truncate">{{ token.label }}</span>
              </button>

              <button
                type="button"
                :title="`Hapus ${token.label} dari rantai`"
                aria-label="Hapus token dari rantai"
                class="ml-0.5 inline-flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-[2px] text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors active:scale-90"
                @click="removeTokenAt(idx)"
              >
                <FontAwesomeIcon :icon="faXmark" class="h-2 w-2" />
              </button>
            </div>

            <!-- Arrow separator between tokens -->
            <FontAwesomeIcon
              v-if="idx < activeChainTokens.length - 1"
              :icon="faArrowRight"
              class="h-2 w-2 text-muted-foreground/60 shrink-0"
            />
          </template>

          <span
            v-if="activeChainTokens.length === 0"
            class="py-1 text-[10px] text-muted-foreground italic"
          >
            Tidak ada token dalam rantai prefiks.
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
