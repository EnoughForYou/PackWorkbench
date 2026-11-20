<script setup lang="ts">
import { computed, ref } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faArrowRight,
  faBoxArchive,
  faChevronDown,
  faChevronRight,
  faCircleCheck,
  faFileZipper,
  faFolderOpen,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { buildProjectSnippets } from '@core/font/packBuilder.ts';
import { normalizeFontName } from '@core/font/puaAllocator.ts';
import type { Severity } from '@core/types.ts';
import { useWorkbenchStore } from '@/stores/workbenchStore';
import CopyButton from '@/components/shared/CopyButton.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const store = useWorkbenchStore();

type ValidationSubTab = 'audit' | 'deploy' | 'config';
type DeployPlatform = 'luckperms' | 'itemsadder' | 'oraxen' | 'nexo';

const activeSubTab = ref<ValidationSubTab>('audit');
const findingFilter = ref<'ALL' | Severity>('ALL');
const deployPlatform = ref<DeployPlatform>('luckperms');
const objectSectionOpen = ref(false);
const infoDetailsOpen = ref(false);

const snippets = computed(() => buildProjectSnippets(store.fontProject));
const cleanNamespace = computed(
  () => (store.fontProject.namespace || 'mypack').trim().toLowerCase() || 'mypack',
);
const cleanFontName = computed(() => normalizeFontName(store.fontProject.fontName));

const problemFindings = computed(() =>
  store.validation.findings.filter((f) => f.severity !== 'INFO'),
);
const infoFindings = computed(() =>
  store.validation.findings.filter((f) => f.severity === 'INFO'),
);

const visibleProblemFindings = computed(() => {
  if (findingFilter.value === 'INFO') return [];
  if (findingFilter.value === 'ALL') return problemFindings.value;
  return problemFindings.value.filter((f) => f.severity === findingFilter.value);
});

const visibleInfoFindings = computed(() => {
  if (findingFilter.value === 'ERROR' || findingFilter.value === 'WARN') return [];
  return infoFindings.value;
});

const activeYamlText = computed(() => {
  if (deployPlatform.value === 'itemsadder') return snippets.value.pluginYaml.itemsAdderYaml;
  if (deployPlatform.value === 'oraxen') return snippets.value.pluginYaml.oraxenYaml;
  return snippets.value.pluginYaml.nexoYaml;
});

const SEVERITY_BADGE: Readonly<Record<Severity, string>> = {
  ERROR: 'border-red-700/80 bg-red-950 text-red-100',
  WARN: 'border-amber-700/80 bg-amber-950 text-amber-100',
  INFO: 'border-sky-700/80 bg-sky-950 text-sky-100',
};

function handleSubTabChange(val: string | number): void {
  if (val === 'audit' || val === 'deploy' || val === 'config') {
    activeSubTab.value = val;
  }
}

function handleFilterChange(val: unknown): void {
  if (val === 'ALL' || val === 'ERROR' || val === 'WARN' || val === 'INFO') {
    findingFilter.value = val;
    if (val === 'INFO') {
      infoDetailsOpen.value = true;
    }
  }
}

function handleDeployPlatformChange(val: string | number): void {
  if (val === 'luckperms' || val === 'itemsadder' || val === 'oraxen' || val === 'nexo') {
    deployPlatform.value = val;
  }
}

function resolveEntryLabel(entryId: string | undefined): string {
  if (!entryId) return 'Entry';
  return store.fontProject.entries.find((e) => e.id === entryId)?.label ?? 'Entry';
}

