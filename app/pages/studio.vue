<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faFileZipper, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { VERSION_PROFILES } from '@core/versions.ts';
import type { TargetVersionId } from '@core/types.ts';
import { useWorkbenchStore, type StudioMode } from '@/stores/workbenchStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

definePageMeta({
  layout: 'studio',
});

useHead({
  title: 'Studio — Pack Workbench',
});

const store = useWorkbenchStore();
const route = useRoute();

watch(
  () => route.query.mode,
  (mode) => {
    if (mode === 'validator') {
      store.studioMode = 'validator';
    } else if (mode === 'font') {
      store.studioMode = 'font';
    }
  },
  { immediate: true },
);

function setMode(val: unknown): void {
  if (val !== 'font' && val !== 'validator') return;
  const mode = val as StudioMode;
  store.studioMode = mode;
  void navigateTo({ query: { ...route.query, mode } }, { replace: true });
}

function handleFontVersionChange(val: unknown): void {
  if (typeof val === 'string') {
    store.updateProject((prev) => ({
      ...prev,
      targetVersion: val as TargetVersionId,
    }));
  }
}

function handleValidatorVersionChange(val: unknown): void {
  if (typeof val === 'string') {
    store.handleVersionChange(val as TargetVersionId);
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

function handleStudioKeyDown(event: KeyboardEvent): void {
  if (store.studioMode !== 'font' || isEditableTarget(event.target)) return;
  const key = event.key.toLowerCase();

  if ((event.ctrlKey || event.metaKey) && (key === 'y' || (key === 'z' && event.shiftKey))) {
    event.preventDefault();
    store.redoPaint();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && key === 'z') {
    event.preventDefault();
    store.undoPaint();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && (key === '0' || key === '1')) {
    event.preventDefault();
    store.zoom = key === '0' ? 12 : 2;
    return;
  }
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  if (key === 'v') {
    store.activeTool = 'select';
  } else if (key === 'b') {
    store.activeTool = 'pencil';
  } else if (key === 'e') {
    store.activeTool = 'eraser';
  } else if (key === 'i') {
    store.activeTool = 'eyedropper';
  } else if (key === 'g') {
    store.showGrid = !store.showGrid;
  } else if (key === '=' || key === '+') {
    store.zoom = Math.min(24, store.zoom + 2);
  } else if (key === '-') {
    store.zoom = Math.max(2, store.zoom - 2);
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleStudioKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleStudioKeyDown);
});
</script>

<template>
  <div class="flex h-screen min-w-[1280px] flex-col overflow-hidden bg-background text-foreground">
    <!-- Pure Desktop IDE Top Toolbar -->
    <header class="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3 py-1">
      <!-- Left: Brand + quiet Home/About links + Mode ToggleGroup -->
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/"
          class="flex shrink-0 items-center gap-2 rounded py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span
            aria-hidden="true"
            class="flex h-6 w-6 items-center justify-center rounded border border-primary/40 bg-muted"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" class="h-3.5 w-3.5 text-primary">
              <path d="M2 2h4v4H2V2Zm8 0h4v4h-4V2ZM6 6h4v4H6V6Zm-4 4h4v4H2v-4Zm8 0h4v4h-4v-4Z" />
            </svg>
          </span>
          <span class="text-sm font-semibold tracking-tight text-foreground">
            Pack Workbench
          </span>
        </NuxtLink>

        <nav aria-label="Main navigation" class="flex items-center gap-2 text-xs">
          <NuxtLink
            to="/"
            class="px-1.5 py-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            Home
          </NuxtLink>
          <NuxtLink
            to="/studio"
            aria-current="page"
            class="px-1.5 py-1 font-medium text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            Studio
          </NuxtLink>
          <NuxtLink
            to="/about"
            class="px-1.5 py-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            About
          </NuxtLink>
        </nav>

        <Separator orientation="vertical" class="h-5" />

        <ToggleGroup
          type="single"
          :model-value="store.studioMode"
          aria-label="Select Studio workspace"
          class="gap-0.5 rounded-md border border-border bg-muted p-0.5"
          @update:model-value="setMode"
        >
          <ToggleGroupItem
            value="font"
            class="h-7 rounded-sm px-2.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:font-semibold data-[state=on]:text-primary-foreground"
          >
            Rank &amp; Glyph
          </ToggleGroupItem>
          <ToggleGroupItem
            value="validator"
            class="h-7 rounded-sm px-2.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:font-semibold data-[state=on]:text-primary-foreground"
          >
            ZIP &amp; SHA-1 Validator
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <!-- Right: Active Project Metadata + Export Action -->
      <div class="flex items-center gap-2">
        <template v-if="store.studioMode === 'font'">
          <div class="flex items-center gap-1.5">
            <Label for="studio-ns-input" class="font-mono text-[11px] text-muted-foreground">
              ns:
            </Label>
            <Input
              id="studio-ns-input"
              type="text"
              :model-value="store.fontProject.namespace"
              class="h-7 w-24 bg-muted px-2 font-mono text-xs"
              @update:model-value="
                store.updateProject((prev) => ({
                  ...prev,
                  namespace: String($event ?? ''),
                }))
              "
            />
          </div>

          <Label for="studio-target-select" class="sr-only">
            Target Minecraft Java version
          </Label>
          <Select
            :model-value="store.fontProject.targetVersion"
            @update:model-value="handleFontVersionChange"
          >
            <SelectTrigger
              id="studio-target-select"
              class="h-7 w-36 bg-muted font-mono text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="v in VERSION_PROFILES"
                :key="v.id"
                :value="v.id"
              >
                {{
                  v.style === 'legacy'
                    ? `${v.id} (${v.format[0]})`
                    : `${v.id} (${v.format[0]}.${v.format[1]})`
                }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Tooltip>
            <TooltipTrigger as-child>
              <Badge
                variant="outline"
                class="h-7 cursor-default gap-1 border-border bg-muted font-mono text-[10px] text-muted-foreground"
              >
                <FontAwesomeIcon :icon="faShieldHalved" class="h-3 w-3 text-emerald-400" />
                <span>Local</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              All ZIP, PNG, and SHA-1 processing runs 100% locally in your browser with zero uploads.
            </TooltipContent>
          </Tooltip>

          <Button
            type="button"
            variant="pill"
            size="pill"
            :disabled="store.validation.errors > 0 || store.isExporting"
            class="gap-1.5"
            @click="store.exportAndDownload()"
          >
            <FontAwesomeIcon :icon="faFileZipper" class="h-3.5 w-3.5" />
            <span>
              {{
                store.isExporting
                  ? 'Building...'
                  : store.validation.errors > 0
                    ? `${store.validation.errors} Errors`
                    : 'Export Pack'
              }}
            </span>
          </Button>
        </template>

        <template v-else>
          <Label for="validator-top-version-select" class="sr-only">
            Validator target version
          </Label>
          <Select
            :model-value="store.selectedVersion"
            @update:model-value="handleValidatorVersionChange"
          >
            <SelectTrigger
              id="validator-top-version-select"
              class="h-7 w-36 bg-muted font-mono text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="v in VERSION_PROFILES"
                :key="v.id"
                :value="v.id"
              >
                {{
                  v.style === 'legacy'
                    ? `${v.id} (${v.format[0]})`
                    : `${v.id} (${v.format[0]}.${v.format[1]})`
                }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Badge
            variant="outline"
            class="h-7 border-border bg-muted font-mono text-[10px] text-muted-foreground"
          >
            Local · SHA-1 Worker
          </Badge>
        </template>
      </div>
    </header>

    <LazyStudioWorkspace v-if="store.studioMode === 'font'" />
    <LazyValidatorWorkspace v-else />
  </div>
</template>
