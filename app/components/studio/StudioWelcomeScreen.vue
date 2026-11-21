<script setup lang="ts">
import { ref } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faBook,
  faChevronRight,
  faClock,
  faFileCirclePlus,
  faFileCirclePlus as faFilePlus,
  faFileZipper,
  faFolderOpen,
  faShieldHalved,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { RANK_PRESET_TEMPLATES } from '@core/font/presets.ts';
import { VERSION_PROFILES } from '@core/versions.ts';
import {
  useWorkbenchStore,
  type RecentProjectItem,
} from '@/stores/workbenchStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const store = useWorkbenchStore();
const fileInputRef = ref<HTMLInputElement | null>(null);
const docsModalOpen = ref(false);

const QUICK_PRESETS = RANK_PRESET_TEMPLATES.slice(0, 5);

function handleCreateRank(): void {
  store.addRank();
}

function triggerPngUpload(): void {
  fileInputRef.value?.click();
}

function handlePngFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    store.uploadPngFile(file);
  }
  input.value = '';
}

function handleOpenValidator(): void {
  store.studioMode = 'validator';
  void navigateTo({ query: { mode: 'validator' } }, { replace: true });
}

function handleOpenDocs(): void {
  docsModalOpen.value = true;
}

function handleSelectPreset(templateId: string): void {
  store.addRankFromTemplate(templateId);
}

function handleOpenRecent(item: RecentProjectItem): void {
  store.loadRecentProject(item);
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) {
    return 'baru saja';
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m lalu`;
  }
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour}j lalu`;
  }
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) {
    return `${diffDay}h lalu`;
  }
  const date = new Date(timestamp);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];
  return `${date.getDate()} ${months[date.getMonth()] ?? ''}`;
}
</script>

