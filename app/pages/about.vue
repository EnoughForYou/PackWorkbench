<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

definePageMeta({
  layout: 'default',
});

useHead({
  title: 'Tentang — Pack Workbench',
});

const STACK_ROWS = [
  { tech: 'Nuxt 4 (ssr: false)', role: 'Routing halaman, mode SPA statis 100% browser-only tanpa API backend' },
  { tech: 'Vue 3 & Pinia (@pinia/nuxt)', role: 'Antarmuka reaktif dan state editor font serta worker validator' },
  { tech: 'Font Awesome 6 SVG', role: 'Sistem ikon antarmuka terstandar industri (@fortawesome/vue-fontawesome)' },
  { tech: 'shadcn-vue & Tailwind v4', role: 'Panel resizable, select, tabs, slider, checkbox, dan tabel antarmuka' },
  { tech: 'TypeScript strict', role: 'Mesin validasi murni di src/core/ yang berjalan independen di Node' },
  { tech: '@noble/hashes & JSZip', role: 'Hash SHA-1 streaming di Web Worker serta pembacaan/rakitan ZIP lokal' },
  { tech: 'Google Fonts API', role: 'Huruf antarmuka Onest dan data tabular JetBrains Mono Variable Fonts' },
] as const;
</script>

<template>
  <main id="main-content" class="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
    <div class="space-y-3">
      <div class="inline-flex items-center gap-2 border border-border bg-card px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span class="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
        <span class="tabular-nums">Dokumentasi &amp; Arsitektur</span>
      </div>
      <h1 class="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
        Tentang Pack Workbench
      </h1>
      <p class="text-base leading-relaxed text-pretty text-foreground/90">
        Alat browser untuk memeriksa arsip resource pack <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">.zip</code>, memvalidasi <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">pack.mcmeta</code>, dan menyusun rank badge serta font bitmap Minecraft Java Edition.
      </p>
    </div>

    <section aria-labelledby="sumber-heading" class="mt-12 space-y-3 border-t border-border pt-8">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Verifikasi Primer
      </p>
      <h2 id="sumber-heading" class="text-lg font-semibold tracking-tight text-balance text-foreground">
        Sumber acuan teknis dan batasan
      </h2>
      <p class="text-sm leading-relaxed text-pretty text-foreground/90">
        Aturan validator (<code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">Z01–Z09</code>, <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">M01–M10</code>, <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">F01–F10</code>) serta perhitungan posisi piksel merujuk langsung pada catatan pengujian <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">piston-meta.mojang.com</code> dan bytecode <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">client.jar</code> di folder <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">docs/knowledge/</code>.
      </p>
      <p class="text-sm leading-relaxed text-pretty text-muted-foreground">
        Bagian yang belum diuji di klien game asli—seperti hasil rasterisasi antar-skala GUI <code class="font-mono text-xs text-foreground tabular-nums">1–4</code> dan efek Texture Filtering modern—selalu membawa penanda <code class="rounded border border-amber-800/60 bg-amber-950/40 px-1.5 py-0.5 font-mono text-xs font-semibold text-amber-300">[UNVERIFIED]</code> agar Anda tahu kapan perlu uji langsung di game.
      </p>
    </section>

    <section aria-labelledby="privasi-heading" class="mt-10 space-y-3 border-t border-border pt-8">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Keamanan &amp; Integritas
      </p>
      <h2 id="privasi-heading" class="text-lg font-semibold tracking-tight text-balance text-foreground">
        Pemrosesan lokal dan larangan aset Mojang
      </h2>
      <p class="text-sm leading-relaxed text-pretty text-foreground/90">
        Seluruh berkas <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">.zip</code> dan tekstur <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">.png</code> diolah di memori peramban. Aplikasi berjalan statis (<code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">ssr: false</code>) tanpa backend, tanpa akun, dan tanpa analitik. Ikon serta font piksel bawaan digambar secara matematis tanpa menyertakan aset vanilla Mojang.
      </p>
    </section>

    <section aria-labelledby="stack-heading" class="mt-10 space-y-4 border-t border-border pt-8">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Spesifikasi Stack
      </p>
      <h2 id="stack-heading" class="text-lg font-semibold tracking-tight text-balance text-foreground">
        Teknologi yang dipakai
      </h2>

      <div class="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <caption class="sr-only">Daftar teknologi Pack Workbench</caption>
          <TableHeader class="border-b border-border bg-muted">
            <TableRow class="border-border hover:bg-transparent">
              <TableHead class="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Komponen</TableHead>
              <TableHead class="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Peran</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody class="divide-y divide-border">
            <TableRow v-for="item in STACK_ROWS" :key="item.tech" class="border-border hover:bg-accent/40">
              <TableCell class="font-mono text-xs font-semibold text-foreground tabular-nums">
                {{ item.tech }}
              </TableCell>
              <TableCell class="text-xs leading-relaxed text-foreground/90">
                {{ item.role }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>

    <div class="mt-10 border-t border-border pt-6">
      <Button as-child variant="ghost" class="h-10 min-h-10 gap-2 px-3 text-xs font-semibold text-primary transition-[color,background-color,border-color,transform] duration-75 ease-out hover:bg-muted hover:text-primary active:scale-[0.96]">
        <NuxtLink to="/">
          <FontAwesomeIcon :icon="faArrowLeft" class="h-3.5 w-3.5" />
          <span>Kembali ke Beranda</span>
        </NuxtLink>
      </Button>
    </div>
  </main>
</template>
