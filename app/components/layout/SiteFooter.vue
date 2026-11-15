<template>
  <footer class="border-t border-border bg-[#09090c]">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 gap-10 md:grid-cols-12">
        <div class="space-y-3 md:col-span-5">
          <div class="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              class="flex h-6 w-6 items-center justify-center rounded border border-primary/40 bg-[#1a1310]"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" class="h-3.5 w-3.5 text-primary">
                <path d="M2 2h4v4H2V2Zm8 0h4v4h-4V2ZM6 6h4v4H6V6Zm-4 4h4v4H2v-4Zm8 0h4v4h-4v-4Z" />
              </svg>
            </span>
            <span class="text-sm font-semibold text-foreground">Pack Workbench</span>
          </div>
          <p class="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Semua pemeriksaan <code class="text-foreground">.zip</code>, kalkulasi hash SHA-1, dan perakitan font berjalan lokal di browser tanpa unggahan berkas.
          </p>
          <p class="font-mono text-xs text-[#7c7c88]">
            Acuan format: <code class="text-muted-foreground">docs/knowledge/</code>
          </p>
        </div>

        <div class="space-y-3 md:col-span-3">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-[#7c7c88]">
            Halaman
          </h2>
          <ul class="space-y-2 text-sm">
            <li>
              <NuxtLink
                to="/"
                class="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Beranda
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/studio"
                class="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Studio
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/about"
                class="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                About
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div class="space-y-3 md:col-span-4">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-[#7c7c88]">
            Ruang Kerja
          </h2>
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li>
              <NuxtLink
                to="/studio?mode=font"
                class="hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Rank &amp; Glyph Studio (<code class="text-xs text-foreground">U+E200+</code>)
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/studio?mode=validator"
                class="hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Validator <code class="text-xs text-foreground">.zip</code> &amp; Generator SHA-1
              </NuxtLink>
            </li>
            <li class="text-xs leading-relaxed text-[#7c7c88]">
              Khusus Minecraft Java Edition (<code class="text-muted-foreground">1.21.1–26.3</code>). Tanpa aset vanilla Mojang.
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-xs text-[#7c7c88]">
        <span>Berjalan penuh di peramban: tanpa akun, backend, atau telemetri.</span>
        <span class="font-mono text-muted-foreground">Nuxt · Vue · Pinia · shadcn-vue</span>
      </div>
    </div>
  </footer>
</template>
