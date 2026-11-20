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
            class="tab-underline relative h-7 flex-none rounded-none border-0 bg-transparent px-2 text-[11px] font-medium text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="TAB"
            class="tab-underline relative h-7 flex-none rounded-none border-0 bg-transparent px-2 text-[11px] font-medium text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            TAB
          </TabsTrigger>
          <TabsTrigger
            value="Nametag"
            class="tab-underline relative h-7 flex-none rounded-none border-0 bg-transparent px-2 text-[11px] font-medium text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Third Person
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
              aria-label="Expand in-game preview to center stage"
              class="h-6 w-6 text-muted-foreground hover:text-foreground transition-[color,transform] duration-100 ease-out active:scale-[0.96]"
              @click="store.stageMode = 'preview'"
            >
              <FontAwesomeIcon :icon="faExpand" class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Open Full In-Game View</TooltipContent>
        </Tooltip>
      </div>
    </div>

    <div class="px-3 py-2.5">
      <div class="sprite-preview-outline flex items-center justify-center overflow-hidden border border-border/80 bg-background">
        <canvas
          ref="livePreviewCanvasRef"
          role="img"
          :aria-label="`Live ${store.fontProject.previewContext} preview`"
          class="pixelated-canvas block h-auto w-full"
        />
      </div>

      <div class="mt-2 flex items-center justify-between gap-2">
        <div class="flex min-w-0 flex-1 items-center gap-1.5">
          <Label for="quick-sample-chat" class="sr-only">
            Sample in-game chat or nametag text
          </Label>
          <Input
            id="quick-sample-chat"
            type="text"
            :model-value="store.fontProject.sampleChatText"
            placeholder="P0TAT0D0G: Hi, thanks for using my tools!"
            class="h-6 border-border/70 bg-muted px-2 font-mono text-[10px] text-foreground"
            @update:model-value="store.setSampleChatText(String($event ?? ''))"
          />
        </div>
      </div>

      <div class="mt-1.5 flex items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground tabular-nums">
        <div class="flex items-center gap-1">
          <span>Bg:</span>
          <ToggleGroup
            type="single"
            :model-value="store.previewBackdropMode"
            aria-label="Preview backdrop mode"
            class="gap-0.5"
            @update:model-value="handleBackdropModeChange"
          >
            <ToggleGroupItem
              value="world"
              class="h-5 px-1.5 text-[9px] data-[state=on]:bg-accent data-[state=on]:text-foreground"
            >
              World
            </ToggleGroupItem>
            <ToggleGroupItem
              value="solid"
              class="h-5 px-1.5 text-[9px] data-[state=on]:bg-accent data-[state=on]:text-foreground"
            >
              Solid
            </ToggleGroupItem>
            <ToggleGroupItem
              v-if="store.customBackdropUrl"
              value="custom"
              class="h-5 px-1.5 text-[9px] data-[state=on]:bg-accent data-[state=on]:text-foreground"
            >
              Photo
            </ToggleGroupItem>
          </ToggleGroup>

          <input
            ref="customBgInputRef"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="sr-only"
            aria-label="Choose local backdrop image"
            @change="onCustomBgSelected"
          />
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Upload local screenshot backdrop from device"
                class="h-5 w-5 text-muted-foreground hover:text-foreground transition-[color,transform] duration-100 ease-out active:scale-[0.96]"
                @click="customBgInputRef?.click()"
              >
                <FontAwesomeIcon :icon="faImage" class="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Test local screenshot backdrop (100% in browser)
            </TooltipContent>
          </Tooltip>

          <Button
            v-if="store.customBackdropUrl"
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove custom screenshot backdrop"
            class="h-5 w-5 text-muted-foreground hover:text-destructive transition-[color,transform] duration-100 ease-out active:scale-[0.96]"
            @click="store.clearCustomBackdropFile()"
          >
            <FontAwesomeIcon :icon="faXmark" class="h-3 w-3" />
          </Button>
        </div>

        <div class="flex min-w-0 items-center gap-1.5">
          <button
            v-if="canPreviewSelected && store.selectedEntry"
            type="button"
            class="cursor-pointer rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-medium text-primary hover:bg-primary/20 transition-[background-color,transform] duration-100 ease-out active:scale-[0.96]"
            @click="store.setSoloPrefixEntry(store.selectedEntry.id)"
          >
            Preview {{ store.selectedEntry.label }}
          </button>
          <span class="truncate" :title="`Active prefix: ${activePrefixLabel} (${snippets.prefixEscaped || '—'})`">
            <code class="text-primary">{{ activePrefixLabel }}</code>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
