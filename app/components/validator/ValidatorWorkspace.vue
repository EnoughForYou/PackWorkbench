<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  faCheck,
  faCircleCheck,
  faCircleExclamation,
  faClipboardCheck,
  faServer,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { useWorkbenchStore } from '@/stores/workbenchStore';
import UploadDropzone from './UploadDropzone.vue';
import TargetVersionSelector from './TargetVersionSelector.vue';
import Sha1StatusCard from './Sha1StatusCard.vue';
import FindingsPanel from './FindingsPanel.vue';
import ServerPropertiesTab from './ServerPropertiesTab.vue';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const store = useWorkbenchStore();
const activeValidatorTab = ref<'findings' | 'server'>('findings');

const findingsCountBadge = computed(() => {
  if (!store.report) return null;
  const errors = store.report.summary.errors;
  const warns = store.report.summary.warns;
  if (errors > 0) {
    return { text: `${errors} Error`, variant: 'error' as const };
  }
  if (warns > 0) {
    return { text: `${warns} Peringatan`, variant: 'warn' as const };
  }
  return { text: 'Lolos', variant: 'success' as const };
});
</script>

<template>
  <main
    id="main-content"
    class="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-background text-foreground"
  >
    <h1 id="validator-title" tabindex="-1" class="sr-only">
      Validator Resource Pack dan Generator Konfigurasi Server — Minecraft Java Edition
    </h1>

    <ResizablePanelGroup
      direction="horizontal"
      auto-save-id="pack-workbench-validator-panels"
      class="min-h-0 flex-1"
    >
      <!-- Left Rail: Berkas, Target Versi, dan Status SHA-1 -->
      <ResizablePanel :default-size="32" :min-size="24" :max-size="44">
        <ScrollArea class="h-full border-r border-border bg-card">
          <div class="space-y-4 p-4">
            <!-- Upload Dropzone -->
            <UploadDropzone
              :active-file="store.activeFile"
              :is-validating="store.isValidating"
              @file-selected="store.handleFileSelected"
            />

            <Separator />

            <!-- Target Version Selector -->
            <TargetVersionSelector
              :selected-version="store.selectedVersion"
              :auto-detected-target="store.report?.autoDetectedTarget ?? null"
              :compatible-versions="store.report?.compatibleVersions ?? []"
              @change="store.handleVersionChange"
            />

            <Separator />

            <!-- Compact SHA-1 Status Card -->
            <Sha1StatusCard
              :sha1-state="store.sha1State"
              :active-file="store.activeFile"
              @open-server-config="activeValidatorTab = 'server'"
            />
          </div>
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle />

      <!-- Right Main Stage: Tabbed Workspace -->
      <ResizablePanel :default-size="68" :min-size="50">
        <Tabs
          v-model="activeValidatorTab"
          class="flex h-full min-h-0 flex-col bg-background"
        >
          <!-- Top Tab Navigation Strip -->
          <div class="flex items-center justify-between border-b border-border bg-card/60 px-4 py-2">
            <TabsList class="h-9 bg-muted/80 p-1">
              <TabsTrigger
                value="findings"
                class="gap-2 px-3 text-xs font-medium cursor-pointer transition-colors"
              >
                <FontAwesomeIcon :icon="faClipboardCheck" class="h-3.5 w-3.5 text-primary" />
                <span>Hasil Pemeriksaan</span>
                <span
                  v-if="findingsCountBadge"
                  :class="[
                    'ml-1 rounded-full px-1.5 py-0.2 font-mono text-[10px] font-semibold tabular-nums',
                    findingsCountBadge.variant === 'error'
                      ? 'border border-[#e05252]/60 bg-[#e05252]/20 text-[#ff6b6b]'
                      : findingsCountBadge.variant === 'warn'
                        ? 'border border-[#f59e0b]/60 bg-[#f59e0b]/20 text-[#fbbf24]'
                        : 'border border-emerald-500/50 bg-emerald-500/20 text-emerald-400',
                  ]"
                >
                  {{ findingsCountBadge.text }}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="server"
                class="gap-2 px-3 text-xs font-medium cursor-pointer transition-colors"
              >
                <FontAwesomeIcon :icon="faServer" class="h-3.5 w-3.5 text-muted-foreground" />
                <span>Konfigurasi server.properties</span>
                <span
                  v-if="store.sha1State.status === 'done' && store.sha1State.sha1Hex"
                  class="ml-1 inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/20 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-emerald-400"
                >
                  <FontAwesomeIcon :icon="faCheck" class="h-2 w-2" />
                  Siap
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <!-- Tab Content: Findings Audit -->
          <TabsContent
            value="findings"
            class="m-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
          >
            <FindingsPanel
              :report="store.report"
              @inspect-nested-zip="store.inspectNestedZip"
            />
          </TabsContent>

          <!-- Tab Content: server.properties Generator -->
          <TabsContent
            value="server"
            class="m-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
          >
            <ServerPropertiesTab
              :sha1-hex="store.sha1State.sha1Hex"
              :active-file-name="store.activeFile?.name ?? null"
            />
          </TabsContent>
        </Tabs>
      </ResizablePanel>
    </ResizablePanelGroup>
  </main>
</template>
