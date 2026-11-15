<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { useWorkbenchStore } from '@/stores/workbenchStore';
import UploadDropzone from './UploadDropzone.vue';
import TargetVersionSelector from './TargetVersionSelector.vue';
import FindingsPanel from './FindingsPanel.vue';
import Sha1AndSnippetPanel from './Sha1AndSnippetPanel.vue';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const store = useWorkbenchStore();
const isDesktop = useMediaQuery('(min-width: 1024px)');
</script>

<template>
  <main
    id="main-content"
    class="flex min-h-0 flex-1 flex-col lg:overflow-hidden"
  >
    <h1 id="validator-title" tabindex="-1" class="sr-only">
      Resource Pack and SHA-1 Validator — Minecraft Java Edition
    </h1>

    <ResizablePanelGroup
      v-if="isDesktop"
      direction="horizontal"
      auto-save-id="pack-workbench-validator-panels"
      class="min-h-0 flex-1"
    >
      <!-- Left Rail: Dropzone, Version, SHA-1 & server.properties -->
      <ResizablePanel :default-size="34" :min-size="25" :max-size="48">
        <ScrollArea class="h-full border-r border-border bg-[#0e0e12]">
          <div class="space-y-4 p-4">
            <UploadDropzone
              :active-file="store.activeFile"
              :is-validating="store.isValidating"
              @file-selected="store.handleFileSelected"
            />
            <Separator />
            <TargetVersionSelector
              :selected-version="store.selectedVersion"
              :auto-detected-target="store.report?.autoDetectedTarget ?? null"
              :compatible-versions="store.report?.compatibleVersions ?? []"
              @change="store.handleVersionChange"
            />
            <Separator />
            <Sha1AndSnippetPanel :sha1-state="store.sha1State" />
          </div>
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle />

      <!-- Right Main Stage: Findings Audit -->
      <ResizablePanel :default-size="66" :min-size="45">
        <div class="h-full min-h-0 bg-[#08080a]">
          <FindingsPanel
            :report="store.report"
            @inspect-nested-zip="store.inspectNestedZip"
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>

    <!-- Mobile / Tablet Flow -->
    <div v-else class="divide-y divide-border bg-[#08080a]">
      <div class="space-y-4 bg-[#0e0e12] p-4">
        <UploadDropzone
          :active-file="store.activeFile"
          :is-validating="store.isValidating"
          @file-selected="store.handleFileSelected"
        />
        <Separator />
        <TargetVersionSelector
          :selected-version="store.selectedVersion"
          :auto-detected-target="store.report?.autoDetectedTarget ?? null"
          :compatible-versions="store.report?.compatibleVersions ?? []"
          @change="store.handleVersionChange"
        />
      </div>
      <div>
        <FindingsPanel
          :report="store.report"
          @inspect-nested-zip="store.inspectNestedZip"
        />
      </div>
      <div class="bg-[#0e0e12] p-4">
        <Sha1AndSnippetPanel :sha1-state="store.sha1State" />
      </div>
    </div>
  </main>
</template>
