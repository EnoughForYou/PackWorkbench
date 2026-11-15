<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue';
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
  title: 'About — Pack Workbench',
});

const STACK_ROWS = [
  { tech: 'Nuxt 4 (ssr: false)', role: 'Routing halaman, mode SPA statis 100% browser-only tanpa API backend' },
  { tech: 'Vue 3 & Pinia (@pinia/nuxt)', role: 'Antarmuka reaktif dan state editor font serta worker validator' },
  { tech: 'shadcn-vue & Tailwind v4', role: 'Panel resizable, select, tabs, slider, checkbox, dan tabel antarmuka' },
  { tech: 'TypeScript strict', role: 'Mesin validasi murni di src/core/ yang berjalan independen di Node' },
  { tech: '@noble/hashes & JSZip', role: 'Hash SHA-1 streaming di Web Worker serta pembacaan/rakitan ZIP lokal' },
  { tech: 'Google Fonts API', role: 'Huruf antarmuka Onest dan data tabular JetBrains Mono' },
] as const;
</script>

<template>
  <main id="main-content" class="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
    <div class="space-y-4">
      <h1 class="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Tentang Pack Workbench
      </h1>
      <p class="text-base leading-relaxed text-muted-foreground">
        Alat browser untuk memeriksa arsip resource pack <code>.zip</code>, memvalidasi <code>pack.mcmeta</code>, dan menyusun rank badge serta font bitmap Minecraft Java Edition.
      </p>
    </div>

    <section aria-labelledby="sumber-heading" class="mt-12 space-y-3 border-t border-border pt-8">
      <h2 id="sumber-heading" class="text-lg font-semibold text-foreground">
        Sumber acuan teknis dan batasan
      </h2>
      <p class="text-sm leading-relaxed text-muted-foreground">
        Aturan validator (<code>Z01–Z09</code>, <code>M01–M10</code>, <code>F01–F10</code>) serta perhitungan posisi piksel merujuk langsung pada catatan pengujian <code>piston-meta.mojang.com</code> dan bytecode <code>client.jar</code> di folder <code>docs/knowledge/</code>.
      </p>
      <p class="text-sm leading-relaxed text-muted-foreground">
        Bagian yang belum diuji di klien game asli—seperti hasil rasterisasi antar-skala GUI <code>1–4</code> dan efek Texture Filtering modern—selalu membawa penanda <code class="text-amber-300">[UNVERIFIED]</code> agar Anda tahu kapan perlu uji langsung di game.
      </p>
    </section>

    <section aria-labelledby="privasi-heading" class="mt-10 space-y-3 border-t border-border pt-8">
      <h2 id="privasi-heading" class="text-lg font-semibold text-foreground">
        Pemrosesan lokal dan larangan aset Mojang
      </h2>
      <p class="text-sm leading-relaxed text-muted-foreground">
        Seluruh berkas <code>.zip</code> dan tekstur <code>.png</code> diolah di memori peramban. Aplikasi berjalan statis (<code>ssr: false</code>) tanpa backend, tanpa akun, dan tanpa analitik. Ikon serta font piksel bawaan digambar secara matematis tanpa menyertakan aset vanilla Mojang.
      </p>
    </section>

    <section aria-labelledby="stack-heading" class="mt-10 space-y-4 border-t border-border pt-8">
      <h2 id="stack-heading" class="text-lg font-semibold text-foreground">
        Teknologi yang dipakai
      </h2>

      <div class="overflow-x-auto border border-border bg-card">
        <Table>
          <caption class="sr-only">Daftar teknologi Pack Workbench</caption>
          <TableHeader class="border-b border-border bg-[#14141a]">
            <TableRow class="border-border hover:bg-transparent">
              <TableHead class="font-mono text-xs uppercase text-muted-foreground">Komponen</TableHead>
              <TableHead class="font-mono text-xs uppercase text-muted-foreground">Peran</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody class="divide-y divide-border">
            <TableRow v-for="item in STACK_ROWS" :key="item.tech" class="border-border hover:bg-accent/50">
              <TableCell class="font-mono text-xs font-semibold text-foreground">
                {{ item.tech }}
              </TableCell>
              <TableCell class="text-xs text-muted-foreground">
                {{ item.role }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>

    <div class="mt-10 border-t border-border pt-6">
      <Button as-child variant="ghost" size="sm" class="gap-2 pl-0 text-[#ff8f6b] hover:bg-transparent hover:text-primary">
        <NuxtLink to="/">
          <ArrowLeft aria-hidden="true" class="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </NuxtLink>
      </Button>
    </div>
  </main>
</template>
