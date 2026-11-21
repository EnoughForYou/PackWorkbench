<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "cn"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    data-slot="card-header"
    :class="cn('flex flex-col gap-1.5 p-4 sm:p-5', props.class)"
  >
    <slot />
  </div>
</template>
