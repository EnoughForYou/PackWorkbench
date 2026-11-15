<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileArchive,
  FileCheck2,
  Info,
} from '@lucide/vue';
import type { Severity, ValidationReport } from '@core/types.ts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface Props {
  readonly report: ValidationReport | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  inspectNestedZip: [nestedPath: string];
}>();

const hasPluginBundleSignals = computed(() => {
  const b = props.report?.zipInspection.pluginBundle;
  return Boolean(b && (b.ecosystems.length > 0 || b.nestedZipPaths.length > 0));
});

type FilterValue = 'ALL' | Severity;

const filter = ref<FilterValue>('ALL');

watch(
  () => props.report?.zipInspection,
  () => {
    filter.value = 'ALL';
  },
);

const filteredFindings = computed(() => {
  if (!props.report) return [];
  if (filter.value === 'ALL') return props.report.findings;
  return props.report.findings.filter((f) => f.severity === filter.value);
});

const SEVERITY_LABEL: Readonly<Record<Severity, string>> = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
};

const SEVERITY_ACCENT: Readonly<Record<Severity, string>> = {
  ERROR: 'border-l-red-500 bg-red-950/15',
  WARN: 'border-l-amber-400 bg-amber-950/15',
  INFO: 'border-l-sky-400 bg-sky-950/15',
};

const SEVERITY_BADGE: Readonly<Record<Severity, string>> = {
  ERROR: 'border-red-700/80 bg-red-950 text-red-100',
  WARN: 'border-amber-700/80 bg-amber-950 text-amber-100',
  INFO: 'border-sky-700/80 bg-sky-950 text-sky-100',
};

function handleFilterChange(val: unknown): void {
  if (val === 'ALL' || val === 'ERROR' || val === 'WARN' || val === 'INFO') {
    filter.value = val;
  }
}
</script>

