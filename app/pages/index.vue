<script setup lang="ts">
import { computed, ref } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faArrowRight,
  faCheck,
  faFileZipper,
  faLayerGroup,
  faLock,
} from '@fortawesome/free-solid-svg-icons';
import { synthesizeRankRgba } from '@core/font/pixelSynth.ts';
import { createDefaultRankComposer } from '@core/font/presets.ts';
import type { TargetVersionId } from '@core/types.ts';
import { VERSION_PROFILES } from '@core/versions.ts';
import { useWorkbenchStore } from '@/stores/workbenchStore';
import PixelPreviewCanvas from '@/components/shared/PixelPreviewCanvas.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

definePageMeta({
  layout: 'default',
});

useHead({
  title: 'Pack Workbench: Studio Font Rank & Validator Resource Pack Minecraft Java',
});

const store = useWorkbenchStore();

const DEMO_BADGES = [
  {
    id: 'admin',
    name: 'ADMIN',
    codepoint: 'U+E200',
    glyphW: 36,
    advance: 33,
    composer: createDefaultRankComposer({
      text: 'ADMIN',
      fontSize: '5x5',
      iconId: 'shield',
      iconColor: '#9b73be',
      frameStyle: 'pill',
      frameColor: '#1e1f29',
      frameBorderColor: '#9b73be',
      paddingX: 3,
      paddingY: 2,
      iconGap: 3,
    }),
  },
  {
    id: 'vip',
    name: 'VIP',
    codepoint: 'U+E201',
    glyphW: 28,
    advance: 26,
    composer: createDefaultRankComposer({
      text: 'VIP',
      fontSize: '5x5',
      iconId: 'crown',
      iconColor: '#fbbf24',
      frameStyle: 'outline',
      frameColor: '#1a150b',
      frameBorderColor: '#f59e0b',
      paddingX: 3,
      paddingY: 2,
      iconGap: 3,
    }),
  },
  {
    id: 'mod',
    name: 'MOD',
    codepoint: 'U+E202',
    glyphW: 30,
    advance: 28,
    composer: createDefaultRankComposer({
      text: 'MOD',
      fontSize: '5x5',
      iconId: 'star',
      iconColor: '#34d399',
      frameStyle: 'ribbon',
      frameColor: '#0e1d16',
      frameBorderColor: '#10b981',
      paddingX: 3,
      paddingY: 2,
      iconGap: 3,
    }),
  },
] as const;

const activeDemoId = ref<string>('admin');
const previewSubView = ref<'canvas' | 'json'>('canvas');

const activeDemo = computed(
  () => DEMO_BADGES.find((b) => b.id === activeDemoId.value) ?? DEMO_BADGES[0],
);

const activeDemoRaster = computed(() =>
  synthesizeRankRgba(activeDemo.value.composer, {
    frame: true,
    icon: true,
    text: true,
    shadow: true,
    paint: true,
  }),
);

const activeDemoJsonSnippet = computed(
  () =>
    `{\n  "type": "bitmap",\n  "file": "mypack:font/${activeDemo.value.id}.png",\n  "ascent": 8,\n  "height": 9,\n  "chars": ["\\u${activeDemo.value.codepoint.replace('U+', '')}"]\n}`,
);

const VERSION_MATRIX_META: Readonly<
  Record<
    TargetVersionId,
    { updateName: string; formatDisplay: string; styleLabel: string; note: string }
  >
> = {
  '1.21.1': {
    updateName: 'Tricky Trials',
    formatDisplay: '34',
    styleLabel: 'pack_format (legacy)',
    note: 'Format angka tunggal pra-1.21.9',
  },
  '1.21.10': {
    updateName: 'The Copper Age',
    formatDisplay: '[69, 0]',
    styleLabel: 'min_format / max_format',
    note: 'Era minor wajib tanpa supported_formats',
  },
  '1.21.11': {
    updateName: 'Mounts of Mayhem',
    formatDisplay: '[75, 0]',
    styleLabel: 'min_format / max_format',
    note: 'Pemisahan atlas items.json & blocks.json',
  },
  '26.1.2': {
    updateName: 'Tiny Takeover',
    formatDisplay: '[84, 0]',
    styleLabel: 'min_format / max_format',
    note: 'Baseline Java 25 un-obfuscated',
  },
  '26.2': {
    updateName: 'Chaos Cubed',
    formatDisplay: '[88, 0]',
    styleLabel: 'min_format / max_format',
    note: 'Pemindahan tekstur sign ke gui/signs/',
  },
  '26.3': {
    updateName: 'Wilderness Bound',
    formatDisplay: '[97, 1]',
    styleLabel: 'min_format / max_format',
    note: 'Target format minor aktif terbaru',
  },
};

