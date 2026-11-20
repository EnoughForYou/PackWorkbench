<script setup lang="ts">
import { computed } from 'vue';
import type { TargetVersionId, VersionProfile } from '@core/types.ts';
import { VERSION_PROFILES } from '@core/versions.ts';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  readonly selectedVersion: TargetVersionId;
  readonly autoDetectedTarget: TargetVersionId | null;
  readonly compatibleVersions: readonly TargetVersionId[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  change: [version: TargetVersionId];
}>();

function getFormatBadge(profile?: VersionProfile | null): string {
  if (!profile) return '';
  if (profile.style === 'legacy') {
    return `pack_format: ${profile.format[0]}`;
  }
  return `min_format: ${profile.format[0]}, max_format: ${profile.format[0]}`;
}

const currentProfile = computed<VersionProfile | undefined>(
  () =>
    VERSION_PROFILES.find((p) => p.id === props.selectedVersion) ??
    VERSION_PROFILES[0],
);

const compatibleProfiles = computed(() =>
  VERSION_PROFILES.filter((p) => props.compatibleVersions.includes(p.id)),
);

function handleChange(val: unknown): void {
  if (typeof val === 'string') {
    emit('change', val as TargetVersionId);
  }
}
</script>

<template>
  <section aria-labelledby="target-version-heading" class="space-y-2.5">
    <!-- Header row -->
    <div class="flex items-center justify-between gap-2">
      <h2
        id="target-version-heading"
        class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        2. Target Versi Java
      </h2>
      <Badge
        v-if="autoDetectedTarget"
        variant="secondary"
        class="h-5 border border-primary/30 bg-primary/10 px-2 font-mono text-[10px] font-semibold text-primary"
      >
        Terdeteksi: {{ autoDetectedTarget }}
      </Badge>
    </div>

    <!-- Version selector dropdown -->
    <div class="space-y-2">
      <Label for="validator-version-select" class="sr-only">
        Pilih target versi Minecraft Java Edition
      </Label>
      <Select :model-value="selectedVersion" @update:model-value="handleChange">
        <SelectTrigger
          id="validator-version-select"
          class="h-10 min-h-[40px] w-full border-border bg-card font-mono text-xs hover:border-border/80 focus:ring-primary/60"
        >
          <SelectValue :placeholder="selectedVersion" />
        </SelectTrigger>
        <SelectContent class="border-border bg-popover">
          <SelectItem
            v-for="profile in VERSION_PROFILES"
            :key="profile.id"
            :value="profile.id"
            class="cursor-pointer py-2 font-mono text-xs"
          >
            <div class="flex w-full items-center justify-between gap-3">
              <span class="font-semibold text-foreground">{{ profile.id }}</span>
              <span
                class="rounded border border-border/50 bg-muted/80 px-1.5 py-0.5 text-[10px] text-muted-foreground tabular-nums"
              >
                {{ getFormatBadge(profile) }}
              </span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Active specification readout strip -->
      <div
        class="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/60 px-3 py-2 font-mono text-[11px]"
      >
        <span class="text-muted-foreground">Spesifikasi Format:</span>
        <code class="font-semibold text-primary tabular-nums">
          {{ getFormatBadge(currentProfile) }}
        </code>
      </div>
    </div>

    <!-- Compatibility pills matrix -->
    <div
      v-if="compatibleProfiles.length > 0"
      class="space-y-1.5 pt-0.5"
    >
      <div class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Kompatibel dengan Arsip:
      </div>
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          v-for="profile in compatibleProfiles"
          :key="profile.id"
          type="button"
          :class="[
            'touch-target-expand min-h-[32px] cursor-pointer rounded-md border px-2.5 py-1 font-mono text-[11px] transition-transform duration-100 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-primary',
            selectedVersion === profile.id
              ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'border-border/60 bg-muted/70 text-foreground hover:bg-elevated hover:border-border',
          ]"
          @click="emit('change', profile.id)"
        >
          {{ profile.id }}
        </button>
      </div>
    </div>
  </section>
</template>
