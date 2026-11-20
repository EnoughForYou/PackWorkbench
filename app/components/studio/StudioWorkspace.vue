<script setup lang="ts">
import ToolDockRail from './ToolDockRail.vue';
import RankExplorerSidebar from './RankExplorerSidebar.vue';
import CenterStageCanvas from './CenterStageCanvas.vue';
import InspectorPanel from './InspectorPanel.vue';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
</script>

<template>
  <main
    id="main-content"
    class="flex min-h-0 min-w-[1280px] flex-1 flex-row overflow-hidden"
  >
    <h1 id="studio-title" tabindex="-1" class="sr-only">
      Rank Badge, Font, and Negative Space Studio — Minecraft Java Edition
    </h1>

    <ToolDockRail />

    <!-- Desktop: Smooth 3-pane Resizable IDE Panels -->
    <ResizablePanelGroup
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
  </main>
</template>