<template>
  <div
    class="flex h-full w-full items-center justify-center overflow-y-auto bg-background p-4 sm:p-6"
    role="region"
    aria-label="Layar selamat datang studio"
  >
    <!-- Hidden PNG input for importing textures -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/png"
      class="sr-only hidden"
      aria-hidden="true"
      tabindex="-1"
      @change="handlePngFileSelected"
    />

    <Card class="w-full max-w-2xl border-border bg-card shadow-2xl">
      <!-- Header -->
      <CardHeader class="border-b border-border/80 pb-4 text-center">
        <div class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-primary/40 bg-muted/80 shadow-inner">
          <svg viewBox="0 0 16 16" fill="currentColor" class="h-5 w-5 text-primary">
            <path d="M2 2h4v4H2V2Zm8 0h4v4h-4V2ZM6 6h4v4H6V6Zm-4 4h4v4H2v-4Zm8 0h4v4h-4v-4Z" />
          </svg>
        </div>
        <CardTitle class="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Pack Workbench Studio
        </CardTitle>
        <CardDescription class="text-xs text-muted-foreground sm:text-sm">
          Penyunting Lencana Peringkat &amp; Glif Font Minecraft Java
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-6 pt-6">
        <!-- 4 Primary Action Buttons (2x2 Grid) -->
        <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <!-- Action 1: Buat Rank Badge -->
          <button
            type="button"
            class="group flex items-start gap-3 rounded-lg border border-border bg-elevated/40 p-3.5 text-left transition-[background-color,border-color,transform] duration-100 ease-out hover:border-primary/50 hover:bg-elevated active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-primary"
            @click="handleCreateRank"
          >
            <span
              aria-hidden="true"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary transition-colors group-hover:border-primary/40 group-hover:bg-primary/10"
            >
              <FontAwesomeIcon :icon="faFilePlus" class="h-4 w-4" />
            </span>
            <div class="min-w-0 flex-1">
              <span class="block text-sm font-semibold text-foreground group-hover:text-primary">
                Buat Rank Badge
              </span>
              <span class="mt-0.5 block text-xs text-muted-foreground">
                Mulai proyek baru dengan kanvas lencana kosong
              </span>
            </div>
          </button>

          <!-- Action 2: Impor PNG -->
          <button
            type="button"
            class="group flex items-start gap-3 rounded-lg border border-border bg-elevated/40 p-3.5 text-left transition-[background-color,border-color,transform] duration-100 ease-out hover:border-primary/50 hover:bg-elevated active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-primary"
            @click="triggerPngUpload"
          >
            <span
              aria-hidden="true"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary transition-colors group-hover:border-primary/40 group-hover:bg-primary/10"
            >
              <FontAwesomeIcon :icon="faUpload" class="h-4 w-4" />
            </span>
            <div class="min-w-0 flex-1">
              <span class="block text-sm font-semibold text-foreground group-hover:text-primary">
                Impor PNG
              </span>
              <span class="mt-0.5 block text-xs text-muted-foreground">
                Muat berkas tekstur gambar untuk glif font
              </span>
            </div>
          </button>

          <!-- Action 3: Buka Validator -->
          <button
            type="button"
            class="group flex items-start gap-3 rounded-lg border border-border bg-elevated/40 p-3.5 text-left transition-[background-color,border-color,transform] duration-100 ease-out hover:border-primary/50 hover:bg-elevated active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-primary"
            @click="handleOpenValidator"
          >
            <span
              aria-hidden="true"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary transition-colors group-hover:border-primary/40 group-hover:bg-primary/10"
            >
              <FontAwesomeIcon :icon="faFileZipper" class="h-4 w-4" />
            </span>
            <div class="min-w-0 flex-1">
              <span class="block text-sm font-semibold text-foreground group-hover:text-primary">
                Buka Validator
              </span>
              <span class="mt-0.5 block text-xs text-muted-foreground">
                Uji integritas berkas ZIP dan hitung SHA-1
              </span>
            </div>
          </button>

          <!-- Action 4: Lihat Docs -->
          <button
            type="button"
            class="group flex items-start gap-3 rounded-lg border border-border bg-elevated/40 p-3.5 text-left transition-[background-color,border-color,transform] duration-100 ease-out hover:border-primary/50 hover:bg-elevated active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-primary"
            @click="handleOpenDocs"
          >
            <span
              aria-hidden="true"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary transition-colors group-hover:border-primary/40 group-hover:bg-primary/10"
            >
              <FontAwesomeIcon :icon="faBook" class="h-4 w-4" />
            </span>
            <div class="min-w-0 flex-1">
              <span class="block text-sm font-semibold text-foreground group-hover:text-primary">
                Lihat Docs
              </span>
              <span class="mt-0.5 block text-xs text-muted-foreground">
                Spesifikasi mcmeta dan aturan versi Minecraft
              </span>
            </div>
          </button>
        </div>

        <!-- Preset Cepat Section -->
        <div class="space-y-2.5">
          <div class="relative flex items-center justify-center">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t border-border" />
            </div>
            <div class="relative bg-card px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              — Preset Cepat —
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-1.5">
            <Button
              v-for="tpl in QUICK_PRESETS"
              :key="tpl.id"
              type="button"
              variant="outline"
              size="sm"
              class="gap-1.5 border-border bg-muted/40 font-mono text-xs font-semibold hover:border-primary/50 hover:bg-muted hover:text-foreground active:scale-[0.96]"
              @click="handleSelectPreset(tpl.id)"
            >
              <span
                aria-hidden="true"
                class="h-2 w-2 rounded-full border border-white/20 shadow-xs"
                :style="{ backgroundColor: tpl.composer.iconColor ?? tpl.composer.frameBorderColor ?? '#9b73be' }"
              />
              <span>{{ tpl.label }}</span>
            </Button>
          </div>
        </div>

        <!-- Proyek Terakhir Section -->
        <div class="space-y-2.5">
          <div class="relative flex items-center justify-center">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t border-border" />
            </div>
            <div class="relative bg-card px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              — Proyek Terakhir —
            </div>
          </div>

          <div v-if="store.recentProjects.length > 0" class="space-y-1.5">
            <button
              v-for="item in store.recentProjects"
              :key="`${item.name}-${item.savedAt}`"
              type="button"
              class="group flex w-full items-center justify-between rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-left transition-[background-color,border-color,transform] duration-100 ease-out hover:border-primary/40 hover:bg-muted/70 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-primary"
              @click="handleOpenRecent(item)"
            >
              <div class="flex min-w-0 items-center gap-2">
                <span class="text-xs text-primary font-bold">&gt;</span>
                <span class="truncate font-mono text-xs font-medium text-foreground group-hover:text-primary">
                  {{ item.name }}
                </span>
                <span class="text-muted-foreground/60">•</span>
                <span class="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {{ item.entryCount }} rank
                </span>
                <span class="text-muted-foreground/60">•</span>
                <span class="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {{ formatRelativeTime(item.savedAt) }}
                </span>
              </div>
              <FontAwesomeIcon
                :icon="faChevronRight"
                class="h-3 w-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              />
            </button>
          </div>

          <div
            v-else
            class="rounded-md border border-dashed border-border/80 bg-muted/10 p-4 text-center text-xs text-muted-foreground"
          >
            Belum ada proyek tersimpan di penyimpanan lokal.
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Docs / Version Matrix Dialog -->
    <Dialog v-model:open="docsModalOpen">
      <DialogContent class="max-w-xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <FontAwesomeIcon :icon="faBook" class="h-4 w-4 text-primary" />
            <span>Panduan Spesifikasi Versi Minecraft</span>
          </DialogTitle>
          <DialogDescription>
            Ringkasan aturan resmi pack_format, data format, dan sintaks pack.mcmeta (1.21.1 – 26.3) berdasarkan dokumentasi resmi Mojang.
          </DialogDescription>
        </DialogHeader>

        <div class="max-h-[60vh] space-y-3 overflow-y-auto pr-1 text-xs">
          <div class="space-y-1.5">
            <span class="font-semibold text-foreground">Daftar Versi Minecraft Java (1.21.1 – 26.3):</span>
            <div class="space-y-1 rounded border border-border bg-[#14151e] p-2 font-mono text-[11px]">
              <div
                v-for="v in VERSION_PROFILES"
                :key="v.id"
                class="flex items-center justify-between border-b border-border/40 py-1 last:border-b-0"
              >
                <span>{{ v.id }} ({{ v.format[0] }}{{ v.format[1] > 0 ? `.${v.format[1]}` : '' }})</span>
                <span class="text-[10px] text-muted-foreground">
                  {{ v.style === 'legacy' ? 'Legacy (Integer Tunggal)' : 'Modern Range (Rentang Minor)' }}
                </span>
              </div>
            </div>
          </div>

          <div class="space-y-1.5 text-[11px] text-muted-foreground">
            <p><strong class="text-foreground">1.21.4:</strong> Transisi berkas item model ke assets/&lt;ns&gt;/items/*.json.</p>
            <p><strong class="text-foreground">1.21.8:</strong> Batas format tunggal terakhir (pack_format: 64).</p>
            <p><strong class="text-foreground">1.21.9+:</strong> Penggunaan format rentang minor (min_format dan max_format).</p>
            <p><strong class="text-foreground">26.3:</strong> Format minor non-nol pertama [97, 1] dan relokasi tekstur armor trim.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
