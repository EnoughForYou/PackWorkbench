<script setup lang="ts">
import { ref } from 'vue';
import { useWorkbenchStore, type ComposerSubTab } from '@/stores/workbenchStore';
import InspectorEntryHeader from './inspector/InspectorEntryHeader.vue';
import InspectorTextSection from './inspector/InspectorTextSection.vue';
import InspectorIconSection from './inspector/InspectorIconSection.vue';
import InspectorFrameSection from './inspector/InspectorFrameSection.vue';
import InspectorMetricsSection from './inspector/InspectorMetricsSection.vue';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const store = useWorkbenchStore();
const metricsOpen = ref<boolean>(false);

function handleComposerSubTabChange(val: unknown): void {
  if (val === 'text' || val === 'icon' || val === 'frame') {
    store.composerSubTab = val as ComposerSubTab;
  }
}
</script>

<template>
  <div class="space-y-3 p-3">
    <!-- Empty State -->
    <p v-if="!store.selectedEntry" class="py-4 text-xs text-muted-foreground">
      Pilih entri di bilah kiri untuk mengedit propertinya.
    </p>

    <!-- Entry Active -->
    <div v-else class="space-y-3">
      <!-- Universal Entry Header (ID, label, space/bitmap badge, PUA badge & allocate) -->
      <InspectorEntryHeader />

      <!-- Space Entry Mode: Metrics (advance slider & input) -->
      <div v-if="store.selectedEntry.kind === 'space'" class="space-y-2">
        <InspectorMetricsSection />
      </div>

      <!-- Bitmap Entry Mode -->
      <div v-else class="space-y-3">
        <!-- Composer Sub-tabs (Teks / Ikon / Bingkai) -->
        <template v-if="store.selectedEntry.sourceMode === 'composer'">
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Penyusun Rank
            </span>
            <ToggleGroup
              type="single"
              :model-value="store.composerSubTab"
              aria-label="Sub-bagian penyusun rank"
              class="gap-0.5 rounded-sm border border-border bg-muted/80 p-0.5"
              @update:model-value="handleComposerSubTabChange"
            >
              <ToggleGroupItem
                value="text"
                class="h-6 rounded-sm px-2.5 text-[11px] font-medium transition-[background-color,color] duration-100 ease-out data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground"
              >
                Teks
              </ToggleGroupItem>
              <ToggleGroupItem
                value="icon"
                class="h-6 rounded-sm px-2.5 text-[11px] font-medium transition-[background-color,color] duration-100 ease-out data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground"
              >
                Ikon
              </ToggleGroupItem>
              <ToggleGroupItem
                value="frame"
                class="h-6 rounded-sm px-2.5 text-[11px] font-medium transition-[background-color,color] duration-100 ease-out data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground"
              >
                Bingkai
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <!-- Subtab Panels -->
          <InspectorTextSection v-if="store.composerSubTab === 'text'" />
          <InspectorIconSection v-else-if="store.composerSubTab === 'icon'" />
          <InspectorFrameSection v-else />
        </template>

        <Separator class="bg-border" />

        <!-- Header marker for Metrik BitmapProvider -->
        <span class="sr-only"><span>Metrik BitmapProvider</span></span>

        <!-- Metrics & Matrix Section -->
        <InspectorMetricsSection />
      </div>
    </div>
  </div>
</template>
