<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCube } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';

const route = useRoute();

const NAV_LINKS = [
  { to: '/', label: 'Beranda' },
  { to: '/studio', label: 'Studio' },
  { to: '/about', label: 'About' },
] as const;

function isLinkActive(to: string): boolean {
  if (to === '/') {
    return route.path === '/';
  }
  return route.path === to || route.path.startsWith(`${to}/`);
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xs">
    <div class="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <NuxtLink
        to="/"
        class="flex min-h-10 shrink-0 items-center gap-2.5 rounded-md px-2 py-1 text-foreground transition-[color,transform] duration-75 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]"
      >
        <span
          aria-hidden="true"
          class="flex h-7 w-7 items-center justify-center rounded-md border border-primary/40 bg-muted text-primary"
        >
          <FontAwesomeIcon :icon="faCube" class="h-3.5 w-3.5" />
        </span>
        <span class="text-sm font-semibold tracking-tight text-foreground">
          Pack Workbench
        </span>
      </NuxtLink>

      <!-- Desktop Navigation links -->
      <nav aria-label="Navigasi Utama" class="flex items-center gap-1">
        <NuxtLink
          v-for="item in NAV_LINKS"
          :key="item.to"
          :to="item.to"
          :aria-current="isLinkActive(item.to) ? 'page' : undefined"
          :class="[
            'nav-underline relative flex min-h-10 items-center rounded-md px-3.5 py-2 text-sm font-medium transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            isLinkActive(item.to)
              ? 'bg-muted/40 font-semibold text-foreground'
              : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground',
          ]"
        >
          {{ item.label }}
          <span
            v-if="isLinkActive(item.to)"
            class="absolute bottom-0 inset-x-2 h-0.5 rounded-full bg-primary"
            aria-hidden="true"
          />
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-2">
        <Button
          as-child
          class="h-9 min-h-10 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-none transition-[color,background-color,border-color,transform] duration-75 ease-out hover:bg-[#a882cb] active:scale-[0.96]"
        >
          <NuxtLink to="/studio">Buka Studio</NuxtLink>
        </Button>
      </div>
    </div>
  </header>
</template>
