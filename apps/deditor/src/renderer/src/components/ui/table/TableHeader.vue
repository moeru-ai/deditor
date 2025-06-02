<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { cn } from '../../../libs/shadcn/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <thead :class="cn('sticky top-0 z-10 backdrop-blur-md bg-neutral-800/80 [&_th]:border-b [&_th]:border-white/10', props.class)">
    <slot />
  </thead>
</template>