<template>
  <section
    v-if="!report"
    aria-labelledby="findings-heading"
    class="flex h-full min-h-[260px] flex-col items-center justify-center p-8 text-center"
  >
    <FileCheck2 aria-hidden="true" class="h-8 w-8 text-[#525260]" />
    <h2 id="findings-heading" class="mt-3 text-sm font-semibold text-foreground">
      Upload a <code>.zip</code> archive to start validating
    </h2>
    <p class="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
      Runs ZIP structure rules (<code>Z01–Z09</code>) and <code>pack.mcmeta</code> format rules (<code>M01–M10</code>) for Java Edition <code>1.21.1–26.3</code> locally in your browser.
    </p>
  </section>

  <section
    v-else
    aria-labelledby="findings-heading"
    class="flex h-full min-h-0 flex-col"
  >
    <!-- Flat Audit Toolbar Strip -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-[#0b0b0e] px-4 py-2.5">
      <div class="flex flex-wrap items-center gap-2.5">
        <h2 id="findings-heading" class="text-sm font-semibold text-foreground">
          Validation Report ({{ report.targetVersion }})
        </h2>

        <div
          role="status"
          aria-live="polite"
          :class="[
            'inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold',
            report.summary.errors === 0 ? 'text-emerald-300' : 'text-red-300',
          ]"
        >
          <CheckCircle2
            v-if="report.summary.errors === 0"
            aria-hidden="true"
            class="h-3.5 w-3.5"
          />
          <AlertCircle v-else aria-hidden="true" class="h-3.5 w-3.5" />
          <span>
            {{
              report.summary.errors === 0
                ? 'Passed with 0 ERRORS'
                : `${report.summary.errors} ERRORS found`
            }}
          </span>
        </div>
      </div>

      <ToggleGroup
        type="single"
        :model-value="filter"
        aria-label="Filter severity level"
        class="gap-1"
        @update:model-value="handleFilterChange"
      >
        <ToggleGroupItem
          value="ALL"
          class="h-7 px-2 font-mono text-[11px] data-[state=on]:bg-accent data-[state=on]:text-foreground"
        >
          All ({{ report.findings.length }})
        </ToggleGroupItem>
        <ToggleGroupItem
          value="ERROR"
          class="h-7 px-2 font-mono text-[11px] data-[state=on]:bg-red-950/70 data-[state=on]:text-red-200"
        >
          Error ({{ report.summary.errors }})
        </ToggleGroupItem>
        <ToggleGroupItem
          value="WARN"
          class="h-7 px-2 font-mono text-[11px] data-[state=on]:bg-amber-950/70 data-[state=on]:text-amber-200"
        >
          Warn ({{ report.summary.warns }})
        </ToggleGroupItem>
        <ToggleGroupItem
          value="INFO"
          class="h-7 px-2 font-mono text-[11px] data-[state=on]:bg-sky-950/70 data-[state=on]:text-sky-200"
        >
          Info ({{ report.summary.infos }})
        </ToggleGroupItem>
      </ToggleGroup>
    </div>

    <ScrollArea class="min-h-0 flex-1">
      <!-- Detected Plugin Bundle / Nested Vanilla ZIP Helper Strip -->
      <div
        v-if="hasPluginBundleSignals"
        class="border-b border-border bg-[#0e0e14] px-4 py-3"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Detected Ecosystems:
            </span>
            <Badge
              v-for="eco in report.zipInspection.pluginBundle.ecosystems"
              :key="eco"
              variant="outline"
              class="h-5 border-primary/50 bg-primary/10 px-1.5 font-mono text-[10px] text-[#ff8f6b]"
            >
              {{ eco === 'itemsadder' ? 'ItemsAdder' : eco === 'oraxen' ? 'Oraxen' : 'Nexo' }}
            </Badge>
            <Badge
              v-if="report.zipInspection.pluginBundle.nestedZipPaths.length > 0"
              variant="secondary"
              class="h-5 px-1.5 font-mono text-[10px]"
            >
              {{ report.zipInspection.pluginBundle.nestedZipPaths.length }} Nested Vanilla ZIP
            </Badge>
          </div>
          <span class="font-mono text-[10px] text-muted-foreground">
            Nexo external_packs / ItemsAdder / Oraxen
          </span>
        </div>

        <div
          v-if="report.zipInspection.pluginBundle.nestedZipPaths.length > 0"
          class="mt-2.5 flex flex-wrap items-center gap-2"
        >
          <Button
            v-for="nestedPath in report.zipInspection.pluginBundle.nestedZipPaths"
            :key="nestedPath"
            type="button"
            variant="outline"
            size="sm"
            class="h-7 gap-1.5 px-2.5 font-mono text-[11px]"
            @click="emit('inspectNestedZip', nestedPath)"
          >
            <FileArchive aria-hidden="true" class="h-3.5 w-3.5 text-primary" />
            <span>Inspect Nested Pack: {{ nestedPath.split('/').pop() }}</span>
          </Button>
        </div>
      </div>

      <p
        v-if="filteredFindings.length === 0"
        class="px-4 py-6 text-xs text-muted-foreground"
      >
        No findings matching filter <strong class="text-foreground">{{ filter }}</strong>.
      </p>

      <!-- Flat Hairline-Divided Findings List -->
      <ul v-else class="divide-y divide-border/60">
        <li
          v-for="(finding, idx) in filteredFindings"
          :key="`${finding.id}-${idx}`"
          :class="['border-l-2 px-4 py-3.5', SEVERITY_ACCENT[finding.severity]]"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                :class="['h-5 gap-1 px-1.5 font-mono text-[10px]', SEVERITY_BADGE[finding.severity]]"
              >
                <AlertCircle v-if="finding.severity === 'ERROR'" aria-hidden="true" class="h-3 w-3" />
                <AlertTriangle v-else-if="finding.severity === 'WARN'" aria-hidden="true" class="h-3 w-3" />
                <Info v-else aria-hidden="true" class="h-3 w-3" />
                <span>{{ SEVERITY_LABEL[finding.severity] }}</span>
              </Badge>
              <code class="bg-[#181820] px-1.5 py-0.5 text-xs font-semibold text-foreground">
                {{ finding.id }}
              </code>
              <h3 class="text-sm font-semibold text-foreground">
                {{ finding.title }}
              </h3>
            </div>
            <span class="font-mono text-[11px] text-muted-foreground">
              {{ finding.docRef }}
            </span>
          </div>

          <p class="mt-2 text-xs leading-relaxed text-secondary-foreground">
            {{ finding.message }}
          </p>

          <p class="mt-2 border-l border-border pl-2.5 text-xs leading-relaxed text-[#ff8f6b]">
            <strong class="text-foreground">Fix: </strong>{{ finding.fixHint }}
          </p>

          <ul
            v-if="finding.paths && finding.paths.length > 0"
            class="mt-2 list-disc space-y-0.5 pl-5 font-mono text-[11px] text-muted-foreground"
          >
            <li v-for="item in finding.paths" :key="item" class="break-all">
              {{ item }}
            </li>
          </ul>
        </li>
      </ul>
    </ScrollArea>
  </section>
</template>
