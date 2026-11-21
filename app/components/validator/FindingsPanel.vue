<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faFileCircleCheck,
  faFileZipper,
  faFolderOpen,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { Severity, ValidationReport } from '@core/types.ts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  WARN: 'PERINGATAN',
  INFO: 'INFO',
};

const SEVERITY_ACCENT: Readonly<Record<Severity, string>> = {
  ERROR: 'border-l-[#e05252] bg-[#e05252]/5',
  WARN: 'border-l-[#f59e0b] bg-[#f59e0b]/5',
  INFO: 'border-l-[#38bdf8] bg-[#38bdf8]/5',
};

const SEVERITY_BADGE: Readonly<Record<Severity, string>> = {
  ERROR: 'border-[#e05252]/60 bg-[#e05252]/20 text-[#ff6b6b]',
  WARN: 'border-[#f59e0b]/60 bg-[#f59e0b]/20 text-[#fbbf24]',
  INFO: 'border-[#38bdf8]/60 bg-[#38bdf8]/20 text-[#38bdf8]',
};

interface FilterTab {
  readonly value: FilterValue;
  readonly label: string;
  readonly count: number;
}

const filterTabs = computed<readonly FilterTab[]>(() => {
  if (!props.report) return [];
  return [
    { value: 'ALL', label: 'Semua', count: props.report.findings.length },
    { value: 'ERROR', label: 'Error', count: props.report.summary.errors },
    { value: 'WARN', label: 'Peringatan', count: props.report.summary.warns },
    { value: 'INFO', label: 'Info', count: props.report.summary.infos },
  ];
});

function selectFilter(val: FilterValue): void {
  filter.value = val;
}
</script>

