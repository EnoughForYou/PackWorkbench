<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faExpand, faImage, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { PreviewContext } from '@core/font/types.ts';
import {
  useWorkbenchStore,
  type PreviewBackdropMode,
} from '@/stores/workbenchStore';
import { useInGamePreview } from '@/composables/useInGamePreview';
import { Button } from '@/components/ui/button';
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

const activePrefixLabel = computed(() => {
  const labels = store.fontProject.prefixSequenceIds
    .map((id) => store.fontProject.entries.find((e) => e.id === id)?.label)
    .filter((v): v is string => Boolean(v));
  return labels.length > 0 ? labels.join(' + ') : 'None';
});

const canPreviewSelected = computed(() => {
  const entry = store.selectedEntry;
  if (!entry || entry.kind !== 'bitmap') return false;
  return !store.fontProject.prefixSequenceIds.includes(entry.id);
});

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

    <div class="px-3 py-2.5">
      <div class="sprite-preview-outline flex items-center justify-center overflow-hidden rounded-md border border-border/80 bg-background">
        <canvas
          ref="livePreviewCanvasRef"
          role="img"
          :aria-label="`Pratinjau langsung ${store.fontProject.previewContext}`"
          class="pixelated-canvas block h-auto w-full"
        />
      </div>

      <div class="mt-2 flex items-center justify-between gap-2">
        <div class="flex min-w-0 flex-1 items-center gap-1.5">
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
      </div>

      <div class="mt-1.5 flex items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground tabular-nums">
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

        <div class="flex min-w-0 items-center gap-1.5">
          <button
            v-if="canPreviewSelected && store.selectedEntry"
            type="button"
            class="cursor-pointer rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-medium text-primary hover:bg-primary/20 transition-[background-color,transform] duration-100 ease-out active:scale-[0.96]"
            @click="store.setSoloPrefixEntry(store.selectedEntry.id)"
          >
            Pratinjau {{ store.selectedEntry.label }}
          </button>
          <span class="truncate" :title="`Prefiks aktif: ${activePrefixLabel} (${snippets.prefixEscaped || '—'})`">
            <code class="text-primary font-mono text-[10px]">{{ activePrefixLabel }}</code>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
