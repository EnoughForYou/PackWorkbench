<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faBook,
  faCircleQuestion,
  faDownload,
  faFileZipper,
  faKeyboard,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { VERSION_PROFILES } from '@core/versions.ts';
import type { TargetVersionId } from '@core/types.ts';
import { useWorkbenchStore, type StudioMode } from '@/stores/workbenchStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

definePageMeta({
  layout: 'studio',
});

useHead({
  title: 'Studio: Pack Workbench',
});

const store = useWorkbenchStore();
const route = useRoute();

const exportDialogOpen = ref(false);
const exportPackName = ref('Pack Workbench Rank');
const exportPackDesc = ref('Resource pack font bitmap Minecraft Java');

const isExportValid = computed(() => {
  return exportPackName.value.trim().length > 0 && store.validation.errors === 0;
});

const activeVersionProfile = computed(() => {
  return (
    VERSION_PROFILES.find((v) => v.id === store.fontProject.targetVersion) ??
    VERSION_PROFILES[0]
  );
});

watch(
  () => route.query.mode,
  (mode) => {
    if (mode === 'validator') {
      store.studioMode = 'validator';
    } else if (mode === 'font') {
      store.studioMode = 'font';
    }
  },
  { immediate: true },
);

function setMode(val: unknown): void {
  if (val !== 'font' && val !== 'validator') return;
  const mode = val as StudioMode;
  store.studioMode = mode;
  void navigateTo({ query: { ...route.query, mode } }, { replace: true });
}

function handleFontVersionChange(val: unknown): void {
  if (typeof val === 'string') {
    store.updateProject((prev) => ({
      ...prev,
      targetVersion: val as TargetVersionId,
    }));
  }
}