<template>
  <!-- Empty State when no report -->
  <section
    v-if="!report"
    aria-labelledby="findings-heading"
    class="flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center"
  >
    <div class="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-xs">
      <FontAwesomeIcon :icon="faFileCircleCheck" aria-hidden="true" class="h-6 w-6 text-primary/80" />
    </div>
    <h2 id="findings-heading" class="mt-3.5 text-sm font-semibold tracking-tight text-foreground">
      Belum Ada Berkas yang Diperiksa
    </h2>
    <p class="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
      Pilih atau letakkan berkas .zip resource pack di panel sebelah kiri untuk melihat laporan struktur arsip, kesesuaian deklarasi pack.mcmeta, dan hash server.
    </p>
    <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
      <span class="rounded-full border border-border/70 bg-card px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
        Pemrosesan Lokal di Browser
      </span>
      <span class="rounded-full border border-border/70 bg-card px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
        Tanpa Unggah ke Server
      </span>
      <span class="rounded-full border border-border/70 bg-card px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
        Java 1.21.1–26.3
      </span>
    </div>
  </section>

  <!-- Active Audit Report Screen -->
  <section
    v-else
    aria-labelledby="findings-heading"
    class="flex h-full min-h-0 flex-col"
  >
    <!-- Flat Audit Toolbar Strip -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/90 px-4 py-2.5">
      <div class="flex flex-wrap items-center gap-3">
        <h2 id="findings-heading" class="text-sm font-semibold tracking-tight text-foreground">
          Laporan Validasi ({{ report.targetVersion }})
        </h2>

        <!-- Status Summary Badge -->
        <div
          role="status"
          aria-live="polite"
          :class="[
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold',
            report.summary.errors === 0
              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
              : 'border-[#e05252]/40 bg-[#e05252]/15 text-[#ff6b6b]',
          ]"
        >
          <FontAwesomeIcon
            v-if="report.summary.errors === 0"
            :icon="faCircleCheck"
            aria-hidden="true"
            class="h-3 w-3"
          />
          <FontAwesomeIcon
            v-else
            :icon="faCircleExclamation"
            aria-hidden="true"
            class="h-3 w-3"
          />
          <span>
            {{
              report.summary.errors === 0
                ? 'Lolos Pemeriksaan (0 Masalah)'
                : `${report.summary.errors} Masalah Ditemukan`
            }}
          </span>
        </div>
      </div>

      <!-- Filter Tabs with Sharp Active States & Clean Count Badges -->
      <div
        role="tablist"
        aria-label="Filter tingkat keparahan"
        class="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/80 p-1"
      >
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          type="button"
          role="tab"
          :aria-selected="filter === tab.value"
          :class="[
            'touch-target-expand inline-flex min-h-[30px] cursor-pointer items-center rounded-md px-2.5 py-1 font-mono text-xs transition-all duration-100 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-primary',
            filter === tab.value
              ? tab.value === 'ERROR'
                ? 'border border-[#e05252] bg-[#e05252] text-white font-semibold shadow-xs'
                : tab.value === 'WARN'
                  ? 'border border-[#f59e0b] bg-[#f59e0b] text-[#1e1f29] font-bold shadow-xs'
                  : tab.value === 'INFO'
                    ? 'border border-[#38bdf8] bg-[#38bdf8] text-[#1e1f29] font-bold shadow-xs'
                    : 'border border-border bg-elevated text-foreground font-semibold shadow-xs'
              : 'border border-transparent text-muted-foreground hover:bg-elevated/60 hover:text-foreground',
          ]"
          @click="selectFilter(tab.value)"
        >
          <span>{{ tab.label }}</span>
          <span
            :class="[
              'ml-1.5 rounded-full px-1.5 py-0.2 font-mono text-[10px] tabular-nums',
              filter === tab.value
                ? 'bg-black/20 text-inherit font-bold'
                : 'bg-background/80 text-muted-foreground',
            ]"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- Scrollable Findings Content Area -->
    <ScrollArea class="min-h-0 flex-1">
      <!-- Detected Plugin Bundle / Nested Vanilla ZIP Strip -->
      <div
        v-if="hasPluginBundleSignals"
        class="border-b border-border bg-card/80 px-4 py-3"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Format Plugin Terdeteksi:
            </span>
            <Badge
              v-for="eco in report.zipInspection.pluginBundle.ecosystems"
              :key="eco"
              variant="outline"
              class="h-5 border-primary/50 bg-primary/10 px-2 font-mono text-[10px] text-primary"
            >
              {{ eco === 'itemsadder' ? 'ItemsAdder' : eco === 'oraxen' ? 'Oraxen' : 'Nexo' }}
            </Badge>
            <Badge
              v-if="report.zipInspection.pluginBundle.nestedZipPaths.length > 0"
              variant="secondary"
              class="h-5 bg-muted px-2 font-mono text-[10px] text-foreground"
            >
              {{ report.zipInspection.pluginBundle.nestedZipPaths.length }} Paket ZIP di Dalam Arsip
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
            class="h-8 min-h-[32px] gap-2 rounded-md border-border bg-background px-3 font-mono text-[11px] active:scale-[0.96] transition-transform duration-100 ease-out"
            @click="emit('inspectNestedZip', nestedPath)"
          >
            <FontAwesomeIcon :icon="faFileZipper" aria-hidden="true" class="h-3.5 w-3.5 text-primary" />
            <span>Periksa Berkas Bersarang: {{ nestedPath.split('/').pop() }}</span>
          </Button>
        </div>
      </div>

      <!-- Zero findings matching active filter -->
      <div
        v-if="filteredFindings.length === 0"
        class="flex flex-col items-center justify-center px-4 py-12 text-center"
      >
        <p class="font-mono text-xs text-muted-foreground">
          Tidak ada temuan dengan filter <strong class="font-semibold text-foreground">{{ filter }}</strong>.
        </p>
      </div>

      <!-- Structured Findings List -->
      <ul v-else class="divide-y divide-border/60">
        <li
          v-for="(finding, idx) in filteredFindings"
          :key="`${finding.id}-${idx}`"
          :class="['border-l-4 p-4 transition-colors', SEVERITY_ACCENT[finding.severity]]"
        >
          <!-- Top Row: Severity Badge + Rule ID + Title + DocRef -->
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <span
                :class="[
                  'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide',
                  SEVERITY_BADGE[finding.severity],
                ]"
              >
                <FontAwesomeIcon
                  v-if="finding.severity === 'ERROR'"
                  :icon="faCircleExclamation"
                  aria-hidden="true"
                  class="h-3 w-3"
                />
                <FontAwesomeIcon
                  v-else-if="finding.severity === 'WARN'"
                  :icon="faTriangleExclamation"
                  aria-hidden="true"
                  class="h-3 w-3"
                />
                <FontAwesomeIcon
                  v-else
                  :icon="faCircleInfo"
                  aria-hidden="true"
                  class="h-3 w-3"
                />
                <span>{{ SEVERITY_LABEL[finding.severity] }}</span>
              </span>

              <code class="rounded border border-border/80 bg-elevated/90 px-2 py-0.5 font-mono text-xs font-bold text-foreground tabular-nums">
                {{ finding.id }}
              </code>

              <h3 class="text-sm font-semibold tracking-tight text-foreground">
                {{ finding.title }}
              </h3>
            </div>

            <span class="ml-auto shrink-0 rounded border border-border/50 bg-background/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground/80">
              {{ finding.docRef }}
            </span>
          </div>

          <!-- Description message -->
          <p class="mt-2.5 text-xs leading-relaxed text-secondary-foreground text-pretty">
            {{ finding.message }}
          </p>

          <!-- Remediation hint in clear Indonesian typography -->
          <div class="mt-3 flex items-start gap-2.5 rounded-md border border-primary/25 bg-primary/10 p-3">
            <div class="mt-0.5 shrink-0 rounded border border-primary/30 bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
              Petunjuk Perbaikan
            </div>
            <p class="text-xs leading-relaxed text-foreground font-normal">
              {{ finding.fixHint }}
            </p>
          </div>

          <!-- File paths in crisp monospace with clear path contrast -->
          <div
            v-if="finding.paths && finding.paths.length > 0"
            class="mt-3 space-y-1.5"
          >
            <div class="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <FontAwesomeIcon :icon="faFolderOpen" aria-hidden="true" class="h-3 w-3 text-muted-foreground/70" />
              <span>Berkas Terkait ({{ finding.paths.length }}):</span>
            </div>
            <div class="max-h-36 overflow-y-auto rounded-md border border-border/60 bg-background/80 p-2 space-y-1">
              <div
                v-for="item in finding.paths"
                :key="item"
                class="flex items-center gap-1.5 font-mono text-[11px] text-[#e2e8f0] select-all"
              >
                <span class="text-muted-foreground/60 select-none">/</span>
                <span class="break-all font-medium text-foreground">{{ item }}</span>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </ScrollArea>
  </section>
</template>
