<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

defineProps<{
  icon: IconDefinition;
  class?: string;
}>();
</script>

<template>
  <FontAwesomeIcon :icon="icon" :class="class" aria-hidden="true" />
</template>
