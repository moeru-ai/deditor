<script setup lang="ts">
import type { MenuItemConfig } from './types'

import {
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuTrigger,
} from 'reka-ui'
import { provide, ref, watch } from 'vue'

import ContextMenuContent from '../ContextMenuContent.vue'
import { contextMenuStates } from './constants'
import ContextMenuRenderer from './ContextMenuRenderer.vue'

const props = defineProps<{
  menuConfig: MenuItemConfig[]
  sideOffset?: number
  portalTo?: string
}>()

// Create a reactive object to track menu states
const menuState = ref<Record<string, any>>({})

// Initialize the menu state from the config
function initializeMenuState(config: MenuItemConfig[]) {
  for (const item of config) {
    if ((item.type === 'checkbox' || item.type === 'radio') && item.value) {
      menuState.value[item.value] = item.modelValue
    }

    if (item.type === 'sub' && item.children) {
      initializeMenuState(item.children)
    }
  }
}

// Watch for changes in the menu config
watch(() => props.menuConfig, (newConfig) => {
  initializeMenuState(newConfig)
}, { immediate: true, deep: true })

// Provide the menuState to child components
provide(contextMenuStates, {
  state: menuState,
  updateState: (key: string, value: any) => {
    menuState.value[key] = value

    // Find the item in the config and call its onUpdate if it exists
    function findAndUpdate(items: MenuItemConfig[]) {
      for (const item of items) {
        if (item.value === key) {
          if (item.type === 'checkbox' && item.onUpdate) {
            item.onUpdate(value)
          }
          if (item.type === 'radio' && item.onUpdate) {
            item.onUpdate(value)
          }
          return true
        }

        if (item.type === 'sub' && item.children) {
          if (findAndUpdate(item.children)) {
            return true
          }
        }
      }

      return false
    }

    findAndUpdate(props.menuConfig)
  },
})
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuPortal :to="portalTo || '#app'">
      <ContextMenuContent :side-offset="sideOffset || 5">
        <template v-for="(item, _index) in menuConfig" :key="_index">
          <ContextMenuRenderer :item="item" />
        </template>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
