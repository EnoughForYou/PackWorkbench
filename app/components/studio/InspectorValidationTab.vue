<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FolderOpen,
  Package,
} from '@lucide/vue';
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
    <div class="shrink-0 border-b border-border bg-[#0b0b0e]">
      <div class="flex items-center justify-between gap-2 px-3 py-2">
        <div class="flex min-w-0 items-center gap-2">
          <AlertTriangle
            v-if="store.validation.errors > 0"
            aria-hidden="true"
            class="h-4 w-4 shrink-0 text-red-400"
          />
          <AlertTriangle
            v-else-if="store.validation.warns > 0"
            aria-hidden="true"
            class="h-4 w-4 shrink-0 text-amber-400"
          />
          <CheckCircle2
            v-else
            aria-hidden="true"
            class="h-4 w-4 shrink-0 text-emerald-400"
          />
          <div class="min-w-0">
            <p class="truncate text-xs font-semibold text-foreground">
              {{
                store.validation.errors > 0
                  ? `${store.validation.errors} Errors to Fix`
                  : store.validation.warns > 0
                    ? `Ready to Export (${store.validation.warns} Warnings)`
                    : 'Pack Valid · Ready to Export'
              }}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1.5 font-mono text-[10px] tabular-nums">
          <span :class="store.validation.errors > 0 ? 'text-red-300' : 'text-muted-foreground'">
            E:{{ store.validation.errors }}
          </span>
          <span :class="store.validation.warns > 0 ? 'text-amber-300' : 'text-muted-foreground'">
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
        <TabsList class="grid h-8 w-full grid-cols-3 rounded-none border-t border-border/60 bg-[#0e0e12] p-0">
          <TabsTrigger
            value="audit"
            class="tab-underline relative h-8 rounded-none border-0 bg-transparent px-2 text-[11px] font-medium text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Audit{{ problemFindings.length > 0 ? ` (${problemFindings.length})` : '' }}
          </TabsTrigger>
          <TabsTrigger
            value="deploy"
            class="tab-underline relative h-8 rounded-none border-0 bg-transparent px-2 text-[11px] font-medium text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Deploy &amp; YAML
          </TabsTrigger>
          <TabsTrigger
            value="config"
            class="tab-underline relative h-8 rounded-none border-0 bg-transparent px-2 text-[11px] font-medium text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Pack Settings
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
          aria-label="Filter font findings by severity"
          class="grid w-full grid-cols-4 gap-1"
          @update:model-value="handleFilterChange"
        >
          <ToggleGroupItem
            value="ALL"
            class="h-6 whitespace-nowrap px-1 text-[10px] data-[state=on]:bg-accent data-[state=on]:text-foreground"
          >
            All
          </ToggleGroupItem>
          <ToggleGroupItem
            value="ERROR"
            class="h-6 whitespace-nowrap px-1 text-[10px] data-[state=on]:bg-red-950/70 data-[state=on]:text-red-200"
          >
            Error ({{ store.validation.errors }})
          </ToggleGroupItem>
          <ToggleGroupItem
            value="WARN"
            class="h-6 whitespace-nowrap px-1 text-[10px] data-[state=on]:bg-amber-950/70 data-[state=on]:text-amber-200"
          >
            Warn ({{ store.validation.warns }})
          </ToggleGroupItem>
          <ToggleGroupItem
            value="INFO"
            class="h-6 whitespace-nowrap px-1 text-[10px] data-[state=on]:bg-sky-950/70 data-[state=on]:text-sky-200"
          >
            Info ({{ store.validation.infos }})
          </ToggleGroupItem>
        </ToggleGroup>

        <!-- Clean Pass State -->
        <div
          v-if="visibleProblemFindings.length === 0 && findingFilter !== 'INFO'"
          class="space-y-2.5 border border-emerald-800/60 bg-emerald-950/20 p-3"
        >
          <p class="text-xs font-medium text-emerald-200">
            {{
              findingFilter === 'ALL'
                ? 'No errors or warnings detected across F01–F10.'
                : `No findings with severity ${findingFilter}.`
            }}
          </p>
          <p class="text-[11px] leading-relaxed text-muted-foreground">
            Namespace <code class="text-foreground">{{ cleanNamespace }}</code> · font
            <code class="text-foreground">{{ cleanFontName }}.json</code> is ready to download or copy into server plugins.
          </p>
          <div class="flex flex-wrap gap-1.5 pt-0.5">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              class="h-7 gap-1 px-2.5 text-[11px]"
              @click="activeSubTab = 'deploy'"
            >
              <span>Copy Commands &amp; YAML</span>
              <ArrowRight aria-hidden="true" class="h-3 w-3" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              class="h-7 px-2.5 text-[11px]"
              @click="activeSubTab = 'config'"
            >
              Edit Pack Settings
            </Button>
          </div>
        </div>

        <!-- Actionable Errors & Warnings -->
        <ul
          v-if="visibleProblemFindings.length > 0"
          class="divide-y divide-border/60 border border-border/70 bg-[#111116]"
        >
          <li
            v-for="(f, idx) in visibleProblemFindings"
            :key="`${f.id}-${idx}`"
            class="space-y-1.5 p-2.5 text-[11px]"
          >
            <div class="flex items-center justify-between gap-2">
              <Badge
                variant="outline"
                :class="['h-4 px-1.5 font-mono text-[9px]', SEVERITY_BADGE[f.severity]]"
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
              <p class="font-mono text-[10px] text-[#ff8f6b]">
                Fix: {{ f.fixHint }}
              </p>
              <Button
                v-if="f.entryId"
                type="button"
                size="sm"
                variant="outline"
                class="h-6 shrink-0 px-2 text-[10px]"
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
          class="border border-border/60 bg-[#0b0b0e]"
          @toggle="infoDetailsOpen = ($event.target as HTMLDetailsElement).open"
        >
          <summary class="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground">
            <ChevronRight
              aria-hidden="true"
              :class="['h-3.5 w-3.5 shrink-0 transition-transform', infoDetailsOpen ? 'rotate-90 text-foreground' : '']"
            />
            <span>Technical Notes &amp; Info ({{ visibleInfoFindings.length }})</span>
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
                  :class="['h-4 px-1 font-mono text-[9px]', SEVERITY_BADGE[f.severity]]"
                >
                  {{ f.severity }} {{ f.id }}
                </Badge>
                <span class="truncate font-mono text-[10px] text-muted-foreground">
                  {{ f.docRef }}
                </span>
              </div>
              <p class="font-medium text-foreground">{{ f.title }}</p>
              <p class="leading-relaxed text-muted-foreground">{{ f.message }}</p>
              <p class="font-mono text-[10px] text-[#ff8f6b]">
                Note: {{ f.fixHint }}
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
              class="tab-underline relative h-8 rounded-none border-0 bg-transparent px-1 text-[10px] font-medium text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              LuckPerms
            </TabsTrigger>
            <TabsTrigger
              value="itemsadder"
              class="tab-underline relative h-8 rounded-none border-0 bg-transparent px-1 text-[10px] font-medium text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              ItemsAdder
            </TabsTrigger>
            <TabsTrigger
              value="oraxen"
              class="tab-underline relative h-8 rounded-none border-0 bg-transparent px-1 text-[10px] font-medium text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Oraxen
            </TabsTrigger>
            <TabsTrigger
              value="nexo"
              class="tab-underline relative h-8 rounded-none border-0 bg-transparent px-1 text-[10px] font-medium text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Nexo
            </TabsTrigger>
          </TabsList>

          <!-- LuckPerms & Vanilla Tab -->
          <TabsContent value="luckperms" class="mt-1 space-y-3 outline-none">
            <div class="flex items-start gap-2 border border-border/70 bg-[#121218] p-2 text-[11px] text-muted-foreground">
              <FolderOpen aria-hidden="true" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff8f6b]" />
              <p class="leading-snug">
                Use <strong class="text-foreground">Download Java Pack</strong> for
                Minecraft Vanilla, <code class="text-foreground">server.properties</code>, or
                <code class="text-foreground">plugins/Nexo/pack/external_packs/</code>.
              </p>
            </div>

            <div class="grid grid-cols-[1fr_76px] gap-1.5">
              <div>
                <Label for="lp-group-input" class="mb-1 block text-[10px] text-muted-foreground">
                  LuckPerms Group
                </Label>
                <Input
                  id="lp-group-input"
                  type="text"
                  placeholder="admin"
                  :model-value="store.fontProject.luckPermsGroup"
                  class="h-7 bg-[#14141a] px-2 font-mono text-xs"
                  @update:model-value="
                    store.updateProject((prev) => ({
                      ...prev,
                      luckPermsGroup: String($event ?? ''),
                    }))
                  "
                />
              </div>
              <div>
                <Label for="lp-weight-input" class="mb-1 block text-[10px] text-muted-foreground">
                  Weight
                </Label>
                <Input
                  id="lp-weight-input"
                  type="number"
                  :model-value="store.fontProject.luckPermsWeight"
                  class="h-7 bg-[#14141a] px-2 font-mono text-xs tabular-nums"
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
                <span class="text-[11px] font-medium text-foreground">Set Prefix Command</span>
                <div class="flex items-center gap-1">
                  <CopyButton
                    compact
                    target-id="lp-prefix-raw-ref"
                    :text-to-copy="snippets.prefixLiteral"
                    label="Prefix Only"
                  />
                  <CopyButton
                    compact
                    target-id="lp-snippet-code"
                    :text-to-copy="snippets.luckPermsCommand"
                    label="Copy /lp"
                  />
                </div>
              </div>
              <pre class="overflow-x-auto bg-[#070709] p-2 font-mono text-[10px] text-foreground"><code id="lp-snippet-code">{{ snippets.luckPermsCommand }}</code></pre>
              <span id="lp-prefix-raw-ref" class="sr-only">{{ snippets.prefixLiteral }}</span>
              <p class="text-[10px] leading-snug text-muted-foreground">
                PUA characters (<code class="text-[#ff8f6b]">{{ snippets.prefixEscaped || '—' }}</code>) look like blank boxes in browsers because they map to private resource-pack slots.
              </p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-medium text-foreground">PlaceholderAPI &amp; /tellraw</span>
                <CopyButton
                  compact
                  target-id="tellraw-snippet-code"
                  :text-to-copy="snippets.objectTellrawCommand ?? snippets.tellrawCommand"
                  label="Copy /tellraw"
                />
              </div>
              <p class="font-mono text-[10px] text-[#ff8f6b]">{{ snippets.placeholderApi }}</p>
              <pre class="overflow-x-auto bg-[#070709] p-2 font-mono text-[10px] text-foreground"><code id="tellraw-snippet-code">{{ snippets.objectTellrawCommand ?? snippets.tellrawCommand }}</code></pre>
            </div>
          </TabsContent>

          <!-- ItemsAdder / Oraxen / Nexo Unified YAML Panels -->
          <TabsContent value="itemsadder" class="mt-1 space-y-2.5 outline-none">
            <div class="flex items-start gap-2 border border-border/70 bg-[#121218] p-2 text-[11px] text-muted-foreground">
              <FolderOpen aria-hidden="true" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff8f6b]" />
              <p class="leading-snug">
                Save to <code class="text-foreground">plugins/ItemsAdder/data/items_packs/{{ cleanNamespace }}/font_images.yml</code> + PNGs to <code class="text-foreground">resource_pack/</code>, then run <code class="text-[#ff8f6b]">/iareload</code> &amp; <code class="text-[#ff8f6b]">/iazip</code>.
              </p>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-medium text-foreground">YAML font_images</span>
              <CopyButton
                compact
                target-id="plugin-yaml-itemsadder"
                :text-to-copy="activeYamlText"
                label="Copy YAML"
              />
            </div>
            <pre class="max-h-56 overflow-auto bg-[#070709] p-2 font-mono text-[10px] leading-relaxed text-foreground"><code id="plugin-yaml-itemsadder">{{ snippets.pluginYaml.itemsAdderYaml }}</code></pre>
          </TabsContent>

          <TabsContent value="oraxen" class="mt-1 space-y-2.5 outline-none">
            <div class="flex items-start gap-2 border border-border/70 bg-[#121218] p-2 text-[11px] text-muted-foreground">
              <FolderOpen aria-hidden="true" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff8f6b]" />
              <p class="leading-snug">
                Save to <code class="text-foreground">plugins/Oraxen/glyphs/{{ cleanNamespace }}.yml</code> + PNGs to <code class="text-foreground">plugins/Oraxen/pack/textures/</code>, then run <code class="text-[#ff8f6b]">/o reload all</code>.
              </p>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-medium text-foreground">Oraxen glyphs YAML</span>
              <CopyButton
                compact
                target-id="plugin-yaml-oraxen"
                :text-to-copy="activeYamlText"
                label="Copy YAML"
              />
            </div>
            <pre class="max-h-56 overflow-auto bg-[#070709] p-2 font-mono text-[10px] leading-relaxed text-foreground"><code id="plugin-yaml-oraxen">{{ snippets.pluginYaml.oraxenYaml }}</code></pre>
          </TabsContent>

          <TabsContent value="nexo" class="mt-1 space-y-2.5 outline-none">
            <div class="flex items-start gap-2 border border-border/70 bg-[#121218] p-2 text-[11px] text-muted-foreground">
              <FolderOpen aria-hidden="true" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff8f6b]" />
              <p class="leading-snug">
                Drop <code class="text-foreground">.zip</code> into <code class="text-foreground">plugins/Nexo/pack/external_packs/</code> OR use YAML <code class="text-foreground">plugins/Nexo/glyphs/{{ cleanNamespace }}.yml</code>, then run <code class="text-[#ff8f6b]">/nexo reload</code> &amp; <code class="text-[#ff8f6b]">/nexo pack</code>.
              </p>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-medium text-foreground">Nexo glyphs YAML</span>
              <CopyButton
                compact
                target-id="plugin-yaml-nexo"
                :text-to-copy="activeYamlText"
                label="Copy YAML"
              />
            </div>
            <pre class="max-h-56 overflow-auto bg-[#070709] p-2 font-mono text-[10px] leading-relaxed text-foreground"><code id="plugin-yaml-nexo">{{ snippets.pluginYaml.nexoYaml }}</code></pre>
          </TabsContent>
        </Tabs>
      </div>

      <!-- SUB-TAB 3: PACK SETTINGS & OBJECT COMPONENT -->
      <div v-else class="space-y-3.5">
        <div class="space-y-2.5">
          <p class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Font Pack Identity
          </p>

          <div class="grid grid-cols-[88px_1fr] items-center gap-2">
            <Label for="font-ns-input" class="text-[11px] font-normal text-muted-foreground">
              Namespace
            </Label>
            <Input
              id="font-ns-input"
              type="text"
              :model-value="store.fontProject.namespace"
              class="h-7 bg-[#14141a] px-2 font-mono text-xs"
              @update:model-value="
                store.updateProject((prev) => ({
                  ...prev,
                  namespace: String($event ?? ''),
                }))
              "
            />
          </div>

          <div class="grid grid-cols-[88px_1fr] items-center gap-2">
            <Label for="font-name-input" class="text-[11px] font-normal text-muted-foreground">
              Font File
            </Label>
            <Input
              id="font-name-input"
              type="text"
              :model-value="store.fontProject.fontName"
              class="h-7 bg-[#14141a] px-2 font-mono text-xs"
              @update:model-value="
                store.updateProject((prev) => ({
                  ...prev,
                  fontName: String($event ?? ''),
                }))
              "
            />
          </div>

          <div class="grid grid-cols-[88px_1fr] items-center gap-2">
            <Label for="pack-desc-input" class="text-[11px] font-normal text-muted-foreground">
              Description
            </Label>
            <Input
              id="pack-desc-input"
              type="text"
              :model-value="store.fontProject.packDescription"
              class="h-7 bg-[#14141a] px-2 text-xs"
              @update:model-value="
                store.updateProject((prev) => ({
                  ...prev,
                  packDescription: String($event ?? ''),
                }))
              "
            />
          </div>

          <div class="flex items-center justify-between gap-2 pt-0.5">
            <Label for="pack-include-png-switch" class="cursor-pointer text-[11px] font-normal text-secondary-foreground">
              Include synthetic 16×16 pack.png
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

        <Separator />

        <Collapsible v-model:open="objectSectionOpen" class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <CollapsibleTrigger as-child>
              <button
                type="button"
                class="flex flex-1 cursor-pointer items-center gap-1.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <ChevronDown
                  aria-hidden="true"
                  :class="['h-3.5 w-3.5 transition-transform', objectSectionOpen ? 'rotate-180' : '']"
                />
                <span>Object Component (1.21.9+)</span>
              </button>
            </CollapsibleTrigger>
            <Switch
              aria-label="Enable 1.21.9+ object component"
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
              class="grid w-full grid-cols-2 gap-1"
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
                class="h-6 text-[11px] data-[state=on]:bg-accent data-[state=on]:text-foreground"
              >
                atlas
              </ToggleGroupItem>
              <ToggleGroupItem
                value="player"
                class="h-6 text-[11px] data-[state=on]:bg-accent data-[state=on]:text-foreground"
              >
                player
              </ToggleGroupItem>
            </ToggleGroup>

            <template v-if="store.fontProject.objectComponent.mode === 'atlas'">
              <div class="space-y-1">
                <Label for="obj-atlas-input" class="text-[10px] text-muted-foreground">
                  Atlas (1.21.11+: items / blocks)
                </Label>
                <Input
                  id="obj-atlas-input"
                  type="text"
                  :model-value="store.fontProject.objectComponent.atlas"
                  class="h-7 bg-[#14141a] px-2 font-mono text-xs"
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
                <Label for="obj-sprite-input" class="text-[10px] text-muted-foreground">
                  Sprite
                </Label>
                <Input
                  id="obj-sprite-input"
                  type="text"
                  :model-value="store.fontProject.objectComponent.sprite"
                  class="h-7 bg-[#14141a] px-2 font-mono text-xs"
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
                <Label for="obj-player-input" class="text-[10px] text-muted-foreground">
                  Player Name (8×8 Head)
                </Label>
                <Input
                  id="obj-player-input"
                  type="text"
                  :model-value="store.fontProject.objectComponent.playerName"
                  class="h-7 bg-[#14141a] px-2 font-mono text-xs"
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
                <Label for="obj-hat-checkbox" class="cursor-pointer text-[11px] text-secondary-foreground">
                  Render hat overlay layer
                </Label>
              </div>
            </template>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>

    <!-- Pinned Export Footer -->
    <div class="shrink-0 space-y-2 border-t border-border bg-[#0b0b0e] p-3">
      <div class="grid grid-cols-1 gap-1.5">
        <Button
          type="button"
          :disabled="store.validation.errors > 0 || store.isExporting"
          class="h-8 w-full gap-1.5 text-xs font-semibold"
          @click="store.exportAndDownload()"
        >
          <Download aria-hidden="true" class="h-3.5 w-3.5" />
          <span>
            {{
              store.isExporting
                ? 'Building & Validating ZIP...'
                : store.validation.errors > 0
                  ? `Fix ${store.validation.errors} Errors to Export`
                  : 'Download Java / Nexo External (.zip)'
            }}
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          :disabled="store.validation.errors > 0 || store.isExportingPluginBundle"
          class="h-8 w-full gap-1.5 text-xs font-medium"
          @click="store.exportPluginBundleAndDownload()"
        >
          <Package aria-hidden="true" class="h-3.5 w-3.5" />
          <span>
            {{
              store.isExportingPluginBundle
                ? 'Packaging Plugin Bundle...'
                : 'Download IA / Oraxen / Nexo Bundle (.zip)'
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
          class="space-y-1 border border-emerald-700/70 bg-emerald-950/25 px-2.5 py-2 text-[11px]"
        >
          <p class="font-mono text-[10px] font-semibold text-emerald-200 tabular-nums">
            Phase 1 Self-Check ({{ store.lastBuiltPack.zipValidation.targetVersion }}):
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
        Java Edition export only · Bedrock PUA range <code>U+E000–U+E1FF</code> monitored automatically.
      </p>
    </div>
  </div>
</template>
