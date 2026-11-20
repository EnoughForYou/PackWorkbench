<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCube } from '@fortawesome/free-solid-svg-icons';
</script>

<template>
  <footer class="border-t border-border bg-card">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-10">
        <!-- Brand Info -->
        <div class="space-y-3 md:col-span-5">
          <div class="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              class="flex h-6 w-6 items-center justify-center rounded border border-primary/40 bg-muted text-primary"
            >
              <FontAwesomeIcon :icon="faCube" class="h-3.5 w-3.5" />
            </span>
            <span class="text-sm font-semibold tracking-tight text-foreground">Pack Workbench</span>
          </div>
          <p class="max-w-sm text-sm leading-relaxed text-foreground/90 text-pretty">
            Semua pemeriksaan <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">.zip</code>, kalkulasi hash SHA-1, dan perakitan font berjalan lokal di browser tanpa unggahan berkas.
          </p>
          <p class="font-mono text-xs text-muted-foreground tabular-nums">
            Acuan format: <code class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 text-xs text-foreground/90">docs/knowledge/</code>
          </p>
        </div>

        <!-- Navigation Links -->
        <div class="space-y-3 md:col-span-3">
          <h2 class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Halaman
          </h2>
          <ul class="space-y-1">
            <li>
              <NuxtLink
                to="/"
                class="inline-flex min-h-10 items-center text-sm text-muted-foreground transition-colors duration-75 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Beranda
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/studio"
                class="inline-flex min-h-10 items-center text-sm text-muted-foreground transition-colors duration-75 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Studio
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/about"
                class="inline-flex min-h-10 items-center text-sm text-muted-foreground transition-colors duration-75 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                About
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Workspaces -->
        <div class="space-y-3 md:col-span-4">
          <h2 class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ruang Kerja
          </h2>
          <ul class="space-y-1 text-sm text-muted-foreground">
            <li>
              <NuxtLink
                to="/studio?mode=font"
                class="inline-flex min-h-10 items-center gap-1.5 transition-colors duration-75 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span>Rank &amp; Glyph Studio</span>
                <span class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground tabular-nums">U+E200+</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/studio?mode=validator"
                class="inline-flex min-h-10 items-center gap-1.5 transition-colors duration-75 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span>Validator</span>
                <span class="rounded border border-border/50 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground">.zip</span>
                <span>&amp; Generator SHA-1</span>
              </NuxtLink>
            </li>
            <li class="pt-1 text-xs leading-relaxed text-muted-foreground text-pretty">
              Khusus Minecraft Java Edition (<span class="font-mono text-foreground tabular-nums">1.21.1–26.3</span>). Tanpa aset vanilla Mojang.
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <span>Berjalan penuh di peramban: tanpa akun, backend, atau telemetri.</span>
        <span class="font-mono tabular-nums text-muted-foreground/80">Nuxt 4 · Vue 3 · Pinia · Font Awesome 6 · shadcn-vue</span>
      </div>
    </div>
  </footer>
</template>
