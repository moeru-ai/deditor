<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { cn } from '../../../libs/shadcn/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <tbody :class="cn('[&_td]:border-b [&_td]:border-white/10 [&_tr:last-child_td]:border-0', props.class)">
    <slot />
  </tbody>
</template>