function openStudio(mode: 'font' | 'validator', version?: TargetVersionId): void {
  if (version) {
    store.handleVersionChange(version);
    store.updateProject((prev) => ({ ...prev, targetVersion: version }));
  }
  store.studioMode = mode;
  void navigateTo({ path: '/studio', query: { mode } });
}
</script>

<template>
  <main id="main-content">
    <!-- Hero Showcase Section -->
    <section id="hero" aria-labelledby="hero-heading" class="border-b border-border">
      <div class="mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 px-4 py-14 sm:px-6 lg:min-h-[calc(100svh-56px)] lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-8 lg:py-16">
        <!-- Left 5 Columns: Crisp headline + single task actions -->
        <div class="hero-arrive space-y-6 lg:col-span-5">
          <div class="inline-flex items-center gap-2 border border-border bg-card px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span class="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span class="tabular-nums">Java 1.21.1–26.3 · Lokal di Browser</span>
          </div>

          <h1
            id="hero-heading"
            class="text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-[3.15rem]"
            style="line-height: 1.07"
          >
            Studio rank dan validator pack Minecraft Java.
          </h1>

          <p class="max-w-lg text-base leading-relaxed text-pretty text-foreground/90">
            Periksa struktur <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">.zip</code>, hitung SHA-1 <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">server.properties</code>, dan rakit font bitmap maupun rank badge <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">U+E200+</code> tanpa mengunggah berkas ke server mana pun.
          </p>

          <div class="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              class="h-10 min-h-10 gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground shadow-none transition-[color,background-color,border-color,transform] duration-75 ease-out hover:bg-[#a882cb] active:scale-[0.96]"
              @click="openStudio('font')"
            >
              <span>Buka Studio Rank</span>
              <FontAwesomeIcon :icon="faArrowRight" class="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="secondary"
              class="h-10 min-h-10 px-5 text-sm font-medium transition-[color,background-color,border-color,transform] duration-75 ease-out active:scale-[0.96]"
              @click="openStudio('validator')"
            >
              Validator ZIP &amp; SHA-1
            </Button>
          </div>

          <p class="font-mono text-xs text-muted-foreground tabular-nums">
            29 aturan Z01–F10 berbasis bytecode client.jar · Tanpa aset vanilla Mojang
          </p>
        </div>

        <!-- Right 7 Columns: Live Embedded Studio Preview Frame (Concentric border radii, zero AI-slop) -->
        <div class="lg:col-span-7">
          <div class="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
            <!-- Studio Frame Header (Authentic studio identity without fake macOS traffic-light dots) -->
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3.5 py-2">
              <div class="flex items-center gap-2">
                <span class="flex h-5 w-5 items-center justify-center rounded border border-primary/30 bg-muted text-primary" aria-hidden="true">
                  <FontAwesomeIcon :icon="faLayerGroup" class="h-3 w-3" />
                </span>
                <span class="font-mono text-xs font-semibold tracking-tight text-foreground">
                  Pack Workbench / studio
                </span>
              </div>

              <Tabs
                :model-value="previewSubView"
                class="gap-0"
                @update:model-value="(v) => (previewSubView = v === 'json' ? 'json' : 'canvas')"
              >
                <TabsList class="h-7 gap-1 bg-transparent p-0">
                  <TabsTrigger
                    value="canvas"
                    class="tab-underline relative h-7 min-w-10 flex-none rounded-none border-0 bg-transparent px-2 font-mono text-[11px] text-muted-foreground shadow-none transition-colors duration-75 ease-out hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    Kanvas
                  </TabsTrigger>
                  <TabsTrigger
                    value="json"
                    class="tab-underline relative h-7 min-w-10 flex-none rounded-none border-0 bg-transparent px-2 font-mono text-[11px] text-muted-foreground shadow-none transition-colors duration-75 ease-out hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    JSON Provider
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <!-- Interactive Workbench Grid inside Frame -->
            <div class="grid grid-cols-1 divide-y divide-border sm:grid-cols-12 sm:divide-x sm:divide-y-0">
              <!-- Flat Rank Explorer Sidebar -->
              <div class="bg-card sm:col-span-4">
                <div class="border-b border-border px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Entri Contoh
                </div>
                <ul class="divide-y divide-border/40">
                  <li v-for="badge in DEMO_BADGES" :key="badge.id">
                    <button
                      type="button"
                      :aria-pressed="activeDemoId === badge.id"
                      :class="[
                        'flex w-full cursor-pointer items-center justify-between min-h-10 border-l-2 px-3 py-2 text-left transition-colors duration-75 ease-out focus-visible:outline-2 focus-visible:outline-primary active:scale-[0.98]',
                        activeDemoId === badge.id
                          ? 'border-l-primary bg-muted text-foreground'
                          : 'border-l-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                      ]"
                      @click="activeDemoId = badge.id"
                    >
                      <span class="font-mono text-xs font-semibold">{{ badge.name }}</span>
                      <span class="font-mono text-[11px] text-muted-foreground tabular-nums">
                        {{ badge.codepoint }}
                      </span>
                    </button>
                  </li>
                </ul>

                <div class="border-t border-border p-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    class="h-9 min-h-10 w-full text-xs font-medium transition-[color,background-color,border-color,transform] duration-75 ease-out active:scale-[0.96]"
                    @click="openStudio('font')"
                  >
                    Sunting di Studio
                  </Button>
                </div>
              </div>

              <!-- Live Checkerboard / JSON Center Stage -->
              <div class="flex flex-col justify-between bg-background sm:col-span-8">
                <div
                  v-if="previewSubView === 'canvas'"
                  class="pixel-checkerboard flex min-h-48 flex-1 items-center justify-center p-6"
                >
                  <div class="rounded-md overflow-hidden image-outline bg-background/50">
                    <PixelPreviewCanvas
                      :raster="activeDemoRaster"
                      :zoom="6"
                      :aria-label="`Pratinjau rank badge ${activeDemo.name}`"
                      class-name="block"
                    />
                  </div>
                </div>
                <div v-else class="min-h-48 flex-1 bg-background p-4">
                  <pre class="overflow-x-auto font-mono text-xs leading-relaxed text-foreground/90"><code>{{ activeDemoJsonSnippet }}</code></pre>
                </div>

                <!-- Bottom Live Telemetry Strip inside Preview -->
                <div class="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card px-3.5 py-2 font-mono text-[11px] text-muted-foreground tabular-nums">
                  <span>
                    <strong class="font-semibold text-foreground">{{ activeDemo.name }}</strong> ·
                    width <span class="text-sky-300">{{ activeDemo.glyphW }}</span> ·
                    advance <span class="text-primary">{{ activeDemo.advance }}</span>
                  </span>
                  <span class="text-emerald-400">pack.mcmeta · 0 Error</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 2: Clean Two-Module Breakdown (Hairline-divided, purposeful structured layout) -->
    <section aria-labelledby="fitur-heading" class="border-b border-border bg-card">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div class="max-w-2xl space-y-2">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Dua Ruang Kerja Terpadu
          </p>
          <h2 id="fitur-heading" class="text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
            Merakit rank baru sekaligus menguji arsip pack sebelum rilis server.
          </h2>
        </div>

        <div class="mt-10 grid grid-cols-1 divide-y divide-border rounded-lg border border-border bg-background overflow-hidden lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <!-- Module 1: Studio Rank & Glyph -->
          <div class="flex flex-col justify-between gap-6 p-6 sm:p-8">
            <div class="space-y-4">
              <div class="flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
                <FontAwesomeIcon :icon="faLayerGroup" class="h-3.5 w-3.5" />
                <span>MODUL 01 · RANK &amp; GLYPH STUDIO</span>
              </div>
              <h3 class="text-xl font-semibold tracking-tight text-balance text-foreground">
                Komposer badge 5-layer, negative space, dan audit F01–F10
              </h3>
              <p class="text-sm leading-relaxed text-pretty text-foreground/90">
                Susun latar frame, ikon geometris sintetis, teks <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">3×5</code>/<code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">5×5</code>, bayangan, serta sapuan pensil piksel langsung di kanvas. Alokator <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">U+E200+</code> menjaga rentang tetap aman dari PUA vanilla Bedrock.
              </p>
              <ul class="space-y-1.5 font-mono text-xs text-foreground/90 tabular-nums">
                <li>• Pratinjau langsung Chat, TAB, dan Nametag in-game Minecraft</li>
                <li>• Ekspor paket Java (.zip) siap pakai beserta JSON &amp; UUID</li>
                <li>• Generator cuplikan LuckPerms, PlaceholderAPI, dan /tellraw</li>
              </ul>
            </div>

            <div>
              <Button
                type="button"
                variant="secondary"
                class="h-9 min-h-10 gap-2 text-xs font-semibold transition-[color,background-color,border-color,transform] duration-75 ease-out active:scale-[0.96]"
                @click="openStudio('font')"
              >
                <span>Masuk ke Studio Rank</span>
                <FontAwesomeIcon :icon="faArrowRight" class="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <!-- Module 2: Validator ZIP & SHA-1 -->
          <div class="flex flex-col justify-between gap-6 p-6 sm:p-8">
            <div class="space-y-4">
              <div class="flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                <FontAwesomeIcon :icon="faFileZipper" class="h-3.5 w-3.5" />
                <span>MODUL 02 · VALIDATOR ZIP &amp; SHA-1</span>
              </div>
              <h3 class="text-xl font-semibold tracking-tight text-balance text-foreground">
                Pemeriksa pack.mcmeta 1.21.1–26.3 &amp; hash Web Worker
              </h3>
              <p class="text-sm leading-relaxed text-pretty text-foreground/90">
                Seret berkas <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">.zip</code> eksternal hingga ukuran server <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">250 MiB</code>. Aturan <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">Z01–Z09</code> dan <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">M01–M10</code> memeriksa folder akar, penulisan huruf kecil, serta transisi integer <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">min_format</code>/<code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">max_format</code>.
              </p>
              <ul class="space-y-1.5 font-mono text-xs text-foreground/90 tabular-nums">
                <li>• Perhitungan streaming SHA-1 40-karakter tanpa membekukan tab</li>
                <li>• Deteksi otomatis versi kompatibel &amp; saran perbaikan spesifik</li>
                <li>• Builder konfigurasi server.properties siap salin</li>
              </ul>
            </div>

            <div>
              <Button
                type="button"
                variant="outline"
                class="h-9 min-h-10 gap-2 text-xs font-semibold transition-[color,background-color,border-color,transform] duration-75 ease-out active:scale-[0.96]"
                @click="openStudio('validator')"
              >
                <span>Buka Validator Arsip</span>
                <FontAwesomeIcon :icon="faArrowRight" class="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 3: Verified Minecraft Java Version Matrix -->
    <section aria-labelledby="versi-heading" class="border-b border-border bg-background">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div class="max-w-2xl space-y-2">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Matriks Versi Terverifikasi
          </p>
          <h2 id="versi-heading" class="text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
            Dukungan target Minecraft Java Edition 1.21.1 hingga 26.3
          </h2>
          <p class="text-sm leading-relaxed text-pretty text-foreground/90">
            Setiap profil diverifikasi terhadap <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">version.json</code> dan bytecode codec <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">PackFormat</code> resmi.
          </p>
        </div>

        <div class="mt-8 overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <caption class="sr-only">
              Daftar format pack.mcmeta untuk Minecraft Java 1.21.1 sampai 26.3
            </caption>
            <TableHeader class="border-b border-border bg-muted">
              <TableRow class="border-border hover:bg-transparent">
                <TableHead class="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Versi</TableHead>
                <TableHead class="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rilis</TableHead>
                <TableHead class="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Format</TableHead>
                <TableHead class="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Skema pack.mcmeta</TableHead>
                <TableHead class="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Catatan Klien</TableHead>
                <TableHead class="text-right font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Uji</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody class="divide-y divide-border">
              <TableRow
                v-for="profile in VERSION_PROFILES"
                :key="profile.id"
                class="border-border hover:bg-accent/40"
              >
                <TableCell class="font-mono text-xs font-semibold text-foreground tabular-nums">
                  {{ profile.id }}
                </TableCell>
                <TableCell class="text-xs font-medium text-foreground/90">
                  {{ VERSION_MATRIX_META[profile.id].updateName }}
                </TableCell>
                <TableCell class="font-mono text-xs font-semibold text-primary tabular-nums">
                  {{ VERSION_MATRIX_META[profile.id].formatDisplay }}
                </TableCell>
                <TableCell class="font-mono text-xs text-muted-foreground tabular-nums">
                  {{ VERSION_MATRIX_META[profile.id].styleLabel }}
                </TableCell>
                <TableCell class="text-xs text-foreground/80">
                  {{ VERSION_MATRIX_META[profile.id].note }}
                </TableCell>
                <TableCell class="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    class="h-8 min-h-10 px-3 font-mono text-xs font-semibold text-primary transition-[color,background-color,border-color,transform] duration-75 ease-out hover:bg-muted hover:text-primary active:scale-[0.96]"
                    @click="openStudio('validator', profile.id)"
                  >
                    Pilih
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </section>

    <!-- Section 4: Focused Roadmap (Compact status cards, zero marketing fluff) -->
    <section aria-labelledby="roadmap-heading" class="bg-card">
      <div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-baseline justify-between gap-4">
          <div class="space-y-1">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cakupan Pengembangan
            </p>
            <h2 id="roadmap-heading" class="text-xl font-semibold tracking-tight text-balance text-foreground">
              Cakupan saat ini &amp; pengujian berikutnya
            </h2>
            <p class="text-xs leading-relaxed text-pretty text-muted-foreground">
              Ekspor saat ini khusus Java Edition. Fitur fase selanjutnya tidak dibuka sebelum verifikasi teknis tuntas.
            </p>
          </div>
          <Button
            type="button"
            class="h-9 min-h-10 rounded-md bg-primary px-4 text-xs font-bold text-primary-foreground shadow-none transition-[color,background-color,border-color,transform] duration-75 ease-out hover:bg-[#a882cb] active:scale-[0.96]"
            @click="openStudio('font')"
          >
            Mulai di Studio
          </Button>
        </div>

        <div class="mt-6 grid grid-cols-1 divide-y divide-border rounded-lg border border-border bg-background overflow-hidden md:grid-cols-2 md:divide-x md:divide-y-0">
          <div class="space-y-3 p-5">
            <Badge variant="outline" class="gap-1.5 border-emerald-800/80 bg-emerald-950/60 font-mono text-[10px] font-semibold tracking-wide text-emerald-300">
              <FontAwesomeIcon :icon="faCheck" class="h-3 w-3 text-emerald-400" />
              Aktif · Fase 1 &amp; 2
            </Badge>
            <ul class="space-y-2 text-xs leading-relaxed text-foreground/90">
              <li>• Validator struktur arsip <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-foreground">.zip</code>, aturan <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-foreground">pack.mcmeta</code>, dan Web Worker SHA-1</li>
              <li>• Komposer Rank Badge 5-layer, <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-foreground">Negative Space</code>, alokasi <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-foreground tabular-nums">U+E200+</code>, &amp; Ekspor Java</li>
            </ul>
          </div>

          <div class="space-y-3 p-5">
            <Badge variant="outline" class="gap-1.5 border-border bg-card font-mono text-[10px] font-semibold tracking-wide text-muted-foreground">
              <FontAwesomeIcon :icon="faLock" class="h-3 w-3 text-muted-foreground" />
              Berikutnya · Fase 3 &amp; 4
            </Badge>
            <ul class="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>• Inspektor item model modern (<code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-muted-foreground">items/*.json</code> 1.21.4+) &amp; generator DeluxeMenus</li>
              <li>• Konverter Java ke Bedrock (<code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-muted-foreground">glyph_E2.png</code> &amp; <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-muted-foreground">manifest.json</code>) setelah verifikasi klien</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
