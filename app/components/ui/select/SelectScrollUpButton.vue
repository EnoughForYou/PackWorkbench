<script setup lang="ts">
import type { SelectScrollUpButtonProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { faChevronUp } from "@fortawesome/free-solid-svg-icons"
import { reactiveOmit } from "@vueuse/core"
import { cn } from "cn"
import { SelectScrollUpButton, useForwardProps } from "reka-ui"

const props = defineProps<SelectScrollUpButtonProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectScrollUpButton
    data-slot="select-scroll-up-button"
    v-bind="forwardedProps"
    :class="cn('flex cursor-default items-center justify-center py-1', props.class)"
  >
    <slot>
      <FontAwesomeIcon :icon="faChevronUp" class="size-3" />
    </slot>
  </SelectScrollUpButton>
</template>
