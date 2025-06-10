<script setup lang="ts">
import { ContextMenuSubContent } from 'reka-ui'
</script>

<template>
  <ContextMenuSubContent class="will-change-[opacity,transform] z-30 min-w-[220px] rounded-lg bg-neutral-900 p-[3px] shadow-md outline-none ml-2px! data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade py-[2px]! py-3px!">
    <slot />
  </ContextMenuSubContent>
</template>
