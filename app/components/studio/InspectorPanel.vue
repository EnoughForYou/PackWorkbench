<script setup lang="ts">
import { computed } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faSlidersH,
  faLayerGroup,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { useWorkbenchStore, type InspectorTab } from '@/stores/workbenchStore';
import InspectorPreviewViewport from './InspectorPreviewViewport.vue';
import InspectorPropertiesTab from './InspectorPropertiesTab.vue';
import InspectorLayersTab from './InspectorLayersTab.vue';
import InspectorValidationTab from './InspectorValidationTab.vue';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const store = useWorkbenchStore();

const totalProblemFindings = computed(
  () => store.validation.errors + store.validation.warns,
);

function handleInspectorTabChange(val: string | number): void {
  if (val === 'properties' || val === 'layers' || val === 'validate') {
    store.inspectorTab = val as InspectorTab;
  }
}

function activateTabAndExpand(tab: InspectorTab): void {
  store.inspectorTab = tab;
  store.inspectorCollapsed = false;
}
</script>

<template>
  <!-- Tampilan Diciutkan: Kolom Ikon Saja Vertikal (~44px) -->
  <aside
    v-if="store.inspectorCollapsed"
    aria-label="Inspektur diciutkan"
    class="flex h-full min-h-0 w-11 flex-col items-center border-l border-border bg-card select-none"
  >
    <h1 class="sr-only">Inspektur Studio</h1>

    <div class="flex h-9 w-full shrink-0 items-center justify-center border-b border-border">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Bentangkan inspektur"
            @click="store.inspectorCollapsed = false"
          >
            <FontAwesomeIcon :icon="faChevronRight" class="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <span>Bentangkan inspektur</span>
        </TooltipContent>
      </Tooltip>
    </div>

    <!-- Kolom vertikal 3 tombol ikon -->
    <div class="flex flex-col items-center gap-1 py-2" role="toolbar" aria-label="Tab inspektur">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            class="h-10 w-11 p-0 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60"
            :class="store.inspectorTab === 'properties' ? 'bg-primary/15 text-primary' : ''"
            aria-label="Properti"
            @click="activateTabAndExpand('properties')"
          >
            <FontAwesomeIcon :icon="faSlidersH" class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <span>Properti</span>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            class="h-10 w-11 p-0 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60"
            :class="store.inspectorTab === 'layers' ? 'bg-primary/15 text-primary' : ''"
            aria-label="Lapisan"
            @click="activateTabAndExpand('layers')"
          >
            <FontAwesomeIcon :icon="faLayerGroup" class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <span>Lapisan</span>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            class="relative h-10 w-11 p-0 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60"
            :class="store.inspectorTab === 'validate' ? 'bg-primary/15 text-primary' : ''"
            aria-label="Validasi"
            @click="activateTabAndExpand('validate')"
          >
            <FontAwesomeIcon :icon="faShieldHalved" class="h-4 w-4" />
            <span
              v-if="totalProblemFindings > 0"
              class="absolute top-1.5 right-1.5 h-2 w-2 rounded-full"
              :class="store.validation.errors > 0 ? 'bg-destructive' : 'bg-amber-400'"
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <span class="inline-flex items-center gap-1">
            <span>Validasi</span>
            <span v-if="totalProblemFindings > 0">({{ totalProblemFindings }})</span>
          </span>
        </TooltipContent>
      </Tooltip>
    </div>
  </aside>

  <!-- Tampilan Dibentangkan: Panel Inspektur Penuh -->
  <aside
    v-else
    aria-label="Pratinjau in-game dan inspektur properti"
    class="flex h-full min-h-0 flex-col bg-card"
  >
    <h1 class="sr-only">Inspektur Studio</h1>

    <!-- Bilah Tajuk Inspektur dengan Tombol Ciutkan -->
    <header class="flex h-9 shrink-0 items-center justify-between border-b border-border bg-card px-2">
      <div class="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              aria-label="Ciutkan inspektur"
              @click="store.inspectorCollapsed = true"
            >
              <FontAwesomeIcon :icon="faChevronLeft" class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <span>Ciutkan inspektur</span>
          </TooltipContent>
        </Tooltip>
        <span class="text-xs font-semibold text-foreground">Inspektur</span>
      </div>
    </header>

    <InspectorPreviewViewport />

    <Tabs
      :model-value="store.inspectorTab"
      class="flex min-h-0 flex-1 flex-col gap-0"
      @update:model-value="handleInspectorTabChange"
    >
      <TabsList class="h-9 w-full shrink-0 justify-start items-center gap-1 rounded-none border-b border-border bg-card px-2 py-0">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
              aria-label="Ciutkan inspektur"
              @click="store.inspectorCollapsed = true"
            >
              <FontAwesomeIcon :icon="faChevronLeft" class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <span>Ciutkan inspektur</span>
          </TooltipContent>
        </Tooltip>

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
        <InspectorValidationTab v-if="store.inspectorTab === 'validate'" />
      </TabsContent>
    </Tabs>
  </aside>
</template>
