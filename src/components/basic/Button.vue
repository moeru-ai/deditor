<script setup lang="ts">
</script>

<template>
  <button
    bg="neutral-700/50 hover:neutral-700/80"
    border="2 solid neutral-700/20 hover:neutral-700/50"
    transition="all duration-300 ease-in-out"
    flex cursor-pointer items-center gap-2
    rounded-lg px-2 py-1
  >
    <slot />
  </button>
</template>
