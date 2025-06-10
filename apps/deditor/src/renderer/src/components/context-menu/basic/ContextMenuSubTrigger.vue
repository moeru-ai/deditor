<script lang="ts" setup>
import { ContextMenuSubTrigger } from 'reka-ui'
</script>

<template>
  <ContextMenuSubTrigger
    class="text-grass11 data-[disabled]:text-mauve8 group data-[state=open]:text-grass11 relative h-[25px] w-full flex select-none items-center rounded-md px-[2px] pl-[25px] text-xs leading-none outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-primary-900/50 data-[state=open]:bg-primary-700/80 data-[highlighted]:text-primary-300 data-[highlighted]:data-[state=open]:bg-primary-900/50 data-[highlighted]:data-[state=open]:text-primary-300"
    transition="colors duration-200 ease-in-out"
    cursor-pointer
  >
    <slot />
  </ContextMenuSubTrigger>
</template>
