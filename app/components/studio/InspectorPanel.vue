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
    aria-label="Pratinjau in-game dan inspektur properti"
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
          class="relative h-9 flex-none rounded-none border-0 bg-transparent px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
        >
          Properti
        </TabsTrigger>
        <TabsTrigger
          value="layers"
          class="relative h-9 flex-none rounded-none border-0 bg-transparent px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
        >
          Lapisan
        </TabsTrigger>
        <TabsTrigger
          value="validate"
          class="relative h-9 flex-none rounded-none border-0 bg-transparent px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
        >
          <span class="inline-flex items-center gap-1.5">
            <span>Validasi</span>
            <span
              v-if="totalProblemFindings > 0"
              class="rounded-full px-1.5 py-0.2 font-mono text-[10px] tabular-nums font-semibold"
              :class="store.validation.errors > 0 ? 'bg-destructive/20 text-destructive' : 'bg-amber-400/20 text-amber-300'"
            >
              {{ totalProblemFindings }}
            </span>
          </span>
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
