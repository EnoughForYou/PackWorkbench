<script setup lang="ts">
import type { TargetVersionId } from '@core/types.ts';
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

function isCompatible(id: TargetVersionId): boolean {
  return props.compatibleVersions.includes(id);
}

function handleChange(val: unknown): void {
  if (typeof val === 'string') {
    emit('change', val as TargetVersionId);
  }
}
</script>

<template>
  <section aria-labelledby="target-version-heading" class="space-y-2">
    <div class="flex items-center justify-between gap-2">
      <h2
        id="target-version-heading"
        class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        2. Target Java Version
      </h2>
      <Badge
        v-if="autoDetectedTarget"
        variant="secondary"
        class="h-4 px-1.5 font-mono text-[10px] text-[#ff8f6b]"
      >
        Detected: {{ autoDetectedTarget }}
      </Badge>
    </div>

    <div class="space-y-1.5">
      <Label for="validator-version-select" class="sr-only">
        Minecraft Java Edition target version
      </Label>
      <Select :model-value="selectedVersion" @update:model-value="handleChange">
        <SelectTrigger
          id="validator-version-select"
          class="h-8 w-full bg-[#14141a] font-mono text-xs"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="profile in VERSION_PROFILES"
            :key="profile.id"
            :value="profile.id"
          >
            {{ profile.id }} —
            {{
              profile.style === 'legacy'
                ? `pack_format ${profile.format[0]}`
                : `format ${profile.format[0]}.${profile.format[1]}`
            }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Compact compatibility matrix pills -->
    <div
      v-if="compatibleVersions.length > 0"
      class="flex flex-wrap items-center gap-1 pt-0.5"
    >
      <span class="font-mono text-[10px] text-muted-foreground">Compatible:</span>
      <button
        v-for="profile in VERSION_PROFILES.filter((p) => isCompatible(p.id))"
        :key="profile.id"
        type="button"
        :class="[
          'cursor-pointer px-1.5 py-0.5 font-mono text-[10px] transition-colors',
          selectedVersion === profile.id
            ? 'bg-primary text-primary-foreground font-semibold'
            : 'bg-[#17171e] text-foreground hover:bg-accent',
        ]"
        @click="emit('change', profile.id)"
      >
        {{ profile.id }}
      </button>
    </div>
  </section>
</template>
