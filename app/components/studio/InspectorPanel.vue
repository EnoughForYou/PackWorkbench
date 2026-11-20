<script setup lang="ts">
import { computed } from 'vue';
import { useWorkbenchStore, type InspectorTab } from '@/stores/workbenchStore';
import InspectorPreviewViewport from './InspectorPreviewViewport.vue';
import InspectorPropertiesTab from './InspectorPropertiesTab.vue';
import InspectorLayersTab from './InspectorLayersTab.vue';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const store = useWorkbenchStore();

const totalProblemFindings = computed(
  () => store.validation.errors + store.validation.warns,
);

function handleInspectorTabChange(val: string | number): void {
  if (val === 'properties' || val === 'layers' || val === 'validate') {
    store.inspectorTab = val as InspectorTab;
  }
}
</script>

<template>
  <aside
    aria-label="In-game preview and property inspector"
    class="flex h-full min-h-0 flex-col bg-card"
  >
    <InspectorPreviewViewport />

    <Tabs
      :model-value="store.inspectorTab"
      class="flex min-h-0 flex-1 flex-col gap-0"
      @update:model-value="handleInspectorTabChange"
    >
      <TabsList class="h-9 w-full shrink-0 justify-start gap-1 rounded-none border-b border-border bg-card px-2 py-0">
        <TabsTrigger
          value="properties"
          class="tab-underline relative h-9 flex-none rounded-none border-0 bg-transparent px-2.5 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
        >
          Properties
        </TabsTrigger>
        <TabsTrigger
          value="layers"
          class="tab-underline relative h-9 flex-none rounded-none border-0 bg-transparent px-2.5 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
        >
          Layers
        </TabsTrigger>
        <TabsTrigger
          value="validate"
          class="tab-underline relative h-9 flex-none rounded-none border-0 bg-transparent px-2.5 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
        >
          {{ totalProblemFindings > 0 ? `Validate (${totalProblemFindings})` : 'Validate' }}
        </TabsTrigger>
      </TabsList>

      <ScrollArea v-show="store.inspectorTab !== 'validate'" class="min-h-0 flex-1">
        <TabsContent value="properties" class="mt-0 outline-none">
          <InspectorPropertiesTab />
        </TabsContent>
        <TabsContent value="layers" class="mt-0 outline-none">
          <InspectorLayersTab />
        </TabsContent>
      </ScrollArea>

      <TabsContent
        value="validate"
        class="mt-0 hidden min-h-0 flex-1 flex-col outline-none data-[state=active]:flex"
      >
        <LazyInspectorValidationTab v-if="store.inspectorTab === 'validate'" />
      </TabsContent>
    </Tabs>
  </aside>
</template>
