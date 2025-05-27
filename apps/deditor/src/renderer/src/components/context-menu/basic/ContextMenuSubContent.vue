<script setup lang="ts">
import { ContextMenuSubContent } from 'reka-ui'
</script>

<template>
  <ContextMenuSubContent class="will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade z-30 min-w-[220px] rounded-md bg-neutral-900 p-[5px] shadow-md outline-none">
    <slot />
  </ContextMenuSubContent>
</template>
