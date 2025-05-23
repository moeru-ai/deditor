<script setup lang="ts">
defineProps<{
  enterDelay?: number
}>()
</script>

<template>
  <div
    v-motion
    :initial="{ opacity: 0, y: 16 }"
    :enter="{ opacity: 1, y: 0, transition: { delay: enterDelay } }"
    bg="neutral-800/90" h-full w-full rounded-2xl
    px-4 py-3
    backdrop-blur-sm
    transition="all duration-300 ease-in-out"
  >
    <slot />
  </div>
</template>
