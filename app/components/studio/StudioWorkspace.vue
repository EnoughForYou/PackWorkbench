<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import ToolDockRail from './ToolDockRail.vue';
import RankExplorerSidebar from './RankExplorerSidebar.vue';
import CenterStageCanvas from './CenterStageCanvas.vue';
import InspectorPanel from './InspectorPanel.vue';
import StudioWelcomeScreen from './StudioWelcomeScreen.vue';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useWorkbenchStore } from '@/stores/workbenchStore';

const store = useWorkbenchStore();
const showWelcomeScreen = computed(() => !store.isProjectOpen || store.fontProject.entries.length === 0);

interface SplitterPanelHandle {
  collapse: () => void;
  expand: () => void;
}

const inspectorPanelRef = ref<SplitterPanelHandle | null>(null);

watch(
  () => store.inspectorCollapsed,
  (collapsed) => {
    if (collapsed) {
      inspectorPanelRef.value?.collapse();
    } else {
      inspectorPanelRef.value?.expand();
    }
  },
);

onMounted(() => {
  if (store.inspectorCollapsed) {
    nextTick(() => {
      inspectorPanelRef.value?.collapse();
    });
  }
});
</script>

<template>
  <main
    id="main-content"
    class="flex min-h-0 flex-1 flex-row overflow-hidden"
  >
    <h1 id="studio-title" tabindex="-1" class="sr-only">
      Rank Badge, Font, and Negative Space Studio — Minecraft Java Edition
    </h1>

    <ToolDockRail v-if="!showWelcomeScreen" />

    <!-- Desktop: Smooth 3-pane Resizable IDE Panels -->
    <ResizablePanelGroup
      v-if="!showWelcomeScreen"
      direction="horizontal"
      auto-save-id="pack-workbench-studio-panels"
      class="min-h-0 flex-1"
    >
      <ResizablePanel :default-size="19" :min-size="14" :max-size="28">
        <RankExplorerSidebar />
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel :default-size="55" :min-size="36">
        <CenterStageCanvas />
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel
        ref="inspectorPanelRef"
        id="studio-inspector-panel"
        :default-size="26"
        :min-size="store.inspectorCollapsed ? 0 : 20"
        :max-size="store.inspectorCollapsed ? 0 : 36"
        :collapsible="true"
        :collapsed-size="0"
        class="transition-[flex-grow,max-width,min-width] duration-200"
        :class="store.inspectorCollapsed ? 'min-w-[44px] max-w-[44px]' : ''"
        @collapse="store.inspectorCollapsed = true"
        @expand="store.inspectorCollapsed = false"
      >
        <InspectorPanel />
      </ResizablePanel>
    </ResizablePanelGroup>

    <StudioWelcomeScreen v-else class="flex-1" />
  </main>
</template>
