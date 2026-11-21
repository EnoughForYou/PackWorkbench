<script setup lang="ts">
import type { SelectLabelProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { cn } from "cn"
import { SelectLabel } from "reka-ui"

const props = defineProps<SelectLabelProps & { class?: HTMLAttributes["class"] }>()
</script>

<template>
  <SelectLabel
    data-slot="select-label"
    :class="cn('px-2.5 pt-2 pb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60', props.class)"
  >
    <slot />
  </SelectLabel>
</template>
