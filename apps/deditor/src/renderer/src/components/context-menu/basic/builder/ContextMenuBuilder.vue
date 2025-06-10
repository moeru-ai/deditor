<script setup lang="ts">
/**
 * @example
 *
 * const menuConfig = computed<MenuItemConfig[]>(() => ([
 *   {
 *     type: 'item',
 *     value: 'new-tab',
 *     label: 'New Tab',
 *     shortcut: '⌘+T',
 *     onClick: () => console.log('New Tab clicked'),
 *   },
 *   {
 *     type: 'sub',
 *     value: 'more-tools',
 *     label: 'More Tools',
 *     children: [
 *       {
 *         type: 'item',
 *         label: 'Save Page As…',
 *         shortcut: '⌘+S',
 *         onClick: () => console.log('Save Page clicked'),
 *       },
 *       {
 *         type: 'item',
 *         label: 'Create Shortcut…',
 *         onClick: () => console.log('Create Shortcut clicked'),
 *       },
 *       {
 *         type: 'item',
 *         label: 'Name Window…',
 *         onClick: () => console.log('Name Window clicked'),
 *       },
 *       { type: 'separator' },
 *       {
 *         type: 'item',
 *         label: 'Developer Tools',
 *         onClick: () => console.log('Developer Tools clicked'),
 *       },
 *     ],
 *   },
 *   {
 *     type: 'item',
 *     value: 'new-window',
 *     label: 'New Window',
 *     shortcut: '⌘+N',
 *     onClick: () => console.log('New Window clicked'),
 *   },
 *   {
 *     type: 'item',
 *     value: 'new-private-window',
 *     label: 'New Private Window',
 *     shortcut: '⇧+⌘+N',
 *     onClick: () => console.log('New Private Window clicked'),
 *   },
 *   { type: 'separator' },
 *   {
 *     type: 'checkbox',
 *     value: 'show-bookmarks',
 *     label: 'Show Bookmarks',
 *     shortcut: '⌘+B',
 *     modelValue: showBookmarks.value,
 *     onUpdate: (val) => {
 *       showBookmarks.value = val
 *       console.log('Show Bookmarks:', val)
 *     },
 *   },
 *   {
 *     type: 'checkbox',
 *     value: 'show-full-urls',
 *     label: 'Show Full URLs',
 *     modelValue: showFullUrls.value,
 *     onUpdate: (val) => {
 *       showFullUrls.value = val
 *       console.log('Show Full URLs:', val)
 *     },
 *   },
 *   { type: 'separator' },
 *   {
 *     type: 'label',
 *     label: 'People',
 *   },
 *   {
 *     type: 'radio',
 *     value: 'selected-person',
 *     modelValue: selectedPerson.value,
 *     options: [
 *       { value: 'pedro', label: 'Pedro Duarte' },
 *       { value: 'colm', label: 'Colm Tuite' },
 *     ],
 *    onUpdate: (val) => {
 *        selectedPerson.value = val
 *        console.log('Selected Person:', val)
 *      },
 *    },
 *    { type: 'separator' },
 *    {
 *      type: 'sub',
 *      label: 'First Level Submenu',
 *      children: [
 *        {
 *          type: 'item',
 *          label: 'Submenu Item 1',
 *          onClick: () => console.log('Submenu Item 1 clicked'),
 *        },
 *        {
 *          type: 'sub',
 *          label: 'Second Level Submenu',
 *          children: [
 *            {
 *              type: 'item',
 *              label: 'Nested Item 1',
 *              onClick: () => console.log('Nested Item 1 clicked'),
 *            },
 *            {
 *              type: 'sub',
 *              label: 'Third Level Submenu',
 *              children: [
 *                {
 *                  type: 'item',
 *                  label: 'Deeply Nested Item',
 *                  onClick: () => console.log('Deeply Nested Item clicked'),
 *                },
 *              ],
 *            },
 *          ],
 *        },
 *      ],
 *    },
 *  ]))
 */

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
  data?: Record<string, any>
}>()

const emits = defineEmits<{
  (e: 'click', event: MouseEvent): void
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
    <ContextMenuTrigger as-child @click="emits('click', $event)">
      <slot />
    </ContextMenuTrigger>
    <ContextMenuPortal :to="portalTo || '#app'">
      <ContextMenuContent :side-offset="sideOffset || 5" side="bottom">
        <template v-for="(item, _index) in menuConfig" :key="_index">
          <ContextMenuRenderer :item="item" :data="data" />
        </template>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
