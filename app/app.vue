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
    <div class="min-h-screen bg-background text-foreground">
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