function handleValidatorVersionChange(val: unknown): void {
  if (typeof val === 'string') {
    store.handleVersionChange(val as TargetVersionId);
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

function handleStudioKeyDown(event: KeyboardEvent): void {
  if (store.studioMode !== 'font' || isEditableTarget(event.target)) return;
  const key = event.key.toLowerCase();

  if ((event.ctrlKey || event.metaKey) && (key === 'y' || (key === 'z' && event.shiftKey))) {
    event.preventDefault();
    store.redoPaint();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && key === 'z') {
    event.preventDefault();
    store.undoPaint();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && (key === '0' || key === '1')) {
    event.preventDefault();
    store.zoom = key === '0' ? 12 : 2;
    return;
  }
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  if (key === 'v') {
    store.activeTool = 'select';
  } else if (key === 'b') {
    store.activeTool = 'pencil';
  } else if (key === 'e') {
    store.activeTool = 'eraser';
  } else if (key === 'i') {
    store.activeTool = 'eyedropper';
  } else if (key === 'g') {
    store.showGrid = !store.showGrid;
  } else if (key === '=' || key === '+') {
    store.zoom = Math.min(24, store.zoom + 2);
  } else if (key === '-') {
    store.zoom = Math.max(2, store.zoom - 2);
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleStudioKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleStudioKeyDown);
});
</script>

<template>
  <div class="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
    <!-- Pure Desktop IDE Top Toolbar -->
    <header class="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3 py-1">
      <!-- Left: Brand + Mode ToggleGroup -->
      <div class="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger as-child>
            <NuxtLink
              to="/"
              title="Kembali ke Beranda"
              aria-label="Kembali ke Beranda"
              class="flex shrink-0 items-center gap-2 rounded px-1.5 py-1 transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span
                aria-hidden="true"
                class="flex h-6 w-6 items-center justify-center rounded border border-primary/40 bg-muted"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" class="h-3.5 w-3.5 text-primary">
                  <path d="M2 2h4v4H2V2Zm8 0h4v4h-4V2ZM6 6h4v4H6V6Zm-4 4h4v4H2v-4Zm8 0h4v4h-4v-4Z" />
                </svg>
              </span>
              <span class="text-sm font-semibold tracking-tight text-foreground">
                Pack Workbench
              </span>
            </NuxtLink>
          </TooltipTrigger>
          <TooltipContent>
            Kembali ke Beranda
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" class="h-5" />

        <ToggleGroup
          type="single"
          :model-value="store.studioMode"
          aria-label="Pilih mode workspace studio"
          class="h-8 gap-0.5 rounded-md border border-border/70 bg-muted/60 p-0.5"
          @update:model-value="setMode"
        >
          <ToggleGroupItem
            value="font"
            class="h-7 rounded-sm px-2.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:font-semibold data-[state=on]:text-primary-foreground"
          >
            Rank &amp; Glyph
          </ToggleGroupItem>
          <ToggleGroupItem
            value="validator"
            class="h-7 rounded-sm px-2.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:font-semibold data-[state=on]:text-primary-foreground"
          >
            ZIP &amp; SHA-1 Validator
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <!-- Right: Active Project Metadata + Shortcuts & Export Dialog -->
      <div class="flex items-center gap-2">
        <template v-if="store.studioMode === 'font'">
          <div class="flex items-center gap-1.5">
            <Label for="studio-ns-input" class="font-mono text-xs font-medium text-muted-foreground">
              ns:
            </Label>
            <Input
              id="studio-ns-input"
              type="text"
              :model-value="store.fontProject.namespace"
              class="h-8 w-28 rounded-md border border-border/70 bg-muted/60 px-2.5 font-mono text-xs tabular-nums text-foreground transition-colors hover:border-border focus:border-primary/80 focus:bg-background"
              placeholder="namespace"
              aria-label="Namespace resource pack"
              @update:model-value="
                store.updateProject((prev) => ({
                  ...prev,
                  namespace: String($event ?? ''),
                }))
              "
            />
          </div>

          <Label for="studio-target-select" class="sr-only">
            Target versi Minecraft Java
          </Label>
          <Select
            :model-value="store.fontProject.targetVersion"
            @update:model-value="handleFontVersionChange"
          >
            <SelectTrigger
              id="studio-target-select"
              class="h-8 w-40 rounded-md border border-border/70 bg-muted/60 font-mono text-xs tabular-nums text-foreground transition-colors hover:border-border hover:bg-muted/80"
              aria-label="Pilih target versi Minecraft Java"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="v in VERSION_PROFILES"
                :key="v.id"
                :value="v.id"
                class="font-mono text-xs tabular-nums"
              >
                {{
                  v.style === 'legacy'
                    ? `${v.id} (${v.format[0]})`
                    : `${v.id} (${v.format[0]}.${v.format[1]})`
                }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- Keyboard Shortcuts Dialog -->
          <Dialog>
            <DialogTrigger as-child>
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8 rounded-md border-border/70 bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                aria-label="Buka panduan pintasan keyboard"
              >
                <FontAwesomeIcon :icon="faKeyboard" class="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent class="sm:max-w-md">
              <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                  <FontAwesomeIcon :icon="faKeyboard" class="h-4 w-4 text-primary" />
                  <span>Pintasan Keyboard Studio</span>
                </DialogTitle>
                <DialogDescription>
                  Gunakan pintasan keyboard untuk mempercepat proses menggambar piksel dan navigasi kanvas.
                </DialogDescription>
              </DialogHeader>
              <div class="space-y-2 py-2">
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="flex items-center justify-between rounded border border-border bg-[#14151e] p-2 font-mono">
                    <span class="text-muted-foreground">Pilih (Select)</span>
                    <kbd class="rounded bg-muted px-1.5 py-0.5 text-foreground">V</kbd>
                  </div>
                  <div class="flex items-center justify-between rounded border border-border bg-[#14151e] p-2 font-mono">
                    <span class="text-muted-foreground">Pensil Piksel</span>
                    <kbd class="rounded bg-muted px-1.5 py-0.5 text-foreground">B</kbd>
                  </div>
                  <div class="flex items-center justify-between rounded border border-border bg-[#14151e] p-2 font-mono">
                    <span class="text-muted-foreground">Penghapus</span>
                    <kbd class="rounded bg-muted px-1.5 py-0.5 text-foreground">E</kbd>
                  </div>
                  <div class="flex items-center justify-between rounded border border-border bg-[#14151e] p-2 font-mono">
                    <span class="text-muted-foreground">Pipet Warna</span>
                    <kbd class="rounded bg-muted px-1.5 py-0.5 text-foreground">I</kbd>
                  </div>
                  <div class="flex items-center justify-between rounded border border-border bg-[#14151e] p-2 font-mono">
                    <span class="text-muted-foreground">Kisi Piksel</span>
                    <kbd class="rounded bg-muted px-1.5 py-0.5 text-foreground">G</kbd>
                  </div>
                  <div class="flex items-center justify-between rounded border border-border bg-[#14151e] p-2 font-mono">
                    <span class="text-muted-foreground">Zoom +/-</span>
                    <kbd class="rounded bg-muted px-1.5 py-0.5 text-foreground">+ / -</kbd>
                  </div>
                  <div class="flex items-center justify-between rounded border border-border bg-[#14151e] p-2 font-mono">
                    <span class="text-muted-foreground">Urungkan (Undo)</span>
                    <kbd class="rounded bg-muted px-1.5 py-0.5 text-foreground">Ctrl+Z</kbd>
                  </div>
                  <div class="flex items-center justify-between rounded border border-border bg-[#14151e] p-2 font-mono">
                    <span class="text-muted-foreground">Ulangi (Redo)</span>
                    <kbd class="rounded bg-muted px-1.5 py-0.5 text-foreground">Ctrl+Y</kbd>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <!-- Minecraft Version Guide Dialog (from docs/knowledge) -->
          <Dialog>
            <DialogTrigger as-child>
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8 rounded-md border-border/70 bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                aria-label="Buka panduan spesifikasi versi Minecraft"
              >
                <FontAwesomeIcon :icon="faBook" class="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent class="max-w-xl">
              <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                  <FontAwesomeIcon :icon="faBook" class="h-4 w-4 text-primary" />
                  <span>Panduan Spesifikasi Versi Minecraft</span>
                </DialogTitle>
                <DialogDescription>
                  Ringkasan aturan resmi pack_format, data format, dan sintaks pack.mcmeta (1.21.1 – 26.3) berdasarkan dokumentasi teknis Mojang.
                </DialogDescription>
              </DialogHeader>
              <div class="max-h-[60vh] space-y-3 overflow-y-auto pr-1 text-xs">
                <!-- Active target info banner -->
                <div class="rounded-md border border-primary/30 bg-primary/10 p-3">
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-foreground">Target Aktif Saat Ini:</span>
                    <Badge variant="outline" class="font-mono text-primary">
                      {{ activeVersionProfile?.label }}
                    </Badge>
                  </div>
                  <p class="mt-1 text-[11px] text-muted-foreground">
                    Format: <span class="font-mono text-foreground">{{ activeVersionProfile?.style === 'legacy' ? `pack_format: ${activeVersionProfile.format[0]}` : `min_format: [${activeVersionProfile?.format[0]}, ${activeVersionProfile?.format[1]}]` }}</span>
                    · Skema: <span class="font-mono text-foreground">{{ activeVersionProfile?.style === 'legacy' ? 'Legacy (Integer Tunggal)' : 'Modern Range (Rentang Minor)' }}</span>
                  </p>
                </div>

                <!-- Version Master Matrix -->
                <div class="space-y-1.5">
                  <span class="font-semibold text-foreground">Matriks Kronologi Versi (1.21.1 – 26.3):</span>
                  <div class="space-y-1 rounded border border-border bg-[#14151e] p-2 font-mono text-[11px]">
                    <div
                      v-for="v in VERSION_PROFILES"
                      :key="v.id"
                      class="flex items-center justify-between border-b border-border/40 py-1 last:border-b-0"
                      :class="{ 'text-primary font-bold': v.id === store.fontProject.targetVersion }"
                    >
                      <span class="truncate">{{ v.id }} ({{ v.format[0] }}{{ v.format[1] > 0 ? `.${v.format[1]}` : '' }})</span>
                      <span class="text-[10px] text-muted-foreground">
                        {{ v.style === 'legacy' ? 'Legacy' : 'Range min/max' }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Key architectural notes -->
                <div class="space-y-1.5 text-[11px] text-muted-foreground">
                  <p><strong class="text-foreground">1.21.4:</strong> Transisi masif sistem item model ke <code class="text-primary">assets/&lt;ns&gt;/items/*.json</code> dan CustomModelData 4-list.</p>
                  <p><strong class="text-foreground">1.21.8:</strong> Batas format tunggal (<code class="text-primary">lastPreMinorVersion = 64</code>). Versi di atasnya wajib menggunakan rentang.</p>
                  <p><strong class="text-foreground">1.21.9+:</strong> Awal format minor (<code class="text-primary">min_format</code> &amp; <code class="text-primary">max_format</code>). Field <code class="text-destructive">supported_formats</code> dilarang jika format mayor &gt; 64.</p>
                  <p><strong class="text-foreground">1.21.11:</strong> Pemisahan atlas <code class="text-primary">items.json</code> dan <code class="text-primary">celestials.json</code> dari <code class="text-primary">blocks.json</code>.</p>
                  <p><strong class="text-foreground">26.1+:</strong> Migrasi ke runtime Java 25 dan jar un-obfuscated resmi Mojang.</p>
                  <p><strong class="text-foreground">26.3:</strong> Format minor non-nol pertama (<code class="text-primary">[97, 1]</code>) dan relokasi armor trim ke <code class="text-primary">textures/palettes/trim/</code>.</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Tooltip>
            <TooltipTrigger as-child>
              <Badge
                variant="outline"
                class="h-8 cursor-default gap-1.5 rounded-md border-border/70 bg-muted/40 px-2.5 font-mono text-xs tabular-nums text-muted-foreground"
              >
                <FontAwesomeIcon :icon="faShieldHalved" class="h-3 w-3 text-emerald-400" />
                <span>Lokal</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Seluruh pemrosesan ZIP, PNG, dan SHA-1 berjalan 100% lokal di browser tanpa pengunggahan berkas.
            </TooltipContent>
          </Tooltip>

          <!-- Export Pack Dialog -->
          <Dialog v-model:open="exportDialogOpen">
            <DialogTrigger as-child>
              <Button
                type="button"
                :disabled="store.validation.errors > 0 || store.isExporting"
                class="h-8 min-h-8 gap-1.5 rounded-md border border-primary/40 bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-150 ease-out hover:bg-[#a882cb] active:scale-[0.98] disabled:opacity-50"
              >
                <FontAwesomeIcon :icon="faFileZipper" class="h-3.5 w-3.5" />
                <span class="font-mono tabular-nums">
                  {{
                    store.isExporting
                      ? 'Menyusun...'
                      : store.validation.errors > 0
                        ? `${store.validation.errors} Error`
                        : 'Ekspor Pack'
                  }}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent class="sm:max-w-md">
              <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                  <FontAwesomeIcon :icon="faDownload" class="h-4 w-4 text-primary" />
                  <span>Ekspor Resource Pack Minecraft</span>
                </DialogTitle>
                <DialogDescription>
                  Susun seluruh font bitmap, file pack.mcmeta, dan struktur arsip .zip siap pasang di Minecraft Java.
                </DialogDescription>
              </DialogHeader>
              <div class="space-y-3 py-2 text-xs">
                <div class="space-y-1">
                  <Label for="export-pack-name" class="font-medium">Nama Paket Resource</Label>
                  <Input
                    id="export-pack-name"
                    v-model="exportPackName"
                    class="h-8 bg-muted font-medium"
                    placeholder="Contoh: Server Rank Pack"
                  />
                </div>
                <div class="space-y-1">
                  <Label for="export-pack-desc" class="font-medium">Deskripsi (pack.mcmeta)</Label>
                  <Input
                    id="export-pack-desc"
                    v-model="exportPackDesc"
                    class="h-8 bg-muted"
                    placeholder="Deskripsi berkas pack"
                  />
                </div>
                <div class="rounded border border-border bg-[#14151e] p-2.5 font-mono text-[11px] space-y-1">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Target Java:</span>
                    <span class="text-foreground">{{ store.fontProject.targetVersion }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Format Mcmeta:</span>
                    <span class="text-amber-400">
                      {{
                        activeVersionProfile?.style === 'legacy'
                          ? `pack_format: ${activeVersionProfile.format[0]}`
                          : `min_format: [${activeVersionProfile?.format[0]}, ${activeVersionProfile?.format[1]}]`
                      }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Namespace:</span>
                    <span class="text-primary">{{ store.fontProject.namespace }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Total Glif:</span>
                    <span class="text-emerald-400">{{ store.fontProject.entries.length }} Entri</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="exportDialogOpen = false"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  :disabled="!isExportValid || store.isExporting"
                  class="gap-1.5 font-bold"
                  @click="
                    exportDialogOpen = false;
                    store.exportAndDownload();
                  "
                >
                  <FontAwesomeIcon :icon="faDownload" class="h-3 w-3" />
                  <span>Unduh .ZIP</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </template>

        <template v-else>
          <Label for="validator-top-version-select" class="sr-only">
            Validator target version
          </Label>
          <Select
            :model-value="store.selectedVersion"
            @update:model-value="handleValidatorVersionChange"
          >
            <SelectTrigger
              id="validator-top-version-select"
              class="h-8 w-40 rounded-md border border-border/70 bg-muted/60 font-mono text-xs tabular-nums text-foreground transition-colors hover:border-border hover:bg-muted/80"
              aria-label="Pilih versi target validator"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="v in VERSION_PROFILES"
                :key="v.id"
                :value="v.id"
                class="font-mono text-xs tabular-nums"
              >
                {{
                  v.style === 'legacy'
                    ? `${v.id} (${v.format[0]})`
                    : `${v.id} (${v.format[0]}.${v.format[1]})`
                }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Badge
            variant="outline"
            class="h-8 rounded-md border-border/70 bg-muted/40 px-2.5 font-mono text-xs tabular-nums text-muted-foreground"
          >
            Lokal · SHA-1 Worker
          </Badge>
        </template>
      </div>
    </header>

    <LazyStudioWorkspace v-if="store.studioMode === 'font'" />
    <LazyValidatorWorkspace v-else />
  </div>
</template>
