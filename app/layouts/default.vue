<script setup lang="ts">
import SiteNavbar from '@/components/layout/SiteNavbar.vue';
import SiteFooter from '@/components/layout/SiteFooter.vue';
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    <SiteNavbar />
    <div class="flex-1">
      <slot />
    </div>
    <SiteFooter />
  </div>
</template>