function jumpToEntry(entryId: string): void {
  store.selectedStudioEntryId = entryId;
  store.inspectorTab = 'properties';
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- Top Compact Health Summary + 3 Focus Sub-Tabs -->
    <div class="shrink-0 border-b border-border bg-card">
      <div class="flex items-center justify-between gap-2 px-3 py-2">
        <div class="flex min-w-0 items-center gap-2">
          <FontAwesomeIcon
            v-if="store.validation.errors > 0"
            :icon="faTriangleExclamation"
            class="h-4 w-4 shrink-0 text-destructive"
          />
          <FontAwesomeIcon
            v-else-if="store.validation.warns > 0"
            :icon="faTriangleExclamation"
            class="h-4 w-4 shrink-0 text-amber-400"
          />
          <FontAwesomeIcon
            v-else
            :icon="faCircleCheck"
            class="h-4 w-4 shrink-0 text-emerald-400"
          />
          <div class="min-w-0">
            <p class="truncate text-xs font-semibold text-foreground">
              {{
                store.validation.errors > 0
                  ? `${store.validation.errors} Kesalahan Perlu Diperbaiki`
                  : store.validation.warns > 0
                    ? `Siap Diekspor (${store.validation.warns} Peringatan)`
                    : 'Paket Valid · Siap Diekspor'
              }}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1.5 font-mono text-[10px] tabular-nums">
          <span :class="store.validation.errors > 0 ? 'text-red-300 font-semibold' : 'text-muted-foreground'">
            E:{{ store.validation.errors }}
          </span>
          <span :class="store.validation.warns > 0 ? 'text-amber-300 font-semibold' : 'text-muted-foreground'">
            W:{{ store.validation.warns }}
          </span>
          <span class="text-sky-300/90">I:{{ store.validation.infos }}</span>
        </div>
      </div>

      <Tabs
        :model-value="activeSubTab"
        class="gap-0"
        @update:model-value="handleSubTabChange"
      >
        <TabsList class="grid h-8 w-full grid-cols-3 rounded-none border-t border-border/60 bg-card p-0">
          <TabsTrigger
            value="audit"
            class="relative h-8 rounded-none border-0 bg-transparent px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
          >
            Audit{{ problemFindings.length > 0 ? ` (${problemFindings.length})` : '' }}
          </TabsTrigger>
          <TabsTrigger
            value="deploy"
            class="relative h-8 rounded-none border-0 bg-transparent px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
          >
            Deploy &amp; YAML
          </TabsTrigger>
          <TabsTrigger
            value="config"
            class="relative h-8 rounded-none border-0 bg-transparent px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
          >
            Pengaturan Pack
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>

    <!-- Middle Focused Content -->
    <div class="min-h-0 flex-1 overflow-y-auto p-3">
      <!-- SUB-TAB 1: AUDIT -->
      <div v-if="activeSubTab === 'audit'" class="space-y-3">
        <ToggleGroup
          type="single"
          :model-value="findingFilter"
          aria-label="Saring temuan validasi font"
          class="grid w-full grid-cols-4 gap-1 rounded-sm border border-border bg-muted/80 p-0.5"
          @update:model-value="handleFilterChange"
        >
          <ToggleGroupItem
            value="ALL"
            class="h-6 whitespace-nowrap rounded-xs px-1 text-[10px] data-[state=on]:bg-card data-[state=on]:text-foreground"
          >
            Semua
          </ToggleGroupItem>
          <ToggleGroupItem
            value="ERROR"
            class="h-6 whitespace-nowrap rounded-xs px-1 text-[10px] data-[state=on]:bg-red-950/70 data-[state=on]:text-red-200"
          >
            Error ({{ store.validation.errors }})
          </ToggleGroupItem>
          <ToggleGroupItem
            value="WARN"
            class="h-6 whitespace-nowrap rounded-xs px-1 text-[10px] data-[state=on]:bg-amber-950/70 data-[state=on]:text-amber-200"
          >
            Warn ({{ store.validation.warns }})
          </ToggleGroupItem>
          <ToggleGroupItem
            value="INFO"
            class="h-6 whitespace-nowrap rounded-xs px-1 text-[10px] data-[state=on]:bg-sky-950/70 data-[state=on]:text-sky-200"
          >
            Info ({{ store.validation.infos }})
          </ToggleGroupItem>
        </ToggleGroup>

        <!-- Clean Pass State -->
        <div
          v-if="visibleProblemFindings.length === 0 && findingFilter !== 'INFO'"
          class="space-y-2.5 rounded-md border border-emerald-800/60 bg-emerald-950/20 p-3"
        >
          <p class="text-xs font-medium text-emerald-200">
            {{
              findingFilter === 'ALL'
                ? 'Tidak ditemukan kesalahan atau peringatan pada aturan F01–F10.'
                : `Tidak ada temuan dengan tingkat keparahan ${findingFilter}.`
            }}
          </p>
          <p class="text-[11px] leading-relaxed text-muted-foreground">
            Namespace <code class="text-foreground font-mono">{{ cleanNamespace }}</code> · font
            <code class="text-foreground font-mono">{{ cleanFontName }}.json</code> siap diunduh atau disalin ke plugin server.
          </p>
          <div class="flex flex-wrap gap-1.5 pt-0.5">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              class="h-7 gap-1 rounded-sm px-2.5 text-[11px] transition-transform active:scale-[0.96]"
              @click="activeSubTab = 'deploy'"
            >
              <span>Salin Perintah &amp; YAML</span>
              <FontAwesomeIcon :icon="faArrowRight" class="h-3 w-3" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              class="h-7 rounded-sm px-2.5 text-[11px] transition-transform active:scale-[0.96]"
              @click="activeSubTab = 'config'"
            >
              Edit Pengaturan Pack
            </Button>
          </div>
        </div>

        <!-- Actionable Errors & Warnings -->
        <ul
          v-if="visibleProblemFindings.length > 0"
          class="divide-y divide-border/60 rounded-md border border-border/70 bg-card overflow-hidden"
        >
          <li
            v-for="(f, idx) in visibleProblemFindings"
            :key="`${f.id}-${idx}`"
            class="space-y-1.5 p-2.5 text-[11px]"
          >
            <div class="flex items-center justify-between gap-2">
              <Badge
                variant="outline"
                :class="['h-4 px-1.5 font-mono text-[9px] tabular-nums', SEVERITY_BADGE[f.severity]]"
              >
                {{ f.severity }} {{ f.id }}
              </Badge>
              <span class="truncate font-mono text-[10px] text-muted-foreground">
                {{ f.docRef }}
              </span>
            </div>
            <p class="font-medium text-foreground">{{ f.title }}</p>
            <p class="leading-relaxed text-muted-foreground">{{ f.message }}</p>
            <div class="flex items-center justify-between gap-2 pt-0.5">
              <p class="font-mono text-[10px] text-primary">
                Petunjuk: {{ f.fixHint }}
              </p>
              <Button
                v-if="f.entryId"
                type="button"
                size="sm"
                variant="outline"
                class="h-6 shrink-0 rounded-sm px-2 text-[10px] transition-transform active:scale-[0.96]"
                @click="jumpToEntry(f.entryId)"
              >
                Edit {{ resolveEntryLabel(f.entryId) }}
              </Button>
            </div>
          </li>
        </ul>

        <!-- Collapsible Low-Noise Technical Info Notes -->
        <details
          v-if="visibleInfoFindings.length > 0"
          :open="infoDetailsOpen"
          class="rounded-md border border-border/60 bg-card overflow-hidden"
          @toggle="infoDetailsOpen = ($event.target as HTMLDetailsElement).open"
        >
          <summary class="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground">
            <FontAwesomeIcon
              :icon="faChevronRight"
              :class="['h-3.5 w-3.5 shrink-0 transition-transform', infoDetailsOpen ? 'rotate-90 text-foreground' : '']"
            />
            <span>Catatan Teknis &amp; Info ({{ visibleInfoFindings.length }})</span>
          </summary>
          <ul class="divide-y divide-border/50 border-t border-border/60">
            <li
              v-for="(f, idx) in visibleInfoFindings"
              :key="`${f.id}-info-${idx}`"
              class="space-y-1 p-2.5 text-[11px]"
            >
              <div class="flex items-center justify-between gap-1.5">
                <Badge
                  variant="outline"
                  :class="['h-4 px-1 font-mono text-[9px] tabular-nums', SEVERITY_BADGE[f.severity]]"
                >
                  {{ f.severity }} {{ f.id }}
                </Badge>
                <span class="truncate font-mono text-[10px] text-muted-foreground">
                  {{ f.docRef }}
                </span>
              </div>
              <p class="font-medium text-foreground">{{ f.title }}</p>
              <p class="leading-relaxed text-muted-foreground">{{ f.message }}</p>
              <p class="font-mono text-[10px] text-primary">
                Catatan: {{ f.fixHint }}
              </p>
            </li>
          </ul>
        </details>
      </div>

      <!-- SUB-TAB 2: DEPLOY & PLUGIN YAML -->
      <div v-else-if="activeSubTab === 'deploy'" class="space-y-3">
        <Tabs
          :model-value="deployPlatform"
          class="gap-2"
          @update:model-value="handleDeployPlatformChange"
        >
          <TabsList class="grid h-8 w-full grid-cols-4 gap-0 rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="luckperms"
              class="relative h-8 rounded-none border-0 bg-transparent px-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
            >
              LuckPerms
            </TabsTrigger>
            <TabsTrigger
              value="itemsadder"
              class="relative h-8 rounded-none border-0 bg-transparent px-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
            >
              ItemsAdder
            </TabsTrigger>
            <TabsTrigger
              value="oraxen"
              class="relative h-8 rounded-none border-0 bg-transparent px-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
            >
              Oraxen
            </TabsTrigger>
            <TabsTrigger
              value="nexo"
              class="relative h-8 rounded-none border-0 bg-transparent px-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
            >
              Nexo
            </TabsTrigger>
          </TabsList>

          <!-- LuckPerms & Vanilla Tab -->
          <TabsContent value="luckperms" class="mt-1 space-y-3 outline-none">
            <div class="flex items-start gap-2 rounded-sm border border-border/70 bg-muted/80 p-2 text-[11px] text-muted-foreground">
              <FontAwesomeIcon :icon="faFolderOpen" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <p class="leading-snug">
                Gunakan <strong class="text-foreground">Unduh Java Pack</strong> untuk
                Minecraft Vanilla, <code class="text-foreground font-mono">server.properties</code>, atau
                <code class="text-foreground font-mono">plugins/Nexo/pack/external_packs/</code>.
              </p>
            </div>

            <div class="grid grid-cols-[1fr_76px] gap-1.5">
              <div>
                <Label for="lp-group-input" class="mb-1 block text-[10px] font-medium text-foreground">
                  Grup LuckPerms
                </Label>
                <Input
                  id="lp-group-input"
                  type="text"
                  placeholder="admin"
                  :model-value="store.fontProject.luckPermsGroup"
                  class="h-7 rounded-sm bg-muted/80 px-2 font-mono text-xs text-foreground"
                  @update:model-value="
                    store.updateProject((prev) => ({
                      ...prev,
                      luckPermsGroup: String($event ?? ''),
                    }))
                  "
                />
              </div>
              <div>
                <Label for="lp-weight-input" class="mb-1 block text-[10px] font-medium text-foreground">
                  Bobot
                </Label>
                <Input
                  id="lp-weight-input"
                  type="number"
                  :model-value="store.fontProject.luckPermsWeight"
                  class="h-7 rounded-sm bg-muted/80 px-2 font-mono text-xs tabular-nums text-foreground"
                  @update:model-value="
                    store.updateProject((prev) => ({
                      ...prev,
                      luckPermsWeight: Number.parseInt(String($event ?? '0'), 10) || 0,
                    }))
                  "
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-medium text-foreground">Perintah Set Prefix</span>
                <div class="flex items-center gap-1">
                  <CopyButton
                    compact
                    target-id="lp-prefix-raw-ref"
                    :text-to-copy="snippets.prefixLiteral"
                    label="Hanya Prefiks"
                  />
                  <CopyButton
                    compact
                    target-id="lp-snippet-code"
                    :text-to-copy="snippets.luckPermsCommand"
                    label="Salin /lp"
                  />
                </div>
              </div>
              <pre class="overflow-x-auto rounded-sm bg-background p-2 font-mono text-[10px] text-foreground"><code id="lp-snippet-code">{{ snippets.luckPermsCommand }}</code></pre>
              <span id="lp-prefix-raw-ref" class="sr-only">{{ snippets.prefixLiteral }}</span>
              <p class="text-[10px] leading-snug text-muted-foreground">
                Karakter PUA (<code class="text-primary font-mono">{{ snippets.prefixEscaped || '—' }}</code>) tampak kosong di peramban karena memetakan slot resource-pack pribadi.
              </p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-medium text-foreground">PlaceholderAPI &amp; /tellraw</span>
                <CopyButton
                  compact
                  target-id="tellraw-snippet-code"
                  :text-to-copy="snippets.objectTellrawCommand ?? snippets.tellrawCommand"
                  label="Salin /tellraw"
                />
              </div>
              <p class="font-mono text-[10px] text-primary">{{ snippets.placeholderApi }}</p>
              <pre class="overflow-x-auto rounded-sm bg-background p-2 font-mono text-[10px] text-foreground"><code id="tellraw-snippet-code">{{ snippets.objectTellrawCommand ?? snippets.tellrawCommand }}</code></pre>
            </div>
          </TabsContent>

          <!-- ItemsAdder / Oraxen / Nexo Unified YAML Panels -->
          <TabsContent value="itemsadder" class="mt-1 space-y-2.5 outline-none">
            <div class="flex items-start gap-2 rounded-sm border border-border/70 bg-muted/80 p-2 text-[11px] text-muted-foreground">
              <FontAwesomeIcon :icon="faFolderOpen" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <p class="leading-snug">
                Simpan ke <code class="text-foreground font-mono">plugins/ItemsAdder/data/items_packs/{{ cleanNamespace }}/font_images.yml</code> + PNG ke <code class="text-foreground font-mono">resource_pack/</code>, lalu jalankan <code class="text-primary font-mono">/iareload</code> &amp; <code class="text-primary font-mono">/iazip</code>.
              </p>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-medium text-foreground">YAML font_images</span>
              <CopyButton
                compact
                target-id="plugin-yaml-itemsadder"
                :text-to-copy="activeYamlText"
                label="Salin YAML"
              />
            </div>
            <pre class="max-h-56 overflow-auto rounded-sm bg-background p-2 font-mono text-[10px] leading-relaxed text-foreground"><code id="plugin-yaml-itemsadder">{{ snippets.pluginYaml.itemsAdderYaml }}</code></pre>
          </TabsContent>

          <TabsContent value="oraxen" class="mt-1 space-y-2.5 outline-none">
            <div class="flex items-start gap-2 rounded-sm border border-border/70 bg-muted/80 p-2 text-[11px] text-muted-foreground">
              <FontAwesomeIcon :icon="faFolderOpen" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <p class="leading-snug">
                Simpan ke <code class="text-foreground font-mono">plugins/Oraxen/glyphs/{{ cleanNamespace }}.yml</code> + PNG ke <code class="text-foreground font-mono">plugins/Oraxen/pack/textures/</code>, lalu jalankan <code class="text-primary font-mono">/o reload all</code>.
              </p>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-medium text-foreground">Oraxen glyphs YAML</span>
              <CopyButton
                compact
                target-id="plugin-yaml-oraxen"
                :text-to-copy="activeYamlText"
                label="Salin YAML"
              />
            </div>
            <pre class="max-h-56 overflow-auto rounded-sm bg-background p-2 font-mono text-[10px] leading-relaxed text-foreground"><code id="plugin-yaml-oraxen">{{ snippets.pluginYaml.oraxenYaml }}</code></pre>
          </TabsContent>

          <TabsContent value="nexo" class="mt-1 space-y-2.5 outline-none">
            <div class="flex items-start gap-2 rounded-sm border border-border/70 bg-muted/80 p-2 text-[11px] text-muted-foreground">
              <FontAwesomeIcon :icon="faFolderOpen" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <p class="leading-snug">
                Letakkan <code class="text-foreground font-mono">.zip</code> ke <code class="text-foreground font-mono">plugins/Nexo/pack/external_packs/</code> ATAU gunakan YAML <code class="text-foreground font-mono">plugins/Nexo/glyphs/{{ cleanNamespace }}.yml</code>, lalu jalankan <code class="text-primary font-mono">/nexo reload</code> &amp; <code class="text-primary font-mono">/nexo pack</code>.
              </p>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-medium text-foreground">Nexo glyphs YAML</span>
              <CopyButton
                compact
                target-id="plugin-yaml-nexo"
                :text-to-copy="activeYamlText"
                label="Salin YAML"
              />
            </div>
            <pre class="max-h-56 overflow-auto rounded-sm bg-background p-2 font-mono text-[10px] leading-relaxed text-foreground"><code id="plugin-yaml-nexo">{{ snippets.pluginYaml.nexoYaml }}</code></pre>
          </TabsContent>
        </Tabs>
      </div>

      <!-- SUB-TAB 3: PACK SETTINGS & OBJECT COMPONENT -->
      <div v-else class="space-y-3.5">
        <div class="space-y-2.5">
          <p class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Identitas Resource Pack
          </p>

          <div class="grid grid-cols-[88px_1fr] items-center gap-2">
            <Label for="font-ns-input" class="text-[11px] font-medium text-foreground">
              Namespace
            </Label>
            <Input
              id="font-ns-input"
              type="text"
              :model-value="store.fontProject.namespace"
              class="h-7 rounded-sm bg-muted/80 px-2 font-mono text-xs text-foreground"
              @update:model-value="
                store.updateProject((prev) => ({
                  ...prev,
                  namespace: String($event ?? ''),
                }))
              "
            />
          </div>

          <div class="grid grid-cols-[88px_1fr] items-center gap-2">
            <Label for="font-name-input" class="text-[11px] font-medium text-foreground">
              Berkas Font
            </Label>
            <Input
              id="font-name-input"
              type="text"
              :model-value="store.fontProject.fontName"
              class="h-7 rounded-sm bg-muted/80 px-2 font-mono text-xs text-foreground"
              @update:model-value="
                store.updateProject((prev) => ({
                  ...prev,
                  fontName: String($event ?? ''),
                }))
              "
            />
          </div>

          <div class="grid grid-cols-[88px_1fr] items-center gap-2">
            <Label for="pack-desc-input" class="text-[11px] font-medium text-foreground">
              Deskripsi
            </Label>
            <Input
              id="pack-desc-input"
              type="text"
              :model-value="store.fontProject.packDescription"
              class="h-7 rounded-sm bg-muted/80 px-2 text-xs text-foreground"
              @update:model-value="
                store.updateProject((prev) => ({
                  ...prev,
                  packDescription: String($event ?? ''),
                }))
              "
            />
          </div>

          <div class="flex items-center justify-between gap-2 pt-0.5">
            <Label for="pack-include-png-switch" class="cursor-pointer text-[11px] font-normal text-foreground">
              Sertakan pack.png 16×16 sintetis
            </Label>
            <Switch
              id="pack-include-png-switch"
              :model-value="store.fontProject.includePackPng"
              @update:model-value="
                (val) =>
                  store.updateProject((prev) => ({
                    ...prev,
                    includePackPng: Boolean(val),
                  }))
              "
            />
          </div>
        </div>

        <Separator class="bg-border" />

        <Collapsible v-model:open="objectSectionOpen" class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <CollapsibleTrigger as-child>
              <button
                type="button"
                class="flex flex-1 cursor-pointer items-center gap-1.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <FontAwesomeIcon
                  :icon="faChevronDown"
                  :class="['h-3.5 w-3.5 transition-transform', objectSectionOpen ? 'rotate-180' : '']"
                />
                <span>Komponen Objek (1.21.9+)</span>
              </button>
            </CollapsibleTrigger>
            <Switch
              aria-label="Aktifkan komponen objek 1.21.9+"
              :model-value="store.fontProject.objectComponent.enabled"
              @update:model-value="
                (val) => {
                  const checked = Boolean(val);
                  if (checked) objectSectionOpen = true;
                  store.updateProject((prev) => ({
                    ...prev,
                    objectComponent: {
                      ...prev.objectComponent,
                      enabled: checked,
                    },
                  }));
                }
              "
            />
          </div>

          <CollapsibleContent class="space-y-2.5 pt-1">
            <ToggleGroup
              type="single"
              :model-value="store.fontProject.objectComponent.mode"
              class="grid w-full grid-cols-2 gap-1 rounded-sm border border-border bg-muted/80 p-0.5"
              @update:model-value="
                (val) => {
                  if (val === 'atlas' || val === 'player') {
                    store.updateProject((prev) => ({
                      ...prev,
                      objectComponent: { ...prev.objectComponent, mode: val },
                    }));
                  }
                }
              "
            >
              <ToggleGroupItem
                value="atlas"
                class="h-6 rounded-xs text-[11px] data-[state=on]:bg-card data-[state=on]:text-foreground"
              >
                atlas
              </ToggleGroupItem>
              <ToggleGroupItem
                value="player"
                class="h-6 rounded-xs text-[11px] data-[state=on]:bg-card data-[state=on]:text-foreground"
              >
                player
              </ToggleGroupItem>
            </ToggleGroup>

            <template v-if="store.fontProject.objectComponent.mode === 'atlas'">
              <div class="space-y-1">
                <Label for="obj-atlas-input" class="text-[10px] font-medium text-foreground">
                  Atlas (1.21.11+: items / blocks)
                </Label>
                <Input
                  id="obj-atlas-input"
                  type="text"
                  :model-value="store.fontProject.objectComponent.atlas"
                  class="h-7 rounded-sm bg-muted/80 px-2 font-mono text-xs text-foreground"
                  @update:model-value="
                    store.updateProject((prev) => ({
                      ...prev,
                      objectComponent: {
                        ...prev.objectComponent,
                        atlas: String($event ?? ''),
                      },
                    }))
                  "
                />
              </div>
              <div class="space-y-1">
                <Label for="obj-sprite-input" class="text-[10px] font-medium text-foreground">
                  Sprite
                </Label>
                <Input
                  id="obj-sprite-input"
                  type="text"
                  :model-value="store.fontProject.objectComponent.sprite"
                  class="h-7 rounded-sm bg-muted/80 px-2 font-mono text-xs text-foreground"
                  @update:model-value="
                    store.updateProject((prev) => ({
                      ...prev,
                      objectComponent: {
                        ...prev.objectComponent,
                        sprite: String($event ?? ''),
                      },
                    }))
                  "
                />
              </div>
            </template>

            <template v-else>
              <div class="space-y-1">
                <Label for="obj-player-input" class="text-[10px] font-medium text-foreground">
                  Nama Pemain (Head 8×8)
                </Label>
                <Input
                  id="obj-player-input"
                  type="text"
                  :model-value="store.fontProject.objectComponent.playerName"
                  class="h-7 rounded-sm bg-muted/80 px-2 font-mono text-xs text-foreground"
                  @update:model-value="
                    store.updateProject((prev) => ({
                      ...prev,
                      objectComponent: {
                        ...prev.objectComponent,
                        playerName: String($event ?? ''),
                      },
                    }))
                  "
                />
              </div>
              <div class="flex items-center gap-2">
                <Checkbox
                  id="obj-hat-checkbox"
                  :model-value="store.fontProject.objectComponent.hat"
                  aria-label="Render lapisan overlay topi (hat)"
                  @update:model-value="
                    (val) =>
                      store.updateProject((prev) => ({
                        ...prev,
                        objectComponent: {
                          ...prev.objectComponent,
                          hat: Boolean(val),
                        },
                      }))
                  "
                />
                <Label for="obj-hat-checkbox" class="cursor-pointer text-[11px] text-foreground">
                  Render lapisan overlay topi (hat)
                </Label>
              </div>
            </template>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>

    <!-- Pinned Export Footer -->
    <div class="shrink-0 space-y-2 border-t border-border bg-card p-3">
      <div class="grid grid-cols-1 gap-1.5">
        <Button
          type="button"
          :disabled="store.validation.errors > 0 || store.isExporting"
          class="h-8.5 w-full gap-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-[0.96]"
          @click="store.exportAndDownload()"
        >
          <FontAwesomeIcon :icon="faFileZipper" class="h-3.5 w-3.5" />
          <span>
            {{
              store.isExporting
                ? 'Menyusun & Validasi ZIP...'
                : store.validation.errors > 0
                  ? `Perbaiki ${store.validation.errors} Kesalahan untuk Ekspor`
                  : 'Unduh Paket Java / Nexo External (.zip)'
            }}
          </span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          :disabled="store.validation.errors > 0 || store.isExportingPluginBundle"
          class="h-8 w-full gap-1.5 rounded-md text-xs font-medium transition-transform active:scale-[0.96]"
          @click="store.exportPluginBundleAndDownload()"
        >
          <FontAwesomeIcon :icon="faBoxArchive" class="h-3.5 w-3.5" />
          <span>
            {{
              store.isExportingPluginBundle
                ? 'Mengemas Bundel Plugin...'
                : 'Unduh Bundel IA / Oraxen / Nexo (.zip)'
            }}
          </span>
        </Button>
      </div>

      <div
        v-if="store.isExporting || store.exportSha1State.status !== 'idle'"
        class="space-y-1.5"
      >
        <Progress
          :model-value="Math.round(store.exportSha1State.ratio * 100)"
          class="h-1.5"
        />

        <div
          v-if="store.lastBuiltPack"
          class="space-y-1 rounded-md border border-emerald-700/70 bg-emerald-950/25 px-2.5 py-2 text-[11px]"
        >
          <p class="font-mono text-[10px] font-semibold text-emerald-200 tabular-nums">
            Pemeriksaan Otomatis ({{ store.lastBuiltPack.zipValidation.targetVersion }}):
            {{ store.lastBuiltPack.zipValidation.summary.errors }} ERR ·
            {{ store.lastBuiltPack.zipValidation.summary.warns }} WARN
          </p>
          <div class="flex items-center justify-between gap-2">
            <code
              id="studio-export-sha1"
              class="truncate font-mono text-[10px] text-emerald-300"
            >
              {{ store.exportSha1State.sha1Hex ?? store.lastBuiltPack.sha1Hex }}
            </code>
            <CopyButton
              compact
              target-id="studio-export-sha1"
              :text-to-copy="store.exportSha1State.sha1Hex ?? store.lastBuiltPack.sha1Hex"
              label="SHA-1"
            />
          </div>
        </div>
      </div>

      <p class="text-[10px] leading-snug text-muted-foreground">
        Ekspor Java Edition saja · Rentang Bedrock PUA <code class="font-mono text-primary">U+E000–U+E1FF</code> dipantau secara otomatis.
      </p>
    </div>
  </div>
</template>
