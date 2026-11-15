<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import ToolDockRail from './ToolDockRail.vue';
import RankExplorerSidebar from './RankExplorerSidebar.vue';
import CenterStageCanvas from './CenterStageCanvas.vue';
import InspectorPanel from './InspectorPanel.vue';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

const isDesktop = useMediaQuery('(min-width: 1024px)');
</script>

<template>
  <main
    id="main-content"
    class="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden"
  >
    <h1 id="studio-title" tabindex="-1" class="sr-only">
      Rank Badge, Font, and Negative Space Studio — Minecraft Java Edition
    </h1>

    <ToolDockRail />

    <!-- Desktop: Smooth 3-pane Resizable IDE Panels (PackSMC / xqedii layout) -->
    <ResizablePanelGroup
      v-if="isDesktop"
      direction="horizontal"
      auto-save-id="pack-workbench-studio-panels"
      class="min-h-0 flex-1"
    >
      <ResizablePanel :default-size="18" :min-size="13" :max-size="28">
        <RankExplorerSidebar />
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel :default-size="56" :min-size="35">
        <CenterStageCanvas />
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel :default-size="26" :min-size="20" :max-size="36">
        <InspectorPanel />
      </ResizablePanel>
    </ResizablePanelGroup>

    <!-- Mobile / Tablet: Clean Vertical Flow -->
    <div v-else class="flex min-h-0 flex-1 flex-col divide-y divide-border">
      <div class="max-h-64 overflow-hidden">
        <RankExplorerSidebar />
      </div>
      <div class="min-h-[380px]">
        <CenterStageCanvas />
      </div>
      <div>
        <InspectorPanel />
      </div>
    </div>
  </main>
</template>
