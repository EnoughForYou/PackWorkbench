<script setup lang="ts">
import { ref } from 'vue';
import { Menu, X } from '@lucide/vue';
import { Button } from '@/components/ui/button';

const route = useRoute();
const mobileMenuOpen = ref(false);

const NAV_LINKS = [
  { to: '/', label: 'Beranda' },
  { to: '/studio', label: 'Studio' },
  { to: '/about', label: 'About' },
] as const;

function closeMobileMenu(): void {
  mobileMenuOpen.value = false;
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-border bg-background">
    <div class="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <NuxtLink
        to="/"
        class="flex shrink-0 items-center gap-2.5 rounded-md py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span
          aria-hidden="true"
          class="flex h-7 w-7 items-center justify-center rounded-md border border-primary/40 bg-[#1a1310]"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" class="h-4 w-4 text-primary">
            <path d="M2 2h4v4H2V2Zm8 0h4v4h-4V2ZM6 6h4v4H6V6Zm-4 4h4v4H2v-4Zm8 0h4v4h-4v-4Z" />
          </svg>
        </span>
        <span class="text-sm font-semibold tracking-tight text-foreground">
          Pack Workbench
        </span>
      </NuxtLink>

      <!-- Strictly 3 navigation items -->
      <nav aria-label="Utama" class="hidden items-center gap-1 sm:flex">
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
        <Button as-child size="sm" class="hidden font-semibold sm:inline-flex">
          <NuxtLink to="/studio">Buka Studio</NuxtLink>
        </Button>

        <Button
          variant="outline"
          size="icon"
          type="button"
          :aria-expanded="mobileMenuOpen"
          aria-controls="mobile-nav-drawer"
          aria-label="Menu navigasi"
          class="min-h-10 min-w-10 sm:hidden"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <X v-if="mobileMenuOpen" aria-hidden="true" class="h-4 w-4" />
          <Menu v-else aria-hidden="true" class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div
      v-if="mobileMenuOpen"
      id="mobile-nav-drawer"
      class="border-t border-border bg-card px-4 py-3 sm:hidden"
    >
      <nav aria-label="Menu mobile" class="flex flex-col gap-1">
        <NuxtLink
          v-for="item in NAV_LINKS"
          :key="item.to"
          :to="item.to"
          :aria-current="route.path === item.to ? 'page' : undefined"
          :class="[
            'flex min-h-11 items-center rounded-md px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            route.path === item.to
              ? 'border-l-2 border-primary bg-accent text-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          ]"
          @click="closeMobileMenu"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
