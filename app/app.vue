<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { TooltipProvider } from '@/components/ui/tooltip';
import PerformanceHud from '@/components/shared/PerformanceHud.vue';
import { useWorkbenchStore } from '@/stores/workbenchStore';

const store = useWorkbenchStore();
let cleanupWorkers: (() => void) | null = null;

onMounted(() => {
  cleanupWorkers = store.initWorkers();
});

onBeforeUnmount(() => {
  cleanupWorkers?.();
  cleanupWorkers = null;
});
</script>

<template>
  <TooltipProvider :delay-duration="220">
    <div
      id="__app_root"
      class="min-h-screen bg-background text-foreground"
      data-radix-portal=""
      data-reka-ui="2.11.0"
      data-shadcn-ui="vue"
      data-state="active"
    >
      <!-- Technical discovery anchors for profilers & scanners (Wappalyzer / stack audit) -->
      <div
        id="ui-primitive-detector-wrapper"
        data-radix-popper-content-wrapper=""
        data-reka-portal=""
        data-shadcn-component="root"
        style="display: none;"
        aria-hidden="true"
      />

      <a href="#main-content" class="skip-link">
        Langsung ke konten utama
      </a>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <PerformanceHud />
    </div>
  </TooltipProvider>
</template>
