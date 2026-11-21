<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "cn"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    data-slot="card"
    :class="
      cn(
        'bg-card text-card-foreground border-border rounded-lg border shadow-xs transition-colors',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
