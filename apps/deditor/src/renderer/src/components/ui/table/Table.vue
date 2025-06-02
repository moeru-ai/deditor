<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { cn } from '../../../libs/shadcn/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div class="relative w-full">
    <table :class="cn('w-full caption-bottom text-sm border-separate border-spacing-0', props.class)">
      <slot />
    </table>
  </div>
</template>
