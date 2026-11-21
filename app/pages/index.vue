<script setup lang="ts">
import { computed, ref } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faArrowRight,
  faCheck,
  faCube,
  faFileZipper,
  faFingerprint,
  faLayerGroup,
  faLock,
  faShieldHalved,
  faSliders,
  faUpload,
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
const activeRuleCategory = ref<'all' | 'zip' | 'mcmeta' | 'font' | 'server'>('all');
const isDraggingOver = ref(false);

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
  '1.21.2': {
    updateName: 'Bundles of Bravery',
    formatDisplay: '42',
    styleLabel: 'pack_format (legacy)',
    note: 'Pengenalan awal definisi item_model',
  },
  '1.21.4': {
    updateName: 'The Garden Awakens',
    formatDisplay: '46',
    styleLabel: 'pack_format (legacy)',
    note: 'Transisi masif items/*.json & 4-list CMD',
  },
  '1.21.5': {
    updateName: 'Maintenance Update',
    formatDisplay: '55',
    styleLabel: 'pack_format (legacy)',
    note: 'Format legacy tunggal integer 55',
  },
  '1.21.6': {
    updateName: 'Feature Adjustments',
    formatDisplay: '63',
    styleLabel: 'pack_format (legacy)',
    note: 'Format legacy tunggal integer 63',
  },
  '1.21.8': {
    updateName: 'Akhir Era Pre-Minor',
    formatDisplay: '64',
    styleLabel: 'pack_format (legacy)',
    note: 'Batas akhir lastPreMinorVersion = 64',
  },
  '1.21.9': {
    updateName: 'The Copper Age',
    formatDisplay: '[69, 0]',
    styleLabel: 'min_format / max_format',
    note: 'Awal era format minor & text object',
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

const SHOWCASE_RULES = [
  {
    id: 'Z01',
    category: 'zip',
    title: 'Keberadaan pack.mcmeta di Akar',
    docRef: 'docs/knowledge/00-ringkasan-perbedaan-versi.md §2',
    description: 'Berkas pack.mcmeta wajib berada tepat di akar berkas .zip, bukan terbungkus di dalam folder.',
    severity: 'ERROR',
  },
  {
    id: 'Z05',
    category: 'mcmeta',
    title: 'Format Era Minor vs pack_format',
    docRef: 'docs/knowledge/00-ringkasan-perbedaan-versi.md §2',
    description: 'Format 1.21.10+ wajib memakai min_format dan max_format berupa tuple [major, minor]. Float JSON seperti 69.0 ditolak codec Mojang.',
    severity: 'ERROR',
  },
  {
    id: 'Z06',
    category: 'mcmeta',
    title: 'Larangan supported_formats di Era Minor Murni',
    docRef: 'docs/knowledge/00-ringkasan-perbedaan-versi.md §2',
    description: 'Jika min_format > 64, Mojang melarang keberadaan field supported_formats karena dapat memicu crash deserialisasi.',
    severity: 'WARN',
  },
  {
    id: 'F01',
    category: 'font',
    title: 'Tinggi Glif Positif (height >= 1)',
    docRef: 'docs/knowledge/02-font-provider-dan-kompresi.md §1',
    description: 'Field height pada provider bitmap wajib bernilai positif. Nilai <= 0 memicu fatal crash division-by-zero pada renderer font Minecraft.',
    severity: 'ERROR',
  },
  {
    id: 'F02',
    category: 'font',
    title: 'Path Tekstur Font Sesuai Namespace',
    docRef: 'docs/knowledge/02-font-provider-dan-kompresi.md §1',
    description: 'File PNG yang direferensikan pada field file wajib ada di dalam direktori assets/<namespace>/textures/font/.',
    severity: 'ERROR',
  },
  {
    id: 'F03',
    category: 'font',
    title: 'Alokasi PUA Khusus Java (U+E200+)',
    docRef: 'docs/knowledge/02-font-provider-dan-kompresi.md §2',
    description: 'Karakter rank dialokasikan pada Private Use Area U+E200+ agar tidak menabrak ikon bawaan Bedrock di U+E100–U+E1FF.',
    severity: 'INFO',
  },
  {
    id: 'S01',
    category: 'server',
    title: 'Integritas SHA-1 40 Karakter',
    docRef: 'docs/knowledge/04-kompatibilitas-plugin.md §4',
    description: 'Nilai resource-pack-sha1 pada server.properties wajib berupa string heksadesimal 40 karakter huruf kecil.',
    severity: 'ERROR',
  },
] as const;

const filteredRules = computed(() => {
  if (activeRuleCategory.value === 'all') return SHOWCASE_RULES;
  return SHOWCASE_RULES.filter((r) => r.category === activeRuleCategory.value);
});

function openStudio(mode: 'font' | 'validator', version?: TargetVersionId): void {
  if (version) {
    store.handleVersionChange(version);
    store.updateProject((prev) => ({ ...prev, targetVersion: version }));
  }
  store.studioMode = mode;
  void navigateTo({ path: '/studio', query: { mode } });
}

function handleDragOver(e: DragEvent): void {
  e.preventDefault();
  isDraggingOver.value = true;
}

function handleDragLeave(e: DragEvent): void {
  e.preventDefault();
  isDraggingOver.value = false;
}

function handleDropFile(e: DragEvent): void {
  e.preventDefault();
  isDraggingOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;

  if (file.name.endsWith('.zip')) {
    store.handleFileSelected(file);
    store.studioMode = 'validator';
    void navigateTo({ path: '/studio', query: { mode: 'validator' } });
  } else if (file.name.endsWith('.png')) {
    void store.uploadPngFile(file);
    store.studioMode = 'font';
    void navigateTo({ path: '/studio', query: { mode: 'font' } });
  }
}
</script>

<template>
  <main id="main-content">
    <!-- Hero Showcase Section -->
    <section id="hero" aria-labelledby="hero-heading" class="border-b border-border bg-gradient-to-b from-[#181923] to-background">
      <div class="mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 px-4 py-12 sm:px-6 lg:min-h-[calc(100svh-56px)] lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-8 lg:py-16">
        <!-- Left 5 Columns: Crisp headline + single task actions -->
        <div class="space-y-6 lg:col-span-5">
          <div class="inline-flex items-center gap-2 border border-border bg-card/80 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground rounded-full shadow-inner">
            <span class="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span class="tabular-nums text-foreground">Java 1.21.1–26.3 · 100% Client-Side</span>
          </div>

          <h1
            id="hero-heading"
            class="text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-[3.15rem]"
            style="line-height: 1.07"
          >
            Studio rank dan validator pack Minecraft Java.
          </h1>

          <p class="max-w-lg text-sm sm:text-base leading-relaxed text-pretty text-foreground/90">
            Periksa integritas struktur <code class="rounded border border-border/60 bg-muted/70 px-1 py-0.5 font-mono text-xs text-foreground">.zip</code>, kalkulasi streaming SHA-1 <code class="rounded border border-border/60 bg-muted/70 px-1 py-0.5 font-mono text-xs text-foreground">server.properties</code>, dan rakit font bitmap rank badge <code class="rounded border border-border/60 bg-muted/70 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">U+E200+</code> tanpa mengunggah berkas ke server mana pun.
          </p>

          <div class="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              class="h-10 min-h-10 gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition-all duration-150 ease-out hover:bg-[#a882cb] active:scale-[0.97]"
              @click="openStudio('font')"
            >
              <span>Buka Studio Rank</span>
              <FontAwesomeIcon :icon="faArrowRight" class="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="secondary"
              class="h-10 min-h-10 px-5 text-sm font-medium transition-all duration-150 ease-out active:scale-[0.97]"
              @click="openStudio('validator')"
            >
              Validator ZIP &amp; SHA-1
            </Button>

            <Dialog>
              <DialogTrigger as-child>
                <Button variant="outline" size="sm" class="h-10 px-3 text-xs font-mono text-muted-foreground hover:text-foreground">
                  <FontAwesomeIcon :icon="faSliders" class="mr-1.5 h-3.5 w-3.5 text-primary" />
                  <span>server.properties</span>
                </Button>
              </DialogTrigger>
              <DialogContent class="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle class="flex items-center gap-2">
                    <FontAwesomeIcon :icon="faFingerprint" class="h-4 w-4 text-primary" />
                    <span>Integrasi server.properties</span>
                  </DialogTitle>
                  <DialogDescription>
                    Konfigurasi resource pack otomatis untuk server Minecraft Java. Nilai SHA-1 dihitung secara streaming di browser.
                  </DialogDescription>
                </DialogHeader>
                <div class="space-y-3 py-2">
                  <div class="rounded-md border border-border bg-[#14151e] p-3 font-mono text-xs text-foreground/90 space-y-0.5">
                    <p class="text-muted-foreground"># Format server.properties</p>
                    <p class="text-primary font-semibold">resource-pack=https\://example.com/mypack.zip</p>
                    <p class="text-emerald-400">resource-pack-sha1=da39a3ee5e6b4b0d3255bfef95601890afd80709</p>
                    <p class="text-sky-300">require-resource-pack=true</p>
                    <p class="text-amber-300">resource-pack-prompt={"text":"Please install the server resource pack for the best experience."}</p>
                  </div>
                  <p class="text-[11px] text-muted-foreground">
                    Validator memeriksa kecocokan 40 karakter lowercase hex dan kesiapan tautan unduhan langsung.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <!-- Quick Interactive File Dropzone Card -->
          <div
            :class="[
              'rounded-lg border-2 border-dashed p-4 transition-all duration-150 text-center cursor-pointer',
              isDraggingOver
                ? 'border-primary bg-primary/10 shadow-lg'
                : 'border-border/70 bg-card/40 hover:border-border hover:bg-card/70',
            ]"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDropFile"
          >
            <div class="flex items-center justify-center gap-2 text-xs font-medium text-foreground">
              <FontAwesomeIcon :icon="faUpload" class="h-3.5 w-3.5 text-primary" />
              <span>Seret berkas <code class="font-mono text-primary">.zip</code> atau <code class="font-mono text-primary">.png</code> ke sini</span>
            </div>
            <p class="mt-1 text-[11px] text-muted-foreground">
              Otomatis membuka Validator untuk ZIP atau Studio untuk tekstur glif
            </p>
          </div>

          <p class="font-mono text-xs text-muted-foreground tabular-nums">
            29 aturan Z01–F10 berbasis bytecode client.jar · Zero aset vanilla Mojang
          </p>
        </div>

        <!-- Right 7 Columns: Live Embedded Studio Preview Card -->
        <div class="lg:col-span-7">
          <Card class="overflow-hidden border-[#3a3d54] bg-[#222332] shadow-2xl ring-1 ring-white/5">
            <!-- Studio Frame Header -->
            <CardHeader class="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border bg-[#1c1d27] px-4 py-2.5">
              <div class="flex items-center gap-2">
                <span class="flex h-5 w-5 items-center justify-center rounded border border-primary/40 bg-muted text-primary" aria-hidden="true">
                  <FontAwesomeIcon :icon="faLayerGroup" class="h-3 w-3" />
                </span>
                <span class="font-mono text-xs font-semibold tracking-tight text-foreground">
                  Studio Workbench / preview
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
                    class="h-7 rounded-sm px-2.5 font-mono text-[11px] text-muted-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-semibold"
                  >
                    Kanvas
                  </TabsTrigger>
                  <TabsTrigger
                    value="json"
                    class="h-7 rounded-sm px-2.5 font-mono text-[11px] text-muted-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-semibold"
                  >
                    JSON Provider
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <!-- Interactive Workbench Grid inside Card -->
            <div class="grid grid-cols-1 divide-y divide-border sm:grid-cols-12 sm:divide-x sm:divide-y-0">
              <!-- Flat Rank Explorer Sidebar -->
              <div class="bg-[#1f202d] sm:col-span-4">
                <div class="border-b border-border px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Entri Contoh
                </div>
                <ul class="divide-y divide-border/40">
                  <li v-for="badge in DEMO_BADGES" :key="badge.id">
                    <button
                      type="button"
                      :aria-pressed="activeDemoId === badge.id"
                      :class="[
                        'flex w-full cursor-pointer items-center justify-between min-h-10 border-l-2 px-3 py-2 text-left transition-all duration-100 ease-out focus-visible:outline-2 focus-visible:outline-primary active:scale-[0.98]',
                        activeDemoId === badge.id
                          ? 'border-l-primary bg-primary/10 text-foreground font-semibold'
                          : 'border-l-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                      ]"
                      @click="activeDemoId = badge.id"
                    >
                      <span class="font-mono text-xs">{{ badge.name }}</span>
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
                    class="h-9 min-h-10 w-full text-xs font-semibold transition-all duration-150 active:scale-[0.96]"
                    @click="openStudio('font')"
                  >
                    Sunting di Studio
                  </Button>
                </div>
              </div>

              <!-- Live Checkerboard / JSON Center Stage -->
              <div class="flex flex-col justify-between bg-[#181922] sm:col-span-8">
                <div
                  v-if="previewSubView === 'canvas'"
                  class="pixel-checkerboard flex min-h-52 flex-1 items-center justify-center p-6"
                >
                  <div class="rounded-md overflow-hidden image-outline bg-background/50 shadow-md">
                    <PixelPreviewCanvas
                      :raster="activeDemoRaster"
                      :zoom="6"
                      :aria-label="`Pratinjau rank badge ${activeDemo.name}`"
                      class-name="block"
                    />
                  </div>
                </div>
                <div v-else class="min-h-52 flex-1 bg-[#14151e] p-4">
                  <pre class="overflow-x-auto font-mono text-xs leading-relaxed text-foreground/90"><code>{{ activeDemoJsonSnippet }}</code></pre>
                </div>

                <!-- Bottom Live Telemetry Strip inside Preview -->
                <div class="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-[#1c1d27] px-3.5 py-2 font-mono text-[11px] text-muted-foreground tabular-nums">
                  <span>
                    <strong class="font-semibold text-foreground">{{ activeDemo.name }}</strong> ·
                    width <span class="text-sky-300">{{ activeDemo.glyphW }}</span> ·
                    advance <span class="text-primary">{{ activeDemo.advance }}</span>
                  </span>
                  <Badge variant="outline" class="border-emerald-800 bg-emerald-950/60 text-emerald-300 font-mono text-[10px]">
                    0 Error (Valid Zod)
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>

    <!-- Section 2: Clean Two-Module Breakdown with Cards -->
    <section aria-labelledby="fitur-heading" class="border-b border-border bg-[#1c1d27] py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl space-y-2">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Dua Ruang Kerja Terpadu
          </p>
          <h2 id="fitur-heading" class="text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
            Merakit rank baru sekaligus menguji arsip pack sebelum rilis server.
          </h2>
        </div>

        <div class="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- Module 1: Studio Rank & Glyph -->
          <Card class="flex flex-col justify-between border-border bg-[#222330] shadow-md hover:border-primary/50 transition-colors">
            <CardHeader class="space-y-3">
              <div class="flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
                <FontAwesomeIcon :icon="faLayerGroup" class="h-3.5 w-3.5" />
                <span>MODUL 01 · RANK &amp; GLYPH STUDIO</span>
              </div>
              <CardTitle class="text-xl">
                Komposer badge 5-layer, negative space, dan audit F01–F10
              </CardTitle>
              <CardDescription class="text-sm">
                Susun latar frame, ikon geometris sintetis, teks <code class="rounded border border-border/60 bg-muted/70 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">3×5</code>/<code class="rounded border border-border/60 bg-muted/70 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">5×5</code>, bayangan, serta sapuan pensil piksel langsung di kanvas. Alokator <code class="rounded border border-border/60 bg-muted/70 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">U+E200+</code> menjaga rentang tetap aman dari PUA vanilla Bedrock.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ul class="space-y-1.5 font-mono text-xs text-foreground/90 tabular-nums">
                <li>• Pratinjau langsung Chat, TAB, dan Nametag in-game Minecraft</li>
                <li>• Ekspor paket Java (.zip) siap pakai beserta JSON &amp; UUID</li>
                <li>• Generator cuplikan LuckPerms, PlaceholderAPI, dan /tellraw</li>
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                type="button"
                variant="secondary"
                class="h-9 min-h-10 gap-2 text-xs font-semibold transition-all duration-150 active:scale-[0.96]"
                @click="openStudio('font')"
              >
                <span>Masuk ke Studio Rank</span>
                <FontAwesomeIcon :icon="faArrowRight" class="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>

          <!-- Module 2: Validator ZIP & SHA-1 -->
          <Card class="flex flex-col justify-between border-border bg-[#222330] shadow-md hover:border-sky-500/50 transition-colors">
            <CardHeader class="space-y-3">
              <div class="flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                <FontAwesomeIcon :icon="faFileZipper" class="h-3.5 w-3.5" />
                <span>MODUL 02 · VALIDATOR ZIP &amp; SHA-1</span>
              </div>
              <CardTitle class="text-xl">
                Pemeriksa pack.mcmeta 1.21.1–26.3 &amp; hash Web Worker
              </CardTitle>
              <CardDescription class="text-sm">
                Seret berkas <code class="rounded border border-border/60 bg-muted/70 px-1 py-0.5 font-mono text-xs text-foreground">.zip</code> eksternal hingga ukuran server <code class="rounded border border-border/60 bg-muted/70 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">250 MiB</code>. Aturan <code class="rounded border border-border/60 bg-muted/70 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">Z01–Z09</code> dan <code class="rounded border border-border/60 bg-muted/70 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">M01–M10</code> memeriksa folder akar, penulisan huruf kecil, serta transisi integer <code class="rounded border border-border/60 bg-muted/70 px-1 py-0.5 font-mono text-xs text-foreground">min_format</code>/<code class="rounded border border-border/60 bg-muted/70 px-1 py-0.5 font-mono text-xs text-foreground">max_format</code>.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ul class="space-y-1.5 font-mono text-xs text-foreground/90 tabular-nums">
                <li>• Perhitungan streaming SHA-1 40-karakter tanpa membekukan tab</li>
                <li>• Deteksi otomatis versi kompatibel &amp; saran perbaikan spesifik</li>
                <li>• Builder konfigurasi server.properties siap salin</li>
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                type="button"
                variant="outline"
                class="h-9 min-h-10 gap-2 text-xs font-semibold transition-all duration-150 active:scale-[0.96]"
                @click="openStudio('validator')"
              >
                <span>Buka Validator Arsip</span>
                <FontAwesomeIcon :icon="faArrowRight" class="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>

    <!-- Section 3: Verified Minecraft Java Version Matrix with Structured Cards -->
    <section aria-labelledby="versi-heading" class="border-b border-border bg-background py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

        <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            v-for="profile in VERSION_PROFILES"
            :key="profile.id"
            class="flex flex-col justify-between border-border bg-[#222330] hover:border-primary/40 transition-all hover:shadow-md"
          >
            <CardHeader class="pb-3">
              <div class="flex items-center justify-between gap-2">
                <Badge variant="outline" class="font-mono text-xs font-semibold text-primary border-primary/40">
                  Java {{ profile.id }}
                </Badge>
                <span class="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                  {{ VERSION_MATRIX_META[profile.id].formatDisplay }}
                </span>
              </div>
              <CardTitle class="text-base pt-1">
                {{ VERSION_MATRIX_META[profile.id].updateName }}
              </CardTitle>
              <CardDescription class="text-xs">
                {{ VERSION_MATRIX_META[profile.id].styleLabel }}
              </CardDescription>
            </CardHeader>

            <CardContent class="py-0 text-xs text-foreground/80">
              <p>{{ VERSION_MATRIX_META[profile.id].note }}</p>
            </CardContent>

            <CardFooter class="pt-4">
              <Button
                type="button"
                variant="ghost"
                class="w-full justify-between h-8 px-2.5 font-mono text-xs font-semibold text-primary hover:bg-muted"
                @click="openStudio('validator', profile.id)"
              >
                <span>Pilih Profil</span>
                <FontAwesomeIcon :icon="faArrowRight" class="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>

    <!-- Section 4: Showcase Rule Inspector (Z01–F10 Showcase Tabs) -->
    <section aria-labelledby="rules-heading" class="border-b border-border bg-[#181923] py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-baseline justify-between gap-4">
          <div class="space-y-1">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Mesin Audit Bytecode
            </p>
            <h2 id="rules-heading" class="text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
              29 Aturan Validasi Bersumber Primer dari client.jar
            </h2>
            <p class="text-xs leading-relaxed text-muted-foreground">
              Filter dan telusuri aturan-aturan diagnostik yang memastikan resource pack Anda 100% bebas crash.
            </p>
          </div>
          <Badge variant="outline" class="border-primary/40 text-primary font-mono text-xs">
            Zod Schema Validated
          </Badge>
        </div>

        <Tabs
          :model-value="activeRuleCategory"
          class="mt-8"
          @update:model-value="(v) => (activeRuleCategory = (v as 'all' | 'zip' | 'mcmeta' | 'font' | 'server') ?? 'all')"
        >
          <TabsList class="h-9 gap-1 bg-[#14151e] p-1 border border-border rounded-md">
            <TabsTrigger value="all" class="h-7 text-xs">Semua Aturan</TabsTrigger>
            <TabsTrigger value="zip" class="h-7 text-xs">Struktur ZIP (Z01–Z04)</TabsTrigger>
            <TabsTrigger value="mcmeta" class="h-7 text-xs">pack.mcmeta (Z05–Z09)</TabsTrigger>
            <TabsTrigger value="font" class="h-7 text-xs">Font Bitmap (F01–F10)</TabsTrigger>
            <TabsTrigger value="server" class="h-7 text-xs">server.properties (S01)</TabsTrigger>
          </TabsList>

          <TabsContent value="all" class="mt-6">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card
                v-for="rule in filteredRules"
                :key="rule.id"
                class="border-border bg-[#222332] p-4 space-y-2 shadow-xs"
              >
                <div class="flex items-center justify-between gap-2">
                  <Badge variant="outline" class="font-mono text-xs font-bold text-foreground">
                    {{ rule.id }}
                  </Badge>
                  <Badge
                    :variant="rule.severity === 'ERROR' ? 'destructive' : 'secondary'"
                    class="font-mono text-[10px]"
                  >
                    {{ rule.severity }}
                  </Badge>
                </div>
                <h4 class="text-sm font-semibold text-foreground">{{ rule.title }}</h4>
                <p class="text-xs text-muted-foreground leading-relaxed">{{ rule.description }}</p>
                <p class="font-mono text-[10px] text-primary/70 pt-1">{{ rule.docRef }}</p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="zip" class="mt-6">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card
                v-for="rule in filteredRules"
                :key="rule.id"
                class="border-border bg-[#222332] p-4 space-y-2 shadow-xs"
              >
                <div class="flex items-center justify-between gap-2">
                  <Badge variant="outline" class="font-mono text-xs font-bold text-foreground">
                    {{ rule.id }}
                  </Badge>
                  <Badge
                    :variant="rule.severity === 'ERROR' ? 'destructive' : 'secondary'"
                    class="font-mono text-[10px]"
                  >
                    {{ rule.severity }}
                  </Badge>
                </div>
                <h4 class="text-sm font-semibold text-foreground">{{ rule.title }}</h4>
                <p class="text-xs text-muted-foreground leading-relaxed">{{ rule.description }}</p>
                <p class="font-mono text-[10px] text-primary/70 pt-1">{{ rule.docRef }}</p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mcmeta" class="mt-6">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card
                v-for="rule in filteredRules"
                :key="rule.id"
                class="border-border bg-[#222332] p-4 space-y-2 shadow-xs"
              >
                <div class="flex items-center justify-between gap-2">
                  <Badge variant="outline" class="font-mono text-xs font-bold text-foreground">
                    {{ rule.id }}
                  </Badge>
                  <Badge
                    :variant="rule.severity === 'ERROR' ? 'destructive' : 'secondary'"
                    class="font-mono text-[10px]"
                  >
                    {{ rule.severity }}
                  </Badge>
                </div>
                <h4 class="text-sm font-semibold text-foreground">{{ rule.title }}</h4>
                <p class="text-xs text-muted-foreground leading-relaxed">{{ rule.description }}</p>
                <p class="font-mono text-[10px] text-primary/70 pt-1">{{ rule.docRef }}</p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="font" class="mt-6">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card
                v-for="rule in filteredRules"
                :key="rule.id"
                class="border-border bg-[#222332] p-4 space-y-2 shadow-xs"
              >
                <div class="flex items-center justify-between gap-2">
                  <Badge variant="outline" class="font-mono text-xs font-bold text-foreground">
                    {{ rule.id }}
                  </Badge>
                  <Badge
                    :variant="rule.severity === 'ERROR' ? 'destructive' : 'secondary'"
                    class="font-mono text-[10px]"
                  >
                    {{ rule.severity }}
                  </Badge>
                </div>
                <h4 class="text-sm font-semibold text-foreground">{{ rule.title }}</h4>
                <p class="text-xs text-muted-foreground leading-relaxed">{{ rule.description }}</p>
                <p class="font-mono text-[10px] text-primary/70 pt-1">{{ rule.docRef }}</p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="server" class="mt-6">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card
                v-for="rule in filteredRules"
                :key="rule.id"
                class="border-border bg-[#222332] p-4 space-y-2 shadow-xs"
              >
                <div class="flex items-center justify-between gap-2">
                  <Badge variant="outline" class="font-mono text-xs font-bold text-foreground">
                    {{ rule.id }}
                  </Badge>
                  <Badge
                    :variant="rule.severity === 'ERROR' ? 'destructive' : 'secondary'"
                    class="font-mono text-[10px]"
                  >
                    {{ rule.severity }}
                  </Badge>
                </div>
                <h4 class="text-sm font-semibold text-foreground">{{ rule.title }}</h4>
                <p class="text-xs text-muted-foreground leading-relaxed">{{ rule.description }}</p>
                <p class="font-mono text-[10px] text-primary/70 pt-1">{{ rule.docRef }}</p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>

    <!-- Section 5: Focused Roadmap with Cards -->
    <section aria-labelledby="roadmap-heading" class="bg-[#1c1d27] py-14">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            class="h-9 min-h-10 rounded-md bg-primary px-4 text-xs font-bold text-primary-foreground shadow-none transition-all duration-150 hover:bg-[#a882cb] active:scale-[0.96]"
            @click="openStudio('font')"
          >
            Mulai di Studio
          </Button>
        </div>

        <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card class="border-border bg-[#222330] p-5 space-y-3">
            <Badge variant="outline" class="gap-1.5 border-emerald-800/80 bg-emerald-950/60 font-mono text-[10px] font-semibold tracking-wide text-emerald-300">
              <FontAwesomeIcon :icon="faCheck" class="h-3 w-3 text-emerald-400" />
              Aktif · Fase 1 &amp; 2
            </Badge>
            <ul class="space-y-2 text-xs leading-relaxed text-foreground/90">
              <li>• Validator struktur arsip <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-foreground">.zip</code>, aturan <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-foreground">pack.mcmeta</code>, dan Web Worker SHA-1</li>
              <li>• Komposer Rank Badge 5-layer, <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-foreground">Negative Space</code>, alokasi <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-foreground tabular-nums">U+E200+</code>, &amp; Ekspor Java</li>
              <li>• Validasi Skema Zod 4 untuk format legacy (34) dan era modern ([69, 0]–[97, 1])</li>
            </ul>
          </Card>

          <Card class="border-border bg-[#222330] p-5 space-y-3">
            <Badge variant="outline" class="gap-1.5 border-border bg-card font-mono text-[10px] font-semibold tracking-wide text-muted-foreground">
              <FontAwesomeIcon :icon="faLock" class="h-3 w-3 text-muted-foreground" />
              Berikutnya · Fase 3 &amp; 4
            </Badge>
            <ul class="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>• Inspektor item model modern (<code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-muted-foreground">items/*.json</code> 1.21.4+) &amp; generator DeluxeMenus</li>
              <li>• Konverter Java ke Bedrock (<code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-muted-foreground">glyph_E2.png</code> &amp; <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-muted-foreground">manifest.json</code>) setelah verifikasi klien</li>
            </ul>
          </Card>
        </div>
      </div>
    </section>
  </main>
</template>
