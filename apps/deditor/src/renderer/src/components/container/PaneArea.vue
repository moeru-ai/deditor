<script setup lang="ts">
defineProps<{
  enterDelay?: number
  noPadding?: boolean
  noScroll?: boolean
}>()
</script>

<template>
  <div
    v-motion
    :initial="{ opacity: 0, y: 16 }"
    :enter="{ opacity: 1, y: 0, transition: { delay: enterDelay } }"
    bg="neutral-800/90"
    :class="{
      'px-4 py-3': !noPadding,
      'overflow-hidden': noScroll,
      'overflow-auto': !noScroll,
    }"
    h-full w-full rounded-2xl backdrop-blur-lg
    transition="all duration-300 ease-in-out"
  >
    <slot />
  </div>
</template>
