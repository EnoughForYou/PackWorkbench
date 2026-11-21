<script setup lang="ts">
import type { SelectTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faChevronDown } from "@fortawesome/free-solid-svg-icons"
import { reactiveOmit } from "@vueuse/core"
import { cn } from "cn"
import { SelectIcon, SelectTrigger, useForwardProps } from "reka-ui"

const props = withDefaults(
  defineProps<SelectTriggerProps & { class?: HTMLAttributes["class"], size?: "sm" | "default" }>(),
  { size: "default" },
)

const delegatedProps = reactiveOmit(props, "class", "size")
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectTrigger
    data-slot="select-trigger"
    :data-size="size"
    v-bind="forwardedProps"
    :class="cn(
      'group flex w-fit items-center justify-between gap-2 rounded-md border border-[#323547] bg-[#171821] hover:bg-[#1d1f2b] hover:border-[#4d516b] text-foreground text-xs font-medium px-3 py-2 whitespace-nowrap shadow-inner outline-none transition-[color,box-shadow,border-color,background-color] focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 data-[placeholder]:text-muted-foreground *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0',
      props.class,
    )"
  >
    <slot />
    <SelectIcon as-child>
      <FontAwesomeIcon :icon="faChevronDown" class="size-3 text-muted-foreground/70 transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </SelectIcon>
  </SelectTrigger>
</template>
