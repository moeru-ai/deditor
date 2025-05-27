<script setup lang="ts">
import type { MenuItemConfig } from '../basic/builder/types'

import ContextMenuBuilder from '../basic/builder/ContextMenuBuilder.vue'

const props = defineProps<{ config: MenuItemConfig[] }>()
</script>

<template>
  <ContextMenuBuilder :menu-config="props.config" :side-offset="5">
    <slot />
  </ContextMenuBuilder>
</template>

<style>
.example-area {
  padding: 50px;
  display: flex;
  justify-content: center;
}

.context-button {
  padding: 12px 24px;
  background: #334155;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
