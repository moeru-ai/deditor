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
