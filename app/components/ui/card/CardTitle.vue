<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "cn"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <h3
    data-slot="card-title"
    :class="cn('text-base font-semibold leading-none tracking-tight text-foreground', props.class)"
  >
    <slot />
  </h3>
</template>
