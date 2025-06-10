<script setup lang="ts">
import { ContextMenuContent } from 'reka-ui'
</script>

<template>
  <ContextMenuContent class="will-change-[opacity,transform] z-30 min-w-[220px] rounded-lg bg-neutral-900 p-[2px] shadow-md outline-none data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade">
    <slot />
  </ContextMenuContent>
</template>
