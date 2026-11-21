<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { cn } from "cn"
import {
  DialogClose,
  DialogContent,
  useForwardPropsEmits,
} from "reka-ui"

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<DialogContentProps & { class?: HTMLAttributes["class"] }>()
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogContent
    data-slot="dialog-content"
    v-bind="{ ...$attrs, ...forwarded }"
    :class="
      cn(
        'bg-[#1e1f29] text-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100vh-4rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-lg border border-[#3c3f54] p-5 shadow-2xl duration-150 sm:max-w-lg',
        props.class,
      )
    "
  >
    <slot />

    <DialogClose
      class="text-muted-foreground hover:text-foreground absolute top-4 right-4 rounded-xs p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none"
      aria-label="Tutup dialog"
    >
      <svg viewBox="0 0 24 24" fill="none" class="size-4 stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </DialogClose>
  </DialogContent>
</template>
