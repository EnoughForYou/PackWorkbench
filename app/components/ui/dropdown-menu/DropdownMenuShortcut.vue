<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "cn"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <span
    data-slot="dropdown-menu-shortcut"
    :class="cn('font-mono text-[10px] text-muted-foreground/50 bg-[#14151e] border border-[#2e3042] px-1.5 py-0.5 rounded ml-auto tracking-widest', props.class)"
  >
    <slot />
  </span>
</template>
