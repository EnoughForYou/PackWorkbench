<script setup lang="ts">
import { computed, ref } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faChevronDown,
  faGripLinesVertical,
  faImage,
  faPlus,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import {
  resolveBitmapEntryRaster,
  type RgbaRaster,
} from '@core/font/pixelSynth.ts';
import { RANK_PRESET_TEMPLATES } from '@core/font/presets.ts';
import { formatCodepointHex } from '@core/font/puaAllocator.ts';
import type { FontProjectEntry } from '@core/font/types.ts';
import { useWorkbenchStore } from '@/stores/workbenchStore';
import PixelPreviewCanvas from '@/components/shared/PixelPreviewCanvas.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const store = useWorkbenchStore();
const pngInputRef = ref<HTMLInputElement | null>(null);
const filterQuery = ref('');

const filteredEntries = computed(() => {
  const q = filterQuery.value.trim().toLowerCase();
  if (!q) return store.fontProject.entries;
  return store.fontProject.entries.filter((entry) => {
    const labelMatch = entry.label.toLowerCase().includes(q);
    const cpBadge = getEntryCodepointBadge(entry).toLowerCase();
    return labelMatch || cpBadge.includes(q);
  });
});

function getEntryCodepointBadge(entry: FontProjectEntry): string {
  if (entry.kind === 'space') {
    const cp = entry.char.codePointAt(0);
    return cp !== undefined ? formatCodepointHex(cp) : '—';
  }
  const firstChar = Array.from(entry.chars[0] ?? '')[0];
  const cp = firstChar?.codePointAt(0);
  if (cp === undefined || cp === 0) return 'Kosong';
  const totalCells = entry.chars.reduce((sum, r) => sum + Array.from(r).length, 0);
  return totalCells > 1
    ? `${formatCodepointHex(cp)} ×${totalCells}`
    : formatCodepointHex(cp);
}

function getThumbRaster(entry: FontProjectEntry): RgbaRaster | null {
  if (entry.kind !== 'bitmap') return null;
  return resolveBitmapEntryRaster(entry, store.decodedUploads.get(entry.id));
}

function entryHasError(entryId: string): boolean {
  return store.validation.findings.some(
    (f) => f.entryId === entryId && f.severity === 'ERROR',
  );
}

function entryHasWarn(entryId: string): boolean {
  return store.validation.findings.some(
    (f) => f.entryId === entryId && f.severity === 'WARN',
  );
}

function handlePngChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    store.uploadPngFile(file);
  }
  input.value = '';
}
</script>

