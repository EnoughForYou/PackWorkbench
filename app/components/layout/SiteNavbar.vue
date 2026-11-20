<script setup lang="ts">
import { Button } from '@/components/ui/button';

const route = useRoute();

const NAV_LINKS = [
  { to: '/', label: 'Beranda' },
  { to: '/studio', label: 'Studio' },
  { to: '/about', label: 'About' },
] as const;
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-border bg-card">
    <div class="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
      <NuxtLink
        to="/"
        class="flex shrink-0 items-center gap-2.5 rounded-md py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span
          aria-hidden="true"
          class="flex h-7 w-7 items-center justify-center rounded-md border border-primary/40 bg-muted"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" class="h-4 w-4 text-primary">
            <path d="M2 2h4v4H2V2Zm8 0h4v4h-4V2ZM6 6h4v4H6V6Zm-4 4h4v4H2v-4Zm8 0h4v4h-4v-4Z" />
          </svg>
        </span>
        <span class="text-sm font-semibold tracking-tight text-foreground">
          Pack Workbench
        </span>
      </NuxtLink>

      <!-- Desktop Navigation links -->
      <nav aria-label="Utama" class="flex items-center gap-1">
        <NuxtLink
          v-for="item in NAV_LINKS"
          :key="item.to"
          :to="item.to"
          :aria-current="route.path === item.to ? 'page' : undefined"
          :class="[
            'nav-underline flex min-h-11 items-center px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            route.path === item.to
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          ]"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-2">
        <Button as-child variant="pill" size="pill">
          <NuxtLink to="/studio">Buka Studio</NuxtLink>
        </Button>
      </div>
    </div>
  </header>
</template>
