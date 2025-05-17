<script setup lang="ts">
</script>

<template>
  <button
    bg="neutral-900/80 hover:neutral-900"
    border="2 solid neutral-700/20 hover:primary-700/50"
    rounded-lg px-3 py-2 text-sm outline-none
    transition="colors duration-300 ease-in-out"
  >
    <slot />
  </button>
</template>