<template>
  <aside
    aria-label="Penjelajah rank dan glif"
    class="flex h-full min-h-0 flex-col bg-card"
  >
    <!-- Flat Rail Header -->
    <div class="flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-2">
      <h2 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Rank &amp; Glif
      </h2>
      <Badge variant="secondary" class="h-5 px-1.5 font-mono text-[10px] tabular-nums text-foreground bg-muted border-border">
        {{ store.fontProject.entries.length }}
      </Badge>
    </div>

    <!-- Borderless Quick Action Command Bar -->
    <div class="grid grid-cols-[1.25fr_1fr_1fr] divide-x divide-border border-b border-border bg-card">
      <div class="flex items-stretch">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          class="h-8 flex-1 rounded-none px-1.5 text-[11px] font-medium text-foreground hover:bg-muted/70 hover:text-primary transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.96]"
          @click="store.addRank()"
        >
          <FontAwesomeIcon :icon="faPlus" class="h-3 w-3" />
          <span>Rank</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Pilih templat rank bawaan"
              class="h-8 w-6 rounded-none border-l border-border/50 px-0 text-muted-foreground hover:bg-muted/70 hover:text-primary transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.96]"
            >
              <FontAwesomeIcon :icon="faChevronDown" class="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-48 rounded-md border-border bg-card p-1 shadow-xl">
            <DropdownMenuLabel class="px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Templat Rank
            </DropdownMenuLabel>
            <DropdownMenuSeparator class="bg-border" />
            <DropdownMenuItem
              v-for="tpl in RANK_PRESET_TEMPLATES"
              :key="tpl.id"
              class="flex items-center justify-between rounded-sm px-2 py-1.5 text-xs text-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              @select="store.addRankFromTemplate(tpl.id)"
            >
              <span class="font-mono font-medium">{{ tpl.label }}</span>
              <span
                aria-hidden="true"
                class="h-2.5 w-2.5 rounded-full border border-white/20"
                :style="{ backgroundColor: tpl.composer.iconColor ?? '#9b73be' }"
              />
            </DropdownMenuItem>
            <DropdownMenuSeparator class="bg-border" />
            <DropdownMenuItem
              class="rounded-sm px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              @select="store.addRank()"
            >
              Rank Kosong
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Unggah berkas PNG sprite atau glif"
            class="h-8 rounded-none px-1.5 text-[11px] font-medium text-foreground hover:bg-muted/70 hover:text-primary transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.96]"
            @click="pngInputRef?.click()"
          >
            <FontAwesomeIcon :icon="faImage" class="h-3 w-3" />
            <span>PNG</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" class="text-xs">
          Unggah Berkas PNG
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Tambah penyedia spasi negatif"
            class="h-8 rounded-none px-1.5 text-[11px] font-medium text-foreground hover:bg-muted/70 hover:text-primary transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.96]"
            @click="store.addSpace()"
          >
            <FontAwesomeIcon :icon="faGripLinesVertical" class="h-3 w-3" />
            <span>Spasi</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" class="text-xs">
          Tambah Spasi Negatif
        </TooltipContent>
      </Tooltip>

      <input
        ref="pngInputRef"
        type="file"
        accept="image/png,.png"
        aria-label="Unggah glif atau sprite sheet berkas PNG"
        class="sr-only"
        @change="handlePngChange"
      />
    </div>

    <!-- Compact Search Filter -->
    <div class="border-b border-border bg-card px-2.5 py-1.5">
      <Input
        v-model="filterQuery"
        type="search"
        placeholder="Cari label atau U+E2..."
        aria-label="Saring entri glif atau codepoint"
        class="h-7 rounded-sm border-border bg-muted/80 px-2 font-mono text-[11px] placeholder:text-muted-foreground focus-visible:border-primary"
      />
    </div>

    <!-- Flat Scrollable List -->
    <ScrollArea class="min-h-0 flex-1 bg-card">
      <ul class="divide-y divide-border/40 py-0.5">
        <li v-for="entry in filteredEntries" :key="entry.id">
          <div
            :class="[
              'group relative flex items-center gap-2 border-l-2 px-2.5 py-2 transition-colors',
              entry.id === store.selectedEntry?.id
                ? 'border-l-primary bg-muted/90'
                : 'border-l-transparent hover:bg-muted/40',
            ]"
          >
            <HoverCard :open-delay="300">
              <HoverCardTrigger as-child>
                <button
                  type="button"
                  :aria-current="entry.id === store.selectedEntry?.id ? 'true' : undefined"
                  class="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] transition-transform duration-100 ease-out"
                  @click="store.selectedStudioEntryId = entry.id"
                >
                  <div class="pixel-checkerboard sprite-preview-outline flex h-7 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-white/10 p-0.5">
                    <span
                      v-if="entry.kind === 'space'"
                      class="font-mono text-[10px] font-semibold text-foreground tabular-nums"
                    >
                      {{ entry.advance > 0 ? `+${entry.advance}` : entry.advance }}
                    </span>
                    <PixelPreviewCanvas
                      v-else-if="getThumbRaster(entry)"
                      :raster="getThumbRaster(entry)"
                      :zoom="1"
                      :aria-label="`Thumbnail ${entry.label}`"
                      class-name="max-h-full max-w-full object-contain"
                    />
                    <span v-else class="font-mono text-[10px] text-destructive">PNG!</span>
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-1.5">
                      <span class="truncate font-mono text-xs font-medium text-foreground">
                        {{ entry.label }}
                      </span>
                      <span
                        v-if="entryHasError(entry.id)"
                        title="Memiliki kesalahan validasi (ERROR)"
                        class="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive"
                      />
                      <span
                        v-else-if="entryHasWarn(entry.id)"
                        title="Memiliki peringatan validasi (WARN)"
                        class="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
                      />
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="truncate font-mono text-[10px] text-muted-foreground tabular-nums">
                        {{ getEntryCodepointBadge(entry) }}
                      </span>
                      <span
                        v-if="entry.kind === 'bitmap' && entry.composer.badgeLayout === 'split-left'"
                        class="rounded bg-primary/10 border border-primary/20 px-1 font-mono text-[9px] text-primary"
                      >
                        Pisah
                      </span>
                    </div>
                  </div>
                </button>
              </HoverCardTrigger>
              <HoverCardContent side="right" class="w-60 space-y-2 border-[#3a3d54] bg-[#1a1b26]/98 p-3 shadow-2xl">
                <div class="flex items-center justify-between border-b border-border/60 pb-1.5">
                  <span class="font-mono text-xs font-bold text-foreground">{{ entry.label }}</span>
                  <Badge variant="outline" class="font-mono text-[10px] text-primary border-primary/30">
                    {{ getEntryCodepointBadge(entry) }}
                  </Badge>
                </div>
                <div v-if="getThumbRaster(entry)" class="pixel-checkerboard flex h-20 items-center justify-center rounded border border-border/50 p-2">
                  <PixelPreviewCanvas
                    :raster="getThumbRaster(entry)"
                    :zoom="3"
                    :aria-label="`Pratinjau ${entry.label}`"
                    class-name="max-h-full max-w-full object-contain"
                  />
                </div>
                <div class="space-y-1 font-mono text-[10px] text-muted-foreground tabular-nums">
                  <div class="flex justify-between">
                    <span>Dimensi:</span>
                    <span class="text-foreground">
                      {{
                        entry.kind === 'bitmap'
                          ? (getThumbRaster(entry) ? `${getThumbRaster(entry)!.width}×${getThumbRaster(entry)!.height} px` : `${entry.height} px`)
                          : 'Penyedia Spasi'
                      }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span>Lebar Maju:</span>
                    <span class="text-sky-400">
                      {{ entry.kind === 'space' ? `${entry.advance} px` : `${(getThumbRaster(entry)?.width ?? 0) + 1} px` }}
                    </span>
                  </div>
                  <div v-if="entry.kind === 'bitmap'" class="flex justify-between">
                    <span>Ascent:</span>
                    <span class="text-emerald-400">{{ entry.ascent }} px</span>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>

            <Tooltip v-if="store.fontProject.entries.length > 1">
              <TooltipTrigger as-child>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  :aria-label="`Hapus entri ${entry.label}`"
                  class="h-6 w-6 shrink-0 rounded-sm text-muted-foreground opacity-60 hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100 transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.96]"
                  @click="store.removeEntry(entry.id)"
                >
                  <FontAwesomeIcon :icon="faTrashCan" class="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" class="text-xs">
                Hapus {{ entry.label }}
              </TooltipContent>
            </Tooltip>
          </div>
        </li>
      </ul>
    </ScrollArea>
  </aside>
</template>
