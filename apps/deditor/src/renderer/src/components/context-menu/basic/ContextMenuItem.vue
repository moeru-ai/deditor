<script setup lang="ts">
import {
  ContextMenuItem,
} from 'reka-ui'
</script>

<template>
  <ContextMenuItem
    class="text-grass11 data-[disabled]:text-mauve8 relative h-[25px] flex select-none items-center rounded-md px-[5px] pl-[25px] text-xs leading-none outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-primary-900/50 data-[highlighted]:text-primary-300"
    transition="colors duration-150 ease-in-out"
    cursor-pointer
  >
    <slot />
  </ContextMenuItem>
</template>
